import { prisma } from "@/lib/prisma";

export interface PlayerCareerStats {
  playerId?: string;
  gamerTag: string;
  fullName?: string | null;
  avatar?: string | null;
  country?: string;
  quote?: string | null;
  currentDivision?: string;
  divisionsParticipated: string[];
  seasonsParticipated: string[];
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  goalsScored: number;
  goalsConceded: number;
  goalDifference: number;
  winPercentage: number;
  cleanSheets: number;
  leagueTitles: number; // Division 1 titles
  uclTitles: number;
  europaTitles: number;
  d2Titles: number;
  d3Titles: number;
  totalTrophies: number;
  finalsReached: number;
  finalsWon: number;
  currentWinStreak: number;
  longestWinStreak: number;
  isInducted: boolean;
  isFeatured: boolean;
  isStatisticallyEligible: boolean;
  seasonBreakdown: Record<
    string,
    {
      season: string;
      matchesPlayed: number;
      wins: number;
      draws: number;
      losses: number;
      goalsScored: number;
      goalsConceded: number;
      goalDifference: number;
      cleanSheets: number;
      winPercentage: number;
      trophiesWon: number;
      competitions: string[];
    }
  >;
  competitionBreakdown: Record<
    string,
    {
      competition: string;
      matchesPlayed: number;
      wins: number;
      draws: number;
      losses: number;
      goalsScored: number;
      goalsConceded: number;
      cleanSheets: number;
      trophiesWon: number;
    }
  >;
  officialMatchesSummary: {
    matchId: string;
    date: string;
    season: string;
    competition: string;
    roundOrStage: string;
    opponentGamerTag: string;
    homeOrAway: "HOME" | "AWAY";
    playerScore: number;
    opponentScore: number;
    result: "W" | "D" | "L";
  }[];
}

export interface RecordHolder {
  playerId?: string;
  gamerTag: string;
  fullName?: string | null;
  avatar?: string | null;
  currentDivision?: string;
  detail?: string;
}

export interface AllTimeRecord {
  id: string;
  recordKey: string;
  title: string;
  category: "TITLES" | "GOALS" | "WINS" | "MATCHES" | "WIN_RATE" | "STREAK" | "FINALS" | "TROPHIES" | "CLEAN_SHEETS" | "HISTORICAL";
  valueFormatted: string;
  numericValue: number;
  holders: RecordHolder[];
  sourceType: "AUTOMATIC" | "MANUAL";
  transparencyNote: string;
  season?: string | null;
  competition?: string | null;
  supportingImageUrl?: string | null;
}

export interface HallOfFameStatsResult {
  lastUpdated: string;
  settings: {
    minMatchesForRecords: number;
    minMatchesForInduction: number;
    minSeasonsForInduction: number;
    lastCalculatedAt: string | null;
    calculationStatus: string;
  };
  metrics: {
    totalOfficialMatchesProcessed: number;
    totalGoalsProcessed: number;
    totalPlayersAnalyzed: number;
    totalSeasonsAnalyzed: number;
    totalCompetitionsAnalyzed: number;
    totalInductedLegends: number;
  };
  allTimeRecords: AllTimeRecord[];
  manualRecords: AllTimeRecord[];
  players: PlayerCareerStats[];
  inductedLegends: PlayerCareerStats[];
  featuredLegends: PlayerCareerStats[];
  hasOfficialData: boolean;
}

/**
 * Normalizes competition name into canonical categories:
 * Division 1, Division 2, Division 3, UCL, EUROPA, or Other
 */
function normalizeCompetition(rawName?: string | null): string {
  if (!rawName) return "Division 1";
  const upper = rawName.toUpperCase();
  if (upper.includes("DIVISION 1") || upper.includes("PREMIERSHIP")) return "Division 1";
  if (upper.includes("DIVISION 2") || upper.includes("CHAMPIONSHIP")) return "Division 2";
  if (upper.includes("DIVISION 3") || upper.includes("CONFERENCE")) return "Division 3";
  if (upper.includes("UCL") || upper.includes("CHAMPIONS LEAGUE")) return "UCL";
  if (upper.includes("EUROPA")) return "EUROPA";
  return rawName.trim();
}

/**
 * Server-side Hall of Fame Statistical Engine
 * Calculates player statistics, all-time records, competition and season breakdowns
 * using only verified official match fixtures and historical snapshots.
 */
