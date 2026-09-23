import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { executeSeasonTransition } from "@/lib/seasonPromotion";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const sessionUserId = cookieStore.get("efrl_session")?.value;
    if (!sessionUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: sessionUserId },
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const action = body.action || "ALL"; // "ALL" | "RELEGATE_ONLY" | "PROMOTE_ONLY" | "WIPE_FOR_NEW_SEASON"

    if (action === "WIPE_FOR_NEW_SEASON") {
      const config = await prisma.leagueConfig.findUnique({ where: { id: "default" } });
      const currentSeason = config?.season || "Season 1 (2026)";
      const seasonMatch = currentSeason.match(/\d+/);
      const nextSeasonNum = seasonMatch ? parseInt(seasonMatch[0], 10) + 1 : 2;
      const nextSeasonName = `Season ${nextSeasonNum} (2026)`;

      // 1. Archive Champions into Hall of Fame before data purge
      try {
        const div1Leader = await prisma.standing.findFirst({
          where: { division: "Division 1" },
          orderBy: [{ points: "desc" }, { goalDifference: "desc" }],
          include: { player: true },
        });
        if (div1Leader?.player) {
          await prisma.hallOfFame.create({
            data: {
              tournamentName: "EFRL Division 1 (Premiership)",
              season: currentSeason,
              championName: div1Leader.player.gamerTag,
              championRealName: div1Leader.player.fullName,
              trophyType: "GOLD",
              prizeWon: "3,000,000 RWF + Gold Trophy",
              notes: `Winner of ${currentSeason} with ${div1Leader.points} pts.`,
            },
          }).catch(() => {});
        }

        const uclFinalMatch = await prisma.match.findFirst({
          where: { division: "UCL", stage: "FINAL", status: "FINISHED" },
          include: { homePlayer: true, awayPlayer: true },
        });
        if (uclFinalMatch) {
          const homeWins = (uclFinalMatch.homeScore || 0) > (uclFinalMatch.awayScore || 0);
          const champ = homeWins ? uclFinalMatch.homePlayer : uclFinalMatch.awayPlayer;
          const runner = homeWins ? uclFinalMatch.awayPlayer : uclFinalMatch.homePlayer;
          await prisma.hallOfFame.create({
            data: {
              tournamentName: "eFootball Champions League (UCL)",
              season: currentSeason,
              championName: champ.gamerTag,
              championRealName: champ.fullName,
              runnerUp: runner.gamerTag,
              trophyType: "UCL",
              prizeWon: "1,200,000 RWF + UCL Trophy",
              notes: `UCL Champion for ${currentSeason}`,
            },
          }).catch(() => {});
        }

        const europaFinalMatch = await prisma.match.findFirst({
          where: { division: "EUROPA", stage: "FINAL", status: "FINISHED" },
          include: { homePlayer: true, awayPlayer: true },
        });
        if (europaFinalMatch) {
          const homeWins = (europaFinalMatch.homeScore || 0) > (europaFinalMatch.awayScore || 0);
          const champ = homeWins ? europaFinalMatch.homePlayer : europaFinalMatch.awayPlayer;
          const runner = homeWins ? europaFinalMatch.awayPlayer : europaFinalMatch.homePlayer;
          await prisma.hallOfFame.create({
            data: {
              tournamentName: "eFootball Europa League",
              season: currentSeason,
              championName: champ.gamerTag,
              championRealName: champ.fullName,
              runnerUp: runner.gamerTag,
              trophyType: "EUROPA",
              prizeWon: "600,000 RWF + Europa Cup",
              notes: `Europa League Champion for ${currentSeason}`,
            },
          }).catch(() => {});
        }
      } catch (err) {
        console.error("Hall of fame archive warning:", err);
      }

      // 2. Delete all season matches, submissions, forfeit claims, and slots
      await prisma.matchSubmission.deleteMany({});
      await prisma.forfeitClaim.deleteMany({});
      await prisma.motdPollVote.deleteMany({});
      await prisma.trophyPollVote.deleteMany({});
      await prisma.match.deleteMany({});
      await prisma.uclGroupSlot.deleteMany({});

      // 3. Reset all players' season stats and reset real team choices so everyone can re-draft clubs
      await prisma.player.updateMany({
        data: {
          matchesPlayed: 0,
          goals: 0,
          assists: 0,
          cleanSheets: 0,
          mvpAwards: 0,
          consecutiveMissed: 0,
          isDisqualified: false,
          status: "ACTIVE",
          realTeam: null,
          avatar: null,
        },
      });

      // 4. Delete non-domestic standings (UCL & Europa group standings)
      await prisma.standing.deleteMany({
        where: {
          NOT: { division: { in: ["Division 1", "Division 2", "Division 3"] } },
        },
      });

      // 5. Reset domestic standings points & stats to zero
      await prisma.standing.updateMany({
        data: {
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          goalDifference: 0,
          points: 0,
          rank: 1,
          form: "D",
          consecutiveMissed: 0,
          isDisqualified: false,
        },
      });

      // 6. Update LeagueConfig to new season
      await prisma.leagueConfig.upsert({
        where: { id: "default" },
        update: {
          season: nextSeasonName,
          currentMatchday: 1,
          registrationOpen: true,
          uclStarted: false,
          europaStarted: false,
          uclDrawCompleted: false,
          europaDrawCompleted: false,
          uclDrawTime: null,
          europaDrawTime: null,
        },
        create: {
          id: "default",
          season: nextSeasonName,
          currentMatchday: 1,
          registrationOpen: true,
        },
      });

      // 7. Post official broadcast announcement
      await prisma.announcement.create({
        data: {
          title: `🎉 WELCOME TO ${nextSeasonName}! New Season Registration & Draft Open`,
          content: `All matches and results from ${currentSeason} have officially concluded and been permanently archived into the Hall of Fame. The platform is now fully reset for ${nextSeasonName}! Registration is open, and all athletes can now select their real football club afresh for the new campaign.`,
          type: "BROADCAST",
          isPinned: true,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Successfully concluded ${currentSeason} and purged all seasonal data. League advanced to ${nextSeasonName}! All players reset with fresh club draft.`,
        nextSeason: nextSeasonName,
      });
    }

    const result = await executeSeasonTransition(action);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
