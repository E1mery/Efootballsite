import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

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
      return NextResponse.json({ error: "Player profile not found" }, { status: 404 });
    }

    const body = await req.json();
    const { matchId, proofScreenshotUrl, reason } = body;

    if (!matchId || !proofScreenshotUrl || !reason) {
      return NextResponse.json(
        { error: "Match ID, Proof Screenshot, and Reason are required." },
        { status: 400 }
      );
    }

    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match) {
      return NextResponse.json({ error: "Match not found." }, { status: 404 });
    }

    // Check if 24-hr window has expired
    if (new Date() > new Date(match.deadlineDate)) {
      return NextResponse.json(
        {
          error:
            "The 24-hour match window for this fixture has expired (12:00 AM cutoff). Forfeit submissions are closed.",
        },
        { status: 400 }
      );
    }

    const accusedPlayerId =
      match.homePlayerId === user.player.id ? match.awayPlayerId : match.homePlayerId;

    const claim = await prisma.forfeitClaim.create({
      data: {
        matchId,
        claimantPlayerId: user.player.id,
        accusedPlayerId,
        proofScreenshotUrl,
        reason,
        status: "PENDING",
      },
    });

    return NextResponse.json({
      success: true,
      message:
        "Forfeit claim submitted with proof screenshot. The League Administrator will review and award a 3-0 walkover if confirmed.",
      claim,
    });
  } catch (err: any) {
    console.error("Forfeit submission error:", err);
    return NextResponse.json({ error: "Failed to submit forfeit claim." }, { status: 500 });
  }
}
