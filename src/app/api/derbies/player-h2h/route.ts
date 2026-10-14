import { NextResponse } from "next/server";
import { getPlayerDerbyOpponentH2H } from "@/lib/derbyService";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const playerId = searchParams.get("playerId");
    const opponentId = searchParams.get("opponentId");
    const derbyId = searchParams.get("derbyId") || undefined;

    if (!playerId || !opponentId) {
      return NextResponse.json({ error: "playerId and opponentId are required." }, { status: 400 });
    }

    const stats = await getPlayerDerbyOpponentH2H(playerId, opponentId, derbyId);

    // STRICT REQUIREMENT: Only returns matchesPlayed, wins, draws, defeats.
    // NEVER calculates, stores, or exposes derby win rate or percentage.
    return NextResponse.json({
      success: true,
      stats: {
        matchesPlayed: stats.matchesPlayed,
        wins: stats.wins,
        draws: stats.draws,
        defeats: stats.defeats,
      },
    });
  } catch (error: any) {
    console.error("[GET /api/derbies/player-h2h] Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to load player derby head-to-head records." },
      { status: 500 }
    );
  }
}
