import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { playerId, action, replacementPlayerId } = body;

    if (!playerId) {
      return NextResponse.json({ error: "Missing playerId" }, { status: 400 });
    }

    const player = await prisma.player.findUnique({
      where: { id: playerId },
      include: { standings: true },
    });

    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    if (action === "DISQUALIFY_AND_REPLACE") {
      // 1. Mark existing player as disqualified
      await prisma.player.update({
        where: { id: playerId },
        data: {
          isDisqualified: true,
          status: "DISQUALIFIED",
          disqualificationReason:
            "Removed by Admin: 3 consecutive matches missed without administrative waiver.",
        },
      });

      // 2. Mark existing standings as disqualified
      await prisma.standing.updateMany({
        where: { playerId },
        data: { isDisqualified: true },
      });

      return NextResponse.json({
        success: true,
        message: `Player ${player.gamerTag} has been disqualified and slot freed.`,
      });
    }

    if (action === "RESET_MISSED_COUNTER") {
      await prisma.player.update({
        where: { id: playerId },
        data: {
          consecutiveMissed: 0,
          isDisqualified: false,
          status: "ACTIVE",
        },
      });

      await prisma.standing.updateMany({
        where: { playerId },
        data: {
          consecutiveMissed: 0,
          isDisqualified: false,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Missed matches counter for ${player.gamerTag} reset to 0.`,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    console.error("Replace player error:", err);
    return NextResponse.json(
      { error: "Failed to process player action" },
      { status: 500 }
    );
  }
}
