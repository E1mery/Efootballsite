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

export async function POST(req: Request) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized: Administrator access required." }, { status: 403 });
    }

    const body = await req.json();
    const { playerId, action, division = "Division 1" } = body;

    if (!playerId || !action) {
      return NextResponse.json({ error: "Player ID and action are required." }, { status: 400 });
    }

    const player = await prisma.player.findUnique({
      where: { id: playerId },
      include: { user: true },
    });

    if (!player) {
      return NextResponse.json({ error: "Player not found." }, { status: 404 });
    }

    if (action === "ADMIT") {
      // 1. Admit athlete into selected division
      const validDivisions = ["Division 1", "Division 2", "Division 3"];
      const targetDivision = validDivisions.includes(division) ? division : "Division 1";

      // Check division capacity limit
      const config = await prisma.leagueConfig.findUnique({ where: { id: "default" } });
      const maxLimit =
        targetDivision === "Division 1"
          ? (config?.div1MaxPlayers ?? 20)
          : targetDivision === "Division 2"
          ? (config?.div2MaxPlayers ?? 20)
          : (config?.div3MaxPlayers ?? 20);

      const currentActiveCount = await prisma.player.count({
        where: {
          division: targetDivision,
          status: { in: ["ACTIVE", "WARNING"] },
          id: { not: playerId },
        },
      });

      if (currentActiveCount >= maxLimit) {
        return NextResponse.json(
          {
            error: `${targetDivision} is currently full (${currentActiveCount}/${maxLimit} athletes). To add more players, please extend the participant capacity for ${targetDivision} in League Controls.`,
          },
          { status: 400 }
        );
      }

      const updatedPlayer = await prisma.player.update({
        where: { id: playerId },
        data: {
          status: "ACTIVE",
          division: targetDivision,
          isDisqualified: false,
          consecutiveMissed: 0,
        },
        include: { user: true },
      });

      // 2. Find tournament and ensure a Standing record exists
      const tournament = await prisma.tournament.findFirst({
        where: {
          name: { contains: targetDivision },
          type: "DIVISION",
        },
      });

      if (tournament) {
        const existingStanding = await prisma.standing.findUnique({
          where: {
            tournamentId_playerId: {
              tournamentId: tournament.id,
              playerId: player.id,
            },
          },
        });

        if (!existingStanding) {
          const currentCount = await prisma.standing.count({
            where: { tournamentId: tournament.id, division: targetDivision },
          });

          await prisma.standing.create({
            data: {
              tournamentId: tournament.id,
              division: targetDivision,
              playerId: player.id,
              rank: currentCount + 1,
              played: 0,
              won: 0,
              drawn: 0,
              lost: 0,
              goalsFor: 0,
              goalsAgainst: 0,
              goalDifference: 0,
              points: 0,
              form: "D",
            },
          });
        }
      }

      // 3. Welcome announcement to this player
      await prisma.announcement.create({
        data: {
          title: `🎉 Registration Approved: Welcome to ${targetDivision}!`,
          content: `Congratulations ${player.gamerTag}! The League Commissioner has reviewed your athlete credentials and officially placed you into ${targetDivision}. Please keep an eye on your dashboard for the next daily fixture drop.`,
          type: "INDIVIDUAL",
          targetPlayerId: player.id,
          isPinned: true,
        },
      });

      return NextResponse.json({
        success: true,
        message: `${player.gamerTag} has been approved and admitted to ${targetDivision}!`,
        player: updatedPlayer,
      });
    } else if (action === "RESERVE") {
      // Place in Reserve Pool (Standby)
      const updatedPlayer = await prisma.player.update({
        where: { id: playerId },
        data: {
          status: "RESERVED",
        },
        include: { user: true },
      });

      // Remove any standing entry if previously present
      await prisma.standing.deleteMany({
        where: { playerId: player.id },
      });

      await prisma.announcement.create({
        data: {
          title: "📋 Placed in Official Standby Reserve Pool",
          content: `Hello ${player.gamerTag}, your registration has been approved for the official League Reserve Pool. You are on standby and eligible as a replacement athlete whenever active roster slots become available. You can view all league standings directly on your dashboard.`,
          type: "INDIVIDUAL",
          targetPlayerId: player.id,
          isPinned: true,
        },
      });

      return NextResponse.json({
        success: true,
        message: `${player.gamerTag} has been placed in the Standby Reserve Pool.`,
        player: updatedPlayer,
      });
    } else {
      return NextResponse.json({ error: "Invalid action. Must be ADMIT or RESERVE." }, { status: 400 });
    }
  } catch (err: any) {
    console.error("approve-player error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
