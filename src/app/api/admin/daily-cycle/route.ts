import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recalculateStandings } from "@/lib/recalculateStandings";

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
    // Note: Exclude matches that are WAITING_FOR_SUB (on hold for admin replacement)
    // and REPLACEMENT_BACKLOG matches (which have their own 48-hour deadline)
    const now = new Date();
    const expiredMatches = await prisma.match.findMany({
      where: {
        round: previousRoundName,
        status: "SCHEDULED",
        NOT: [
          { notes: { contains: "WAITING_FOR_SUB" } },
          { notes: { contains: "REPLACEMENT_BACKLOG" } },
        ],
      },
      include: { homePlayer: true, awayPlayer: true },
    });

    for (const match of expiredMatches) {
      // Mark match as 0-0 draw with 1 point each
      await prisma.match.update({
        where: { id: match.id },
        data: {
          homeScore: 0,
          awayScore: 0,
          status: "FINISHED",
          notes: "Automatic 0-0 Draw (1 pt each): 24-hour midnight window elapsed without submitted score. Both players assigned 1 missed match.",
        },
      });

      // Recalculate standings so each player receives 1 point for the 0-0 draw
      const divToRecalc = match.stage === "GROUP" && match.groupName
        ? `${match.division} ${match.groupName}`
        : match.division;
      await recalculateStandings(match.tournamentId, divToRecalc);

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
              ? "Missed 3 consecutive league fixtures without submitting results or claiming forfeit."
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
          // Private notification to the suspended player (not broadcasted to all players)
          await prisma.announcement.create({
            data: {
              title: `🚨 ACCOUNT SUSPENDED: 3 Missed Matches`,
              content: `Hello ${player.gamerTag}. You have reached 3 missed matches without submitting results or claiming forfeit. In accordance with league rules, you have been removed from active match fixtures until the League Admin assigns a replacement.`,
              type: "INDIVIDUAL",
              targetPlayerId: player.id,
              isPinned: true,
            },
          });

          // Mark all upcoming scheduled matches for this player as WAITING_FOR_SUB and notify opponents
          const upcomingMatches = await prisma.match.findMany({
            where: {
              OR: [{ homePlayerId: player.id }, { awayPlayerId: player.id }],
              status: "SCHEDULED",
            },
          });

          for (const upm of upcomingMatches) {
            await prisma.match.update({
              where: { id: upm.id },
              data: {
                notes: "WAITING_FOR_SUB: Opponent reached 3 missed matches. Awaiting Admin replacement.",
              },
            });

            const opponentId = upm.homePlayerId === player.id ? upm.awayPlayerId : upm.homePlayerId;
            if (opponentId) {
              await prisma.announcement.create({
                data: {
                  title: `⏳ Match on Hold — Waiting for Sub (${upm.round})`,
                  content: `Your scheduled match against @${player.gamerTag} for ${upm.round} is on hold because your opponent reached 3 missed matches. The League Admin is currently assigning a replacement player. You will receive a 48-hour window once the substitute arrives.`,
                  type: "INDIVIDUAL",
                  targetPlayerId: opponentId,
                  isPinned: true,
                },
              });
            }
          }
        }
      }
    }

    // Process any REPLACEMENT_BACKLOG matches whose 48-hour deadline has expired
    const expiredReplacementMatches = await prisma.match.findMany({
      where: {
        status: "SCHEDULED",
        notes: { contains: "REPLACEMENT_BACKLOG" },
        deadlineDate: { lte: now },
      },
    });

    for (const rm of expiredReplacementMatches) {
      await prisma.match.update({
        where: { id: rm.id },
        data: {
          homeScore: 0,
          awayScore: 0,
          status: "FINISHED",
          notes: "Automatic 0-0 Draw (1 pt each): 48-hour replacement window elapsed without submitted score.",
        },
      });
      await recalculateStandings(rm.tournamentId, rm.division);
    }

    // 2. Activate next matchday fixtures (24 hour countdown starting now)
    const deadlineDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const updatedMatches = await prisma.match.updateMany({
      where: { round: nextRoundName },
      data: {
        matchDate: now,
        deadlineDate: deadlineDate,
      },
    });

    // Check newly activated fixtures: if any match involves a player who has reached 3 missed matches, put it on hold!
    const nextRoundFixtures = await prisma.match.findMany({
      where: { round: nextRoundName },
      include: { homePlayer: true, awayPlayer: true },
    });

    for (const nrf of nextRoundFixtures) {
      const homeSuspended = nrf.homePlayer.consecutiveMissed >= 3 || nrf.homePlayer.isDisqualified;
      const awaySuspended = nrf.awayPlayer.consecutiveMissed >= 3 || nrf.awayPlayer.isDisqualified;

      if (homeSuspended || awaySuspended) {
        const suspendedTag = homeSuspended ? nrf.homePlayer.gamerTag : nrf.awayPlayer.gamerTag;
        const innocentPlayerId = homeSuspended ? nrf.awayPlayerId : nrf.homePlayerId;

        await prisma.match.update({
          where: { id: nrf.id },
          data: {
            notes: "WAITING_FOR_SUB: Opponent reached 3 missed matches. Awaiting Admin replacement.",
          },
        });

        await prisma.announcement.create({
          data: {
            title: `⏳ Match on Hold — Waiting for Sub (${nextRoundName})`,
            content: `Your scheduled match against @${suspendedTag} for ${nextRoundName} is on hold because your opponent reached 3 missed matches. The League Admin will assign a replacement athlete soon. You will receive a 48-hour window once the substitute arrives.`,
            type: "INDIVIDUAL",
            targetPlayerId: innocentPlayerId,
            isPinned: true,
          },
        });
      }
    }

    // 3. Update LeagueConfig with the new matchday
    await prisma.leagueConfig.upsert({
      where: { id: "default" },
      update: { currentMatchday: nextMatchday },
      create: { id: "default", currentMatchday: nextMatchday },
    });

    // 4. Select Match of the Day for EACH division based on table standings
    if (nextMatchday > 1) {
      const { syncMatchOfTheDay } = await import("@/lib/matchOfTheDay");
      await syncMatchOfTheDay(nextMatchday);
    }

    // If no more matches remain in the next round, the season has ended!
    if (updatedMatches.count === 0) {
      const { promoteTopPlayersAtSeasonEnd } = await import("@/lib/seasonPromotion");
      await promoteTopPlayersAtSeasonEnd();
    }

    // 5. Check divisions with odd numbers and notify the remaining athlete who has no match today
    if (updatedMatches.count > 0) {
      const divisions = ["Division 1", "Division 2", "Division 3"];
      for (const div of divisions) {
        const divMatches = await prisma.match.findMany({
          where: { division: div, round: nextRoundName },
          select: { homePlayerId: true, awayPlayerId: true },
        });
        if (divMatches.length > 0) {
          const playingIds = new Set<string>();
          for (const m of divMatches) {
            playingIds.add(m.homePlayerId);
            playingIds.add(m.awayPlayerId);
          }
          const activePlayers = await prisma.player.findMany({
            where: { division: div, status: "ACTIVE", isDisqualified: false },
            select: { id: true, gamerTag: true },
          });
          for (const p of activePlayers) {
            if (!playingIds.has(p.id)) {
              await prisma.announcement.create({
                data: {
                  title: `🗓️ ${nextRoundName}: No Match Scheduled (Official Rest Day)`,
                  content: `Hello ${p.gamerTag}! You do not have a match to play for today's ${nextRoundName}. Because ${div} has an odd number of competitors, you have a scheduled rest day while the other division fixtures take place. Your next match will take place on the following matchday.`,
                  type: "INDIVIDUAL",
                  targetPlayerId: p.id,
                  isPinned: true,
                },
              });
            }
          }
        }
      }

      await prisma.announcement.create({
        data: {
          title: `⚡ ${nextRoundName} Fixtures are LIVE! (24-Hour Midnight Window)`,
          content: `The system has automatically dropped all ${nextRoundName} fixtures. Contact your opponent via WhatsApp immediately. Submissions and proof upload buttons will remain active until 12:00 AM cutoff.`,
          type: "BROADCAST",
          isPinned: true,
        },
      });
    }

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
