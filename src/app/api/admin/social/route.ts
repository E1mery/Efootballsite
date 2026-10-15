import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { detectPendingSystemEvents } from "@/lib/socialEventDetectionService";
import {
  createOrUpdateSocialPost,
  processScheduledSocialPosts,
} from "@/lib/socialPublishingService";
import {
  APPROVED_BACKGROUND_LIST,
  getBackgroundByKeyOrPath,
} from "@/lib/socialBackgroundEngine";
import {
  decodePostCaption,
  encodePostCaption,
  SocialGraphicData,
} from "@/lib/socialFeedTypes";

async function verifyAdmin() {
  const cookieStore = await cookies();
  const sessionUserId = cookieStore.get("efrl_session")?.value;
  if (!sessionUserId) {
    return { error: "Unauthorized. Please log in.", status: 401 };
  }

  const user = await prisma.user.findUnique({
    where: { id: sessionUserId },
  });

  if (!user || user.role !== "ADMIN") {
    return { error: "Forbidden. Admin access required.", status: 403 };
  }

  return { user };
}

export async function GET(req: Request) {
  try {
    const auth = await verifyAdmin();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status"); // "ALL", "DRAFT", "PENDING_REVIEW", "SCHEDULED", "PUBLISHED", "CANCELLED"

    // Process any scheduled posts whose time has arrived
    await processScheduledSocialPosts().catch((err) => {
      console.error("[GET /api/admin/social] Error checking scheduled posts:", err);
    });

    const where: any = {};
    if (statusFilter && statusFilter !== "ALL") {
      where.status = statusFilter;
    }

    const [settings, detectedEvents, posts] = await Promise.all([
      prisma.socialAutomationSetting.upsert({
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
      }),
      detectPendingSystemEvents(),
      prisma.socialPost.findMany({
        where,
        include: {
          match: {
            include: {
              homePlayer: true,
              awayPlayer: true,
            },
          },
          _count: {
            select: {
              reactions: true,
              comments: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
    ]);

    // Format posts with decoded structured graphic data
    const formattedPosts = posts.map((post) => {
      const { cleanCaption, data } = decodePostCaption(post.caption);
      const bg = getBackgroundByKeyOrPath(data?.backgroundKey);

      return {
        id: post.id,
        type: post.type,
        headline: post.headline,
        caption: cleanCaption,
        rawCaption: post.caption,
        hashtags: post.hashtags,
        division: post.division,
        season: post.season,
        status: post.status,
        publishedAt: post.publishedAt,
        createdAt: post.createdAt,
        likesCount: post._count.reactions,
        commentsCount: post._count.comments,
        matchId: post.matchId,
        match: post.match
          ? {
              id: post.match.id,
              round: post.match.round,
              division: post.match.division,
              status: post.match.status,
              matchDate: post.match.matchDate,
              homePlayer: {
                gamerTag: post.match.homePlayer.gamerTag,
                realTeam: post.match.homePlayer.realTeam,
              },
              awayPlayer: {
                gamerTag: post.match.awayPlayer.gamerTag,
                realTeam: post.match.awayPlayer.realTeam,
              },
            }
          : null,
        graphicData: data,
        background: bg,
      };
    });

    return NextResponse.json({
      settings,
      detectedEvents,
      posts: formattedPosts,
      approvedBackgrounds: APPROVED_BACKGROUND_LIST,
    });
  } catch (err: any) {
    console.error("[GET /api/admin/social] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await verifyAdmin();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await req.json();
    const {
      type,
      category = "MATCHES_RESULTS",
      headline,
      caption,
      hashtags = [],
      division,
      season,
      matchId,
      status = "PUBLISHED",
      scheduledFor,
      backgroundKey,
      graphicData = {},
    } = body;

    if (!type) {
      return NextResponse.json({ error: "Post type is required." }, { status: 400 });
    }

    const post = await createOrUpdateSocialPost({
      type,
      category,
      headline,
      caption,
      hashtags,
      division,
      season,
      matchId,
      status,
      scheduledFor,
      publishedBy: auth.user?.email || null,
      backgroundKey,
      graphicData,
    });

    return NextResponse.json({
      success: true,
      message: status === "SCHEDULED" ? "Post scheduled successfully." : "Post published successfully.",
      post,
    });
  } catch (err: any) {
    console.error("[POST /api/admin/social] Error creating post:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const auth = await verifyAdmin();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await req.json();

    // 1. If updating automation settings
    if (body.action === "UPDATE_SETTINGS" || ("autoPublishMotd" in body && !body.postId)) {
      const updatedSettings = await prisma.socialAutomationSetting.upsert({
        where: { id: "default" },
        update: {
          ...(typeof body.autoPublishMotd === "boolean" && { autoPublishMotd: body.autoPublishMotd }),
          ...(typeof body.autoPublishMotdRes === "boolean" && { autoPublishMotdRes: body.autoPublishMotdRes }),
          ...(typeof body.autoPublishMotw === "boolean" && { autoPublishMotw: body.autoPublishMotw }),
          ...(typeof body.autoPublishMotwRes === "boolean" && { autoPublishMotwRes: body.autoPublishMotwRes }),
          ...(typeof body.autoRivalryThread === "boolean" && { autoRivalryThread: body.autoRivalryThread }),
        },
        create: {
          id: "default",
          ...body,
        },
      });

      return NextResponse.json({ success: true, settings: updatedSettings });
    }

    // 2. If updating a specific social post (Edit presentation, change background, approve, reschedule, cancel)
    const { postId, headline, caption, hashtags, status, backgroundKey, scheduledFor } = body;

    if (!postId) {
      return NextResponse.json({ error: "Missing postId." }, { status: 400 });
    }

    const existing = await prisma.socialPost.findUnique({
      where: { id: postId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Post not found." }, { status: 404 });
    }

    const { cleanCaption, data } = decodePostCaption(existing.caption);

    const updatedData: SocialGraphicData = {
      ...(data || {
        category: "MATCHES_RESULTS",
        backgroundKey: backgroundKey || "/images/home-stadium-bg.jpg",
      }),
      ...(backgroundKey && { backgroundKey }),
      ...(scheduledFor !== undefined && { scheduledFor: scheduledFor ? new Date(scheduledFor).toISOString() : null }),
    };

    const newCaption = caption !== undefined ? caption : cleanCaption;
    const encodedCaption = encodePostCaption(newCaption, updatedData);

    const updatedPost = await prisma.socialPost.update({
      where: { id: postId },
      data: {
        ...(headline !== undefined && { headline }),
        caption: encodedCaption,
        ...(hashtags !== undefined && { hashtags }),
        ...(status !== undefined && {
          status,
          ...(status === "PUBLISHED" && { publishedAt: new Date() }),
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Post updated successfully.",
      post: updatedPost,
    });
  } catch (err: any) {
    console.error("[PATCH /api/admin/social] Error updating:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const auth = await verifyAdmin();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(req.url);
    const commentId = searchParams.get("commentId");
    const postId = searchParams.get("postId");

    if (commentId) {
      await prisma.socialComment.delete({
        where: { id: commentId },
      });
      return NextResponse.json({ success: true, message: "Comment deleted." });
    }

    if (postId) {
      await prisma.socialPost.delete({
        where: { id: postId },
      });
      return NextResponse.json({ success: true, message: "Post deleted." });
    }

    return NextResponse.json({ error: "Missing commentId or postId." }, { status: 400 });
  } catch (err: any) {
    console.error("[DELETE /api/admin/social] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
