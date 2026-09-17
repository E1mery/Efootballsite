import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const reviews = await prisma.feedbackReview.findMany({
      include: {
        player: {
          select: {
            id: true,
            gamerTag: true,
            fullName: true,
            division: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const totalReviews = reviews.length;
    const ratingCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let sum = 0;

    for (const r of reviews) {
      const star = Math.min(5, Math.max(1, r.rating));
      ratingCounts[star] = (ratingCounts[star] || 0) + 1;
      sum += star;
    }

    const averageRating = totalReviews > 0 ? Number((sum / totalReviews).toFixed(1)) : 5.0;

    return NextResponse.json({
      reviews,
      totalReviews,
      averageRating,
      ratingCounts,
    });
  } catch (err: any) {
    console.error("Fetch reviews error:", err);
    return NextResponse.json({ error: "Failed to fetch reviews." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const sessionUserId = cookieStore.get("efrl_session")?.value;
    if (!sessionUserId) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: sessionUserId },
      include: { player: true },
    });

    if (!user || !user.player) {
      return NextResponse.json({ error: "Player profile required to submit reviews." }, { status: 403 });
    }

    const body = await req.json();
    const { rating, comment, category = "GENERAL" } = body;

    const numRating = Number(rating);
    if (!numRating || numRating < 1 || numRating > 5) {
      return NextResponse.json({ error: "Please select a rating between 1 and 5 stars." }, { status: 400 });
    }

    if (!comment || !comment.trim()) {
      return NextResponse.json({ error: "Review feedback comment is required." }, { status: 400 });
    }

    // Check if player already submitted a review, if so update it; otherwise create
    const existing = await prisma.feedbackReview.findFirst({
      where: { playerId: user.player.id },
    });

    let review;
    if (existing) {
      review = await prisma.feedbackReview.update({
        where: { id: existing.id },
        data: {
          rating: numRating,
          category,
          comment: comment.trim(),
        },
      });
    } else {
      review = await prisma.feedbackReview.create({
        data: {
          playerId: user.player.id,
          rating: numRating,
          category,
          comment: comment.trim(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: existing ? "Your rating & review was successfully updated!" : "Thank you for your rating & feedback!",
      review,
    });
  } catch (err: any) {
    console.error("Submit review error:", err);
    return NextResponse.json({ error: err.message || "Failed to submit review." }, { status: 500 });
  }
}
