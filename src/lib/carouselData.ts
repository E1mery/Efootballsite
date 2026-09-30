import { prisma } from "@/lib/prisma";
import { ensureNewsTable } from "@/lib/ensureNewsTable";
import { evaluateMatchOfTheDay } from "@/lib/matchOfTheDay";
import type { CarouselSlide } from "@/components/NewsTrendingCarousel";

/**
 * Retrieves both administrator-created news articles and real-time automated system updates
 * for the homepage carousel.
 *
 * Rules:
 * 1. Admin news articles appear when:
 *    - Status = PUBLISHED
 *    - Show on Carousel = ON (true)
 *    - Publish Date <= Current Date/Time
 *    - Expiration Date > Current Date/Time
 * 2. Automated system news/updates are dynamically generated from real league events:
 *    - Real Match of the Day (Active Clash)
 *    - Real MOTD Final Result (Completed Clash)
 *    - Real In-Form Athletes (after >= 5 matches played)
 *    - Real Hall of Fame Champions
 *    - Real Season Registration Status
 */
export async function getCarouselSlides(): Promise<CarouselSlide[]> {
  try {
    await ensureNewsTable();
    const now = new Date();

    // 1. Query eligible Admin news articles from database
    const eligibleNews = await prisma.news.findMany({
      where: {
        status: "PUBLISHED",
        showOnCarousel: true,
        publishDate: { lte: now },
        expirationDate: { gt: now },
      },
      orderBy: { publishDate: "desc" },
    });

    const slides: CarouselSlide[] = eligibleNews.map((item) => ({
      id: item.id,
      type: "NEWS",
      badge: item.category.toUpperCase(),
      category: item.category,
      tabLabel: item.title,
      title: item.title,
      subtitle: item.description,
      description: item.description,
      featuredImage: item.featuredImage,
      buttonText: item.buttonText,
      buttonUrl: item.buttonUrl,
      publishDate: item.publishDate,
      expirationDate: item.expirationDate,
      data: item,
    }));

    // 2. Fetch real live system events for automated carousel updates
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
        take: 1,
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

    // Auto-update: Active Match of the Day
    if (resolvedMotd && !slides.some((s) => s.id.includes(resolvedMotd.id))) {
      const motdAny = resolvedMotd as any;
      slides.push({
        id: `motd-${resolvedMotd.id}`,
        type: "MOTD",
        badge: "MATCH OF THE DAY",
        category: "Match",
        tabLabel: "Match of the Day",
        title: `${resolvedMotd.homePlayer?.gamerTag} vs ${resolvedMotd.awayPlayer?.gamerTag}`,
        subtitle: motdAny.motdHeadline || `${resolvedMotd.division} • ${resolvedMotd.round}`,
        description: `Featured clash in ${resolvedMotd.division} (${resolvedMotd.round}). Coordinate in WhatsApp room before midnight.`,
        featuredImage: resolvedMotd.homePlayer?.avatar || resolvedMotd.awayPlayer?.avatar || "/images/carousel-stadium-bg.jpg",
        buttonText: "Match Center",
        buttonUrl: `/fixtures?highlight=${resolvedMotd.id}`,
        data: resolvedMotd,
      });
    }

    // Auto-update: MOTD Concluded Result
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
        category: "Match",
        tabLabel: "MOTD Result",
        title: `${latestResult.homePlayer?.gamerTag} ${homeScore} - ${awayScore} ${latestResult.awayPlayer?.gamerTag}`,
        subtitle: `${latestResult.division} • ${latestResult.round} • Winner: ${winner}`,
        description: `Match of the Day concluded. Official scores and statistics applied to standings.`,
        featuredImage: latestResult.homePlayer?.avatar || "/images/carousel-stadium-bg.jpg",
        buttonText: "Fixture Archive",
        buttonUrl: "/fixtures",
        data: latestResult,
      });
    }

    // Auto-update: In-Form Athletes (Only after at least 5 matches played)
    const maxPlayed = maxPlayedStanding?.played || 0;
    if (maxPlayed >= 5) {
      const topInFormStandings = await prisma.standing.findMany({
        where: { played: { gte: 5 } },
        include: { player: true },
        orderBy: [{ points: "desc" }, { won: "desc" }, { goalDifference: "desc" }],
        take: 4,
      });

      if (topInFormStandings.length > 0) {
        const athletes = topInFormStandings.map((s) => ({
          gamerTag: s.player.gamerTag,
          division: s.division,
          realTeam: s.player.realTeam,
          rank: s.rank,
          played: s.played,
          won: s.won,
          points: s.points,
          winRate: s.played > 0 ? Math.round((s.won / s.played) * 100) : 0,
          form: s.form || "W",
          goals: s.player.goals,
          avatar: s.player.avatar,
        }));

        slides.push({
          id: "in-form-athletes-slide",
          type: "IN_FORM",
          badge: "IN-FORM ATHLETES",
          category: "League News",
          tabLabel: "In-Form Players",
          title: "Form Leaders • Min 5 Matches Played",
          subtitle: "Top-ranked contenders based on table standings & winning rate",
          description: "Top-ranked contenders evaluated from official table standings, win rate & individual form.",
          featuredImage: "/images/carousel-stadium-bg.jpg",
          buttonText: "Full Standings",
          buttonUrl: "/standings",
          data: { athletes },
        });
      }
    }

    // Auto-update: Hall of Fame Champions (if records exist in DB)
    if (hallOfFameEntries.length > 0) {
      slides.push({
        id: "hall-of-fame-slide",
        type: "HALL_OF_FAME",
        badge: "HALL OF FAME",
        category: "Competition",
        tabLabel: "Reigning Champions",
        title: "Title Winners • Last Season Champions",
        subtitle: "Athletes who conquered Rwanda's official eFootball championships",
        description: "Official title winners from previous seasons immortalized in the league registry.",
        featuredImage: "/images/carousel-stadium-bg.jpg",
        buttonText: "Explore Hall of Fame",
        buttonUrl: "/#hall-of-fame",
        data: { champions: hallOfFameEntries },
      });
    }

    // Auto-update: Season Registration (if active and not already covered)
    if (leagueConfig.registrationOpen && !slides.some((s) => s.category === "Registration")) {
      slides.push({
        id: "season-registration-slide",
        type: "REGISTRATION",
        badge: "SEASON ENROLLMENT",
        category: "Registration",
        tabLabel: "Season Registration",
        title: `${leagueConfig.season} Official Registration Open`,
        subtitle: "Division 1, Division 2, Division 3 • WhatsApp Room Match Scheduling",
        description: "Athletes compete across Division 1, Division 2, and Division 3 in daily 24-hour matchday cycles with direct WhatsApp matchmaking.",
        featuredImage: "/images/carousel-stadium-bg.jpg",
        buttonText: "Register Athlete",
        buttonUrl: "/register",
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
