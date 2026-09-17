import { prisma } from "@/lib/prisma";
import { syncMatchOfTheDay } from "@/lib/matchOfTheDay";
import { promoteTopPlayersAtSeasonEnd } from "@/lib/seasonPromotion";
import { checkAndSendOneHourMatchReminders } from "@/lib/autoMatchReminders";

/**
 * Checks if the current matchday deadline has expired (12:00 AM midnight passed)
 * and automatically rolls over to the next matchday without requiring Admin intervention.
 * Also closes/locks previous match submission options automatically.
 */
export async function checkAndAutoAdvanceDailyCycle(): Promise<{
  advanced: boolean;
  currentMatchday: number;
  message?: string;
}> {
  try {
    const config = await prisma.leagueConfig.findUnique({
      where: { id: "default" },
    });

    const currentMatchday = config?.currentMatchday || 1;
    const currentRoundName = `Matchday ${currentMatchday}`;

    // Look for any match in the current matchday to check the deadline
    const sampleMatch = await prisma.match.findFirst({
      where: { round: currentRoundName },
      select: { deadlineDate: true },
    });

    // If no match found or deadline is still in the future, do nothing
    if (!sampleMatch || !sampleMatch.deadlineDate) {
      return { advanced: false, currentMatchday };
    }

    const now = new Date();
    if (now < new Date(sampleMatch.deadlineDate)) {
      // Deadline has not expired yet: Automatically check & send 1-hour reminders to unplayed athletes
      await checkAndSendOneHourMatchReminders();
      return { advanced: false, currentMatchday };
    }

    // DEADLINE EXPIRED (Past 12:00 AM): Execute automatic transition
    const nextMatchday = currentMatchday + 1;
    const nextRoundName = `Matchday ${nextMatchday}`;

    // 1. Process unplayed matches from the expired matchday
    const expiredMatches = await prisma.match.findMany({
      where: {
        round: currentRoundName,
        status: "SCHEDULED",
      },
      include: { homePlayer: true, awayPlayer: true },
    });

    for (const match of expiredMatches) {
      await prisma.match.update({
        where: { id: match.id },
        data: {
          status: "FORFEIT",
          notes: "Expired unplayed: 24-hour midnight window elapsed without submitted score.",
        },
      });

      // Increment consecutiveMissed count for both players
      for (const player of [match.homePlayer, match.awayPlayer]) {
        const newMissed = (player.consecutiveMissed || 0) + 1;
        const isDisqualified = newMissed >= 3;

        await prisma.player.update({
          where: { id: player.id },
          data: {
            consecutiveMissed: newMissed,
            isDisqualified,
            status: isDisqualified ? "DISQUALIFIED" : newMissed >= 2 ? "WARNING" : "ACTIVE",
            disqualificationReason: isDisqualified
              ? "Missed 3 consecutive league fixtures within 24-hour matchday deadlines."
              : null,
          },
        });

        await prisma.standing.updateMany({
          where: { playerId: player.id },
          data: {
            consecutiveMissed: newMissed,
            isDisqualified,
          },
        });

        if (isDisqualified) {
          await prisma.announcement.create({
            data: {
              title: `🚨 DISQUALIFICATION: ${player.gamerTag} Removed from League`,
              content: `Player ${player.gamerTag} (${player.fullName}, ${player.division}) missed 3 consecutive fixtures without submitted proof. Disqualified per official EFRL rules.`,
              type: "BROADCAST",
              isPinned: true,
            },
          });
        }
      }
    }

    // 2. Check if next round exists
    const upcomingNextRoundMatches = await prisma.match.count({
      where: { round: nextRoundName },
    });

    if (upcomingNextRoundMatches > 0) {
      // Activate next round with new 24-hour countdown
      const deadlineDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      await prisma.match.updateMany({
        where: { round: nextRoundName },
        data: {
          matchDate: now,
          deadlineDate: deadlineDate,
        },
      });

      // Update league config
      await prisma.leagueConfig.upsert({
        where: { id: "default" },
        update: { currentMatchday: nextMatchday },
        create: { id: "default", currentMatchday: nextMatchday },
      });

      // Calculate MOTD for each division
      await syncMatchOfTheDay(nextMatchday);

      // Post broadcast announcement
      await prisma.announcement.create({
        data: {
          title: `⚡ ${nextRoundName} Fixtures are LIVE! (24-Hour Midnight Window)`,
          content: `The system has automatically dropped all ${nextRoundName} fixtures. All previous match submissions are now closed. Contact your opponent on WhatsApp and play before 12:00 AM midnight.`,
          type: "BROADCAST",
          isPinned: true,
        },
      });

      return {
        advanced: true,
        currentMatchday: nextMatchday,
        message: `Autonomously advanced to ${nextRoundName}. Activated ${upcomingNextRoundMatches} matches.`,
      };
    } else {
      // All rounds finished! Season has concluded -> Execute automatic promotion!
      await promoteTopPlayersAtSeasonEnd();

      return {
        advanced: false,
        currentMatchday,
        message: "Season concluded. Final promotions executed.",
      };
    }
  } catch (error: any) {
    console.error("checkAndAutoAdvanceDailyCycle error:", error);
    return { advanced: false, currentMatchday: 1, message: error.message };
  }
}
