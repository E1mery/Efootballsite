import { prisma } from "@/lib/prisma";
import { syncMatchOfTheDay } from "@/lib/matchOfTheDay";
import { promoteTopPlayersAtSeasonEnd } from "@/lib/seasonPromotion";
import { checkAndSendOneHourMatchReminders } from "@/lib/autoMatchReminders";
import { cleanupExpiredRepliedMessages } from "@/lib/messageCleanup";
import { cleanupExpiredAnnouncements } from "@/lib/announcementCleanup";
import { recalculateStandings } from "@/lib/recalculateStandings";
import { notifyStandingsUpdate } from "@/lib/notifyStandingsUpdate";
import { computeConsecutiveMissedForPlayer, syncPlayerDiscipline } from "@/lib/consecutiveMissed";
import { createRwandanMidnight, getRwandanDateString } from "@/lib/rwandanTime";

export interface DailyCycleResult {
  advanced: boolean;
  currentMatchday: number;
  message?: string;
  processedMatchesCount?: number;
  activatedMatchesCount?: number;
}

/**
 * Processes unplayed scheduled matches whose deadline has passed (or for a specified round).
 * Sets them to 0-0 Draw, awards 1 point each in standings, and adds 1 missed match to both players.
 * Highly optimized for Cloudflare Workers / D1 execution time limits:
 * - Batches match updates in a single query
 * - Uses in-memory discipline synchronization
 * - Recalculates standings once per unique affected division
 */
