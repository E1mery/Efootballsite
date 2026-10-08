import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { ensureR2FileUrl } from "@/lib/r2";
import { invalidateHallOfFameCache } from "@/lib/hallOfFameStatsService";

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
    const records = await prisma.manualHistoricalRecord.findMany({
      orderBy: [{ recordDate: "desc" }, { createdAt: "desc" }],
    });
    return NextResponse.json({ success: true, records });
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
      recordName,
      playerName,
      value,
      numericValue,
      recordDate,
      season,
      competition,
      description,
      supportingImageUrl,
      playerId,
    } = body;

    if (!recordName || !playerName || !value) {
      return NextResponse.json(
        { error: "Record Name, Player Name, and Record Value are required." },
        { status: 400 }
      );
    }

    let finalImageUrl = supportingImageUrl?.trim() || null;
    if (finalImageUrl) {
      finalImageUrl = await ensureR2FileUrl(finalImageUrl, "hall-of-fame-records");
    }

    let parsedDate: Date | null = null;
    if (recordDate) {
      const d = new Date(recordDate);
      if (!isNaN(d.getTime())) parsedDate = d;
    }

    const record = await prisma.manualHistoricalRecord.create({
      data: {
        recordName: recordName.trim(),
        playerName: playerName.trim(),
        value: value.trim(),
        numericValue: typeof numericValue === "number" ? numericValue : parseFloat(value) || null,
        recordDate: parsedDate,
        season: season?.trim() || null,
        competition: competition?.trim() || null,
        description: description?.trim() || null,
        supportingImageUrl: finalImageUrl,
        playerId: playerId || null,
        sourceType: "MANUAL",
      },
    });

    await invalidateHallOfFameCache();

    return NextResponse.json({
      success: true,
      message: `Manual historical record "${recordName}" registered successfully (marked as MANUAL).`,
      record,
    });
  } catch (err: any) {
    console.error("Manual historical record POST error:", err);
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
      return NextResponse.json({ error: "Record ID is required." }, { status: 400 });
    }

    await prisma.manualHistoricalRecord.delete({
      where: { id },
    });

    await invalidateHallOfFameCache();

    return NextResponse.json({
      success: true,
      message: "Manual historical record deleted successfully.",
    });
  } catch (err: any) {
    console.error("Manual historical record DELETE error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
