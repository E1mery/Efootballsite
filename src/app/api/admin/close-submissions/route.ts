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
      return NextResponse.json({ error: "Unauthorized: Administrator access required." }, { status: 403 });
    }

    const body = await req.json();
    const { matchId, reason = "Admin manually closed reopened submissions" } = body;

    if (!matchId) {
      return NextResponse.json({ error: "Match ID is required." }, { status: 400 });
    }

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        tournament: true,
        homePlayer: true,
        awayPlayer: true,
      },
    });

    if (!match) {
      return NextResponse.json({ error: "Match fixture not found." }, { status: 404 });
    }

    // Clean notes from reopened markers
    let updatedNotes = match.notes || "";
    if (updatedNotes.includes("ADMIN_REOPENED")) {
      updatedNotes = updatedNotes
        .replace(/ADMIN_REOPENED_FOR_[^:\n]+:\s*[^\n]*/g, "")
        .replace(/ADMIN_REOPENED:\s*[^\n]*/g, "")
        .trim();
    }
    const finalNotes = updatedNotes ? `${updatedNotes} [CLOSED_BY_ADMIN: ${reason}]` : `[CLOSED_BY_ADMIN: ${reason}]`;

    // Expire/close the submission window
    // Setting deadlineDate to now (or matchDate if in past) and allowLateSubmission to false
    const closedDeadline = new Date(Date.now() - 1000); // 1 second ago so it is strictly past

    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: {
        allowLateSubmission: false,
        extendedDeadlineDate: null,
        deadlineDate: closedDeadline,
        notes: finalNotes,
      },
      include: {
        homePlayer: true,
        awayPlayer: true,
      },
    });

    // Notify both athletes that reopened submission access has been closed
    const playersToNotify = [match.homePlayer, match.awayPlayer].filter(Boolean);
    for (const player of playersToNotify) {
      if (!player) continue;
      await prisma.announcement.create({
        data: {
          title: `🔒 Match Submission Closed: ${match.round}`,
          content: `Hello @${player.gamerTag}. The extended submission window for your fixture (${match.homePlayer?.gamerTag || "Home"} vs ${match.awayPlayer?.gamerTag || "Away"} - ${match.round}) has been closed by the League Administrator.`,
          type: "INDIVIDUAL",
          targetPlayerId: player.id,
          isPinned: false,
        },
      }).catch((err) => {
        console.error("[close-submissions] Notification error:", err);
      });
    }

    return NextResponse.json({
      success: true,
      message: `Submissions successfully closed for ${match.round} (${match.homePlayer?.gamerTag || "Home"} vs ${match.awayPlayer?.gamerTag || "Away"}).`,
      match: updatedMatch,
    });
  } catch (error: any) {
    console.error("[close-submissions] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to close submissions." },
      { status: 500 }
    );
  }
}
