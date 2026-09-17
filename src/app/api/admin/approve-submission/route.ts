import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

// Helper function to recalculate division standings
async function recalculateStandings(tournamentId: string, division: string) {
  const finishedMatches = await prisma.match.findMany({
    where: {
      tournamentId,
      division,
      status: { in: ["FINISHED", "FORFEIT"] },
      homeScore: { not: null },
      awayScore: { not: null },
    },
    orderBy: { matchDate: "asc" },
  });

  const standings = await prisma.standing.findMany({
    where: { tournamentId, division },
  });

  const playerStats: Record<
    string,
    {
      played: number;
      won: number;
      drawn: number;
      lost: number;
      goalsFor: number;
      goalsAgainst: number;
      points: number;
      form: string[];
    }
  > = {};

  for (const s of standings) {
    playerStats[s.playerId] = {
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      points: 0,
      form: [],
    };
  }

  for (const m of finishedMatches) {
    const hId = m.homePlayerId;
    const aId = m.awayPlayerId;
    const hS = m.homeScore!;
    const aS = m.awayScore!;

    if (!playerStats[hId]) playerStats[hId] = { played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, form: [] };
    if (!playerStats[aId]) playerStats[aId] = { played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, form: [] };

    playerStats[hId].played += 1;
    playerStats[aId].played += 1;
    playerStats[hId].goalsFor += hS;
    playerStats[hId].goalsAgainst += aS;
    playerStats[aId].goalsFor += aS;
    playerStats[aId].goalsAgainst += hS;

    if (hS > aS) {
      playerStats[hId].won += 1;
      playerStats[hId].points += 3;
      playerStats[hId].form.push("W");
      playerStats[aId].lost += 1;
      playerStats[aId].form.push("L");
    } else if (hS < aS) {
      playerStats[aId].won += 1;
      playerStats[aId].points += 3;
      playerStats[aId].form.push("W");
      playerStats[hId].lost += 1;
      playerStats[hId].form.push("L");
    } else {
      playerStats[hId].drawn += 1;
      playerStats[hId].points += 1;
      playerStats[hId].form.push("D");
      playerStats[aId].drawn += 1;
      playerStats[aId].points += 1;
      playerStats[aId].form.push("D");
    }
  }

  const sortedPlayerIds = Object.keys(playerStats).sort((a, b) => {
    const sA = playerStats[a];
    const sB = playerStats[b];
    const gdA = sA.goalsFor - sA.goalsAgainst;
    const gdB = sB.goalsFor - sB.goalsAgainst;
    if (sB.points !== sA.points) return sB.points - sA.points;
    if (gdB !== gdA) return gdB - gdA;
    return sB.goalsFor - sA.goalsFor;
  });

  for (let i = 0; i < sortedPlayerIds.length; i++) {
    const pId = sortedPlayerIds[i];
    const st = playerStats[pId];
    const last5 = st.form.slice(-5).join(",") || "D";

    await prisma.standing.upsert({
      where: {
        tournamentId_playerId: {
          tournamentId,
          playerId: pId,
        },
      },
      update: {
        rank: i + 1,
        played: st.played,
        won: st.won,
        drawn: st.drawn,
        lost: st.lost,
        goalsFor: st.goalsFor,
        goalsAgainst: st.goalsAgainst,
        goalDifference: st.goalsFor - st.goalsAgainst,
        points: st.points,
        form: last5,
      },
      create: {
        tournamentId,
        division,
        playerId: pId,
        rank: i + 1,
        played: st.played,
        won: st.won,
        drawn: st.drawn,
        lost: st.lost,
        goalsFor: st.goalsFor,
        goalsAgainst: st.goalsAgainst,
        goalDifference: st.goalsFor - st.goalsAgainst,
        points: st.points,
        form: last5,
      },
    });
  }
}

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
        const { verifiedHomeScore, verifiedAwayScore } = body;
        const officialHomeScore =
          typeof verifiedHomeScore === "number" ? verifiedHomeScore : sub.homeScore;
        const officialAwayScore =
          typeof verifiedAwayScore === "number" ? verifiedAwayScore : sub.awayScore;

        await prisma.matchSubmission.update({
          where: { id: submissionId },
          data: {
            status: "APPROVED",
            homeScore: officialHomeScore,
            awayScore: officialAwayScore,
            adminNotes,
          },
        });

        // Update match to finished with verified official goals from screenshot
        const updatedMatch = await prisma.match.update({
          where: { id: sub.matchId },
          data: {
            homeScore: officialHomeScore,
            awayScore: officialAwayScore,
            status: "FINISHED",
            screenshotUrl: sub.screenshotUrl,
            notes: adminNotes || `Verified by Admin Office from screenshot (${officialHomeScore} - ${officialAwayScore})`,
          },
        });

        // Recalculate standings immediately
        await recalculateStandings(updatedMatch.tournamentId, updatedMatch.division);

        return NextResponse.json({
          success: true,
          message: `Match scores (${officialHomeScore} - ${officialAwayScore}) officially inserted. Standings table updated!`,
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

      // Recalculate division table
      await recalculateStandings(updatedMatch.tournamentId, updatedMatch.division);

      return NextResponse.json({
        success: true,
        message: `Scores (${homeScore} - ${awayScore}) registered! Standings table updated.`,
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

        // Recalculate standings
        await recalculateStandings(updatedMatch.tournamentId, updatedMatch.division);

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
