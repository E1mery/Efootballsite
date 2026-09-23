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

async function processAthlete({
  playerId,
  action,
  division = "Division 1",
}: {
  playerId: string;
  action: "ADMIT" | "RESERVE" | "REJECT";
  division?: string;
}) {
  const player = await prisma.player.findUnique({
    where: { id: playerId },
    include: { user: true },
  });

  if (!player) {
    throw new Error(`Player ${playerId} not found.`);
  }

  if (action === "ADMIT") {
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
      throw new Error(
        `${targetDivision} is currently full (${currentActiveCount}/${maxLimit} athletes). Extend capacity in League Controls or place in Reserve Pool.`
      );
    }

    // Verify realTeam compatibility with targetDivision:
    // Division 1 = Premier League, Division 2 = La Liga, Division 3 = Serie A
    let teamUpdate: { realTeam?: string | null; avatar?: string | null } = {};
    if (player.realTeam) {
      const team = findTeam(player.realTeam);
      if (team && team.division !== targetDivision) {
        teamUpdate = { realTeam: null, avatar: null };
      }
    }

    const updatedPlayer = await prisma.player.update({
      where: { id: playerId },
      data: {
        status: "ACTIVE",
        division: targetDivision,
        isDisqualified: false,
        consecutiveMissed: 0,
        ...teamUpdate,
      },
      include: { user: true },
    });

    // Find tournament for this division
    const tournament = await prisma.tournament.findFirst({
      where: {
        OR: [
          { name: { contains: targetDivision, mode: "insensitive" } },
          { slug: { contains: targetDivision.toLowerCase().replace(/\s+/g, "-"), mode: "insensitive" } },
        ],
        type: "DIVISION",
      },
    });

    if (tournament) {
      const existingStanding = await prisma.standing.findFirst({
        where: { playerId: player.id },
      });

      if (existingStanding) {
        await prisma.standing.update({
          where: { id: existingStanding.id },
          data: {
            tournamentId: tournament.id,
            division: targetDivision,
          },
        });
      } else {
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

    // Welcome announcement
    await prisma.announcement.create({
      data: {
        title: `🎉 Registration Approved: Welcome to ${targetDivision}!`,
        content: `Congratulations ${player.gamerTag}! The League Commissioner has reviewed your athlete credentials and officially placed you into ${targetDivision}. Please keep an eye on your dashboard for the next daily fixture drop.`,
        type: "INDIVIDUAL",
        targetPlayerId: player.id,
        isPinned: true,
      },
    });

    return {
      success: true,
      message: `${player.gamerTag} has been approved and admitted to ${targetDivision}!`,
      player: updatedPlayer,
    };
  } else if (action === "RESERVE") {
    const updatedPlayer = await prisma.player.update({
      where: { id: playerId },
      data: {
        status: "RESERVED",
      },
      include: { user: true },
    });

    // Remove any standing entry
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

    return {
      success: true,
      message: `${player.gamerTag} has been placed in the Standby Reserve Pool.`,
      player: updatedPlayer,
    };
  } else if (action === "REJECT") {
    const userId = player.userId;
    const gamerTag = player.gamerTag;

    // Delete standings / match references if any
    await prisma.standing.deleteMany({ where: { playerId: player.id } });
    await prisma.matchSubmission.deleteMany({ where: { submittedByPlayerId: player.id } });
    await prisma.forfeitClaim.deleteMany({
      where: { OR: [{ claimantPlayerId: player.id }, { accusedPlayerId: player.id }] },
    });

    // Delete Player record
    await prisma.player.delete({
      where: { id: playerId },
    });

    // Delete User record if exists
    if (userId) {
      await prisma.user.delete({
        where: { id: userId },
      }).catch(() => {});
    }

    return {
      success: true,
      message: `Registration application for ${gamerTag} has been rejected and removed.`,
      playerId,
    };
  } else {
    throw new Error("Invalid action. Must be ADMIT, RESERVE, or REJECT.");
  }
}

export async function POST(req: Request) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized: Administrator access required." }, { status: 403 });
    }

    const body = await req.json();

    // Support batch processing
    if (Array.isArray(body.batch) && body.batch.length > 0) {
      const results: any[] = [];
      const errors: string[] = [];

      for (const item of body.batch) {
        try {
          const res = await processAthlete({
            playerId: item.playerId,
            action: item.action,
            division: item.division,
          });
          results.push(res);
        } catch (itemErr: any) {
          errors.push(itemErr.message);
        }
      }

      return NextResponse.json({
        success: errors.length === 0,
        processedCount: results.length,
        results,
        errors: errors.length > 0 ? errors : undefined,
        message: `Processed ${results.length} registration(s).${errors.length > 0 ? ` Encountered ${errors.length} error(s).` : ""}`,
      });
    }

    const { playerId, action, division = "Division 1" } = body;

    if (!playerId || !action) {
      return NextResponse.json({ error: "Player ID and action are required." }, { status: 400 });
    }

    const result = await processAthlete({ playerId, action, division });
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("approve-player error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
