import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { recalculateStandings } from "@/lib/recalculateStandings";
import { notifyStandingsUpdate } from "@/lib/notifyStandingsUpdate";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { actionType, submissionId, claimId, decision, adminNotes } = body;

    // 1. Approve with verified scores, or Reject Match Result Screenshot
    if (actionType === "RESULT_SUBMISSION") {
      const sub = await prisma.matchSubmission.findUnique({
        where: { id: submissionId },
        include: { match: true },
      });
      if (!sub) return NextResponse.json({ error: "Submission not found" }, { status: 404 });

      if (decision === "APPROVE") {
        const {
          verifiedHomeScore,
          verifiedAwayScore,
          verifiedLeg2HomeScore,
          verifiedLeg2AwayScore,
          verifiedAggregateHomeScore,
          verifiedAggregateAwayScore,
        } = body;
        const officialHomeScore =
          typeof verifiedHomeScore === "number" ? verifiedHomeScore : sub.homeScore;
        const officialAwayScore =
          typeof verifiedAwayScore === "number" ? verifiedAwayScore : sub.awayScore;
        const officialLeg2Home =
          typeof verifiedLeg2HomeScore === "number" ? verifiedLeg2HomeScore : sub.leg2HomeScore;
        const officialLeg2Away =
          typeof verifiedLeg2AwayScore === "number" ? verifiedLeg2AwayScore : sub.leg2AwayScore;

        const officialAggHome =
          typeof verifiedAggregateHomeScore === "number"
            ? verifiedAggregateHomeScore
            : sub.aggregateHomeScore ?? (officialLeg2Home !== null ? officialHomeScore + (officialLeg2Home || 0) : officialHomeScore);

        const officialAggAway =
          typeof verifiedAggregateAwayScore === "number"
            ? verifiedAggregateAwayScore
            : sub.aggregateAwayScore ?? (officialLeg2Away !== null ? officialAwayScore + (officialLeg2Away || 0) : officialAwayScore);

        await prisma.matchSubmission.update({
          where: { id: submissionId },
          data: {
            status: "APPROVED",
            homeScore: officialHomeScore,
            awayScore: officialAwayScore,
            leg2HomeScore: officialLeg2Home,
            leg2AwayScore: officialLeg2Away,
            aggregateHomeScore: officialAggHome,
            aggregateAwayScore: officialAggAway,
            adminNotes,
          },
        });

        // Update match to finished with verified official goals from screenshot
        const updatedMatch = await prisma.match.update({
          where: { id: sub.matchId },
          data: {
            homeScore: officialHomeScore,
            awayScore: officialAwayScore,
            leg2HomeScore: officialLeg2Home,
            leg2AwayScore: officialLeg2Away,
            aggregateHomeScore: officialAggHome,
            aggregateAwayScore: officialAggAway,
            status: "FINISHED",
            screenshotUrl: sub.screenshotUrl,
            leg2ScreenshotUrl: sub.leg2ScreenshotUrl,
            notes: adminNotes || (officialLeg2Home !== null
              ? `Verified 2-Leg Match (Leg 1: ${officialHomeScore}-${officialAwayScore}, Leg 2: ${officialLeg2Home}-${officialLeg2Away}, Agg: ${officialAggHome}-${officialAggAway})`
              : `Verified by Admin Office (${officialHomeScore} - ${officialAwayScore})`),
          },
        });

        // Reset consecutive missed counter for both players as they fulfilled their match fixture
        await prisma.player.updateMany({
          where: { id: { in: [updatedMatch.homePlayerId, updatedMatch.awayPlayerId] } },
          data: { consecutiveMissed: 0 },
        });
        await prisma.standing.updateMany({
          where: { playerId: { in: [updatedMatch.homePlayerId, updatedMatch.awayPlayerId] } },
          data: { consecutiveMissed: 0 },
        });

        // Always recalculate standings immediately upon match result verification
        const divToRecalc = updatedMatch.stage === "GROUP" && updatedMatch.groupName
          ? `${updatedMatch.division} ${updatedMatch.groupName}`
          : updatedMatch.division;
        await recalculateStandings(updatedMatch.tournamentId, divToRecalc);

        // Notify participating players and broadcast standings update to all platform users
        const matchSummary = officialAggHome !== null
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
          const eliminatedPlayerId = homeTotal < awayTotal ? updatedMatch.homePlayerId : awayTotal < homeTotal ? updatedMatch.awayPlayerId : null;
          if (eliminatedPlayerId) {
            const stageLabel = updatedMatch.stage === "QUARTER_FINAL" ? "Quarter-Finals" : updatedMatch.stage === "SEMI_FINAL" ? "Semi-Finals" : "Grand Final";
            const compLabel = updatedMatch.division === "EUROPA" ? "Europa League" : "UCL";
            await prisma.announcement.create({
              data: {
                title: `⚠️ Tournament Elimination Notice: ${compLabel} (${stageLabel})`,
                content: `Your campaign in the ${compLabel} has concluded. You have been eliminated in the ${stageLabel} following match verification. Thank you for your exceptional effort and sportsmanship!`,
                type: "INDIVIDUAL",
                targetPlayerId: eliminatedPlayerId,
                isPinned: true,
              },
            }).catch(() => {});
          }
        }

        return NextResponse.json({
          success: true,
          message: `Match scores (Official: ${officialHomeScore} - ${officialAwayScore}${officialAggHome !== null ? `, Agg: ${officialAggHome} - ${officialAggAway}` : ""}) officially verified and saved.`,
        });
      } else {
        await prisma.matchSubmission.update({
          where: { id: submissionId },
          data: { status: "REJECTED", adminNotes },
        });

        return NextResponse.json({
          success: true,
          message: "Match result submission rejected.",
        });
      }
    }

    // 1b. Direct Score Entry by Admin (Without or Overriding Player Submission)
    if (actionType === "DIRECT_SCORE_ENTRY") {
      const { matchId, homeScore, awayScore, notes } = body;
      if (!matchId || typeof homeScore !== "number" || typeof awayScore !== "number") {
        return NextResponse.json({ error: "Match ID and valid scores are required." }, { status: 400 });
      }

      const match = await prisma.match.findUnique({ where: { id: matchId } });
      if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 });

      const updatedMatch = await prisma.match.update({
        where: { id: matchId },
        data: {
          homeScore,
          awayScore,
          status: "FINISHED",
          notes: notes || `Direct score entry by Admin Office (${homeScore} - ${awayScore})`,
        },
      });

      // Recalculate table
      const divToRecalc = updatedMatch.stage === "GROUP" && updatedMatch.groupName
        ? `${updatedMatch.division} ${updatedMatch.groupName}`
        : updatedMatch.division;
      await recalculateStandings(updatedMatch.tournamentId, divToRecalc);

      await notifyStandingsUpdate({
        tournamentType: updatedMatch.division,
        competitionName: updatedMatch.division,
        groupName: updatedMatch.groupName,
        matchSummary: `${homeScore} - ${awayScore}`,
      });

      return NextResponse.json({
        success: true,
        message: `Scores (${homeScore} - ${awayScore}) registered! Standings table updated and participants notified.`,
      });
    }

    // 1c. Reopen Match / Allow Late Submission
    if (actionType === "REOPEN_MATCH") {
      const { matchId, allowLate } = body;
      const match = await prisma.match.findUnique({ where: { id: matchId } });
      if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 });

      await prisma.match.update({
        where: { id: matchId },
        data: {
          status: allowLate ? "SCHEDULED" : match.status,
          notes: allowLate
            ? "ADMIN_REOPENED - Late submission approved by Admin Office."
            : "Locked per regular matchday window.",
        },
      });

      return NextResponse.json({
        success: true,
        message: allowLate
          ? "Fixture unlocked! Players can now submit scores."
          : "Fixture locked.",
      });
    }

    // 2. Approve or Reject Forfeit Claim
    if (actionType === "FORFEIT_CLAIM") {
      const claim = await prisma.forfeitClaim.findUnique({
        where: { id: claimId },
        include: { match: true, claimantPlayer: true, accusedPlayer: true },
      });
      if (!claim) return NextResponse.json({ error: "Claim not found" }, { status: 404 });

      if (decision === "APPROVE") {
        await prisma.forfeitClaim.update({
          where: { id: claimId },
          data: { status: "APPROVED", adminNotes },
        });

        // Award 3-0 walkover win to claimant
        const isClaimantHome = claim.match.homePlayerId === claim.claimantPlayerId;
        const homeScore = isClaimantHome ? 3 : 0;
        const awayScore = isClaimantHome ? 0 : 3;

        const updatedMatch = await prisma.match.update({
          where: { id: claim.matchId },
          data: {
            homeScore,
            awayScore,
            status: "FORFEIT",
            screenshotUrl: claim.proofScreenshotUrl,
            notes: `3-0 Walkover awarded to ${claim.claimantPlayer.gamerTag}. Opponent ${claim.accusedPlayer.gamerTag} forfeited (unresponsive).`,
          },
        });

        // Increment accused player's consecutive missed matches
        const newMissed = claim.accusedPlayer.consecutiveMissed + 1;
        const isDisq = newMissed >= 3;

        await prisma.player.update({
          where: { id: claim.accusedPlayerId },
          data: {
            consecutiveMissed: newMissed,
            isDisqualified: isDisq,
            status: isDisq ? "DISQUALIFIED" : newMissed === 2 ? "WARNING" : "ACTIVE",
            disqualificationReason: isDisq
              ? "Disqualified: Missed 3 consecutive scheduled matches without administrative waiver."
              : null,
          },
        });

        await prisma.standing.updateMany({
          where: { playerId: claim.accusedPlayerId },
          data: {
            consecutiveMissed: newMissed,
            isDisqualified: isDisq,
          },
        });

        // Reset claimant's consecutive missed counter since they fulfilled their match obligation
        await prisma.player.update({
          where: { id: claim.claimantPlayerId },
          data: { consecutiveMissed: 0 },
        });
        await prisma.standing.updateMany({
          where: { playerId: claim.claimantPlayerId },
          data: { consecutiveMissed: 0 },
        });

        // Recalculate standings
        const divToRecalc = updatedMatch.stage === "GROUP" && updatedMatch.groupName
          ? `${updatedMatch.division} ${updatedMatch.groupName}`
          : updatedMatch.division;
        await recalculateStandings(updatedMatch.tournamentId, divToRecalc);

        await notifyStandingsUpdate({
          tournamentType: updatedMatch.division,
          competitionName: updatedMatch.division,
          groupName: updatedMatch.groupName,
          matchSummary: "3-0 Forfeit Walkover",
        });

        return NextResponse.json({
          success: true,
          message: `Forfeit approved! 3-0 walkover awarded. Opponent ${claim.accusedPlayer.gamerTag} now has ${newMissed}/3 missed matches.`,
        });
      } else {
        await prisma.forfeitClaim.update({
          where: { id: claimId },
          data: { status: "REJECTED", adminNotes },
        });

        return NextResponse.json({
          success: true,
          message: "Forfeit claim rejected.",
        });
      }
    }

    // 3. Drop New Daily Fixtures (12:00 AM Cycle)
    if (actionType === "DROP_DAILY_FIXTURES") {
      const { division } = body;
      const targetDivision = division || "Division 1";

      const tournament = await prisma.tournament.findFirst({
        where: { name: { contains: targetDivision }, type: "DIVISION" },
      });
      if (!tournament) return NextResponse.json({ error: "Tournament not found" }, { status: 404 });

      const players = await prisma.player.findMany({
        where: { division: targetDivision, isDisqualified: false },
      });

      if (players.length < 2) {
        return NextResponse.json({ error: "Need at least 2 active players to generate fixtures" }, { status: 400 });
      }

      // Next midnight cutoff
      const nextMidnight = new Date();
      nextMidnight.setHours(24, 0, 0, 0);

      // Create round-robin pair for round
      const newMatches = [];
      for (let i = 0; i < players.length; i += 2) {
        if (players[i + 1]) {
          const m = await prisma.match.create({
            data: {
              tournamentId: tournament.id,
              division: targetDivision,
              homePlayerId: players[i].id,
              awayPlayerId: players[i + 1].id,
              round: `Matchday - Daily Fixture`,
              platform: "eFootball Mobile",
              status: "SCHEDULED",
              matchDate: new Date(),
              deadlineDate: nextMidnight,
              notes: "24-Hour window active. Coordinate on WhatsApp and submit result screenshot before 12:00 AM.",
            },
          });
          newMatches.push(m);
        }
      }

      return NextResponse.json({
        success: true,
        message: `Dropped ${newMatches.length} new 24-hour fixtures for ${targetDivision}! Deadline: 12:00 AM midnight.`,
      });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err: any) {
    console.error("Admin approval error:", err);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
