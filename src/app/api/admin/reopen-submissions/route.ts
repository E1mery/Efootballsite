import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { formatRwandanDateTime } from "@/lib/rwandanTime";
import { recalculateStandings } from "@/lib/recalculateStandings";
import { notifyStandingsUpdate } from "@/lib/notifyStandingsUpdate";
import { invalidateHallOfFameCache } from "@/lib/hallOfFameStatsService";

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
        tournament: true,
        homePlayer: true,
        awayPlayer: true,
        submissions: true,
        forfeitClaims: true,
      },
    });

    if (!match) {
      return NextResponse.json({ error: "Match fixture not found." }, { status: 404 });
    }

    // Guard against modifying archived seasons
    if (match.tournament?.season) {
      const isArchived = await prisma.archivedSeason.findUnique({
        where: { seasonName: match.tournament.season },
      });
      if (isArchived) {
        return NextResponse.json(
          { error: "This season is officially archived and read-only. Historical matches cannot be reopened." },
          { status: 403 }
        );
      }
    }

    const hours = Number(extensionHours) > 0 ? Number(extensionHours) : 24;
    const newDeadline = new Date(Date.now() + hours * 60 * 60 * 1000);

    // Supersede prior submissions and forfeit claims so upload & claim buttons unlock cleanly
    if (clearSubmissions) {
      await prisma.matchSubmission.updateMany({
        where: { matchId },
        data: { status: "REPLACED", adminNotes: "Reopened by Commissioner" },
      });

      await prisma.forfeitClaim.updateMany({
        where: { matchId },
        data: { status: "REJECTED", adminNotes: "Reopened for gameplay by Commissioner" },
      });
    }

    const hadFinishedResult =
      match.status === "FINISHED" ||
      match.status === "FORFEIT" ||
      match.homeScore !== null ||
      match.awayScore !== null;

    const notesMarker = targetPlayerId
      ? `ADMIN_REOPENED_FOR_${targetPlayerId}: ${reason}`
      : `ADMIN_REOPENED: ${reason}`;

    // Reset scores & proofs, set status to SCHEDULED, unlock submission window
    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: {
        allowLateSubmission: true,
        extendedDeadlineDate: newDeadline,
        deadlineDate: newDeadline,
        status: "SCHEDULED",
        homeScore: null,
        awayScore: null,
        leg2HomeScore: null,
        leg2AwayScore: null,
        aggregateHomeScore: null,
        aggregateAwayScore: null,
        screenshotUrl: null,
        leg2ScreenshotUrl: null,
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

    // If the match previously had scores/finished status, recalculate standings to reverse the prior score
    if (hadFinishedResult) {
      try {
        const divToRecalc =
          match.stage === "GROUP" && match.groupName
            ? `${match.division} ${match.groupName}`
            : match.division;
        await recalculateStandings(match.tournamentId, divToRecalc);
        await invalidateHallOfFameCache().catch(() => {});
        await notifyStandingsUpdate({
          tournamentType: match.division,
          competitionName: match.division,
          groupName: match.groupName,
          matchSummary: "Result Reverted (Submissions Reopened)",
        });
      } catch (standingsErr) {
        console.error("[reopen-submissions] Standings recalculation error:", standingsErr);
      }

      try {
        const { syncSocialResultForMatch } = await import("@/lib/socialResultSync");
        await syncSocialResultForMatch(match.id, "SCHEDULED");
      } catch (socialErr) {
        console.error("[reopen-submissions] Social sync error:", socialErr);
      }
    }

    // Safely notify the players
    const homeTag = match.homePlayer?.gamerTag || "Home Athlete";
    const awayTag = match.awayPlayer?.gamerTag || "Away Athlete";
    const notifyTitle = `🔓 Match Result Submissions Reopened!`;
    const notifyContent = `The League Commissioner has granted permission to upload or re-upload your match scores and screenshot proof for ${homeTag} vs ${awayTag}. The submission buttons on your "Today's Match" page are now active until ${formatRwandanDateTime(newDeadline)} (CAT / Rwandan Time).`;

    const recipientIds = (
      targetPlayerId
        ? [targetPlayerId]
        : [match.homePlayerId, match.awayPlayerId]
    ).filter((id): id is string => Boolean(id));

    if (recipientIds.length > 0) {
      try {
        await prisma.announcement.createMany({
          data: recipientIds.map((pid) => ({
            title: notifyTitle,
            content: notifyContent,
            type: "INDIVIDUAL",
            targetPlayerId: pid,
            isPinned: true,
          })),
        });
      } catch (announcementErr) {
        console.error("[reopen-submissions] Notification error:", announcementErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Submissions reopened successfully for match ${homeTag} vs ${awayTag}. Window active for ${hours} hours.`,
      match: updatedMatch,
    });
  } catch (err: any) {
    console.error("Reopen submissions error:", err);
    return NextResponse.json({ error: err.message || "Failed to reopen submissions." }, { status: 500 });
  }
}
