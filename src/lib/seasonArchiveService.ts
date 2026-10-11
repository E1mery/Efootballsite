import { prisma } from "@/lib/prisma";

export interface SeasonArchiveOverview {
  seasonName: string;
  isArchived: boolean;
  archivedAt?: string | null;
  totalCompetitions: number;
  totalMatches: number;
  totalGoals: number;
  totalAthletes: number;
  competitions: {
    competition: string;
    champion?: {
      gamerTag: string;
      fullName?: string | null;
      avatar?: string | null;
      division?: string;
    } | null;
    runnerUp?: {
      gamerTag: string;
      fullName?: string | null;
      avatar?: string | null;
    } | null;
    matchesPlayed: number;
    goalsScored: number;
    participantsCount: number;
  }[];
}

export interface SeasonArchiveStandingItem {
  id: string;
  season: string;
  competition: string;
  rank: number;
  gamerTag: string;
  fullName?: string | null;
  avatar?: string | null;
  realTeam?: string | null;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  isChampion: boolean;
  isRunnerUp: boolean;
}

export interface SeasonArchiveFixtureItem {
  id: string;
  season: string;
  competition: string;
  round: string;
  stage: string;
  groupName?: string | null;
  homeGamerTag: string;
  awayGamerTag: string;
  homePlayerName?: string | null;
  awayPlayerName?: string | null;
  homeScore?: number | null;
  awayScore?: number | null;
  leg2HomeScore?: number | null;
  leg2AwayScore?: number | null;
  aggregateHomeScore?: number | null;
  aggregateAwayScore?: number | null;
  status: string;
  matchDate?: string | null;
  winnerGamerTag?: string | null;
}

export interface SeasonArchiveStats {
  seasonName: string;
  totalMatches: number;
  totalGoals: number;
  averageGoalsPerMatch: number;
  cleanSheetsTotal: number;
  topScorers: {
    gamerTag: string;
    fullName?: string | null;
    competition: string;
    goals: number;
    matches: number;
  }[];
  bestDefenses: {
    gamerTag: string;
    fullName?: string | null;
    competition: string;
    cleanSheets: number;
    goalsConceded: number;
  }[];
  highestScoringMatches: {
    competition: string;
    round: string;
    homeGamerTag: string;
    awayGamerTag: string;
    homeScore: number;
    awayScore: number;
    totalGoals: number;
  }[];
}

export interface SeasonArchiveChampionItem {
  tournamentName: string;
  competition: string;
  season: string;
  championName: string;
  championRealName?: string | null;
  runnerUp?: string | null;
  trophyType: string;
  prizeWon?: string | null;
  notes?: string | null;
  avatar?: string | null;
}

export interface PromotionRelegationRecord {
  season: string;
  promotedToDiv1: { gamerTag: string; fullName?: string | null; rank: number; points: number }[];
  promotedToDiv2: { gamerTag: string; fullName?: string | null; rank: number; points: number }[];
  relegatedToDiv2: { gamerTag: string; fullName?: string | null; rank: number; points: number }[];
  relegatedToDiv3: { gamerTag: string; fullName?: string | null; rank: number; points: number }[];
}

export interface SeasonArchiveData {
  seasonName: string;
  isArchived: boolean;
  archivedAt?: string | null;
  competitionsList: string[];
  overview: SeasonArchiveOverview;
  standings: Record<string, SeasonArchiveStandingItem[]>;
  fixtures: Record<string, SeasonArchiveFixtureItem[]>;
  statistics: SeasonArchiveStats;
  champions: SeasonArchiveChampionItem[];
  promotionRelegation: PromotionRelegationRecord;
}

/**
 * Returns list of officially archived seasons.
 */
export async function getArchivedSeasonsList(): Promise<{
  seasonName: string;
  archivedAt: string;
  matchesCount: number;
  standingsCount: number;
}[]> {
  try {
    const list = await prisma.archivedSeason.findMany({
      orderBy: { archivedAt: "desc" },
    });
    return list.map((s) => ({
      seasonName: s.seasonName,
      archivedAt: s.archivedAt.toISOString(),
      matchesCount: s.matchesCount,
      standingsCount: s.standingsCount,
    }));
  } catch (err) {
    console.error("Error fetching archived seasons list:", err);
    return [];
  }
}

/**
 * Checks if a season is marked as officially archived.
 */
export async function isSeasonArchived(seasonName: string): Promise<boolean> {
  const record = await prisma.archivedSeason.findUnique({
    where: { seasonName },
  });
  return Boolean(record);
}

/**
 * Fetches authoritative archived season data strictly scoped to seasonName.
 * Never invents or mocks any records. If records do not exist, returns honest empty states.
 */
