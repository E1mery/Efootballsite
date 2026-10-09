"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Crown,
  Trophy,
  Award,
  Search,
  Calendar,
  User,
  Medal,
  Sparkles,
  ArrowRight,
  Shield,
  Flame,
  CheckCircle2,
  TrendingUp,
  X,
  History,
  Layers,
} from "lucide-react";

import HeroStats from "@/components/hall-of-fame/HeroStats";
import LegendSpotlight from "@/components/hall-of-fame/LegendSpotlight";
import TrophyCabinet, { CompetitionTrophyCardData } from "@/components/hall-of-fame/TrophyCabinet";
import AllTimeRecords from "@/components/hall-of-fame/AllTimeRecords";
import HallOfFamePlayers from "@/components/hall-of-fame/HallOfFamePlayers";
import HallOfFameTimeline from "@/components/hall-of-fame/HallOfFameTimeline";
import CtaBanner from "@/components/hall-of-fame/CtaBanner";

import { HallOfFameEntry } from "@/components/HallOfFameCarousel";
import {
  HallOfFameStatsResult,
  PlayerCareerStats,
  AllTimeRecord,
} from "@/lib/hallOfFameStatsService";

interface HallOfFameClientProps {
  entries: HallOfFameEntry[];
  stats: HallOfFameStatsResult;
  trophyCabinet: CompetitionTrophyCardData[];
  currentSeasonName: string;
}

