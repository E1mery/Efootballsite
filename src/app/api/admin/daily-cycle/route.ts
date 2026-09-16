import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const config = await prisma.leagueConfig.findUnique({
      where: { id: "default" },
    });

    const currentMatchday = config?.currentMatchday || 1;
    const nextMatchday = currentMatchday + 1;

    const previousRoundName = `Matchday ${currentMatchday}`;
    const nextRoundName = `Matchday ${nextMatchday}`;

    // 1. Process unplayed matches from the current/previous matchday that expired
    const expiredMatches = await prisma.match.findMany({
      where: {
        round: previousRoundName,
        status: "SCHEDULED",
      },
      include: { homePlayer: true, awayPlayer: true },
    });

    for (const match of expiredMatches) {
      // Mark match expired
      await prisma.match.update({
        where: { id: match.id },
        data: { status: "FORFEIT", notes: "Expired unplayed: Neither player submitted proof within 24hr window." },
      });

      // Increment consecutiveMissed for both players
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

        // Also update Standing
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
              content: `Player ${player.gamerTag} (${player.fullName}, ${player.division}) has missed 3 consecutive scheduled fixtures without valid forfeit proof. In accordance with official EFRL rules, they have been disqualified from the active roster. Commissioner review required.`,
              type: "BROADCAST",
              isPinned: true,
            },
          });
        }
      }
    }

    // 2. Activate next matchday fixtures (24 hour countdown starting now)
    const now = new Date();
    const deadlineDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const updatedMatches = await prisma.match.updateMany({
      where: { round: nextRoundName },
      data: {
        matchDate: now,
        deadlineDate: deadlineDate,
      },
    });

    // 3. Update LeagueConfig with the new matchday
    await prisma.leagueConfig.upsert({
      where: { id: "default" },
      update: { currentMatchday: nextMatchday },
      create: { id: "default", currentMatchday: nextMatchday },
    });

    // 4. Select Match of the Day based on table standings (Rule: except on first round)
    let motdInfo = "";
    if (nextMatchday > 1) {
      const { syncMatchOfTheDay } = await import("@/lib/matchOfTheDay");
      const motd = await syncMatchOfTheDay(nextMatchday);
      if (motd) {
        motdInfo = ` 🌟 MATCH OF THE DAY: ${motd.homePlayer?.gamerTag} vs ${motd.awayPlayer?.gamerTag} (${motd.motdHeadline})!`;
      }
    }

    // 5. Create Announcement
    await prisma.announcement.create({
      data: {
        title: `⚡ ${nextRoundName} Fixtures are LIVE! (24-Hour Midnight Window)`,
        content: `The system has automatically dropped all ${nextRoundName} fixtures.${motdInfo} Contact your opponent via WhatsApp immediately. Submissions and proof upload buttons will remain active until 12:00 AM cutoff.`,
        type: "BROADCAST",
        isPinned: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully advanced to ${nextRoundName}. Activated ${updatedMatches.count} fixtures. Processed ${expiredMatches.length} expired unplayed matches.`,
      currentMatchday: nextMatchday,
    });
  } catch (err: any) {
    console.error("Daily cycle error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
