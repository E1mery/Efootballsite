import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

async function verifyAdmin() {
  const cookieStore = await cookies();
  const sessionUserId = cookieStore.get("efrl_session")?.value;
  if (!sessionUserId) return null;

  const user = await prisma.user.findUnique({
    where: { id: sessionUserId },
  });

  if (!user || user.role !== "ADMIN") return null;
  return user;
}

export async function POST(req: Request) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized: Admin access required." }, { status: 403 });
    }

    const body = await req.json();
    const { messageId, replyContent, status } = body;

    if (!messageId) {
      return NextResponse.json({ error: "Message ID is required." }, { status: 400 });
    }
    if (!replyContent || !replyContent.trim()) {
      return NextResponse.json({ error: "Reply content cannot be empty." }, { status: 400 });
    }

    const message = await (prisma as any).playerMessage.findUnique({
      where: { id: messageId },
      include: { player: true },
    });

    if (!message) {
      return NextResponse.json({ error: "Message not found." }, { status: 404 });
    }

    const updated = await (prisma as any).playerMessage.update({
      where: { id: messageId },
      data: {
        adminReply: replyContent.trim(),
        status: status || "REPLIED",
        repliedAt: new Date(),
      },
      include: {
        player: {
          select: {
            id: true,
            gamerTag: true,
            fullName: true,
            division: true,
            whatsapp: true,
            avatar: true,
          },
        },
      },
    });

    // Also send an individual announcement directly to the player's inbox
    await prisma.announcement.create({
      data: {
        title: `Official Commissioner Reply: ${message.subject}`,
        content: replyContent.trim(),
        type: "INDIVIDUAL",
        targetPlayerId: message.playerId,
        isPinned: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Reply sent successfully to the athlete.",
      data: updated,
    });
  } catch (err: any) {
    console.error("Admin message reply error:", err);
    return NextResponse.json({ error: err.message || "Failed to submit reply." }, { status: 500 });
  }
}
