import { prisma } from "@/lib/prisma";
import { syncSocialPostForMatch, SocialPostType } from "@/lib/socialFeedService";
import { formatRwandanDate, formatRwandanTime, formatRwandanDateTime } from "@/lib/rwandanTime";

export type FinalCompetition = "SUPER_CUP" | "UCL" | "EUROPA";

export interface FinalMatchMeta {
  competition: FinalCompetition;
  title: string;
  badgeLabel: string;
  trophyImage: string;
  stadiumBg: string;
  announcementType: SocialPostType;
  resultType: SocialPostType;
}

/**
 * Detects whether a given match is an official Final (Super Cup, UCL, or Europa League)
 */
export function detectFinalCompetition(match: {
  division?: string | null;
  stage?: string | null;
  round?: string | null;
  tournament?: { type?: string } | null;
}): FinalCompetition | null {
  const div = (match.division || "").toUpperCase();
  const stage = (match.stage || "").toUpperCase();
  const round = (match.round || "").toUpperCase();
  const tourneyType = (match.tournament?.type || "").toUpperCase();

  if (div === "SUPER_CUP" || tourneyType === "SUPER_CUP" || round.includes("SUPER CUP")) {
    return "SUPER_CUP";
  }
  if ((div === "UCL" || tourneyType === "UCL") && (stage === "FINAL" || round.includes("FINAL"))) {
    return "UCL";
  }
  if ((div === "EUROPA" || tourneyType === "EUROPA") && (stage === "FINAL" || round.includes("FINAL"))) {
    return "EUROPA";
  }
  return null;
}

/**
 * Metadata mapping for each final competition
 */
export function getFinalCompetitionMeta(comp: FinalCompetition): FinalMatchMeta {
  switch (comp) {
    case "SUPER_CUP":
      return {
        competition: "SUPER_CUP",
        title: "UEFA Super Cup",
        badgeLabel: "UEFA Super Cup Final",
        trophyImage: "/assets/trophies/super-cup.png",
        stadiumBg: "/images/super-cup-bg.jpg",
        announcementType: "SUPER_CUP_ANNOUNCEMENT",
        resultType: "SUPER_CUP_RESULT",
      };
    case "UCL":
      return {
        competition: "UCL",
        title: "UEFA Champions League",
        badgeLabel: "UCL Grand Final",
        trophyImage: "/assets/trophies/champions-league.png",
        stadiumBg: "/images/ucl-stadium-bg.jpg",
        announcementType: "UCL_FINAL_ANNOUNCEMENT",
        resultType: "UCL_FINAL_RESULT",
      };
    case "EUROPA":
      return {
        competition: "EUROPA",
        title: "UEFA Europa League",
        badgeLabel: "Europa League Final",
        trophyImage: "/assets/trophies/europa-league.png",
        stadiumBg: "/images/europa-stadium-bg.jpg",
        announcementType: "EUROPA_FINAL_ANNOUNCEMENT",
        resultType: "EUROPA_FINAL_RESULT",
      };
  }
}

/**
 * Authoritative creation/updating of a Final Match Announcement post.
 * Synchronizes with real admin-scheduled kickoff date & time.
 * Prevents duplicates via unique([type, matchId]).
 */
export async function syncFinalAnnouncementPost(matchId: string) {
  try {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        homePlayer: true,
        awayPlayer: true,
        tournament: true,
      },
    });

    if (!match) return null;

    const comp = detectFinalCompetition(match);
    if (!comp) return null;

    const meta = getFinalCompetitionMeta(comp);

    const post = await syncSocialPostForMatch({
      type: meta.announcementType,
      matchId: match.id,
      division: match.division,
      homePlayerId: match.homePlayerId,
      awayPlayerId: match.awayPlayerId,
      homeScore: match.homeScore,
      awayScore: match.awayScore,
      status: "PUBLISHED",
    });

    return post;
  } catch (err) {
    console.error(`[syncFinalAnnouncementPost] Error syncing announcement for match ${matchId}:`, err);
    throw err;
  }
}

/**
 * Authoritative creation/updating of a Final Match Result post.
 * Only publishes when the match has officially finished and scores are confirmed.
 * Strictly adheres to rules: NO goal scorers, real champion highlighted.
 */
export async function syncFinalResultPost(matchId: string) {
  try {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        homePlayer: true,
        awayPlayer: true,
        tournament: true,
      },
    });

    if (!match) return null;

    const comp = detectFinalCompetition(match);
    if (!comp) return null;

    if (match.status !== "FINISHED" && match.status !== "FORFEIT") {
      throw new Error("Cannot publish final result: match is not officially finished.");
    }

    if (match.homeScore === null || match.awayScore === null) {
      throw new Error("Cannot publish final result: match scores are not officially confirmed.");
    }

    const meta = getFinalCompetitionMeta(comp);

    const post = await syncSocialPostForMatch({
      type: meta.resultType,
      matchId: match.id,
      division: match.division,
      homePlayerId: match.homePlayerId,
      awayPlayerId: match.awayPlayerId,
      homeScore: match.homeScore,
      awayScore: match.awayScore,
      status: "PUBLISHED",
    });

    return post;
  } catch (err) {
    console.error(`[syncFinalResultPost] Error syncing result for match ${matchId}:`, err);
    throw err;
  }
}

/**
 * Reverts any premature or outdated result posts if a match is returned to SCHEDULED.
 */
