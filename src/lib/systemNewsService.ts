import { prisma } from "@/lib/prisma";
import { ensureNewsTable } from "@/lib/ensureNewsTable";
import {
  formatRwandanDate,
  formatRwandanTime,
  formatRwandanDateTime,
} from "@/lib/rwandanTime";

/**
 * Automatically creates and publishes an official system news update in the database.
 * If a published article with the same title is already active, avoids duplicates.
 */
export async function autoPublishSystemNews(params: {
  id?: string;
  title: string;
  category: "League News" | "Match" | "Competition" | "Registration" | "Announcement" | "System Update" | "Event" | "Other";
  description: string;
  featuredImage?: string;
  buttonText?: string | null;
  buttonUrl?: string | null;
  durationDays?: number;
}) {
  try {
    await ensureNewsTable();
    const now = new Date();
    const durationDays = params.durationDays ?? 3;
    const expirationDate = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

    const existing = await prisma.news.findFirst({
      where: {
        title: params.title.trim(),
        status: "PUBLISHED",
        expirationDate: { gt: now },
      },
    });

    if (existing) {
      return existing;
    }

    return await prisma.news.create({
      data: {
        id: params.id,
        title: params.title.trim(),
        category: params.category,
        description: params.description.trim(),
        featuredImage: params.featuredImage?.trim() || "/images/carousel-stadium-bg.jpg",
        buttonText: params.buttonText?.trim() || null,
        buttonUrl: params.buttonUrl?.trim() || null,
        status: "PUBLISHED",
        publishDate: now,
        expirationDate,
        showOnCarousel: true,
      },
    });
  } catch (error) {
    console.error("[autoPublishSystemNews] Error publishing system news:", error);
    return null;
  }
}

/**
 * Inspects real league state and automatically synchronizes all automated system news/updates
 * into the database (News table) so that they appear on the carousel AND are fully visible
 * and manageable in the Admin Portal under the News tab.
 *
 * Strict Rules:
 * 1. Admin deletions of system news items are respected (tracked in DismissedSystemNews).
 * 2. When Europa or UCL schedule time resets, or when competitions are locked, any corresponding
 *    draw/advance news on the carousel is removed immediately (showOnCarousel = false).
 * 3. UCL news cannot be published on the carousel when UCL is locked (!leagueConfig.uclStarted).
 * 4. Europa news cannot be published on the carousel when Europa is locked (!leagueConfig.europaStarted).
 * 5. Standings reset announcements are strictly barred from carousel publication.
 */
