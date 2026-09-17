import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const sessionUserId = cookieStore.get("efrl_session")?.value;
    if (!sessionUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: sessionUserId },
      include: { player: true },
    });

    if (!user || !user.player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    const body = await req.json();
    const { announcementId } = body;

    if (!announcementId) {
      return NextResponse.json({ error: "Announcement ID is required" }, { status: 400 });
    }

    // Persist or refresh read receipt
    const readRecord = await prisma.announcementRead.upsert({
      where: {
        announcementId_playerId: {
          announcementId,
          playerId: user.player.id,
        },
      },
      update: {},
      create: {
        announcementId,
        playerId: user.player.id,
        readAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      announcementId,
      readAt: readRecord.readAt.toISOString(),
      message: "Announcement marked as read. It will be removed from your feed 24 hours after being read.",
    });
  } catch (err: any) {
    console.error("Mark announcement read error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