export async function revertFinalResultPost(matchId: string) {
  try {
    await prisma.socialPost.updateMany({
      where: {
        matchId,
        type: {
          in: ["SUPER_CUP_RESULT", "UCL_FINAL_RESULT", "EUROPA_FINAL_RESULT"],
        },
      },
      data: {
        status: "ARCHIVED",
      },
    });
  } catch (err) {
    console.error(`[revertFinalResultPost] Error archiving result post for match ${matchId}:`, err);
  }
}

/**
 * Updates kickoff date & time for a final match and resyncs the announcement post.
 */
export async function updateFinalMatchSchedule(matchId: string, scheduledDate: Date | string) {
  const matchDate = new Date(scheduledDate);
  if (isNaN(matchDate.getTime())) {
    throw new Error("Invalid date provided for kickoff schedule.");
  }

  const deadlineDate = new Date(matchDate.getTime() + 24 * 60 * 60 * 1000);

  const updatedMatch = await prisma.match.update({
    where: { id: matchId },
    data: {
      matchDate,
      deadlineDate,
    },
    include: {
      homePlayer: true,
      awayPlayer: true,
      tournament: true,
    },
  });

  // Automatically update the announcement post with new scheduled date & time
  const post = await syncFinalAnnouncementPost(updatedMatch.id);

  return { match: updatedMatch, post };
}

/**
 * Gathers comprehensive status for all 3 finals competitions.
 * Used by Admin Finals Social Feed dashboard.
 */
export async function getFinalsSocialOverview() {
  const competitions: FinalCompetition[] = ["SUPER_CUP", "UCL", "EUROPA"];
  const results = [];

  for (const comp of competitions) {
    const meta = getFinalCompetitionMeta(comp);

    // Find the final fixture
    let matchWhere: any = {};
    if (comp === "SUPER_CUP") {
      matchWhere = {
        OR: [
          { division: "SUPER_CUP" },
          { round: { contains: "Super Cup" } },
        ],
      };
    } else {
      matchWhere = {
        division: comp,
        OR: [
          { stage: "FINAL" },
          { round: { contains: "Grand Final" } },
          { round: { equals: "Final" } },
        ],
      };
    }

    const match = await prisma.match.findFirst({
      where: matchWhere,
      include: {
        homePlayer: true,
        awayPlayer: true,
        tournament: true,
      },
      orderBy: { createdAt: "desc" },
    });

    let announcementPost = null;
    let resultPost = null;

    if (match) {
      announcementPost = await prisma.socialPost.findUnique({
        where: {
          type_matchId: {
            type: meta.announcementType,
            matchId: match.id,
          },
        },
      });

      resultPost = await prisma.socialPost.findUnique({
        where: {
          type_matchId: {
            type: meta.resultType,
            matchId: match.id,
          },
        },
      });
    }

    // Determine winner if finished
    let winnerPlayer = null;
    if (match && match.status === "FINISHED" && match.homeScore !== null && match.awayScore !== null) {
      const hTotal = match.aggregateHomeScore ?? match.homeScore;
      const aTotal = match.aggregateAwayScore ?? match.awayScore;
      winnerPlayer = hTotal >= aTotal ? match.homePlayer : match.awayPlayer;
    }

    results.push({
      competition: comp,
      meta,
      match: match
        ? {
            id: match.id,
            round: match.round,
            stage: match.stage,
            division: match.division,
            status: match.status,
            matchDate: match.matchDate,
            deadlineDate: match.deadlineDate,
            formattedDate: formatRwandanDate(match.matchDate),
            formattedTime: formatRwandanTime(match.matchDate),
            formattedDateTime: formatRwandanDateTime(match.matchDate),
            homeScore: match.homeScore,
            awayScore: match.awayScore,
            aggregateHomeScore: match.aggregateHomeScore,
            aggregateAwayScore: match.aggregateAwayScore,
            homePlayer: match.homePlayer
              ? {
                  id: match.homePlayer.id,
                  gamerTag: match.homePlayer.gamerTag,
                  fullName: match.homePlayer.fullName,
                  realTeam: match.homePlayer.realTeam,
                  avatar: match.homePlayer.avatar,
                }
              : null,
            awayPlayer: match.awayPlayer
              ? {
                  id: match.awayPlayer.id,
                  gamerTag: match.awayPlayer.gamerTag,
                  fullName: match.awayPlayer.fullName,
                  realTeam: match.awayPlayer.realTeam,
                  avatar: match.awayPlayer.avatar,
                }
              : null,
            winnerPlayer: winnerPlayer
              ? {
                  id: winnerPlayer.id,
                  gamerTag: winnerPlayer.gamerTag,
                  realTeam: winnerPlayer.realTeam,
                }
              : null,
          }
        : null,
      announcement: announcementPost
        ? {
            id: announcementPost.id,
            type: announcementPost.type,
            status: announcementPost.status,
            headline: announcementPost.headline,
            caption: announcementPost.caption,
            hashtags: announcementPost.hashtags,
            publishedAt: announcementPost.publishedAt,
          }
        : null,
      result: resultPost
        ? {
            id: resultPost.id,
            type: resultPost.type,
            status: resultPost.status,
            headline: resultPost.headline,
            caption: resultPost.caption,
            hashtags: resultPost.hashtags,
            publishedAt: resultPost.publishedAt,
          }
        : null,
    });
  }

  return results;
}
