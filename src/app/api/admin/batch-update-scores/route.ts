import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { recalculateStandings } from "@/lib/recalculateStandings";
import { notifyStandingsUpdate } from "@/lib/notifyStandingsUpdate";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const sessionUserId = cookieStore.get("efrl_session")?.value;

    if (!sessionUserId) {
      return NextResponse.json({ error: "Unauthorized: Please log in as an administrator." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: sessionUserId },
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Administrator role required." }, { status: 403 });
    }

    const body = await req.json();
    const { updates, matchdayName, notifyUsers = true } = body;

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json({ error: "No match score updates provided." }, { status: 400 });
    }

    // Track affected tournament and division pairs to update tables once
    const affectedDivisions = new Map<string, { tournamentId: string; division: string }>();
    const updatedMatchIds: string[] = [];

    for (const update of updates) {
      const { matchId, homeScore, awayScore, submissionId } = update;

      if (!matchId) continue;

      const numHome = Number(homeScore);
      const numAway = Number(awayScore);

      if (isNaN(numHome) || isNaN(numAway) || numHome < 0 || numAway < 0) {
        continue; // Skip invalid scores
      }

      // Fetch match to get tournament and division
      const match = await prisma.match.findUnique({
        where: { id: matchId },
      });

      if (!match) continue;

      // Update match with official verified goals and set status to FINISHED
      await prisma.match.update({
        where: { id: matchId },
        data: {
          homeScore: numHome,
          awayScore: numAway,
          status: "FINISHED",
          notes: `Batch Goal Entry Verified: ${numHome} - ${numAway}`,
        },
      });

      // If there is an associated pending submission, approve it simultaneously
      if (submissionId) {
        await prisma.matchSubmission.updateMany({
          where: { id: submissionId },
          data: {
            status: "APPROVED",
            homeScore: numHome,
            awayScore: numAway,
            adminNotes: "Approved in batch verification",
          },
        });
      } else {
        // Approve any pending submission linked to this match
        await prisma.matchSubmission.updateMany({
          where: { matchId: matchId, status: "PENDING" },
          data: {
            status: "APPROVED",
            homeScore: numHome,
            awayScore: numAway,
            adminNotes: "Approved in batch score insertion",
          },
        });
      }

      updatedMatchIds.push(matchId);

      const targetDiv = match.stage === "GROUP" && match.groupName
        ? `${match.division} ${match.groupName}`
        : match.division;
      const key = `${match.tournamentId}__${targetDiv}`;
      if (!affectedDivisions.has(key)) {
        affectedDivisions.set(key, {
          tournamentId: match.tournamentId,
          division: targetDiv,
        });
      }
    }

    if (updatedMatchIds.length === 0) {
      return NextResponse.json({ error: "No valid match scores could be processed." }, { status: 400 });
    }

    // 1. Recalculate standings for each affected division/group EXACTLY ONCE
    for (const { tournamentId, division } of affectedDivisions.values()) {
      await recalculateStandings(tournamentId, division);

      // Notify participating players of standings update
      const compType = division.includes("EUROPA") ? "EUROPA" : division.includes("UCL") ? "UCL" : "DIVISION";
      const grpMatch = division.match(/Group [A-D]/i);
      await notifyStandingsUpdate({
        tournamentType: compType,
        competitionName: division,
        groupName: grpMatch ? grpMatch[0] : null,
        matchSummary: matchdayName || "Batch verified results",
      });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully inserted goals for ${updatedMatchIds.length} played matches. League tables updated once and broadcast notification sent to all users!`,
      matchesUpdated: updatedMatchIds.length,
      divisionsUpdated: affectedDivisions.size,
    });
  } catch (error: any) {
    console.error("Batch update scores error:", error);
    return NextResponse.json({ error: error.message || "Failed to batch update scores." }, { status: 500 });
  }
}