export async function getArchivedSeasonDetails(seasonName: string): Promise<SeasonArchiveData | null> {
  const archiveMeta = await prisma.archivedSeason.findUnique({
    where: { seasonName },
  });

  if (!archiveMeta) {
    return null;
  }

  // 1. Standings: from HistoricalSeasonSnapshot strictly for this season
  const snapshots = await prisma.historicalSeasonSnapshot.findMany({
    where: { season: seasonName },
    orderBy: [
      { competition: "asc" },
      { rank: "asc" },
      { points: "desc" },
      { goalDifference: "desc" },
    ],
  });

  // Enrich snapshots with player avatar if active player exists
  const gamerTags = [...new Set(snapshots.map((s) => s.gamerTag))];
  const players = await prisma.player.findMany({
    where: { gamerTag: { in: gamerTags } },
    select: { gamerTag: true, avatar: true, realTeam: true },
  });
  const playerMap = new Map(players.map((p) => [p.gamerTag.toLowerCase(), p]));

  // Group standings by competition
  const standingsMap: Record<string, SeasonArchiveStandingItem[]> = {};
  const competitionsSet = new Set<string>();

  for (const s of snapshots) {
    competitionsSet.add(s.competition);
    if (!standingsMap[s.competition]) {
      standingsMap[s.competition] = [];
    }
    const pInfo = playerMap.get(s.gamerTag.toLowerCase());
    standingsMap[s.competition].push({
      id: s.id,
      season: s.season,
      competition: s.competition,
      rank: s.rank ?? 0,
      gamerTag: s.gamerTag,
      fullName: s.fullName,
      avatar: pInfo?.avatar || null,
      realTeam: pInfo?.realTeam || null,
      played: s.matchesPlayed,
      won: s.wins,
      drawn: s.draws,
      lost: s.losses,
      goalsFor: s.goalsScored,
      goalsAgainst: s.goalsConceded,
      goalDifference: s.goalDifference,
      points: s.points,
      isChampion: s.isChampion,
      isRunnerUp: s.isRunnerUp,
    });
  }

  // 2. Fixtures & Results: from ArchivedMatch strictly for this season
  const archivedMatches = await prisma.archivedMatch.findMany({
    where: { season: seasonName },
    orderBy: [{ division: "asc" }, { round: "asc" }, { createdAt: "asc" }],
  });

  const fixturesMap: Record<string, SeasonArchiveFixtureItem[]> = {};
  for (const m of archivedMatches) {
    competitionsSet.add(m.division);
    if (!fixturesMap[m.division]) {
      fixturesMap[m.division] = [];
    }
    fixturesMap[m.division].push({
      id: m.id,
      season: m.season,
      competition: m.division,
      round: m.round,
      stage: m.stage,
      groupName: m.groupName,
      homeGamerTag: m.homeGamerTag,
      awayGamerTag: m.awayGamerTag,
      homePlayerName: m.homePlayerName,
      awayPlayerName: m.awayPlayerName,
      homeScore: m.homeScore,
      awayScore: m.awayScore,
      leg2HomeScore: m.leg2HomeScore,
      leg2AwayScore: m.leg2AwayScore,
      aggregateHomeScore: m.aggregateHomeScore,
      aggregateAwayScore: m.aggregateAwayScore,
      status: m.status,
      matchDate: m.matchDate?.toISOString() || null,
      winnerGamerTag: m.winnerGamerTag,
    });
  }

  // 3. Champions: from HallOfFame records matching this season
  const hofEntries = await prisma.hallOfFame.findMany({
    where: { season: seasonName },
    orderBy: { createdAt: "asc" },
  });

  const champions: SeasonArchiveChampionItem[] = hofEntries.map((h) => {
    let comp = "Division 1";
    const u = h.tournamentName.toUpperCase();
    if (u.includes("DIVISION 2") || u.includes("CHAMPIONSHIP")) comp = "Division 2";
    else if (u.includes("DIVISION 3") || u.includes("CONFERENCE") || u.includes("ACADEMY")) comp = "Division 3";
    else if (u.includes("UCL") || u.includes("CHAMPIONS LEAGUE")) comp = "UCL";
    else if (u.includes("EUROPA")) comp = "EUROPA";

    return {
      tournamentName: h.tournamentName,
      competition: comp,
      season: h.season,
      championName: h.championName,
      championRealName: h.championRealName,
      runnerUp: h.runnerUp,
      trophyType: h.trophyType,
      prizeWon: h.prizeWon,
      notes: h.notes,
      avatar: h.playerImage || null,
    };
  });

  // Canonical competitions ordering
  const canonicalOrder = ["Division 1", "Division 2", "Division 3", "UCL", "EUROPA"];
  const competitionsList = Array.from(competitionsSet).sort((a, b) => {
    const idxA = canonicalOrder.indexOf(a);
    const idxB = canonicalOrder.indexOf(b);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.localeCompare(b);
  });

  // 4. Statistics: aggregated solely from snapshots and archived matches
  let totalMatchesCount = archivedMatches.length;
  let totalGoalsSum = 0;

  for (const m of archivedMatches) {
    const h = m.homeScore ?? 0;
    const a = m.awayScore ?? 0;
    totalGoalsSum += h + a;
    if (m.leg2HomeScore !== null && m.leg2AwayScore !== null) {
      totalGoalsSum += (m.leg2HomeScore || 0) + (m.leg2AwayScore || 0);
    }
  }

  // If no archived matches were recorded but snapshots exist, calculate goals from standings
  if (totalMatchesCount === 0 && snapshots.length > 0) {
    const halfGoals = snapshots.reduce((acc, curr) => acc + curr.goalsScored, 0);
    totalGoalsSum = halfGoals;
    totalMatchesCount = Math.floor(snapshots.reduce((acc, curr) => acc + curr.matchesPlayed, 0) / 2);
  }

  const topScorers = snapshots
    .filter((s) => s.goalsScored > 0)
    .sort((a, b) => b.goalsScored - a.goalsScored)
    .slice(0, 5)
    .map((s) => ({
      gamerTag: s.gamerTag,
      fullName: s.fullName,
      competition: s.competition,
      goals: s.goalsScored,
      matches: s.matchesPlayed,
    }));

  const bestDefenses = snapshots
    .filter((s) => s.matchesPlayed > 0)
    .sort((a, b) => {
      if (b.cleanSheets !== a.cleanSheets) return b.cleanSheets - a.cleanSheets;
      return a.goalsConceded - b.goalsConceded;
    })
    .slice(0, 5)
    .map((s) => ({
      gamerTag: s.gamerTag,
      fullName: s.fullName,
      competition: s.competition,
      cleanSheets: s.cleanSheets,
      goalsConceded: s.goalsConceded,
    }));

  const highestScoringMatches = archivedMatches
    .map((m) => {
      const h = m.homeScore ?? 0;
      const a = m.awayScore ?? 0;
      return {
        competition: m.division,
        round: m.round,
        homeGamerTag: m.homeGamerTag,
        awayGamerTag: m.awayGamerTag,
        homeScore: h,
        awayScore: a,
        totalGoals: h + a,
      };
    })
    .sort((a, b) => b.totalGoals - a.totalGoals)
    .slice(0, 5);

  const cleanSheetsTotal = snapshots.reduce((acc, curr) => acc + curr.cleanSheets, 0);

  const statistics: SeasonArchiveStats = {
    seasonName,
    totalMatches: totalMatchesCount,
    totalGoals: totalGoalsSum,
    averageGoalsPerMatch:
      totalMatchesCount > 0 ? parseFloat((totalGoalsSum / totalMatchesCount).toFixed(2)) : 0,
    cleanSheetsTotal,
    topScorers,
    bestDefenses,
    highestScoringMatches,
  };

  // 5. Overview competitions breakdown
  const overviewCompetitions = competitionsList.map((comp) => {
    const compSnapshots = standingsMap[comp] || [];
    const compMatches = fixturesMap[comp] || [];
    const compChampionEntry = champions.find((c) => c.competition === comp);

    const champSnap = compSnapshots.find((s) => s.isChampion || s.rank === 1);
    const runnerSnap = compSnapshots.find((s) => s.isRunnerUp || s.rank === 2);

    let compGoals = compMatches.reduce((acc, m) => acc + (m.homeScore ?? 0) + (m.awayScore ?? 0), 0);
    if (compGoals === 0 && compSnapshots.length > 0) {
      compGoals = compSnapshots.reduce((acc, s) => acc + s.goalsFor, 0);
    }

    return {
      competition: comp,
      champion: compChampionEntry
        ? {
            gamerTag: compChampionEntry.championName,
            fullName: compChampionEntry.championRealName,
            avatar: compChampionEntry.avatar,
            division: comp,
          }
        : champSnap
        ? {
            gamerTag: champSnap.gamerTag,
            fullName: champSnap.fullName,
            avatar: champSnap.avatar,
            division: comp,
          }
        : null,
      runnerUp: compChampionEntry?.runnerUp
        ? {
            gamerTag: compChampionEntry.runnerUp,
            fullName: null,
            avatar: null,
          }
        : runnerSnap
        ? {
            gamerTag: runnerSnap.gamerTag,
            fullName: runnerSnap.fullName,
            avatar: runnerSnap.avatar,
          }
        : null,
      matchesPlayed: compMatches.length,
      goalsScored: compGoals,
      participantsCount: compSnapshots.length,
    };
  });

  const overview: SeasonArchiveOverview = {
    seasonName,
    isArchived: true,
    archivedAt: archiveMeta.archivedAt.toISOString(),
    totalCompetitions: competitionsList.length,
    totalMatches: totalMatchesCount,
    totalGoals: totalGoalsSum,
    totalAthletes: gamerTags.length,
    competitions: overviewCompetitions,
  };

  // 6. Promotion & Relegation: derived from official standings ranks
  const div1Snapshots = standingsMap["Division 1"] || [];
  const div2Snapshots = standingsMap["Division 2"] || [];
  const div3Snapshots = standingsMap["Division 3"] || [];

  // Relegations: bottom 3 of Div 1 & bottom 3 of Div 2 (if >= 4 players)
  const relegatedToDiv2 =
    div1Snapshots.length >= 4
      ? div1Snapshots.slice(-3).map((s) => ({
          gamerTag: s.gamerTag,
          fullName: s.fullName,
          rank: s.rank,
          points: s.points,
        }))
      : [];

  const relegatedToDiv3 =
    div2Snapshots.length >= 4
      ? div2Snapshots.slice(-3).map((s) => ({
          gamerTag: s.gamerTag,
          fullName: s.fullName,
          rank: s.rank,
          points: s.points,
        }))
      : [];

  // Promotions: top 3 of Div 2 & top 3 of Div 3
  const promotedToDiv1 = div2Snapshots.slice(0, 3).map((s) => ({
    gamerTag: s.gamerTag,
    fullName: s.fullName,
    rank: s.rank,
    points: s.points,
  }));

  const promotedToDiv2 = div3Snapshots.slice(0, 3).map((s) => ({
    gamerTag: s.gamerTag,
    fullName: s.fullName,
    rank: s.rank,
    points: s.points,
  }));

  const promotionRelegation: PromotionRelegationRecord = {
    season: seasonName,
    promotedToDiv1,
    promotedToDiv2,
    relegatedToDiv2,
    relegatedToDiv3,
  };

  return {
    seasonName,
    isArchived: true,
    archivedAt: archiveMeta.archivedAt.toISOString(),
    competitionsList,
    overview,
    standings: standingsMap,
    fixtures: fixturesMap,
    statistics,
    champions,
    promotionRelegation,
  };
}