export async function calculateHallOfFameStats(): Promise<HallOfFameStatsResult> {
  // 1. Fetch settings
  let settings = await prisma.hallOfFameSettings.findUnique({
    where: { id: "default" },
  });

  if (!settings) {
    settings = await prisma.hallOfFameSettings.create({
      data: {
        id: "default",
        minMatchesForRecords: 10,
        minMatchesForInduction: 10,
        minSeasonsForInduction: 1,
        calculationStatus: "PROCESSING",
      },
    });
  } else {
    await prisma.hallOfFameSettings.update({
      where: { id: "default" },
      data: { calculationStatus: "PROCESSING" },
    });
  }

  // 2. Fetch all official match results
  // Only official / finished matches count (Requirement 05)
  const officialMatches = await prisma.match.findMany({
    where: {
      status: { in: ["FINISHED", "FORFEIT"] },
      homeScore: { not: null },
      awayScore: { not: null },
    },
    include: {
      homePlayer: true,
      awayPlayer: true,
      tournament: true,
    },
    orderBy: { matchDate: "asc" },
  });

  // 3. Fetch historical snapshots (Requirement 08)
  const historicalSnapshots = await prisma.historicalSeasonSnapshot.findMany({
    orderBy: { season: "asc" },
  });

  // 4. Fetch all active/registered players
  const allPlayers = await prisma.player.findMany({
    include: { user: true },
  });

  // 5. Fetch Hall of Fame inductees
  const hallOfFameEntries = await prisma.hallOfFame.findMany({
    orderBy: [{ season: "desc" }, { createdAt: "desc" }],
  });

  // 6. Fetch manual historical records (Requirement 11)
  const manualHistoricalRecords = await prisma.manualHistoricalRecord.findMany({
    orderBy: [{ recordDate: "desc" }, { createdAt: "desc" }],
  });

  // Player Map by gamerTag (case-insensitive key)
  const playersMap = new Map<string, PlayerCareerStats>();

  const getOrCreatePlayerStats = (
    gamerTag: string,
    fallbackPlayerId?: string,
    fallbackFullName?: string | null,
    fallbackAvatar?: string | null,
    fallbackDivision?: string
  ): PlayerCareerStats => {
    const key = gamerTag.trim().toLowerCase();
    if (!playersMap.has(key)) {
      playersMap.set(key, {
        playerId: fallbackPlayerId,
        gamerTag: gamerTag.trim(),
        fullName: fallbackFullName || null,
        avatar: fallbackAvatar || null,
        currentDivision: fallbackDivision || "Division 1",
        divisionsParticipated: [],
        seasonsParticipated: [],
        matchesPlayed: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsScored: 0,
        goalsConceded: 0,
        goalDifference: 0,
        winPercentage: 0,
        cleanSheets: 0,
        leagueTitles: 0,
        uclTitles: 0,
        europaTitles: 0,
        d2Titles: 0,
        d3Titles: 0,
        totalTrophies: 0,
        finalsReached: 0,
        finalsWon: 0,
        currentWinStreak: 0,
        longestWinStreak: 0,
        isInducted: false,
        isFeatured: false,
        isStatisticallyEligible: false,
        seasonBreakdown: {},
        competitionBreakdown: {},
        officialMatchesSummary: [],
      });
    }
    return playersMap.get(key)!;
  };

  // Seed with all known registered players
  for (const p of allPlayers) {
    const stats = getOrCreatePlayerStats(
      p.gamerTag,
      p.id,
      p.fullName,
      p.avatar,
      p.division
    );
    stats.country = (p as any).country || "RW";
    stats.quote = (p as any).quote || null;
    if (p.division && !stats.divisionsParticipated.includes(p.division)) {
      stats.divisionsParticipated.push(p.division);
    }
  }

  // Also seed with Hall of Fame inductees if they don't exist as active players
  for (const hof of hallOfFameEntries) {
    const stats = getOrCreatePlayerStats(
      hof.championName,
      hof.playerId || undefined,
      hof.championRealName,
      hof.playerImage
    );
    stats.isInducted = hof.isInducted ?? true;
    if (hof.isFeatured) stats.isFeatured = true;
    if (hof.playerImage && !stats.avatar) stats.avatar = hof.playerImage;
    if (hof.championRealName && !stats.fullName) stats.fullName = hof.championRealName;
  }

  // Tracking matches per player chronologically for streak calculations
  const playerMatchHistory = new Map<string, Array<{ isWin: boolean; isDraw: boolean; isLoss: boolean; date: Date }>>();

  let totalGoalsCount = 0;
  const seasonsSet = new Set<string>();
  const compsSet = new Set<string>();

  // Process official finished matches
  for (const m of officialMatches) {
    const season = m.tournament?.season || "2026";
    const rawComp = m.division;
    const normComp = normalizeCompetition(rawComp);
    seasonsSet.add(season);
    compsSet.add(normComp);

    const hPlayer = m.homePlayer;
    const aPlayer = m.awayPlayer;
    if (!hPlayer || !aPlayer) continue;

    const hStats = getOrCreatePlayerStats(hPlayer.gamerTag, hPlayer.id, hPlayer.fullName, hPlayer.avatar, hPlayer.division);
    const aStats = getOrCreatePlayerStats(aPlayer.gamerTag, aPlayer.id, aPlayer.fullName, aPlayer.avatar, aPlayer.division);

    const isDomestic = !normComp.includes("UCL") && !normComp.includes("EUROPA");
    const hScore = isDomestic ? (m.homeScore ?? 0) : (m.aggregateHomeScore ?? m.homeScore ?? 0);
    const aScore = isDomestic ? (m.awayScore ?? 0) : (m.aggregateAwayScore ?? m.awayScore ?? 0);

    totalGoalsCount += hScore + aScore;

    // Matches played
    hStats.matchesPlayed += 1;
    aStats.matchesPlayed += 1;

    // Goals
    hStats.goalsScored += hScore;
    hStats.goalsConceded += aScore;
    aStats.goalsScored += aScore;
    aStats.goalsConceded += hScore;

    // Clean sheets
    if (aScore === 0) hStats.cleanSheets += 1;
    if (hScore === 0) aStats.cleanSheets += 1;

    // Result
    const hWon = hScore > aScore;
    const aWon = aScore > hScore;
    const isDraw = hScore === aScore;

    if (hWon) {
      hStats.wins += 1;
      aStats.losses += 1;
    } else if (aWon) {
      aStats.wins += 1;
      hStats.losses += 1;
    } else {
      hStats.draws += 1;
      aStats.draws += 1;
    }

    // Finals reached and won
    const isFinalStage = m.stage === "FINAL";
    if (isFinalStage) {
      hStats.finalsReached += 1;
      aStats.finalsReached += 1;
      if (hWon) hStats.finalsWon += 1;
      if (aWon) aStats.finalsWon += 1;
    }

    // Seasons participated
    if (!hStats.seasonsParticipated.includes(season)) hStats.seasonsParticipated.push(season);
    if (!aStats.seasonsParticipated.includes(season)) aStats.seasonsParticipated.push(season);

    // Divisions participated
    if (!hStats.divisionsParticipated.includes(normComp)) hStats.divisionsParticipated.push(normComp);
    if (!aStats.divisionsParticipated.includes(normComp)) aStats.divisionsParticipated.push(normComp);

    // Track chronological match for streaks
    const matchDate = m.matchDate || m.createdAt;
    const hKey = hStats.gamerTag.toLowerCase();
    const aKey = aStats.gamerTag.toLowerCase();
    if (!playerMatchHistory.has(hKey)) playerMatchHistory.set(hKey, []);
    if (!playerMatchHistory.has(aKey)) playerMatchHistory.set(aKey, []);

    playerMatchHistory.get(hKey)!.push({ isWin: hWon, isDraw, isLoss: aWon, date: matchDate });
    playerMatchHistory.get(aKey)!.push({ isWin: aWon, isDraw, isLoss: hWon, date: matchDate });

    // Official match summary for transparency
    hStats.officialMatchesSummary.push({
      matchId: m.id,
      date: matchDate.toISOString(),
      season,
      competition: normComp,
      roundOrStage: m.stage === "FINAL" ? "Grand Final" : m.round,
      opponentGamerTag: aPlayer.gamerTag,
      homeOrAway: "HOME",
      playerScore: hScore,
      opponentScore: aScore,
      result: hWon ? "W" : isDraw ? "D" : "L",
    });

    aStats.officialMatchesSummary.push({
      matchId: m.id,
      date: matchDate.toISOString(),
      season,
      competition: normComp,
      roundOrStage: m.stage === "FINAL" ? "Grand Final" : m.round,
      opponentGamerTag: hPlayer.gamerTag,
      homeOrAway: "AWAY",
      playerScore: aScore,
      opponentScore: hScore,
      result: aWon ? "W" : isDraw ? "D" : "L",
    });

    // Season breakdown
    const updateBreakdown = (
      pStats: PlayerCareerStats,
      scored: number,
      conceded: number,
      won: boolean,
      draw: boolean,
      lost: boolean
    ) => {
      if (!pStats.seasonBreakdown[season]) {
        pStats.seasonBreakdown[season] = {
          season,
          matchesPlayed: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          goalsScored: 0,
          goalsConceded: 0,
          goalDifference: 0,
          cleanSheets: 0,
          winPercentage: 0,
          trophiesWon: 0,
          competitions: [],
        };
      }
      const sEntry = pStats.seasonBreakdown[season];
      sEntry.matchesPlayed += 1;
      sEntry.goalsScored += scored;
      sEntry.goalsConceded += conceded;
      sEntry.goalDifference = sEntry.goalsScored - sEntry.goalsConceded;
      if (conceded === 0) sEntry.cleanSheets += 1;
      if (won) sEntry.wins += 1;
      if (draw) sEntry.draws += 1;
      if (lost) sEntry.losses += 1;
      if (!sEntry.competitions.includes(normComp)) sEntry.competitions.push(normComp);
      sEntry.winPercentage = sEntry.matchesPlayed > 0 ? (sEntry.wins / sEntry.matchesPlayed) * 100 : 0;

      // Competition breakdown
      if (!pStats.competitionBreakdown[normComp]) {
        pStats.competitionBreakdown[normComp] = {
          competition: normComp,
          matchesPlayed: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          goalsScored: 0,
          goalsConceded: 0,
          cleanSheets: 0,
          trophiesWon: 0,
        };
      }
      const cEntry = pStats.competitionBreakdown[normComp];
      cEntry.matchesPlayed += 1;
      cEntry.goalsScored += scored;
      cEntry.goalsConceded += conceded;
      if (conceded === 0) cEntry.cleanSheets += 1;
      if (won) cEntry.wins += 1;
      if (draw) cEntry.draws += 1;
      if (lost) cEntry.losses += 1;
    };

    updateBreakdown(hStats, hScore, aScore, hWon, isDraw, aWon);
    updateBreakdown(aStats, aScore, hScore, aWon, isDraw, hWon);
  }

  // Merge historical season snapshots (if seasons were archived in the past)
  for (const snap of historicalSnapshots) {
    const season = snap.season;
    const normComp = normalizeCompetition(snap.competition);
    seasonsSet.add(season);
    compsSet.add(normComp);

    const stats = getOrCreatePlayerStats(snap.gamerTag, snap.playerId || undefined, snap.fullName);
    if (!stats.seasonsParticipated.includes(season)) stats.seasonsParticipated.push(season);
    if (!stats.divisionsParticipated.includes(normComp)) stats.divisionsParticipated.push(normComp);

    // Only add if not already counted by live matches for this season+competition
    const alreadyProcessed = stats.seasonBreakdown[season]?.competitions.includes(normComp);
    if (!alreadyProcessed) {
      stats.matchesPlayed += snap.matchesPlayed;
      stats.wins += snap.wins;
      stats.draws += snap.draws;
      stats.losses += snap.losses;
      stats.goalsScored += snap.goalsScored;
      stats.goalsConceded += snap.goalsConceded;
      stats.cleanSheets += snap.cleanSheets;

      if (!stats.seasonBreakdown[season]) {
        stats.seasonBreakdown[season] = {
          season,
          matchesPlayed: snap.matchesPlayed,
          wins: snap.wins,
          draws: snap.draws,
          losses: snap.losses,
          goalsScored: snap.goalsScored,
          goalsConceded: snap.goalsConceded,
          goalDifference: snap.goalDifference,
          cleanSheets: snap.cleanSheets,
          winPercentage: snap.matchesPlayed > 0 ? (snap.wins / snap.matchesPlayed) * 100 : 0,
          trophiesWon: snap.isChampion ? 1 : 0,
          competitions: [normComp],
        };
      } else {
        const s = stats.seasonBreakdown[season];
        s.matchesPlayed += snap.matchesPlayed;
        s.wins += snap.wins;
        s.draws += snap.draws;
        s.losses += snap.losses;
        s.goalsScored += snap.goalsScored;
        s.goalsConceded += snap.goalsConceded;
        s.goalDifference = s.goalsScored - s.goalsConceded;
        s.cleanSheets += snap.cleanSheets;
        if (snap.isChampion) s.trophiesWon += 1;
        if (!s.competitions.includes(normComp)) s.competitions.push(normComp);
        s.winPercentage = s.matchesPlayed > 0 ? (s.wins / s.matchesPlayed) * 100 : 0;
      }

      if (!stats.competitionBreakdown[normComp]) {
        stats.competitionBreakdown[normComp] = {
          competition: normComp,
          matchesPlayed: snap.matchesPlayed,
          wins: snap.wins,
          draws: snap.draws,
          losses: snap.losses,
          goalsScored: snap.goalsScored,
          goalsConceded: snap.goalsConceded,
          cleanSheets: snap.cleanSheets,
          trophiesWon: snap.isChampion ? 1 : 0,
        };
      } else {
        const c = stats.competitionBreakdown[normComp];
        c.matchesPlayed += snap.matchesPlayed;
        c.wins += snap.wins;
        c.draws += snap.draws;
        c.losses += snap.losses;
        c.goalsScored += snap.goalsScored;
        c.goalsConceded += snap.goalsConceded;
        c.cleanSheets += snap.cleanSheets;
        if (snap.isChampion) c.trophiesWon += 1;
      }
    }

    if (snap.isChampion) {
      if (normComp === "Division 1") stats.leagueTitles += 1;
      else if (normComp === "UCL") stats.uclTitles += 1;
      else if (normComp === "EUROPA") stats.europaTitles += 1;
      else if (normComp === "Division 2") stats.d2Titles += 1;
      else if (normComp === "Division 3") stats.d3Titles += 1;
    }
  }

  // Process official Hall of Fame tournament titles
  for (const hof of hallOfFameEntries) {
    const stats = getOrCreatePlayerStats(hof.championName);
    const tournamentUpper = hof.tournamentName.toUpperCase();
    const isUcl = hof.trophyType === "UCL" || tournamentUpper.includes("UCL") || tournamentUpper.includes("CHAMPIONS LEAGUE");
    const isEuropa = hof.trophyType === "EUROPA" || tournamentUpper.includes("EUROPA");
    const isDiv1 = tournamentUpper.includes("DIVISION 1") || tournamentUpper.includes("PREMIERSHIP");
    const isDiv2 = tournamentUpper.includes("DIVISION 2") || tournamentUpper.includes("CHAMPIONSHIP");
    const isDiv3 = tournamentUpper.includes("DIVISION 3") || tournamentUpper.includes("CONFERENCE");

    if (isDiv1) stats.leagueTitles += 1;
    else if (isUcl) stats.uclTitles += 1;
    else if (isEuropa) stats.europaTitles += 1;
    else if (isDiv2) stats.d2Titles += 1;
    else if (isDiv3) stats.d3Titles += 1;
    else stats.leagueTitles += 1; // Default premier title

    // Update season and competition trophies
    const season = hof.season || "Season 2026";
    if (!stats.seasonsParticipated.includes(season)) stats.seasonsParticipated.push(season);
    if (stats.seasonBreakdown[season]) {
      stats.seasonBreakdown[season].trophiesWon += 1;
    }
    const compName = isUcl ? "UCL" : isEuropa ? "EUROPA" : isDiv2 ? "Division 2" : isDiv3 ? "Division 3" : "Division 1";
    if (stats.competitionBreakdown[compName]) {
      stats.competitionBreakdown[compName].trophiesWon += 1;
    }
  }

  // Calculate final derived stats for each player
  const minMatchesForRecords = settings.minMatchesForRecords ?? 10;
  const minMatchesForInduction = settings.minMatchesForInduction ?? 10;

  for (const stats of playersMap.values()) {
    stats.goalDifference = stats.goalsScored - stats.goalsConceded;
    stats.winPercentage = stats.matchesPlayed > 0 ? (stats.wins / stats.matchesPlayed) * 100 : 0;
    stats.totalTrophies =
      stats.leagueTitles +
      stats.uclTitles +
      stats.europaTitles +
      stats.d2Titles +
      stats.d3Titles;

    // Statistical eligibility (Requirement 09)
    stats.isStatisticallyEligible =
      stats.matchesPlayed >= minMatchesForRecords || stats.totalTrophies > 0;

    // Calculate streaks from chronological match history
    const history = playerMatchHistory.get(stats.gamerTag.toLowerCase()) || [];
    history.sort((a, b) => a.date.getTime() - b.date.getTime());

    let currentStreak = 0;
    let longestStreak = 0;
    let runningStreak = 0;

    for (const match of history) {
      if (match.isWin) {
        runningStreak += 1;
        if (runningStreak > longestStreak) longestStreak = runningStreak;
      } else {
        runningStreak = 0;
      }
    }

    // Current win streak: iterate backwards from the latest match
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i].isWin) {
        currentStreak += 1;
      } else {
        break;
      }
    }

    stats.currentWinStreak = currentStreak;
    stats.longestWinStreak = longestStreak;
  }

  const allPlayersList = Array.from(playersMap.values());

  // Determine All-Time Records (Requirement 02 & 10)
  // Only calculate automatic records if official matches or historical snapshots exist (Requirement 16)
  const hasOfficialData = officialMatches.length > 0 || historicalSnapshots.length > 0;
  const allTimeRecords: AllTimeRecord[] = [];

  if (hasOfficialData) {
    // 1. MOST TITLES
    const maxTitles = Math.max(...allPlayersList.map((p) => p.totalTrophies), 0);
    if (maxTitles > 0) {
      const holders = allPlayersList
        .filter((p) => p.totalTrophies === maxTitles)
        .map((p) => ({
          playerId: p.playerId,
          gamerTag: p.gamerTag,
          fullName: p.fullName,
          avatar: p.avatar,
          currentDivision: p.currentDivision,
          detail: `${p.leagueTitles} League • ${p.uclTitles} UCL • ${p.europaTitles} Europa • ${p.d2Titles + p.d3Titles} Lower Tier`,
        }));
      allTimeRecords.push({
        id: "rec_most_titles",
        recordKey: "MOST_TITLES",
        title: "Most Championships Won",
        category: "TITLES",
        valueFormatted: `${maxTitles} ${maxTitles === 1 ? "Title" : "Titles"}`,
        numericValue: maxTitles,
        holders,
        sourceType: "AUTOMATIC",
        transparencyNote: `Verified across all domestic league tiers, UCL, and Europa League competitions`,
      });
    }

    // 2. MOST GOALS
    const maxGoals = Math.max(...allPlayersList.map((p) => p.goalsScored), 0);
    if (maxGoals > 0) {
      const holders = allPlayersList
        .filter((p) => p.goalsScored === maxGoals)
        .map((p) => ({
          playerId: p.playerId,
          gamerTag: p.gamerTag,
          fullName: p.fullName,
          avatar: p.avatar,
          currentDivision: p.currentDivision,
          detail: `${p.matchesPlayed} matches (${(p.goalsScored / Math.max(p.matchesPlayed, 1)).toFixed(2)} goals/match)`,
        }));
      allTimeRecords.push({
        id: "rec_most_goals",
        recordKey: "MOST_GOALS",
        title: "All-Time Top Goalscorer",
        category: "GOALS",
        valueFormatted: `${maxGoals} Goals`,
        numericValue: maxGoals,
        holders,
        sourceType: "AUTOMATIC",
        transparencyNote: `Accumulated across official league matches and knockout fixtures`,
      });
    }

    // 3. MOST WINS
    const maxWins = Math.max(...allPlayersList.map((p) => p.wins), 0);
    if (maxWins > 0) {
      const holders = allPlayersList
        .filter((p) => p.wins === maxWins)
        .map((p) => ({
          playerId: p.playerId,
          gamerTag: p.gamerTag,
          fullName: p.fullName,
          avatar: p.avatar,
          currentDivision: p.currentDivision,
          detail: `${p.matchesPlayed} matches played (${p.winPercentage.toFixed(1)}% win rate)`,
        }));
      allTimeRecords.push({
        id: "rec_most_wins",
        recordKey: "MOST_WINS",
        title: "Most Match Victories",
        category: "WINS",
        valueFormatted: `${maxWins} Wins`,
        numericValue: maxWins,
        holders,
        sourceType: "AUTOMATIC",
        transparencyNote: `Counted from verified official match victories`,
      });
    }

    // 4. MOST MATCHES
    const maxMatches = Math.max(...allPlayersList.map((p) => p.matchesPlayed), 0);
    if (maxMatches > 0) {
      const holders = allPlayersList
        .filter((p) => p.matchesPlayed === maxMatches)
        .map((p) => ({
          playerId: p.playerId,
          gamerTag: p.gamerTag,
          fullName: p.fullName,
          avatar: p.avatar,
          currentDivision: p.currentDivision,
          detail: `${p.seasonsParticipated.length} active season(s)`,
        }));
      allTimeRecords.push({
        id: "rec_most_matches",
        recordKey: "MOST_MATCHES",
        title: "Most Appearances",
        category: "MATCHES",
        valueFormatted: `${maxMatches} Matches`,
        numericValue: maxMatches,
        holders,
        sourceType: "AUTOMATIC",
        transparencyNote: `Officially verified matches completed in the league database`,
      });
    }

    // 5. BEST WIN RATE (minimum matches required for record eligibility)
    const eligibleForWinRate = allPlayersList.filter((p) => p.matchesPlayed >= minMatchesForRecords);
    if (eligibleForWinRate.length > 0) {
      const maxWinRate = Math.max(...eligibleForWinRate.map((p) => p.winPercentage), 0);
      if (maxWinRate > 0) {
        const holders = eligibleForWinRate
          .filter((p) => Math.abs(p.winPercentage - maxWinRate) < 0.01)
          .map((p) => ({
            playerId: p.playerId,
            gamerTag: p.gamerTag,
            fullName: p.fullName,
            avatar: p.avatar,
            currentDivision: p.currentDivision,
            detail: `${p.wins} wins in ${p.matchesPlayed} matches`,
          }));
        allTimeRecords.push({
          id: "rec_best_win_rate",
          recordKey: "BEST_WIN_RATE",
          title: "Highest Win Percentage",
          category: "WIN_RATE",
          valueFormatted: `${maxWinRate.toFixed(1)}%`,
          numericValue: parseFloat(maxWinRate.toFixed(1)),
          holders,
          sourceType: "AUTOMATIC",
          transparencyNote: `Calculated as Wins ÷ Matches × 100 (Minimum ${minMatchesForRecords} matches required)`,
        });
      }
    }

    // 6. LONGEST WIN STREAK
    const maxStreak = Math.max(...allPlayersList.map((p) => p.longestWinStreak), 0);
    if (maxStreak > 0) {
      const holders = allPlayersList
        .filter((p) => p.longestWinStreak === maxStreak)
        .map((p) => ({
          playerId: p.playerId,
          gamerTag: p.gamerTag,
          fullName: p.fullName,
          avatar: p.avatar,
          currentDivision: p.currentDivision,
          detail: `Consecutive match victories without a draw or defeat`,
        }));
      allTimeRecords.push({
        id: "rec_longest_win_streak",
        recordKey: "LONGEST_WIN_STREAK",
        title: "Longest Winning Streak",
        category: "STREAK",
        valueFormatted: `${maxStreak} ${maxStreak === 1 ? "Win" : "Wins"}`,
        numericValue: maxStreak,
        holders,
        sourceType: "AUTOMATIC",
        transparencyNote: `Maximum consecutive sequence of official match victories`,
      });
    }

    // 7. MOST CLEAN SHEETS
    const maxCleanSheets = Math.max(...allPlayersList.map((p) => p.cleanSheets), 0);
    if (maxCleanSheets > 0) {
      const holders = allPlayersList
        .filter((p) => p.cleanSheets === maxCleanSheets)
        .map((p) => ({
          playerId: p.playerId,
          gamerTag: p.gamerTag,
          fullName: p.fullName,
          avatar: p.avatar,
          currentDivision: p.currentDivision,
          detail: `${p.cleanSheets} clean sheets in ${p.matchesPlayed} appearances`,
        }));
      allTimeRecords.push({
        id: "rec_most_clean_sheets",
        recordKey: "MOST_CLEAN_SHEETS",
        title: "Most Clean Sheets",
        category: "CLEAN_SHEETS",
        valueFormatted: `${maxCleanSheets} Clean Sheets`,
        numericValue: maxCleanSheets,
        holders,
        sourceType: "AUTOMATIC",
        transparencyNote: `Matches where opponent scored zero goals in official regulation play`,
      });
    }

    // 8. MOST FINALS REACHED
    const maxFinals = Math.max(...allPlayersList.map((p) => p.finalsReached), 0);
    if (maxFinals > 0) {
      const holders = allPlayersList
        .filter((p) => p.finalsReached === maxFinals)
        .map((p) => ({
          playerId: p.playerId,
          gamerTag: p.gamerTag,
          fullName: p.fullName,
          avatar: p.avatar,
          currentDivision: p.currentDivision,
          detail: `${p.finalsWon} won out of ${p.finalsReached} finals`,
        }));
      allTimeRecords.push({
        id: "rec_most_finals",
        recordKey: "MOST_FINALS",
        title: "Most Grand Finals Reached",
        category: "FINALS",
        valueFormatted: `${maxFinals} Finals`,
        numericValue: maxFinals,
        holders,
        sourceType: "AUTOMATIC",
        transparencyNote: `Grand Final tournament appearances in official knockout brackets`,
      });
    }
  }

  // Convert Manual Historical Records (Requirement 11)
  const manualRecords: AllTimeRecord[] = manualHistoricalRecords.map((m) => ({
    id: m.id,
    recordKey: `MANUAL_${m.id}`,
    title: m.recordName,
    category: "HISTORICAL",
    valueFormatted: m.value,
    numericValue: m.numericValue || 0,
    holders: [
      {
        playerId: m.playerId || undefined,
        gamerTag: m.playerName,
        detail: m.description || undefined,
      },
    ],
    sourceType: "MANUAL",
    transparencyNote: m.description || "Manual historical record entered by commissioner office",
    season: m.season,
    competition: m.competition,
    supportingImageUrl: m.supportingImageUrl,
  }));

  // Inducted Legends vs Featured Legends - strictly players who have won any trophy
  const inductedLegends = allPlayersList.filter((p) => p.totalTrophies > 0);

  // All-Time Legend rule: The All-Time Legend must be the one who has the most official trophies only
  const maxCareerTrophies = Math.max(...allPlayersList.map((p) => p.totalTrophies), 0);
  const featuredLegends = maxCareerTrophies > 0
    ? allPlayersList.filter((p) => p.totalTrophies === maxCareerTrophies)
    : allPlayersList.filter((p) => p.isFeatured && p.totalTrophies > 0);

  // Sort players by trophies, wins, win rate, goals
  allPlayersList.sort((a, b) => {
    if (b.totalTrophies !== a.totalTrophies) return b.totalTrophies - a.totalTrophies;
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (b.goalsScored !== a.goalsScored) return b.goalsScored - a.goalsScored;
    return a.gamerTag.localeCompare(b.gamerTag);
  });

  const now = new Date();

  // Update Settings metrics
  await prisma.hallOfFameSettings.update({
    where: { id: "default" },
    data: {
      lastCalculatedAt: now,
      calculationStatus: "SUCCESS",
      totalMatchesProcessed: officialMatches.length,
      totalGoalsProcessed: totalGoalsCount,
      totalPlayersAnalyzed: allPlayersList.length,
      totalSeasonsAnalyzed: seasonsSet.size || 1,
      totalCompsAnalyzed: compsSet.size || 1,
    },
  });

  const result: HallOfFameStatsResult = {
    lastUpdated: now.toISOString(),
    settings: {
      minMatchesForRecords,
      minMatchesForInduction,
      minSeasonsForInduction: settings.minSeasonsForInduction ?? 1,
      lastCalculatedAt: now.toISOString(),
      calculationStatus: "SUCCESS",
    },
    metrics: {
      totalOfficialMatchesProcessed: officialMatches.length,
      totalGoalsProcessed: totalGoalsCount,
      totalPlayersAnalyzed: allPlayersList.length,
      totalSeasonsAnalyzed: seasonsSet.size || (officialMatches.length > 0 ? 1 : 0),
      totalCompetitionsAnalyzed: compsSet.size || (officialMatches.length > 0 ? 1 : 0),
      totalInductedLegends: inductedLegends.length,
    },
    allTimeRecords,
    manualRecords,
    players: allPlayersList,
    inductedLegends,
    featuredLegends,
    hasOfficialData,
  };

  // Cache precomputed result (Requirement 14)
  try {
    await prisma.hallOfFameStatsCache.upsert({
      where: { id: "stats_cache" },
      update: {
        data: result as any,
        lastUpdated: now,
      },
      create: {
        id: "stats_cache",
        data: result as any,
        lastUpdated: now,
      },
    });
  } catch (cacheErr) {
    console.warn("HallOfFame stats caching warning:", cacheErr);
  }

  return result;
}

