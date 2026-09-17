import { prisma } from "@/lib/prisma";

export interface MatchScoreEvaluation {
  matchId: string;
  score: number;
  homeRank: number;
  awayRank: number;
  homePoints: number;
  awayPoints: number;
  headline: string;
}

/**
 * Evaluates the Match of the Day for a specific division based on standings.
 * Rule: Except on the first round (Matchday 1).
 */
export function evaluateDivisionMatchOfTheDay(
  matches: any[],
  standings: any[],
  roundNumber: number,
  division: string
): any | null {
  // STRICT RULE: Except on the first round
  if (roundNumber <= 1) {
    return null;
  }

  const divisionMatches = matches.filter((m) => m.division === division);
  if (!divisionMatches || divisionMatches.length === 0) {
    return null;
  }

  // Create lookup for standings
  const standingMap = new Map<string, { rank: number; points: number; goalDifference: number; division: string }>();
  for (const s of standings) {
    standingMap.set(s.playerId, {
      rank: s.rank || 1,
      points: s.points || 0,
      goalDifference: s.goalDifference || 0,
      division: s.division || division,
    });
  }

  const scoredMatches = divisionMatches.map((match) => {
    const home = standingMap.get(match.homePlayerId) || { rank: 20, points: 0, goalDifference: 0, division };
    const away = standingMap.get(match.awayPlayerId) || { rank: 20, points: 0, goalDifference: 0, division };

    // 1. Combined Table Points (Higher table points = bigger clash)
    const pointsScore = (home.points + away.points) * 15;

    // 2. Combined Rank Score: Lower rank is better (#1 vs #2 = sum 3 -> score 37 * 10 = 370)
    const rankSum = home.rank + away.rank;
    const rankScore = Math.max(0, 42 - rankSum) * 10;

    // 3. Proximity Clash Bonus: If both are top 4 and close in rank
    let proximityBonus = 0;
    if (home.rank <= 4 && away.rank <= 4) {
      proximityBonus += 150;
      if (Math.abs(home.rank - away.rank) <= 2) {
        proximityBonus += 100; // e.g. #1 vs #2 or #2 vs #3
      }
    } else if (home.rank <= 8 && away.rank <= 8) {
      proximityBonus += 50;
    }

    // 4. Goal Difference
    const gdScore = home.goalDifference + away.goalDifference;

    const totalClashScore = pointsScore + rankScore + proximityBonus + gdScore;

    let headline = `${division.toUpperCase()} SHOWDOWN`;
    if (home.rank <= 2 && away.rank <= 2) {
      headline = `${division.toUpperCase()} TITLE CLASH (#1 vs #2 Showdown)`;
    } else if (home.rank <= 4 && away.rank <= 4) {
      headline = `${division.toUpperCase()} TOP 4 BATTLE (#${home.rank} vs #${away.rank})`;
    } else if (division === "Division 1" && home.rank <= 8 && away.rank <= 8) {
      headline = `UCL QUALIFICATION RACE (#${home.rank} vs #${away.rank})`;
    } else if ((division === "Division 2" || division === "Division 3") && (home.rank <= 3 || away.rank <= 3)) {
      headline = `PROMOTION RACE CLASH (#${home.rank} vs #${away.rank})`;
    } else {
      headline = `${division} MATCH OF THE DAY (#${home.rank} vs #${away.rank})`;
    }

    return {
      match,
      clashScore: totalClashScore,
      homeRank: home.rank,
      awayRank: away.rank,
      homePoints: home.points,
      awayPoints: away.points,
      headline,
    };
  });

  // Sort descending by clashScore
  scoredMatches.sort((a, b) => b.clashScore - a.clashScore);

  const best = scoredMatches[0];
  if (!best) return null;

  return {
    ...best.match,
    motdHeadline: best.headline,
    motdHomeRank: best.homeRank,
    motdAwayRank: best.awayRank,
    motdHomePoints: best.homePoints,
    motdAwayPoints: best.awayPoints,
  };
}

/**
 * Evaluates the Match of the Day across all divisions.
 */
export function evaluateAllDivisionsMatchOfTheDay(
  matches: any[],
  standings: any[],
  roundNumber: number
): Record<string, any | null> {
  const divisions = ["Division 1", "Division 2", "Division 3"];
  const result: Record<string, any | null> = {};

  for (const div of divisions) {
    result[div] = evaluateDivisionMatchOfTheDay(matches, standings, roundNumber, div);
  }

  return result;
}

/**
 * Backward-compatible single MOTD helper
 */
export function evaluateMatchOfTheDay(
  matches: any[],
  standings: any[],
  roundNumber: number
): any | null {
  const allMotd = evaluateAllDivisionsMatchOfTheDay(matches, standings, roundNumber);
  return allMotd["Division 1"] || allMotd["Division 2"] || allMotd["Division 3"] || null;
}

/**
 * Persists the Match of the Day selections for all divisions in the database.
 */
export async function syncMatchOfTheDay(roundNumber: number): Promise<Record<string, any | null>> {
  const roundName = `Matchday ${roundNumber}`;

  // Reset existing MOTD flags for this round
  await prisma.match.updateMany({
    where: { round: roundName, isMatchOfTheDay: true },
    data: { isMatchOfTheDay: false },
  });

  const emptyResult = { "Division 1": null, "Division 2": null, "Division 3": null };

  // Rule: Except on the first round
  if (roundNumber <= 1) {
    return emptyResult;
  }

  // Fetch candidate matches for this round
  const matches = await prisma.match.findMany({
    where: { round: roundName },
    include: { homePlayer: true, awayPlayer: true },
  });

  if (matches.length === 0) return emptyResult;

  // Fetch all current standings
  const standings = await prisma.standing.findMany({
    orderBy: [{ points: "desc" }, { goalDifference: "desc" }],
  });

  const divisionalMotds = evaluateAllDivisionsMatchOfTheDay(matches, standings, roundNumber);

  // Update isMatchOfTheDay = true for each division's winner
  const motdIdsToUpdate: string[] = [];
  for (const div of Object.keys(divisionalMotds)) {
    const motd = divisionalMotds[div];
    if (motd && motd.id) {
      motdIdsToUpdate.push(motd.id);
    }
  }

  if (motdIdsToUpdate.length > 0) {
    await prisma.match.updateMany({
      where: { id: { in: motdIdsToUpdate } },
      data: { isMatchOfTheDay: true },
    });
  }

  return divisionalMotds;
}
