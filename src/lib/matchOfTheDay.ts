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

/**
 * Evaluates the Match of the Day for EACH group in UCL or Europa League
 * based on individual player performance in their domestic division league.
 */
export function evaluateContinentalGroupMotds(
  groupMatches: any[],
  domesticStandings: any[],
  competition: "UCL" | "EUROPA" = "UCL"
): Record<string, any | null> {
  const groups = ["Group A", "Group B", "Group C", "Group D"];
  const result: Record<string, any | null> = {
    "Group A": null,
    "Group B": null,
    "Group C": null,
    "Group D": null,
  };

  const standingMap = new Map<string, { rank: number; points: number; goalDifference: number; division: string }>();
  for (const s of domesticStandings) {
    // Only map domestic division standings
    if (s.division === "Division 1" || s.division === "Division 2" || s.division === "Division 3") {
      standingMap.set(s.playerId, {
        rank: s.rank || 1,
        points: s.points || 0,
        goalDifference: s.goalDifference || 0,
        division: s.division,
      });
    }
  }

  for (const grp of groups) {
    const matchesInGroup = groupMatches.filter(
      (m) =>
        (m.division === competition || m.competition === competition) &&
        (m.groupName === grp || m.notes?.includes(grp))
    );
    if (matchesInGroup.length === 0) continue;

    const scored = matchesInGroup.map((match) => {
      const home = standingMap.get(match.homePlayerId) || {
        rank: 10,
        points: 0,
        goalDifference: 0,
        division: match.homePlayer?.division || "Division 1",
      };
      const away = standingMap.get(match.awayPlayerId) || {
        rank: 10,
        points: 0,
        goalDifference: 0,
        division: match.awayPlayer?.division || "Division 1",
      };

      // Combined Performance Scoring based on domestic league metrics
      const pointsScore = (home.points + away.points) * 20;
      const rankScore = Math.max(0, 42 - (home.rank + away.rank)) * 15;
      const gdScore = (home.goalDifference + away.goalDifference) * 3;
      const ratingScore = ((match.homePlayer?.overallRating || 85) + (match.awayPlayer?.overallRating || 85)) * 2;

      const totalScore = pointsScore + rankScore + gdScore + ratingScore;
      const headline = `🌟 ${competition} ${grp.toUpperCase()} MARQUEE CLASH (${home.division} #${home.rank} vs ${away.division} #${away.rank})`;

      return {
        match,
        totalScore,
        headline,
        homeRank: home.rank,
        awayRank: away.rank,
        homePoints: home.points,
        awayPoints: away.points,
      };
    });

    scored.sort((a, b) => b.totalScore - a.totalScore);
    const best = scored[0];
    if (best) {
      result[grp] = {
        ...best.match,
        motdHeadline: best.headline,
        motdHomeRank: best.homeRank,
        motdAwayRank: best.awayRank,
        motdHomePoints: best.homePoints,
        motdAwayPoints: best.awayPoints,
        isMatchOfTheDay: true,
      };
    }
  }

  return result;
}

/**
 * Persists Match of the Day for all groups in UCL or Europa League.
 */
export async function syncContinentalGroupMotds(competition: "UCL" | "EUROPA"): Promise<Record<string, any | null>> {
  const matches = await prisma.match.findMany({
    where: {
      division: competition,
      stage: "GROUP",
    },
    include: { homePlayer: true, awayPlayer: true },
  });

  const domesticStandings = await prisma.standing.findMany({
    where: {
      division: { in: ["Division 1", "Division 2", "Division 3"] },
    },
  });

  const groupMotds = evaluateContinentalGroupMotds(matches, domesticStandings, competition);

  const motdIds = Object.values(groupMotds)
    .filter(Boolean)
    .map((m: any) => m.id);

  if (motdIds.length > 0) {
    // Reset other group matches
    await prisma.match.updateMany({
      where: {
        division: competition,
        stage: "GROUP",
        id: { notIn: motdIds },
      },
      data: { isMatchOfTheDay: false },
    });

    // Mark group MOTDs
    await prisma.match.updateMany({
      where: { id: { in: motdIds } },
      data: { isMatchOfTheDay: true },
    });
  }

  return groupMotds;
}
