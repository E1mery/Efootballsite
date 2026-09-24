import { prisma } from "@/lib/prisma";
import StandingsTable from "@/components/StandingsTable";
import { Trophy, ShieldCheck, Flame, Info, AlertTriangle, ArrowDown, ArrowUp, Gamepad2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function StandingsPage(props: {
  searchParams?: Promise<{ division?: string }>;
}) {
  try {
    const params = (props?.searchParams ? await props.searchParams : {}) || {};
    const currentDivision = params.division || "Division 1";

    // Fetch standings for selected division with player profile and team
    let standings: any[] = [];
    let leagueConfig: any = null;
    try {
      const [st, cfg] = await Promise.all([
        prisma.standing.findMany({
          where: { division: currentDivision },
          include: {
            player: true,
          },
          orderBy: [{ points: "desc" }, { goalDifference: "desc" }, { goalsFor: "desc" }],
          take: 20, // Strict 20 players cap per division
        }),
        prisma.leagueConfig.findUnique({ where: { id: "default" } }),
      ]);
      // Defensively ensure only records with populated player relations are included
      standings = (st || []).filter((s: any) => s && s.player);
      leagueConfig = cfg;
    } catch (error) {
      console.error("Standings fetch error:", error);
    }

    const bothLeaguesUnlocked = Boolean(leagueConfig?.uclStarted && leagueConfig?.europaStarted);

    const totalGoals = standings.reduce((acc, curr) => acc + (curr?.goalsFor || 0), 0);
    const flaggedPlayers = standings.filter(
      (s) => Boolean(s && s.player && ((s.consecutiveMissed || 0) >= 3 || s.isDisqualified))
    );

    return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="border-b border-border pb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black uppercase text-white tracking-tight flex items-center gap-3">
              <span>eFootball Rwanda  LIVE Standings</span>
            </h1>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-border bg-card/80 px-4 py-2 text-right">
              <span className="text-xs uppercase font-bold text-muted-foreground block">Division Athletes</span>
              <span className="text-lg font-black text-primary">{standings.length} / 20 Max</span>
            </div>
            <div className="rounded-xl border border-border bg-card/80 px-4 py-2 text-right">
              <span className="text-xs uppercase font-bold text-muted-foreground block">Division Goals</span>
              <span className="text-lg font-black text-secondary">{totalGoals}</span>
            </div>
          </div>
        </div>

        {/* Division Selector Tabs */}
        <div className="mt-6 flex items-center gap-2 bg-card/90 p-1.5 rounded-xl border border-border w-full sm:w-fit overflow-x-auto no-scrollbar scroll-smooth">
          <a
            href="/standings?division=Division%201"
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all shrink-0 whitespace-nowrap ${
              currentDivision === "Division 1"
                ? "bg-primary text-white shadow-lg"
                : "text-muted-foreground hover:text-white"
            }`}
          >
            <Trophy className="h-4 w-4" />
            <span>1st Division (Premiership)</span>
          </a>
          <a
            href="/standings?division=Division%202"
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all shrink-0 whitespace-nowrap ${
              currentDivision === "Division 2"
                ? "bg-primary text-white shadow-lg"
                : "text-muted-foreground hover:text-white"
            }`}
          >
            <Gamepad2 className="h-4 w-4" />
            <span>2nd Division (Championship)</span>
          </a>
          <a
            href="/standings?division=Division%203"
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all shrink-0 whitespace-nowrap ${
              currentDivision === "Division 3"
                ? "bg-primary text-white shadow-lg"
                : "text-muted-foreground hover:text-white"
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            <span>3rd Division (National Academy)</span>
          </a>
          {bothLeaguesUnlocked && (
            <>
              <a
                href="/continental"
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all shrink-0 whitespace-nowrap text-primary hover:text-white hover:bg-primary/40 border border-primary/30"
              >
                <Trophy className="h-4 w-4 text-primary" />
                <span>eFootball UCL Groups</span>
              </a>
              <a
                href="/continental"
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all shrink-0 whitespace-nowrap text-secondary hover:text-white hover:bg-secondary/40 border border-secondary/30"
              >
                <Flame className="h-4 w-4 text-secondary" />
                <span>eFootball Europa Groups</span>
              </a>
            </>
          )}
        </div>
      </div>

      {/* Disqualification / Forfeit Notice if any in this division */}
      {flaggedPlayers.length > 0 && (
        <div className="rounded-xl border border-destructive/50 bg-destructive/30 p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <h4 className="font-bold text-destructive uppercase tracking-wide">
              Official Forfeit Disqualification Notice
            </h4>
            <p className="text-foreground">
              Player{" "}
              <strong className="text-white">
                {flaggedPlayers.map((f) => f.player?.gamerTag || "Athlete").join(", ")}
              </strong>{" "}
              has been disqualified for missing 3 consecutive scheduled matches without administrative waiver. The slot is subject to replacement by the League Administrator.
            </p>
          </div>
        </div>
      )}

      {/* Standings Table Component */}
      <div className="rounded-2xl border border-border bg-card/60 p-2 sm:p-4 shadow-xl">
        <StandingsTable
          standings={standings}
          divisionName={currentDivision}
          compact={false}
        />
      </div>

      {/* League Rules Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* UCL Qualification */}
        <div className="rounded-xl border border-primary/30 bg-card/40 p-5 space-y-2">
          <div className="flex items-center gap-2 text-primary font-bold text-sm">
            <Trophy className="h-4 w-4" />
            <span>eFootball UCL League</span>
          </div>
          <p className="text-xs text-foreground leading-relaxed">
            {currentDivision === "Division 1"
              ? "Top 8 players qualify directly for the prestigious 16-player eFootball Champions League."
              : "Top 4 players qualify for the prestigious 16-player eFootball Champions League."}
          </p>
        </div>

        {/* Europa League */}
        <div className="rounded-xl border border-secondary/30 bg-card/40 p-5 space-y-2">
          <div className="flex items-center gap-2 text-secondary font-bold text-sm">
            <Flame className="h-4 w-4" />
            <span>eFootball Europa League</span>
          </div>
          <p className="text-xs text-foreground leading-relaxed">
            {currentDivision === "Division 1"
              ? "Players placed 9th to 12th enter the Europa League knockout cup."
              : "Players placed 5th to 10th enter the Europa League knockout cup."}
          </p>
        </div>

        {/* Relegation */}
        <div className="rounded-xl border border-destructive/30 bg-card/40 p-5 space-y-2">
          <div className="flex items-center gap-2 text-destructive font-bold text-sm">
            <ArrowDown className="h-4 w-4" />
            <span>Relegation (Bottom 3)</span>
          </div>
          <p className="text-xs text-foreground leading-relaxed">
            {currentDivision === "Division 1"
              ? "The bottom 3 players in Division 1 are officially relegated to Division 2 upon season finalization."
              : currentDivision === "Division 2"
              ? "The bottom 3 players in Division 2 are officially relegated to Division 3. (Top 3 are promoted to Division 1)."
              : "Division 3 is the foundational Academy tier with no lower drop. (Top 3 are promoted to Division 2)."}
          </p>
        </div>

        {/* 3 Missed Matches Rule */}
        <div className="rounded-xl border border-secondary/30 bg-card/40 p-5 space-y-2">
          <div className="flex items-center gap-2 text-secondary font-bold text-sm">
            <AlertTriangle className="h-4 w-4" />
            <span>3 Missed Matches Rule</span>
          </div>
          <p className="text-xs text-foreground leading-relaxed">
            If any player misses <strong>3 consecutive matches</strong>, they are removed immediately and the admin is notified to replace them with a standby applicant.
          </p>
        </div>
      </div>
    </div>
  );
  } catch (renderError: any) {
    console.error("StandingsPage top-level error caught:", renderError);
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Standings Temporarily Updating</h2>
        <p className="text-xs text-slate-400">
          The league standings table is updating. Please click below to refresh.
        </p>
        <a
          href="/standings"
          className="inline-block px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-all shadow-lg shadow-sky-600/30"
        >
          Reload Standings
        </a>
      </div>
    );
  }
}
