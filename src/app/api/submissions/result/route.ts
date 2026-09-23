import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { uploadBase64ToR2 } from "@/lib/r2";

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
    const {
      matchId,
      homeScore,
      awayScore,
      leg2HomeScore,
      leg2AwayScore,
      aggregateHomeScore,
      aggregateAwayScore,
      screenshotUrl,
      leg2ScreenshotUrl,
      notes,
    } = body;

    if (!matchId || homeScore === undefined || awayScore === undefined || !screenshotUrl) {
      return NextResponse.json(
        { error: "Match ID, Scores, and Match Screenshot proof are required." },
        { status: 400 }
      );
    }

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        homePlayer: true,
        awayPlayer: true,
        submissions: {
          where: { status: { not: "REJECTED" } },
          include: { submittedByPlayer: true },
        },
        forfeitClaims: {
          where: { status: { not: "REJECTED" } },
          include: { claimantPlayer: true },
        },
      },
    });

    if (!match) {
      return NextResponse.json({ error: "Match fixture not found." }, { status: 404 });
    }

    const isTwoLegged =
      match.stage === "GROUP" || match.stage === "QUARTER_FINAL" || match.stage === "SEMI_FINAL";

    if (isTwoLegged && !leg2ScreenshotUrl) {
      return NextResponse.json(
        {
          error:
            "This fixture is a 2-legged continental matchup played simultaneously. Please upload screenshots for BOTH Leg 1 and Leg 2.",
        },
        { status: 400 }
      );
    }

    // Calculate aggregates if not explicitly supplied
    const calculatedAggHome =
      aggregateHomeScore !== undefined
        ? Number(aggregateHomeScore)
        : Number(homeScore) + (leg2HomeScore !== undefined ? Number(leg2HomeScore) : 0);

    const calculatedAggAway =
      aggregateAwayScore !== undefined
        ? Number(aggregateAwayScore)
        : Number(awayScore) + (leg2AwayScore !== undefined ? Number(leg2AwayScore) : 0);

    // Verify player is a participant in this fixture
    if (match.homePlayerId !== user.player.id && match.awayPlayerId !== user.player.id) {
      return NextResponse.json(
        { error: "Unauthorized. You are not a registered athlete for this fixture." },
        { status: 403 }
      );
    }

    const isReplacementMatch = Boolean(match.notes?.includes("REPLACEMENT_BACKLOG"));
    const isReopenedByAdmin = Boolean(
      match.allowLateSubmission ||
        match.notes?.includes("ADMIN_REOPENED") ||
        isReplacementMatch
    );

    // BLOCK SUBMISSION IF OPPONENT REACHED 3 MISSED MATCHES AND MATCH IS WAITING FOR SUB
    const opponent = match.homePlayerId === user.player.id ? match.awayPlayer : match.homePlayer;
    const isWaitingSub = Boolean(
      match.notes?.includes("WAITING_FOR_SUB") ||
        (!isReplacementMatch && (opponent?.consecutiveMissed >= 3 || opponent?.isDisqualified))
    );

    if (isWaitingSub && !isReplacementMatch) {
      return NextResponse.json(
        {
          error:
            "This fixture is currently on hold. Your opponent reached 3 missed matches and is awaiting a replacement athlete from the League Admin. Submissions will unlock for 48 hours once the replacement arrives.",
        },
        { status: 400 }
      );
    }

    // If match is already completed
    if ((match.status === "FINISHED" || match.status === "FORFEIT") && !isReopenedByAdmin) {
      return NextResponse.json(
        { error: "This match is already finalized. Uploads are closed unless reopened by the Commissioner." },
        { status: 400 }
      );
    }

    // LINKED UPLOAD ENFORCEMENT:
    // If either player has already submitted a match result (status not rejected)
    if (match.submissions.length > 0 && !isReopenedByAdmin) {
      const activeSub = match.submissions[0];
      const submitter = activeSub.submittedByPlayer?.gamerTag || "an athlete";
      return NextResponse.json(
        {
          error: `A match result has already been uploaded by @${submitter}. The upload page is closed for both players while awaiting admin verification.`,
        },
        { status: 400 }
      );
    }

    // If either player has already lodged a forfeit claim (status not rejected)
    if (match.forfeitClaims.length > 0 && !isReopenedByAdmin) {
      const activeClaim = match.forfeitClaims[0];
      const claimant = activeClaim.claimantPlayer?.gamerTag || "an athlete";
      return NextResponse.json(
        {
          error: `A forfeit claim has already been lodged by @${claimant}. The upload window is closed for both players while under league arbitration.`,
        },
        { status: 400 }
      );
    }

    // Check if deadline has passed, allowing submissions if admin approved late entry, reopened, or 48-hr replacement window is active
    const isPastDeadline = new Date() > new Date(match.deadlineDate);
    if (isPastDeadline && !isReopenedByAdmin) {
      return NextResponse.json(
        {
          error: isReplacementMatch
            ? "The 48-hour completion window for this replacement fixture has expired."
            : "The 24-hour match window for this fixture has expired (12:00 AM cutoff). Please contact the League Admin to request a deadline extension.",
        },
        { status: 400 }
      );
    }

    // If reopened by admin and has prior pending submission, supersede them
    if (isReopenedByAdmin && match.submissions.length > 0) {
      await prisma.matchSubmission.updateMany({
        where: { matchId: match.id, status: "PENDING" },
        data: { status: "REPLACED", adminNotes: "Superseded by reopened submission" },
      });
    }

    // Ensure screenshots are stored in Cloudflare R2
    let finalScreenshotUrl = screenshotUrl;
    if (screenshotUrl && screenshotUrl.startsWith("data:")) {
      finalScreenshotUrl = await uploadBase64ToR2(screenshotUrl, "results");
    }

    let finalLeg2ScreenshotUrl = leg2ScreenshotUrl || null;
    if (leg2ScreenshotUrl && leg2ScreenshotUrl.startsWith("data:")) {
      finalLeg2ScreenshotUrl = await uploadBase64ToR2(leg2ScreenshotUrl, "results");
    }

    // Create submission for admin review with status PENDING
    const submission = await prisma.matchSubmission.create({
      data: {
        matchId,
        submittedByPlayerId: user.player.id,
        homeScore: Number(homeScore),
        awayScore: Number(awayScore),
        leg2HomeScore: leg2HomeScore !== undefined ? Number(leg2HomeScore) : null,
        leg2AwayScore: leg2AwayScore !== undefined ? Number(leg2AwayScore) : null,
        aggregateHomeScore: isTwoLegged ? calculatedAggHome : null,
        aggregateAwayScore: isTwoLegged ? calculatedAggAway : null,
        screenshotUrl: finalScreenshotUrl,
        leg2ScreenshotUrl: finalLeg2ScreenshotUrl,
        notes: notes || null,
        status: "PENDING",
      },
    });

    // Notify opponent that result was uploaded and upload window is closed
    const opponentId =
      match.homePlayerId === user.player.id ? match.awayPlayerId : match.homePlayerId;
    if (opponentId) {
      await prisma.announcement.create({
        data: {
          title: `Match Result Uploaded (${match.round})`,
          content: `@${user.player.gamerTag} has uploaded the match result screenshot (${homeScore} - ${awayScore}) for your ${match.round} fixture. The upload window is now closed for both athletes while the League Admin verifies the proof.`,
          type: "INDIVIDUAL",
          targetPlayerId: opponentId,
        },
      }).catch(() => {});
    }

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
