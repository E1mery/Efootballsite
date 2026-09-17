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

export async function GET() {
  try {
    const entries = await prisma.hallOfFame.findMany({
      orderBy: [{ season: "desc" }, { createdAt: "desc" }],
    });
    return NextResponse.json({ success: true, entries });
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
      runnerUp,
      prizeWon,
      trophyType = "GOLD",
      notes,
    } = body;

    if (!tournamentName || !season || !championName) {
      return NextResponse.json(
        { error: "Tournament Name, Season, and Champion Name are required." },
        { status: 400 }
      );
    }

    const entry = await prisma.hallOfFame.create({
      data: {
        tournamentName: tournamentName.trim(),
        season: season.trim(),
        championName: championName.trim(),
        championRealName: championRealName?.trim() || null,
        runnerUp: runnerUp?.trim() || null,
        prizeWon: prizeWon?.trim() || null,
        trophyType: trophyType || "GOLD",
        notes: notes?.trim() || null,
      },
    });

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

    return NextResponse.json({
      success: true,
      message: "Hall of Fame entry removed successfully.",
    });
  } catch (err: any) {
    console.error("hall-of-fame DELETE error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