export default function HallOfFameClient({
  entries = [],
  stats,
  trophyCabinet = [],
  currentSeasonName = "Current Season",
}: HallOfFameClientProps) {
  // Navigation & View State
  const [activeTab, setActiveTab] = useState<"SHOWCASE" | "RECORDS" | "LEADERBOARD">("SHOWCASE");
  const [selectedSeason, setSelectedSeason] = useState<string>("ALL");
  const [selectedCompetition, setSelectedCompetition] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedPlayerForAudit, setSelectedPlayerForAudit] = useState<PlayerCareerStats | null>(null);

  // Available seasons
  const seasons = useMemo(() => {
    const list = new Set<string>();
    entries.forEach((e) => e.season && list.add(e.season));
    stats?.players?.forEach((p) => p.seasonsParticipated?.forEach((s) => list.add(s)));
    return ["ALL", ...Array.from(list)];
  }, [entries, stats]);

  // Combined records: automatic + manual
  const allRecords = useMemo(() => {
    const auto = stats?.allTimeRecords || [];
    const man = stats?.manualRecords || [];
    return [...auto, ...man];
  }, [stats]);

  // Spotlight Legends (featured first, or inducted players with trophies)
  const spotlightLegends = useMemo(() => {
    const featured = stats?.featuredLegends || [];
    if (featured.length > 0) return featured;

    const inducted = stats?.inductedLegends || [];
    if (inducted.length > 0) return inducted;

    // Fallback: top players by total trophies or goals
    const players = stats?.players || [];
    return [...players].sort((a, b) => b.totalTrophies - a.totalTrophies || b.goalsScored - a.goalsScored).slice(0, 5);
  }, [stats]);

  // Filtered Players for All-Time Leaderboard
  const filteredPlayers = useMemo(() => {
    const all = stats?.players || [];
    return all.filter((p) => {
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        p.gamerTag.toLowerCase().includes(q) ||
        (p.fullName && p.fullName.toLowerCase().includes(q));

      const matchSeason =
        selectedSeason === "ALL" || p.seasonsParticipated.includes(selectedSeason);

      const matchCompetition =
        selectedCompetition === "ALL" ||
        p.divisionsParticipated.some((d) => d.toLowerCase().includes(selectedCompetition.toLowerCase()));

      return matchQuery && matchSeason && matchCompetition;
    });
  }, [stats?.players, searchQuery, selectedSeason, selectedCompetition]);

  // Hero computed stats from database
  const heroMetrics = {
    totalChampions: trophyCabinet.reduce((acc, c) => acc + c.winnersCount, 0),
    totalLegends: stats?.metrics?.totalInductedLegends ?? entries.length,
    totalSeasons: stats?.metrics?.totalSeasonsAnalyzed ?? 0,
    allTimeGoals: stats?.metrics?.totalGoalsProcessed ?? 0,
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
      {/* 1. View Navigation Bar (Allows switching from Museum Showcase to Full Records or Leaderboard) */}
      <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-border/40 pb-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setActiveTab("SHOWCASE")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === "SHOWCASE"
                ? "bg-secondary text-secondary-foreground shadow-md font-black"
                : "bg-card/70 border border-border text-muted-foreground hover:text-foreground hover:bg-card"
            }`}
          >
            <Crown className="h-4 w-4" />
            <span>Museum Showcase</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("RECORDS")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === "RECORDS"
                ? "bg-secondary text-secondary-foreground shadow-md font-black"
                : "bg-card/70 border border-border text-muted-foreground hover:text-foreground hover:bg-card"
            }`}
          >
            <Trophy className="h-4 w-4" />
            <span>All-Time Records ({allRecords.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("LEADERBOARD")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === "LEADERBOARD"
                ? "bg-secondary text-secondary-foreground shadow-md font-black"
                : "bg-card/70 border border-border text-muted-foreground hover:text-foreground hover:bg-card"
            }`}
          >
            <TrendingUp className="h-4 w-4" />
            <span>Player Leaderboard</span>
          </button>
        </div>

        {/* Search Input when in Leaderboard or Records tab */}
        {activeTab !== "SHOWCASE" && (
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search athlete, record..."
              className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-card/80 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-secondary transition-colors"
            />
          </div>
        )}
      </div>

      {/* TAB 1: MUSEUM SHOWCASE (Matches User Design Specification) */}
      {activeTab === "SHOWCASE" && (
        <div className="space-y-8 sm:space-y-12">
          {/* Section 2: Hero Section */}
          <HeroStats metrics={heroMetrics} />

          {/* Section 3: Legend Spotlight */}
          <LegendSpotlight legends={spotlightLegends} />

          {/* Section 4: Trophy Cabinet */}
          <TrophyCabinet
            competitions={trophyCabinet}
            onSelectCompetition={(comp) => {
              setSelectedCompetition(comp);
              setActiveTab("LEADERBOARD");
            }}
          />

          {/* Section 5: All-Time Records (RENDERED ONLY ONCE) */}
          <AllTimeRecords
            records={allRecords}
            onViewAllRecords={() => setActiveTab("RECORDS")}
          />

          {/* Section 6: Hall of Fame Players (Carousel) */}
          <HallOfFamePlayers
            players={stats?.inductedLegends?.length ? stats.inductedLegends : stats?.players || []}
            onViewAll={() => setActiveTab("LEADERBOARD")}
            onSelectPlayer={(p) => setSelectedPlayerForAudit(p)}
          />

          {/* Section 7: Hall of Fame Timeline */}
          <HallOfFameTimeline
            entries={entries}
            availableCompetitions={trophyCabinet.map((c) => c.competition)}
          />

          {/* Section 8: CTA Banner */}
          <CtaBanner
            currentSeasonName={currentSeasonName}
            currentSeasonLink="/standings"
          />
        </div>
      )}

      {/* TAB 2: DETAILED ALL-TIME RECORDS VIEW */}
      {activeTab === "RECORDS" && (
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight text-foreground">
                Official Hall of Fame Record Book
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Every record is strictly computed from confirmed league matches or official commissioner historical archives.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allRecords.map((rec) => {
              const primaryHolder = rec.holders && rec.holders.length > 0 ? rec.holders[0] : null;

              return (
                <div
                  key={rec.id || rec.recordKey}
                  className="hof-navy-surface rounded-2xl p-6 border border-border/70 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        {rec.title}
                      </span>
                      <span className="px-2 py-0.5 rounded text-xs font-bold uppercase bg-secondary/15 text-secondary border border-secondary/30">
                        {rec.sourceType}
                      </span>
                    </div>

                    <div className="text-4xl font-black text-foreground tracking-tight mb-2">
                      {rec.valueFormatted}
                    </div>

                    <p className="text-xs text-muted-foreground mb-4">
                      {rec.transparencyNote}
                    </p>
                  </div>

                  <div className="border-t border-border/50 pt-3">
                    <span className="text-xs font-bold uppercase text-muted-foreground block mb-1">
                      Record Holder(s):
                    </span>
                    <div className="space-y-1">
                      {rec.holders.length === 0 ? (
                        <span className="text-xs text-muted-foreground italic">None currently eligible</span>
                      ) : (
                        rec.holders.map((h, i) => (
                          <div key={i} className="flex items-center justify-between text-xs">
                            <span className="font-bold text-foreground">{h.gamerTag}</span>
                            {h.detail && (
                              <span className="text-xs text-secondary">{h.detail}</span>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: STATISTICAL LEADERBOARD & CAREER AUDIT */}
      {activeTab === "LEADERBOARD" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight text-foreground">
                All-Time Career Statistical Roster
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Aggregated career totals across all official competitions. Click any athlete to open their full transparency audit.
              </p>
            </div>

            {/* Filter controls */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              <select
                value={selectedSeason}
                onChange={(e) => setSelectedSeason(e.target.value)}
                className="bg-card border border-border rounded-lg px-3 py-1.5 text-xs font-bold text-foreground"
              >
                <option value="ALL">All Seasons</option>
                {seasons.filter((s) => s !== "ALL").map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>

              <select
                value={selectedCompetition}
                onChange={(e) => setSelectedCompetition(e.target.value)}
                className="bg-card border border-border rounded-lg px-3 py-1.5 text-xs font-bold text-foreground"
              >
                <option value="ALL">All Competitions</option>
                <option value="Division 1">Division 1</option>
                <option value="UCL">Champions League</option>
                <option value="EUROPA">Europa League</option>
                <option value="Division 2">Division 2</option>
                <option value="Division 3">Division 3</option>
              </select>
            </div>
          </div>

          {filteredPlayers.length === 0 ? (
            <div className="text-center p-12 rounded-2xl hof-navy-surface border border-border">
              <User className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
              <h3 className="text-sm font-bold uppercase text-foreground">No Athletes Found</h3>
              <p className="text-xs text-muted-foreground mt-1">No athletes match the current search or filters.</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-border/80 overflow-hidden hof-navy-surface">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/40 uppercase font-mono text-muted-foreground border-b border-border/70">
                    <tr>
                      <th className="py-3 px-4">Rank / Player</th>
                      <th className="py-3 px-4 text-center">Division</th>
                      <th className="py-3 px-4 text-center">Matches</th>
                      <th className="py-3 px-4 text-center">W-D-L</th>
                      <th className="py-3 px-4 text-center">Goals (GD)</th>
                      <th className="py-3 px-4 text-center">Win Rate</th>
                      <th className="py-3 px-4 text-center">Trophies</th>
                      <th className="py-3 px-4 text-right">Audit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {filteredPlayers.map((player, idx) => (
                      <tr
                        key={player.gamerTag}
                        onClick={() => setSelectedPlayerForAudit(player)}
                        className="hover:bg-muted/30 cursor-pointer transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-bold text-muted-foreground w-5 text-center">
                              #{idx + 1}
                            </span>
                            <div>
                              <div className="font-bold text-foreground uppercase flex items-center gap-1.5">
                                <span>{player.gamerTag}</span>
                                {player.isInducted && (
                                  <Crown className="w-3 h-3 text-secondary inline" />
                                )}
                              </div>
                              {player.fullName && (
                                <div className="text-xs text-muted-foreground">
                                  {player.fullName}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-muted-foreground">
                          {player.currentDivision || "Division 1"}
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-foreground">
                          {player.matchesPlayed}
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-muted-foreground">
                          {player.wins}W - {player.draws}D - {player.losses}L
                        </td>
                        <td className="py-3 px-4 text-center font-mono">
                          <span className="font-bold text-secondary">{player.goalsScored}</span>
                          <span className="text-xs text-muted-foreground ml-1">
                            ({player.goalDifference > 0 ? `+${player.goalDifference}` : player.goalDifference})
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-foreground">
                          {player.winPercentage.toFixed(1)}%
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-secondary">
                          🏆 {player.totalTrophies}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPlayerForAudit(player);
                            }}
                            className="px-2.5 py-1 rounded bg-secondary/15 hover:bg-secondary/25 border border-secondary/30 text-secondary text-xs font-bold uppercase transition-colors"
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 9. Audit Modal for Statistical Transparency */}
      {selectedPlayerForAudit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl hof-navy-surface rounded-2xl border border-secondary/40 p-6 space-y-6 max-h-screen overflow-y-auto shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-secondary/20 border border-secondary flex items-center justify-center">
                  <Crown className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase text-foreground">
                    {selectedPlayerForAudit.gamerTag}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {selectedPlayerForAudit.fullName || "Verified Athlete"} • {selectedPlayerForAudit.currentDivision || "Division 1"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedPlayerForAudit(null)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Career Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-background border border-border text-center">
                <span className="text-xs uppercase font-bold text-muted-foreground block">Matches</span>
                <span className="text-lg font-black text-foreground">{selectedPlayerForAudit.matchesPlayed}</span>
              </div>
              <div className="p-3 rounded-xl bg-background border border-border text-center">
                <span className="text-xs uppercase font-bold text-muted-foreground block">Record</span>
                <span className="text-lg font-black text-foreground">
                  {selectedPlayerForAudit.wins}W-{selectedPlayerForAudit.draws}D-{selectedPlayerForAudit.losses}L
                </span>
              </div>
              <div className="p-3 rounded-xl bg-background border border-border text-center">
                <span className="text-xs uppercase font-bold text-muted-foreground block">Goals</span>
                <span className="text-lg font-black text-secondary">{selectedPlayerForAudit.goalsScored}</span>
              </div>
              <div className="p-3 rounded-xl bg-background border border-border text-center">
                <span className="text-xs uppercase font-bold text-muted-foreground block">Win Rate</span>
                <span className="text-lg font-black text-foreground">{selectedPlayerForAudit.winPercentage.toFixed(1)}%</span>
              </div>
            </div>

            {/* Trophies breakdown */}
            <div className="p-4 rounded-xl bg-secondary/10 border border-secondary/30 space-y-2">
              <div className="text-xs font-bold uppercase text-secondary flex items-center gap-1.5">
                <Trophy className="w-4 h-4" />
                <span>Total Trophies: {selectedPlayerForAudit.totalTrophies}</span>
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-foreground">
                <span><strong>{selectedPlayerForAudit.leagueTitles}</strong> Division 1</span>
                <span>•</span>
                <span><strong>{selectedPlayerForAudit.uclTitles}</strong> UCL</span>
                <span>•</span>
                <span><strong>{selectedPlayerForAudit.europaTitles}</strong> Europa</span>
                <span>•</span>
                <span><strong>{selectedPlayerForAudit.d2Titles + selectedPlayerForAudit.d3Titles}</strong> Lower Tier</span>
              </div>
            </div>

            {/* Official matches table */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1.5">
                <History className="w-4 h-4 text-secondary" />
                <span>Verified Official Match History ({selectedPlayerForAudit.officialMatchesSummary.length})</span>
              </span>

              {selectedPlayerForAudit.officialMatchesSummary.length === 0 ? (
                <div className="p-4 rounded-xl bg-background/50 border border-border text-center text-xs text-muted-foreground">
                  No individual match logs recorded in current season cycle.
                </div>
              ) : (
                <div className="max-h-52 overflow-y-auto rounded-xl border border-border">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted text-muted-foreground uppercase text-xs">
                      <tr>
                        <th className="py-2 px-3">Date</th>
                        <th className="py-2 px-3">Comp</th>
                        <th className="py-2 px-3">Opponent</th>
                        <th className="py-2 px-3 text-center">Score</th>
                        <th className="py-2 px-3 text-center">Result</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {selectedPlayerForAudit.officialMatchesSummary.map((m, idx) => (
                        <tr key={idx} className="hover:bg-muted/30">
                          <td className="py-2 px-3 text-muted-foreground">
                            {new Date(m.date).toLocaleDateString()}
                          </td>
                          <td className="py-2 px-3 text-foreground font-semibold">{m.competition}</td>
                          <td className="py-2 px-3 text-foreground">vs {m.opponentGamerTag}</td>
                          <td className="py-2 px-3 text-center font-bold text-secondary">
                            {m.playerScore} - {m.opponentScore}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${
                              m.result === "W" ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground"
                            }`}>
                              {m.result}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-border flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedPlayerForAudit(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-muted hover:bg-card text-foreground transition-colors cursor-pointer"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
