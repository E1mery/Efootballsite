import { prisma } from "@/lib/prisma";
import MatchCard from "@/components/MatchCard";
import MatchOfTheDayCard from "@/components/MatchOfTheDayCard";
import { Calendar, Gamepad2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function FixturesPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; division?: string }>;
}) {
  const params = await searchParams;
  const filter = params.filter || "ALL";
  const division = params.division || "ALL";

  let whereClause: any = {};
  if (filter === "LIVE") whereClause.status = "LIVE";
  else if (filter === "FINISHED") whereClause.status = { in: ["FINISHED", "FORFEIT"] };
  else if (filter === "SCHEDULED") whereClause.status = "SCHEDULED";

  if (division !== "ALL") {
    whereClause.division = division;
  }

  let matches: any[] = [];
  let leagueConfig: any = { currentMatchday: 1 };
  let storedMotd: any = null;
  let allStandings: any[] = [];

  try {
    const results = await Promise.all([
      prisma.match.findMany({
        where: whereClause,
        include: {
          homePlayer: true,
          awayPlayer: true,
        },
        orderBy: { matchDate: "desc" },
      }),
      prisma.leagueConfig.upsert({
        where: { id: "default" },
        update: {},
        create: { id: "default", currentMatchday: 1 },
      }),
      prisma.match.findFirst({
        where: { isMatchOfTheDay: true },
        include: { homePlayer: true, awayPlayer: true },
      }),
      prisma.standing.findMany({
        orderBy: [{ points: "desc" }, { goalDifference: "desc" }],
      }),
    ]);

    matches = results[0];
    leagueConfig = results[1];
    storedMotd = results[2];
    allStandings = results[3];

    const currentRoundNum = leagueConfig?.currentMatchday || 1;
    if (!storedMotd && currentRoundNum > 1) {
      const { evaluateMatchOfTheDay } = await import("@/lib/matchOfTheDay");
      const roundMatches = await prisma.match.findMany({
        where: { round: `Matchday ${currentRoundNum}` },
        include: { homePlayer: true, awayPlayer: true },
      });
      storedMotd = evaluateMatchOfTheDay(roundMatches, allStandings, currentRoundNum);
    }
  } catch (error) {
    console.error("Fixtures fetch error:", error);
  }

  const matchOfTheDay = storedMotd;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {matchOfTheDay && currentRoundNum > 1 && (
        <section className="space-y-2">
          <MatchOfTheDayCard match={matchOfTheDay} />
        </section>
      )}
      {/* Header */}
      <div className="border-b border-slate-800 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="yellow">EFRL 2026</Badge>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Schedule & Results across 3 Divisions
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black uppercase text-white tracking-tight">
            Fixtures & Match Results
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Follow official eFootball player matches, final scores, and walkover forfeit records.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-900/80 p-1.5 rounded-xl border border-slate-800">
          <a
            href="/fixtures?filter=ALL"
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filter === "ALL"
                ? "bg-sky-500 text-white shadow-md shadow-sky-500/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            All
          </a>
          <a
            href="/fixtures?filter=LIVE"
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filter === "LIVE"
                ? "bg-red-500 text-white shadow-md shadow-red-500/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Live
          </a>
          <a
            href="/fixtures?filter=FINISHED"
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filter === "FINISHED"
                ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Results
          </a>
          <a
            href="/fixtures?filter=SCHEDULED"
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filter === "SCHEDULED"
                ? "bg-yellow-500 text-slate-950 shadow-md shadow-yellow-500/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Upcoming
          </a>
        </div>
      </div>

      {/* Matches Grid */}
      {matches.length === 0 ? (
        <div className="text-center py-16 border border-slate-800 rounded-2xl bg-slate-900/40">
          <Gamepad2 className="h-10 w-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 font-semibold">No matches found for this filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {matches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      )}
    </div>
  );
}