export async function syncSystemNewsToCarousel() {
  const synced: any[] = [];
  try {
    await ensureNewsTable();
    const now = new Date();

    // Query dismissed system news IDs to avoid resurrecting items the admin deleted
    const dismissedRows = ((await prisma.$queryRawUnsafe(
      `SELECT id FROM "DismissedSystemNews"`
    ).catch(() => [])) as any[]) || [];
    const dismissedSet = new Set<string>(dismissedRows.map((r: any) => r.id));

    const [
      leagueConfig,
      earliestDivMatch,
      uclGroupSlotsCount,
      europaSlotsCount,
      uclKnockoutMatches,
      europaKnockoutMatches,
      motdMatch,
      latestFinishedMatch,
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
    ]);

    // =========================================================================
    // 1. Division League Kickoff Confirmed Date & Time
    // =========================================================================
    const kickoffDate = earliestDivMatch?.tournament?.startDate || earliestDivMatch?.matchDate;
    const kickoffId = "sys-announcement-league-kickoff";
    if (earliestDivMatch && kickoffDate && !dismissedSet.has(kickoffId)) {
      const formattedKickoffDate = formatRwandanDate(kickoffDate, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      const formattedKickoffTime = formatRwandanTime(kickoffDate);
      const formattedKickoffFull = `${formattedKickoffDate} at ${formattedKickoffTime} (CAT)`;

      const existing = await prisma.news.findUnique({ where: { id: kickoffId } });
      if (!existing) {
        const item = await prisma.news.create({
          data: {
            id: kickoffId,
            title: "Official Division League Starting Date & Time Confirmed",
            category: "Announcement",
            description: `The Commissioner has officially confirmed the schedule for Division 1, Division 2, and Division 3. First round fixtures drop on ${formattedKickoffFull}. All pairings remain strictly sealed until kickoff time. Prepare your squad!`,
            featuredImage: "/images/carousel-stadium-bg.jpg",
            buttonText: "View Fixtures",
            buttonUrl: "/fixtures",
            status: "PUBLISHED",
            publishDate: now,
            expirationDate: new Date(new Date(kickoffDate).getTime() + 14 * 24 * 60 * 60 * 1000),
            showOnCarousel: true,
          },
        });
        synced.push(item);
      }
    }

    // =========================================================================
    // 2. Champions League & Europa League Draw Confirmed Date & Time
    // Strict rules:
    // - If UCL is locked or draw time is null, NO UCL draw news.
    // - If Europa is locked or draw time is null, NO Europa draw news.
    // - When reset or both locked, REMOVE news from carousel!
    // =========================================================================
    const drawScheduledId = "sys-announcement-draw-scheduled";
    const hasUclScheduled = Boolean(leagueConfig.uclStarted && leagueConfig.uclDrawTime && !leagueConfig.uclDrawCompleted);
    const hasEuropaScheduled = Boolean(leagueConfig.europaStarted && leagueConfig.europaDrawTime && !leagueConfig.europaDrawCompleted);

    if (!hasUclScheduled && !hasEuropaScheduled) {
      // Both are locked or schedule times reset -> Ensure carousel display is OFF
      const existing = await prisma.news.findUnique({ where: { id: drawScheduledId } });
      if (existing && existing.showOnCarousel) {
        await prisma.news.update({
          where: { id: drawScheduledId },
          data: { showOnCarousel: false },
        });
      }
    } else if (!dismissedSet.has(drawScheduledId)) {
      const uclTimeStr = leagueConfig.uclDrawTime ? formatRwandanDateTime(leagueConfig.uclDrawTime) : null;
      const europaTimeStr = leagueConfig.europaDrawTime ? formatRwandanDateTime(leagueConfig.europaDrawTime) : null;

      let drawTitle = "UCL & Europa League Draws Confirmed Date & Time";
      let drawDesc = "";

      if (hasUclScheduled && hasEuropaScheduled) {
        drawTitle = "Champions League & Europa League Draws Confirmed Date & Time";
        drawDesc = `The Commissioner has officially scheduled the live draws: Champions League on ${uclTimeStr} (CAT) and Europa League on ${europaTimeStr} (CAT). Watch the live animated draws on the Continental Cups page.`;
      } else if (hasUclScheduled) {
        drawTitle = "Champions League Official Draw Confirmed Date & Time";
        drawDesc = `The Commissioner has officially scheduled the Champions League live draws event on ${uclTimeStr} (CAT / Rwandan Time). Watch the live broadcast on the Continental Cups page.`;
      } else {
        drawTitle = "Europa League Official Draw Confirmed Date & Time";
        drawDesc = `The Commissioner has officially scheduled the Europa League live draws event on ${europaTimeStr} (CAT / Rwandan Time). Watch the live broadcast on the Continental Cups page.`;
      }

      const existing = await prisma.news.findUnique({ where: { id: drawScheduledId } });
      if (!existing) {
        const item = await prisma.news.create({
          data: {
            id: drawScheduledId,
            title: drawTitle,
            category: "Announcement",
            description: drawDesc,
            featuredImage: "/images/carousel-stadium-bg.jpg",
            buttonText: "Watch Live Draw",
            buttonUrl: "/continental",
            status: "PUBLISHED",
            publishDate: now,
            expirationDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
            showOnCarousel: true,
          },
        });
        synced.push(item);
      } else {
        // If schedule time or lock state changed, keep content synchronized if showOnCarousel is on
        if (existing.showOnCarousel) {
          await prisma.news.update({
            where: { id: drawScheduledId },
            data: {
              title: drawTitle,
              description: drawDesc,
            },
          });
        }
      }
    }

    // =========================================================================
    // 3. Champions League & Europa League Draw Results
    // Strict rules:
    // - UCL draw results require leagueConfig.uclStarted
    // - Europa draw results require leagueConfig.europaStarted
    // - If locked, remove/hide from carousel!
    // =========================================================================
    const drawResultsId = "sys-announcement-draw-results";
    const isUclDrawDone = Boolean(leagueConfig.uclStarted && (leagueConfig.uclDrawCompleted || uclGroupSlotsCount >= 16));
    const isEuropaDrawDone = Boolean(leagueConfig.europaStarted && (leagueConfig.europaDrawCompleted || europaSlotsCount >= 16));
    const hasDrawResults = isUclDrawDone || isEuropaDrawDone;

    if (!hasDrawResults) {
      const existing = await prisma.news.findUnique({ where: { id: drawResultsId } });
      if (existing && existing.showOnCarousel) {
        await prisma.news.update({
          where: { id: drawResultsId },
          data: { showOnCarousel: false },
        });
      }
    } else if (!dismissedSet.has(drawResultsId)) {
      let drawResultsTitle = "Champions League & Europa League Official Draw Results";
      let drawResultsDesc = "The live animated draws have concluded! All 4 groups are locked. Check your group opponents, qualified division representatives, and match schedule.";
      if (isUclDrawDone && !isEuropaDrawDone) {
        drawResultsTitle = "Champions League Official Draw Results Confirmed";
        drawResultsDesc = "The official live animated draws for Champions League have concluded! All 4 groups are locked. Check your group opponents and match schedule on the Continental page.";
      } else if (!isUclDrawDone && isEuropaDrawDone) {
        drawResultsTitle = "Europa League Official Draw Results Confirmed";
        drawResultsDesc = "The official live animated draws for Europa League have concluded! All 4 groups are locked. Check your group opponents and match schedule on the Continental page.";
      }

      const existing = await prisma.news.findUnique({ where: { id: drawResultsId } });
      if (!existing) {
        const item = await prisma.news.create({
          data: {
            id: drawResultsId,
            title: drawResultsTitle,
            category: "Announcement",
            description: drawResultsDesc,
            featuredImage: "/images/carousel-stadium-bg.jpg",
            buttonText: "View Groups & Draws",
            buttonUrl: "/continental",
            status: "PUBLISHED",
            publishDate: now,
            expirationDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
            showOnCarousel: true,
          },
        });
        synced.push(item);
      }
    }

    // =========================================================================
    // 4. Knockout Advance: When BOTH UCL & Europa League Advance to Next Stages
    // Strict rules:
    // - Requires BOTH leagueConfig.uclStarted AND leagueConfig.europaStarted
    // - If either is locked, DO NOT publish or show on carousel!
    // =========================================================================
    const advanceId = "sys-announcement-both-advance";
    const getKnockoutStage = (matches: any[]) => {
      if (matches.some((m) => m.stage === "FINAL")) return "FINAL";
      if (matches.some((m) => m.stage === "SEMI_FINAL")) return "SEMI_FINAL";
      if (matches.some((m) => m.stage === "QUARTER_FINAL")) return "QUARTER_FINAL";
      return null;
    };
    const uclKnockoutStage = getKnockoutStage(uclKnockoutMatches);
    const europaKnockoutStage = getKnockoutStage(europaKnockoutMatches);
    const bothUnlocked = Boolean(leagueConfig.uclStarted && leagueConfig.europaStarted);
    const hasAdvance = Boolean(bothUnlocked && uclKnockoutStage && europaKnockoutStage);

    if (!hasAdvance) {
      const existing = await prisma.news.findUnique({ where: { id: advanceId } });
      if (existing && existing.showOnCarousel) {
        await prisma.news.update({
          where: { id: advanceId },
          data: { showOnCarousel: false },
        });
      }
    } else if (!dismissedSet.has(advanceId) && uclKnockoutStage && europaKnockoutStage) {
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

      const advanceDesc =
        sameStage && uclKnockoutStage === "FINAL"
          ? "The pinnacle of eFootball mobile has arrived! Both Champions League and Europa League have advanced to the ultimate Grand Final. Single-match showdowns to decide Rwanda's continental champions."
          : "Both the Champions League and Europa League have officially advanced to the next stages! Contenders will battle in intense 2-legged aggregate showdowns. Coordinate via WhatsApp and report results.";

      const existing = await prisma.news.findUnique({ where: { id: advanceId } });
      if (!existing) {
        const item = await prisma.news.create({
          data: {
            id: advanceId,
            title: advanceTitle,
            category: "Announcement",
            description: advanceDesc,
            featuredImage: "/images/carousel-stadium-bg.jpg",
            buttonText: "Continental Hub",
            buttonUrl: "/continental",
            status: "PUBLISHED",
            publishDate: now,
            expirationDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
            showOnCarousel: true,
          },
        });
        synced.push(item);
      }
    }

    // =========================================================================
    // 5. Match of the Day (Active Clash)
    // =========================================================================
    if (motdMatch && motdMatch.homePlayer && motdMatch.awayPlayer) {
      const motdId = `sys-motd-${motdMatch.id}`;
      if (!dismissedSet.has(motdId)) {
        const existing = await prisma.news.findUnique({ where: { id: motdId } });
        if (!existing) {
          const item = await prisma.news.create({
            data: {
              id: motdId,
              title: `Match of the Day: ${motdMatch.homePlayer.gamerTag} vs ${motdMatch.awayPlayer.gamerTag}`,
              category: "Match",
              description: `Featured showdown in ${motdMatch.division} (${motdMatch.round}). Matches must be scheduled and concluded inside the 24-hour cycle window.`,
              featuredImage: motdMatch.homePlayer.avatar || motdMatch.awayPlayer.avatar || "/images/carousel-stadium-bg.jpg",
              buttonText: "Match Center",
              buttonUrl: `/fixtures?highlight=${motdMatch.id}`,
              status: "PUBLISHED",
              publishDate: now,
              expirationDate: new Date(now.getTime() + 24 * 60 * 60 * 1000),
              showOnCarousel: true,
            },
          });
          synced.push(item);
        }
      }
    }

    // =========================================================================
    // 6. MOTD Concluded Result
    // =========================================================================
    if (latestFinishedMatch && latestFinishedMatch.homePlayer && latestFinishedMatch.awayPlayer) {
      const motdResultId = `sys-motd-result-${latestFinishedMatch.id}`;
      if (!dismissedSet.has(motdResultId)) {
        const homeScore = latestFinishedMatch.homeScore ?? 0;
        const awayScore = latestFinishedMatch.awayScore ?? 0;
        const winner =
          homeScore > awayScore
            ? latestFinishedMatch.homePlayer.gamerTag
            : awayScore > homeScore
            ? latestFinishedMatch.awayPlayer.gamerTag
            : "Stalemate Draw";

        const existing = await prisma.news.findUnique({ where: { id: motdResultId } });
        if (!existing) {
          const item = await prisma.news.create({
            data: {
              id: motdResultId,
              title: `Result: ${latestFinishedMatch.homePlayer.gamerTag} ${homeScore} - ${awayScore} ${latestFinishedMatch.awayPlayer.gamerTag}`,
              category: "Match",
              description: `Official MOTD concluded in ${latestFinishedMatch.division}. Result: ${winner}. Full league standings have been updated with verified statistics.`,
              featuredImage: latestFinishedMatch.homePlayer.avatar || "/images/carousel-stadium-bg.jpg",
              buttonText: "View Standings",
              buttonUrl: "/standings",
              status: "PUBLISHED",
              publishDate: now,
              expirationDate: new Date(now.getTime() + 48 * 60 * 60 * 1000),
              showOnCarousel: true,
            },
          });
          synced.push(item);
        }
      }
    }

    // =========================================================================
    // 7. Season Registration Announcement
    // =========================================================================
    const regId = "sys-season-registration";
    if (leagueConfig.registrationOpen) {
      if (!dismissedSet.has(regId)) {
        const existing = await prisma.news.findUnique({ where: { id: regId } });
        if (!existing) {
          const item = await prisma.news.create({
            data: {
              id: regId,
              title: `${leagueConfig.season} Athlete Registration Now Active`,
              category: "Registration",
              description: `Official enrollment is open for Division 1, Division 2, and Division 3. Complete registration to secure club team assignment and WhatsApp match scheduling access.`,
              featuredImage: "/images/carousel-stadium-bg.jpg",
              buttonText: "Register Athlete",
              buttonUrl: "/register",
              status: "PUBLISHED",
              publishDate: now,
              expirationDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
              showOnCarousel: true,
            },
          });
          synced.push(item);
        }
      }
    } else {
      // If registration closed, turn off carousel display
      const existing = await prisma.news.findUnique({ where: { id: regId } });
      if (existing && existing.showOnCarousel) {
        await prisma.news.update({
          where: { id: regId },
          data: { showOnCarousel: false },
        });
      }
    }
  } catch (err) {
    console.error("[syncSystemNewsToCarousel] Error:", err);
  }

  return synced;
}
