import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import DashboardClient from "./DashboardClient";
import { checkAndAutoAdvanceDailyCycle } from "@/lib/autoDailyCycle";
import { evaluateAllDivisionsMatchOfTheDay, evaluateContinentalGroupMotds } from "@/lib/matchOfTheDay";
import { cleanupExpiredAnnouncements } from "@/lib/announcementCleanup";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const sessionUserId = cookieStore.get("efrl_session")?.value;

  if (!sessionUserId) {
    redirect("/login");
  }

  // Automatic midnight cycle check
  await checkAndAutoAdvanceDailyCycle();

  const user = await prisma.user.findUnique({
    where: { id: sessionUserId },
    include: {
      player: {
        include: {
          standings: true,
        },
      },
    },
  });

  if (!user) {
    redirect("/login");
  }

  // If user is Admin, direct to the Commissioner Admin Office
  if (user.role === "ADMIN") {
    redirect("/admin");
  }

  if (!user.player) {
    redirect("/register");
  }

  const player = user.player;

  // League configuration for current matchday
  const leagueConfig = await prisma.leagueConfig.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default", currentMatchday: 1 },
  });

  const currentRoundName = `Matchday ${leagueConfig.currentMatchday}`;

  const matchInclude = {
    homePlayer: true,
    awayPlayer: true,
    submissions: {
      include: { submittedByPlayer: true },
      orderBy: { createdAt: "desc" as const },
    },
    forfeitClaims: {
      include: { claimantPlayer: true, accusedPlayer: true },
      orderBy: { createdAt: "desc" as const },
    },
  };

  // Check if player is actively participating in the league vs. on standby in the reserve pool
  const isReserved = player?.status === "RESERVED";
  const isSuspendedForMissed = Boolean((player?.consecutiveMissed || 0) >= 3 || player?.isDisqualified);
  const isParticipating = !isReserved && !isSuspendedForMissed && (player?.status === "ACTIVE" || player?.status === "WARNING");

  let activeMatch = null;
  let allPlayerMatches: any[] = [];
  let isRestDayToday = false;
  let isWaitingForSub = false;

  // Automatic deletion of announcements older than 24 hours
  await cleanupExpiredAnnouncements();
  const cutoff24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // Fetch announcements for this player created within the last 24 hours
  let announcements = await prisma.announcement.findMany({
    where: {
      OR: [{ type: "BROADCAST" }, { targetPlayerId: player.id }],
      createdAt: { gte: cutoff24h },
    },
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    take: 30,
  });

  // Remove announcements that were marked as read > 24 hours ago
  const expiredReads = await prisma.announcementRead.findMany({
    where: {
      playerId: player.id,
      readAt: { lt: cutoff24h },
    },
    select: { announcementId: true },
  });
  const expiredReadIds = new Set(expiredReads.map((r) => r.announcementId));
  announcements = announcements.filter((ann) => !expiredReadIds.has(ann.id));

  // If player is in the reserve pool, filter out match fixture broadcasts
  if (isReserved) {
    announcements = announcements.filter(
      (ann) =>
        !ann.title.includes("Matchday") &&
        !ann.title.includes("Fixtures") &&
        !ann.title.includes("Deadline") &&
        !ann.title.includes("Countdown")
    );
  }

  // Generated matches are strictly available to players actively participating in the league, NOT players in the reserve pool
  if (isParticipating) {
    // 0. PRIORITY BACKLOG REPLACEMENT MATCH: If player has an open 48-hr replacement match, they must begin with that!
    const priorityBacklogMatch = await prisma.match.findFirst({
      where: {
        OR: [{ homePlayerId: player.id }, { awayPlayerId: player.id }],
        status: { in: ["SCHEDULED", "LIVE"] },
        notes: { contains: "REPLACEMENT_BACKLOG" },
      },
      include: matchInclude,
      orderBy: [{ deadlineDate: "asc" }, { matchDate: "asc" }],
    });

    if (priorityBacklogMatch) {
      activeMatch = priorityBacklogMatch;
    }

    // 0.5 Continental priority: If player has an active/scheduled match in UCL or Europa, prioritize it on Today's 24-Hr match page!
    if (!activeMatch) {
      const activeContinentalMatch = await prisma.match.findFirst({
        where: {
          division: { in: ["UCL", "EUROPA"] },
          OR: [{ homePlayerId: player.id }, { awayPlayerId: player.id }],
          status: { in: ["SCHEDULED", "LIVE"] },
        },
        include: matchInclude,
        orderBy: [{ matchDate: "asc" }, { createdAt: "asc" }],
      });

      if (activeContinentalMatch) {
        activeMatch = activeContinentalMatch;
      }
    }

    // 1. Scheduled or Live match in current league round
    if (!activeMatch) {
      activeMatch = await prisma.match.findFirst({
        where: {
          OR: [{ homePlayerId: player.id }, { awayPlayerId: player.id }],
          round: currentRoundName,
          status: { in: ["SCHEDULED", "LIVE"] },
        },
        include: matchInclude,
        orderBy: { matchDate: "asc" },
      });
    }

    // 2. Earliest scheduled or live match for this player across all stages (Divisions, UCL, Europa)
    if (!activeMatch) {
      activeMatch = await prisma.match.findFirst({
        where: {
          OR: [{ homePlayerId: player.id }, { awayPlayerId: player.id }],
          status: { in: ["SCHEDULED", "LIVE"] },
        },
        include: matchInclude,
        orderBy: [{ deadlineDate: "asc" }, { matchDate: "asc" }],
      });
    }

    // 3. Match in current round that was played/pending/finished (so user sees their result and status)
    if (!activeMatch) {
      activeMatch = await prisma.match.findFirst({
        where: {
          OR: [{ homePlayerId: player.id }, { awayPlayerId: player.id }],
          round: currentRoundName,
        },
        include: matchInclude,
        orderBy: { matchDate: "desc" },
      });
    }

    // 4. Most recent match of this player
    if (!activeMatch) {
      activeMatch = await prisma.match.findFirst({
        where: {
          OR: [{ homePlayerId: player.id }, { awayPlayerId: player.id }],
        },
        include: matchInclude,
        orderBy: { matchDate: "desc" },
      });
    }

    // Check if the current round in player's division has matches, but this player is the remaining one (odd division rest day)
    const divisionMatchesThisRound = await prisma.match.count({
      where: {
        division: player.division,
        round: currentRoundName,
      },
    });

    const playerMatchThisRound = await prisma.match.findFirst({
      where: {
        division: player.division,
        round: currentRoundName,
        OR: [{ homePlayerId: player.id }, { awayPlayerId: player.id }],
      },
    });

    if (divisionMatchesThisRound > 0 && !playerMatchThisRound) {
      isRestDayToday = true;

      // Ensure notification exists in announcements
      const alreadyNotified = announcements.some(
        (a) => a.title.includes(currentRoundName) && (a.title.includes("No Match") || a.title.includes("Rest Day"))
      );
      if (!alreadyNotified) {
        const restAnn = await prisma.announcement.create({
          data: {
            title: `🗓️ ${currentRoundName}: No Match Scheduled (Rest Day)`,
            content: `Hello ${player.gamerTag}! You do not have a match to play for today's ${currentRoundName}. Because ${player.division} has an odd number of active players, this round is your scheduled rest day while other division fixtures take place. Your next match will unlock on the following matchday.`,
            type: "INDIVIDUAL",
            targetPlayerId: player.id,
            isPinned: true,
          },
        });
        announcements = [restAnn, ...announcements];
      }
    }
  }

  // Fetch all matches of this player across the entire season for Calendar Mode
  const allPlayerMatchesRaw = await prisma.match.findMany({
    where: {
      OR: [{ homePlayerId: player.id }, { awayPlayerId: player.id }],
    },
    include: matchInclude,
    orderBy: [{ matchDate: "asc" }, { createdAt: "asc" }],
  });

  // RULE: When UCL or Europa starts, the match calendar page for participants ONLY is cleared of old domestic fixtures to show UCL / Europa matches
  const continentalMatches = allPlayerMatchesRaw.filter(
    (m) => m.division === "UCL" || m.division === "EUROPA"
  );
  const hasStartedContinental =
    (leagueConfig?.uclStarted || leagueConfig?.europaStarted) && continentalMatches.length > 0;

  const matchesToDisplay = hasStartedContinental ? continentalMatches : allPlayerMatchesRaw;

  // Sort matches naturally by numerical round index (e.g. Matchday 1 before Matchday 10) and matchDate
  allPlayerMatches = [...matchesToDisplay].sort((a, b) => {
    const getRoundNum = (roundStr: string) => {
      const m = roundStr?.match(/\d+/);
      return m ? parseInt(m[0], 10) : 999;
    };
    const numA = getRoundNum(a.round || "");
    const numB = getRoundNum(b.round || "");
    if (numA !== numB) return numA - numB;
    return new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime();
  });

  // Fetch player's existing feedback review if any
  const myReview = await prisma.feedbackReview.findFirst({
    where: { playerId: player.id },
  });

  // Fetch recent finished matches of this player
  const recentMatches = await prisma.match.findMany({
    where: {
      OR: [{ homePlayerId: player.id }, { awayPlayerId: player.id }],
      status: { in: ["FINISHED", "FORFEIT"] },
    },
    include: {
      homePlayer: true,
      awayPlayer: true,
    },
    orderBy: { matchDate: "desc" },
    take: 10,
  });

  // Fetch division standing for player
  const currentStanding = await prisma.standing.findFirst({
    where: {
      division: player.division,
      playerId: player.id,
    },
  });

  // Fetch all 3 division standings so reserve and active athletes can view all tables
  const [div1Standings, div2Standings, div3Standings, uclTournament, europaTournament, uclSlots, europaSlots] = await Promise.all([
    prisma.standing.findMany({
      where: { division: "Division 1" },
      include: { player: true },
      orderBy: [{ points: "desc" }, { goalDifference: "desc" }, { goalsFor: "desc" }],
    }),
    prisma.standing.findMany({
      where: { division: "Division 2" },
      include: { player: true },
      orderBy: [{ points: "desc" }, { goalDifference: "desc" }, { goalsFor: "desc" }],
    }),
    prisma.standing.findMany({
      where: { division: "Division 3" },
      include: { player: true },
      orderBy: [{ points: "desc" }, { goalDifference: "desc" }, { goalsFor: "desc" }],
    }),
    prisma.tournament.findFirst({ where: { type: "UCL" } }),
    prisma.tournament.findFirst({ where: { type: "EUROPA" } }),
    prisma.uclGroupSlot.findMany({
      where: { competition: "UCL" },
      include: { player: true },
      orderBy: [{ groupName: "asc" }, { slotIndex: "asc" }],
    }),
    prisma.uclGroupSlot.findMany({
      where: { competition: "EUROPA" },
      include: { player: true },
      orderBy: [{ groupName: "asc" }, { slotIndex: "asc" }],
    }),
  ]);

  let uclGroupStandings: any[] = [];
  if (uclTournament) {
    uclGroupStandings = await prisma.standing.findMany({
      where: { tournamentId: uclTournament.id },
      include: { player: true },
      orderBy: [{ points: "desc" }, { goalDifference: "desc" }, { goalsFor: "desc" }],
    });
  }

  let europaGroupStandings: any[] = [];
  if (europaTournament) {
    europaGroupStandings = await prisma.standing.findMany({
      where: { tournamentId: europaTournament.id },
      include: { player: true },
      orderBy: [{ points: "desc" }, { goalDifference: "desc" }, { goalsFor: "desc" }],
    });
  }

  // Compute Match of the Day for each division (all athletes including reserve can view & vote)
  let divisionalMotd: Record<string, any> = {
    "Division 1": null,
    "Division 2": null,
    "Division 3": null,
  };

  if (leagueConfig.currentMatchday > 1) {
    const roundMatches = await prisma.match.findMany({
      where: { round: currentRoundName },
      include: { homePlayer: true, awayPlayer: true },
    });
    const allStandings = await prisma.standing.findMany({
      orderBy: [{ points: "desc" }, { goalDifference: "desc" }],
    });
    divisionalMotd = evaluateAllDivisionsMatchOfTheDay(roundMatches, allStandings, leagueConfig.currentMatchday);
  }

  // Compute qualified athletes for continental competitions
  const uclQualified = [
    ...div1Standings.slice(0, 8),
    ...div2Standings.slice(0, 4),
    ...div3Standings.slice(0, 4),
  ];

  const europaQualified = [
    ...div1Standings.slice(8, 12),
    ...div2Standings.slice(4, 10),
    ...div3Standings.slice(4, 10),
  ];

  // -------------------------------------------------------------------------
  // Mathematical Qualification & Continental Advanced Round Elimination System
  // -------------------------------------------------------------------------
  const inUclSlots = (uclSlots || []).some((s: any) => s.playerId === player.id);
  const inEuropaSlots = (europaSlots || []).some((s: any) => s.playerId === player.id);

  // Standings and cutoffs for player's division
  const divStandings =
    player.division === "Division 1"
      ? div1Standings
      : player.division === "Division 2"
      ? div2Standings
      : div3Standings;

  const uclCutoff = player.division === "Division 1" ? 8 : 4;
  const europaCutoff = player.division === "Division 1" ? 12 : 10;

  // Unplayed matches in this division
  const unplayedDivisionMatches = await prisma.match.findMany({
    where: {
      division: player.division,
      status: { in: ["SCHEDULED", "LIVE"] },
    },
    select: { homePlayerId: true, awayPlayerId: true },
  });

  const totalDivisionMatchesCount = await prisma.match.count({
    where: { division: player.division },
  });
  const isDivisionsMatchEnded =
    (totalDivisionMatchesCount > 0 && unplayedDivisionMatches.length === 0) ||
    Boolean(leagueConfig.uclStarted || leagueConfig.europaStarted);

  // Map remaining unplayed matches per player
  const remainingMatchesPerPlayer: Record<string, number> = {};
  for (const st of divStandings) {
    remainingMatchesPerPlayer[st.playerId] = 0;
  }
  for (const m of unplayedDivisionMatches) {
    if (remainingMatchesPerPlayer[m.homePlayerId] !== undefined) {
      remainingMatchesPerPlayer[m.homePlayerId]++;
    }
    if (remainingMatchesPerPlayer[m.awayPlayerId] !== undefined) {
      remainingMatchesPerPlayer[m.awayPlayerId]++;
    }
  }

  // Current player standing and points
  const myStanding = divStandings.find((s: any) => s.playerId === player.id) || currentStanding;
  const myCurrentPoints = myStanding?.points ?? 0;
  const myRemainingMatches = remainingMatchesPerPlayer[player.id] ?? 0;

  // MATHEMATICAL QUALIFICATION CHECK:
  // "validated if the player will be qualified at all cost (even if he can lose the rest of matches)"
  // Worst-case for player: loses all remaining matches (final points = myCurrentPoints)
  // Best-case for other players: win all remaining matches (maxPoints = points + remaining * 3)
  const otherPlayersMax = divStandings
    .filter((s: any) => s.playerId !== player.id)
    .map((s: any) => ({
      playerId: s.playerId,
      maxPossiblePoints: (s.points || 0) + ((remainingMatchesPerPlayer[s.playerId] || 0) * 3),
    }));

  const countCanSurpassMe = otherPlayersMax.filter(
    (p: any) => p.maxPossiblePoints >= myCurrentPoints
  ).length;

  // Mathematically guaranteed for UCL at all costs (worst-case finish is <= uclCutoff):
  const isGuaranteedUcl = Boolean(myStanding && countCanSurpassMe < uclCutoff);

  // Mathematically guaranteed for Europa League at all costs:
  const isGuaranteedEuropa = Boolean(myStanding && !isGuaranteedUcl && countCanSurpassMe < europaCutoff);

  // Mathematical elimination check:
  // Best-case for player: wins all remaining matches
  const myMaxPossiblePoints = myCurrentPoints + (myRemainingMatches * 3);
  const countAlreadyAheadOfMe = divStandings.filter(
    (s: any) => s.playerId !== player.id && (s.points || 0) > myMaxPossiblePoints
  ).length;

  const isGuaranteedEliminatedFromDiv = Boolean(
    myStanding &&
    (countAlreadyAheadOfMe >= europaCutoff || (isDivisionsMatchEnded && !isGuaranteedUcl && !isGuaranteedEuropa))
  );

  // Check finished continental matches for this player
  const playerContinentalMatches = allPlayerMatchesRaw.filter(
    (m: any) => m.division === "UCL" || m.division === "EUROPA"
  );

  let continentalElimination: {
    isEliminated: boolean;
    competition: string;
    stage: string;
    reason: string;
  } | null = null;

  // 1. Check Grand Final loss
  const finalMatch = playerContinentalMatches.find(
    (m: any) => m.stage === "FINAL" && (m.status === "FINISHED" || m.status === "FORFEIT")
  );
  if (finalMatch) {
    const isHome = finalMatch.homePlayerId === player.id;
    const homeAgg = finalMatch.aggregateHomeScore ?? finalMatch.homeScore ?? 0;
    const awayAgg = finalMatch.aggregateAwayScore ?? finalMatch.awayScore ?? 0;
    const myScore = isHome ? homeAgg : awayAgg;
    const oppScore = isHome ? awayAgg : homeAgg;
    if (myScore < oppScore) {
      continentalElimination = {
        isEliminated: true,
        competition: finalMatch.division === "EUROPA" ? "Europa League" : "UCL",
        stage: "Grand Final",
        reason: "Runner-up in Grand Final",
      };
    }
  }

  // 2. Check Semi-Final loss
  if (!continentalElimination) {
    const sfMatch = playerContinentalMatches.find(
      (m: any) => m.stage === "SEMI_FINAL" && (m.status === "FINISHED" || m.status === "FORFEIT")
    );
    if (sfMatch) {
      const isHome = sfMatch.homePlayerId === player.id;
      const homeAgg = sfMatch.aggregateHomeScore ?? ((sfMatch.homeScore || 0) + (sfMatch.leg2AwayScore || 0));
      const awayAgg = sfMatch.aggregateAwayScore ?? ((sfMatch.awayScore || 0) + (sfMatch.leg2HomeScore || 0));
      const myScore = isHome ? homeAgg : awayAgg;
      const oppScore = isHome ? awayAgg : homeAgg;
      if (myScore < oppScore) {
        continentalElimination = {
          isEliminated: true,
          competition: sfMatch.division === "EUROPA" ? "Europa League" : "UCL",
          stage: "Semi-Finals",
          reason: "Lost on aggregate in Semi-Finals",
        };
      }
    }
  }

  // 3. Check Quarter-Final loss
  if (!continentalElimination) {
    const qfMatch = playerContinentalMatches.find(
      (m: any) => m.stage === "QUARTER_FINAL" && (m.status === "FINISHED" || m.status === "FORFEIT")
    );
    if (qfMatch) {
      const isHome = qfMatch.homePlayerId === player.id;
      const homeAgg = qfMatch.aggregateHomeScore ?? ((qfMatch.homeScore || 0) + (qfMatch.leg2AwayScore || 0));
      const awayAgg = qfMatch.aggregateAwayScore ?? ((qfMatch.awayScore || 0) + (qfMatch.leg2HomeScore || 0));
      const myScore = isHome ? homeAgg : awayAgg;
      const oppScore = isHome ? awayAgg : homeAgg;
      if (myScore < oppScore) {
        continentalElimination = {
          isEliminated: true,
          competition: qfMatch.division === "EUROPA" ? "Europa League" : "UCL",
          stage: "Quarter-Finals",
          reason: "Lost on aggregate in Quarter-Finals",
        };
      }
    }
  }

  // 4. Check Group Stage elimination (if all group matches in player's group are finished & ranked > 2)
  if (!continentalElimination) {
    const slot = [...uclSlots, ...europaSlots].find((s: any) => s.playerId === player.id);
    if (slot) {
      const comp = slot.competition;
      const groupName = slot.groupName;
      const groupMatches = await prisma.match.findMany({
        where: { division: comp, stage: "GROUP", groupName },
      });
      const allGroupMatchesFinished =
        groupMatches.length >= 6 &&
        groupMatches.every((m: any) => m.status === "FINISHED" || m.status === "FORFEIT");

      if (allGroupMatchesFinished) {
        const standingsList = comp === "EUROPA" ? europaGroupStandings : uclGroupStandings;
        const myGroupStandings = standingsList
          .filter((s: any) => s.division?.includes(groupName))
          .sort((a: any, b: any) => (b.points - a.points) || (b.goalDifference - a.goalDifference) || (b.goalsFor - a.goalsFor));
        const myRank = myGroupStandings.findIndex((s: any) => s.playerId === player.id) + 1;
        if (myRank > 2) {
          continentalElimination = {
            isEliminated: true,
            competition: comp === "EUROPA" ? "Europa League" : "UCL",
            stage: "Group Stage",
            reason: `Finished #${myRank} in ${groupName} (Only top 2 advanced)`,
          };
        }
      }
    }
  }

  // If eliminated in UCL or Europa, ensure notification exists in player's announcements inbox
  if (continentalElimination && continentalElimination.isEliminated) {
    const elimTitle = `⚠️ Elimination Notice: ${continentalElimination.competition} (${continentalElimination.stage})`;
    const alreadyNotified = announcements.some(
      (a: any) => a.title.includes("Elimination") && a.title.includes(continentalElimination!.stage)
    );
    if (!alreadyNotified) {
      const elimAnn = await prisma.announcement.create({
        data: {
          title: elimTitle,
          content: `Hello ${player.gamerTag}, your tournament campaign in the ${continentalElimination.competition} has ended. You have been eliminated in the ${continentalElimination.stage} (${continentalElimination.reason}). Thank you for competing with skill and determination!`,
          type: "INDIVIDUAL",
          targetPlayerId: player.id,
          isPinned: true,
        },
      });
      announcements = [elimAnn, ...announcements];
    }
  }

  // Determine overall status object
  let continentalStatus: {
    status: "QUALIFIED_UCL" | "QUALIFIED_EUROPA" | "ELIMINATED" | "IN_PROGRESS";
    title: string;
    subtitle?: string;
    stage?: string;
    competition?: string;
    isEliminated: boolean;
  } = {
    status: "IN_PROGRESS",
    title: "",
    isEliminated: false,
  };

  if (continentalElimination && continentalElimination.isEliminated) {
    continentalStatus = {
      status: "ELIMINATED",
      title: "You are eliminated",
      subtitle: `Eliminated from ${continentalElimination.competition} (${continentalElimination.stage}) • ${continentalElimination.reason}`,
      stage: continentalElimination.stage,
      competition: continentalElimination.competition,
      isEliminated: true,
    };
  } else if (inUclSlots || isGuaranteedUcl) {
    continentalStatus = {
      status: "QUALIFIED_UCL",
      title: "Qualified for UCL",
      subtitle: isDivisionsMatchEnded
        ? "Officially Qualified for eFootball Champions League (UCL)"
        : "Mathematically Qualified for UCL (Guaranteed at all costs)",
      competition: "UCL",
      isEliminated: false,
    };
  } else if (inEuropaSlots || isGuaranteedEuropa) {
    continentalStatus = {
      status: "QUALIFIED_EUROPA",
      title: "Qualified for Europa League",
      subtitle: isDivisionsMatchEnded
        ? "Officially Qualified for eFootball Europa League"
        : "Mathematically Qualified for Europa League (Guaranteed at all costs)",
      competition: "Europa League",
      isEliminated: false,
    };
  } else if (isGuaranteedEliminatedFromDiv) {
    continentalStatus = {
      status: "ELIMINATED",
      title: "You are eliminated",
      subtitle: isDivisionsMatchEnded
        ? `Eliminated from continental qualification (did not meet qualification cutoff in ${player.division})`
        : `Mathematically eliminated from continental qualification in ${player.division}`,
      competition: "Continental Cups",
      isEliminated: true,
    };
  }

  // Active standing for Quick Stats:
  // When divisions match ends and player is in UCL or Europa, use their continental standing
  const playerContinentalStanding =
    uclGroupStandings.find((s: any) => s.playerId === player.id) ||
    europaGroupStandings.find((s: any) => s.playerId === player.id) ||
    null;

  const activeStandingForStats =
    (hasStartedContinental || isDivisionsMatchEnded) && playerContinentalStanding
      ? playerContinentalStanding
      : currentStanding;

  // Opponent Intelligence for Today's 24-Hr Match Day
  let opponentStanding: any = null;
  let opponentPreviousMatches: any[] = [];

  if (activeMatch) {
    const oppId = activeMatch.homePlayerId === player.id ? activeMatch.awayPlayerId : activeMatch.homePlayerId;
    if (oppId) {
      if (activeMatch.division === "UCL" || activeMatch.division === "EUROPA") {
        if (activeMatch.stage === "GROUP" && activeMatch.groupName) {
          opponentStanding = await prisma.standing.findFirst({
            where: {
              playerId: oppId,
              division: `${activeMatch.division} ${activeMatch.groupName}`,
            },
          });
        } else {
          opponentStanding =
            (await prisma.standing.findFirst({
              where: { playerId: oppId, division: activeMatch.division },
            })) ||
            (await prisma.standing.findFirst({
              where: { playerId: oppId },
            }));
        }
      } else {
        opponentStanding = await prisma.standing.findFirst({
          where: { playerId: oppId, division: player.division },
        });
      }

      opponentPreviousMatches = await prisma.match.findMany({
        where: {
          OR: [{ homePlayerId: oppId }, { awayPlayerId: oppId }],
          status: { in: ["FINISHED", "FORFEIT"] },
          id: { not: activeMatch.id },
        },
        include: {
          homePlayer: true,
          awayPlayer: true,
        },
        orderBy: { matchDate: "desc" },
        take: 3,
      });
    }
  }

  if (activeMatch && !activeMatch.notes?.includes("REPLACEMENT_BACKLOG")) {
    const opp = activeMatch.homePlayerId === player.id ? activeMatch.awayPlayer : activeMatch.homePlayer;
    if (opp && ((opp.consecutiveMissed || 0) >= 3 || opp.isDisqualified || activeMatch.notes?.includes("WAITING_FOR_SUB"))) {
      isWaitingForSub = true;
    }
  }

  // Continental Group Stage Matches of the Day
  const allDomesticStandings = [...div1Standings, ...div2Standings, ...div3Standings];
  const uclGroupMatches = await prisma.match.findMany({
    where: { division: "UCL", stage: "GROUP" },
    include: { homePlayer: true, awayPlayer: true },
  });
  const uclGroupMotds = evaluateContinentalGroupMotds(uclGroupMatches, allDomesticStandings, "UCL");

  const europaGroupMatches = await prisma.match.findMany({
    where: { division: "EUROPA", stage: "GROUP" },
    include: { homePlayer: true, awayPlayer: true },
  });
  const europaGroupMotds = evaluateContinentalGroupMotds(europaGroupMatches, allDomesticStandings, "EUROPA");

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <DashboardClient
        player={player}
        user={user}
        activeMatch={activeMatch}
        allPlayerMatches={allPlayerMatches}
        announcements={announcements}
        recentMatches={recentMatches}
        standing={activeStandingForStats || currentStanding}
        leagueConfig={leagueConfig}
        divisionalMotd={divisionalMotd}
        uclGroupMotds={uclGroupMotds}
        europaGroupMotds={europaGroupMotds}
        div1Standings={div1Standings}
        div2Standings={div2Standings}
        div3Standings={div3Standings}
        uclGroupStandings={uclGroupStandings}
        europaGroupStandings={europaGroupStandings}
        uclSlots={uclSlots}
        europaSlots={europaSlots}
        uclQualified={uclQualified}
        europaQualified={europaQualified}
        continentalStatus={continentalStatus}
        continentalStanding={playerContinentalStanding}
        hasStartedContinental={hasStartedContinental}
        isDivisionsMatchEnded={isDivisionsMatchEnded}
        initialReview={myReview}
        isRestDayToday={isRestDayToday}
        isWaitingForSub={isWaitingForSub}
        isSuspendedForMissed={isSuspendedForMissed}
        currentRoundName={currentRoundName}
        opponentStanding={opponentStanding}
        opponentPreviousMatches={opponentPreviousMatches}
      />
    </div>
  );
}
