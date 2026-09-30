import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { uploadBase64ToR2, ensureR2FileUrl } from "@/lib/r2";
import { checkAndAutoAdvanceDailyCycle } from "@/lib/autoDailyCycle";
import { recalculateStandings } from "@/lib/recalculateStandings";
import { notifyStandingsUpdate } from "@/lib/notifyStandingsUpdate";

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
            ? "Deadline Reached: The 48-hour completion window for this replacement fixture has elapsed. Result submissions are strictly closed."
            : "Deadline Reached: The 24-hour match deadline (12:00 AM cutoff) for this fixture has elapsed. You are no longer able to submit match results for this match.",
        },
        { status: 400 }
      );
    }

    // STRICT FIXTURE DROP TIME ENFORCEMENT:
    // When the schedule is set by Admin, first fixtures and future matchdays only drop at 12:00 AM on their kickoff date.
    if (match.matchDate && now < new Date(match.matchDate) && !isReopenedByAdmin) {
      const dropDateFormatted = new Date(match.matchDate).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
      return NextResponse.json(
        {
          error: `Fixture Not Dropped Yet: This match is scheduled to drop on ${dropDateFormatted} at 12:00 AM (Midnight). Result submissions unlock once the fixture officially drops.`,
        },
        { status: 400 }
      );
    }

    // STRICT 1 MATCH PER DAY (24HRS):
    // Division fixtures for future matchdays cannot be submitted before their 24-hr cycle begins at 12:00 AM midnight
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
          error: `Deadline Reached: The round deadline for ${match.round} has elapsed. Result submissions are closed.`,
        },
        { status: 400 }
      );
    }

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

    // If reopened by admin and has prior pending submission, supersede them
    if (isReopenedByAdmin && match.submissions.length > 0) {
      await prisma.matchSubmission.updateMany({
        where: { matchId: match.id, status: "PENDING" },
        data: { status: "REPLACED", adminNotes: "Superseded by reopened submission" },
      });
    }

    // Ensure all uploaded screenshots/pictures are stored in Cloudflare R2 storage to prevent data loss
    const finalScreenshotUrl = await ensureR2FileUrl(screenshotUrl, "results");
    const finalLeg2ScreenshotUrl = leg2ScreenshotUrl
      ? await ensureR2FileUrl(leg2ScreenshotUrl, "results")
      : null;

    const officialHomeScore = Number(homeScore);
    const officialAwayScore = Number(awayScore);
    const officialLeg2Home = leg2HomeScore !== undefined && leg2HomeScore !== null ? Number(leg2HomeScore) : null;
    const officialLeg2Away = leg2AwayScore !== undefined && leg2AwayScore !== null ? Number(leg2AwayScore) : null;
    const officialAggHome = isTwoLegged ? calculatedAggHome : null;
    const officialAggAway = isTwoLegged ? calculatedAggAway : null;

    // Atomically store submitted results (official goals and Cloudflare screenshot URLs) in database
    const [submission, updatedMatch] = await prisma.$transaction([
      prisma.matchSubmission.create({
        data: {
          matchId,
          submittedByPlayerId: user.player.id,
          homeScore: officialHomeScore,
          awayScore: officialAwayScore,
          leg2HomeScore: officialLeg2Home,
          leg2AwayScore: officialLeg2Away,
          aggregateHomeScore: officialAggHome,
          aggregateAwayScore: officialAggAway,
          screenshotUrl: finalScreenshotUrl,
          leg2ScreenshotUrl: finalLeg2ScreenshotUrl,
          notes: notes || null,
          status: "APPROVED",
        },
      }),
      prisma.match.update({
        where: { id: matchId },
        data: {
          homeScore: officialHomeScore,
          awayScore: officialAwayScore,
          leg2HomeScore: officialLeg2Home,
          leg2AwayScore: officialLeg2Away,
          aggregateHomeScore: officialAggHome,
          aggregateAwayScore: officialAggAway,
          status: "FINISHED",
          screenshotUrl: finalScreenshotUrl,
          leg2ScreenshotUrl: finalLeg2ScreenshotUrl,
          notes:
            notes ||
            (officialLeg2Home !== null
              ? `2-Leg Match (Leg 1: ${officialHomeScore}-${officialAwayScore}, Leg 2: ${officialLeg2Home}-${officialLeg2Away}, Agg: ${officialAggHome}-${officialAggAway})`
              : `Submitted by @${user.player.gamerTag} (${officialHomeScore} - ${officialAwayScore})`),
        },
      }),
    ]);

    // Reset consecutive missed counters since players completed their match fixture
    await prisma.player.updateMany({
      where: { id: { in: [updatedMatch.homePlayerId, updatedMatch.awayPlayerId] } },
      data: { consecutiveMissed: 0 },
    });
    await prisma.standing.updateMany({
      where: { playerId: { in: [updatedMatch.homePlayerId, updatedMatch.awayPlayerId] } },
      data: { consecutiveMissed: 0 },
    });

    // Recalculate standings table immediately without requiring admin approval
    const divToRecalc =
      updatedMatch.stage === "GROUP" && updatedMatch.groupName
        ? `${updatedMatch.division} ${updatedMatch.groupName}`
        : updatedMatch.division;
    await recalculateStandings(updatedMatch.tournamentId, divToRecalc);

    // Notify participating players and broadcast standings update to all platform users
    const matchSummary =
      officialAggHome !== null
        ? `Agg: ${officialAggHome} - ${officialAggAway}`
        : `${officialHomeScore} - ${officialAwayScore}`;

    await notifyStandingsUpdate({
      tournamentType: updatedMatch.division,
      competitionName: updatedMatch.division,
      groupName: updatedMatch.groupName,
      matchSummary,
    });

    // If knockout match, automatically notify the eliminated athlete
    const isKnockout = ["QUARTER_FINAL", "SEMI_FINAL", "FINAL"].includes(updatedMatch.stage);
    if (isKnockout) {
      const homeTotal = officialAggHome ?? officialHomeScore;
      const awayTotal = officialAggAway ?? officialAwayScore;
      const eliminatedPlayerId =
        homeTotal < awayTotal
          ? updatedMatch.homePlayerId
          : awayTotal < homeTotal
          ? updatedMatch.awayPlayerId
          : null;
      if (eliminatedPlayerId) {
        const stageLabel =
          updatedMatch.stage === "QUARTER_FINAL"
            ? "Quarter-Finals"
            : updatedMatch.stage === "SEMI_FINAL"
            ? "Semi-Finals"
            : "Grand Final";
        const compLabel = updatedMatch.division === "EUROPA" ? "Europa League" : "UCL";
        await prisma.announcement
          .create({
            data: {
              title: `⚠️ Tournament Elimination Notice: ${compLabel} (${stageLabel})`,
              content: `Your campaign in the ${compLabel} has concluded. You have been eliminated in the ${stageLabel}. Thank you for your exceptional effort and sportsmanship!`,
              type: "INDIVIDUAL",
              targetPlayerId: eliminatedPlayerId,
              isPinned: true,
            },
          })
          .catch(() => {});
      }
    }

    // Notify opponent that result was submitted and standings updated
    const opponentId =
      match.homePlayerId === user.player.id ? match.awayPlayerId : match.homePlayerId;
    if (opponentId) {
      await prisma.announcement
        .create({
          data: {
            title: `Match Result Submitted (${match.round})`,
            content: `@${user.player.gamerTag} has submitted the match result (${officialHomeScore} - ${officialAwayScore}) for your ${match.round} fixture. The league table has been updated automatically.`,
            type: "INDIVIDUAL",
            targetPlayerId: opponentId,
          },
        })
        .catch(() => {});
    }

    return NextResponse.json({
      success: true,
      message:
        "Match results and screenshot submitted! League table standings have updated automatically.",
      submission,
    });
  } catch (err: any) {
    console.error("Result submission error:", err);
    return NextResponse.json({ error: "Failed to submit match results." }, { status: 500 });
  }
}
