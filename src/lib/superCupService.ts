import { prisma } from "@/lib/prisma";

export interface ConfirmedChampionResult {
  id?: string;
  gamerTag: string;
  fullName?: string | null;
  realTeam?: string | null;
  avatar?: string | null;
  division?: string;
  source: "MATCH_FINAL" | "HALL_OF_FAME";
}

/**
 * Returns the confirmed UCL and Europa League champions for a given season.
 * Strictly adheres to the mandatory qualification rule:
 * UCL Champion vs Europa League Champion.
 */
export async function getConfirmedContinentalChampions(season: string = "Season 1 (2026)") {
  // 1. UCL Champion determination
  let uclChampion: ConfirmedChampionResult | null = null;

  // Check finished UCL Grand Final match
  const uclFinalMatch = await prisma.match.findFirst({
    where: {
      division: "UCL",
      stage: "FINAL",
      status: { in: ["FINISHED", "FORFEIT"] },
    },
    include: {
      homePlayer: true,
      awayPlayer: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  if (uclFinalMatch && uclFinalMatch.homePlayer && uclFinalMatch.awayPlayer) {
    const hScore = uclFinalMatch.aggregateHomeScore ?? uclFinalMatch.homeScore ?? 0;
    const aScore = uclFinalMatch.aggregateAwayScore ?? uclFinalMatch.awayScore ?? 0;
    const winnerPlayer = hScore >= aScore ? uclFinalMatch.homePlayer : uclFinalMatch.awayPlayer;
    uclChampion = {
      id: winnerPlayer.id,
      gamerTag: winnerPlayer.gamerTag,
      fullName: winnerPlayer.fullName,
      realTeam: winnerPlayer.realTeam,
      avatar: winnerPlayer.avatar,
      division: winnerPlayer.division,
      source: "MATCH_FINAL",
    };
  } else {
    // Fallback: Check Hall of Fame record for UCL in this season
    const uclHof = await prisma.hallOfFame.findFirst({
      where: {
        season,
        OR: [
          { tournamentName: { contains: "Champions League", mode: "insensitive" } },
          { tournamentName: { contains: "UCL", mode: "insensitive" } },
          { trophyType: "UCL" },
        ],
      },
      orderBy: { createdAt: "desc" },
    });

    if (uclHof) {
      const matchedPlayer = await prisma.player.findFirst({
        where: { gamerTag: { equals: uclHof.championName, mode: "insensitive" } },
      });
      uclChampion = {
        id: matchedPlayer?.id,
        gamerTag: uclHof.championName,
        fullName: uclHof.championRealName || matchedPlayer?.fullName,
        realTeam: matchedPlayer?.realTeam,
        avatar: (matchedPlayer?.avatar && !matchedPlayer.avatar.includes("dicebear.com"))
          ? matchedPlayer.avatar
          : (uclHof.playerImage || matchedPlayer?.avatar),
        division: matchedPlayer?.division,
        source: "HALL_OF_FAME",
      };
    }
  }

  // 2. Europa League Champion determination
  let europaChampion: ConfirmedChampionResult | null = null;

  // Check finished Europa League Grand Final match
  const europaFinalMatch = await prisma.match.findFirst({
    where: {
      division: "EUROPA",
      stage: "FINAL",
      status: { in: ["FINISHED", "FORFEIT"] },
    },
    include: {
      homePlayer: true,
      awayPlayer: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  if (europaFinalMatch && europaFinalMatch.homePlayer && europaFinalMatch.awayPlayer) {
    const hScore = europaFinalMatch.aggregateHomeScore ?? europaFinalMatch.homeScore ?? 0;
    const aScore = europaFinalMatch.aggregateAwayScore ?? europaFinalMatch.awayScore ?? 0;
    const winnerPlayer = hScore >= aScore ? europaFinalMatch.homePlayer : europaFinalMatch.awayPlayer;
    europaChampion = {
      id: winnerPlayer.id,
      gamerTag: winnerPlayer.gamerTag,
      fullName: winnerPlayer.fullName,
      realTeam: winnerPlayer.realTeam,
      avatar: winnerPlayer.avatar,
      division: winnerPlayer.division,
      source: "MATCH_FINAL",
    };
  } else {
    // Fallback: Check Hall of Fame record for Europa League in this season
    const europaHof = await prisma.hallOfFame.findFirst({
      where: {
        season,
        OR: [
          { tournamentName: { contains: "Europa", mode: "insensitive" } },
          { trophyType: "EUROPA" },
        ],
      },
      orderBy: { createdAt: "desc" },
    });

    if (europaHof) {
      const matchedPlayer = await prisma.player.findFirst({
        where: { gamerTag: { equals: europaHof.championName, mode: "insensitive" } },
      });
      europaChampion = {
        id: matchedPlayer?.id,
        gamerTag: europaHof.championName,
        fullName: europaHof.championRealName || matchedPlayer?.fullName,
        realTeam: matchedPlayer?.realTeam,
        avatar: (matchedPlayer?.avatar && !matchedPlayer.avatar.includes("dicebear.com"))
          ? matchedPlayer.avatar
          : (europaHof.playerImage || matchedPlayer?.avatar),
        division: matchedPlayer?.division,
        source: "HALL_OF_FAME",
      };
    }
  }

  return {
    uclChampion,
    europaChampion,
    bothConfirmed: Boolean(uclChampion && europaChampion),
  };
}

/**
 * Returns comprehensive Super Cup state including finalists, match, and past winners.
 */
export async function getSuperCupOverview(season: string = "Season 1 (2026)") {
  const { uclChampion, europaChampion, bothConfirmed } = await getConfirmedContinentalChampions(season);

  // Find Super Cup tournament
  let superCupTournament = await prisma.tournament.findFirst({
    where: {
      OR: [{ type: "SUPER_CUP" }, { slug: { contains: "super-cup" } }],
    },
  });

  // Find Super Cup match
  const superCupMatch = await prisma.match.findFirst({
    where: {
      division: "SUPER_CUP",
      stage: "FINAL",
    },
    include: {
      homePlayer: true,
      awayPlayer: true,
      submissions: {
        include: { submittedByPlayer: true },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Past Super Cup winners
  const pastSuperCupWinners = await prisma.hallOfFame.findMany({
    where: {
      OR: [
        { tournamentName: { contains: "Super Cup", mode: "insensitive" } },
        { trophyType: "SUPER_CUP" },
      ],
    },
    orderBy: { createdAt: "desc" },
  });

  return {
    season,
    uclChampion,
    europaChampion,
    bothConfirmed,
    superCupTournament,
    superCupMatch,
    pastSuperCupWinners,
  };
}

/**
 * Generates the official Super Cup fixture between the confirmed UCL Champion and Europa League Champion.
 * Strictly enforces that NO other teams can be substituted.
 */
export async function generateSuperCupFixture(season: string = "Season 1 (2026)", scheduledDate?: Date) {
  const { uclChampion, europaChampion, bothConfirmed } = await getConfirmedContinentalChampions(season);

  if (!bothConfirmed || !uclChampion?.id || !europaChampion?.id) {
    throw new Error(
      "Cannot generate Super Cup fixture: Mandatory Rule requires both the official Champions League winner and Europa League winner to be confirmed first."
    );
  }

  // Ensure Tournament record exists
  let superCupTournament = await prisma.tournament.findFirst({
    where: { type: "SUPER_CUP" },
  });

  if (!superCupTournament) {
    superCupTournament = await prisma.tournament.create({
      data: {
        name: "UEFA Super Cup",
        slug: `super-cup-${Date.now()}`,
        season,
        format: "Super Cup",
        type: "SUPER_CUP",
        prizePool: "1,500,000 RWF",
        status: "ONGOING",
      },
    });
  }

  // Delete previous unplayed scheduled Super Cup matches
  await prisma.match.deleteMany({
    where: {
      division: "SUPER_CUP",
      status: "SCHEDULED",
    },
  });

  const now = new Date();
  const matchDate = scheduledDate || now;
  const deadlineDate = new Date(matchDate.getTime() + 24 * 60 * 60 * 1000);

  const fixture = await prisma.match.create({
    data: {
      tournamentId: superCupTournament.id,
      division: "SUPER_CUP",
      stage: "FINAL",
      round: "UEFA Super Cup",
      homePlayerId: uclChampion.id,
      awayPlayerId: europaChampion.id,
      status: "SCHEDULED",
      platform: "eFootball Mobile",
      matchDate,
      deadlineDate,
      notes: "UEFA Super Cup: Single-match final between confirmed UCL Champion and Europa League Champion. Winner lifts the Super Cup!",
    },
    include: {
      homePlayer: true,
      awayPlayer: true,
    },
  });

  // Broadcast announcement to whole league
  await prisma.announcement.create({
    data: {
      title: "🏆 THE UEFA SUPER CUP SHOWDOWN IS SET!",
      content: `The ultimate clash of champions: @${uclChampion.gamerTag} (UCL Winner) vs @${europaChampion.gamerTag} (Europa League Winner) for the UEFA Super Cup! Single-match showdown for continental supremacy.`,
      type: "BROADCAST",
      isPinned: true,
    },
  });

  return fixture;
}
