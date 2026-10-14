import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const competition = searchParams.get("competition") || "UCL";
    const voterIdParam = searchParams.get("voterId");

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
    if (!currentPlayerId && voterIdParam) {
      currentPlayerId = voterIdParam;
    }

    // Find the Grand Final match for this tournament
    const tournament = await prisma.tournament.findFirst({
      where: {
        OR: [
          { type: competition },
          ...(competition === "SUPER_CUP" ? [{ slug: { contains: "super-cup" } }] : []),
        ],
      },
    });

    const finalMatch = await prisma.match.findFirst({
      where: {
        ...(tournament ? { tournamentId: tournament.id } : { division: competition }),
        stage: "FINAL",
      },
      include: {
        homePlayer: {
          select: { id: true, gamerTag: true, fullName: true, avatar: true, realTeam: true, division: true, overallRating: true },
        },
        awayPlayer: {
          select: { id: true, gamerTag: true, fullName: true, avatar: true, realTeam: true, division: true, overallRating: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!finalMatch || !finalMatch.homePlayer || !finalMatch.awayPlayer) {
      return NextResponse.json({ active: false, message: "Final match has not been generated yet." });
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
      matchDate: finalMatch.matchDate,
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

    let voterId: string | null = null;
    if (sessionUserId) {
      const user = await prisma.user.findUnique({
        where: { id: sessionUserId },
        include: { player: true },
      });
      voterId = user?.player?.id || user?.id || null;
    }

    const body = await req.json();
    const { competition = "UCL", predictedWinnerPlayerId, voterId: guestVoterId } = body;

    if (!voterId && guestVoterId) {
      voterId = String(guestVoterId);
    }

    if (!voterId) {
      return NextResponse.json({ error: "Please log in to vote in the Trophy Prediction Poll." }, { status: 401 });
    }

    if (!predictedWinnerPlayerId) {
      return NextResponse.json({ error: "Please select an athlete to win the trophy." }, { status: 400 });
    }

    // Verify finalist exists in the final match
    const tournament = await prisma.tournament.findFirst({
      where: {
        OR: [
          { type: competition },
          ...(competition === "SUPER_CUP" ? [{ slug: { contains: "super-cup" } }] : []),
        ],
      },
    });

    const finalMatch = await prisma.match.findFirst({
      where: {
        ...(tournament ? { tournamentId: tournament.id } : { division: competition }),
        stage: "FINAL",
      },
      orderBy: { createdAt: "desc" },
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
      message: "Your trophy prediction has been cast! Thank you for voting in the official Prediction Poll.",
      vote,
    });
  } catch (err: any) {
    console.error("Trophy poll POST error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
