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
    // Fallback: Check Hall of Fame record for UCL in this season, or latest historical champion
    let uclHof = await prisma.hallOfFame.findFirst({
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

    if (!uclHof) {
      uclHof = await prisma.hallOfFame.findFirst({
        where: {
          OR: [
            { tournamentName: { contains: "Champions League", mode: "insensitive" } },
            { tournamentName: { contains: "UCL", mode: "insensitive" } },
            { trophyType: "UCL" },
          ],
        },
        orderBy: [{ inductionYear: "desc" }, { createdAt: "desc" }],
      });
    }

    if (uclHof) {
      const matchedPlayer = uclHof.playerId
        ? await prisma.player.findUnique({ where: { id: uclHof.playerId } })
        : await prisma.player.findFirst({
            where: {
              OR: [
                { gamerTag: { equals: uclHof.championName, mode: "insensitive" } },
                { fullName: { equals: uclHof.championName, mode: "insensitive" } },
              ],
            },
          });
      uclChampion = {
        id: matchedPlayer?.id,
        gamerTag: matchedPlayer?.gamerTag || uclHof.championName,
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
    // Fallback: Check Hall of Fame record for Europa League in this season, or latest historical champion
    let europaHof = await prisma.hallOfFame.findFirst({
      where: {
        season,
        OR: [
          { tournamentName: { contains: "Europa", mode: "insensitive" } },
          { trophyType: "EUROPA" },
        ],
      },
      orderBy: { createdAt: "desc" },
    });

    if (!europaHof) {
      europaHof = await prisma.hallOfFame.findFirst({
        where: {
          OR: [
            { tournamentName: { contains: "Europa", mode: "insensitive" } },
            { trophyType: "EUROPA" },
          ],
        },
        orderBy: [{ inductionYear: "desc" }, { createdAt: "desc" }],
      });
    }

    if (europaHof) {
      const matchedPlayer = europaHof.playerId
        ? await prisma.player.findUnique({ where: { id: europaHof.playerId } })
        : await prisma.player.findFirst({
            where: {
              OR: [
                { gamerTag: { equals: europaHof.championName, mode: "insensitive" } },
                { fullName: { equals: europaHof.championName, mode: "insensitive" } },
              ],
            },
          });
      europaChampion = {
        id: matchedPlayer?.id,
        gamerTag: matchedPlayer?.gamerTag || europaHof.championName,
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

  // Super Cup prediction poll stats
  const pollVotes = await prisma.trophyPollVote.findMany({
    where: { competition: "SUPER_CUP" },
  });

  const f1Votes = superCupMatch?.homePlayerId
    ? pollVotes.filter((v) => v.predictedWinnerPlayerId === superCupMatch.homePlayerId).length
    : 0;
  const f2Votes = superCupMatch?.awayPlayerId
    ? pollVotes.filter((v) => v.predictedWinnerPlayerId === superCupMatch.awayPlayerId).length
    : 0;
  const totalVotes = pollVotes.length;
  const f1Pct = totalVotes > 0 ? Math.round((f1Votes / totalVotes) * 100) : 50;
  const f2Pct = totalVotes > 0 ? 100 - f1Pct : 50;

  return {
    season,
    uclChampion,
    europaChampion,
    bothConfirmed,
    superCupTournament,
    superCupMatch,
    pastSuperCupWinners,
    pollStats: {
      totalVotes,
      f1Votes,
      f2Votes,
      f1Pct,
      f2Pct,
    },
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

  // Reset existing Super Cup poll votes for a fresh prediction poll
  await prisma.trophyPollVote.deleteMany({
    where: { competition: "SUPER_CUP" },
  });

  // Activate as official Match of the Day showcase
  await prisma.match.updateMany({
    where: { isMatchOfTheDay: true },
    data: { isMatchOfTheDay: false },
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
      isMatchOfTheDay: true,
      matchDate,
      deadlineDate,
      notes: "UEFA Super Cup: Single-match final between confirmed UCL Champion and Europa League Champion. Winner lifts the Super Cup!",
    },
    include: {
      homePlayer: true,
      awayPlayer: true,
    },
  });

  // Broadcast announcement to whole league inviting everyone to vote in the prediction poll
  await prisma.announcement.create({
    data: {
      title: "🏆 THE UEFA SUPER CUP SHOWDOWN IS SET! VOTE IN THE PREDICTION POLL!",
      content: `The ultimate clash of champions: @${uclChampion.gamerTag} (UCL Winner) vs @${europaChampion.gamerTag} (Europa League Winner) for the UEFA Super Cup! Cast your vote now in the official Super Cup Prediction Poll to predict who lifts the trophy!`,
      type: "BROADCAST",
      isPinned: true,
    },
  });

  // Post to official social feeds
  try {
    const { syncFinalAnnouncementForMatch } = await import("@/lib/socialFeedService");
    await syncFinalAnnouncementForMatch(fixture.id);
  } catch (socialErr) {
    console.error("[generateSuperCupFixture] Failed to post Super Cup to social feed:", socialErr);
  }

  return fixture;
}
