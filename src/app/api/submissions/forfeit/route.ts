import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { uploadBase64ToR2 } from "@/lib/r2";
import { checkAndAutoAdvanceDailyCycle } from "@/lib/autoDailyCycle";

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

    // Verify player is a participant in this fixture
    if (match.homePlayerId !== user.player.id && match.awayPlayerId !== user.player.id) {
      return NextResponse.json(
        { error: "Unauthorized. You are not a registered athlete for this fixture." },
        { status: 403 }
      );
    }

    // Run automated cycle check to ensure database records reflect recent deadline rollovers
    await checkAndAutoAdvanceDailyCycle();

    const isReplacementMatch = Boolean(match.notes?.includes("REPLACEMENT_BACKLOG"));
    const isReopenedByAdmin = Boolean(
      match.allowLateSubmission || match.notes?.includes("ADMIN_REOPENED")
    );

    // STRICT DEADLINE REACHED ENFORCEMENT:
    // When the deadline is reached, players cannot submit match results or claim forfeit.
    const now = new Date();
    const isPastDeadline = Boolean(match.deadlineDate && now >= new Date(match.deadlineDate));
    if (isPastDeadline && !isReopenedByAdmin) {
      return NextResponse.json(
        {
          error: isReplacementMatch
            ? "Deadline Reached: The 48-hour completion window for this replacement fixture has expired. Forfeit claims are closed."
            : "Deadline Reached: The 24-hour match deadline (12:00 AM cutoff) for this fixture has elapsed. You can no longer claim forfeit for this match.",
        },
        { status: 400 }
      );
    }

    // STRICT 1 MATCH PER DAY (24HRS):
    // Division fixtures for future matchdays cannot be forfeited before their 24-hr cycle begins at 12:00 AM midnight
    const config = await prisma.leagueConfig.findUnique({ where: { id: "default" } });
    const currentMatchday = config?.currentMatchday || 1;
    const matchRoundNum = parseInt(match.round?.match(/\d+/)?.[0] || "0", 10);
    const isDivisionMatch = match.division?.startsWith("Division");

    if (isDivisionMatch && matchRoundNum > currentMatchday && !isReopenedByAdmin) {
      return NextResponse.json(
        {
          error: `1 Match Per Day Rule: ${match.round} is not active yet. Next round fixtures drop after today's 24-hour deadline at 12:00 AM Midnight.`,
        },
        { status: 400 }
      );
    }

    if (isDivisionMatch && matchRoundNum < currentMatchday && !isReopenedByAdmin) {
      return NextResponse.json(
        {
          error: `Deadline Reached: The deadline for ${match.round} has elapsed. Forfeit claims are closed.`,
        },
        { status: 400 }
      );
    }

    // BLOCK FORFEIT CLAIM IF OPPONENT REACHED 3 MISSED MATCHES AND MATCH IS WAITING FOR SUB
    const opponent = match.homePlayerId === user.player.id ? match.awayPlayer : match.homePlayer;
    const isWaitingSub = Boolean(
      match.notes?.includes("WAITING_FOR_SUB") ||
        (!isReplacementMatch && (opponent?.consecutiveMissed >= 3 || opponent?.isDisqualified))
    );

    if (isWaitingSub && !isReplacementMatch) {
      return NextResponse.json(
        {
          error:
            "This fixture is currently on hold. Your opponent reached 3 missed matches and is awaiting a replacement athlete from the League Admin. Forfeit claims are paused while awaiting substitute assignment.",
        },
        { status: 400 }
      );
    }

    // If match is already completed
    if ((match.status === "FINISHED" || match.status === "FORFEIT") && !isReopenedByAdmin) {
      return NextResponse.json(
        { error: "This match is already finalized. Submissions are closed unless reopened by the Commissioner." },
        { status: 400 }
      );
    }

    // LINKED UPLOAD ENFORCEMENT:
    // If either player has already submitted a match result
    if (match.submissions.length > 0 && !isReopenedByAdmin) {
      const activeSub = match.submissions[0];
      const submitter = activeSub.submittedByPlayer?.gamerTag || "an athlete";
      return NextResponse.json(
        {
          error: `Match results have already been uploaded by @${submitter}. Forfeit claims are closed while the result is under review.`,
        },
        { status: 400 }
      );
    }

    // If either player has already lodged a forfeit claim
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

    // If reopened by admin and has prior claims, mark them replaced
    if (isReopenedByAdmin && match.forfeitClaims.length > 0) {
      await prisma.forfeitClaim.updateMany({
        where: { matchId: match.id, status: "PENDING" },
        data: { status: "REJECTED", adminNotes: "Superseded by reopened claim" },
      });
    }

    const accusedPlayerId =
      match.homePlayerId === user.player.id ? match.awayPlayerId : match.homePlayerId;

    let finalProofScreenshotUrl = proofScreenshotUrl;
    if (proofScreenshotUrl && proofScreenshotUrl.startsWith("data:")) {
      finalProofScreenshotUrl = await uploadBase64ToR2(proofScreenshotUrl, "forfeits");
    }

    const claim = await prisma.forfeitClaim.create({
      data: {
        matchId,
        claimantPlayerId: user.player.id,
        accusedPlayerId,
        proofScreenshotUrl: finalProofScreenshotUrl,
        reason,
        status: "PENDING",
      },
    });

    // Notify accused player that a forfeit claim has been submitted
    if (accusedPlayerId) {
      await prisma.announcement.create({
        data: {
          title: `Forfeit Claim Lodged (${match.round})`,
          content: `@${user.player.gamerTag} has lodged a forfeit claim for your ${match.round} match with WhatsApp unresponsiveness proof. The upload window is closed while the League Admin arbitrates the claim.`,
          type: "INDIVIDUAL",
          targetPlayerId: accusedPlayerId,
        },
      }).catch(() => {});
    }

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
