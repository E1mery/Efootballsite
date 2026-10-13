import { prisma } from "@/lib/prisma";

export type SocialPostType =
  | "MOTD_ANNOUNCEMENT"
  | "MOTD_RESULT"
  | "MOTW_ANNOUNCEMENT"
  | "MOTW_RESULT"
  | "MOTW_RIVALRY";

export interface CreateOrUpdateSocialPostInput {
  type: SocialPostType;
  matchId: string;
  season?: string;
  division?: string;
  homePlayerId: string;
  awayPlayerId: string;
  homeScore?: number | null;
  awayScore?: number | null;
  customHeadline?: string;
  customCaption?: string;
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
}

/**
 * Ensures the automation setting record exists with default values.
 */
export async function getSocialAutomationSettings() {
  return await prisma.socialAutomationSetting.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      autoPublishMotd: true,
      autoPublishMotdRes: true,
      autoPublishMotw: true,
      autoPublishMotwRes: true,
      autoRivalryThread: true,
    },
  });
}

/**
 * Builds an authentic, Fabrizio Romano-inspired headline & caption
 * based STRICTLY on real database values (no goalscorers, no fake times/quotes).
 */
export function generateSocialCopy(
  type: SocialPostType,
  data: {
    homeGamerTag: string;
    awayGamerTag: string;
    homeTeam?: string | null;
    awayTeam?: string | null;
    division?: string;
    homeScore?: number | null;
    awayScore?: number | null;
    round?: string;
  }
) {
  const { homeGamerTag, awayGamerTag, homeTeam, awayTeam, division, homeScore, awayScore, round } = data;
  const homeDisplay = homeTeam ? `${homeGamerTag} (${homeTeam})` : homeGamerTag;
  const awayDisplay = awayTeam ? `${awayGamerTag} (${awayTeam})` : awayGamerTag;
  const divLabel = division || "League Division";
  const roundLabel = round || "Matchday Clash";

  switch (type) {
    case "MOTD_ANNOUNCEMENT":
      return {
        headline: `🚨 MATCH OF THE DAY | ${homeGamerTag.toUpperCase()} 🆚 ${awayGamerTag.toUpperCase()}`,
        caption: `HERE WE GO! Official Match of the Day confirmed for ${divLabel}.\n\n` +
          `🔥 ${homeDisplay} takes on ${awayDisplay} in a high-stakes ${roundLabel}.\n` +
          `Three massive points on the line in the Rwanda eFootball League. Who claims victory today?`,
        hashtags: ["#eFootballRW", "#MatchOfTheDay", "#RwandaGaming", `#${divLabel.replace(/\s+/g, "")}`],
      };

    case "MOTD_RESULT": {
      const hScore = homeScore ?? 0;
      const aScore = awayScore ?? 0;
      const outcome =
        hScore > aScore
          ? `${homeGamerTag} secures the victory over ${awayGamerTag}!`
          : aScore > hScore
          ? `${awayGamerTag} claims the away triumph over ${homeGamerTag}!`
          : `Points shared! A thrilling draw between ${homeGamerTag} and ${awayGamerTag}.`;

      return {
        headline: `🏁 FULL TIME | ${homeGamerTag.toUpperCase()} ${hScore} - ${aScore} ${awayGamerTag.toUpperCase()}`,
        caption: `🚨 OFFICIAL RESULT: It is full time in today's Match of the Day!\n\n` +
          `FINAL: ${homeDisplay} ${hScore} - ${aScore} ${awayDisplay}.\n` +
          `${outcome}\n\n` +
          `All verified points and goal differences have officially updated the ${divLabel} standings. 👏`,
        hashtags: ["#FullTime", "#eFootballRW", "#OfficialResult", `#${divLabel.replace(/\s+/g, "")}`],
      };
    }

    case "MOTW_ANNOUNCEMENT":
      return {
        headline: `⭐ MATCH OF THE WEEK | ${homeGamerTag.toUpperCase()} 🆚 ${awayGamerTag.toUpperCase()}`,
        caption: `🚨 THE BIG ONE: Commissioner Office announces the official MATCH OF THE WEEK!\n\n` +
          `🔥 ${homeDisplay} clashes with ${awayDisplay} in ${divLabel}.\n` +
          `A marquee showdown with maximum prestige and league bragging rights at stake. Drop your predictions below! 👇`,
        hashtags: ["#MatchOfTheWeek", "#MOTW", "#RwandaEsports", `#${divLabel.replace(/\s+/g, "")}`],
      };

    case "MOTW_RESULT": {
      const hScore = homeScore ?? 0;
      const aScore = awayScore ?? 0;
      const outcome =
        hScore > aScore
          ? `Dominant performance by ${homeGamerTag} to take all 3 points!`
          : aScore > hScore
          ? `Stunning triumph by ${awayGamerTag} in this marquee clash!`
          : `Honors even! An intense stalemate between ${homeGamerTag} and ${awayGamerTag}.`;

      return {
        headline: `🏆 MOTW FULL TIME | ${homeGamerTag.toUpperCase()} ${hScore} - ${aScore} ${awayGamerTag.toUpperCase()}`,
        caption: `🏁 MATCH OF THE WEEK CONCLUDED!\n\n` +
          `FINAL: ${homeDisplay} ${hScore} - ${aScore} ${awayDisplay}.\n` +
          `${outcome}\n\n` +
          `Verified by League Administration. The bragging rights are officially sealed! 👏🔥`,
        hashtags: ["#MOTWResult", "#FullTime", "#eFootballRW", "#BraggingRights"],
      };
    }

    case "MOTW_RIVALRY":
      return {
        headline: `⚔️ RIVALRY BANTER ROOM | ${homeGamerTag.toUpperCase()} 🆚 ${awayGamerTag.toUpperCase()}`,
        caption: `Official pre-match discussion for the Match of the Week!\n\n` +
          `Athletes ${homeGamerTag} and ${awayGamerTag}, the pitch awaits. Exchange your respectful predictions, banter, and game-plan hype below before kickoff. Respect the rules of the league! 🔥`,
        hashtags: ["#RivalryDiscussion", "#PreMatchHype", "#BanterRoom", "#RwandaGaming"],
      };

    default:
      return {
        headline: `📢 LEAGUE UPDATE`,
        caption: `Official announcement from the Rwanda eFootball League.`,
        hashtags: ["#eFootballRW"],
      };
  }
}

