import { prisma } from "@/lib/prisma";
import { ensureNewsTable } from "@/lib/ensureNewsTable";
import { syncSystemNewsToCarousel } from "@/lib/systemNewsService";
import {
  formatRwandanDate,
  formatRwandanTime,
  formatRwandanDateTime,
} from "@/lib/rwandanTime";
import { findTeam, resolvePlayerAvatar } from "@/lib/teams";
import { enrichAndSyncHallOfFameEntries } from "@/lib/hallOfFameStatsService";
import { getSuperCupOverview } from "@/lib/superCupService";
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
 * 5. Standings reset announcements are strictly barred from carousel publication.
 */

/**
 * Strict safeguard: League standings and tournament reset announcements must NOT be published on the carousel.
 */
function isStandingsResetAnnouncement(item: {
  id?: string;
  category?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  content?: string;
}): boolean {
  if (
    item.category === "League Table" ||
    (item.id && (item.id.startsWith("sys-league-table-") || item.id.startsWith("sys-motw-") || item.id.startsWith("sys-derby-")))
  ) {
    return false;
  }
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

    // Add a 60-second buffer to allow newly published articles to appear immediately regardless of minor client-server clock drift
    const now = new Date(Date.now() + 60 * 1000);

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
      rawHallOfFameEntries,
      topInFormStandings,
      superCupOverviewData,
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
      getSuperCupOverview().catch(() => null),
    ]);

    const hallOfFameEntries = await enrichAndSyncHallOfFameEntries(rawHallOfFameEntries);

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
      const isSuperCup =
        item.id?.startsWith("sys-announcement-super-cup") ||
        (item as any).data?.competition === "SUPER_CUP" ||
        (item as any).data?.division === "SUPER_CUP" ||
        (item.buttonUrl || "").toLowerCase().includes("super-cup") ||
        titleLower.includes("super cup") ||
        titleLower.includes("supercup") ||
        descLower.includes("super cup") ||
        descLower.includes("supercup") ||
        (item.category && item.category.toLowerCase().includes("super"));

      // Rule 1B: Super Cup announcements & showdowns are NEVER barred by UCL/Europa locks
      if (isSuperCup) {
        return true;
      }

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

    // Helper to select the accurate stadium background for carousel slides (Super Cup vs Europa vs UCL vs League)
    const resolveSlideFeaturedImage = (item: any) => {
      const explicit = item.featuredImage?.trim();
      const text = `${item.title || ""} ${item.description || ""} ${item.subtitle || ""} ${item.category || ""} ${item.id || ""} ${item.buttonUrl || ""}`.toLowerCase();
      const isSuperCup =
        item.id?.startsWith("sys-announcement-super-cup") ||
        (item as any).data?.competition === "SUPER_CUP" ||
        (item as any).data?.division === "SUPER_CUP" ||
        text.includes("super cup") ||
        text.includes("supercup") ||
        item.category?.toLowerCase().includes("super");

      if (isSuperCup) {
        if (
          !explicit ||
          explicit === "/images/carousel-stadium-bg.jpg" ||
          explicit === "/images/ucl-stadium-bg.jpg" ||
          explicit === "/images/europa-stadium-bg.jpg" ||
          explicit === "/images/motw-stadium-bg.jpg"
        ) {
          return "/images/super-cup-bg.jpg";
        }
        return explicit;
      }

      const isEuropa = text.includes("europa");
      const isUcl = !isEuropa && (text.includes("ucl") || text.includes("champions league"));
      const isMotw =
        item.id?.startsWith("sys-motw-") ||
        item.id === "sys-motw-active" ||
        text.includes("match of the week") ||
        text.includes("motw");

      if (isMotw) {
        if (!explicit || explicit === "/images/carousel-stadium-bg.jpg" || explicit === "/images/ucl-stadium-bg.jpg" || explicit === "/images/europa-stadium-bg.jpg") {
          return "/images/motw-stadium-bg.jpg";
        }
        return explicit;
      }

      const isMotd =
        item.id?.startsWith("sys-motd-") ||
        text.includes("match of the day") ||
        text.includes("motd");

      if (isMotd) {
        if (!explicit || explicit === "/images/carousel-stadium-bg.jpg") {
          return "/images/today-match-bg.png";
        }
        return explicit;
      }

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
    const slides: CarouselSlide[] = (
      await Promise.all(
        filteredEligibleNews.map(async (item) => {
          // 0A. Match of the Week (MOTW) Official Headline Fixture
          if (
            item.id.startsWith("sys-motw-") ||
            item.id === "sys-motw-active" ||
            (item.category === "Match" && (item.title || "").toLowerCase().includes("match of the week"))
          ) {
            const matchId = item.buttonUrl?.includes("highlight=")
              ? item.buttonUrl.split("highlight=")[1]?.split("&")[0]
              : item.id.replace("sys-motw-", "");

            const motwMatch = await prisma.match.findUnique({
              where: { id: matchId },
              include: {
                homePlayer: true,
                awayPlayer: true,
              },
            });

            if (motwMatch && motwMatch.homePlayer && motwMatch.awayPlayer) {
              const kickoffDate = motwMatch.matchDate;
              const formattedKickoffDate = formatRwandanDate(kickoffDate, {
                weekday: "short",
                month: "short",
                day: "numeric",
              });
              const formattedKickoffTime = formatRwandanTime(kickoffDate);
              const formattedKickoffFull = `${formattedKickoffDate} • ${formattedKickoffTime} (CAT)`;

              return {
                id: item.id,
                type: "MOTW",
                badge: "MATCH OF THE WEEK",
                category: "Match",
                tabLabel: "Match of the Week",
                title: item.title,
                subtitle: `${motwMatch.division} • ${motwMatch.round} • Kickoff: ${formattedKickoffFull}`,
                description: item.description,
                featuredImage:
                  motwMatch.division === "SUPER_CUP" || (motwMatch.round || "").toLowerCase().includes("super cup")
                    ? "/images/super-cup-bg.jpg"
                    : "/images/motw-stadium-bg.jpg",
                buttonText: item.buttonText || "Predict Winner",
                buttonUrl: item.buttonUrl || `/fixtures?highlight=${motwMatch.id}`,
                publishDate: item.publishDate,
                expirationDate: item.expirationDate,
                data: {
                  matchId: motwMatch.id,
                  division: motwMatch.division,
                  round: motwMatch.round,
                  matchDate: motwMatch.matchDate,
                  formattedKickoffDate,
                  formattedKickoffTime,
                  formattedKickoffFull,
                  homePlayer: motwMatch.homePlayer,
                  awayPlayer: motwMatch.awayPlayer,
                },
              };
            }
          }

          // 0A-2. Official Derby Headline Fixture Slide
          if (
            item.id.startsWith("sys-derby-") ||
            item.category === "Derby" ||
            (item.category === "Match" && (item.title || "").toLowerCase().includes("derby"))
          ) {
            const matchId = item.buttonUrl?.includes("highlight=")
              ? item.buttonUrl.split("highlight=")[1]?.split("&")[0]
              : item.id.replace("sys-derby-", "");

            const derbyMatch = await prisma.match.findUnique({
              where: { id: matchId },
              include: {
                homePlayer: true,
                awayPlayer: true,
              },
            });

            if (derbyMatch && derbyMatch.homePlayer && derbyMatch.awayPlayer) {
              const kickoffDate = derbyMatch.matchDate;
              const formattedKickoffDate = formatRwandanDate(kickoffDate, {
                weekday: "short",
                month: "short",
                day: "numeric",
              });
              const formattedKickoffTime = formatRwandanTime(kickoffDate);
              const formattedKickoffFull = `${formattedKickoffDate} • ${formattedKickoffTime} (CAT)`;

              const { detectDerby } = await import("@/lib/derbyService");
              const detected = (derbyMatch as any).isDerby && (derbyMatch as any).derbyName
                ? { name: (derbyMatch as any).derbyName }
                : detectDerby(derbyMatch.homePlayer, derbyMatch.awayPlayer);

              const derbyOfficialName = (derbyMatch as any).derbyName || detected?.name || item.title;

              return {
                id: item.id,
                type: "DERBY",
                badge: derbyOfficialName.toUpperCase(),
                category: "Derby",
                tabLabel: "Official Derby",
                title: item.title,
                subtitle: `${derbyMatch.division} • ${derbyMatch.round} • Kickoff: ${formattedKickoffFull}`,
                description: item.description,
                featuredImage: item.featuredImage || "/images/motw-stadium-bg.jpg",
                buttonText: item.buttonText || "VIEW DERBY",
                buttonUrl: item.buttonUrl || `/fixtures?highlight=${derbyMatch.id}`,
                publishDate: item.publishDate,
                expirationDate: item.expirationDate,
                data: {
                  matchId: derbyMatch.id,
                  division: derbyMatch.division,
                  round: derbyMatch.round,
                  derbyName: derbyOfficialName,
                  matchDate: derbyMatch.matchDate,
                  formattedKickoffDate,
                  formattedKickoffTime,
                  formattedKickoffFull,
                  homePlayer: derbyMatch.homePlayer,
                  awayPlayer: derbyMatch.awayPlayer,
                },
              };
            }
          }

          // 0B. Publish Any League Table to the Carousel
          if (
            item.category === "League Table" ||
            item.id.startsWith("sys-league-table-") ||
            (item.title || "").toLowerCase().includes("standings & table")
          ) {
            let division = "Division 1";
            if (item.buttonUrl?.includes("division=")) {
              division = decodeURIComponent(item.buttonUrl.split("division=")[1]?.split("&")[0] || "Division 1");
            } else if (item.id.includes("division-2") || (item.title || "").includes("Division 2")) {
              division = "Division 2";
            } else if (item.id.includes("division-3") || (item.title || "").includes("Division 3")) {
              division = "Division 3";
            } else if (item.id.includes("ucl") || (item.title || "").toLowerCase().includes("ucl")) {
              division = "UCL";
            } else if (item.id.includes("europa") || (item.title || "").toLowerCase().includes("europa")) {
              division = "EUROPA";
            }

            const rawStandings = await prisma.standing.findMany({
              where: {
                division,
                player: {
                  status: { not: "RESERVED" },
                },
              },
              include: {
                player: true,
              },
            });

            const seenPlayers = new Set<string>();
            const sorted = (rawStandings || [])
              .filter((s: any) => {
                if (!s || !s.player || s.player.status === "RESERVED") return false;
                const pId = s.playerId || s.player?.id;
                if (pId) {
                  if (seenPlayers.has(pId)) return false;
                  seenPlayers.add(pId);
                }
                return true;
              })
              .sort((a: any, b: any) => {
                if ((b.points ?? 0) !== (a.points ?? 0)) return (b.points ?? 0) - (a.points ?? 0);
                if ((b.goalDifference ?? 0) !== (a.goalDifference ?? 0)) return (b.goalDifference ?? 0) - (a.goalDifference ?? 0);
                if ((b.goalsFor ?? 0) !== (a.goalsFor ?? 0)) return (b.goalsFor ?? 0) - (a.goalsFor ?? 0);
                if ((b.won ?? 0) !== (a.won ?? 0)) return (b.won ?? 0) - (a.won ?? 0);
                return (a.player?.gamerTag || "").localeCompare(b.player?.gamerTag || "");
              });

            let bestFormScore = -1;
            let inFormLeaderGamerTag: string | null = null;
            let inFormLeaderPlayer: any = null;

            sorted.forEach((s: any) => {
              const formArr = (s.form || "")
                .split(",")
                .map((f: string) => f.trim().toUpperCase())
                .filter(Boolean);
              const formPoints = formArr.reduce(
                (acc: number, f: string) => acc + (f === "W" ? 3 : f === "D" ? 1 : 0),
                0
              );
              let winStreak = 0;
              for (let i = formArr.length - 1; i >= 0; i--) {
                if (formArr[i] === "W") winStreak++;
                else break;
              }
              const totalScore = winStreak * 10 + formPoints * 2 + (s.won || 0);
              if (totalScore > bestFormScore && formArr.length > 0) {
                bestFormScore = totalScore;
                inFormLeaderGamerTag = s.player?.gamerTag || null;
                inFormLeaderPlayer = {
                  gamerTag: s.player?.gamerTag,
                  club: s.player?.realTeam,
                  avatar: resolvePlayerAvatar(s.player),
                  winStreak,
                  recentForm: formArr.slice(-5),
                };
              }
            });

            const rows = sorted.map((s: any, idx: number) => {
              const rank = idx + 1;
              const prevRank = s.previousRank;
              let movement: "UP" | "DOWN" | "SAME" = "SAME";
              let delta = 0;

              if (typeof prevRank === "number" && prevRank > 0) {
                if (rank < prevRank) {
                  movement = "UP";
                  delta = prevRank - rank;
                } else if (rank > prevRank) {
                  movement = "DOWN";
                  delta = rank - prevRank;
                }
              }

              const formArr = (s.form || "")
                .split(",")
                .map((f: string) => f.trim().toUpperCase())
                .filter(Boolean);

              return {
                id: s.id,
                rank,
                previousRank: prevRank,
                movement,
                delta,
                gamerTag: s.player?.gamerTag,
                club: s.player?.realTeam,
                avatar: resolvePlayerAvatar(s.player),
                played: s.played || 0,
                won: s.won || 0,
                drawn: s.drawn || 0,
                lost: s.lost || 0,
                goalsFor: s.goalsFor || 0,
                goalsAgainst: s.goalsAgainst || 0,
                goalDifference: s.goalDifference || 0,
                points: s.points || 0,
                form: formArr.length > 0 ? formArr.slice(-5) : ["D"],
                isTopForm: s.player?.gamerTag === inFormLeaderGamerTag,
              };
            });

            return {
              id: item.id,
              type: "LEAGUE_TABLE",
              badge: `${division.toUpperCase()} STANDINGS`,
              category: "League Table",
              tabLabel: `${division} Table`,
              title: item.title || `${division} Official Standings`,
              subtitle: `Live Table • Matchday ${leagueConfig.currentMatchday || 1}`,
              description: item.description,
              featuredImage: resolveSlideFeaturedImage(item),
              buttonText: item.buttonText || "View Full Standings",
              buttonUrl: item.buttonUrl || `/standings?division=${encodeURIComponent(division)}`,
              publishDate: item.publishDate,
              expirationDate: item.expirationDate,
              data: {
                division,
                standings: rows.slice(0, 5),
                totalTeams: rows.length,
                inFormLeaderGamerTag,
                inFormLeaderPlayer,
              },
            };
          }

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
      if (
        item.id.startsWith("sys-motd-result-") ||
        (item.category === "Match" &&
          (item.title || "").toLowerCase().includes("result: ") &&
          (item.description || "").toLowerCase().includes("motd"))
      ) {
        const matchId = item.buttonUrl?.includes("highlight=")
          ? item.buttonUrl.split("highlight=")[1]?.split("&")[0]
          : item.id.replace("sys-motd-result-", "");

        let motdMatch = matchId
          ? await prisma.match.findUnique({
              where: { id: matchId },
              include: { homePlayer: true, awayPlayer: true },
            })
          : null;

        if (!motdMatch) {
          motdMatch = await prisma.match.findFirst({
            where: { isMatchOfTheDay: true, status: "FINISHED" },
            include: { homePlayer: true, awayPlayer: true },
            orderBy: { matchDate: "desc" },
          });
        }

        const homePlayer = motdMatch?.homePlayer || (motdMatch?.homePlayerId ? await prisma.player.findUnique({ where: { id: motdMatch.homePlayerId } }) : null);
        const awayPlayer = motdMatch?.awayPlayer || (motdMatch?.awayPlayerId ? await prisma.player.findUnique({ where: { id: motdMatch.awayPlayerId } }) : null);

        if (motdMatch && homePlayer && awayPlayer) {
          const homeGamerTag = homePlayer.gamerTag?.trim() || "Home Contender";
          const awayGamerTag = awayPlayer.gamerTag?.trim() || "Away Contender";
          const homeTeam = findTeam(homePlayer.realTeam);
          const awayTeam = findTeam(awayPlayer.realTeam);
          const homeScore = motdMatch.homeScore ?? 0;
          const awayScore = motdMatch.awayScore ?? 0;
          const winner = homeScore > awayScore ? homePlayer : awayScore > homeScore ? awayPlayer : null;

          return {
            id: item.id,
            type: "MOTD_RESULT",
            badge: "MOTD FINAL RESULT",
            category: "Match",
            tabLabel: "MOTD Result",
            title: `${homeGamerTag} ${homeScore} - ${awayScore} ${awayGamerTag}`,
            subtitle: winner ? `@${winner.gamerTag} wins the Match of the Day showdown!` : "Match of the Day ends in a draw!",
            description: item.description,
            featuredImage: resolveSlideFeaturedImage(item),
            buttonText: item.buttonText || "Fixture Archive",
            buttonUrl: item.buttonUrl || `/fixtures?highlight=${motdMatch.id}`,
            publishDate: item.publishDate,
            expirationDate: item.expirationDate,
            data: {
              ...item,
              matchId: motdMatch.id,
              division: motdMatch.division,
              round: motdMatch.round,
              homePlayer,
              awayPlayer,
              homeGamerTag,
              awayGamerTag,
              homeTeam,
              awayTeam,
              homeScore,
              awayScore,
              winner,
            },
          };
        }

        return {
          id: item.id,
          type: "SYSTEM_ANNOUNCEMENT",
          badge: "MOTD FINAL RESULT",
          category: item.category || "Match",
          tabLabel: "MOTD Result",
          title: item.title,
          subtitle: "Match of the Day Concluded",
          description: item.description,
          featuredImage: resolveSlideFeaturedImage(item),
          buttonText: item.buttonText || "Fixture Archive",
          buttonUrl: item.buttonUrl || "/fixtures",
          publishDate: item.publishDate,
          expirationDate: item.expirationDate,
          data: item,
        };
      }

      // 6. MOTD Active Match
      if (
        item.id.startsWith("sys-motd-") ||
        item.category === "Match of the Day" ||
        (item.category === "Match" && (item.title || "").toLowerCase().includes("match of the day"))
      ) {
        const matchId = item.buttonUrl?.includes("highlight=")
          ? item.buttonUrl.split("highlight=")[1]?.split("&")[0]
          : item.id.replace("sys-motd-", "");

        let motdMatch = matchId
          ? await prisma.match.findUnique({
              where: { id: matchId },
              include: { homePlayer: true, awayPlayer: true },
            })
          : null;

        if (!motdMatch) {
          motdMatch = await prisma.match.findFirst({
            where: { isMatchOfTheDay: true, status: { in: ["SCHEDULED", "LIVE"] } },
            include: { homePlayer: true, awayPlayer: true },
          });
        }

        const homePlayer = motdMatch?.homePlayer || (motdMatch?.homePlayerId ? await prisma.player.findUnique({ where: { id: motdMatch.homePlayerId } }) : null);
        const awayPlayer = motdMatch?.awayPlayer || (motdMatch?.awayPlayerId ? await prisma.player.findUnique({ where: { id: motdMatch.awayPlayerId } }) : null);

        if (motdMatch && homePlayer && awayPlayer) {
          // Fetch standings for division to determine rank, points, and form
          const standings = await prisma.standing.findMany({
            where: { division: motdMatch.division },
            orderBy: [{ points: "desc" }, { goalDifference: "desc" }, { goalsFor: "desc" }],
            include: { player: true },
          });

          const homeStandingIdx = standings.findIndex((s) => s.playerId === motdMatch.homePlayerId);
          const awayStandingIdx = standings.findIndex((s) => s.playerId === motdMatch.awayPlayerId);
          const homeStanding = homeStandingIdx >= 0 ? standings[homeStandingIdx] : null;
          const awayStanding = awayStandingIdx >= 0 ? standings[awayStandingIdx] : null;
          const homeRank = homeStandingIdx >= 0 ? homeStandingIdx + 1 : 1;
          const awayRank = awayStandingIdx >= 0 ? awayStandingIdx + 1 : 2;
          const homePoints = homeStanding?.points ?? 0;
          const awayPoints = awayStanding?.points ?? 0;

          const parseForm = (formStr?: string | null) =>
            (formStr || "")
              .split(",")
              .map((f: string) => f.trim().toUpperCase())
              .filter(Boolean)
              .slice(-5);
          const homeForm = parseForm(homeStanding?.form);
          const awayForm = parseForm(awayStanding?.form);

          const homeGamerTag = homePlayer.gamerTag?.trim() || "Home Contender";
          const awayGamerTag = awayPlayer.gamerTag?.trim() || "Away Contender";
          const homeTeam = findTeam(homePlayer.realTeam);
          const awayTeam = findTeam(awayPlayer.realTeam);

          const { detectDerby } = await import("@/lib/derbyService");
          const detected = (motdMatch as any).isDerby && (motdMatch as any).derbyName
            ? { name: (motdMatch as any).derbyName }
            : detectDerby(homePlayer, awayPlayer);
          const derbyName = (motdMatch as any).derbyName || detected?.name || null;

          const motdHeadline = derbyName
            ? `${derbyName} • Historic Rivalry Showdown`
            : homeRank <= 2 && awayRank <= 2
            ? `Top of the Table Blockbuster (#${homeRank} vs #${awayRank})`
            : homeRank <= 4 && awayRank <= 4
            ? `Top 4 Battle (#${homeRank} vs #${awayRank})`
            : `${motdMatch.division} Showdown (#${homeRank} vs #${awayRank})`;

          const kickoffDate = motdMatch.matchDate;
          const formattedKickoffDate = kickoffDate
            ? formatRwandanDate(kickoffDate, { weekday: "short", month: "short", day: "numeric" })
            : null;
          const formattedKickoffTime = kickoffDate ? formatRwandanTime(kickoffDate) : null;
          const formattedKickoffFull = formattedKickoffDate && formattedKickoffTime
            ? `${formattedKickoffDate} • ${formattedKickoffTime} (CAT)`
            : "24-Hour Cycle Active";

          let pollStats = { totalVotes: 0, homeVotes: 0, drawVotes: 0, awayVotes: 0, homePct: 45, drawPct: 15, awayPct: 40 };
          try {
            const votes = await prisma.motdPollVote.findMany({
              where: { matchId: motdMatch.id },
            });
            const total = votes.length;
            if (total > 0) {
              const hVotes = votes.filter((v) => v.prediction === "HOME").length;
              const dVotes = votes.filter((v) => v.prediction === "DRAW").length;
              const aVotes = votes.filter((v) => v.prediction === "AWAY").length;
              const hPct = Math.round((hVotes / total) * 100);
              const dPct = Math.round((dVotes / total) * 100);
              const aPct = Math.max(0, 100 - hPct - dPct);
              pollStats = { totalVotes: total, homeVotes: hVotes, drawVotes: dVotes, awayVotes: aVotes, homePct: hPct, drawPct: dPct, awayPct: aPct };
            }
          } catch {}

          return {
            id: item.id,
            type: "MOTD",
            badge: derbyName ? `${derbyName.toUpperCase()} • MOTD` : "MATCH OF THE DAY",
            category: "Match",
            tabLabel: "Match of the Day",
            title: `${homeGamerTag} vs ${awayGamerTag}`,
            subtitle: `Featured showdown in ${motdMatch.division} (${motdMatch.round}). Standings: #${homeRank} (${homePoints} pts) vs #${awayRank} (${awayPoints} pts).`,
            description: item.description,
            featuredImage: resolveSlideFeaturedImage(item),
            buttonText: item.buttonText || "Match Center",
            buttonUrl: item.buttonUrl || `/fixtures?highlight=${motdMatch.id}`,
            publishDate: item.publishDate,
            expirationDate: item.expirationDate,
            data: {
              ...item,
              matchId: motdMatch.id,
              division: motdMatch.division,
              round: motdMatch.round,
              status: motdMatch.status,
              homeScore: motdMatch.homeScore ?? null,
              awayScore: motdMatch.awayScore ?? null,
              homePlayer,
              awayPlayer,
              homeGamerTag,
              awayGamerTag,
              homeTeam,
              awayTeam,
              homeRank,
              awayRank,
              homePoints,
              awayPoints,
              homeForm,
              awayForm,
              derbyName,
              motdHeadline,
              formattedKickoffFull,
              pollStats,
            },
          };
        }

        return {
          id: item.id,
          type: "SYSTEM_ANNOUNCEMENT",
          badge: "MATCH OF THE DAY",
          category: item.category || "Match",
          tabLabel: "Match of the Day",
          title: item.title,
          subtitle: item.description,
          description: item.description,
          featuredImage: resolveSlideFeaturedImage(item),
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

      const titleLower = (item.title || "").toLowerCase();
      const descLower = (item.description || "").toLowerCase();
      const isSuperCup =
        item.id?.startsWith("sys-announcement-super-cup") ||
        item.id?.startsWith("sys-super-cup-") ||
        (item as any).data?.competition === "SUPER_CUP" ||
        (item as any).data?.division === "SUPER_CUP" ||
        (item.buttonUrl || "").toLowerCase().includes("super-cup") ||
        (item.buttonUrl || "").toLowerCase().includes("cup=super_cup") ||
        titleLower.includes("super cup") ||
        titleLower.includes("supercup") ||
        descLower.includes("super cup") ||
        descLower.includes("supercup") ||
        (item.category && item.category.toLowerCase().includes("super"));

      if (isSuperCup) {
        const scMatch = superCupOverviewData?.superCupMatch;
        const homePlayer = scMatch?.homePlayer || superCupOverviewData?.uclChampion || null;
        const awayPlayer = scMatch?.awayPlayer || superCupOverviewData?.europaChampion || null;
        const isMatchFinished = scMatch?.status === "FINISHED";
        const isMatchLive = scMatch?.status === "LIVE";
        const homeScore = scMatch?.homeScore ?? null;
        const awayScore = scMatch?.awayScore ?? null;
        const winner = isMatchFinished
          ? ((homeScore ?? 0) > (awayScore ?? 0) ? homePlayer : (awayScore ?? 0) > (homeScore ?? 0) ? awayPlayer : null)
          : null;

        const kickoffDate = scMatch?.matchDate;
        const formattedKickoffDate = kickoffDate
          ? formatRwandanDate(kickoffDate, { weekday: "short", month: "short", day: "numeric" })
          : null;
        const formattedKickoffTime = kickoffDate ? formatRwandanTime(kickoffDate) : null;
        const formattedKickoffFull = formattedKickoffDate && formattedKickoffTime
          ? `${formattedKickoffDate} • ${formattedKickoffTime} (CAT)`
          : null;

        let badge = "UEFA SUPER CUP";
        if (isMatchFinished) badge = "SUPER CUP CONCLUDED";
        else if (isMatchLive) badge = "LIVE SUPER CUP FINAL";
        else if (homePlayer && awayPlayer) badge = "SUPER CUP SHOWDOWN";

        let defaultTitle = item.title;
        if (isMatchFinished && winner) {
          defaultTitle = `🏆 ${winner.gamerTag} Wins The UEFA Super Cup!`;
        } else if (isMatchLive && homePlayer && awayPlayer) {
          defaultTitle = `LIVE: ${homePlayer.gamerTag} vs ${awayPlayer.gamerTag} • UEFA Super Cup`;
        } else if (homePlayer && awayPlayer && (!item.title || item.title.includes("Confirmed") || item.title.includes("UEFA Super Cup:"))) {
          defaultTitle = `🏆 UEFA Super Cup: ${homePlayer.gamerTag} vs ${awayPlayer.gamerTag}`;
        }

        return {
          id: item.id,
          type: "SUPER_CUP",
          badge,
          category: "Super Cup",
          tabLabel: "Super Cup",
          title: defaultTitle || "UEFA Super Cup Showdown",
          subtitle: isMatchFinished
            ? `Final Score: ${homePlayer?.gamerTag || "UCL"} ${homeScore ?? 0} - ${awayScore ?? 0} ${awayPlayer?.gamerTag || "Europa"}. Continental supremacy decided.`
            : homePlayer && awayPlayer
            ? `UCL Champion @${homePlayer.gamerTag} vs Europa League Champion @${awayPlayer.gamerTag} for the ultimate trophy.`
            : item.description || "The Ultimate Clash of Continental Champions",
          description: item.description,
          featuredImage: resolveSlideFeaturedImage(item),
          buttonText: isMatchFinished
            ? "Super Cup History"
            : isMatchLive
            ? "Enter Live Match Center"
            : item.buttonText || "Predict & Enter Super Cup",
          buttonUrl: item.buttonUrl || "/dashboard?tab=INTERDIVISION_CUPS&cup=SUPER_CUP",
          publishDate: item.publishDate,
          expirationDate: item.expirationDate,
          data: {
            ...item,
            isSuperCup: true,
            matchId: scMatch?.id,
            matchStatus: scMatch?.status || (superCupOverviewData?.bothConfirmed ? "SCHEDULED" : "AWAITING"),
            matchDate: scMatch?.matchDate,
            formattedKickoffDate,
            formattedKickoffTime,
            formattedKickoffFull,
            homePlayer,
            awayPlayer,
            uclChampion: superCupOverviewData?.uclChampion || homePlayer,
            europaChampion: superCupOverviewData?.europaChampion || awayPlayer,
            homeScore,
            awayScore,
            winner,
            pollStats: superCupOverviewData?.pollStats || {
              totalVotes: 0,
              f1Votes: 0,
              f2Votes: 0,
              f1Pct: 50,
              f2Pct: 50,
            },
            trophyImage: "/assets/trophies/super-cup.png",
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
    })
  )
).filter(Boolean) as CarouselSlide[];

    // Ensure Super Cup slide is always present if fixture exists or both finalists are confirmed
    if (
      !slides.some((s) => s.type === "SUPER_CUP") &&
      (superCupOverviewData?.superCupMatch || superCupOverviewData?.bothConfirmed)
    ) {
      const scMatch = superCupOverviewData?.superCupMatch;
      const homePlayer = scMatch?.homePlayer || superCupOverviewData?.uclChampion || null;
      const awayPlayer = scMatch?.awayPlayer || superCupOverviewData?.europaChampion || null;
      const isMatchFinished = scMatch?.status === "FINISHED";
      const isMatchLive = scMatch?.status === "LIVE";
      const homeScore = scMatch?.homeScore ?? null;
      const awayScore = scMatch?.awayScore ?? null;
      const winner = isMatchFinished
        ? ((homeScore ?? 0) > (awayScore ?? 0) ? homePlayer : (awayScore ?? 0) > (homeScore ?? 0) ? awayPlayer : null)
        : null;

      const kickoffDate = scMatch?.matchDate;
      const formattedKickoffDate = kickoffDate
        ? formatRwandanDate(kickoffDate, { weekday: "short", month: "short", day: "numeric" })
        : null;
      const formattedKickoffTime = kickoffDate ? formatRwandanTime(kickoffDate) : null;
      const formattedKickoffFull = formattedKickoffDate && formattedKickoffTime
        ? `${formattedKickoffDate} • ${formattedKickoffTime} (CAT)`
        : null;

      let badge = "UEFA SUPER CUP";
      if (isMatchFinished) badge = "SUPER CUP CONCLUDED";
      else if (isMatchLive) badge = "LIVE SUPER CUP FINAL";
      else if (homePlayer && awayPlayer) badge = "SUPER CUP SHOWDOWN";

      const title = isMatchFinished && winner
        ? `🏆 ${winner.gamerTag} Wins The UEFA Super Cup!`
        : isMatchLive && homePlayer && awayPlayer
        ? `LIVE: ${homePlayer.gamerTag} vs ${awayPlayer.gamerTag} • UEFA Super Cup`
        : homePlayer && awayPlayer
        ? `🏆 UEFA Super Cup: ${homePlayer.gamerTag} vs ${awayPlayer.gamerTag}`
        : "🏆 UEFA Super Cup: Clash of Champions";

      slides.unshift({
        id: scMatch ? `sys-super-cup-${scMatch.id}` : "sys-super-cup-showdown",
        type: "SUPER_CUP",
        badge,
        category: "Super Cup",
        tabLabel: "Super Cup",
        title,
        subtitle: isMatchFinished
          ? `Final Result: ${homePlayer?.gamerTag} ${homeScore ?? 0} - ${awayScore ?? 0} ${awayPlayer?.gamerTag}. The Super Cup has been lifted!`
          : homePlayer && awayPlayer
          ? `UCL Winner @${homePlayer.gamerTag} vs Europa League Winner @${awayPlayer.gamerTag}. Single-match showdown for continental supremacy.`
          : "The supreme clash of champions between UEFA Champions League Winner and UEFA Europa League Winner.",
        description: "Official single-match final between confirmed Champions League and Europa League winners.",
        featuredImage: "/images/super-cup-bg.jpg",
        buttonText: isMatchFinished ? "Super Cup History" : isMatchLive ? "Enter Live Match Center" : "Predict & Enter Super Cup",
        buttonUrl: "/dashboard?tab=INTERDIVISION_CUPS&cup=SUPER_CUP",
        publishDate: new Date(),
        expirationDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        data: {
          isSuperCup: true,
          matchId: scMatch?.id,
          matchStatus: scMatch?.status || (superCupOverviewData?.bothConfirmed ? "SCHEDULED" : "AWAITING"),
          matchDate: scMatch?.matchDate,
          formattedKickoffDate,
          formattedKickoffTime,
          formattedKickoffFull,
          homePlayer,
          awayPlayer,
          uclChampion: superCupOverviewData?.uclChampion || homePlayer,
          europaChampion: superCupOverviewData?.europaChampion || awayPlayer,
          homeScore,
          awayScore,
          winner,
          pollStats: superCupOverviewData?.pollStats || {
            totalVotes: 0,
            f1Votes: 0,
            f2Votes: 0,
            f1Pct: 50,
            f2Pct: 50,
          },
          trophyImage: "/assets/trophies/super-cup.png",
        },
      });
    }

    // Final safety check: guarantee no league standings reset or locked-competition news ever appears
    const prioritizedSlides = slides.filter((slide) => {
      if (isStandingsResetAnnouncement(slide)) return false;

      const titleLower = (slide.title || "").toLowerCase();
      const descLower = (slide.description || "").toLowerCase();
      const isSuperCup =
        slide.type === "SUPER_CUP" ||
        (slide.category && slide.category.toLowerCase().includes("super")) ||
        (slide.badge && slide.badge.toLowerCase().includes("super")) ||
        titleLower.includes("super cup") ||
        titleLower.includes("supercup") ||
        descLower.includes("super cup") ||
        descLower.includes("supercup");

      // Super Cup slides are NEVER blocked by UCL/Europa locks!
      if (isSuperCup) return true;

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

    return prioritizedSlides.sort((a, b) => {
      const getPriority = (s: CarouselSlide) => {
        if (s.type === "SUPER_CUP") return 100;
        if (s.type === "DERBY") return 96;
        if (s.type === "MOTW") return 95;
        if (s.type === "MOTD") return 90;
        if (s.type === "MOTD_RESULT") return 85;
        if (s.type === "SYSTEM_ANNOUNCEMENT") return 80;
        if (s.type === "LEAGUE_TABLE") return 70;
        return 50;
      };
      const diff = getPriority(b) - getPriority(a);
      if (diff !== 0) return diff;
      const dateA = a.publishDate ? new Date(a.publishDate).getTime() : 0;
      const dateB = b.publishDate ? new Date(b.publishDate).getTime() : 0;
      return dateB - dateA;
    });
  } catch (error) {
    console.error("[getCarouselSlides] Error assembling carousel data:", error);
    return [];
  }
}
