import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { recalculateStandings } from "@/lib/recalculateStandings";
import { notifyStandingsUpdate } from "@/lib/notifyStandingsUpdate";
import { invalidateHallOfFameCache } from "@/lib/hallOfFameStatsService";

async function verifyAdmin() {
  const cookieStore = await cookies();
  const sessionUserId = cookieStore.get("efrl_session")?.value;
  if (!sessionUserId) return null;

  const user = await prisma.user.findUnique({ where: { id: sessionUserId } });
  if (!user || user.role !== "ADMIN") return null;
  return user;
}

// GET: Query unplayed / on-hold fixtures for a disqualified player
export async function GET(req: Request) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized: Admin access required." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const playerId = searchParams.get("playerId");
    const matchId = searchParams.get("matchId");

    if (matchId) {
      const match = await prisma.match.findUnique({
        where: { id: matchId },
        include: {
          homePlayer: true,
          awayPlayer: true,
          tournament: true,
        },
      });

      if (!match) {
        return NextResponse.json({ error: "Match not found." }, { status: 404 });
      }

      const homeDisq = match.homePlayer?.isDisqualified || (match.homePlayer?.consecutiveMissed ?? 0) >= 3;
      const awayDisq = match.awayPlayer?.isDisqualified || (match.awayPlayer?.consecutiveMissed ?? 0) >= 3;

      const disqualifiedPlayer = homeDisq ? match.homePlayer : awayDisq ? match.awayPlayer : null;
      const opponent = homeDisq ? match.awayPlayer : awayDisq ? match.homePlayer : null;

      return NextResponse.json({
        match,
        isDisqualifiedMatch: Boolean(homeDisq || awayDisq || match.notes?.includes("WAITING_FOR_SUB")),
        disqualifiedPlayer,
        opponent,
      });
    }

    if (playerId) {
      const player = await prisma.player.findUnique({
        where: { id: playerId },
      });

      if (!player) {
        return NextResponse.json({ error: "Athlete not found." }, { status: 404 });
      }

      const isDisqualified = player.isDisqualified || player.consecutiveMissed >= 3;

      // Find all scheduled/unplayed matches or matches waiting for sub
      const candidateMatches = await prisma.match.findMany({
        where: {
          OR: [{ homePlayerId: playerId }, { awayPlayerId: playerId }],
          AND: [
            {
              OR: [
                { status: "SCHEDULED" },
                { notes: { contains: "WAITING_FOR_SUB" } },
              ],
            },
            {
              status: { notIn: ["FORFEIT"] },
            },
          ],
        },
        include: {
          homePlayer: true,
          awayPlayer: true,
          tournament: true,
        },
        orderBy: [{ round: "asc" }, { matchDate: "asc" }],
      });

      const formattedFixtures = candidateMatches.map((m) => {
        const opponent = m.homePlayerId === playerId ? m.awayPlayer : m.homePlayer;
        return {
          id: m.id,
          round: m.round,
          division: m.division,
          stage: m.stage,
          groupName: m.groupName,
          status: m.status,
          notes: m.notes,
          deadlineDate: m.deadlineDate,
          opponent: opponent
            ? {
                id: opponent.id,
                gamerTag: opponent.gamerTag,
                fullName: opponent.fullName,
                realTeam: opponent.realTeam,
                avatar: opponent.avatar,
              }
            : null,
        };
      });

      return NextResponse.json({
        player: {
          id: player.id,
          gamerTag: player.gamerTag,
          fullName: player.fullName,
          division: player.division,
          consecutiveMissed: player.consecutiveMissed,
          isDisqualified,
          status: player.status,
        },
        eligibleMatchesCount: formattedFixtures.length,
        fixtures: formattedFixtures,
      });
    }

    return NextResponse.json({ error: "playerId or matchId parameter is required." }, { status: 400 });
  } catch (err: any) {
    console.error("[disqualified-walkover GET] Error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

// POST: Award 3-0 walkover to opponent(s) when there is no replacement for a disqualified athlete
export async function POST(req: Request) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized: Admin access required." }, { status: 403 });
    }

    const body = await req.json();
    const { matchId, playerId, adminNotes } = body;

    if (!matchId && !playerId) {
      return NextResponse.json(
        { error: "Either matchId or playerId is required to award a walkover." },
        { status: 400 }
      );
    }

    // Single Match Walkover
    if (matchId) {
      const match = await prisma.match.findUnique({
        where: { id: matchId },
        include: {
          homePlayer: true,
          awayPlayer: true,
          tournament: true,
        },
      });

      if (!match) {
        return NextResponse.json({ error: "Match not found." }, { status: 404 });
      }

      if (match.tournament?.season) {
        const isArchived = await prisma.archivedSeason.findUnique({
          where: { seasonName: match.tournament.season },
        });
        if (isArchived) {
          return NextResponse.json(
            { error: "This season is officially archived and read-only." },
            { status: 403 }
          );
        }
      }

      const homeDisq = match.homePlayer?.isDisqualified || (match.homePlayer?.consecutiveMissed ?? 0) >= 3;
      const awayDisq = match.awayPlayer?.isDisqualified || (match.awayPlayer?.consecutiveMissed ?? 0) >= 3;

      if (!homeDisq && !awayDisq && !match.notes?.includes("WAITING_FOR_SUB")) {
        return NextResponse.json(
          {
            error:
              "Neither athlete is disqualified (neither has reached 3 missed matches). 3-point walkovers under this rule require a disqualified opponent.",
          },
          { status: 400 }
        );
      }

      const disqualifiedPlayer = homeDisq ? match.homePlayer : match.awayPlayer;
      const opponent = homeDisq ? match.awayPlayer : match.homePlayer;

      const isOpponentHome = match.homePlayerId === opponent.id;
      const homeScore = isOpponentHome ? 3 : 0;
      const awayScore = isOpponentHome ? 0 : 3;

      const defaultNotes = `3-0 Walkover awarded to @${opponent.gamerTag}. Opponent @${disqualifiedPlayer.gamerTag} was disqualified (3 missed matches, no replacement available).`;
      const walkoverNotes = adminNotes ? `${defaultNotes} [Admin: ${adminNotes}]` : defaultNotes;

      // Update the match record
      const updatedMatch = await prisma.match.update({
        where: { id: match.id },
        data: {
          homeScore,
          awayScore,
          status: "FORFEIT",
          allowLateSubmission: false,
          notes: walkoverNotes,
        },
      });

      // Create / Record an approved ForfeitClaim for record tracking and history
      await prisma.forfeitClaim.create({
        data: {
          matchId: match.id,
          claimantPlayerId: opponent.id,
          accusedPlayerId: disqualifiedPlayer.id,
          proofScreenshotUrl: match.screenshotUrl || "/logo.png",
          reason: "Administrative Walkover: Opponent disqualified due to 3 missed matches with no replacement athlete available.",
          status: "APPROVED",
          adminNotes: adminNotes || "3-0 Walkover awarded by League Administrator (Disqualification - No Replacement)",
        },
      });

      // Auto-resolve any existing pending submissions / forfeit claims for this match
      await prisma.matchSubmission.updateMany({
        where: { matchId: match.id, status: "PENDING" },
        data: { status: "REJECTED", adminNotes: "Closed: 3-0 Walkover awarded due to opponent disqualification" },
      }).catch(() => {});

      await prisma.forfeitClaim.updateMany({
        where: { matchId: match.id, status: "PENDING" },
        data: { status: "REJECTED", adminNotes: "Superseded: 3-0 Walkover officially awarded by Administrator" },
      }).catch(() => {});

      // Reset the winning opponent's consecutive missed streak (they fulfilled their obligations)
      await prisma.player.update({
        where: { id: opponent.id },
        data: { consecutiveMissed: 0 },
      });
      await prisma.standing.updateMany({
        where: { playerId: opponent.id },
        data: { consecutiveMissed: 0 },
      });

      // Recalculate standings for this division
      const divToRecalc =
        updatedMatch.stage === "GROUP" && updatedMatch.groupName
          ? `${updatedMatch.division} ${updatedMatch.groupName}`
          : updatedMatch.division;

      await recalculateStandings(updatedMatch.tournamentId, divToRecalc);
      await invalidateHallOfFameCache().catch(() => {});

      // Notify standings update
      await notifyStandingsUpdate({
        tournamentType: updatedMatch.division,
        competitionName: updatedMatch.division,
        groupName: updatedMatch.groupName,
        matchSummary: `3-0 Walkover awarded to ${opponent.gamerTag} vs ${disqualifiedPlayer.gamerTag}`,
      }).catch(() => {});

      // Send individual notification to the winning opponent
      await prisma.announcement.create({
        data: {
          title: `🏆 3-Point Walkover Awarded (${match.round})`,
          content: `Hello @${opponent.gamerTag}. You have been officially awarded a 3-0 walkover victory (3 points) for your ${match.round} fixture against @${disqualifiedPlayer.gamerTag} as they were disqualified due to 3 missed matches and no replacement athlete is currently available. Your league standings have been updated accordingly.`,
          type: "INDIVIDUAL",
          targetPlayerId: opponent.id,
          isPinned: true,
        },
      }).catch(() => {});

      // Send individual notification to the disqualified athlete
      await prisma.announcement.create({
        data: {
          title: `📋 Match Forfeited: Walkover Awarded (${match.round})`,
          content: `Your scheduled fixture for ${match.round} against @${opponent.gamerTag} has been recorded as an official 3-0 forfeit walkover in favor of your opponent due to your disqualification (3 missed matches) without an available replacement athlete.`,
          type: "INDIVIDUAL",
          targetPlayerId: disqualifiedPlayer.id,
          isPinned: true,
        },
      }).catch(() => {});

      // Sync verified forfeit result to social feed
      try {
        const { syncSocialResultForMatch } = await import("@/lib/socialResultSync");
        await syncSocialResultForMatch(updatedMatch.id, "FINISHED");
      } catch (socialErr) {
        console.error("[disqualified-walkover] Error syncing social result:", socialErr);
      }

      return NextResponse.json({
        success: true,
        message: `3-0 Walkover (3 points) successfully awarded to @${opponent.gamerTag} for ${match.round}.`,
        match: updatedMatch,
      });
    }

    // Bulk Walkover for all unplayed fixtures of a disqualified player
    if (playerId) {
      const targetPlayer = await prisma.player.findUnique({
        where: { id: playerId },
      });

      if (!targetPlayer) {
        return NextResponse.json({ error: "Athlete not found." }, { status: 404 });
      }

      const isDisq = targetPlayer.isDisqualified || targetPlayer.consecutiveMissed >= 3;
      if (!isDisq) {
        return NextResponse.json(
          {
            error:
              "Athlete has not reached 3 missed matches and is not disqualified. Walkovers under this rule require a disqualified athlete.",
          },
          { status: 400 }
        );
      }

      // Find all scheduled/on-hold fixtures for this player
      const matchesToForfeit = await prisma.match.findMany({
        where: {
          OR: [{ homePlayerId: playerId }, { awayPlayerId: playerId }],
          AND: [
            {
              OR: [
                { status: "SCHEDULED" },
                { notes: { contains: "WAITING_FOR_SUB" } },
              ],
            },
            {
              status: { notIn: ["FORFEIT"] },
            },
          ],
        },
        include: {
          homePlayer: true,
          awayPlayer: true,
          tournament: true,
        },
      });

      if (matchesToForfeit.length === 0) {
        return NextResponse.json({
          success: false,
          message: `No unplayed or on-hold fixtures found for @${targetPlayer.gamerTag}.`,
          count: 0,
        });
      }

      const affectedDivisions = new Map<string, { tournamentId: string; division: string; groupName?: string | null }>();
      const awardedOpponentTags: string[] = [];

      for (const m of matchesToForfeit) {
        const opponent = m.homePlayerId === playerId ? m.awayPlayer : m.homePlayer;
        if (!opponent) continue;

        const isOpponentHome = m.homePlayerId === opponent.id;
        const homeScore = isOpponentHome ? 3 : 0;
        const awayScore = isOpponentHome ? 0 : 3;

        const defaultNotes = `3-0 Walkover awarded to @${opponent.gamerTag}. Opponent @${targetPlayer.gamerTag} was disqualified (3 missed matches, no replacement available).`;
        const walkoverNotes = adminNotes ? `${defaultNotes} [Admin: ${adminNotes}]` : defaultNotes;

        await prisma.match.update({
          where: { id: m.id },
          data: {
            homeScore,
            awayScore,
            status: "FORFEIT",
            allowLateSubmission: false,
            notes: walkoverNotes,
          },
        });

        // Record approved ForfeitClaim
        await prisma.forfeitClaim.create({
          data: {
            matchId: m.id,
            claimantPlayerId: opponent.id,
            accusedPlayerId: targetPlayer.id,
            proofScreenshotUrl: m.screenshotUrl || "/logo.png",
            reason: "Administrative Walkover: Opponent disqualified due to 3 missed matches with no replacement athlete available.",
            status: "APPROVED",
            adminNotes: adminNotes || "3-0 Walkover awarded by League Administrator (Disqualification - No Replacement)",
          },
        });

        // Close pending submissions/claims
        await prisma.matchSubmission.updateMany({
          where: { matchId: m.id, status: "PENDING" },
          data: { status: "REJECTED", adminNotes: "Closed: 3-0 Walkover awarded due to opponent disqualification" },
        }).catch(() => {});

        await prisma.forfeitClaim.updateMany({
          where: { matchId: m.id, status: "PENDING" },
          data: { status: "REJECTED", adminNotes: "Superseded: 3-0 Walkover officially awarded by Administrator" },
        }).catch(() => {});

        // Reset opponent consecutive missed streak
        await prisma.player.update({
          where: { id: opponent.id },
          data: { consecutiveMissed: 0 },
        });
        await prisma.standing.updateMany({
          where: { playerId: opponent.id },
          data: { consecutiveMissed: 0 },
        });

        // Notify opponent
        await prisma.announcement.create({
          data: {
            title: `🏆 3-Point Walkover Awarded (${m.round})`,
            content: `Hello @${opponent.gamerTag}. You have been officially awarded a 3-0 walkover victory (3 points) for your ${m.round} fixture against @${targetPlayer.gamerTag} as they were disqualified due to 3 missed matches and no replacement athlete is currently available. Your league standings have been updated accordingly.`,
            type: "INDIVIDUAL",
            targetPlayerId: opponent.id,
            isPinned: true,
          },
        }).catch(() => {});

        awardedOpponentTags.push(`@${opponent.gamerTag} (${m.round})`);

        const divToRecalc =
          m.stage === "GROUP" && m.groupName ? `${m.division} ${m.groupName}` : m.division;
        const key = `${m.tournamentId}__${divToRecalc}`;
        if (!affectedDivisions.has(key)) {
          affectedDivisions.set(key, {
            tournamentId: m.tournamentId,
            division: divToRecalc,
            groupName: m.groupName,
          });
        }
      }

      // Notify the disqualified athlete
      await prisma.announcement.create({
        data: {
          title: `📋 Fixtures Forfeited: Walkovers Awarded`,
          content: `All your scheduled fixtures (${matchesToForfeit.length} match(es)) have been officially recorded as 3-0 forfeit walkovers in favor of your opponents due to disqualification (3 missed matches) without an available replacement athlete.`,
          type: "INDIVIDUAL",
          targetPlayerId: targetPlayer.id,
          isPinned: true,
        },
      }).catch(() => {});

      // Recalculate standings for all affected divisions
      for (const { tournamentId, division, groupName } of affectedDivisions.values()) {
        await recalculateStandings(tournamentId, division);
        await notifyStandingsUpdate({
          tournamentType: division,
          competitionName: division,
          groupName,
          matchSummary: `3-0 Walkovers awarded against ${targetPlayer.gamerTag}`,
        }).catch(() => {});
      }

      await invalidateHallOfFameCache().catch(() => {});

      return NextResponse.json({
        success: true,
        count: matchesToForfeit.length,
        awardedOpponents: awardedOpponentTags,
        message: `Successfully awarded 3-point walkovers for ${matchesToForfeit.length} fixture(s) against @${targetPlayer.gamerTag}.`,
      });
    }

    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  } catch (err: any) {
    console.error("[disqualified-walkover POST] Error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