export async function processOverdueUnplayedMatches(options: { round?: string; force?: boolean } = {}): Promise<{
  processedMatchesCount: number;
  processedMatchIds: string[];
}> {
  const now = new Date();
  const roundFilter = options.round ? { round: options.round } : {};
  const deadlineFilter = options.force ? {} : { deadlineDate: { lte: now } };

  // Fetch current matchday to ensure we never auto-expire matches for the active or future rounds during generic cleanup
  const config = await prisma.leagueConfig.findUnique({
    where: { id: "default" },
    select: { currentMatchday: true },
  });
  const currentMatchday = config?.currentMatchday || 1;

  // Find all scheduled matches whose deadline has passed (or matching the specified round)
  // Exclude matches on hold for replacement (WAITING_FOR_SUB) or replacement backlog
  const expiredMatches = await prisma.match.findMany({
    where: {
      status: "SCHEDULED",
      ...roundFilter,
      ...deadlineFilter,
      AND: [
        {
          OR: [
            { allowLateSubmission: false },
            { deadlineDate: { lte: now } },
          ],
        },
        {
          OR: [
            { notes: null },
            {
              AND: [
                { notes: { not: { contains: "WAITING_FOR_SUB" } } },
                { notes: { not: { contains: "REPLACEMENT_BACKLOG" } } },
                {
                  OR: [
                    { notes: { not: { contains: "ADMIN_REOPENED" } } },
                    { deadlineDate: { lte: now } },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    select: {
      id: true,
      round: true,
      division: true,
      stage: true,
      groupName: true,
      tournamentId: true,
      homePlayerId: true,
      awayPlayerId: true,
    },
  });

  // Filter out any division matches that belong to active or future rounds when generic cleanup is running
  const matchesToProcess = expiredMatches.filter((match) => {
    if (options.round) return true;
    const isDivisionMatch = match.division?.startsWith("Division");
    if (isDivisionMatch) {
      const matchRoundNum = parseInt(match.round?.match(/\d+/)?.[0] || "0", 10);
      if (matchRoundNum >= currentMatchday) {
        return false;
      }
    }
    return true;
  });

  if (matchesToProcess.length === 0) {
    return {
      processedMatchesCount: 0,
      processedMatchIds: [],
    };
  }

  const processedMatchIds = matchesToProcess.map((m) => m.id);

  // 1. Batch-update all expired matches to FINISHED with 0-0 in a single query
  await prisma.match.updateMany({
    where: { id: { in: processedMatchIds } },
    data: {
      homeScore: 0,
      awayScore: 0,
      status: "FINISHED",
      notes: "Automatic 0-0 Draw (1 pt each): 24-hour midnight window elapsed without submitted score. Both players assigned 1 missed match.",
    },
  });

  const affectedDivisions = new Map<
    string,
    { tournamentId: string; division: string; rawDivision: string; groupName?: string | null }
  >();
  const affectedPlayerIds = new Set<string>();

  for (const match of matchesToProcess) {
    if (match.homePlayerId) affectedPlayerIds.add(match.homePlayerId);
    if (match.awayPlayerId) affectedPlayerIds.add(match.awayPlayerId);

    const divToRecalc = match.stage === "GROUP" && match.groupName
      ? `${match.division} ${match.groupName}`
      : match.division;
    const divKey = `${match.tournamentId}__${divToRecalc}`;
    if (!affectedDivisions.has(divKey)) {
      affectedDivisions.set(divKey, {
        tournamentId: match.tournamentId,
        division: divToRecalc,
        rawDivision: match.division,
        groupName: match.groupName,
      });
    }
  }

  // 2. Synchronize player discipline and consecutive missed matches in batched memory
  const playerIdsArr = Array.from(affectedPlayerIds);
  if (playerIdsArr.length > 0) {
    try {
      await syncPlayerDiscipline(playerIdsArr);
    } catch (discErr) {
      console.warn("Discipline sync warning in processOverdueUnplayedMatches:", discErr);
    }
  }

  // 3. Recalculate standings once per affected division
  for (const { tournamentId, division, rawDivision, groupName } of affectedDivisions.values()) {
    try {
      await recalculateStandings(tournamentId, division);
      const compType = rawDivision.includes("EUROPA") ? "EUROPA" : rawDivision.includes("UCL") ? "UCL" : "DIVISION";
      await notifyStandingsUpdate({
        tournamentType: compType,
        competitionName: rawDivision,
        groupName: groupName || null,
        matchSummary: "Overdue matchday resolution (0-0 draw)",
      }).catch(() => {});
    } catch (recalcErr) {
      console.warn("recalculateStandings warning in processOverdueUnplayedMatches:", recalcErr);
    }
  }

  return {
    processedMatchesCount: matchesToProcess.length,
    processedMatchIds,
  };
}

export interface AutoAdvanceOptions {
  force?: boolean;
  bypassThrottle?: boolean;
}

let lastDailyCycleCheckTime = 0;
const DAILY_CYCLE_THROTTLE_MS = 2 * 60 * 1000; // 2 minutes throttle (was 15 minutes)

export async function checkAndAutoAdvanceDailyCycle(options: AutoAdvanceOptions = {}): Promise<DailyCycleResult> {
  const { force = false, bypassThrottle = false } = options;

  if (!force && !bypassThrottle && Date.now() - lastDailyCycleCheckTime < DAILY_CYCLE_THROTTLE_MS) {
    return {
      advanced: false,
      currentMatchday: 1,
      message: "Daily cycle check throttled (checked recently).",
    };
  }
  if (!force) {
    lastDailyCycleCheckTime = Date.now();
  }

  try {
    const config = await prisma.leagueConfig.findUnique({
      where: { id: "default" },
    });

    const currentMatchday = config?.currentMatchday || 1;
    const previousRoundName = `Matchday ${currentMatchday}`;
    const nextMatchday = currentMatchday + 1;
    const nextRoundName = `Matchday ${nextMatchday}`;

    // Automatically purge replied player messages and announcements older than 24 hours
    await cleanupExpiredRepliedMessages();
    await cleanupExpiredAnnouncements();

    // Always process any overdue unplayed matches whose deadline has elapsed across all rounds
    const overdueResult = await processOverdueUnplayedMatches();

    const now = new Date();

    if (!force) {
      // Look for the standard deadline in the current matchday
      // Priority 1: Unextended standard fixture (allowLateSubmission: false)
      // Priority 2: Earliest deadline in the round
      let sampleMatch = await prisma.match.findFirst({
        where: { round: previousRoundName, allowLateSubmission: false },
        orderBy: { deadlineDate: "asc" },
        select: { deadlineDate: true },
      });

      if (!sampleMatch) {
        sampleMatch = await prisma.match.findFirst({
          where: { round: previousRoundName },
          orderBy: { deadlineDate: "asc" },
          select: { deadlineDate: true },
        });
      }

      // If no match found, do nothing
      if (!sampleMatch || !sampleMatch.deadlineDate) {
        return {
          advanced: false,
          currentMatchday,
          message: "No scheduled matches found for the current matchday.",
          processedMatchesCount: overdueResult.processedMatchesCount,
        };
      }

      // STRICT DEADLINE CHECK:
      // Never advance before the official deadline has actually arrived (12:00 AM CAT / Rwandan Time).
      if (now.getTime() < new Date(sampleMatch.deadlineDate).getTime()) {
        return {
          advanced: false,
          currentMatchday,
          message: overdueResult.processedMatchesCount > 0
            ? `Processed ${overdueResult.processedMatchesCount} overdue unsubmitted matches. Current matchday deadline has not yet arrived.`
            : "Matchday deadline has not yet arrived. Fixtures are still active.",
          processedMatchesCount: overdueResult.processedMatchesCount,
        };
      }
    }

    // DEADLINE EXPIRED (Past 12:00 AM) or FORCE ADVANCE: Execute automatic transition

    // 1. Process unplayed matches for the ending matchday
    const roundExpired = await processOverdueUnplayedMatches({ round: previousRoundName, force });
    const totalProcessed = overdueResult.processedMatchesCount + roundExpired.processedMatchesCount;

    // Process any REPLACEMENT_BACKLOG matches whose 48-hour deadline has expired
    const expiredReplacementMatches = await prisma.match.findMany({
      where: {
        status: "SCHEDULED",
        notes: { contains: "REPLACEMENT_BACKLOG" },
        deadlineDate: { lte: now },
      },
    });

    if (expiredReplacementMatches.length > 0) {
      const repMatchIds = expiredReplacementMatches.map((m) => m.id);
      await prisma.match.updateMany({
        where: { id: { in: repMatchIds } },
        data: {
          homeScore: 0,
          awayScore: 0,
          status: "FINISHED",
          notes: "Automatic 0-0 Draw (1 pt each): 48-hour replacement window elapsed without submitted score.",
        },
      });

      const affectedRepDivisions = new Map<string, { tournamentId: string; division: string }>();
      for (const rm of expiredReplacementMatches) {
        const divKey = `${rm.tournamentId}__${rm.division}`;
        if (!affectedRepDivisions.has(divKey)) {
          affectedRepDivisions.set(divKey, { tournamentId: rm.tournamentId, division: rm.division });
        }
      }

      for (const { tournamentId, division } of affectedRepDivisions.values()) {
        try {
          await recalculateStandings(tournamentId, division);
          const compType = division.includes("EUROPA") ? "EUROPA" : division.includes("UCL") ? "UCL" : "DIVISION";
          const grpMatch = division.match(/Group [A-D]/i);
          await notifyStandingsUpdate({
            tournamentType: compType,
            competitionName: division,
            groupName: grpMatch ? grpMatch[0] : null,
            matchSummary: "Replacement match elapsed (0-0 draw)",
          }).catch(() => {});
        } catch (repRecalcErr) {
          console.warn("Standings recalculation warning for replacement matches:", repRecalcErr);
        }
      }
    }

    // 2. Activate next matchday fixtures (Anchored strictly to 12:00 AM Midnight CAT / Rwandan Time)
    const currentRwandanDateStr = getRwandanDateString(now);
    const activeKickoffDate = createRwandanMidnight(currentRwandanDateStr);
    const activeDeadlineDate = new Date(activeKickoffDate.getTime() + 24 * 60 * 60 * 1000);

    // Ensure any previously premature auto-drawn fixtures for the newly activated round are freshly scheduled
    await prisma.match.updateMany({
      where: {
        round: nextRoundName,
        status: "FINISHED",
        notes: { contains: "Automatic 0-0 Draw" },
      },
      data: {
        status: "SCHEDULED",
        homeScore: null,
        awayScore: null,
        notes: null,
      },
    });

    const updatedMatches = await prisma.match.updateMany({
      where: { round: nextRoundName },
      data: {
        matchDate: activeKickoffDate,
        deadlineDate: activeDeadlineDate,
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
      await syncMatchOfTheDay(nextMatchday);
    }

    // If no more matches remain in the next round, the season has ended!
    if (updatedMatches.count === 0) {
      await promoteTopPlayersAtSeasonEnd();
      return {
        advanced: false,
        currentMatchday,
        message: "Season concluded. Final promotions executed.",
        processedMatchesCount: totalProcessed,
        activatedMatchesCount: 0,
      };
    }

    // 5. Check divisions with odd numbers and notify the remaining athlete who has no match today
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

    // 6. Broadcast announcement that next round is LIVE
    await prisma.announcement.create({
      data: {
        title: `⚡ ${nextRoundName} Fixtures are LIVE! (24-Hour Window, CAT / Rwandan Time)`,
        content: `The system has automatically dropped all ${nextRoundName} fixtures. All previous match submissions are now closed. Contact your opponent on WhatsApp and play before 12:00 AM midnight (CAT / Rwandan Time).`,
        type: "BROADCAST",
        isPinned: true,
      },
    });

    // 7. Auto-send official news & updates to carousel and database
    try {
      const { syncSystemNewsToCarousel } = await import("@/lib/systemNewsService");
      await syncSystemNewsToCarousel();
    } catch (newsErr) {
      console.warn("Auto-sync news warning during daily cycle:", newsErr);
    }

    // 8. Synchronize player discipline and standings across all active tiers
    try {
      const { syncPlayerDiscipline } = await import("@/lib/consecutiveMissed");
      await syncPlayerDiscipline();
    } catch (disciplineErr) {
      console.warn("Auto-sync discipline warning during daily cycle:", disciplineErr);
    }

    return {
      advanced: true,
      currentMatchday: nextMatchday,
      message: `Successfully advanced to ${nextRoundName}. Activated ${updatedMatches.count} fixtures. Processed ${totalProcessed} expired unplayed matches.`,
      processedMatchesCount: totalProcessed,
      activatedMatchesCount: updatedMatches.count,
    };
  } catch (error: any) {
    console.error("checkAndAutoAdvanceDailyCycle error:", error);
    return { advanced: false, currentMatchday: 1, message: error.message };
  }
}
