import { prisma } from "@/lib/prisma";
import StandingsTable from "@/components/StandingsTable";
import { Trophy, ShieldCheck, Flame, Info, AlertTriangle, ArrowDown, ArrowUp, Gamepad2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { redirectAdminToPortal } from "@/lib/adminGuard";

export const dynamic = "force-dynamic";

export default async function StandingsPage({
  searchParams,
}: {
  searchParams: Promise<{ division?: string }>;
}) {
  await redirectAdminToPortal();
  const params = await searchParams;
  const currentDivision = params.division || "Division 1";

  // Fetch standings for selected division with player profile and team
  let standings: any[] = [];
  try {
    standings = await prisma.standing.findMany({
      where: { division: currentDivision },
      include: {
        player: true,
      },
      orderBy: [{ points: "desc" }, { goalDifference: "desc" }, { goalsFor: "desc" }],
      take: 20, // Strict 20 players cap per division
    });
  } catch (error) {
    console.error("Standings fetch error:", error);
  }

  const totalGoals = standings.reduce((acc, curr) => acc + (curr.goalsFor || 0), 0);
  const bestPlayer = standings[0];
  const flaggedPlayers = standings.filter(
    (s) => (s.consecutiveMissed || 0) >= 3 || s.isDisqualified
  );

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="border-b border-slate-800 pb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="yellow">SEASON 2026</Badge>
              <Badge variant="default">ESPORTS VIDEO GAME CHAMPIONSHIP</Badge>
              <Badge variant="secondary">MAX 20 PLAYERS / DIVISION</Badge>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black uppercase text-white tracking-tight flex items-center gap-3">
              <span>eFootball Rwanda 3 Divisions</span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Live competitive rankings for eFootball esports athletes across Rwanda.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-2 text-right">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Division Athletes</span>
              <span className="text-lg font-black text-sky-400">{standings.length} / 20 Max</span>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-2 text-right">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Division Goals</span>
              <span className="text-lg font-black text-yellow-400">{totalGoals}</span>
            </div>
          </div>
        </div>

        {/* Division Selector Tabs */}
        <div className="mt-6 flex items-center gap-2 bg-slate-900/90 p-1.5 rounded-xl border border-slate-800 w-full sm:w-fit overflow-x-auto no-scrollbar scroll-smooth">
          <a
            href="/standings?division=Division%201"
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all shrink-0 whitespace-nowrap ${
              currentDivision === "Division 1"
                ? "bg-sky-500 text-white shadow-lg shadow-sky-500/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Trophy className="h-4 w-4" />
            <span>1st Division (Premiership)</span>
          </a>
          <a
            href="/standings?division=Division%202"
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all shrink-0 whitespace-nowrap ${
              currentDivision === "Division 2"
                ? "bg-sky-500 text-white shadow-lg shadow-sky-500/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Gamepad2 className="h-4 w-4" />
            <span>2nd Division (Championship)</span>
          </a>
          <a
            href="/standings?division=Division%203"
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all shrink-0 whitespace-nowrap ${
              currentDivision === "Division 3"
                ? "bg-sky-500 text-white shadow-lg shadow-sky-500/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            <span>3rd Division (National Academy)</span>
          </a>
          <a
            href="/continental"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all shrink-0 whitespace-nowrap text-indigo-400 hover:text-white hover:bg-indigo-950/40 border border-indigo-500/30"
          >
            <Trophy className="h-4 w-4 text-indigo-400" />
            <span>eFootball UCL Groups</span>
          </a>
          <a
            href="/continental"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all shrink-0 whitespace-nowrap text-amber-400 hover:text-white hover:bg-amber-950/40 border border-amber-500/30"
          >
            <Flame className="h-4 w-4 text-amber-400" />
            <span>eFootball Europa Groups</span>
          </a>
        </div>
      </div>

      {/* Disqualification / Forfeit Notice if any in this division */}
      {flaggedPlayers.length > 0 && (
        <div className="rounded-xl border border-red-500/50 bg-red-950/30 p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <h4 className="font-bold text-red-300 uppercase tracking-wide">
              Official Forfeit Disqualification Notice
            </h4>
            <p className="text-slate-300">
              Player{" "}
              <strong className="text-white">
                {flaggedPlayers.map((f) => f.player.gamerTag).join(", ")}
              </strong>{" "}
              has been disqualified for missing 3 consecutive scheduled matches without administrative waiver. The slot is subject to replacement by the League Administrator.
            </p>
          </div>
        </div>
      )}

      {/* Standings Table Component */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-2 sm:p-4 shadow-xl">
        <StandingsTable
          standings={standings}
          divisionName={currentDivision}
          compact={false}
        />
      </div>

      {/* League Rules Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* UCL Qualification */}
        <div className="rounded-xl border border-sky-500/30 bg-slate-900/40 p-5 space-y-2">
          <div className="flex items-center gap-2 text-sky-400 font-bold text-sm">
            <Trophy className="h-4 w-4" />
            <span>eFootball UCL League</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {currentDivision === "Division 1"
              ? "Top 8 players qualify directly for the prestigious 16-player eFootball Champions League."
              : "Top 4 players qualify for the prestigious 16-player eFootball Champions League."}
          </p>
        </div>

        {/* Europa League */}
        <div className="rounded-xl border border-amber-500/30 bg-slate-900/40 p-5 space-y-2">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
            <Flame className="h-4 w-4" />
            <span>eFootball Europa League</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {currentDivision === "Division 1"
              ? "Players placed 9th to 12th enter the Europa League knockout cup."
              : "Players placed 5th to 10th enter the Europa League knockout cup."}
          </p>
        </div>

        {/* Relegation */}
        <div className="rounded-xl border border-red-500/30 bg-slate-900/40 p-5 space-y-2">
          <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
            <ArrowDown className="h-4 w-4" />
            <span>Relegation (Last 3)</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {currentDivision === "Division 1"
              ? "All last 3 players (18th, 19th, 20th) are relegated to 2nd Division at end of season."
              : currentDivision === "Division 2"
              ? "All last 3 players (18th, 19th, 20th) are relegated to 3rd Division. (Top 3 promoted to Div 1)."
              : "All last 3 players (18th, 19th, 20th) are relegated to Open District Qualifiers. (Top 3 promoted to Div 2)."}
          </p>
        </div>

        {/* 3 Missed Matches Rule */}
        <div className="rounded-xl border border-yellow-500/30 bg-slate-900/40 p-5 space-y-2">
          <div className="flex items-center gap-2 text-yellow-400 font-bold text-sm">
            <AlertTriangle className="h-4 w-4" />
            <span>3 Missed Matches Rule</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            If any player misses <strong>3 consecutive matches</strong>, they are removed immediately and the admin is notified to replace them with a standby applicant.
          </p>
        </div>
      </div>
    </div>
  );
}
