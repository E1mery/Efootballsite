import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { cleanupExpiredRepliedMessages } from "@/lib/messageCleanup";

export async function GET(req: Request) {
  try {
    // Automatically purge replied messages older than 24 hours
    await cleanupExpiredRepliedMessages();

    const cookieStore = await cookies();
    const sessionUserId = cookieStore.get("efrl_session")?.value;
    if (!sessionUserId) {
      return NextResponse.json({ error: "Unauthorized: Please log in." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: sessionUserId },
      include: { player: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User account not found." }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const all = searchParams.get("all") === "true";

    // If admin requests all messages
    if (user.role === "ADMIN" && all) {
      const messages = await (prisma as any).playerMessage.findMany({
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
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json({ messages });
    }

    if (!user.player) {
      return NextResponse.json({ error: "No athlete profile associated with this account." }, { status: 400 });
    }

    // Player fetching their own messages
    const messages = await (prisma as any).playerMessage.findMany({
      where: { playerId: user.player.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ messages });
  } catch (err: any) {
    console.error("Messages GET error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch messages." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const sessionUserId = cookieStore.get("efrl_session")?.value;
    if (!sessionUserId) {
      return NextResponse.json({ error: "Unauthorized: Please log in." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: sessionUserId },
      include: { player: true },
    });

    if (!user || !user.player) {
      return NextResponse.json({ error: "Only registered players can send messages to the admins." }, { status: 403 });
    }

    const body = await req.json();
    const { subject, content } = body;

    if (!subject || !subject.trim()) {
      return NextResponse.json({ error: "Message subject is required." }, { status: 400 });
    }
    if (!content || !content.trim()) {
      return NextResponse.json({ error: "Message content cannot be empty." }, { status: 400 });
    }

    const message = await (prisma as any).playerMessage.create({
      data: {
        playerId: user.player.id,
        subject: subject.trim(),
        content: content.trim(),
        status: "PENDING",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Your message has been sent to the league commissioners. You will receive a response here.",
      data: message,
    });
  } catch (err: any) {
    console.error("Messages POST error:", err);
    return NextResponse.json({ error: err.message || "Failed to send message." }, { status: 500 });
  }
}
