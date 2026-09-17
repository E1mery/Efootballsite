import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

async function verifyAdmin() {
  const cookieStore = await cookies();
  const sessionUserId = cookieStore.get("efrl_session")?.value;
  if (!sessionUserId) return null;

  const user = await prisma.user.findUnique({ where: { id: sessionUserId } });
  if (!user || user.role !== "ADMIN") return null;
  return user;
}

export async function DELETE(req: Request) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized: Administrator access required." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const playerId = searchParams.get("playerId");

    if (!playerId) {
      return NextResponse.json({ error: "Player ID is required." }, { status: 400 });
    }

    const player = await prisma.player.findUnique({
      where: { id: playerId },
      include: { user: true },
    });

    if (!player) {
      return NextResponse.json({ error: "Player not found." }, { status: 404 });
    }

    const division = player.division;
    const gamerTag = player.gamerTag;
    const userId = player.userId;

    // 1. Delete scheduled / unplayed matches for this player
    await prisma.match.deleteMany({
      where: {
        OR: [{ homePlayerId: playerId }, { awayPlayerId: playerId }],
        status: { in: ["SCHEDULED", "LIVE"] },
      },
    });

    // 2. Delete standings entries
    await prisma.standing.deleteMany({
      where: { playerId: playerId },
    });

    // 3. Delete UCL Group slots
    await prisma.uclGroupSlot.deleteMany({
      where: { playerId: playerId },
    });

    // 4. Delete submissions and forfeit claims
    await prisma.matchSubmission.deleteMany({
      where: { submittedByPlayerId: playerId },
    });

    await prisma.forfeitClaim.deleteMany({
      where: {
        OR: [{ claimantPlayerId: playerId }, { accusedPlayerId: playerId }],
      },
    });

    // 5. Delete Player record (cascading deletes will handle remaining references)
    await prisma.player.delete({
      where: { id: playerId },
    });

    // 6. Delete associated User record if present
    if (userId) {
      await prisma.user.delete({
        where: { id: userId },
      }).catch(() => {});
    }

    // 7. Recalculate standings ranks for the affected division
    const remainingStandings = await prisma.standing.findMany({
      where: { division: division },
      orderBy: [{ points: "desc" }, { goalDifference: "desc" }, { goalsFor: "desc" }],
    });

    for (let i = 0; i < remainingStandings.length; i++) {
      await prisma.standing.update({
        where: { id: remainingStandings[i].id },
        data: { rank: i + 1 },
      });
    }

    // 8. Log league announcement of player removal
    await prisma.announcement.create({
      data: {
        title: `⚠️ ROSTER UPDATE: ${gamerTag} Removed from League`,
        content: `Athlete ${gamerTag} has been officially removed from ${division} by the League Commissioner. Standings and unplayed fixtures have been adjusted accordingly.`,
        type: "BROADCAST",
        isPinned: false,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Player ${gamerTag} has been successfully removed from the league.`,
    });
  } catch (err: any) {
    console.error("remove-player error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
