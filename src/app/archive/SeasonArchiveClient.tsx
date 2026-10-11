"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Archive,
  Trophy,
  Calendar,
  Layers,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Medal,
  BarChart3,
  Flame,
  CheckCircle2,
} from "lucide-react";
import type {
  SeasonArchiveData,
  SeasonArchiveStandingItem,
  SeasonArchiveFixtureItem,
} from "@/lib/seasonArchiveService";

interface SeasonArchiveClientProps {
  archivedSeasons: {
    seasonName: string;
    archivedAt: string;
    matchesCount: number;
    standingsCount: number;
  }[];
  selectedSeasonData: SeasonArchiveData | null;
  selectedSeasonName: string | null;
}

type ArchiveTab =
  | "OVERVIEW"
  | "STANDINGS"
  | "FIXTURES"
  | "STATISTICS"
  | "CHAMPIONS"
  | "PROMOTION_RELEGATION";

export default function SeasonArchiveClient({
  archivedSeasons,
  selectedSeasonData,
  selectedSeasonName,
}: SeasonArchiveClientProps) {
  const [activeTab, setActiveTab] = useState<ArchiveTab>("OVERVIEW");
  const [selectedComp, setSelectedComp] = useState<string>("ALL");

  // When no season is selected or viewing the directory
  const isViewingSeason = Boolean(selectedSeasonName && selectedSeasonData);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
      {/* Header Banner */}
      <div className="relative rounded-3xl border border-secondary/30 bg-card/80 p-6 sm:p-10 backdrop-blur-xl shadow-2xl overflow-hidden">
        {/* Glow Accent */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-secondary/40 bg-secondary/15 text-secondary text-xs font-black tracking-wider uppercase">
              <Archive className="h-3.5 w-3.5" />
              <span>Official League Archives</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-foreground">
              Season Archive{" "}
              <span className="efootball-gradient-text">
                Dashboard
              </span>
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl font-medium">
              Verified historical competition tables, tournament champions, fixtures, statistics,
              and promotion/relegation records officially sealed in the Rwandan eFootball League.
            </p>
          </div>

          {/* Quick Season Switcher / Counter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            {isViewingSeason && (
              <Link
                href="/archive"
                className="px-4 py-2.5 rounded-xl border border-border bg-card/80 hover:bg-card text-xs font-bold text-muted-foreground hover:text-foreground transition-all flex items-center justify-center gap-2"
              >
                <span>← All Archived Seasons</span>
              </Link>
            )}
            <div className="px-5 py-3 rounded-2xl border border-secondary/30 bg-secondary/10 flex items-center gap-3">
              <Trophy className="h-5 w-5 text-secondary shrink-0" />
              <div>
                <p className="text-xs uppercase font-bold text-muted-foreground tracking-wider">
                  Archived Seasons
                </p>
                <p className="text-lg font-black text-secondary">
                  {archivedSeasons.length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* VIEW A: LIST OF ARCHIVED SEASONS (CARDS) */}
      {!isViewingSeason && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-black text-foreground flex items-center gap-2.5">
              <Calendar className="h-5 w-5 text-secondary" />
              <span>Concluded Seasons Directory</span>
            </h2>
            <span className="text-xs text-muted-foreground font-semibold">
              {archivedSeasons.length} Official Season{archivedSeasons.length === 1 ? "" : "s"}
            </span>
          </div>

          {archivedSeasons.length === 0 ? (
            /* Honest Empty State (Requirement 02 & 03) */
            <div className="rounded-3xl border border-border/80 bg-card/60 p-12 text-center backdrop-blur-xl">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-secondary/10 border border-secondary/30 flex items-center justify-center text-secondary mb-4 shadow-inner">
                <Archive className="h-8 w-8" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-foreground">
                No Historical Record Available
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto mt-2">
                There are no officially finalized or archived seasons in the league database yet.
                When Season 1 officially concludes and is archived by the Commissioner, its complete
                verified records will appear here.
              </p>
              <div className="mt-6 flex items-center justify-center gap-3">
                <Link
                  href="/standings"
                  className="px-5 py-2.5 rounded-xl bg-secondary text-secondary-foreground text-xs font-black shadow-md hover:brightness-110 transition-all flex items-center gap-2"
                >
                  <Trophy className="h-3.5 w-3.5" />
                  <span>View Active League Standings</span>
                </Link>
                <Link
                  href="/hall-of-fame"
                  className="px-5 py-2.5 rounded-xl border border-border bg-card hover:bg-card/80 text-xs font-bold text-foreground transition-all flex items-center gap-2"
                >
                  <span>Hall of Fame</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {archivedSeasons.map((s) => (
                <Link
                  key={s.seasonName}
                  href={`/archive?season=${encodeURIComponent(s.seasonName)}`}
                  className="group relative rounded-3xl border border-border/80 hover:border-secondary/60 bg-card/70 hover:bg-card/90 p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 shadow-lg hover:shadow-secondary/10"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-secondary/15 border border-secondary/40 flex items-center justify-center text-secondary font-black shadow-inner">
                      <Trophy className="h-6 w-6" />
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-secondary/20 text-secondary border border-secondary/30">
                      Archived & Verified
                    </span>
                  </div>

                  <div className="mt-5 space-y-1">
                    <h3 className="text-xl font-black text-foreground group-hover:text-secondary transition-colors">
                      {s.seasonName}
                    </h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>
                        Archived {new Date(s.archivedAt).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-border/60 grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs uppercase font-bold text-muted-foreground">
                        Standings
                      </p>
                      <p className="text-sm font-black text-foreground">
                        {s.standingsCount} Records
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase font-bold text-muted-foreground">
                        Matches
                      </p>
                      <p className="text-sm font-black text-foreground">
                        {s.matchesCount} Fixtures
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between text-xs font-bold text-secondary group-hover:translate-x-1 transition-transform">
                    <span>Open Season Dashboard</span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW B: SEASON ARCHIVE DASHBOARD WITH 6 TABS */}
      {isViewingSeason && selectedSeasonData && (
        <div className="space-y-8">
          {/* Season Header Card */}
          <div className="rounded-2xl border border-secondary/30 bg-card/80 p-5 backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary/15 border border-secondary/30 flex items-center justify-center text-secondary">
                <Trophy className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-black text-foreground">
                    {selectedSeasonData.seasonName}
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-secondary/20 text-secondary border border-secondary/30">
                    Sealed Record
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Read-only historical snapshot permanently preserved.
                </p>
              </div>
            </div>

            {/* Competitions Badges */}
            <div className="flex flex-wrap items-center gap-1.5">
              {selectedSeasonData.competitionsList.map((c) => (
                <span
                  key={c}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold border border-border bg-card/60 text-muted-foreground"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>

          {/* Navigation Tabs (Strictly the 6 Approved Tabs) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-border/60 scrollbar-none">
            {[
              { id: "OVERVIEW", label: "1. Overview", icon: Layers },
              { id: "STANDINGS", label: "2. Standings", icon: Trophy },
              { id: "FIXTURES", label: "3. Fixtures & Results", icon: Calendar },
              { id: "STATISTICS", label: "4. Statistics", icon: BarChart3 },
              { id: "CHAMPIONS", label: "5. Champions", icon: Medal },
              { id: "PROMOTION_RELEGATION", label: "6. Promotion & Relegation", icon: TrendingUp },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as ArchiveTab)}
                  className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shrink-0 ${
                    isActive
                      ? "bg-secondary text-secondary-foreground shadow-md font-black"
                      : "bg-card/70 border border-border text-muted-foreground hover:text-foreground hover:bg-card"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB 1: OVERVIEW */}
          {activeTab === "OVERVIEW" && (
            <div className="space-y-8 animate-fade-in">
              {/* Stat Pillars */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="rounded-2xl border border-border bg-card/60 p-4">
                  <p className="text-xs uppercase font-bold text-muted-foreground tracking-wider">
                    Competitions
                  </p>
                  <p className="text-2xl font-black text-foreground mt-1">
                    {selectedSeasonData.overview.totalCompetitions}
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-card/60 p-4">
                  <p className="text-xs uppercase font-bold text-muted-foreground tracking-wider">
                    Total Matches
                  </p>
                  <p className="text-2xl font-black text-foreground mt-1">
                    {selectedSeasonData.overview.totalMatches}
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-card/60 p-4">
                  <p className="text-xs uppercase font-bold text-muted-foreground tracking-wider">
                    Goals Scored
                  </p>
                  <p className="text-2xl font-black text-secondary mt-1">
                    {selectedSeasonData.overview.totalGoals}
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-card/60 p-4">
                  <p className="text-xs uppercase font-bold text-muted-foreground tracking-wider">
                    Athletes Recorded
                  </p>
                  <p className="text-2xl font-black text-foreground mt-1">
                    {selectedSeasonData.overview.totalAthletes}
                  </p>
                </div>
              </div>

              {/* Competitions Overview Cards */}
              <div className="space-y-4">
                <h3 className="text-lg font-black text-foreground flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-secondary" />
                  <span>Competition Summaries</span>
                </h3>

                {selectedSeasonData.overview.competitions.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">
                    No historical competition records available for this season.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {selectedSeasonData.overview.competitions.map((c) => (
                      <div
                        key={c.competition}
                        className="rounded-2xl border border-border/80 bg-card/70 p-5 space-y-4"
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="text-base font-black text-foreground">{c.competition}</h4>
                          <span className="text-xs font-bold text-muted-foreground uppercase">
                            {c.participantsCount} Athletes
                          </span>
                        </div>

                        {/* Champion Spotlight */}
                        {c.champion ? (
                          <div className="p-3.5 rounded-xl border border-secondary/40 bg-secondary/10 space-y-1.5">
                            <div className="flex items-center gap-2">
                              <Medal className="h-4 w-4 text-secondary shrink-0" />
                              <span className="text-xs uppercase font-black text-secondary tracking-wider">
                                Champion
                              </span>
                            </div>
                            <p className="text-sm font-black text-foreground">{c.champion.gamerTag}</p>
                            {c.champion.fullName && (
                              <p className="text-xs text-muted-foreground">{c.champion.fullName}</p>
                            )}
                          </div>
                        ) : (
                          <div className="p-3 rounded-xl border border-border bg-muted/20 text-xs text-muted-foreground italic">
                            No champion recorded
                          </div>
                        )}

                        {/* Runner Up */}
                        {c.runnerUp && (
                          <div className="text-xs flex items-center justify-between text-muted-foreground">
                            <span>Runner-Up:</span>
                            <span className="font-bold text-foreground">{c.runnerUp.gamerTag}</span>
                          </div>
                        )}

                        <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                          <span>Matches: {c.matchesPlayed}</span>
                          <span>Goals: {c.goalsScored}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: STANDINGS */}
          {activeTab === "STANDINGS" && (
            <div className="space-y-6 animate-fade-in">
              {/* Competition Selector */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {selectedSeasonData.competitionsList.map((comp) => (
                  <button
                    key={comp}
                    type="button"
                    onClick={() => setSelectedComp(comp)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                      (selectedComp === "ALL" && comp === selectedSeasonData.competitionsList[0]) ||
                      selectedComp === comp
                        ? "bg-secondary text-secondary-foreground font-black shadow-sm"
                        : "bg-card/70 border border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {comp}
                  </button>
                ))}
              </div>

              {(() => {
                const currentComp =
                  selectedComp === "ALL"
                    ? selectedSeasonData.competitionsList[0] || "Division 1"
                    : selectedComp;
                const rows = selectedSeasonData.standings[currentComp] || [];

                if (rows.length === 0) {
                  return (
                    <div className="rounded-2xl border border-border bg-card/50 p-8 text-center text-muted-foreground text-xs italic">
                      No historical standings table available for {currentComp}.
                    </div>
                  );
                }

                return (
                  <div className="rounded-2xl border border-border/80 bg-card/70 overflow-hidden shadow-lg">
                    <div className="p-4 border-b border-border/60 flex items-center justify-between bg-card/90">
                      <h4 className="text-sm font-black text-foreground flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-secondary" />
                        <span>Official Final Table: {currentComp}</span>
                      </h4>
                      <span className="text-xs font-bold text-muted-foreground uppercase">
                        {rows.length} Athletes
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="border-b border-border/60 bg-muted/30 text-muted-foreground text-xs font-bold uppercase tracking-wider">
                          <tr>
                            <th className="py-3 px-3 w-12 text-center">Pos</th>
                            <th className="py-3 px-4">Athlete / Gamer Tag</th>
                            <th className="py-3 px-2 text-center">P</th>
                            <th className="py-3 px-2 text-center">W</th>
                            <th className="py-3 px-2 text-center">D</th>
                            <th className="py-3 px-2 text-center">L</th>
                            <th className="py-3 px-2 text-center">GF</th>
                            <th className="py-3 px-2 text-center">GA</th>
                            <th className="py-3 px-2 text-center">GD</th>
                            <th className="py-3 px-3 text-center font-black text-secondary">Pts</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40 font-medium">
                          {rows.map((row, idx) => {
                            const isChamp = row.isChampion || row.rank === 1;
                            const isPodium = row.rank <= 3;
                            return (
                              <tr
                                key={row.id}
                                className={`hover:bg-muted/30 transition-colors ${
                                  isChamp
                                    ? "bg-secondary/10"
                                    : idx % 2 === 0
                                    ? "bg-transparent"
                                    : "bg-muted/10"
                                }`}
                              >
                                <td className="py-3 px-3 text-center">
                                  <span
                                    className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-xs font-black ${
                                      isChamp
                                        ? "bg-secondary text-secondary-foreground shadow-sm"
                                        : isPodium
                                        ? "bg-muted text-foreground"
                                        : "text-muted-foreground"
                                    }`}
                                  >
                                    {row.rank || idx + 1}
                                  </span>
                                </td>
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-foreground">
                                      {row.gamerTag}
                                    </span>
                                    {row.fullName && (
                                      <span className="text-xs text-muted-foreground hidden sm:inline">
                                        ({row.fullName})
                                      </span>
                                    )}
                                    {isChamp && (
                                      <span className="px-1.5 py-0.5 rounded text-xs font-black uppercase bg-secondary/20 text-secondary border border-secondary/40">
                                        Champion
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-3 px-2 text-center text-muted-foreground">
                                  {row.played}
                                </td>
                                <td className="py-3 px-2 text-center font-semibold text-foreground">
                                  {row.won}
                                </td>
                                <td className="py-3 px-2 text-center text-muted-foreground">
                                  {row.drawn}
                                </td>
                                <td className="py-3 px-2 text-center text-muted-foreground">
                                  {row.lost}
                                </td>
                                <td className="py-3 px-2 text-center text-muted-foreground">
                                  {row.goalsFor}
                                </td>
                                <td className="py-3 px-2 text-center text-muted-foreground">
                                  {row.goalsAgainst}
                                </td>
                                <td className="py-3 px-2 text-center font-bold text-foreground">
                                  {row.goalDifference > 0
                                    ? `+${row.goalDifference}`
                                    : row.goalDifference}
                                </td>
                                <td className="py-3 px-3 text-center font-black text-secondary text-sm">
                                  {row.points}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* TAB 3: FIXTURES & RESULTS */}
          {activeTab === "FIXTURES" && (
            <div className="space-y-6 animate-fade-in">
              {/* Competition Filter */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {selectedSeasonData.competitionsList.map((comp) => (
                    <button
                      key={comp}
                      type="button"
                      onClick={() => {
                        setSelectedComp(comp);
                      }}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                        (selectedComp === "ALL" && comp === selectedSeasonData.competitionsList[0]) ||
                        selectedComp === comp
                          ? "bg-secondary text-secondary-foreground font-black shadow-sm"
                          : "bg-card/70 border border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {comp}
                    </button>
                  ))}
                </div>
              </div>

              {(() => {
                const currentComp =
                  selectedComp === "ALL"
                    ? selectedSeasonData.competitionsList[0] || "Division 1"
                    : selectedComp;
                const compFixtures = selectedSeasonData.fixtures[currentComp] || [];

                if (compFixtures.length === 0) {
                  return (
                    <div className="rounded-2xl border border-border bg-card/50 p-8 text-center text-muted-foreground text-xs italic">
                      No archived fixtures or match results recorded for {currentComp}.
                    </div>
                  );
                }

                // Group by round
                const roundMap = new Map<string, SeasonArchiveFixtureItem[]>();
                for (const f of compFixtures) {
                  const r = f.round || "Regular Fixture";
                  if (!roundMap.has(r)) roundMap.set(r, []);
                  roundMap.get(r)!.push(f);
                }

                return (
                  <div className="space-y-6">
                    {Array.from(roundMap.entries()).map(([roundName, matches]) => (
                      <div key={roundName} className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-secondary" />
                          <h4 className="text-sm font-black text-foreground">{roundName}</h4>
                          <span className="text-xs text-muted-foreground font-semibold">
                            ({matches.length} Match{matches.length === 1 ? "" : "es"})
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {matches.map((m) => {
                            const isFinished = m.status === "FINISHED" || m.homeScore !== null;
                            return (
                              <div
                                key={m.id}
                                className="rounded-xl border border-border/80 bg-card/70 p-3.5 flex items-center justify-between gap-4"
                              >
                                {/* Home */}
                                <div className="flex-1 text-right">
                                  <p className="text-xs font-bold text-foreground truncate">
                                    {m.homeGamerTag}
                                  </p>
                                  {m.homePlayerName && (
                                    <p className="text-xs text-muted-foreground truncate">
                                      {m.homePlayerName}
                                    </p>
                                  )}
                                </div>

                                {/* Score / VS */}
                                <div className="px-3 py-1 rounded-lg bg-muted/40 border border-border/60 text-center shrink-0 min-w-16">
                                  {isFinished ? (
                                    <span className="text-sm font-black text-secondary">
                                      {m.homeScore ?? 0} - {m.awayScore ?? 0}
                                    </span>
                                  ) : (
                                    <span className="text-xs font-bold text-muted-foreground">
                                      VS
                                    </span>
                                  )}
                                  {m.aggregateHomeScore !== null &&
                                    m.aggregateAwayScore !== null && (
                                      <p className="text-xs text-muted-foreground">
                                        Agg: {m.aggregateHomeScore}-{m.aggregateAwayScore}
                                      </p>
                                    )}
                                </div>

                                {/* Away */}
                                <div className="flex-1 text-left">
                                  <p className="text-xs font-bold text-foreground truncate">
                                    {m.awayGamerTag}
                                  </p>
                                  {m.awayPlayerName && (
                                    <p className="text-xs text-muted-foreground truncate">
                                      {m.awayPlayerName}
                                    </p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}

          {/* TAB 4: STATISTICS */}
          {activeTab === "STATISTICS" && (
            <div className="space-y-8 animate-fade-in">
              {/* Aggregated Stat Counters */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="rounded-2xl border border-border bg-card/60 p-4">
                  <p className="text-xs uppercase font-bold text-muted-foreground">
                    Matches Counted
                  </p>
                  <p className="text-2xl font-black text-foreground mt-1">
                    {selectedSeasonData.statistics.totalMatches}
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-card/60 p-4">
                  <p className="text-xs uppercase font-bold text-muted-foreground">
                    Goals Scored
                  </p>
                  <p className="text-2xl font-black text-secondary mt-1">
                    {selectedSeasonData.statistics.totalGoals}
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-card/60 p-4">
                  <p className="text-xs uppercase font-bold text-muted-foreground">
                    Avg Goals / Match
                  </p>
                  <p className="text-2xl font-black text-foreground mt-1">
                    {selectedSeasonData.statistics.averageGoalsPerMatch}
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-card/60 p-4">
                  <p className="text-xs uppercase font-bold text-muted-foreground">
                    Clean Sheets
                  </p>
                  <p className="text-2xl font-black text-foreground mt-1">
                    {selectedSeasonData.statistics.cleanSheetsTotal}
                  </p>
                </div>
              </div>

              {/* Data Tables */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Top Scorers */}
                <div className="rounded-2xl border border-border/80 bg-card/70 p-5 space-y-4">
                  <h4 className="text-sm font-black text-foreground flex items-center gap-2">
                    <Flame className="h-4 w-4 text-secondary" />
                    <span>Season Goal Leaders</span>
                  </h4>
                  {selectedSeasonData.statistics.topScorers.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">
                      No goalscoring records recorded for this season.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {selectedSeasonData.statistics.topScorers.map((s, idx) => (
                        <div
                          key={`${s.gamerTag}-${idx}`}
                          className="p-2.5 rounded-xl border border-border/60 bg-muted/20 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="font-bold text-muted-foreground w-4 text-center">
                              #{idx + 1}
                            </span>
                            <div>
                              <p className="font-bold text-foreground">{s.gamerTag}</p>
                              <p className="text-xs text-muted-foreground">{s.competition}</p>
                            </div>
                          </div>
                          <span className="font-black text-secondary">{s.goals} Goals</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Best Defenses / Clean Sheets */}
                <div className="rounded-2xl border border-border/80 bg-card/70 p-5 space-y-4">
                  <h4 className="text-sm font-black text-foreground flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-secondary" />
                    <span>Top Clean Sheet Leaders</span>
                  </h4>
                  {selectedSeasonData.statistics.bestDefenses.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">
                      No clean sheet records recorded for this season.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {selectedSeasonData.statistics.bestDefenses.map((s, idx) => (
                        <div
                          key={`${s.gamerTag}-${idx}`}
                          className="p-2.5 rounded-xl border border-border/60 bg-muted/20 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="font-bold text-muted-foreground w-4 text-center">
                              #{idx + 1}
                            </span>
                            <div>
                              <p className="font-bold text-foreground">{s.gamerTag}</p>
                              <p className="text-xs text-muted-foreground">{s.competition}</p>
                            </div>
                          </div>
                          <span className="font-black text-foreground">
                            {s.cleanSheets} Clean Sheets
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: CHAMPIONS */}
          {activeTab === "CHAMPIONS" && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-foreground flex items-center gap-2">
                  <Medal className="h-5 w-5 text-secondary" />
                  <span>Official Season Champions</span>
                </h3>
              </div>

              {selectedSeasonData.champions.length === 0 ? (
                <div className="rounded-2xl border border-border bg-card/50 p-8 text-center text-muted-foreground text-xs italic">
                  No champions officially enshrined for {selectedSeasonData.seasonName} yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {selectedSeasonData.champions.map((c, idx) => (
                    <div
                      key={`${c.tournamentName}-${idx}`}
                      className="rounded-3xl border border-secondary/40 bg-card/90 p-6 backdrop-blur-xl space-y-4 shadow-xl"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className="px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-secondary/20 text-secondary border border-secondary/30">
                          {c.trophyType || "CHAMPION"}
                        </span>
                        <Trophy className="h-6 w-6 text-secondary" />
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs uppercase font-bold text-muted-foreground">
                          {c.tournamentName}
                        </p>
                        <h4 className="text-xl font-black text-foreground">{c.championName}</h4>
                        {c.championRealName && (
                          <p className="text-xs text-muted-foreground">{c.championRealName}</p>
                        )}
                      </div>

                      {c.runnerUp && (
                        <div className="pt-3 border-t border-border/60 text-xs text-muted-foreground flex items-center justify-between">
                          <span>Runner-Up:</span>
                          <span className="font-bold text-foreground">{c.runnerUp}</span>
                        </div>
                      )}

                      {c.prizeWon && (
                        <div className="p-2.5 rounded-xl bg-secondary/10 border border-secondary/20 text-xs font-bold text-secondary">
                          Prize: {c.prizeWon}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 6: PROMOTION & RELEGATION */}
          {activeTab === "PROMOTION_RELEGATION" && (
            <div className="space-y-8 animate-fade-in">
              <div className="space-y-1">
                <h3 className="text-lg font-black text-foreground flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-secondary" />
                  <span>Division Movements</span>
                </h3>
                <p className="text-xs text-muted-foreground">
                  Official automatic promotions (Top 3) and relegations (Bottom 3) executed at season
                  conclusion.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* PROMOTIONS */}
                <div className="rounded-2xl border border-border/80 bg-card/70 p-5 space-y-5">
                  <div className="flex items-center gap-2 text-primary">
                    <TrendingUp className="h-5 w-5" />
                    <h4 className="text-sm font-black text-foreground">Official Promotions</h4>
                  </div>

                  {/* Promoted to Div 1 */}
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Promoted to Division 1 (Premiership)
                    </p>
                    {selectedSeasonData.promotionRelegation.promotedToDiv1.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">
                        No promotion records recorded.
                      </p>
                    ) : (
                      selectedSeasonData.promotionRelegation.promotedToDiv1.map((p) => (
                        <div
                          key={p.gamerTag}
                          className="p-2.5 rounded-xl border border-primary/30 bg-primary/10 flex items-center justify-between text-xs"
                        >
                          <span className="font-bold text-foreground">{p.gamerTag}</span>
                          <span className="text-muted-foreground font-semibold">
                            Rank #{p.rank} ({p.points} pts)
                          </span>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Promoted to Div 2 */}
                  <div className="space-y-2 pt-2 border-t border-border/40">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Promoted to Division 2 (Championship)
                    </p>
                    {selectedSeasonData.promotionRelegation.promotedToDiv2.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">
                        No promotion records recorded.
                      </p>
                    ) : (
                      selectedSeasonData.promotionRelegation.promotedToDiv2.map((p) => (
                        <div
                          key={p.gamerTag}
                          className="p-2.5 rounded-xl border border-primary/30 bg-primary/10 flex items-center justify-between text-xs"
                        >
                          <span className="font-bold text-foreground">{p.gamerTag}</span>
                          <span className="text-muted-foreground font-semibold">
                            Rank #{p.rank} ({p.points} pts)
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* RELEGATIONS */}
                <div className="rounded-2xl border border-border/80 bg-card/70 p-5 space-y-5">
                  <div className="flex items-center gap-2 text-destructive">
                    <TrendingDown className="h-5 w-5" />
                    <h4 className="text-sm font-black text-foreground">Official Relegations</h4>
                  </div>

                  {/* Relegated to Div 2 */}
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Relegated to Division 2
                    </p>
                    {selectedSeasonData.promotionRelegation.relegatedToDiv2.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">
                        No relegation records recorded.
                      </p>
                    ) : (
                      selectedSeasonData.promotionRelegation.relegatedToDiv2.map((p) => (
                        <div
                          key={p.gamerTag}
                          className="p-2.5 rounded-xl border border-destructive/30 bg-destructive/10 flex items-center justify-between text-xs"
                        >
                          <span className="font-bold text-foreground">{p.gamerTag}</span>
                          <span className="text-muted-foreground font-semibold">
                            Rank #{p.rank} ({p.points} pts)
                          </span>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Relegated to Div 3 */}
                  <div className="space-y-2 pt-2 border-t border-border/40">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Relegated to Division 3
                    </p>
                    {selectedSeasonData.promotionRelegation.relegatedToDiv3.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">
                        No relegation records recorded.
                      </p>
                    ) : (
                      selectedSeasonData.promotionRelegation.relegatedToDiv3.map((p) => (
                        <div
                          key={p.gamerTag}
                          className="p-2.5 rounded-xl border border-destructive/30 bg-destructive/10 flex items-center justify-between text-xs"
                        >
                          <span className="font-bold text-foreground">{p.gamerTag}</span>
                          <span className="text-muted-foreground font-semibold">
                            Rank #{p.rank} ({p.points} pts)
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
