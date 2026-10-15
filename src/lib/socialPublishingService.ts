/**
 * Rwanda eFootball League — Social Media Publishing & Workflow Service
 * Professional football-media platform inspired by UEFA competition graphics,
 * EA SPORTS FC broadcast packages, and authentic football journalism.
 * STRICT: ZERO demo data, NO goalscorers, actual confirmed scores and teams only.
 */

import { prisma } from "@/lib/prisma";
import { formatRwandanDate, formatRwandanTime, formatRwandanDateTime } from "@/lib/rwandanTime";
import { resolveSocialBackground } from "./socialBackgroundEngine";
import {
  SocialEventCategory,
  ExtendedSocialPostType,
  SocialPostStatus,
  SocialGraphicData,
  encodePostCaption,
  decodePostCaption,
} from "./socialFeedTypes";

export interface PublishSocialPostInput {
  type: ExtendedSocialPostType | string;
  category: SocialEventCategory;
  headline?: string;
  caption?: string;
  hashtags?: string[];
  division?: string | null;
  season?: string | null;
  matchId?: string | null;
  derbyId?: string | null;
  derbyName?: string | null;
  status?: SocialPostStatus;
  scheduledFor?: Date | string | null;
  publishedBy?: string | null;
  backgroundKey?: string;
  graphicData: SocialGraphicData;
}

/**
 * Editorial football journalism copy generator.
 * Strictly adheres to verified system values.
 */
