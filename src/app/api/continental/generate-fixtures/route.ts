import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { syncContinentalGroupMotds } from "@/lib/matchOfTheDay";

async function verifyAdmin() {
  const cookieStore = await cookies();
  const sessionUserId = cookieStore.get("efrl_session")?.value;
  if (!sessionUserId) return null;

  const user = await prisma.user.findUnique({ where: { id: sessionUserId } });
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
    const { competition = "UCL", stage = "GROUP" } = body; // "GROUP", "QUARTER_FINAL", "SEMI_FINAL", "FINAL"

    const tournament = await prisma.tournament.findFirst({
      where: { type: competition },
    });

    if (!tournament) {
      return NextResponse.json(
        { error: `${competition} tournament not found in database.` },
        { status: 404 }
      );
    }

    const now = new Date();
    const deadline24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // =========================================================================
    // 1. GENERATE GROUP STAGE FIXTURES
    // =========================================================================
    if (stage === "GROUP") {
      const slots = await prisma.uclGroupSlot.findMany({
        where: { competition },
        include: { player: true },
        orderBy: [{ groupName: "asc" }, { slotIndex: "asc" }],
      });

      if (slots.length < 16) {
        return NextResponse.json(
          {
            error: `Cannot generate group fixtures yet. Only ${slots.length}/16 players have chosen or been drawn into groups. Please complete group draws first.`,
          },
          { status: 400 }
        );
      }

      // Check for division violation (no 3 players from same division in any group)
      const groups = ["Group A", "Group B", "Group C", "Group D"];
      for (const grp of groups) {
        const groupMembers = slots.filter((s) => s.groupName === grp);
        const divCounts: Record<string, number> = {};
        for (const m of groupMembers) {
          divCounts[m.playerDivision] = (divCounts[m.playerDivision] || 0) + 1;
          if (divCounts[m.playerDivision] >= 3) {
            return NextResponse.json(
              {
                error: `Group Violation in ${grp}: Contains 3 or more athletes from ${m.playerDivision}. Regulations strictly prohibit 3 players from the same division in one group.`,
              },
              { status: 400 }
            );
          }
        }
      }

      // Delete old scheduled unplayed group matches
      await prisma.match.deleteMany({
        where: {
          tournamentId: tournament.id,
          stage: "GROUP",
          status: "SCHEDULED",
        },
      });

      // Initialize group standings
      for (const s of slots) {
        await prisma.standing.upsert({
          where: {
            tournamentId_playerId: {
              tournamentId: tournament.id,
              playerId: s.playerId,
            },
          },
          update: { division: `${competition} ${s.groupName}` },
          create: {
            tournamentId: tournament.id,
            playerId: s.playerId,
            division: `${competition} ${s.groupName}`,
            rank: 1,
            played: 0,
            won: 0,
            drawn: 0,
            lost: 0,
            goalsFor: 0,
            goalsAgainst: 0,
            goalDifference: 0,
            points: 0,
            form: "D",
          },
        });
      }

      let matchCount = 0;
      // In each group of 4 players: 3 Matchdays, 2 matches per matchday
      // Played 2 legs at the same time
      for (const grp of groups) {
        const groupSlots = slots.filter((s) => s.groupName === grp);
        const [p1, p2, p3, p4] = groupSlots;

        const roundPairings = [
          { round: "Group Stage - Matchday 1", pairs: [[p1, p2], [p3, p4]] },
          { round: "Group Stage - Matchday 2", pairs: [[p1, p3], [p2, p4]] },
          { round: "Group Stage - Matchday 3", pairs: [[p1, p4], [p2, p3]] },
        ];

        for (let rIdx = 0; rIdx < roundPairings.length; rIdx++) {
          const { round, pairs } = roundPairings[rIdx];
          const matchDate = new Date(now.getTime() + rIdx * 24 * 60 * 60 * 1000);
          const deadlineDate = new Date(matchDate.getTime() + 24 * 60 * 60 * 1000);

          for (const [home, away] of pairs) {
            await prisma.match.create({
              data: {
                tournamentId: tournament.id,
                division: competition,
                stage: "GROUP",
                groupName: grp,
                homePlayerId: home.playerId,
                awayPlayerId: away.playerId,
                round,
                platform: "eFootball Mobile",
                status: "SCHEDULED",
                matchDate: rIdx === 0 ? now : matchDate,
                deadlineDate: rIdx === 0 ? deadline24h : deadlineDate,
                notes: "2-Legged Match (Played simultaneously). Upload Leg 1 and Leg 2 screenshots with aggregate score.",
              },
            });
            matchCount++;
          }
        }
      }

      // Automatically evaluate and set Group Matches of the Day based on domestic league performance
      await syncContinentalGroupMotds(competition);

      // Announcement
      await prisma.announcement.create({
        data: {
          title: `🏆 ${competition} Group Stage Fixtures are LIVE!`,
          content: `The official Group Stage schedule for ${competition} has been generated. All fixtures are 2-legged played simultaneously. Upload both screenshot proofs and enter aggregate goals before the 24-hour cutoff.`,
          type: "BROADCAST",
          isPinned: true,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Successfully generated ${matchCount} Group Stage matches across 4 groups for ${competition}! All matches are 2 legs played simultaneously.`,
      });
    }

    // =========================================================================
    // 2. GENERATE QUARTER-FINALS (Top 2 from each group A, B, C, D)
    // =========================================================================
    if (stage === "QUARTER_FINAL") {
      const groups = ["Group A", "Group B", "Group C", "Group D"];
      const top2PerGroup: Record<string, any[]> = {};

      for (const grp of groups) {
        const standings = await prisma.standing.findMany({
          where: {
            tournamentId: tournament.id,
            division: `${competition} ${grp}`,
          },
          include: { player: true },
          orderBy: [{ points: "desc" }, { goalDifference: "desc" }, { goalsFor: "desc" }],
          take: 2,
        });

        if (standings.length < 2) {
          return NextResponse.json(
            { error: `Group ${grp} does not have at least 2 ranked athletes yet. Please complete group matches.` },
            { status: 400 }
          );
        }
        top2PerGroup[grp] = standings;
      }

      // Delete old scheduled QF matches
      await prisma.match.deleteMany({
        where: {
          tournamentId: tournament.id,
          stage: "QUARTER_FINAL",
          status: "SCHEDULED",
        },
      });

      // QF Pairings: A1 vs B2, C1 vs D2, B1 vs A2, D1 vs C2
      const qfPairings = [
        { name: "Quarter-Final 1", home: top2PerGroup["Group A"][0].player, away: top2PerGroup["Group B"][1].player },
        { name: "Quarter-Final 2", home: top2PerGroup["Group C"][0].player, away: top2PerGroup["Group D"][1].player },
        { name: "Quarter-Final 3", home: top2PerGroup["Group B"][0].player, away: top2PerGroup["Group A"][1].player },
        { name: "Quarter-Final 4", home: top2PerGroup["Group D"][0].player, away: top2PerGroup["Group C"][1].player },
      ];

      for (const qf of qfPairings) {
        await prisma.match.create({
          data: {
            tournamentId: tournament.id,
            division: competition,
            stage: "QUARTER_FINAL",
            homePlayerId: qf.home.id,
            awayPlayerId: qf.away.id,
            round: qf.name,
            platform: "eFootball Mobile",
            status: "SCHEDULED",
            matchDate: now,
            deadlineDate: deadline24h,
            notes: "Quarter-Final: 2 legs played simultaneously. Upload Leg 1 & Leg 2 screenshots. Winner on aggregate qualifies for Semi-Finals.",
          },
        });
      }

      await prisma.announcement.create({
        data: {
          title: `🔥 ${competition} Quarter-Finals are LIVE!`,
          content: `Top 2 players from each group have advanced to the Quarter-Finals! Matches are 2 legs played simultaneously with aggregate score verification. Coordinate on WhatsApp and play before the deadline.`,
          type: "BROADCAST",
          isPinned: true,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Successfully generated 4 Quarter-Final fixtures for ${competition}! Top 2 athletes from Groups A, B, C, D have been seeded.`,
      });
    }

    // =========================================================================
    // 3. GENERATE SEMI-FINALS (Winners of QF 1-4)
    // =========================================================================
    if (stage === "SEMI_FINAL") {
      const qfMatches = await prisma.match.findMany({
        where: {
          tournamentId: tournament.id,
          stage: "QUARTER_FINAL",
        },
        include: { homePlayer: true, awayPlayer: true },
        orderBy: { round: "asc" },
      });

      if (qfMatches.length < 4 || qfMatches.some((m) => m.status !== "FINISHED")) {
        return NextResponse.json(
          { error: "All 4 Quarter-Final matches must be completed and approved before generating Semi-Finals." },
          { status: 400 }
        );
      }

      // Determine QF winners based on aggregate score
      const qfWinners = qfMatches.map((m) => {
        const homeAgg = m.aggregateHomeScore ?? ((m.homeScore || 0) + (m.leg2AwayScore || 0));
        const awayAgg = m.aggregateAwayScore ?? ((m.awayScore || 0) + (m.leg2HomeScore || 0));
        return homeAgg >= awayAgg ? m.homePlayer : m.awayPlayer;
      });

      // Delete old scheduled SF matches
      await prisma.match.deleteMany({
        where: {
          tournamentId: tournament.id,
          stage: "SEMI_FINAL",
          status: "SCHEDULED",
        },
      });

      // SF 1: Winner QF1 vs Winner QF2
      // SF 2: Winner QF3 vs Winner QF4
      const sfPairings = [
        { name: "Semi-Final 1", home: qfWinners[0], away: qfWinners[1] },
        { name: "Semi-Final 2", home: qfWinners[2], away: qfWinners[3] },
      ];

      for (const sf of sfPairings) {
        await prisma.match.create({
          data: {
            tournamentId: tournament.id,
            division: competition,
            stage: "SEMI_FINAL",
            homePlayerId: sf.home.id,
            awayPlayerId: sf.away.id,
            round: sf.name,
            platform: "eFootball Mobile",
            status: "SCHEDULED",
            matchDate: now,
            deadlineDate: deadline24h,
            notes: "Semi-Final: 2 legs played simultaneously. Upload Leg 1 & Leg 2 screenshots. Winner on aggregate qualifies for the Grand Final.",
          },
        });
      }

      await prisma.announcement.create({
        data: {
          title: `⚡ ${competition} Semi-Finals are LIVE!`,
          content: `The final four has arrived! Semi-Final fixtures are now active (2 legs played simultaneously). Winners will battle in the Grand Final.`,
          type: "BROADCAST",
          isPinned: true,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Successfully generated 2 Semi-Final fixtures for ${competition}!`,
      });
    }

    // =========================================================================
    // 4. GENERATE GRAND FINAL (Winners of SF 1 & 2) - 1 Leg Single Match + Trophy Poll
    // =========================================================================
    if (stage === "FINAL") {
      const sfMatches = await prisma.match.findMany({
        where: {
          tournamentId: tournament.id,
          stage: "SEMI_FINAL",
        },
        include: { homePlayer: true, awayPlayer: true },
        orderBy: { round: "asc" },
      });

      if (sfMatches.length < 2 || sfMatches.some((m) => m.status !== "FINISHED")) {
        return NextResponse.json(
          { error: "Both Semi-Final matches must be completed and approved before generating the Grand Final." },
          { status: 400 }
        );
      }

      const sfWinners = sfMatches.map((m) => {
        const homeAgg = m.aggregateHomeScore ?? ((m.homeScore || 0) + (m.leg2AwayScore || 0));
        const awayAgg = m.aggregateAwayScore ?? ((m.awayScore || 0) + (m.leg2HomeScore || 0));
        return homeAgg >= awayAgg ? m.homePlayer : m.awayPlayer;
      });

      // Delete old scheduled Final
      await prisma.match.deleteMany({
        where: {
          tournamentId: tournament.id,
          stage: "FINAL",
          status: "SCHEDULED",
        },
      });

      const finalMatch = await prisma.match.create({
        data: {
          tournamentId: tournament.id,
          division: competition,
          stage: "FINAL",
          homePlayerId: sfWinners[0].id,
          awayPlayerId: sfWinners[1].id,
          round: "Grand Final",
          platform: "eFootball Mobile",
          status: "SCHEDULED",
          matchDate: now,
          deadlineDate: deadline24h,
          notes: "Grand Final: Single-match showdown (1 leg only). Upload full-time result screenshot. Winner lifts the trophy!",
        },
      });

      // Clear existing poll votes for fresh poll
      await prisma.trophyPollVote.deleteMany({
        where: { competition },
      });

      await prisma.announcement.create({
        data: {
          title: `🏆 THE ${competition} GRAND FINAL IS SET! VOTE IN THE TROPHY PREDICTION POLL!`,
          content: `@${sfWinners[0].gamerTag} vs @${sfWinners[1].gamerTag} in the ultimate Grand Final! Played as a single-match showdown. All players in the league are invited to vote in the Trophy Prediction Poll on who will lift the championship trophy!`,
          type: "BROADCAST",
          isPinned: true,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Grand Final created: @${sfWinners[0].gamerTag} vs @${sfWinners[1].gamerTag}! Trophy Prediction Poll is now live for all players.`,
        finalMatchId: finalMatch.id,
      });
    }

    return NextResponse.json({ error: "Invalid stage specified" }, { status: 400 });
  } catch (err: any) {
    console.error("Generate continental fixtures error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
