import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const sessionUserId = cookieStore.get("efrl_session")?.value;

    if (!sessionUserId) {
      return NextResponse.json({ error: "Unauthorized. Please log in to react." }, { status: 401 });
    }

    const { postId } = await req.json();
    if (!postId) {
      return NextResponse.json({ error: "Post ID is required." }, { status: 400 });
    }

    // Check if user already liked
    const existing = await prisma.socialReaction.findUnique({
      where: {
        postId_userId: {
          postId,
          userId: sessionUserId,
        },
      },
    });

    let liked = false;
    if (existing) {
      // Unlike
      await prisma.socialReaction.delete({
        where: { id: existing.id },
      });
      liked = false;
    } else {
      // Like
      await prisma.socialReaction.create({
        data: {
          postId,
          userId: sessionUserId,
        },
      });
      liked = true;
    }

    const newCount = await prisma.socialReaction.count({
      where: { postId },
    });

    return NextResponse.json({
      success: true,
      liked,
      likesCount: newCount,
    });
  } catch (error: any) {
    console.error("[POST /api/social/react] Error:", error);
    return NextResponse.json({ error: "Failed to update reaction." }, { status: 500 });
  }
}
