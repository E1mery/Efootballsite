import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const playerId = searchParams.get("playerId");

    const whereClause: any = {
      OR: [{ type: "BROADCAST" }],
    };

    if (playerId) {
      whereClause.OR.push({ targetPlayerId: playerId });
    }

    const announcements = await prisma.announcement.findMany({
      where: whereClause,
      include: { targetPlayer: true },
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ announcements });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to load announcements" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, content, type = "BROADCAST", targetPlayerId, isPinned = false } = body;

    if (!title || !content) {
      return NextResponse.json({ error: "Title and Content are required." }, { status: 400 });
    }

    if (type === "INDIVIDUAL" && !targetPlayerId) {
      return NextResponse.json(
        { error: "Please select a target player for an individual announcement." },
        { status: 400 }
      );
    }

    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        type,
        targetPlayerId: type === "INDIVIDUAL" ? targetPlayerId : null,
        isPinned: Boolean(isPinned),
      },
      include: { targetPlayer: true },
    });

    return NextResponse.json({
      success: true,
      message:
        type === "BROADCAST"
          ? "Broadcast announcement posted to all eFootball Mobile players!"
          : `Direct announcement sent to ${announcement.targetPlayer?.gamerTag}!`,
      announcement,
    });
  } catch (err: any) {
    console.error("Announcement error:", err);
    return NextResponse.json({ error: "Failed to post announcement" }, { status: 500 });
  }
}
