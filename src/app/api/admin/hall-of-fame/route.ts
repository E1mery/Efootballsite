import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { ensureR2FileUrl } from "@/lib/r2";
import { getHallOfFameStats, invalidateHallOfFameCache } from "@/lib/hallOfFameStatsService";

async function verifyAdmin() {
  const cookieStore = await cookies();
  const sessionUserId = cookieStore.get("efrl_session")?.value;
  if (!sessionUserId) return null;

  const user = await prisma.user.findUnique({ where: { id: sessionUserId } });
  if (!user || user.role !== "ADMIN") return null;
  return user;
}

export async function GET() {
  try {
    const entries = await prisma.hallOfFame.findMany({
      orderBy: [{ season: "desc" }, { createdAt: "desc" }],
    });
    const stats = await getHallOfFameStats(false);

    return NextResponse.json({ success: true, entries, stats });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized: Administrator access required." }, { status: 403 });
    }

    const body = await req.json();
    const {
      tournamentName,
      season,
      championName,
      championRealName,
      playerImage,
      trophyType = "GOLD",
      isInducted = true,
      isFeatured = false,
      sourceType = "MANUAL",
      notes,
      playerId,
    } = body;

    if (!tournamentName || !season || !championName) {
      return NextResponse.json(
        { error: "Tournament Name, Season, and Champion Name are required." },
        { status: 400 }
      );
    }

    let finalPlayerImage = playerImage?.trim() || null;
    if (finalPlayerImage) {
      finalPlayerImage = await ensureR2FileUrl(finalPlayerImage, "hall-of-fame");
    }

    // Try linking to registered player if not provided
    let linkedPlayerId = playerId || null;
    if (!linkedPlayerId) {
      const matchPlayer = await prisma.player.findFirst({
        where: { gamerTag: { equals: championName.trim(), mode: "insensitive" } },
      });
      if (matchPlayer) linkedPlayerId = matchPlayer.id;
    }

    const entry = await prisma.hallOfFame.create({
      data: {
        tournamentName: tournamentName.trim(),
        season: season.trim(),
        championName: championName.trim(),
        championRealName: championRealName?.trim() || null,
        playerImage: finalPlayerImage || null,
        trophyType: trophyType || "GOLD",
        isInducted: Boolean(isInducted),
        isFeatured: Boolean(isFeatured),
        sourceType: sourceType || "MANUAL",
        notes: notes?.trim() || null,
        playerId: linkedPlayerId,
      },
    });

    await invalidateHallOfFameCache();

    return NextResponse.json({
      success: true,
      message: `Hall of Fame champion ${championName} crowned for ${tournamentName} (${season})!`,
      entry,
    });
  } catch (err: any) {
    console.error("hall-of-fame POST error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized: Administrator access required." }, { status: 403 });
    }

    const body = await req.json();
    const { id, isInducted, isFeatured, notes } = body;

    if (!id) {
      return NextResponse.json({ error: "Entry ID is required." }, { status: 400 });
    }

    const updateData: any = {};
    if (typeof isInducted === "boolean") updateData.isInducted = isInducted;
    if (typeof isFeatured === "boolean") updateData.isFeatured = isFeatured;
    if (typeof notes === "string") updateData.notes = notes.trim();

    const entry = await prisma.hallOfFame.update({
      where: { id },
      data: updateData,
    });

    await invalidateHallOfFameCache();

    return NextResponse.json({
      success: true,
      message: "Hall of Fame entry updated successfully.",
      entry,
    });
  } catch (err: any) {
    console.error("hall-of-fame PATCH error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized: Administrator access required." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Entry ID is required." }, { status: 400 });
    }

    await prisma.hallOfFame.delete({
      where: { id },
    });

    await invalidateHallOfFameCache();

    return NextResponse.json({
      success: true,
      message: "Hall of Fame entry removed successfully.",
    });
  } catch (err: any) {
    console.error("hall-of-fame DELETE error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
