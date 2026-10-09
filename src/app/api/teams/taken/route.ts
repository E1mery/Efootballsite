import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { findTeam } from "@/lib/teams";

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

    // Map of normalized realTeam name / shortName / id -> details
    const takenTeams: Record<
      string,
      { gamerTag: string; division: string; playerId: string; teamName: string }
    > = {};

    players.forEach((p) => {
      if (p.realTeam && p.realTeam.trim()) {
        const canonical = findTeam(p.realTeam);
        const resolvedName = canonical ? canonical.name : p.realTeam.trim();
        const payload = {
          gamerTag: p.gamerTag,
          division: p.division,
          playerId: p.id,
          teamName: resolvedName,
        };

        // Index raw name
        takenTeams[p.realTeam.trim().toLowerCase()] = payload;

        // If matched to a known real team, also index full name, shortName, and id
        if (canonical) {
          takenTeams[canonical.name.toLowerCase()] = payload;
          takenTeams[canonical.shortName.toLowerCase()] = payload;
          takenTeams[canonical.id.toLowerCase()] = payload;
        }
      }
    });

    const divisionCountsRaw = await prisma.player.groupBy({
      by: ["division"],
      where: {
        status: { not: "REJECTED" },
      },
      _count: {
        _all: true,
      },
    });

    const divisionCounts: Record<string, number> = {
      "Division 1": 0,
      "Division 2": 0,
      "Division 3": 0,
    };

    divisionCountsRaw.forEach((g) => {
      divisionCounts[g.division] = g._count._all;
    });

    const isDivision3Exceeded = (divisionCounts["Division 3"] || 0) > 20;

    return NextResponse.json({
      success: true,
      takenTeams,
      divisionCounts,
      isDivision3Exceeded,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch taken football teams", details: error.message },
      { status: 500 }
    );
  }
}
