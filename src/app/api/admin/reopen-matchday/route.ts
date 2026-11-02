import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { formatRwandanDateTime } from "@/lib/rwandanTime";
import { recalculateStandings } from "@/lib/recalculateStandings";
import { notifyStandingsUpdate } from "@/lib/notifyStandingsUpdate";
import { invalidateHallOfFameCache } from "@/lib/hallOfFameStatsService";
import { syncPlayerDiscipline } from "@/lib/consecutiveMissed";

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
      extensionHours = 24,
      clearSubmissions = true,
      scope = "ALL", // "ALL" | "UNPLAYED_ONLY"
      reason = "Commissioner reopened matchday result submission window",
    } = body;

    if (!round || typeof round !== "string" || !round.trim()) {
      return NextResponse.json({ error: "Matchday round name is required (e.g., 'Matchday 1')." }, { status: 400 });
    }

    const trimmedRound = round.trim();

    // Query matches for this round, optionally filtered by division
    const whereFilter: any = {
      round: trimmedRound,
    };
    if (division && division !== "ALL") {
      whereFilter.division = division;
    }

    const allMatchesInRound = await prisma.match.findMany({
      where: whereFilter,
      include: {
        tournament: true,
        homePlayer: true,
        awayPlayer: true,
        submissions: true,
        forfeitClaims: true,
      },
    });

    if (allMatchesInRound.length === 0) {
      return NextResponse.json(
        { error: `No matches found for ${trimmedRound}${division !== "ALL" ? ` in ${division}` : ""}.` },
        { status: 404 }
      );
    }

    // Guard against modifying archived seasons
    const tournamentSeasons = Array.from(
      new Set(allMatchesInRound.map((m) => m.tournament?.season).filter(Boolean))
    );
    for (const seasonName of tournamentSeasons) {
      const isArchived = await prisma.archivedSeason.findUnique({
        where: { seasonName: seasonName as string },
      });
      if (isArchived) {
        return NextResponse.json(
          {
            error: `Season "${seasonName}" is officially archived and read-only. Historical matchdays cannot be reopened.`,
          },
          { status: 403 }
        );
      }
    }

    // Filter matches according to scope
    let matchesToReopen = allMatchesInRound;
    if (scope === "UNPLAYED_ONLY") {
      matchesToReopen = allMatchesInRound.filter((m) => {
        if (m.status === "SCHEDULED") return true;
        if (m.status === "FORFEIT") return true;
        if (m.allowLateSubmission) return true;
        if (
          m.notes?.includes("Automatic 0-0 Draw") ||
          m.notes?.includes("24-hour midnight window elapsed") ||
          m.notes?.includes("missed match") ||
          m.notes?.includes("elapsed without submitted score") ||
          m.notes?.includes("ADMIN_REOPENED") ||
          m.notes?.includes("REOPEN")
        ) {
          return true;
        }
        if (m.homeScore === null || m.awayScore === null) return true;
        if (m.homeScore === 0 && m.awayScore === 0 && (!m.submissions || m.submissions.length === 0)) {
          return true;
        }
        return false;
      });
    }

    if (matchesToReopen.length === 0) {
      return NextResponse.json(
        {
          error: `No unplayed or expired matches found to reopen in ${trimmedRound}. All matches have verified results. Choose "All Fixtures in Matchday" if you wish to reset completed scores as well.`,
        },
        { status: 400 }
      );
    }

    const hours = Number(extensionHours) > 0 ? Number(extensionHours) : 24;
    const newDeadline = new Date(Date.now() + hours * 60 * 60 * 1000);
    const matchIdsToReopen = matchesToReopen.map((m) => m.id);

    // Supersede prior submissions and forfeit claims if clearSubmissions is enabled
    if (clearSubmissions) {
      await prisma.matchSubmission.updateMany({
        where: { matchId: { in: matchIdsToReopen } },
        data: {
          status: "REPLACED",
          adminNotes: `Reopened by Commissioner (${trimmedRound} Batch Reopen)`,
        },
      });

      await prisma.forfeitClaim.updateMany({
        where: { matchId: { in: matchIdsToReopen } },
        data: {
          status: "REJECTED",
          adminNotes: `Reopened for gameplay by Commissioner (${trimmedRound} Batch Reopen)`,
        },
      });
    }

    const notesMarker = `ADMIN_REOPENED: ${reason.trim()}`;

    // Update match fixtures to SCHEDULED, unlock submission window, extend deadline, reset scores
    await prisma.match.updateMany({
      where: { id: { in: matchIdsToReopen } },
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
    });

    // Check if any reopened matches had finished results and reverse their standings effect
    const hadFinishedResultMatches = matchesToReopen.filter(
      (m) =>
        m.status === "FINISHED" ||
        m.status === "FORFEIT" ||
        m.homeScore !== null ||
        m.awayScore !== null
    );

    if (hadFinishedResultMatches.length > 0) {
      const affectedDivisionsMap = new Map<
        string,
        { tournamentId: string; division: string; rawDivision: string; groupName?: string | null }
      >();

      for (const m of hadFinishedResultMatches) {
        const divToRecalc =
          m.stage === "GROUP" && m.groupName
            ? `${m.division} ${m.groupName}`
            : m.division;
        const key = `${m.tournamentId}___${divToRecalc}`;
        if (!affectedDivisionsMap.has(key)) {
          affectedDivisionsMap.set(key, {
            tournamentId: m.tournamentId,
            division: divToRecalc,
            rawDivision: m.division,
            groupName: m.groupName,
          });
        }
      }

      for (const [, target] of affectedDivisionsMap) {
        try {
          await recalculateStandings(target.tournamentId, target.division);
          await notifyStandingsUpdate({
            tournamentType: target.rawDivision,
            competitionName: target.rawDivision,
            groupName: target.groupName || undefined,
            matchSummary: `${trimmedRound} Submissions Reopened`,
          });
        } catch (standingsErr) {
          console.error("[reopen-matchday] Standings recalculation error:", standingsErr);
        }
      }

      await invalidateHallOfFameCache().catch(() => {});

      // Social feed sync: Archive results of reopened fixtures in one fast batch query
      try {
        await prisma.socialPost.updateMany({
          where: {
            matchId: { in: matchIdsToReopen },
            type: {
              in: [
                "MOTD_RESULT",
                "MOTW_RESULT",
                "DERBY_RESULT",
                "SUPER_CUP_RESULT",
                "UCL_FINAL_RESULT",
                "EUROPA_FINAL_RESULT",
              ],
            },
          },
          data: {
            status: "ARCHIVED",
          },
        });
      } catch (socialErr) {
        console.error("[reopen-matchday] Social sync error:", socialErr);
      }
    }

    const deadlineFormatted = formatRwandanDateTime(newDeadline);

    // Collect individual players to notify and sync discipline
    const playerIdsToNotify = new Set<string>();
    for (const m of matchesToReopen) {
      if (m.homePlayerId) playerIdsToNotify.add(m.homePlayerId);
      if (m.awayPlayerId) playerIdsToNotify.add(m.awayPlayerId);
    }

    const pIds = Array.from(playerIdsToNotify);

    // Remove missed match penalties and synchronize player discipline
    if (pIds.length > 0) {
      try {
        await syncPlayerDiscipline(pIds);
      } catch (disciplineErr) {
        console.error("[reopen-matchday] Discipline sync error:", disciplineErr);
      }
    }

    if (pIds.length > 0) {
      try {
        // Chunk individual announcements in batches of 25 to respect D1 query parameter limits
        const chunkSize = 25;
        for (let i = 0; i < pIds.length; i += chunkSize) {
          const chunk = pIds.slice(i, i + chunkSize);
          await prisma.announcement.createMany({
            data: chunk.map((pid) => ({
              title: `🔓 ${trimmedRound} Result Submissions Reopened!`,
              content: `The League Commissioner has officially reopened result submissions for ${trimmedRound}. Any missed match penalties recorded for closed fixtures in this round have been removed. Your fixture submission and forfeit claim buttons are now unlocked on "Today's Match" until ${deadlineFormatted} (CAT / Rwandan Time).`,
              type: "INDIVIDUAL",
              targetPlayerId: pid,
              isPinned: true,
            })),
          });
        }
      } catch (announcementErr) {
        console.error("[reopen-matchday] Individual announcements error:", announcementErr);
      }
    }

    // Public broadcast notification
    try {
      await prisma.announcement.create({
        data: {
          title: `📢 ${trimmedRound} Result Submissions Reopened`,
          content: `The League Commissioner has reopened result submissions for ${trimmedRound}. Any missed match penalties recorded for closed fixtures have been removed. All participating athletes have an extended window of ${hours} hours (until ${deadlineFormatted} CAT) to play fixtures and submit screenshot proofs.`,
          type: "BROADCAST",
          isPinned: true,
        },
      });
    } catch (broadcastErr) {
      console.error("[reopen-matchday] Broadcast announcement error:", broadcastErr);
    }

    return NextResponse.json({
      success: true,
      message: `Successfully reopened result submissions for ${matchesToReopen.length} fixture(s) in ${trimmedRound}. Submissions window unlocked for ${hours} hours until ${deadlineFormatted}. Missed match counts have been removed.`,
      reopenedCount: matchesToReopen.length,
      newDeadline,
      round: trimmedRound,
    });
  } catch (err: any) {
    console.error("[reopen-matchday] Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to reopen matchday submissions." },
      { status: 500 }
    );
  }
}
