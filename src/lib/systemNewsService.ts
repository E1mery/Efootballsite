import { prisma } from "@/lib/prisma";
import { ensureNewsTable } from "@/lib/ensureNewsTable";

/**
 * Automatically creates and publishes an official system news update in the database.
 * If a published article with the same title is already active, avoids duplicates.
 */
export async function autoPublishSystemNews(params: {
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

    // Prevent duplicate active system posts with the same title
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
 * Inspects real league state and automatically dispatches automated system news/updates
 * to the carousel and database.
 */
export async function syncSystemNewsToCarousel() {
  const createdOrFound: any[] = [];
  try {
    await ensureNewsTable();
    const now = new Date();

    const [leagueConfig, motdMatch, latestFinishedMatch, standingCount] = await Promise.all([
      prisma.leagueConfig.findUnique({ where: { id: "default" } }),
      prisma.match.findFirst({
        where: { isMatchOfTheDay: true, status: { in: ["SCHEDULED", "LIVE"] } },
        include: { homePlayer: true, awayPlayer: true },
      }),
      prisma.match.findFirst({
        where: { isMatchOfTheDay: true, status: "FINISHED" },
        include: { homePlayer: true, awayPlayer: true },
        orderBy: { matchDate: "desc" },
      }),
      prisma.standing.count(),
    ]);

    // 1. Auto-send Match of the Day news update
    if (motdMatch && motdMatch.homePlayer && motdMatch.awayPlayer) {
      const motdNews = await autoPublishSystemNews({
        title: `Match of the Day: ${motdMatch.homePlayer.gamerTag} vs ${motdMatch.awayPlayer.gamerTag}`,
        category: "Match",
        description: `Featured showdown in ${motdMatch.division} (${motdMatch.round}). Matches must be scheduled and concluded inside the 24-hour cycle window.`,
        featuredImage: motdMatch.homePlayer.avatar || motdMatch.awayPlayer.avatar || "/images/carousel-stadium-bg.jpg",
        buttonText: "Match Center",
        buttonUrl: `/fixtures?highlight=${motdMatch.id}`,
        durationDays: 1, // 24-hour matchday window
      });
      if (motdNews) createdOrFound.push(motdNews);
    }

    // 2. Auto-send latest MOTD Concluded Result if recent
    if (latestFinishedMatch && latestFinishedMatch.homePlayer && latestFinishedMatch.awayPlayer) {
      const homeScore = latestFinishedMatch.homeScore ?? 0;
      const awayScore = latestFinishedMatch.awayScore ?? 0;
      const winner =
        homeScore > awayScore
          ? latestFinishedMatch.homePlayer.gamerTag
          : awayScore > homeScore
          ? latestFinishedMatch.awayPlayer.gamerTag
          : "Stalemate Draw";

      const resultNews = await autoPublishSystemNews({
        title: `Result: ${latestFinishedMatch.homePlayer.gamerTag} ${homeScore} - ${awayScore} ${latestFinishedMatch.awayPlayer.gamerTag}`,
        category: "Match",
        description: `Official MOTD concluded in ${latestFinishedMatch.division}. Result: ${winner}. Full league standings have been updated with verified statistics.`,
        featuredImage: latestFinishedMatch.homePlayer.avatar || "/images/carousel-stadium-bg.jpg",
        buttonText: "View Standings",
        buttonUrl: "/standings",
        durationDays: 2,
      });
      if (resultNews) createdOrFound.push(resultNews);
    }

    // 3. Auto-send Season Registration announcement if open
    if (leagueConfig?.registrationOpen) {
      const regNews = await autoPublishSystemNews({
        title: `${leagueConfig.season} Athlete Registration Now Active`,
        category: "Registration",
        description: `Official enrollment is open for Division 1, Division 2, and Division 3. Complete registration to secure club team assignment and WhatsApp match scheduling access.`,
        featuredImage: "/images/carousel-stadium-bg.jpg",
        buttonText: "Register Athlete",
        buttonUrl: "/register",
        durationDays: 7,
      });
      if (regNews) createdOrFound.push(regNews);
    }

    // 4. Auto-send Matchday Cycle updates if active
    if (leagueConfig && leagueConfig.currentMatchday) {
      const roundNews = await autoPublishSystemNews({
        title: `${leagueConfig.season} • Matchday ${leagueConfig.currentMatchday} Fixtures Active`,
        category: "Competition",
        description: `All divisions have active 24-hour matchday cycles. Athletes must coordinate room matches via WhatsApp and submit screenshot proofs before midnight.`,
        featuredImage: "/images/carousel-stadium-bg.jpg",
        buttonText: "View Fixtures",
        buttonUrl: "/fixtures",
        durationDays: 1,
      });
      if (roundNews) createdOrFound.push(roundNews);
    }
  } catch (err) {
    console.error("[syncSystemNewsToCarousel] Error:", err);
  }
  return createdOrFound;
}
