import { prisma } from "@/lib/prisma";
import { formatRwandanDate, formatRwandanTime } from "@/lib/rwandanTime";
import { resolvePlayerAvatar } from "@/lib/teams";
import { resolveSocialBackground } from "./socialBackgroundEngine";
import { encodePostCaption, SocialGraphicData } from "./socialFeedTypes";

export type SocialPostType =
  | "MOTD_ANNOUNCEMENT"
  | "MOTD_RESULT"
  | "MOTW_ANNOUNCEMENT"
  | "MOTW_RESULT"
  | "MOTW_RIVALRY"
  | "DERBY_ANNOUNCEMENT"
  | "DERBY_RESULT"
  | "SUPER_CUP_ANNOUNCEMENT"
  | "SUPER_CUP_RESULT"
  | "UCL_FINAL_ANNOUNCEMENT"
  | "UCL_FINAL_RESULT"
  | "EUROPA_FINAL_ANNOUNCEMENT"
  | "EUROPA_FINAL_RESULT";

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
  derbyId?: string | null;
  derbyName?: string | null;
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
    matchDate?: Date | string | null;
    winnerGamerTag?: string | null;
    winnerTeam?: string | null;
    derbyName?: string | null;
  }
) {
  const {
    homeGamerTag,
    awayGamerTag,
    homeTeam,
    awayTeam,
    division,
    homeScore,
    awayScore,
    round,
    matchDate,
  } = data;
  const homeDisplay = homeTeam ? `${homeGamerTag} (${homeTeam})` : homeGamerTag;
  const awayDisplay = awayTeam ? `${awayGamerTag} (${awayTeam})` : awayGamerTag;
  const divLabel = division || "League Division";
  const roundLabel = round || "Matchday Clash";

  let kickoffStr = "";
  if (matchDate) {
    const formattedDate = formatRwandanDate(matchDate);
    const formattedTime = formatRwandanTime(matchDate);
    if (formattedDate && formattedTime) {
      kickoffStr = `📅 Kickoff: ${formattedDate} at ${formattedTime} CAT\n`;
    }
  }

  const hScore = homeScore ?? 0;
  const aScore = awayScore ?? 0;
  const winnerTag = data.winnerGamerTag || (hScore >= aScore ? homeGamerTag : awayGamerTag);
  const winnerTeamName = data.winnerTeam || (hScore >= aScore ? homeTeam : awayTeam);
  const runnerUpTag = winnerTag === homeGamerTag ? awayGamerTag : homeGamerTag;
  const runnerUpTeamName = winnerTag === homeGamerTag ? awayTeam : homeTeam;
  const winnerDisplay = winnerTeamName ? `${winnerTag} (${winnerTeamName})` : winnerTag;
  const runnerUpDisplay = runnerUpTeamName ? `${runnerUpTag} (${runnerUpTeamName})` : runnerUpTag;

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

    case "DERBY_ANNOUNCEMENT": {
      const derbyTitle = (data as any).derbyName || "OFFICIAL DERBY";
      const cleanHashtag = derbyTitle.replace(/[\s'’–-]+/g, "");
      return {
        headline: `⚔️ OFFICIAL DERBY ANNOUNCEMENT | ${derbyTitle.toUpperCase()} | ${homeGamerTag.toUpperCase()} 🆚 ${awayGamerTag.toUpperCase()}`,
        caption: `OFFICIAL DERBY ANNOUNCEMENT\n\n` +
          `# ${derbyTitle.toUpperCase()}\n\n` +
          `${(homeTeam || homeGamerTag).toUpperCase()} VS ${(awayTeam || awayGamerTag).toUpperCase()}\n\n` +
          `Two giants. One rivalry. One fixture in the Rwanda eFootball League.\n\n` +
          `🔥 ${homeDisplay} goes to war against ${awayDisplay} in a marquee ${roundLabel} clash in ${divLabel}.\n` +
          `Maximum bragging rights and league supremacy on the line! Drop your predictions below! 👇`,
        hashtags: [`#${cleanHashtag}`, "#OfficialDerby", "#eFootballRW", "#RwandaGaming", `#${divLabel.replace(/\s+/g, "")}`],
      };
    }

    case "DERBY_RESULT": {
      const derbyTitle = (data as any).derbyName || "OFFICIAL DERBY";
      const cleanHashtag = derbyTitle.replace(/[\s'’–-]+/g, "");
      const outcome =
        hScore > aScore
          ? `${homeGamerTag} (${homeTeam || "Home"}) conquers the derby with an emphatic triumph!`
          : aScore > hScore
          ? `${awayGamerTag} (${awayTeam || "Away"}) claims monumental bragging rights with a masterclass away derby win!`
          : `Honors even! A breathtaking derby stalemate between ${homeGamerTag} and ${awayGamerTag}.`;

      return {
        headline: `🏆 DERBY FULL TIME | ${derbyTitle.toUpperCase()} | ${homeGamerTag.toUpperCase()} ${hScore} - ${aScore} ${awayGamerTag.toUpperCase()}`,
        caption: `🏁 OFFICIAL DERBY RESULT: The ${derbyTitle} is in the books!\n\n` +
          `FINAL: ${homeDisplay} ${hScore} - ${aScore} ${awayDisplay}.\n` +
          `${outcome}\n\n` +
          `All verified points have officially been locked into the ${divLabel} standings. The bragging rights are officially sealed! 👏🔥`,
        hashtags: [`#${cleanHashtag}`, "#DerbyResult", "#FullTime", "#eFootballRW", "#OfficialResult"],
      };
    }

    case "SUPER_CUP_ANNOUNCEMENT":
      return {
        headline: `🏆 UEFA SUPER CUP FINAL | ${homeGamerTag.toUpperCase()} 🆚 ${awayGamerTag.toUpperCase()}`,
        caption: `🚨 THE ULTIMATE CLASH OF CHAMPIONS! Official UEFA Super Cup Final confirmed.\n\n` +
          `🏆 UEFA SUPER CUP FINAL\n\n` +
          `🔥 UCL Winner ${homeDisplay} faces off against Europa League Winner ${awayDisplay} in a monumental single-match final showdown.\n\n` +
          `${kickoffStr}` +
          `📍 Rwanda eFootball League Championship Arena\n\n` +
          `The continental crown and ultimate supremacy are on the line in the Rwanda eFootball League. Who lifts the Super Cup trophy? Drop your predictions below! 👇`,
        hashtags: ["#SuperCup", "#SuperCupFinal", "#eFootballRW", "#ClashOfChampions", "#RwandaGaming"],
      };

    case "SUPER_CUP_RESULT": {
      return {
        headline: `🏆 SUPER CUP CHAMPIONS! | ${winnerTag.toUpperCase()} LIFTS THE TROPHY! | ${homeGamerTag.toUpperCase()} ${hScore} - ${aScore} ${awayGamerTag.toUpperCase()}`,
        caption: `🏁 FULL TIME: The UEFA Super Cup champion has officially been crowned!\n\n` +
          `🏆 FINAL SCORE: ${homeDisplay} ${hScore} - ${aScore} ${awayDisplay}\n\n` +
          `👑 OFFICIAL CHAMPION: @${winnerDisplay}\n\n` +
          `What an extraordinary battle for continental glory! @${winnerTag} conquers the UEFA Super Cup after a thrilling championship clash against @${runnerUpDisplay}.\n\n` +
          `Verified by Rwanda eFootball League Administration. The Super Cup trophy has been lifted and immortalized in the Hall of Fame! 👏🔥`,
        hashtags: ["#SuperCupChampion", "#SuperCup", "#FullTime", "#eFootballRW", "#HallOfFame"],
      };
    }

    case "UCL_FINAL_ANNOUNCEMENT":
      return {
        headline: `⭐ UEFA CHAMPIONS LEAGUE GRAND FINAL | ${homeGamerTag.toUpperCase()} 🆚 ${awayGamerTag.toUpperCase()}`,
        caption: `🚨 THE PINNACLE OF CONTINENTAL FOOTBALL! The UCL Grand Final is officially locked in.\n\n` +
          `⭐ UEFA CHAMPIONS LEAGUE GRAND FINAL\n\n` +
          `🔥 ${homeDisplay} clashes with ${awayDisplay} for European glory and the coveted Champions League Trophy.\n\n` +
          `${kickoffStr}` +
          `📍 Rwanda eFootball League Continental Arena\n\n` +
          `Winner secures the UCL crown and qualifies for the UEFA Super Cup! Cast your vote in the Trophy Prediction Poll and leave your predictions below! 👇`,
        hashtags: ["#UCLFinal", "#ChampionsLeague", "#eFootballRW", "#RoadToGlory", "#RwandaEsports"],
      };

    case "UCL_FINAL_RESULT": {
      return {
        headline: `⭐ UCL CHAMPIONS! | ${winnerTag.toUpperCase()} CROWNED KINGS OF EUROPE! | ${homeGamerTag.toUpperCase()} ${hScore} - ${aScore} ${awayGamerTag.toUpperCase()}`,
        caption: `🏁 FULL TIME: KINGS OF EUROPE CROWNED! The UEFA Champions League Grand Final is in the books!\n\n` +
          `⭐ FINAL SCORE: ${homeDisplay} ${hScore} - ${aScore} ${awayDisplay}\n\n` +
          `👑 OFFICIAL UCL CHAMPION: @${winnerDisplay}\n\n` +
          `Immortal continental glory! @${winnerTag} reigns supreme over Europe to lift the Champions League Trophy after a phenomenal final against @${runnerUpDisplay}.\n\n` +
          `Verified by League Administration. The continental champion punches their ticket to the UEFA Super Cup! 👏⭐`,
        hashtags: ["#UCLChampion", "#ChampionsLeague", "#UCLFinal", "#eFootballRW", "#FullTime"],
      };
    }

    case "EUROPA_FINAL_ANNOUNCEMENT":
      return {
        headline: `🟠 UEFA EUROPA LEAGUE GRAND FINAL | ${homeGamerTag.toUpperCase()} 🆚 ${awayGamerTag.toUpperCase()}`,
        caption: `🚨 THE EUROPA LEAGUE SHOWDOWN! The Europa League Grand Final is officially set.\n\n` +
          `🟠 UEFA EUROPA LEAGUE GRAND FINAL\n\n` +
          `🔥 ${homeDisplay} battles ${awayDisplay} for the Europa League Cup and a ticket to the prestigious UEFA Super Cup.\n\n` +
          `${kickoffStr}` +
          `📍 Rwanda eFootball League Continental Arena\n\n` +
          `Who will hoist the trophy? Vote in the Trophy Prediction Poll and drop your score predictions below! 👇`,
        hashtags: ["#EuropaFinal", "#EuropaLeague", "#eFootballRW", "#UEL", "#RwandaGaming"],
      };

    case "EUROPA_FINAL_RESULT": {
      return {
        headline: `🏆 EUROPA LEAGUE CHAMPIONS! | ${winnerTag.toUpperCase()} LIFTS THE CUP! | ${homeGamerTag.toUpperCase()} ${hScore} - ${aScore} ${awayGamerTag.toUpperCase()}`,
        caption: `🏁 FULL TIME: We have our UEFA Europa League winner!\n\n` +
          `🟠 FINAL SCORE: ${homeDisplay} ${hScore} - ${aScore} ${awayDisplay}\n\n` +
          `👑 OFFICIAL EUROPA CHAMPION: @${winnerDisplay}\n\n` +
          `Pure resilience and a masterclass final! @${winnerTag} captures the Europa League Cup with a glorious victory over @${runnerUpDisplay}.\n\n` +
          `Verified by League Administration. The Europa League title is sealed, and a spot in the UEFA Super Cup is booked! 👏🟠`,
        hashtags: ["#EuropaChampion", "#EuropaLeague", "#EuropaFinal", "#eFootballRW", "#FullTime"],
      };
    }

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

  let derbyName = input.derbyName || (match as any).derbyName || null;
  let derbyId = input.derbyId || (match as any).derbyId || null;

  if (!derbyName) {
    try {
      const { detectDerby } = await import("@/lib/derbyService");
      const d = detectDerby(match.homePlayer, match.awayPlayer);
      if (d) {
        derbyName = d.name;
        derbyId = d.id;
      }
    } catch {}
  }

  const effectiveHomeScore = homeScore !== undefined ? homeScore : match.homeScore;
  const effectiveAwayScore = awayScore !== undefined ? awayScore : match.awayScore;
  const hFinal = match.aggregateHomeScore ?? (effectiveHomeScore ?? 0);
  const aFinal = match.aggregateAwayScore ?? (effectiveAwayScore ?? 0);
  const winnerPlayer = hFinal >= aFinal ? match.homePlayer : match.awayPlayer;

  const copy = generateSocialCopy(type, {
    homeGamerTag: match.homePlayer.gamerTag,
    awayGamerTag: match.awayPlayer.gamerTag,
    homeTeam: match.homePlayer.realTeam,
    awayTeam: match.awayPlayer.realTeam,
    division,
    homeScore: effectiveHomeScore,
    awayScore: effectiveAwayScore,
    round: match.round,
    matchDate: match.matchDate,
    winnerGamerTag: winnerPlayer.gamerTag,
    winnerTeam: winnerPlayer.realTeam,
    derbyName,
  });

  const headline = customHeadline || copy.headline;
  const rawCaption = customCaption || copy.caption;

  const bg = resolveSocialBackground({
    category: "MATCHES_RESULTS",
    type,
    division,
    round: match.round,
    isResult: type.endsWith("_RESULT"),
  });

  const graphicData: SocialGraphicData = {
    category: "MATCHES_RESULTS",
    backgroundKey: bg.imagePath,
    bannerTitle: copy.headline.replace(/^[^\s]+\s+/, ""),
    subtitle: match.round.toUpperCase(),
    badgeLabel: type.startsWith("MOTW") ? "Match of Week" : type.startsWith("MOTD") ? "Match of Day" : division || "League Fixture",
    badgeVariant: type.endsWith("_RESULT") ? "destructive" : "yellow",
    kickoffDate: formatRwandanDate(match.matchDate),
    kickoffTime: formatRwandanTime(match.matchDate),
    homeGamerTag: match.homePlayer.gamerTag,
    awayGamerTag: match.awayPlayer.gamerTag,
    homeTeamName: match.homePlayer.realTeam || undefined,
    awayTeamName: match.awayPlayer.realTeam || undefined,
    homeLogo: resolvePlayerAvatar(match.homePlayer),
    awayLogo: resolvePlayerAvatar(match.awayPlayer),
    homeScore: effectiveHomeScore,
    awayScore: effectiveAwayScore,
    isConfirmedResult: type.endsWith("_RESULT"),
    eventKey: `${type}_${match.id}`,
  };

  const caption = encodePostCaption(rawCaption, graphicData);

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
      hashtags: JSON.stringify(copy.hashtags || []),
      division,
      season,
      homePlayerId,
      awayPlayerId,
      homeScore: homeScore !== undefined ? homeScore : match.homeScore,
      awayScore: awayScore !== undefined ? awayScore : match.awayScore,
      status: input.status || "PUBLISHED",
      publishedAt: new Date(),
      derbyId,
      derbyName,
    },
    create: {
      type,
      matchId,
      headline,
      caption,
      hashtags: JSON.stringify(copy.hashtags || []),
      division,
      season,
      homePlayerId,
      awayPlayerId,
      homeScore: homeScore !== undefined ? homeScore : match.homeScore,
      awayScore: awayScore !== undefined ? awayScore : match.awayScore,
      status: input.status || "PUBLISHED",
      publishedAt: new Date(),
      derbyId,
      derbyName,
    },
  });

  return post;
}

/**
 * Automatically creates or updates the official social feed announcement
 * for a Super Cup, UCL Final, or Europa Final fixture.
 */
export async function syncFinalAnnouncementForMatch(matchId: string) {
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

    let postType: SocialPostType | null = null;
    if (match.division === "SUPER_CUP" && match.stage === "FINAL") {
      postType = "SUPER_CUP_ANNOUNCEMENT";
    } else if (match.division === "UCL" && match.stage === "FINAL") {
      postType = "UCL_FINAL_ANNOUNCEMENT";
    } else if (match.division === "EUROPA" && match.stage === "FINAL") {
      postType = "EUROPA_FINAL_ANNOUNCEMENT";
    }

    if (!postType) return null;

    return await syncSocialPostForMatch({
      type: postType,
      matchId: match.id,
      division: match.division,
      homePlayerId: match.homePlayerId,
      awayPlayerId: match.awayPlayerId,
      homeScore: match.homeScore,
      awayScore: match.awayScore,
    });
  } catch (err) {
    console.error("[syncFinalAnnouncementForMatch] Error:", err);
    return null;
  }
}

