import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { redirectAdminToPortal } from "@/lib/adminGuard";
import { getHallOfFameStats } from "@/lib/hallOfFameStatsService";
import HallOfFameClient from "./HallOfFameClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Hall of Fame | Rwanda eFootball League",
  description:
    "Official museum and statistical record of Rwandan eFootball champions, all-time record holders, and legendary esports athletes.",
};

export default async function HallOfFamePage() {
  await redirectAdminToPortal();

  let hallOfFameEntries: any[] = [];
  let stats: any = null;
  let leagueConfig: any = null;
  let tournaments: any[] = [];

  try {
    const [entriesData, statsData, configData, tournamentsData] = await Promise.all([
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
    ]);

    hallOfFameEntries = entriesData;
    stats = statsData;
    leagueConfig = configData;
    tournaments = tournamentsData;
  } catch (error) {
    console.error("HallOfFame page data fetch error:", error);
  }

  // Calculate dynamic trophy cabinet data from real DB entries & tournaments
  const competitionMap = new Map<string, { winners: Set<string>; seasons: Set<string>; latestChampion?: string }>();

  // Ensure primary canonical competitions exist
  const defaultComps = ["Division 1", "UCL", "EUROPA", "Division 2", "Division 3"];
  defaultComps.forEach((c) => {
    competitionMap.set(c, { winners: new Set(), seasons: new Set() });
  });

  // Track tournaments from DB
  tournaments.forEach((t) => {
    let compKey = t.name;
    const upper = t.name.toUpperCase();
    if (upper.includes("DIVISION 1") || upper.includes("PREMIER")) compKey = "Division 1";
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
    const upper = entry.tournamentName.toUpperCase();
    if (upper.includes("DIVISION 1") || upper.includes("PREMIER")) compKey = "Division 1";
    else if (upper.includes("DIVISION 2")) compKey = "Division 2";
    else if (upper.includes("DIVISION 3")) compKey = "Division 3";
    else if (upper.includes("UCL") || upper.includes("CHAMPIONS")) compKey = "UCL";
    else if (upper.includes("EUROPA")) compKey = "EUROPA";

    if (!competitionMap.has(compKey)) {
      competitionMap.set(compKey, { winners: new Set(), seasons: new Set() });
    }
    const item = competitionMap.get(compKey)!;
    item.winners.add(entry.championName);
    if (entry.season) item.seasons.add(entry.season);
    if (!item.latestChampion) {
      item.latestChampion = entry.championName;
    }
  });

  const competitionCabinetData = Array.from(competitionMap.entries()).map(([comp, data]) => ({
    competition: comp,
    displayName:
      comp === "Division 1"
        ? "Division 1 (Premiership)"
        : comp === "UCL"
        ? "Champions League (UCL)"
        : comp === "EUROPA"
        ? "Europa League"
        : comp,
    winnersCount: data.winners.size,
    seasonsCount: data.seasons.size,
    latestChampion: data.latestChampion || null,
  }));

  const currentSeasonName = leagueConfig?.season || "Current Season";

  return (
    <div className="relative min-h-screen bg-background text-foreground pb-20 selection:bg-secondary/30 selection:text-secondary">
      {/* Client Component with all designed sections */}
      <HallOfFameClient
        entries={hallOfFameEntries}
        stats={stats}
        trophyCabinet={competitionCabinetData}
        currentSeasonName={currentSeasonName}
      />
    </div>
  );
}