export function generateProfessionalSocialCopy(
  type: ExtendedSocialPostType | string,
  meta: SocialGraphicData,
  options: {
    division?: string | null;
    season?: string | null;
    matchDate?: Date | string | null;
  } = {}
): { headline: string; caption: string; hashtags: string[] } {
  const divLabel = options.division || "eFootball League";
  const seasonLabel = options.season || "Season 1 (2026)";

  switch (type) {
    // -------------------------------------------------------------------------
    // A. COMPETITION DRAWS
    // -------------------------------------------------------------------------
    case "UCL_DRAW_ANNOUNCEMENT":
      return {
        headline: `⭐ OFFICIAL DRAW ANNOUNCEMENT | UEFA CHAMPIONS LEAGUE`,
        caption: `HERE WE GO! The stage is being prepared for the pinnacle of continental esports.\n\n` +
          `⭐ UEFA CHAMPIONS LEAGUE LIVE DRAW\n` +
          `📅 Scheduled: ${meta.kickoffDate || "Upcoming"} at ${meta.kickoffTime || "18:00"} CAT\n` +
          `📍 Live Broadcast: Rwanda eFootball League Continental Arena\n\n` +
          `16 elite athletes from Division 1, 2, and 3 will be drawn into Groups A, B, C, and D. Strict division constraints apply. Who will survive the Group of Death? Drop your reactions below! 👇`,
        hashtags: ["#UCLDraw", "#ChampionsLeague", "#eFootballRW", "#RoadToGlory", "#RwandaEsports"],
      };

    case "EUROPA_DRAW_ANNOUNCEMENT":
      return {
        headline: `🟠 OFFICIAL DRAW ANNOUNCEMENT | UEFA EUROPA LEAGUE`,
        caption: `🚨 CONTINENTAL CLASH LOOMS! The Europa League official live draw is set.\n\n` +
          `🟠 UEFA EUROPA LEAGUE LIVE DRAW\n` +
          `📅 Scheduled: ${meta.kickoffDate || "Upcoming"} at ${meta.kickoffTime || "18:00"} CAT\n` +
          `📍 Live Broadcast: Rwanda eFootball League Continental Arena\n\n` +
          `16 contenders battle for European silverware and qualification to the UEFA Super Cup. Tune in to watch the live animated draw event! 👏`,
        hashtags: ["#EuropaLeagueDraw", "#UEL", "#eFootballRW", "#RwandaGaming", "#ContinentalCups"],
      };

    case "CONFIRMED_GROUP_DRAW_RESULTS": {
      const compName = divLabel.toUpperCase().includes("UCL") ? "UEFA Champions League" : "UEFA Europa League";
      return {
        headline: `📋 CONFIRMED GROUP DRAW RESULTS | ${compName.toUpperCase()}`,
        caption: `🚨 OFFICIAL RESULTS: The group stages are officially locked!\n\n` +
          `🏆 ${compName.toUpperCase()} GROUPS A - D CONFIRMED\n\n` +
          `Every qualified athlete has learned their fate. With strict division distribution applied, the battle for the top two qualification spots in each group begins now.\n\n` +
          `Check the full group tables on the Continental Cups portal and prepare your tactics! 🔥`,
        hashtags: ["#GroupDrawResults", "#eFootballRW", "#OfficialGroups", "#RwandaEsports"],
      };
    }

    case "CONFIRMED_PLAYOFF_MATCHUPS":
      return {
        headline: `⚔️ KNOCKOUT PLAYOFF MATCHUPS CONFIRMED | ROAD TO THE FINAL`,
        caption: `🚨 THE KNOCKOUT STAGE IS SET! The official bracket pairings have been confirmed by League Administration.\n\n` +
          `High-stakes two-legged ties with aggregate scores will decide who punches their ticket to the Grand Final. No second chances! Who makes the final four? 👇`,
        hashtags: ["#Playoffs", "#KnockoutStage", "#RoadToTheFinal", "#eFootballRW"],
      };

    // -------------------------------------------------------------------------
    // B. SEASON ACTIVITIES
    // -------------------------------------------------------------------------
    case "SEASON_KICKOFF_ANNOUNCEMENT":
      return {
        headline: `🚀 OFFICIAL SEASON KICKOFF | ${seasonLabel.toUpperCase()}`,
        caption: `HERE WE GO! The new Rwanda eFootball League campaign is officially underway!\n\n` +
          `🏆 ${seasonLabel.toUpperCase()}\n` +
          `🔥 Division 1, Division 2, and Division 3 kickoff simultaneously across Rwanda.\n` +
          `📅 Matchday 1 fixtures are now LIVE on the platform. All athletes are reminded to coordinate their matches via WhatsApp and submit verified screenshots within the 24-hour midnight window.\n\n` +
          `May the best athletes lift the championship trophies! 👏⚽`,
        hashtags: ["#SeasonKickoff", "#eFootballRW", "#RwandaEsports", "#Kickoff", "#Division1", "#Division2", "#Division3"],
      };

    case "REGISTRATION_OPEN":
      return {
        headline: `📝 REGISTRATION OFFICIALLY OPEN | RWANDA eFOOTBALL LEAGUE`,
        caption: `🚨 ATHLETE RECRUITMENT IS LIVE! Registrations for the Rwanda eFootball League are now officially open.\n\n` +
          `Competitive athletes on eFootball Mobile across Rwanda are invited to register. Secure your club, climb the divisions, and battle for the prestigious national title.\n\n` +
          `Visit the registration portal today before division capacities fill up! 📱✨`,
        hashtags: ["#RegistrationOpen", "#eFootballRW", "#JoinTheLeague", "#RwandaGaming"],
      };

    case "REGISTRATION_DEADLINE_REMINDER":
      return {
        headline: `⏳ REGISTRATION DEADLINE REMINDER | FINAL CALL FOR ATHLETES`,
        caption: `⚠️ TIME IS RUNNING OUT! The registration deadline for the upcoming season is rapidly approaching.\n\n` +
          `Athletes with pending registrations or unconfirmed WhatsApp numbers must finalize their profiles immediately. Unclaimed spots will be transferred to the reserve pool.`,
        hashtags: ["#RegistrationDeadline", "#FinalCall", "#eFootballRW", "#EsportsNotice"],
      };

    case "CONFIRMED_CHAMPIONS": {
      const champTag = meta.winnerGamerTag || "THE CHAMPION";
      return {
        headline: `👑 CHAMPIONS CROWNED! | ${champTag.toUpperCase()} LIFTS THE TROPHY!`,
        caption: `🏁 HISTORY SEALED! We officially crown our new champion in the Rwanda eFootball League!\n\n` +
          `👑 OFFICIAL CHAMPION: @${champTag}\n` +
          `🏆 TOURNAMENT: ${meta.subtitle || "Rwanda eFootball League"}\n\n` +
          `A legendary campaign filled with resilience, tactical mastery, and unforgettable moments. Verified by League Administration and immortalized in the Hall of Fame! 👏🔥🏆`,
        hashtags: ["#Champion", "#HallOfFame", "#eFootballRW", "#ChampionsCrowned", "#Legend"],
      };
    }

    // -------------------------------------------------------------------------
    // C. MATCHES AND RESULTS
    // -------------------------------------------------------------------------
    case "MOTD_ANNOUNCEMENT":
      return {
        headline: `🚨 MATCH OF THE DAY | ${meta.homeGamerTag?.toUpperCase()} 🆚 ${meta.awayGamerTag?.toUpperCase()}`,
        caption: `HERE WE GO! Official Match of the Day confirmed for ${divLabel}.\n\n` +
          `🔥 ${meta.homeGamerTag} (${meta.homeTeamName || "Club"}) takes on ${meta.awayGamerTag} (${meta.awayTeamName || "Club"}) in a marquee fixture.\n` +
          `Three massive points and table supremacy on the line. Who claims victory today? Drop your predictions below! 👇`,
        hashtags: ["#MatchOfTheDay", "#MOTD", "#eFootballRW", `#${divLabel.replace(/\s+/g, "")}`],
      };

    case "MOTD_RESULT":
    case "CONFIRMED_FULL_TIME_RESULT": {
      const hScore = meta.homeScore ?? 0;
      const aScore = meta.awayScore ?? 0;
      const outcome =
        hScore > aScore
          ? `${meta.homeGamerTag} secures the victory over ${meta.awayGamerTag}!`
          : aScore > hScore
          ? `${meta.awayGamerTag} claims the away triumph over ${meta.homeGamerTag}!`
          : `Points shared! A thrilling draw between ${meta.homeGamerTag} and ${meta.awayGamerTag}.`;

      return {
        headline: `🏁 FULL TIME | ${meta.homeGamerTag?.toUpperCase()} ${hScore} - ${aScore} ${meta.awayGamerTag?.toUpperCase()}`,
        caption: `🚨 OFFICIAL RESULT: It is full time in ${divLabel}!\n\n` +
          `FINAL: ${meta.homeGamerTag} (${meta.homeTeamName || "Home"}) ${hScore} - ${aScore} ${meta.awayGamerTag} (${meta.awayTeamName || "Away"}).\n` +
          `${outcome}\n\n` +
          `All verified points and goal differences have officially updated the ${divLabel} standings. 👏`,
        hashtags: ["#FullTime", "#OfficialResult", "#eFootballRW", `#${divLabel.replace(/\s+/g, "")}`],
      };
    }

    case "SUPER_CUP_ANNOUNCEMENT":
      return {
        headline: `🏆 UEFA SUPER CUP FINAL | ${meta.homeGamerTag?.toUpperCase()} 🆚 ${meta.awayGamerTag?.toUpperCase()}`,
        caption: `🚨 THE ULTIMATE CLASH OF CHAMPIONS! Official UEFA Super Cup Final confirmed.\n\n` +
          `🏆 UCL Winner ${meta.homeGamerTag} (${meta.homeTeamName || "UCL"}) vs Europa League Winner ${meta.awayGamerTag} (${meta.awayTeamName || "Europa"}).\n\n` +
          `Single-match final showdown for ultimate continental supremacy in the Rwanda eFootball League. Who lifts the Super Cup trophy? Cast your votes below! 👇`,
        hashtags: ["#SuperCup", "#SuperCupFinal", "#eFootballRW", "#ClashOfChampions"],
      };

    case "SUPER_CUP_RESULT": {
      const winner = meta.winnerGamerTag || "CHAMPION";
      return {
        headline: `🏆 SUPER CUP CHAMPIONS! | ${winner.toUpperCase()} LIFTS THE TROPHY! | ${meta.homeScore} - ${meta.awayScore}`,
        caption: `🏁 FULL TIME: The UEFA Super Cup champion has officially been crowned!\n\n` +
          `🏆 FINAL SCORE: ${meta.homeGamerTag} ${meta.homeScore} - ${meta.awayScore} ${meta.awayGamerTag}\n` +
          `👑 OFFICIAL CHAMPION: @${winner}\n\n` +
          `Verified by League Administration. The Super Cup trophy has been lifted and immortalized in the Hall of Fame! 👏🔥`,
        hashtags: ["#SuperCupChampion", "#SuperCup", "#FullTime", "#eFootballRW", "#HallOfFame"],
      };
    }

    // -------------------------------------------------------------------------
    // D. STANDINGS AND STATISTICS
    // -------------------------------------------------------------------------
    case "STANDINGS_UPDATE_D1":
    case "STANDINGS_UPDATE_D2":
    case "STANDINGS_UPDATE_D3":
      return {
        headline: `📊 OFFICIAL TABLE STANDINGS | ${divLabel.toUpperCase()}`,
        caption: `🚨 LEAGUE TABLE UPDATE: Verified standings for ${divLabel} are in!\n\n` +
          `Every point, goal difference, and head-to-head outcome has been verified by the Commissioner's Office.\n\n` +
          `Check the full leaderboard on the official Standings page to track the title race, promotion battles, and relegation scrap! 👏📊`,
        hashtags: ["#Standings", "#LeagueTable", "#eFootballRW", `#${divLabel.replace(/\s+/g, "")}`],
      };

    // -------------------------------------------------------------------------
    // E. ADMINISTRATIVE ANNOUNCEMENTS
    // -------------------------------------------------------------------------
    case "OFFICIAL_LEAGUE_NOTICE":
    case "MATCH_DEADLINE_CHANGE":
    case "SCHEDULE_CHANGE":
      return {
        headline: `📢 OFFICIAL LEAGUE NOTICE | COMMISSIONER'S OFFICE`,
        caption: `OFFICIAL LEAGUE DIRECTIVE\n\n` +
          `${meta.subtitle || "Notice from Rwanda eFootball League Administration"}\n\n` +
          `All athletes, managers, and community members are requested to review this official communication. Compliance with all league regulations and deadlines is mandatory.\n\n` +
          `Rwanda eFootball League Administration. 🛡️`,
        hashtags: ["#OfficialNotice", "#eFootballRW", "#LeagueDirective", "#RwandaEsports"],
      };

    default:
      return {
        headline: meta.bannerTitle || `📢 RWANDA eFOOTBALL LEAGUE UPDATE`,
        caption: `Official announcement and verified matchday update from the Rwanda eFootball League.`,
        hashtags: ["#eFootballRW", "#RwandaGaming"],
      };
  }
}