/**
 * Authoritative creation/updating of a Social Post linked to a real match.
 * Prevents duplicates via unique([type, matchId]).
 */
export async function syncSocialPostForMatch(input: CreateOrUpdateSocialPostInput) {
  const { type, matchId, homePlayerId, awayPlayerId, homeScore, awayScore, customHeadline, customCaption } = input;

  // Verify match exists
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      homePlayer: true,
      awayPlayer: true,
      tournament: true,
    },
  });

  if (!match) return null;

  const config = await prisma.leagueConfig.findUnique({ where: { id: "default" } });
  const season = input.season || config?.season || match.tournament?.season || "Season 1 (2026)";
  const division = input.division || match.division;

  const copy = generateSocialCopy(type, {
    homeGamerTag: match.homePlayer.gamerTag,
    awayGamerTag: match.awayPlayer.gamerTag,
    homeTeam: match.homePlayer.realTeam,
    awayTeam: match.awayPlayer.realTeam,
    division,
    homeScore: homeScore !== undefined ? homeScore : match.homeScore,
    awayScore: awayScore !== undefined ? awayScore : match.awayScore,
    round: match.round,
  });

  const headline = customHeadline || copy.headline;
  const caption = customCaption || copy.caption;

  const post = await prisma.socialPost.upsert({
    where: {
      type_matchId: {
        type,
        matchId,
      },
    },
    update: {
      headline,
      caption,
      hashtags: copy.hashtags,
      division,
      season,
      homePlayerId,
      awayPlayerId,
      homeScore: homeScore !== undefined ? homeScore : match.homeScore,
      awayScore: awayScore !== undefined ? awayScore : match.awayScore,
      status: input.status || "PUBLISHED",
      publishedAt: new Date(),
    },
    create: {
      type,
      matchId,
      headline,
      caption,
      hashtags: copy.hashtags,
      division,
      season,
      homePlayerId,
      awayPlayerId,
      homeScore: homeScore !== undefined ? homeScore : match.homeScore,
      awayScore: awayScore !== undefined ? awayScore : match.awayScore,
      status: input.status || "PUBLISHED",
      publishedAt: new Date(),
    },
  });

  return post;
}
