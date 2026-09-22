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

export async function POST(req: Request) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json(
        { error: "Unauthorized: Administrator privileges required." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { playerId, realTeam, gamerTag, fullName, whatsapp, division, overallRating, status, avatar } = body;

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

    const updateData: any = {};

    if (gamerTag && gamerTag.trim()) {
      updateData.gamerTag = gamerTag.trim();
    }
    if (fullName && fullName.trim()) {
      updateData.fullName = fullName.trim();
    }
    if (whatsapp && whatsapp.trim()) {
      updateData.whatsapp = whatsapp.trim();
    }
    if (division) {
      updateData.division = division;
    }
    if (overallRating !== undefined) {
      updateData.overallRating = Number(overallRating);
    }
    if (status) {
      updateData.status = status;
    }

    if (realTeam !== undefined) {
      const team = findTeam(realTeam);
      if (team) {
        updateData.realTeam = team.name;
        updateData.avatar = team.logo;
      } else if (realTeam === "" || realTeam === null) {
        updateData.realTeam = null;
      }
    } else if (avatar !== undefined) {
      updateData.avatar = avatar;
    }

    const updated = await prisma.player.update({
      where: { id: playerId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: `Updated player ${updated.gamerTag} successfully!`,
      player: updated,
    });
  } catch (err: any) {
    console.error("Admin update player error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to update player." },
      { status: 500 }
    );
  }
}