/**
 * Guarantees that any existing Super Cup, UCL Grand Final, or Europa League Grand Final
 * in the database has its official announcement (and result, if completed) published on the social feed.
 */
export async function syncAllFinalsSocialPosts() {
  try {
    const finalMatches = await prisma.match.findMany({
      where: {
        OR: [
          { division: "SUPER_CUP", stage: "FINAL" },
          { division: "UCL", stage: "FINAL" },
          { division: "EUROPA", stage: "FINAL" },
        ],
      },
      include: {
        homePlayer: true,
        awayPlayer: true,
      },
    });

    for (const match of finalMatches) {
      // 1. Post announcement
      await syncFinalAnnouncementForMatch(match.id);

      // 2. If completed, post full-time result
      if (match.status === "FINISHED") {
        let resultType: SocialPostType | null = null;
        if (match.division === "SUPER_CUP") resultType = "SUPER_CUP_RESULT";
        else if (match.division === "UCL") resultType = "UCL_FINAL_RESULT";
        else if (match.division === "EUROPA") resultType = "EUROPA_FINAL_RESULT";

        if (resultType) {
          await syncSocialPostForMatch({
            type: resultType,
            matchId: match.id,
            division: match.division,
            homePlayerId: match.homePlayerId,
            awayPlayerId: match.awayPlayerId,
            homeScore: match.homeScore,
            awayScore: match.awayScore,
          });
        }
      }
    }
  } catch (err) {
    console.error("[syncAllFinalsSocialPosts] Error syncing finals to social feed:", err);
  }
}

