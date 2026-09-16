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
 * Calculates the Match of the Day based on official league table standings.
 * User Rule: Except on the first round (Matchday 1).
 */
export function evaluateMatchOfTheDay(
  matches: any[],
  standings: any[],
  roundNumber: number
): any | null {
  // STRICT RULE: Except on the first round
  if (roundNumber <= 1) {
    return null;
  }

  if (!matches || matches.length === 0) {
    return null;
  }

  // Create lookup for standings
  const standingMap = new Map<string, { rank: number; points: number; goalDifference: number; division: string }>();
  for (const s of standings) {
    standingMap.set(s.playerId, {
      rank: s.rank || 1,
      points: s.points || 0,
      goalDifference: s.goalDifference || 0,
      division: s.division || "Division 1",
    });
  }

  const scoredMatches = matches.map((match) => {
    const home = standingMap.get(match.homePlayerId) || { rank: 20, points: 0, goalDifference: 0, division: match.division };
    const away = standingMap.get(match.awayPlayerId) || { rank: 20, points: 0, goalDifference: 0, division: match.division };

    // 1. Division Weight: Division 1 (Premiership) > Division 2 > Division 3
    let divisionWeight = 1000;
    if (match.division === "Division 2") divisionWeight = 500;
    if (match.division === "Division 3") divisionWeight = 200;

    // 2. Combined Table Points (Higher table points = bigger clash)
    const pointsScore = (home.points + away.points) * 15;

    // 3. Combined Rank Score: Lower rank is better (#1 vs #2 = sum 3 -> score 37 * 10 = 370)
    const rankSum = home.rank + away.rank;
    const rankScore = Math.max(0, 42 - rankSum) * 10;

    // 4. Proximity Clash Bonus: If both are top 4 and close in rank
    let proximityBonus = 0;
    if (home.rank <= 4 && away.rank <= 4) {
      proximityBonus += 150;
      if (Math.abs(home.rank - away.rank) <= 2) {
        proximityBonus += 100; // e.g. #1 vs #2 or #2 vs #3
      }
    } else if (home.rank <= 8 && away.rank <= 8) {
      proximityBonus += 50;
    }

    // 5. Goal Difference
    const gdScore = home.goalDifference + away.goalDifference;

    const totalClashScore = divisionWeight + pointsScore + rankScore + proximityBonus + gdScore;

    let headline = "HIGH-STAKES LEAGUE SHOWDOWN";
    if (home.rank <= 2 && away.rank <= 2) {
      headline = "TOP OF THE TABLE BLOCKBUSTER (#1 vs #2 Clash)";
    } else if (home.rank <= 4 && away.rank <= 4) {
      headline = `TOP 4 TITAN CLASH (#${home.rank} vs #${away.rank})`;
    } else if (home.rank <= 8 && away.rank <= 8) {
      headline = `UCL QUALIFICATION BATTLE (#${home.rank} vs #${away.rank})`;
    } else {
      headline = `${match.division} MATCH OF THE DAY (#${home.rank} vs #${away.rank})`;
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
 * Persists the Match of the Day selection in the database.
 * Resets existing isMatchOfTheDay for the round, and flags the highest clash.
 */
export async function syncMatchOfTheDay(roundNumber: number): Promise<any | null> {
  const roundName = `Matchday ${roundNumber}`;

  // Reset existing MOTD flags for this round
  await prisma.match.updateMany({
    where: { round: roundName, isMatchOfTheDay: true },
    data: { isMatchOfTheDay: false },
  });

  // Rule: Except on the first round
  if (roundNumber <= 1) {
    return null;
  }

  // Fetch candidate matches for this round
  const matches = await prisma.match.findMany({
    where: { round: roundName },
    include: { homePlayer: true, awayPlayer: true },
  });

  if (matches.length === 0) return null;

  // Fetch all current standings
  const standings = await prisma.standing.findMany({
    orderBy: [{ points: "desc" }, { goalDifference: "desc" }],
  });

  const selectedMotd = evaluateMatchOfTheDay(matches, standings, roundNumber);

  if (selectedMotd) {
    await prisma.match.update({
      where: { id: selectedMotd.id },
      data: { isMatchOfTheDay: true },
    });

    return selectedMotd;
  }

  return null;
}
