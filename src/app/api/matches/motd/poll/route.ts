import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const matchId = searchParams.get("matchId");
    const voterId = searchParams.get("voterId");

    if (!matchId) {
      return NextResponse.json({ error: "matchId is required" }, { status: 400 });
    }

    const votes = await prisma.motdPollVote.findMany({
      where: { matchId },
    });

    const totalVotes = votes.length;
    const homeVotes = votes.filter((v) => v.prediction === "HOME").length;
    const drawVotes = votes.filter((v) => v.prediction === "DRAW").length;
    const awayVotes = votes.filter((v) => v.prediction === "AWAY").length;

    const homePercent = totalVotes > 0 ? Math.round((homeVotes / totalVotes) * 100) : 0;
    const drawPercent = totalVotes > 0 ? Math.round((drawVotes / totalVotes) * 100) : 0;
    const awayPercent = totalVotes > 0 ? Math.max(0, 100 - homePercent - drawPercent) : 0;

    const userVote = voterId
      ? votes.find((v) => v.voterId === voterId)?.prediction || null
      : null;

    return NextResponse.json({
      success: true,
      totalVotes,
      homeVotes,
      drawVotes,
      awayVotes,
      homePercent,
      drawPercent,
      awayPercent,
      userPrediction: userVote,
    });
  } catch (err: any) {
    console.error("MOTD Poll GET error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch poll" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { matchId, voterId, prediction } = body;

    if (!matchId || !voterId || !prediction) {
      return NextResponse.json(
        { error: "matchId, voterId, and prediction are required" },
        { status: 400 }
      );
    }

    if (!["HOME", "DRAW", "AWAY"].includes(prediction)) {
      return NextResponse.json(
        { error: "Prediction must be 'HOME', 'DRAW', or 'AWAY'" },
        { status: 400 }
      );
    }

    // Upsert the prediction vote
    await prisma.motdPollVote.upsert({
      where: {
        matchId_voterId: { matchId, voterId },
      },
      update: {
        prediction,
      },
      create: {
        matchId,
        voterId,
        prediction,
      },
    });

    // Fetch updated breakdown
    const votes = await prisma.motdPollVote.findMany({
      where: { matchId },
    });

    const totalVotes = votes.length;
    const homeVotes = votes.filter((v) => v.prediction === "HOME").length;
    const drawVotes = votes.filter((v) => v.prediction === "DRAW").length;
    const awayVotes = votes.filter((v) => v.prediction === "AWAY").length;

    const homePercent = totalVotes > 0 ? Math.round((homeVotes / totalVotes) * 100) : 0;
    const drawPercent = totalVotes > 0 ? Math.round((drawVotes / totalVotes) * 100) : 0;
    const awayPercent = totalVotes > 0 ? Math.max(0, 100 - homePercent - drawPercent) : 0;

    return NextResponse.json({
      success: true,
      message: "Prediction recorded!",
      totalVotes,
      homeVotes,
      drawVotes,
      awayVotes,
      homePercent,
      drawPercent,
      awayPercent,
      userPrediction: prediction,
    });
  } catch (err: any) {
    console.error("MOTD Poll POST error:", err);
    return NextResponse.json({ error: err.message || "Failed to record prediction" }, { status: 500 });
  }
}
