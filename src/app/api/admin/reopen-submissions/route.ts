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
    const {
      matchId,
      extensionHours = 24,
      clearSubmissions = true,
      targetPlayerId = null,
      reason = "Admin reopened submission access",
    } = body;

    if (!matchId) {
      return NextResponse.json({ error: "Match ID is required." }, { status: 400 });
    }

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        homePlayer: true,
        awayPlayer: true,
        submissions: true,
        forfeitClaims: true,
      },
    });

    if (!match) {
      return NextResponse.json({ error: "Match fixture not found." }, { status: 404 });
    }

    const newDeadline = new Date(Date.now() + Number(extensionHours) * 60 * 60 * 1000);

    // Optionally reset/supersede old pending submissions so buttons are fresh
    if (clearSubmissions) {
      await prisma.matchSubmission.updateMany({
        where: { matchId, status: "PENDING" },
        data: { status: "REPLACED", adminNotes: "Reopened by Commissioner" },
      });

      await prisma.forfeitClaim.updateMany({
        where: { matchId, status: "PENDING" },
        data: { status: "REJECTED", adminNotes: "Reopened for gameplay by Commissioner" },
      });
    }

    const notesMarker = targetPlayerId
      ? `ADMIN_REOPENED_FOR_${targetPlayerId}: ${reason}`
      : `ADMIN_REOPENED: ${reason}`;

    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: {
        allowLateSubmission: true,
        extendedDeadlineDate: newDeadline,
        deadlineDate: newDeadline,
        status: match.status === "FORFEIT" || match.status === "FINISHED" ? "SCHEDULED" : match.status,
        notes: notesMarker,
      },
      include: {
        homePlayer: true,
        awayPlayer: true,
        submissions: {
          include: { submittedByPlayer: true },
          orderBy: { createdAt: "desc" },
        },
        forfeitClaims: {
          include: { claimantPlayer: true, accusedPlayer: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    // Notify the players
    const notifyTitle = `🔓 Match Result Submissions Reopened!`;
    const notifyContent = `The League Commissioner has granted permission to upload or re-upload your match scores and screenshot proof for ${match.homePlayer.gamerTag} vs ${match.awayPlayer.gamerTag}. The submission buttons on your "Today's 24-Hr Match" page are now active until ${newDeadline.toLocaleDateString()} ${newDeadline.toLocaleTimeString()}.`;

    const recipients = targetPlayerId
      ? [targetPlayerId]
      : [match.homePlayerId, match.awayPlayerId];

    await prisma.announcement.createMany({
      data: recipients.map((pid) => ({
        title: notifyTitle,
        content: notifyContent,
        type: "INDIVIDUAL",
        targetPlayerId: pid,
        isPinned: true,
      })),
    });

    return NextResponse.json({
      success: true,
      message: `Submissions reopened successfully for match ${match.homePlayer.gamerTag} vs ${match.awayPlayer.gamerTag}. Window active for ${extensionHours} hours.`,
      match: updatedMatch,
    });
  } catch (err: any) {
    console.error("Reopen submissions error:", err);
    return NextResponse.json({ error: err.message || "Failed to reopen submissions." }, { status: 500 });
  }
}
