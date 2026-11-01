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
      round,
      division = "ALL",
      reason = "Admin manually closed matchday submissions",
    } = body;

    if (!round || typeof round !== "string" || !round.trim()) {
      return NextResponse.json({ error: "Matchday round name is required (e.g., 'Matchday 1')." }, { status: 400 });
    }

    const trimmedRound = round.trim();

    const whereFilter: any = {
      round: { equals: trimmedRound, mode: "insensitive" },
    };
    if (division && division !== "ALL") {
      whereFilter.division = division;
    }

    const matches = await prisma.match.findMany({
      where: whereFilter,
      include: {
        homePlayer: true,
        awayPlayer: true,
      },
    });

    if (matches.length === 0) {
      return NextResponse.json(
        { error: `No matches found for ${trimmedRound}${division !== "ALL" ? ` in ${division}` : ""}.` },
        { status: 404 }
      );
    }

    // Filter to matches that have active reopen flags, or close all matching fixtures
    const matchesToClose = matches.filter(
      (m) => m.allowLateSubmission || m.notes?.includes("ADMIN_REOPENED")
    );

    const targetMatches = matchesToClose.length > 0 ? matchesToClose : matches;

    const playerIdsToNotify = new Set<string>();

    for (const match of targetMatches) {
      const updatedNotes = (match.notes || "")
        .replace(/ADMIN_REOPENED_FOR_[^:\n]+:\s*[^\n]*/g, "")
        .replace(/ADMIN_REOPENED:\s*[^\n]*/g, "")
        .replace(/\[CLOSED_BY_ADMIN:[^\]]*\]/g, "")
        .trim();

      const finalNotes = updatedNotes.length > 0 ? updatedNotes : null;
      const originalDate = match.matchDate ? new Date(match.matchDate) : new Date();

      await prisma.match.update({
        where: { id: match.id },
        data: {
          allowLateSubmission: false,
          extendedDeadlineDate: null,
          deadlineDate: originalDate,
          notes: finalNotes,
        },
      });

      if (match.homePlayerId) playerIdsToNotify.add(match.homePlayerId);
      if (match.awayPlayerId) playerIdsToNotify.add(match.awayPlayerId);
    }

    const pIds = Array.from(playerIdsToNotify);
    if (pIds.length > 0) {
      try {
        await prisma.announcement.createMany({
          data: pIds.map((pid) => ({
            title: `🔒 ${trimmedRound} Submissions Closed`,
            content: `The submission window for ${trimmedRound} fixtures has been closed by the League Administrator. Late upload buttons are now locked.`,
            type: "INDIVIDUAL",
            targetPlayerId: pid,
            isPinned: false,
          })),
        });
      } catch (announcementErr) {
        console.error("[close-matchday] Announcements error:", announcementErr);
      }
    }

    // Broadcast announcement
    try {
      await prisma.announcement.create({
        data: {
          title: `🔒 ${trimmedRound} Submissions Closed`,
          content: `Result submissions for ${trimmedRound} have been officially closed by the League Administrator.`,
          type: "BROADCAST",
          isPinned: false,
        },
      });
    } catch (broadcastErr) {
      console.error("[close-matchday] Broadcast announcement error:", broadcastErr);
    }

    return NextResponse.json({
      success: true,
      message: `Submissions successfully closed for ${targetMatches.length} fixture(s) in ${trimmedRound}. Late upload permissions locked.`,
      closedCount: targetMatches.length,
      round: trimmedRound,
    });
  } catch (err: any) {
    console.error("[close-matchday] Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to close matchday submissions." },
      { status: 500 }
    );
  }
}
