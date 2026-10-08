import { prisma } from "@/lib/prisma";
import { ensureNewsTable } from "@/lib/ensureNewsTable";
import { syncSystemNewsToCarousel } from "@/lib/systemNewsService";
import {
  formatRwandanDate,
  formatRwandanTime,
  formatRwandanDateTime,
} from "@/lib/rwandanTime";
import type { CarouselSlide } from "@/components/NewsTrendingCarousel";

/**
 * Retrieves all administrator-created news articles and synchronized system updates
 * for the homepage carousel.
 *
 * Strict Rules:
 * 1. All news displayed on the carousel is synchronized with the database (News table)
 *    so that administrators can manage them (edit, change schedule, toggle carousel, or delete).
 * 2. When Europa or UCL schedule time resets, or competitions are locked, any corresponding
 *    draw/advance news on the carousel is removed immediately.
 * 3. UCL news cannot be published on the carousel when UCL is locked (!leagueConfig.uclStarted).
 * 4. Europa news cannot be published on the carousel when Europa is locked (!leagueConfig.europaStarted).
 * 5. League standings and tournament reset announcements are strictly barred from carousel publication.
 */

/**
 * Strict safeguard: League standings and tournament reset announcements must NOT be published on the carousel.
 */
function isStandingsResetAnnouncement(item: {
  title?: string;
  subtitle?: string;
  description?: string;
  content?: string;
}): boolean {
  const combined = `${item.title || ""} ${item.subtitle || ""} ${item.description || ""} ${item.content || ""}`.toLowerCase();
  return (
    combined.includes("standings reset") ||
    combined.includes("reset standings") ||
    combined.includes("schedule & standings reset") ||
    combined.includes("standings & schedule reset") ||
    (combined.includes("reset") && combined.includes("standings")) ||
    (combined.includes("reset") && combined.includes("tournament")) ||
    (combined.includes("reset") && combined.includes("matchday 1 clean state")) ||
    (combined.includes("reset") && combined.includes("clean state"))
  );
}

