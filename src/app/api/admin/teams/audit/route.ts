import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { findTeam } from "@/lib/teams";

async function verifyAdmin() {
  const cookieStore = await cookies();
  const sessionUserId = cookieStore.get("efrl_session")?.value;
  if (!sessionUserId) return null;

  const user = await prisma.user.findUnique({ where: { id: sessionUserId } });
  if (!user || user.role !== "ADMIN") return null;
  return user;
}

export async function GET(req: Request) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json(
        { error: "Unauthorized: Administrator access required." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const shouldFix = searchParams.get("fix") === "true";

    // Fetch all players with assigned real teams
    const players = await prisma.player.findMany({
      where: {
        realTeam: { not: null },
      },
      select: {
        id: true,
        gamerTag: true,
        fullName: true,
        division: true,
        realTeam: true,
        avatar: true,
        status: true,
      },
    });

    const mismatches: Array<{
      id: string;
      gamerTag: string;
      fullName: string;
      playerDivision: string;
      currentTeam: string;
      teamDivision: string;
      teamLeague: string;
    }> = [];

    let validCount = 0;

    for (const p of players) {
      if (!p.realTeam) continue;
      const teamObj = findTeam(p.realTeam);

      if (!teamObj || teamObj.division !== p.division) {
        mismatches.push({
          id: p.id,
          gamerTag: p.gamerTag,
          fullName: p.fullName,
          playerDivision: p.division,
          currentTeam: p.realTeam,
          teamDivision: teamObj ? teamObj.division : "Unrecognized Club",
          teamLeague: teamObj ? teamObj.league : "Unknown",
        });
      } else {
        validCount++;
      }
    }

    let fixedCount = 0;
    if (shouldFix && mismatches.length > 0) {
      const mismatchedIds = mismatches.map((m) => m.id);
      const updateResult = await prisma.player.updateMany({
        where: { id: { in: mismatchedIds } },
        data: {
          realTeam: null,
          avatar: null,
        },
      });
      fixedCount = updateResult.count;
    }

    return NextResponse.json({
      success: true,
      totalChecked: players.length,
      validCount: validCount,
      mismatchedCount: mismatches.length,
      fixed: shouldFix,
      fixedCount,
      mismatches,
    });
  } catch (error: any) {
    console.error("Team audit error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to audit player team assignments" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  // Allow triggering fix via POST as well
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json(
        { error: "Unauthorized: Administrator access required." },
        { status: 403 }
      );
    }

    const players = await prisma.player.findMany({
      where: {
        realTeam: { not: null },
      },
      select: {
        id: true,
        gamerTag: true,
        fullName: true,
        division: true,
        realTeam: true,
      },
    });

    const mismatchedIds: string[] = [];
    const mismatches: any[] = [];

    for (const p of players) {
      if (!p.realTeam) continue;
      const teamObj = findTeam(p.realTeam);
      if (!teamObj || teamObj.division !== p.division) {
        mismatchedIds.push(p.id);
        mismatches.push({
          id: p.id,
          gamerTag: p.gamerTag,
          fullName: p.fullName,
          playerDivision: p.division,
          currentTeam: p.realTeam,
          teamDivision: teamObj ? teamObj.division : "Unrecognized Club",
          teamLeague: teamObj ? teamObj.league : "Unknown",
        });
      }
    }

    let fixedCount = 0;
    if (mismatchedIds.length > 0) {
      const updateResult = await prisma.player.updateMany({
        where: { id: { in: mismatchedIds } },
        data: {
          realTeam: null,
          avatar: null,
        },
      });
      fixedCount = updateResult.count;
    }

    return NextResponse.json({
      success: true,
      message: `Audit complete. Fixed ${fixedCount} mismatched player(s).`,
      fixedCount,
      mismatches,
    });
  } catch (error: any) {
    console.error("Team audit POST error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fix mismatched teams" },
      { status: 500 }
    );
  }
}
