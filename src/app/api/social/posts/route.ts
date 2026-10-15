import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { syncAllFinalsSocialPosts } from "@/lib/socialFeedService";

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const sessionUserId = cookieStore.get("efrl_session")?.value;

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(20, Math.max(1, parseInt(searchParams.get("limit") || "8", 10)));
    const filterType = searchParams.get("type"); // "ALL", "MOTD", "MOTW", "RIVALRY", "DERBY", "FINALS"
    const skip = (page - 1) * limit;

    // On initial page load or when requesting all/finals, guarantee finals are synced to feed and scheduled posts processed
    if (page === 1) {
      await Promise.all([
        syncAllFinalsSocialPosts().catch((err) => {
          console.error("[social/posts] Error during auto finals sync:", err);
        }),
        (async () => {
          const { processScheduledSocialPosts } = await import("@/lib/socialPublishingService");
          await processScheduledSocialPosts().catch((err) => {
            console.error("[social/posts] Error processing scheduled posts:", err);
          });
        })(),
      ]);
    }

    const where: any = {
      status: "PUBLISHED",
    };

    if (filterType === "MOTD") {
      where.type = { in: ["MOTD_ANNOUNCEMENT", "MOTD_RESULT"] };
    } else if (filterType === "MOTW") {
      where.type = { in: ["MOTW_ANNOUNCEMENT", "MOTW_RESULT"] };
    } else if (filterType === "RIVALRY") {
      where.type = "MOTW_RIVALRY";
    } else if (filterType === "DERBY") {
      where.type = { in: ["DERBY_ANNOUNCEMENT", "DERBY_RESULT"] };
    } else if (filterType === "DRAWS") {
      where.type = {
        in: [
          "UCL_DRAW_ANNOUNCEMENT",
          "EUROPA_DRAW_ANNOUNCEMENT",
          "GROUP_STAGE_DRAW_ANNOUNCEMENT",
          "CONFIRMED_GROUP_DRAW_RESULTS",
          "PLAYOFF_DRAW_ANNOUNCEMENT",
          "CONFIRMED_PLAYOFF_MATCHUPS",
          "KNOCKOUT_DRAW_RESULTS",
        ],
      };
    } else if (filterType === "STANDINGS") {
      where.type = {
        in: [
          "STANDINGS_UPDATE_D1",
          "STANDINGS_UPDATE_D2",
          "STANDINGS_UPDATE_D3",
          "STANDINGS_UPDATE_UCL",
          "STANDINGS_UPDATE_EUROPA",
          "QUALIFICATION_TABLE_UPDATE",
        ],
      };
    } else if (filterType === "SEASON") {
      where.type = {
        in: [
          "SEASON_ANNOUNCEMENT",
          "REGISTRATION_OPEN",
          "REGISTRATION_CLOSING",
          "REGISTRATION_DEADLINE_REMINDER",
          "SEASON_KICKOFF_ANNOUNCEMENT",
          "DIVISION_ASSIGNMENTS",
          "TEAM_SELECTION_REMINDER",
          "PLAYER_CONFIRMATION_NOTICE",
          "OFFICIAL_FIXTURE_RELEASE",
          "SEASON_COMPLETION_ANNOUNCEMENT",
          "CONFIRMED_CHAMPIONS",
        ],
      };
    } else if (filterType === "NOTICES") {
      where.type = {
        in: [
          "OFFICIAL_LEAGUE_NOTICE",
          "MATCH_DEADLINE_CHANGE",
          "SCHEDULE_CHANGE",
          "COMPETITION_FORMAT_ANNOUNCEMENT",
          "WEBSITE_FEATURE_ANNOUNCEMENT",
          "HALL_OF_FAME_ANNOUNCEMENT",
          "SEASON_ARCHIVE_ANNOUNCEMENT",
          "SYSTEM_MAINTENANCE_NOTICE",
        ],
      };
    } else if (filterType === "FINALS") {
      where.type = {
        in: [
          "SUPER_CUP_ANNOUNCEMENT",
          "SUPER_CUP_RESULT",
          "UCL_FINAL_ANNOUNCEMENT",
          "UCL_FINAL_RESULT",
          "EUROPA_FINAL_ANNOUNCEMENT",
          "EUROPA_FINAL_RESULT",
        ],
      };
    }

    const [posts, totalCount] = await Promise.all([
      prisma.socialPost.findMany({
        where,
        include: {
          match: {
            include: {
              homePlayer: true,
              awayPlayer: true,
            },
          },
          reactions: true,
          comments: {
            take: 3,
            orderBy: { createdAt: "desc" },
            include: {
              user: {
                include: { player: true },
              },
            },
          },
          _count: {
            select: {
              reactions: true,
              comments: true,
            },
          },
        },
        orderBy: { publishedAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.socialPost.count({ where }),
    ]);

    // Format posts for UI consumption
    const formatted = posts.map((post) => {
      const hasUserLiked = sessionUserId
        ? post.reactions.some((r) => r.userId === sessionUserId)
        : false;

      return {
        id: post.id,
        type: post.type,
        headline: post.headline,
        caption: post.caption,
        hashtags: post.hashtags,
        division: post.division,
        season: post.season,
        publishedAt: post.publishedAt,
        homeScore: post.homeScore,
        awayScore: post.awayScore,
        derbyId: (post as any).derbyId,
        derbyName: (post as any).derbyName,
        likesCount: post._count.reactions,
        commentsCount: post._count.comments,
        hasLiked: hasUserLiked,
        match: post.match
          ? {
              id: post.match.id,
              round: post.match.round,
              division: post.match.division,
              status: post.match.status,
              homeScore: post.match.homeScore,
              awayScore: post.match.awayScore,
              matchDate: post.match.matchDate,
              deadlineDate: post.match.deadlineDate,
              homePlayer: {
                id: post.match.homePlayer.id,
                gamerTag: post.match.homePlayer.gamerTag,
                realTeam: post.match.homePlayer.realTeam,
                avatar: post.match.homePlayer.avatar,
              },
              awayPlayer: {
                id: post.match.awayPlayer.id,
                gamerTag: post.match.awayPlayer.gamerTag,
                realTeam: post.match.awayPlayer.realTeam,
                avatar: post.match.awayPlayer.avatar,
              },
            }
          : null,
        recentComments: post.comments.map((c) => ({
          id: c.id,
          content: c.content,
          isOpponentBanter: c.isOpponentBanter,
          createdAt: c.createdAt,
          user: {
            id: c.user.id,
            role: c.user.role,
            gamerTag: c.user.player?.gamerTag || "League Member",
            avatar: c.user.player?.avatar || null,
            realTeam: c.user.player?.realTeam || null,
          },
        })),
      };
    });

    return NextResponse.json({
      posts: formatted,
      pagination: {
        page,
        limit,
        total: totalCount,
        hasMore: skip + posts.length < totalCount,
      },
    });
  } catch (error: any) {
    console.error("[GET /api/social/posts] Error:", error);
    return NextResponse.json({ error: "Failed to load social feed" }, { status: 500 });
  }
}
