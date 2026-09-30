import { prisma } from "@/lib/prisma";
import { ensureNewsTable } from "@/lib/ensureNewsTable";
import { evaluateMatchOfTheDay } from "@/lib/matchOfTheDay";
import {
  formatRwandanDate,
  formatRwandanTime,
  formatRwandanDateTime,
} from "@/lib/rwandanTime";
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
 *    - [System announcement] 1: Division league Starting date & time after admin scheduled it
 *    - [System announcement] 2: Champions League & Europa League Draw confirmed date (when admin scheduled it)
 *    - [System announcement] 3: Champions League & Europa League Draw results
 *    - [System announcement] 4: When BOTH UCL & Europa League advance to the next stages
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
      earliestDivMatch,
      divTournaments,
      uclGroupSlotsCount,
      uclKnockoutMatches,
      europaKnockoutMatches,
      pinnedBroadcastAnnouncements,
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
      prisma.match.findFirst({
        where: { division: { in: ["Division 1", "Division 2", "Division 3"] } },
        orderBy: [{ matchDate: "asc" }],
        include: { tournament: true },
      }),
      prisma.tournament.findMany({
        where: { type: "DIVISION" },
        select: { id: true, name: true, startDate: true, status: true },
      }),
      prisma.uclGroupSlot.count(),
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
      prisma.announcement.findMany({
        where: { type: "BROADCAST", isPinned: true },
        orderBy: [{ createdAt: "desc" }],
        take: 2,
      }),
    ]);

    // =========================================================================
    // SYSTEM ANNOUNCEMENTS (Automated real-time league and tournament milestones)
    // =========================================================================

    // 1. Division league Starting date(time) after admin scheduled it
    const kickoffDate = earliestDivMatch?.tournament?.startDate || earliestDivMatch?.matchDate;
    if (earliestDivMatch && kickoffDate) {
      const formattedKickoffDate = formatRwandanDate(kickoffDate, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      const formattedKickoffTime = formatRwandanTime(kickoffDate);
      const formattedKickoffFull = `${formattedKickoffDate} at ${formattedKickoffTime} (CAT)`;

      slides.push({
        id: "system-announcement-league-kickoff",
        type: "SYSTEM_ANNOUNCEMENT",
        badge: "SYSTEM ANNOUNCEMENT",
        category: "System Announcement",
        tabLabel: "League Kickoff",
        title: "Official Division League Starting Date & Time Confirmed",
        subtitle: `Kickoff Scheduled: ${formattedKickoffFull}`,
        description: `The Commissioner has officially confirmed the schedule for Division 1, Division 2, and Division 3. First round fixtures drop on ${formattedKickoffFull}. All pairings remain strictly sealed until kickoff time. Prepare your squad!`,
        featuredImage: "/images/carousel-stadium-bg.jpg",
        buttonText: "View Fixtures",
        buttonUrl: "/fixtures",
        publishDate: kickoffDate,
        data: {
          subType: "LEAGUE_START",
          kickoffDate,
          formattedKickoffDate,
          formattedKickoffTime,
          formattedKickoffFull,
          seasonName: leagueConfig.season,
          currentMatchday: leagueConfig.currentMatchday || 1,
        },
      });
    }

    // 2. CHAMPIONS LEAGUE & EUROPA LEAGUE Draw confirmed date (When admin scheduled it)
    const hasUclScheduled = Boolean(leagueConfig.uclDrawTime && !leagueConfig.uclDrawCompleted);
    const hasEuropaScheduled = Boolean(leagueConfig.europaDrawTime && !leagueConfig.europaDrawCompleted);

    if (hasUclScheduled || hasEuropaScheduled) {
      const uclTimeStr = leagueConfig.uclDrawTime ? formatRwandanDateTime(leagueConfig.uclDrawTime) : null;
      const europaTimeStr = leagueConfig.europaDrawTime ? formatRwandanDateTime(leagueConfig.europaDrawTime) : null;

      let drawTitle = "UCL & Europa League Draws Confirmed Date & Time";
      let drawSubtitle = "Official Continental Cups Live Draw Event";
      let drawDesc = "";

      if (hasUclScheduled && hasEuropaScheduled) {
        drawTitle = "Champions League & Europa League Draws Confirmed Date & Time";
        drawSubtitle = "UCL & Europa League Official Live Draw Events Scheduled";
        drawDesc = `The Commissioner has officially scheduled the live draws: Champions League on ${uclTimeStr} (CAT) and Europa League on ${europaTimeStr} (CAT). Watch the live animated draws on the Continental Cups page.`;
      } else if (hasUclScheduled) {
        drawTitle = "Champions League Official Draw Confirmed Date & Time";
        drawSubtitle = `UCL Live Animated Draw Event • ${uclTimeStr} (CAT)`;
        drawDesc = `The Commissioner has officially scheduled the Champions League live draws event on ${uclTimeStr} (CAT / Rwandan Time). Watch the live broadcast on the Continental Cups page.`;
      } else {
        drawTitle = "Europa League Official Draw Confirmed Date & Time";
        drawSubtitle = `Europa League Live Animated Draw Event • ${europaTimeStr} (CAT)`;
        drawDesc = `The Commissioner has officially scheduled the Europa League live draws event on ${europaTimeStr} (CAT / Rwandan Time). Watch the live broadcast on the Continental Cups page.`;
      }

      slides.push({
        id: "system-announcement-draw-scheduled",
        type: "SYSTEM_ANNOUNCEMENT",
        badge: "SYSTEM ANNOUNCEMENT",
        category: "System Announcement",
        tabLabel: "Draw Scheduled",
        title: drawTitle,
        subtitle: drawSubtitle,
        description: drawDesc,
        featuredImage: "/images/carousel-stadium-bg.jpg",
        buttonText: "Watch Live Draw",
        buttonUrl: "/continental",
        publishDate: leagueConfig.uclDrawTime || leagueConfig.europaDrawTime || now,
        data: {
          subType: "DRAW_SCHEDULED",
          hasUclScheduled,
          hasEuropaScheduled,
          uclDrawTime: leagueConfig.uclDrawTime,
          europaDrawTime: leagueConfig.europaDrawTime,
          uclTimeStr,
          europaTimeStr,
        },
      });
    }

    // 3. CHAMPIONS LEAGUE & EUROPA LEAGUE DRAW results
    const isUclDrawDone = Boolean(leagueConfig.uclDrawCompleted);
    const isEuropaDrawDone = Boolean(leagueConfig.europaDrawCompleted);
    const hasDrawResults = isUclDrawDone || isEuropaDrawDone || uclGroupSlotsCount >= 16;

    if (hasDrawResults) {
      let drawResultsTitle = "Champions League & Europa League Official Draw Results";
      if (isUclDrawDone && !isEuropaDrawDone) {
        drawResultsTitle = "Champions League Official Draw Results Confirmed";
      } else if (!isUclDrawDone && isEuropaDrawDone) {
        drawResultsTitle = "Europa League Official Draw Results Confirmed";
      }

      slides.push({
        id: "system-announcement-draw-results",
        type: "SYSTEM_ANNOUNCEMENT",
        badge: "SYSTEM ANNOUNCEMENT",
        category: "System Announcement",
        tabLabel: "Draw Results",
        title: drawResultsTitle,
        subtitle: "Groups A, B, C & D Confirmed with Strict Division Separation",
        description: "The live animated draws have concluded! All 4 groups are locked. Check your group opponents, qualified division representatives, and match schedule.",
        featuredImage: "/images/carousel-stadium-bg.jpg",
        buttonText: "View Groups & Draws",
        buttonUrl: "/continental",
        publishDate: now,
        data: {
          subType: "DRAW_RESULTS",
          isUclDrawDone,
          isEuropaDrawDone,
          slotsCount: uclGroupSlotsCount,
        },
      });
    }

    // 4. when BOTH UCL & EUROPA advances to the next stages
    const getKnockoutStage = (matches: any[]) => {
      if (matches.some((m) => m.stage === "FINAL")) return "FINAL";
      if (matches.some((m) => m.stage === "SEMI_FINAL")) return "SEMI_FINAL";
      if (matches.some((m) => m.stage === "QUARTER_FINAL")) return "QUARTER_FINAL";
      return null;
    };
    const uclKnockoutStage = getKnockoutStage(uclKnockoutMatches);
    const europaKnockoutStage = getKnockoutStage(europaKnockoutMatches);

    if (uclKnockoutStage && europaKnockoutStage) {
      const stageLabelMap: Record<string, string> = {
        QUARTER_FINAL: "Quarter-Finals",
        SEMI_FINAL: "Semi-Finals",
        FINAL: "Grand Final",
      };

      const uclStageLabel = stageLabelMap[uclKnockoutStage] || uclKnockoutStage;
      const europaStageLabel = stageLabelMap[europaKnockoutStage] || europaKnockoutStage;
      const sameStage = uclKnockoutStage === europaKnockoutStage;

      const advanceTitle = sameStage
        ? `UCL & Europa League Advance to ${uclStageLabel}!`
        : `UCL & Europa League Advance to Next Stages (${uclStageLabel} & ${europaStageLabel})!`;

      const advanceSubtitle = sameStage
        ? `Both Continental Cups Advance to ${uclStageLabel}`
        : `UCL (${uclStageLabel}) • Europa League (${europaStageLabel})`;

      const advanceDesc =
        sameStage && uclKnockoutStage === "FINAL"
          ? "The pinnacle of eFootball mobile has arrived! Both Champions League and Europa League have advanced to the ultimate Grand Final. Single-match showdowns to decide Rwanda's continental champions."
          : "Both the Champions League and Europa League have officially advanced to the next stages! Contenders will battle in intense 2-legged aggregate showdowns. Coordinate via WhatsApp and report results.";

      slides.push({
        id: "system-announcement-both-advance",
        type: "SYSTEM_ANNOUNCEMENT",
        badge: "SYSTEM ANNOUNCEMENT",
        category: "System Announcement",
        tabLabel: "Next Stages",
        title: advanceTitle,
        subtitle: advanceSubtitle,
        description: advanceDesc,
        featuredImage: "/images/carousel-stadium-bg.jpg",
        buttonText: "Continental Hub",
        buttonUrl: "/continental",
        publishDate: now,
        data: {
          subType: "CONTINENTAL_ADVANCE",
          uclStage: uclKnockoutStage,
          europaStage: europaKnockoutStage,
          uclStageLabel,
          europaStageLabel,
          sameStage,
        },
      });
    }

    // 5. Also publish direct Commissioner broadcast announcements that are pinned
    for (const ann of pinnedBroadcastAnnouncements) {
      if (!slides.some((s) => s.title.toLowerCase() === ann.title.toLowerCase())) {
        slides.push({
          id: `announcement-${ann.id}`,
          type: "SYSTEM_ANNOUNCEMENT",
          badge: "SYSTEM ANNOUNCEMENT",
          category: "System Announcement",
          tabLabel: "Official Notice",
          title: ann.title,
          subtitle: "Official Commissioner Noticeboard",
          description: ann.content,
          featuredImage: "/images/carousel-stadium-bg.jpg",
          buttonText: "Noticeboard",
          buttonUrl: "/dashboard",
          publishDate: ann.createdAt,
          data: {
            subType: "BROADCAST_NOTICE",
            announcementId: ann.id,
          },
        });
      }
    }

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
      const topChamp = hallOfFameEntries[0];
      slides.push({
        id: "hall-of-fame-slide",
        type: "HALL_OF_FAME",
        badge: "HALL OF FAME",
        category: "Competition",
        tabLabel: "Reigning Champions",
        title: "Title Winners • Last Season Champions",
        subtitle: "Athletes who conquered Rwanda's official eFootball championships",
        description: "Official title winners from previous seasons immortalized in the league registry.",
        featuredImage: (topChamp as any).playerImage || "/images/carousel-stadium-bg.jpg",
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
