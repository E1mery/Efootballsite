import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { checkAndSendOneHourMatchReminders } from "@/lib/autoMatchReminders";
import { cleanupExpiredAnnouncements } from "@/lib/announcementCleanup";

export async function GET(req: Request) {
  try {
    // Check and trigger any pending 1-hour automated reminders
    await checkAndSendOneHourMatchReminders();

    // Automatically purge announcements older than 24 hours
    await cleanupExpiredAnnouncements();
    const cutoff24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const { searchParams } = new URL(req.url);
    const playerId = searchParams.get("playerId");

    const whereClause: any = {
      createdAt: { gte: cutoff24h },
      OR: [{ type: "BROADCAST" }],
    };

    if (playerId) {
      whereClause.OR.push({ targetPlayerId: playerId });

      // Exclude announcements marked as read > 24 hours ago
      const expiredReads = await prisma.announcementRead.findMany({
        where: {
          playerId,
          readAt: { lt: cutoff24h },
        },
        select: { announcementId: true },
      });

      if (expiredReads.length > 0) {
        whereClause.id = { notIn: expiredReads.map((r) => r.announcementId) };
      }
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

export async function PATCH(req: Request) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized: Administrator access required." }, { status: 403 });
    }

    const body = await req.json();
    const { id, isPinned } = body;

    if (!id) {
      return NextResponse.json({ error: "Announcement ID is required." }, { status: 400 });
    }

    const updated = await prisma.announcement.update({
      where: { id },
      data: { isPinned: Boolean(isPinned) },
    });

    return NextResponse.json({
      success: true,
      message: updated.isPinned
        ? "Announcement pinned and marked as Breaking News for Hero Carousel!"
        : "Announcement unpinned from Breaking News.",
      announcement: updated,
    });
  } catch (err: any) {
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
      return NextResponse.json({ error: "Announcement ID is required." }, { status: 400 });
    }

    await prisma.announcement.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Announcement removed successfully.",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