/**
 * Authoritative creation/updating of a Social Post with structured graphic data.
 * Prevents duplicates via unique eventKey or (type, matchId).
 */
export async function createOrUpdateSocialPost(input: PublishSocialPostInput) {
  const {
    type,
    category,
    division,
    season,
    matchId,
    derbyId,
    derbyName,
    status = "PUBLISHED",
    scheduledFor,
    publishedBy,
    graphicData,
  } = input;

  const bg = resolveSocialBackground({
    category,
    type,
    division,
    competition: division,
  });

  const finalGraphicData: SocialGraphicData = {
    ...graphicData,
    category,
    backgroundKey: input.backgroundKey || graphicData.backgroundKey || bg.imagePath,
    scheduledFor: scheduledFor ? new Date(scheduledFor).toISOString() : null,
    publishedBy: publishedBy || null,
  };

  const copy = generateProfessionalSocialCopy(type, finalGraphicData, { division, season });
  const finalHeadline = input.headline || copy.headline;
  const cleanCaption = input.caption || copy.caption;
  const encodedCaption = encodePostCaption(cleanCaption, finalGraphicData);
  const hashtags = input.hashtags && input.hashtags.length > 0 ? input.hashtags : copy.hashtags;

  const effectiveSeason = season || "Season 1 (2026)";

  // Check if an existing post already matches this event to prevent duplicates
  let existingPost: any = null;

  if (matchId) {
    existingPost = await prisma.socialPost.findFirst({
      where: {
        type: String(type),
        matchId,
      },
    });
  } else if (finalGraphicData.eventKey) {
    // Search by encoded eventKey in caption or by type and division
    const candidatePosts = await prisma.socialPost.findMany({
      where: {
        type: String(type),
        division: division || undefined,
        season: effectiveSeason,
      },
    });

    existingPost = candidatePosts.find((p) => {
      const { data } = decodePostCaption(p.caption);
      return data?.eventKey === finalGraphicData.eventKey;
    });
  }

  const effectiveStatus = scheduledFor && new Date(scheduledFor).getTime() > Date.now()
    ? "SCHEDULED"
    : status;

  if (existingPost) {
    return await prisma.socialPost.update({
      where: { id: existingPost.id },
      data: {
        headline: finalHeadline,
        caption: encodedCaption,
        hashtags,
        division: division || null,
        season: effectiveSeason,
        status: effectiveStatus,
        publishedAt: effectiveStatus === "PUBLISHED" ? new Date() : existingPost.publishedAt,
        homeScore: finalGraphicData.homeScore ?? existingPost.homeScore,
        awayScore: finalGraphicData.awayScore ?? existingPost.awayScore,
        derbyId: derbyId || existingPost.derbyId,
        derbyName: derbyName || existingPost.derbyName,
      },
    });
  }

  return await prisma.socialPost.create({
    data: {
      type: String(type),
      headline: finalHeadline,
      caption: encodedCaption,
      hashtags,
      division: division || null,
      season: effectiveSeason,
      matchId: matchId || null,
      homeScore: finalGraphicData.homeScore ?? null,
      awayScore: finalGraphicData.awayScore ?? null,
      derbyId: derbyId || null,
      derbyName: derbyName || null,
      status: effectiveStatus,
      publishedAt: effectiveStatus === "PUBLISHED" ? new Date() : new Date(0),
    },
  });
}

/**
 * Processes scheduled social posts whose publication time has arrived.
 * Compatible with serverless environments — called on feed queries and cron.
 */
export async function processScheduledSocialPosts(): Promise<number> {
  try {
    const scheduledPosts = await prisma.socialPost.findMany({
      where: {
        status: "SCHEDULED",
      },
    });

    const now = Date.now();
    let publishedCount = 0;

    for (const post of scheduledPosts) {
      const { data, cleanCaption } = decodePostCaption(post.caption);
      if (data?.scheduledFor) {
        const scheduleTime = new Date(data.scheduledFor).getTime();
        if (scheduleTime <= now) {
          // Transition to PUBLISHED
          data.scheduledFor = null;
          const updatedCaption = encodePostCaption(cleanCaption, data);

          await prisma.socialPost.update({
            where: { id: post.id },
            data: {
              status: "PUBLISHED",
              publishedAt: new Date(),
              caption: updatedCaption,
            },
          });
          publishedCount++;
        }
      }
    }

    return publishedCount;
  } catch (err) {
    console.error("[processScheduledSocialPosts] Error checking scheduled posts:", err);
    return 0;
  }
}
