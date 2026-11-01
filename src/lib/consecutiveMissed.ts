import { prisma } from "@/lib/prisma";

/**
 * Pure in-memory computation of consecutive missed matches from a player's finished matches.
 */
export function computeConsecutiveMissedFromMatches(
  player: { id: string; createdAt: Date | string },
  playerMatches: any[]
): number {
  if (!playerMatches || playerMatches.length === 0) return 0;

  // Sort descending by round number, then match date
  const sortedMatches = [...playerMatches].sort((a, b) => {
    const roundA = parseInt(a.round?.replace(/\D/g, "") || "0", 10);
    const roundB = parseInt(b.round?.replace(/\D/g, "") || "0", 10);
    if (roundA !== roundB) return roundB - roundA;
    const dateA = a.matchDate ? new Date(a.matchDate).getTime() : 0;
    const dateB = b.matchDate ? new Date(b.matchDate).getTime() : 0;
    return dateB - dateA;
  });

  let streak = 0;
  const playerCreatedTime = new Date(player.createdAt).getTime();

  for (const m of sortedMatches) {
    // If this match concluded before the player joined / was registered, ignore it
    if (m.deadlineDate && playerCreatedTime > new Date(m.deadlineDate).getTime()) {
      continue;
    }

    const isAutoDraw = Boolean(
      m.notes?.includes("Automatic 0-0 Draw") ||
      m.notes?.includes("missed match") ||
      m.notes?.includes("elapsed without submitted score")
    );

    const forfeitAgainstMe =
      (m.forfeitClaims || []).some(
        (fc: any) => fc.status === "APPROVED" && fc.accusedPlayerId === player.id
      ) ||
      (m.status === "FORFEIT" &&
        ((m.homePlayerId === player.id && (m.homeScore ?? 0) < (m.awayScore ?? 0)) ||
          (m.awayPlayerId === player.id && (m.awayScore ?? 0) < (m.homeScore ?? 0))));

    const forfeitInMyFavor =
      (m.forfeitClaims || []).some(
        (fc: any) => fc.status === "APPROVED" && fc.claimantPlayerId === player.id
      ) ||
      (m.status === "FORFEIT" &&
        ((m.homePlayerId === player.id && (m.homeScore ?? 0) > (m.awayScore ?? 0)) ||
          (m.awayPlayerId === player.id && (m.awayScore ?? 0) > (m.homeScore ?? 0))));

    const hadApprovedSubmission = (m.submissions || []).some(
      (s: any) => s.status === "APPROVED" && s.submittedByPlayerId === player.id
    );

    // If player fulfilled match obligation (played / submitted or opponent forfeited)
    if (forfeitInMyFavor || hadApprovedSubmission) {
      break;
    }

    if (isAutoDraw || forfeitAgainstMe) {
      streak += 1;
    } else {
      // Finished normally with actual score (neither auto-draw nor forfeit against player)
      break;
    }
  }

  return streak;
}

/**
 * Computes the exact consecutive missed matches for a single player.
 */
export async function computeConsecutiveMissedForPlayer(playerId: string): Promise<number> {
  const player = await prisma.player.findUnique({
    where: { id: playerId },
    select: { id: true, createdAt: true },
  });

  if (!player) return 0;

  const matches = await prisma.match.findMany({
    where: {
      OR: [{ homePlayerId: playerId }, { awayPlayerId: playerId }],
      status: { in: ["FINISHED", "FORFEIT"] },
      AND: [
        {
          OR: [
            { stage: "DIVISION" },
            { division: { startsWith: "Division" } },
          ],
        },
      ],
    },
    include: {
      submissions: { where: { status: "APPROVED" } },
      forfeitClaims: { where: { status: "APPROVED" } },
    },
  });

  return computeConsecutiveMissedFromMatches(player, matches);
}

/**
 * Synchronizes consecutiveMissed and disciplinary status across active players and standings tables.
 * Highly optimized: batches data in minimal queries and only writes updates when values differ.
 * When a closed match is reopened, its status changes to SCHEDULED and it is excluded from finished matches,
 * which automatically clears the missed match count for both athletes.
 */
