import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const competition = searchParams.get("competition") || "UCL";

    const cookieStore = await cookies();
    const sessionUserId = cookieStore.get("efrl_session")?.value;

    let currentPlayerId: string | null = null;
    if (sessionUserId) {
      const user = await prisma.user.findUnique({
        where: { id: sessionUserId },
        include: { player: true },
      });
      currentPlayerId = user?.player?.id || user?.id || null;
    }

    // Find the Grand Final match for this tournament
    const tournament = await prisma.tournament.findFirst({
      where: { type: competition },
    });

    if (!tournament) {
      return NextResponse.json({ active: false, message: "Tournament not found" });
    }

    const finalMatch = await prisma.match.findFirst({
      where: {
        tournamentId: tournament.id,
        stage: "FINAL",
      },
      include: {
        homePlayer: {
          select: { id: true, gamerTag: true, fullName: true, avatar: true, division: true, overallRating: true },
        },
        awayPlayer: {
          select: { id: true, gamerTag: true, fullName: true, avatar: true, division: true, overallRating: true },
        },
      },
    });

    if (!finalMatch) {
      return NextResponse.json({ active: false, message: "Grand Final has not been generated yet." });
    }

    // Get all votes for this competition's trophy poll
    const votes = await prisma.trophyPollVote.findMany({
      where: { competition },
    });

    const finalist1Id = finalMatch.homePlayer.id;
    const finalist2Id = finalMatch.awayPlayer.id;

    const f1Votes = votes.filter((v) => v.predictedWinnerPlayerId === finalist1Id).length;
    const f2Votes = votes.filter((v) => v.predictedWinnerPlayerId === finalist2Id).length;
    const totalVotes = votes.length;

    const f1Pct = totalVotes > 0 ? Math.round((f1Votes / totalVotes) * 100) : 50;
    const f2Pct = totalVotes > 0 ? 100 - f1Pct : 50;

    let userVotedWinnerId: string | null = null;
    if (currentPlayerId) {
      const userVote = votes.find((v) => v.voterId === currentPlayerId);
      if (userVote) {
        userVotedWinnerId = userVote.predictedWinnerPlayerId;
      }
    }

    return NextResponse.json({
      active: true,
      competition,
      matchId: finalMatch.id,
      matchStatus: finalMatch.status,
      finalist1: {
        ...finalMatch.homePlayer,
        votes: f1Votes,
        percentage: f1Pct,
      },
      finalist2: {
        ...finalMatch.awayPlayer,
        votes: f2Votes,
        percentage: f2Pct,
      },
      totalVotes,
      userVotedWinnerId,
    });
  } catch (err: any) {
    console.error("Trophy poll GET error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const sessionUserId = cookieStore.get("efrl_session")?.value;
    if (!sessionUserId) {
      return NextResponse.json({ error: "Please log in to vote in the Trophy Prediction Poll." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: sessionUserId },
      include: { player: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User session invalid." }, { status: 401 });
    }

    const voterId = user.player?.id || user.id;

    const body = await req.json();
    const { competition = "UCL", predictedWinnerPlayerId } = body;

    if (!predictedWinnerPlayerId) {
      return NextResponse.json({ error: "Please select an athlete to win the trophy." }, { status: 400 });
    }

    // Verify finalist exists in the final match
    const tournament = await prisma.tournament.findFirst({
      where: { type: competition },
    });

    if (!tournament) {
      return NextResponse.json({ error: "Tournament not found." }, { status: 404 });
    }

    const finalMatch = await prisma.match.findFirst({
      where: {
        tournamentId: tournament.id,
        stage: "FINAL",
      },
    });

    if (!finalMatch) {
      return NextResponse.json({ error: "Grand Final is not active." }, { status: 400 });
    }

    if (
      finalMatch.homePlayerId !== predictedWinnerPlayerId &&
      finalMatch.awayPlayerId !== predictedWinnerPlayerId
    ) {
      return NextResponse.json({ error: "Predicted athlete is not a Grand Finalist." }, { status: 400 });
    }

    // Record or update vote
    const vote = await prisma.trophyPollVote.upsert({
      where: {
        competition_voterId: {
          competition,
          voterId,
        },
      },
      update: {
        predictedWinnerPlayerId,
        matchId: finalMatch.id,
      },
      create: {
        competition,
        voterId,
        predictedWinnerPlayerId,
        matchId: finalMatch.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Your trophy prediction has been cast! Thank you for participating in the Grand Final Poll.",
      vote,
    });
  } catch (err: any) {
    console.error("Trophy poll POST error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
