import { prisma } from "@/lib/prisma";
import { evaluateMatchOfTheDay } from "@/lib/matchOfTheDay";
import type { CarouselSlide } from "@/components/NewsTrendingCarousel";

export async function getCarouselSlides(): Promise<CarouselSlide[]> {
  try {
    const [
      leagueConfig,
      motdActiveMatch,
      motdRecentResults,
      allStandings,
      hallOfFameEntries,
      maxPlayedStanding,
    ] = await Promise.all([
      prisma.leagueConfig.upsert({
        where: { id: "default" },
        update: {},
        create: {
          id: "default",
          season: "Season 1 (2026)",
          registrationOpen: true,
          currentMatchday: 1,
        },
      }),
      prisma.match.findFirst({
        where: {
          isMatchOfTheDay: true,
          status: { in: ["SCHEDULED", "LIVE"] },
        },
        include: {
          homePlayer: true,
          awayPlayer: true,
        },
      }),
      prisma.match.findMany({
        where: {
          isMatchOfTheDay: true,
          status: "FINISHED",
        },
        include: {
          homePlayer: true,
          awayPlayer: true,
        },
        orderBy: [{ matchDate: "desc" }],
        take: 2,
      }),
      prisma.standing.findMany({
        orderBy: [{ points: "desc" }, { goalDifference: "desc" }],
      }),
      prisma.hallOfFame.findMany({
        orderBy: [{ season: "desc" }, { createdAt: "desc" }],
        take: 3,
      }),
      prisma.standing.findFirst({
        orderBy: { played: "desc" },
      }),
    ]);

    // Check Match of the Day (MOTD)
    let resolvedMotd = motdActiveMatch;
    const currentRoundNum = leagueConfig.currentMatchday || 1;

    if (!resolvedMotd && currentRoundNum > 1) {
      const roundMatches = await prisma.match.findMany({
        where: { round: `Matchday ${currentRoundNum}` },
        include: { homePlayer: true, awayPlayer: true },
      });
      resolvedMotd = evaluateMatchOfTheDay(roundMatches, allStandings, currentRoundNum);
    }

    const slides: CarouselSlide[] = [];

    // =========================================================================
    // 1. MATCH OF THE DAY (Active Showdown)
    // =========================================================================
    if (resolvedMotd) {
      const motdAny = resolvedMotd as any;
      slides.push({
        id: `motd-${resolvedMotd.id}`,
        type: "MOTD",
        badge: "MATCH OF THE DAY",
        tabLabel: "Match of the Day",
        title: `${resolvedMotd.homePlayer?.gamerTag} vs ${resolvedMotd.awayPlayer?.gamerTag}`,
        subtitle: motdAny.motdHeadline || `${resolvedMotd.division} • ${resolvedMotd.round}`,
        data: resolvedMotd,
      });
    }

    // =========================================================================
    // 2. MOTD RESULTS (Completed Matches of the Day)
    // =========================================================================
    if (motdRecentResults.length > 0) {
      const latestResult = motdRecentResults[0];
      const homeScore = latestResult.homeScore ?? 0;
      const awayScore = latestResult.awayScore ?? 0;
      const winner =
        homeScore > awayScore
          ? latestResult.homePlayer?.gamerTag
          : awayScore > homeScore
          ? latestResult.awayPlayer?.gamerTag
          : "Stalemate Draw";

      slides.push({
        id: `motd-result-${latestResult.id}`,
        type: "MOTD_RESULT",
        badge: "MOTD FINAL RESULT",
        tabLabel: "MOTD Result",
        title: `${latestResult.homePlayer?.gamerTag} ${homeScore} - ${awayScore} ${latestResult.awayPlayer?.gamerTag}`,
        subtitle: `${latestResult.division} • ${latestResult.round} • Winner: ${winner}`,
        data: latestResult,
      });
    }

    // =========================================================================
    // 3. PLAYERS WHO ARE IN FORM (Only after at least 5 matches have been played)
    // Rule: "NB: it must be displayed when the league starts like after five matches"
    // =========================================================================
    const maxPlayed = maxPlayedStanding?.played || 0;
    if (maxPlayed >= 5) {
      const topInFormStandings = await prisma.standing.findMany({
        where: { played: { gte: 5 } },
        include: { player: true },
        orderBy: [{ points: "desc" }, { won: "desc" }, { goalDifference: "desc" }],
        take: 4,
      });

      if (topInFormStandings.length > 0) {
        const athletes = topInFormStandings.map((s) => {
          const winRate = s.played > 0 ? Math.round((s.won / s.played) * 100) : 0;
          return {
            gamerTag: s.player.gamerTag,
            division: s.division,
            realTeam: s.player.realTeam,
            rank: s.rank,
            played: s.played,
            won: s.won,
            points: s.points,
            winRate,
            form: s.form || "W",
            goals: s.player.goals,
            avatar: s.player.avatar,
          };
        });

        slides.push({
          id: "in-form-athletes-slide",
          type: "IN_FORM",
          badge: "IN-FORM ATHLETES",
          tabLabel: "In-Form Players",
          title: "Form Leaders • Min 5 Matches Played",
          subtitle: "Top-ranked contenders based on table standings & winning rate",
          data: {
            athletes,
          },
        });
      }
    }

    // =========================================================================
    // 4. THE HALL OF FAME (Players who won titles last season)
    // =========================================================================
    if (hallOfFameEntries.length > 0) {
      slides.push({
        id: "hall-of-fame-slide",
        type: "HALL_OF_FAME",
        badge: "HALL OF FAME",
        tabLabel: "Reigning Champions",
        title: "Title Winners • Last Season Champions",
        subtitle: "Athletes who conquered Rwanda's official eFootball championships",
        data: {
          champions: hallOfFameEntries,
        },
      });
    }

    // =========================================================================
    // 5. SEASON REGISTRATION (Active season enrollment)
    // =========================================================================
    if (leagueConfig.registrationOpen) {
      slides.push({
        id: "season-registration-slide",
        type: "REGISTRATION",
        badge: "SEASON ENROLLMENT",
        tabLabel: "Season Registration",
        title: `${leagueConfig.season} Official Registration Open`,
        subtitle: "Division 1, Division 2, Division 3 • WhatsApp Room Match Scheduling",
        data: {
          seasonName: leagueConfig.season,
          currentMatchday: leagueConfig.currentMatchday || 1,
        },
      });
    }

    return slides;
  } catch (error) {
    console.error("[getCarouselSlides] Error assembling carousel data:", error);
    return [];
  }
}