export async function syncPlayerDiscipline(playerId?: string | string[]) {
  try {
    const where: any = playerId
      ? Array.isArray(playerId)
        ? { id: { in: playerId } }
        : { id: playerId }
      : { status: { in: ["ACTIVE", "WARNING", "DISQUALIFIED"] } };

    const [players, allFinishedMatches, allStandings] = await Promise.all([
      prisma.player.findMany({
        where,
        select: {
          id: true,
          gamerTag: true,
          consecutiveMissed: true,
          status: true,
          isDisqualified: true,
          createdAt: true,
        },
      }),
      prisma.match.findMany({
        where: {
          status: { in: ["FINISHED", "FORFEIT"] },
          OR: [
            { stage: "DIVISION" },
            { division: { startsWith: "Division" } },
          ],
        },
        include: {
          submissions: { where: { status: "APPROVED" } },
          forfeitClaims: { where: { status: "APPROVED" } },
        },
      }),
      prisma.standing.findMany({
        select: {
          id: true,
          playerId: true,
          consecutiveMissed: true,
          isDisqualified: true,
        },
      }),
    ]);

    // Group finished matches by player id
    const matchesByPlayer = new Map<string, any[]>();
    for (const m of allFinishedMatches) {
      if (m.homePlayerId) {
        const arr = matchesByPlayer.get(m.homePlayerId) || [];
        arr.push(m);
        matchesByPlayer.set(m.homePlayerId, arr);
      }
      if (m.awayPlayerId) {
        const arr = matchesByPlayer.get(m.awayPlayerId) || [];
        arr.push(m);
        matchesByPlayer.set(m.awayPlayerId, arr);
      }
    }

    // Group standings by player id
    const standingsByPlayer = new Map<string, any[]>();
    for (const s of allStandings) {
      if (s.playerId) {
        const arr = standingsByPlayer.get(s.playerId) || [];
        arr.push(s);
        standingsByPlayer.set(s.playerId, arr);
      }
    }

    let updatedCount = 0;

    for (const p of players) {
      const pMatches = matchesByPlayer.get(p.id) || [];
      const correctMissed = computeConsecutiveMissedFromMatches(p, pMatches);
      const isDisqualified = correctMissed >= 3;
      const newStatus = isDisqualified
        ? "DISQUALIFIED"
        : correctMissed === 2
        ? "WARNING"
        : p.status === "WARNING" || p.status === "DISQUALIFIED"
        ? "ACTIVE"
        : p.status;

      const playerChanged =
        p.consecutiveMissed !== correctMissed ||
        p.isDisqualified !== isDisqualified ||
        p.status !== newStatus;

      if (playerChanged) {
        updatedCount++;
        await prisma.player.update({
          where: { id: p.id },
          data: {
            consecutiveMissed: correctMissed,
            isDisqualified,
            status: newStatus,
            disqualificationReason: isDisqualified
              ? "Missed 3 consecutive league fixtures without submitting results or claiming forfeit."
              : null,
          },
        });
      }

      // If player was disqualified and is now reinstated (e.g. closed match was reopened):
      // clear WAITING_FOR_SUB on upcoming fixtures and remove suspension announcement
      if (p.isDisqualified && !isDisqualified) {
        await prisma.match.updateMany({
          where: {
            OR: [{ homePlayerId: p.id }, { awayPlayerId: p.id }],
            status: "SCHEDULED",
            notes: { contains: "WAITING_FOR_SUB" },
          },
          data: {
            notes: null,
          },
        });

        await prisma.announcement.deleteMany({
          where: {
            targetPlayerId: p.id,
            title: { contains: "ACCOUNT SUSPENDED: 3 Missed Matches" },
          },
        }).catch(() => {});

        await prisma.announcement.create({
          data: {
            title: "✅ Disciplinary Suspension Lifted",
            content: `Hello @${p.gamerTag}. Your closed fixture was reopened by the League Administrator, and your missed match count has been reduced to ${correctMissed}/3. Your account suspension has been lifted and you are restored to active competition.`,
            type: "INDIVIDUAL",
            targetPlayerId: p.id,
            isPinned: false,
          },
        }).catch(() => {});
      }

      // If missed matches reduced below warning threshold, delete previous warning announcement
      if (correctMissed < 2) {
        await prisma.announcement.deleteMany({
          where: {
            targetPlayerId: p.id,
            title: { contains: "DISCIPLINARY WARNING: 2/3 Missed Matches" },
          },
        }).catch(() => {});
      } else if (correctMissed === 2 && !isDisqualified) {
        const existingWarning = await prisma.announcement.findFirst({
          where: {
            targetPlayerId: p.id,
            title: { contains: "DISCIPLINARY WARNING: 2/3 Missed Matches" },
          },
        });
        if (!existingWarning) {
          await prisma.announcement.create({
            data: {
              title: `⚠️ DISCIPLINARY WARNING: 2/3 Missed Matches`,
              content: `Hello @${p.gamerTag}. You have missed 2 consecutive scheduled fixtures without administrative approval. This is your FINAL WARNING. EFRL regulations mandate immediate disqualification and roster replacement upon reaching 3 missed matches. Please ensure you play your next fixture and submit results before the deadline.`,
              type: "INDIVIDUAL",
              targetPlayerId: p.id,
              isPinned: true,
            },
          });
        }
      }

      // Check and update player standings
      const pStandings = standingsByPlayer.get(p.id) || [];
      for (const s of pStandings) {
        if (s.consecutiveMissed !== correctMissed || s.isDisqualified !== isDisqualified) {
          await prisma.standing.update({
            where: { id: s.id },
            data: {
              consecutiveMissed: correctMissed,
              isDisqualified,
            },
          });
        }
      }
    }

    return {
      success: true,
      syncedCount: players.length,
      updatedCount,
    };
  } catch (err) {
    console.error("syncPlayerDiscipline error:", err);
    return {
      success: false,
      error: err,
    };
  }
}