export async function getCarouselSlides(): Promise<CarouselSlide[]> {
  try {
    await ensureNewsTable();
    // 1. Ensure system announcements and live updates are synchronized in database
    await syncSystemNewsToCarousel();

    const now = new Date();

    // 2. Fetch live league state to enforce lock & reset constraints
    const [
      leagueConfig,
      earliestDivMatch,
      uclGroupSlotsCount,
      europaSlotsCount,
      uclKnockoutMatches,
      europaKnockoutMatches,
      motdMatch,
      latestFinishedMatch,
      maxPlayedStanding,
      hallOfFameEntries,
      topInFormStandings,
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
        where: { division: { in: ["Division 1", "Division 2", "Division 3"] } },
        orderBy: [{ matchDate: "asc" }],
        include: { tournament: true },
      }),
      prisma.uclGroupSlot.count({ where: { competition: "UCL" } }),
      prisma.uclGroupSlot.count({ where: { competition: "EUROPA" } }),
      prisma.match.findMany({
        where: {
          division: "UCL",
          stage: { in: ["QUARTER_FINAL", "SEMI_FINAL", "FINAL"] },
        },
        include: { homePlayer: true, awayPlayer: true },
        orderBy: [{ matchDate: "desc" }],
        take: 4,
      }),
      prisma.match.findMany({
        where: {
          division: "EUROPA",
          stage: { in: ["QUARTER_FINAL", "SEMI_FINAL", "FINAL"] },
        },
        include: { homePlayer: true, awayPlayer: true },
        orderBy: [{ matchDate: "desc" }],
        take: 4,
      }),
      prisma.match.findFirst({
        where: { isMatchOfTheDay: true, status: { in: ["SCHEDULED", "LIVE"] } },
        include: { homePlayer: true, awayPlayer: true },
      }),
      prisma.match.findFirst({
        where: { isMatchOfTheDay: true, status: "FINISHED" },
        include: { homePlayer: true, awayPlayer: true },
        orderBy: { matchDate: "desc" },
      }),
      prisma.standing.findFirst({
        orderBy: { played: "desc" },
      }),
      prisma.hallOfFame.findMany({
        orderBy: [{ season: "desc" }, { createdAt: "desc" }],
        take: 3,
      }),
      prisma.standing.findMany({
        where: { played: { gte: 5 } },
        include: { player: true },
        orderBy: [{ points: "desc" }, { won: "desc" }, { goalDifference: "desc" }],
        take: 4,
      }),
    ]);

    // 3. Query all eligible news articles and system announcements from database
    const eligibleNews = await prisma.news.findMany({
      where: {
        status: "PUBLISHED",
        showOnCarousel: true,
        publishDate: { lte: now },
        expirationDate: { gt: now },
      },
      orderBy: { publishDate: "desc" },
    });

    // 4. Competition Lock and Draw Reset conditions
    const hasUclScheduled = Boolean(leagueConfig.uclStarted && leagueConfig.uclDrawTime && !leagueConfig.uclDrawCompleted);
    const hasEuropaScheduled = Boolean(leagueConfig.europaStarted && leagueConfig.europaDrawTime && !leagueConfig.europaDrawCompleted);
    const hasAnyScheduledDraw = hasUclScheduled || hasEuropaScheduled;

    const isUclDrawDone = Boolean(leagueConfig.uclStarted && (leagueConfig.uclDrawCompleted || uclGroupSlotsCount >= 16));
    const isEuropaDrawDone = Boolean(leagueConfig.europaStarted && (leagueConfig.europaDrawCompleted || europaSlotsCount >= 16));
    const hasDrawResults = isUclDrawDone || isEuropaDrawDone;

    const getKnockoutStage = (matches: any[]) => {
      if (matches.some((m) => m.stage === "FINAL")) return "FINAL";
      if (matches.some((m) => m.stage === "SEMI_FINAL")) return "SEMI_FINAL";
      if (matches.some((m) => m.stage === "QUARTER_FINAL")) return "QUARTER_FINAL";
      return null;
    };
    const uclKnockoutStage = getKnockoutStage(uclKnockoutMatches);
    const europaKnockoutStage = getKnockoutStage(europaKnockoutMatches);
    const bothUnlocked = Boolean(leagueConfig.uclStarted && leagueConfig.europaStarted);
    const hasContinentalAdvance = Boolean(bothUnlocked && uclKnockoutStage && europaKnockoutStage);

    const kickoffDate = earliestDivMatch?.tournament?.startDate || earliestDivMatch?.matchDate;
    const formattedKickoffDate = kickoffDate
      ? formatRwandanDate(kickoffDate, {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : null;
    const formattedKickoffTime = kickoffDate ? formatRwandanTime(kickoffDate) : null;
    const formattedKickoffFull = formattedKickoffDate && formattedKickoffTime
      ? `${formattedKickoffDate} at ${formattedKickoffTime} (CAT)`
      : null;

    const uclTimeStr = leagueConfig.uclDrawTime ? formatRwandanDateTime(leagueConfig.uclDrawTime) : null;
    const europaTimeStr = leagueConfig.europaDrawTime ? formatRwandanDateTime(leagueConfig.europaDrawTime) : null;

    const stageLabelMap: Record<string, string> = {
      QUARTER_FINAL: "Quarter-Finals",
      SEMI_FINAL: "Semi-Finals",
      FINAL: "Grand Final",
    };
    const uclStageLabel = uclKnockoutStage ? (stageLabelMap[uclKnockoutStage] || uclKnockoutStage) : "";
    const europaStageLabel = europaKnockoutStage ? (stageLabelMap[europaKnockoutStage] || europaKnockoutStage) : "";
    const sameStage = Boolean(uclKnockoutStage && europaKnockoutStage && uclKnockoutStage === europaKnockoutStage);

    // 5. Filter news based on standings reset & lock/reset rules
    const filteredEligibleNews = eligibleNews.filter((item) => {
      // Rule 1: No standings reset announcements
      if (isStandingsResetAnnouncement(item)) return false;

      const titleLower = item.title.toLowerCase();
      const descLower = item.description.toLowerCase();
      const isUclItem = titleLower.includes("champions league") || titleLower.includes("ucl") || descLower.includes("champions league");
      const isEuropaItem = titleLower.includes("europa league") || titleLower.includes("europa") || descLower.includes("europa league");

      // Rule 2: UCL locked -> No UCL news
      if (!leagueConfig.uclStarted) {
        if (isUclItem && !isEuropaItem) return false;
      }

      // Rule 3: Europa locked -> No Europa news
      if (!leagueConfig.europaStarted) {
        if (isEuropaItem && !isUclItem) return false;
      }

      // Rule 4: Scheduled draw slide requires active scheduled draw time and unlocked competition
      if (item.id === "sys-announcement-draw-scheduled") {
        if (!hasAnyScheduledDraw) return false;
      }

      // Rule 5: Draw results slide requires unlocked competition and completed draw
      if (item.id === "sys-announcement-draw-results") {
        if (!hasDrawResults) return false;
      }

      // Rule 6: Both advance slide requires BOTH unlocked and advanced
      if (item.id === "sys-announcement-both-advance") {
        if (!hasContinentalAdvance) return false;
      }

      // Rule 7: If UCL draw time is null, reject any item specifically about UCL draw
      if (!leagueConfig.uclDrawTime && titleLower.includes("champions league") && titleLower.includes("draw") && !titleLower.includes("result")) {
        return false;
      }

      // Rule 8: If Europa draw time is null, reject any item specifically about Europa draw
      if (!leagueConfig.europaDrawTime && titleLower.includes("europa") && titleLower.includes("draw") && !titleLower.includes("result")) {
        return false;
      }

      return true;
    });

    // Helper to select the accurate stadium background for carousel slides (Europa vs UCL vs League)
    const resolveSlideFeaturedImage = (item: any) => {
      const explicit = item.featuredImage?.trim();
      const text = `${item.title || ""} ${item.description || ""} ${item.subtitle || ""} ${item.category || ""} ${item.id || ""}`.toLowerCase();
      const isEuropa = text.includes("europa");
      const isUcl = !isEuropa && (text.includes("ucl") || text.includes("champions league"));

      if (isEuropa) {
        if (!explicit || explicit === "/images/carousel-stadium-bg.jpg" || explicit === "/images/ucl-stadium-bg.jpg") {
          return "/images/europa-stadium-bg.jpg";
        }
        return explicit;
      }

      if (isUcl) {
        if (!explicit || explicit === "/images/carousel-stadium-bg.jpg") {
          return "/images/ucl-stadium-bg.jpg";
        }
        return explicit;
      }

      return explicit || "/images/carousel-stadium-bg.jpg";
    };

    // 6. Map filtered news into CarouselSlides
    const slides: CarouselSlide[] = filteredEligibleNews.map((item) => {
      // 1. Division League Kickoff
      if (item.id === "sys-announcement-league-kickoff") {
        return {
          id: item.id,
          type: "SYSTEM_ANNOUNCEMENT",
          badge: "SYSTEM ANNOUNCEMENT",
          category: "System Announcement",
          tabLabel: "League Kickoff",
          title: item.title,
          subtitle: `Kickoff Scheduled: ${formattedKickoffFull || "Confirmed by Admin"}`,
          description: item.description,
          featuredImage: item.featuredImage || "/images/carousel-stadium-bg.jpg",
          buttonText: item.buttonText || "View Fixtures",
          buttonUrl: item.buttonUrl || "/fixtures",
          publishDate: item.publishDate,
          expirationDate: item.expirationDate,
          data: {
            subType: "LEAGUE_START",
            kickoffDate,
            formattedKickoffDate,
            formattedKickoffTime,
            formattedKickoffFull,
            seasonName: leagueConfig.season,
            currentMatchday: leagueConfig.currentMatchday || 1,
          },
        };
      }

      // 2. Champions League & Europa League Draw Scheduled
      if (item.id === "sys-announcement-draw-scheduled") {
        return {
          id: item.id,
          type: "SYSTEM_ANNOUNCEMENT",
          badge: "SYSTEM ANNOUNCEMENT",
          category: "System Announcement",
          tabLabel: "Draw Scheduled",
          title: item.title,
          subtitle: "Official Continental Cups Live Draw Event",
          description: item.description,
          featuredImage: resolveSlideFeaturedImage(item),
          buttonText: item.buttonText || "Watch Live Draw",
          buttonUrl: item.buttonUrl || "/continental",
          publishDate: item.publishDate,
          expirationDate: item.expirationDate,
          data: {
            subType: "DRAW_SCHEDULED",
            hasUclScheduled,
            hasEuropaScheduled,
            uclDrawTime: leagueConfig.uclDrawTime,
            europaDrawTime: leagueConfig.europaDrawTime,
            uclTimeStr,
            europaTimeStr,
          },
        };
      }

      // 3. Champions League & Europa League Draw Results
      if (item.id === "sys-announcement-draw-results") {
        return {
          id: item.id,
          type: "SYSTEM_ANNOUNCEMENT",
          badge: "SYSTEM ANNOUNCEMENT",
          category: "System Announcement",
          tabLabel: "Draw Results",
          title: item.title,
          subtitle: "Groups A, B, C & D Confirmed with Strict Division Separation",
          description: item.description,
          featuredImage: resolveSlideFeaturedImage(item),
          buttonText: item.buttonText || "View Groups & Draws",
          buttonUrl: item.buttonUrl || "/continental",
          publishDate: item.publishDate,
          expirationDate: item.expirationDate,
          data: {
            subType: "DRAW_RESULTS",
            isUclDrawDone,
            isEuropaDrawDone,
            slotsCount: uclGroupSlotsCount,
          },
        };
      }

      // 4. Knockout Advance: When BOTH UCL & Europa League Advance
      if (item.id === "sys-announcement-both-advance") {
        return {
          id: item.id,
          type: "SYSTEM_ANNOUNCEMENT",
          badge: "SYSTEM ANNOUNCEMENT",
          category: "System Announcement",
          tabLabel: "Next Stages",
          title: item.title,
          subtitle: sameStage
            ? `Both Continental Cups Advance to ${uclStageLabel}`
            : `UCL (${uclStageLabel}) • Europa League (${europaStageLabel})`,
          description: item.description,
          featuredImage: resolveSlideFeaturedImage(item),
          buttonText: item.buttonText || "Continental Hub",
          buttonUrl: item.buttonUrl || "/continental",
          publishDate: item.publishDate,
          expirationDate: item.expirationDate,
          data: {
            subType: "CONTINENTAL_ADVANCE",
            uclStage: uclKnockoutStage,
            europaStage: europaKnockoutStage,
            uclStageLabel,
            europaStageLabel,
            sameStage,
          },
        };
      }

      // 5. MOTD Concluded Result
      if (item.id.startsWith("sys-motd-result-")) {
        return {
          id: item.id,
          type: "MOTD_RESULT",
          badge: "MOTD FINAL RESULT",
          category: "Match",
          tabLabel: "MOTD Result",
          title: item.title,
          subtitle: "Match of the Day Concluded",
          description: item.description,
          featuredImage: item.featuredImage || "/images/carousel-stadium-bg.jpg",
          buttonText: item.buttonText || "Fixture Archive",
          buttonUrl: item.buttonUrl || "/fixtures",
          publishDate: item.publishDate,
          expirationDate: item.expirationDate,
          data: item,
        };
      }

      // 6. MOTD Active Match
      if (item.id.startsWith("sys-motd-")) {
        return {
          id: item.id,
          type: "MOTD",
          badge: "MATCH OF THE DAY",
          category: "Match",
          tabLabel: "Match of the Day",
          title: item.title,
          subtitle: item.description,
          description: item.description,
          featuredImage: item.featuredImage || "/images/carousel-stadium-bg.jpg",
          buttonText: item.buttonText || "Match Center",
          buttonUrl: item.buttonUrl || "/fixtures",
          publishDate: item.publishDate,
          expirationDate: item.expirationDate,
          data: item,
        };
      }

      // 7. Season Registration
      if (item.id === "sys-season-registration") {
        return {
          id: item.id,
          type: "REGISTRATION",
          badge: "SEASON ENROLLMENT",
          category: "Registration",
          tabLabel: "Season Registration",
          title: item.title,
          subtitle: "Division 1, Division 2, Division 3 • WhatsApp Room Match Scheduling",
          description: item.description,
          featuredImage: item.featuredImage || "/images/carousel-stadium-bg.jpg",
          buttonText: item.buttonText || "Register Athlete",
          buttonUrl: item.buttonUrl || "/register",
          publishDate: item.publishDate,
          expirationDate: item.expirationDate,
          data: {
            seasonName: leagueConfig.season,
            currentMatchday: leagueConfig.currentMatchday || 1,
          },
        };
      }

      // 8. Auto-update: In-Form Athletes
      if (item.id === "sys-in-form-athletes" || item.id === "in-form-athletes-slide") {
        const athletes = (topInFormStandings || []).map((s) => ({
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

        return {
          id: item.id,
          type: "IN_FORM",
          badge: "IN-FORM ATHLETES",
          category: item.category || "League News",
          tabLabel: "In-Form Players",
          title: item.title,
          subtitle: item.description,
          description: item.description,
          featuredImage: item.featuredImage || "/images/carousel-stadium-bg.jpg",
          buttonText: item.buttonText || "Full Standings",
          buttonUrl: item.buttonUrl || "/standings",
          publishDate: item.publishDate,
          expirationDate: item.expirationDate,
          data: { athletes },
        };
      }

      // 9. Auto-update: Hall of Fame Champions
      if (item.id === "sys-hall-of-fame" || item.id === "hall-of-fame-slide") {
        const topChamp = (hallOfFameEntries || [])[0];
        return {
          id: item.id,
          type: "HALL_OF_FAME",
          badge: "HALL OF FAME",
          category: item.category || "Competition",
          tabLabel: "Reigning Champions",
          title: item.title,
          subtitle: item.description,
          description: item.description,
          featuredImage: item.featuredImage || (topChamp as any)?.playerImage || "/images/carousel-stadium-bg.jpg",
          buttonText: item.buttonText || "Explore Hall of Fame",
          buttonUrl: item.buttonUrl || "/hall-of-fame",
          publishDate: item.publishDate,
          expirationDate: item.expirationDate,
          data: { champions: hallOfFameEntries },
        };
      }

      // 10. Auto-update: Active Matchday / Round Live Fixtures
      if (item.id === "sys-announcement-matchday-active") {
        return {
          id: item.id,
          type: "SYSTEM_ANNOUNCEMENT",
          badge: "LIVE ROUND FIXTURES",
          category: "Match",
          tabLabel: "Round Live",
          title: item.title,
          subtitle: "24-Hour Match Window in Progress",
          description: item.description,
          featuredImage: item.featuredImage || "/images/carousel-stadium-bg.jpg",
          buttonText: item.buttonText || "View Fixtures",
          buttonUrl: item.buttonUrl || "/fixtures",
          publishDate: item.publishDate,
          expirationDate: item.expirationDate,
          data: {
            subType: "MATCHDAY_ACTIVE",
            currentMatchday: leagueConfig.currentMatchday || 1,
          },
        };
      }

      // Standard Administrator-created News Article
      return {
        id: item.id,
        type: item.category === "System Announcement" ? "SYSTEM_ANNOUNCEMENT" : "NEWS",
        badge: item.category.toUpperCase(),
        category: item.category,
        tabLabel: item.title,
        title: item.title,
        subtitle: item.description,
        description: item.description,
        featuredImage: resolveSlideFeaturedImage(item),
        buttonText: item.buttonText,
        buttonUrl: item.buttonUrl,
        publishDate: item.publishDate,
        expirationDate: item.expirationDate,
        data: item,
      };
    });

    // Final safety check: guarantee no league standings reset or locked-competition news ever appears
    return slides.filter((slide) => {
      if (isStandingsResetAnnouncement(slide)) return false;

      const titleLower = (slide.title || "").toLowerCase();
      const descLower = (slide.description || "").toLowerCase();
      const isUcl = titleLower.includes("champions league") || titleLower.includes("ucl") || descLower.includes("champions league");
      const isEuropa = titleLower.includes("europa league") || titleLower.includes("europa") || descLower.includes("europa league");
      const isReg = titleLower.includes("registration") || titleLower.includes("enrollment") || descLower.includes("enrollment");

      // When UCL is locked: ALL UCL slides MUST BE REMOVED!
      if (!leagueConfig.uclStarted && isUcl) return false;

      // When Europa is locked: ALL Europa slides MUST BE REMOVED!
      if (!leagueConfig.europaStarted && isEuropa) return false;

      // When Registration is closed: Registration slides MUST BE REMOVED!
      if (!leagueConfig.registrationOpen && isReg) return false;

      return true;
    });
  } catch (error) {
    console.error("[getCarouselSlides] Error assembling carousel data:", error);
    return [];
  }
}
