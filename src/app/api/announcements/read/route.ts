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
    const { announcementId, announcementIds } = body;

    const ids: string[] = Array.isArray(announcementIds)
      ? announcementIds.filter((id) => typeof id === "string" && id.length > 0)
      : typeof announcementId === "string" && announcementId.length > 0
      ? [announcementId]
      : [];

    if (ids.length === 0) {
      return NextResponse.json({ error: "Announcement ID is required" }, { status: 400 });
    }

    const playerId = user.player.id;

    // Persist or refresh read receipts
    await Promise.all(
      ids.map((id) =>
        prisma.announcementRead.upsert({
          where: {
            announcementId_playerId: {
              announcementId: id,
              playerId,
            },
          },
          update: {},
          create: {
            announcementId: id,
            playerId,
            readAt: new Date(),
          },
        })
      )
    );

    return NextResponse.json({
      success: true,
      markedIds: ids,
      message: "Announcement(s) marked as read.",
    });
  } catch (err: any) {
    console.error("Mark announcement read error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
