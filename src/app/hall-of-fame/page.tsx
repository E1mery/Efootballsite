import { Metadata } from "next";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { redirectAdminToPortal } from "@/lib/adminGuard";
import { getHallOfFameStats, enrichAndSyncHallOfFameEntries } from "@/lib/hallOfFameStatsService";
import { BRANDING_ASSETS } from "@/lib/assets.config";
import HallOfFameClient from "./HallOfFameClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Hall of Fame | Rwanda eFootball League",
  description:
    "Official museum and statistical record of Rwandan eFootball champions, all-time record holders, and legendary esports athletes.",
};

export default async function HallOfFamePage() {
  await redirectAdminToPortal();

  // Auto-sync any completed Super Cup match winner to Hall of Fame
  try {
    const { syncSuperCupWinnerToHallOfFame } = await import("@/lib/superCupService");
    await syncSuperCupWinnerToHallOfFame();
  } catch (err) {
    console.error("Super Cup auto-sync error:", err);
  }

  let hallOfFameEntries: any[] = [];
  let stats: any = null;
  let leagueConfig: any = null;
  let tournaments: any[] = [];

  try {
    const [entriesData, statsData, configData, tournamentsData, finishedSuperCup] = await Promise.all([
      prisma.hallOfFame.findMany({
        orderBy: [{ season: "desc" }, { createdAt: "desc" }],
      }),
      getHallOfFameStats(false),
      prisma.leagueConfig.findUnique({
        where: { id: "default" },
      }),
      prisma.tournament.findMany({
        select: { id: true, name: true, season: true, format: true, type: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.match.findFirst({
        where: {
          OR: [
            { division: "SUPER_CUP" },
            { round: { contains: "Super Cup", mode: "insensitive" } },
          ],
          status: { in: ["FINISHED", "FORFEIT"] },
          homeScore: { not: null },
          awayScore: { not: null },
        },
        include: { homePlayer: true, awayPlayer: true, tournament: true },
        orderBy: { updatedAt: "desc" },
      }),
    ]);

    hallOfFameEntries = await enrichAndSyncHallOfFameEntries(entriesData);

    // Fallback: If a Super Cup match is finished in Match table but not in HallOfFame table yet
    if (finishedSuperCup && finishedSuperCup.homePlayer && finishedSuperCup.awayPlayer) {
      const hScore = finishedSuperCup.aggregateHomeScore ?? finishedSuperCup.homeScore ?? 0;
      const aScore = finishedSuperCup.aggregateAwayScore ?? finishedSuperCup.awayScore ?? 0;
      if (hScore !== aScore) {
        const winner = hScore > aScore ? finishedSuperCup.homePlayer : finishedSuperCup.awayPlayer;
        const runnerUp = hScore > aScore ? finishedSuperCup.awayPlayer : finishedSuperCup.homePlayer;
        const scSeason = finishedSuperCup.tournament?.season || configData?.season || "Season 1 (2026)";

        const hasScEntry = hallOfFameEntries.some(
          (e) =>
            (e.trophyType === "SUPER_CUP" || e.tournamentName?.toUpperCase().includes("SUPER")) &&
            e.championName?.toLowerCase() === winner.gamerTag.toLowerCase()
        );

        if (!hasScEntry) {
          hallOfFameEntries.unshift({
            id: `temp-supercup-${finishedSuperCup.id}`,
            tournamentName: "UEFA Super Cup",
            season: scSeason,
            championName: winner.gamerTag,
            championRealName: winner.fullName,
            playerImage: winner.avatar && !winner.avatar.includes("dicebear.com") ? winner.avatar : null,
            runnerUp: runnerUp.gamerTag,
            trophyType: "SUPER_CUP",
            prizeWon: "1,500,000 RWF + Super Cup Trophy",
            notes: `Winner of the ${scSeason} UEFA Super Cup`,
            playerId: winner.id,
            isInducted: true,
            isFeatured: true,
            createdAt: finishedSuperCup.updatedAt || new Date(),
          });
        }
      }
    }

    stats = statsData;
    leagueConfig = configData;
    tournaments = tournamentsData;
  } catch (error) {
    console.error("HallOfFame page data fetch error:", error);
  }

  // Calculate dynamic trophy cabinet data from real DB entries & tournaments
  const competitionMap = new Map<
    string,
    {
      winners: Set<string>;
      seasons: Set<string>;
      latestChampion?: string;
      latestChampionAvatar?: string | null;
      latestChampionRealName?: string | null;
      latestChampionSeason?: string | null;
    }
  >();

  // Ensure primary canonical competitions exist
  const defaultComps = ["Division 1", "UCL", "EUROPA", "Division 2", "Division 3", "SUPER_CUP"];
  defaultComps.forEach((c) => {
    competitionMap.set(c, { winners: new Set(), seasons: new Set() });
  });

  // Track tournaments from DB
  tournaments.forEach((t) => {
    let compKey = t.name;
    const upper = t.name.toUpperCase();
    if (upper.includes("SUPER")) compKey = "SUPER_CUP";
    else if (upper.includes("DIVISION 1") || upper.includes("PREMIER")) compKey = "Division 1";
    else if (upper.includes("DIVISION 2")) compKey = "Division 2";
    else if (upper.includes("DIVISION 3")) compKey = "Division 3";
    else if (upper.includes("UCL") || upper.includes("CHAMPIONS")) compKey = "UCL";
    else if (upper.includes("EUROPA")) compKey = "EUROPA";

    if (!competitionMap.has(compKey)) {
      competitionMap.set(compKey, { winners: new Set(), seasons: new Set() });
    }
    const item = competitionMap.get(compKey)!;
    if (t.season) item.seasons.add(t.season);
  });

  // Populate winners from HallOfFame table
  hallOfFameEntries.forEach((entry) => {
    let compKey = entry.tournamentName;
    const upper = (entry.tournamentName || "").toUpperCase();
    const trophyUpper = (entry.trophyType || "").toUpperCase();

    if (upper.includes("SUPER") || trophyUpper.includes("SUPER") || trophyUpper === "SUPER_CUP") compKey = "SUPER_CUP";
    else if (upper.includes("DIVISION 1") || upper.includes("PREMIER")) compKey = "Division 1";
    else if (upper.includes("DIVISION 2")) compKey = "Division 2";
    else if (upper.includes("DIVISION 3")) compKey = "Division 3";
    else if (upper.includes("UCL") || upper.includes("CHAMPIONS") || trophyUpper === "UCL") compKey = "UCL";
    else if (upper.includes("EUROPA") || trophyUpper === "EUROPA") compKey = "EUROPA";

    if (!competitionMap.has(compKey)) {
      competitionMap.set(compKey, { winners: new Set(), seasons: new Set() });
    }
    const item = competitionMap.get(compKey)!;
    item.winners.add(entry.championName);
    if (entry.season) item.seasons.add(entry.season);
    if (!item.latestChampion) {
      item.latestChampion = entry.championName;
      item.latestChampionAvatar = entry.playerImage || null;
      item.latestChampionRealName = entry.championRealName || null;
      item.latestChampionSeason = entry.season || null;
    }
  });

  // Canonical display order requested: Division 1, Division 2, Division 3, Europa, UCL, Super Cup
  const orderedKeys = ["Division 1", "Division 2", "Division 3", "EUROPA", "UCL", "SUPER_CUP"];

  const competitionCabinetData = Array.from(competitionMap.entries())
    .map(([comp, data]) => ({
      competition: comp,
      displayName:
        comp === "Division 1"
          ? "Division 1 (Premiership)"
          : comp === "Division 2"
          ? "Division 2"
          : comp === "Division 3"
          ? "Division 3"
          : comp === "EUROPA"
          ? "Europa League"
          : comp === "UCL"
          ? "Champions League (UCL)"
          : comp === "SUPER_CUP"
          ? "UEFA Super Cup"
          : comp,
      winnersCount: data.winners.size,
      seasonsCount: data.seasons.size,
      latestChampion: data.latestChampion || null,
      latestChampionAvatar: data.latestChampionAvatar || null,
      latestChampionRealName: data.latestChampionRealName || null,
      latestChampionSeason: data.latestChampionSeason || null,
    }))
    .sort((a, b) => {
      const indexA = orderedKeys.indexOf(a.competition);
      const indexB = orderedKeys.indexOf(b.competition);
      const posA = indexA === -1 ? 99 : indexA;
      const posB = indexB === -1 ? 99 : indexB;
      return posA - posB;
    });

  const currentSeasonName = leagueConfig?.season || "Current Season";

  return (
    <div className="relative min-h-screen bg-background text-foreground pb-20 selection:bg-secondary/30 selection:text-secondary overflow-hidden">
      {/* Hall of Fame Esports Arena & Trophy Background */}
      <div
        className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
        aria-hidden="true"
      >
        <Image
          src={BRANDING_ASSETS.hallOfFameBg}
          alt="Rwanda eFootball Hall of Fame Arena Background"
          fill
          priority
          sizes="100vw"
          className="object-cover object-top sm:object-center opacity-35 sm:opacity-45 scale-105"
        />
        {/* Cinematic Vignette & Ambient Gradient Overlays for readable contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/40 to-background/95" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-background/80" />
        <div className="absolute inset-0 bg-hero-glow opacity-50" />
      </div>

      {/* Main Content */}
      <div className="relative z-10">
        <HallOfFameClient
          entries={hallOfFameEntries}
          stats={stats}
          trophyCabinet={competitionCabinetData}
          currentSeasonName={currentSeasonName}
        />
      </div>
    </div>
  );
}