/**
 * Retrieves cached statistics if fresh, or calculates fresh on demand.
 */
export async function getHallOfFameStats(forceFresh = false): Promise<HallOfFameStatsResult> {
  if (!forceFresh) {
    try {
      const cached = await prisma.hallOfFameStatsCache.findUnique({
        where: { id: "stats_cache" },
      });
      if (cached && cached.data) {
        return cached.data as unknown as HallOfFameStatsResult;
      }
    } catch {
      // Fall through to calculation
    }
  }

  return await calculateHallOfFameStats();
}

/**
 * Invalidates cache so subsequent calls recompute data.
 */
export async function invalidateHallOfFameCache(): Promise<void> {
  try {
    await prisma.hallOfFameStatsCache.delete({
      where: { id: "stats_cache" },
    }).catch(() => {});
  } catch {
    // Ignore if not present
  }
}

/**
 * Snapshots the current season before a reset or transition.
 * Preserves historical records so future season changes do not destroy history (Requirement 08).
 */
export async function snapshotCurrentSeason(seasonName: string): Promise<number> {
  const standings = await prisma.standing.findMany({
    include: { player: true },
  });

  let snapshotsCreated = 0;
  for (const s of standings) {
    if (!s.player) continue;

    const isChamp = s.rank === 1;
    const isRunner = s.rank === 2;

    await prisma.historicalSeasonSnapshot.upsert({
      where: {
        season_competition_gamerTag: {
          season: seasonName,
          competition: s.division,
          gamerTag: s.player.gamerTag,
        },
      },
      update: {
        fullName: s.player.fullName,
        rank: s.rank,
        matchesPlayed: s.played,
        wins: s.won,
        draws: s.drawn,
        losses: s.lost,
        goalsScored: s.goalsFor,
        goalsConceded: s.goalsAgainst,
        goalDifference: s.goalDifference,
        points: s.points,
        isChampion: isChamp,
        isRunnerUp: isRunner,
      },
      create: {
        season: seasonName,
        competition: s.division,
        gamerTag: s.player.gamerTag,
        playerId: s.playerId,
        fullName: s.player.fullName,
        rank: s.rank,
        matchesPlayed: s.played,
        wins: s.won,
        draws: s.drawn,
        losses: s.lost,
        goalsScored: s.goalsFor,
        goalsConceded: s.goalsAgainst,
        goalDifference: s.goalDifference,
        points: s.points,
        isChampion: isChamp,
        isRunnerUp: isRunner,
      },
    });

    snapshotsCreated += 1;
  }

  return snapshotsCreated;
}
