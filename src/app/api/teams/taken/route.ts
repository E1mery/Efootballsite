import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const players = await prisma.player.findMany({
      where: {
        realTeam: { not: null },
        status: { not: "REJECTED" },
      },
      select: {
        id: true,
        gamerTag: true,
        division: true,
        realTeam: true,
      },
    });

    // Map of normalized realTeam name -> details
    const takenTeams: Record<
      string,
      { gamerTag: string; division: string; playerId: string }
    > = {};

    players.forEach((p) => {
      if (p.realTeam && p.realTeam.trim()) {
        takenTeams[p.realTeam.trim().toLowerCase()] = {
          gamerTag: p.gamerTag,
          division: p.division,
          playerId: p.id,
        };
      }
    });

    return NextResponse.json({
      success: true,
      takenTeams,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch taken football teams", details: error.message },
      { status: 500 }
    );
  }
}
