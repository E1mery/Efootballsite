import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const postId = searchParams.get("postId");

    if (!postId) {
      return NextResponse.json({ error: "postId is required" }, { status: 400 });
    }

    const comments = await prisma.socialComment.findMany({
      where: { postId },
      orderBy: { createdAt: "asc" },
      include: {
        user: {
          include: { player: true },
        },
      },
    });

    const formatted = comments.map((c) => ({
      id: c.id,
      content: c.content,
      isOpponentBanter: c.isOpponentBanter,
      createdAt: c.createdAt,
      user: {
        id: c.user.id,
        role: c.user.role,
        gamerTag: c.user.player?.gamerTag || (c.user.role === "ADMIN" ? "Commissioner Office" : "League Member"),
        avatar: c.user.player?.avatar || null,
        realTeam: c.user.player?.realTeam || null,
      },
    }));

    return NextResponse.json({ comments: formatted });
  } catch (error: any) {
    console.error("[GET /api/social/comments] Error:", error);
    return NextResponse.json({ error: "Failed to load comments" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const sessionUserId = cookieStore.get("efrl_session")?.value;

    if (!sessionUserId) {
      return NextResponse.json({ error: "Unauthorized. Please log in to comment." }, { status: 401 });
    }

    const body = await req.json();
    const { postId, content } = body;

    const trimmed = (content || "").trim();
    if (!postId || !trimmed) {
      return NextResponse.json({ error: "Comment text cannot be empty." }, { status: 400 });
    }

    if (trimmed.length > 500) {
      return NextResponse.json({ error: "Comment exceeds 500 character limit." }, { status: 400 });
    }

    // Content Moderation Filter
    const prohibitedTerms = [
      "fuck", "shit", "bitch", "nigger", "nigga", "bastard", "cunt", "whore",
      "idiot", "retard", "faggot", "trash player", "kill yourself"
    ];
    const lowerContent = trimmed.toLowerCase();
    const containsProhibited = prohibitedTerms.some((term) =>
      new RegExp(`\\b${term}\\b`, "i").test(lowerContent)
    );
    if (containsProhibited) {
      return NextResponse.json(
        { error: "Comment flagged by League Moderation. Offensive and abusive language is strictly prohibited." },
        { status: 400 }
      );
    }

    // Verify post exists
    const post = await prisma.socialPost.findUnique({
      where: { id: postId },
      include: { match: true },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found." }, { status: 404 });
    }

    // Check if commenter is one of the match participants (for banter tag)
    const currentUser = await prisma.user.findUnique({
      where: { id: sessionUserId },
      include: { player: true },
    });

    let isOpponentBanter = false;
    if (currentUser?.player && post.match) {
      isOpponentBanter =
        currentUser.player.id === post.match.homePlayerId ||
        currentUser.player.id === post.match.awayPlayerId;
    }

    const comment = await prisma.socialComment.create({
      data: {
        postId,
        userId: sessionUserId,
        content: trimmed,
        isOpponentBanter,
      },
      include: {
        user: {
          include: { player: true },
        },
      },
    });

    const newCommentsCount = await prisma.socialComment.count({
      where: { postId },
    });

    return NextResponse.json({
      success: true,
      commentsCount: newCommentsCount,
      comment: {
        id: comment.id,
        content: comment.content,
        isOpponentBanter: comment.isOpponentBanter,
        createdAt: comment.createdAt,
        user: {
          id: comment.user.id,
          role: comment.user.role,
          gamerTag: comment.user.player?.gamerTag || (comment.user.role === "ADMIN" ? "Commissioner Office" : "League Member"),
          avatar: comment.user.player?.avatar || null,
          realTeam: comment.user.player?.realTeam || null,
        },
      },
    });
  } catch (error: any) {
    console.error("[POST /api/social/comments] Error:", error);
    return NextResponse.json({ error: "Failed to post comment." }, { status: 500 });
  }
}