/**
 * Executes a full official season archival snapshot into ArchivedSeason and ArchivedMatch tables.
 */
export async function archiveOfficialSeason(
  seasonName: string,
  archivedByEmail?: string,
  notes?: string
): Promise<{ success: boolean; matchesCount: number; standingsCount: number }> {
  // 1. Fetch current matches
  const currentMatches = await prisma.match.findMany({
    include: {
      homePlayer: true,
      awayPlayer: true,
    },
  });

  // 2. Fetch current standings
  const currentStandings = await prisma.standing.findMany({
    include: { player: true },
  });

  // 3. Snapshot standings into HistoricalSeasonSnapshot
  let standingsCount = 0;
  for (const s of currentStandings) {
    if (!s.player) continue;
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
        isChampion: s.rank === 1,
        isRunnerUp: s.rank === 2,
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
        isChampion: s.rank === 1,
        isRunnerUp: s.rank === 2,
      },
    });
    standingsCount++;
  }

  // 4. Archive matches into ArchivedMatch
  let matchesCount = 0;
  for (const m of currentMatches) {
    let winnerTag: string | null = null;
    const hScore = m.homeScore ?? 0;
    const aScore = m.awayScore ?? 0;
    if (m.homeScore !== null && m.awayScore !== null) {
      if (hScore > aScore) winnerTag = m.homePlayer.gamerTag;
      else if (aScore > hScore) winnerTag = m.awayPlayer.gamerTag;
    }

    await prisma.archivedMatch.create({
      data: {
        season: seasonName,
        division: m.division,
        round: m.round,
        stage: m.stage,
        groupName: m.groupName,
        homeGamerTag: m.homePlayer.gamerTag,
        awayGamerTag: m.awayPlayer.gamerTag,
        homePlayerName: m.homePlayer.fullName,
        awayPlayerName: m.awayPlayer.fullName,
        homeScore: m.homeScore,
        awayScore: m.awayScore,
        leg2HomeScore: m.leg2HomeScore,
        leg2AwayScore: m.leg2AwayScore,
        aggregateHomeScore: m.aggregateHomeScore,
        aggregateAwayScore: m.aggregateAwayScore,
        status: m.status,
        matchDate: m.matchDate,
        winnerGamerTag: winnerTag,
      },
    });
    matchesCount++;
  }

  // 5. Register in ArchivedSeason table
  await prisma.archivedSeason.upsert({
    where: { seasonName },
    update: {
      archivedAt: new Date(),
      archivedByEmail,
      notes,
      matchesCount,
      standingsCount,
    },
    create: {
      seasonName,
      archivedByEmail,
      notes,
      matchesCount,
      standingsCount,
    },
  });

  return { success: true, matchesCount, standingsCount };
}
