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
    const { matchId, homeScore, awayScore, screenshotUrl, notes } = body;

    if (!matchId || homeScore === undefined || awayScore === undefined || !screenshotUrl) {
      return NextResponse.json(
        { error: "Match ID, Scores, and Match Screenshot proof are required." },
        { status: 400 }
      );
    }

    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match) {
      return NextResponse.json({ error: "Match fixture not found." }, { status: 404 });
    }

    // Check if 24-hr window has expired
    if (new Date() > new Date(match.deadlineDate)) {
      return NextResponse.json(
        {
          error:
            "The 24-hour match window for this fixture has expired (12:00 AM cutoff). Result submissions are closed.",
        },
        { status: 400 }
      );
    }

    // Create submission for admin review
    const submission = await prisma.matchSubmission.create({
      data: {
        matchId,
        submittedByPlayerId: user.player.id,
        homeScore: Number(homeScore),
        awayScore: Number(awayScore),
        screenshotUrl,
        notes: notes || null,
        status: "PENDING",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Match results and screenshot submitted! Admin will verify and update the table.",
      submission,
    });
  } catch (err: any) {
    console.error("Result submission error:", err);
    return NextResponse.json({ error: "Failed to submit match results." }, { status: 500 });
  }
}
