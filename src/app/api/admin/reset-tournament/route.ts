import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

async function verifyAdmin() {
  const cookieStore = await cookies();
  const sessionUserId = cookieStore.get("efrl_session")?.value;
  if (!sessionUserId) return null;

  const user = await prisma.user.findUnique({
    where: { id: sessionUserId },
  });

  if (!user || user.role !== "ADMIN") return null;
  return user;
}

export async function POST(req: Request) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized: Administrator access required." }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { division = "ALL" } = body;

    const divisionsToReset =
      division === "ALL"
        ? ["Division 1", "Division 2", "Division 3"]
        : [division];

    // Find tournaments for selected divisions
    const tournaments = await prisma.tournament.findMany({
      where: {
        OR: divisionsToReset.map((div) => ({ name: { contains: div } })),
      },
    });

    const tournamentIds = tournaments.map((t) => t.id);

    // 1. Delete all match submissions, forfeit claims, and poll votes linked to these matches
    const matchWhere: any = {
      division: { in: divisionsToReset },
    };
    if (tournamentIds.length > 0) {
      matchWhere.tournamentId = { in: tournamentIds };
    }

    const matchesToDelete = await prisma.match.findMany({
      where: matchWhere,
      select: { id: true },
    });

    const matchIds = matchesToDelete.map((m) => m.id);

    if (matchIds.length > 0) {
      await prisma.matchSubmission.deleteMany({
        where: { matchId: { in: matchIds } },
      });

      await prisma.forfeitClaim.deleteMany({
        where: { matchId: { in: matchIds } },
      });

      await prisma.motdPollVote.deleteMany({
        where: { matchId: { in: matchIds } },
      });

      // Delete the matches
      await prisma.match.deleteMany({
        where: { id: { in: matchIds } },
      });
    }

    // 2. Reset standings for active players in these divisions to 0
    await prisma.standing.updateMany({
      where: {
        division: { in: divisionsToReset },
      },
      data: {
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0,
        form: "D",
        consecutiveMissed: 0,
      },
    });

    // 3. Reset player individual stats
    await prisma.player.updateMany({
      where: {
        division: { in: divisionsToReset },
      },
      data: {
        matchesPlayed: 0,
        goals: 0,
        assists: 0,
        cleanSheets: 0,
        mvpAwards: 0,
        consecutiveMissed: 0,
      },
    });

    // 4. Reset current matchday in LeagueConfig back to 1
    await prisma.leagueConfig.upsert({
      where: { id: "default" },
      update: { currentMatchday: 1 },
      create: { id: "default", currentMatchday: 1, registrationOpen: false },
    });

    // 5. Post broadcast announcement
    await prisma.announcement.create({
      data: {
        title: "🔄 League Schedule & Standings Reset by Commissioner",
        content: `Official Notice: All generated fixtures and division standings table records for ${
          division === "ALL" ? "all divisions (Div 1, Div 2, Div 3)" : division
        } have been completely reset to Matchday 1 clean state by the Commissioner Office.`,
        type: "BROADCAST",
        isPinned: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully reset ${matchIds.length} generated matches and reset standings to 0 for ${
        division === "ALL" ? "all divisions" : division
      }. Current matchday reset to 1.`,
      resetMatchesCount: matchIds.length,
    });
  } catch (err: any) {
    console.error("Tournament reset error:", err);
    return NextResponse.json({ error: err.message || "Failed to reset tournament." }, { status: 500 });
  }
}
