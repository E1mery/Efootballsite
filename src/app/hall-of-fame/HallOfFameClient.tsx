"use client";

import { useState, useMemo } from "react";
import {
  Crown,
  Trophy,
  X,
  History,
  Flame,
  Zap,
  Shield,
  Award,
  Layers,
  Search,
  Filter,
  RotateCcw,
  ChevronLeft,
  ExternalLink,
  User,
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
  const [activeTab, setActiveTab] = useState<"SHOWCASE" | "RECORDS">("SHOWCASE");
  const [selectedPlayerForAudit, setSelectedPlayerForAudit] = useState<PlayerCareerStats | null>(null);
  const [selectedTimelineComp, setSelectedTimelineComp] = useState<string>("ALL");
  const [recordSearchQuery, setRecordSearchQuery] = useState<string>("");
  const [selectedRecordCategory, setSelectedRecordCategory] = useState<string>("ALL");

  const handleSelectCompetitionFromCabinet = (compKey: string) => {
    setActiveTab("SHOWCASE");
    setSelectedTimelineComp(compKey);
    const timelineEl = document.getElementById("hall-of-fame-timeline");
    if (timelineEl) {
      timelineEl.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Combined records: automatic + manual
  const allRecords = useMemo(() => {
    const auto = stats?.allTimeRecords || [];
    const man = stats?.manualRecords || [];
    return [...auto, ...man];
  }, [stats]);

  // Unique categories for filtering
  const categories = useMemo(() => {
    const set = new Set<string>();
    allRecords.forEach((r) => {
      if (r.category) set.add(r.category);
    });
    return ["ALL", ...Array.from(set)];
  }, [allRecords]);

  const getRecordIcon = (category: string) => {
    switch (category) {
      case "TITLES":
        return Crown;
      case "GOALS":
        return Flame;
      case "WINS":
        return Trophy;
      case "STREAK":
        return Zap;
      case "CLEAN_SHEETS":
      case "DEFENSE":
        return Shield;
      case "FINALS":
        return Award;
      case "MATCHES":
        return Layers;
      default:
        return Trophy;
    }
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case "ALL":
        return "All Records";
      case "TITLES":
        return "Championships";
      case "GOALS":
        return "Top Scorers";
      case "WINS":
        return "Victories";
      case "MATCHES":
        return "Appearances";
      case "WIN_RATE":
        return "Win Rate";
      case "STREAK":
        return "Win Streaks";
      case "CLEAN_SHEETS":
      case "DEFENSE":
        return "Clean Sheets";
      case "FINALS":
        return "Grand Finals";
      case "HISTORICAL":
        return "Historical Archives";
      default:
        return cat;
    }
  };

  const openAuditForPlayer = (gamerTag: string) => {
    const tag = gamerTag.trim().toLowerCase();
    const found =
      stats?.players?.find((p) => p.gamerTag.trim().toLowerCase() === tag) ||
      stats?.inductedLegends?.find((p) => p.gamerTag.trim().toLowerCase() === tag);

    if (found) {
      setSelectedPlayerForAudit(found);
      return;
    }

    const holderMatch = allRecords
      .flatMap((r) => r.holders)
      .find((h) => h.gamerTag.trim().toLowerCase() === tag);

    setSelectedPlayerForAudit({
      playerId: holderMatch?.playerId,
      gamerTag: holderMatch?.gamerTag || gamerTag,
      fullName: holderMatch?.fullName || null,
      avatar: holderMatch?.avatar || null,
      currentDivision: holderMatch?.currentDivision || "Division 1",
      divisionsParticipated: [],
      seasonsParticipated: [],
      matchesPlayed: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsScored: 0,
      goalsConceded: 0,
      goalDifference: 0,
      winPercentage: 0,
      cleanSheets: 0,
      leagueTitles: 0,
      uclTitles: 0,
      europaTitles: 0,
      superCupTitles: 0,
      d2Titles: 0,
      d3Titles: 0,
      totalTrophies: 0,
      finalsReached: 0,
      finalsWon: 0,
      currentWinStreak: 0,
      longestWinStreak: 0,
      isInducted: true,
      isFeatured: false,
      isStatisticallyEligible: true,
      seasonBreakdown: {},
      competitionBreakdown: {},
      officialMatchesSummary: [],
    });
  };

  const filteredRecords = useMemo(() => {
    return allRecords.filter((rec) => {
      const matchCategory =
        selectedRecordCategory === "ALL" || rec.category === selectedRecordCategory;
      const q = recordSearchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        rec.title.toLowerCase().includes(q) ||
        rec.recordKey.toLowerCase().includes(q) ||
        rec.valueFormatted.toLowerCase().includes(q) ||
        rec.transparencyNote?.toLowerCase().includes(q) ||
        rec.holders.some(
          (h) =>
            h.gamerTag.toLowerCase().includes(q) ||
            (h.fullName && h.fullName.toLowerCase().includes(q)) ||
            (h.detail && h.detail.toLowerCase().includes(q))
        );

      return matchCategory && matchQuery;
    });
  }, [allRecords, selectedRecordCategory, recordSearchQuery]);

  // Spotlight Legends (The All-Time Legend of Rwanda must be the one who has many trophies only)
  const spotlightLegends = useMemo(() => {
    const players = stats?.players || [];
    // Only consider players who have won official trophies
    const playersWithTrophies = players.filter((p) => p.totalTrophies > 0);

    if (playersWithTrophies.length === 0) {
      // If no player has won trophies yet, check inducted legends who may have recorded titles
      const inductedWithTrophies = (stats?.inductedLegends || []).filter((p) => p.totalTrophies > 0);
      if (inductedWithTrophies.length > 0) {
        const maxTitles = Math.max(...inductedWithTrophies.map((p) => p.totalTrophies));
        return inductedWithTrophies.filter((p) => p.totalTrophies === maxTitles);
      }
      return [];
    }

    // Find the maximum number of trophies won by any player
    const maxTrophies = Math.max(...playersWithTrophies.map((p) => p.totalTrophies));

    // The All-Time Legend(s) MUST be the one(s) with the highest trophy count only
    return playersWithTrophies
      .filter((p) => p.totalTrophies === maxTrophies)
      .sort((a, b) => b.wins - a.wins || b.goalsScored - a.goalsScored);
  }, [stats]);

  // Hall of Fame Players - strictly players who have won any trophy
  const trophyWinningPlayers = useMemo(() => {
    const all = stats?.players || [];
    const inducted = stats?.inductedLegends || [];
    const combined = [...inducted, ...all];

    const map = new Map<string, PlayerCareerStats>();
    for (const p of combined) {
      if ((p.totalTrophies ?? 0) > 0) {
        const key = p.gamerTag.trim().toLowerCase();
        if (!map.has(key)) {
          map.set(key, p);
        } else {
          const existing = map.get(key)!;
          if ((p.totalTrophies ?? 0) > (existing.totalTrophies ?? 0)) {
            map.set(key, p);
          }
        }
      }
    }

    return Array.from(map.values()).sort((a, b) => {
      if (b.totalTrophies !== a.totalTrophies) return b.totalTrophies - a.totalTrophies;
      if (b.wins !== a.wins) return b.wins - a.wins;
      return b.goalsScored - a.goalsScored;
    });
  }, [stats?.players, stats?.inductedLegends]);

  // Hero computed stats from database
  const heroMetrics = {
    totalChampions: trophyCabinet.reduce((acc, c) => acc + c.winnersCount, 0),
    totalLegends: trophyWinningPlayers.length,
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

        </div>
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
            onSelectCompetition={handleSelectCompetitionFromCabinet}
          />

          {/* Section 5: All-Time Records (RENDERED ONLY ONCE) */}
          <AllTimeRecords
            records={allRecords}
            onViewAllRecords={() => setActiveTab("RECORDS")}
            onSelectPlayer={(tag) => openAuditForPlayer(tag)}
          />

          {/* Section 6: Hall of Fame Players (Carousel - Trophy Winners Only) */}
          <HallOfFamePlayers
            players={trophyWinningPlayers}
            onViewAll={() => setActiveTab("RECORDS")}
            onSelectPlayer={(p) => setSelectedPlayerForAudit(p)}
          />

          {/* Section 7: Hall of Fame Timeline */}
          <HallOfFameTimeline
            entries={entries}
            availableCompetitions={trophyCabinet.map((c) => c.competition)}
            selectedCompetition={selectedTimelineComp}
            onSelectCompetition={setSelectedTimelineComp}
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
          {/* Top navigation & Header */}
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => setActiveTab("SHOWCASE")}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-secondary transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back to Museum Showcase</span>
            </button>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Trophy className="w-4 h-4 text-secondary" />
                  <span className="text-xs font-bold tracking-widest uppercase text-secondary">
                    OFFICIAL RECORD BOOK
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-foreground">
                  All-Time League Records
                </h2>
                <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
                  Historical milestones strictly calculated from verified official fixtures and commissioner archives.
                  Record holders and tied athletes are immortalized below.
                </p>
              </div>

              {/* Metric chips */}
              <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
                <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-card border border-border text-foreground flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5 text-secondary" />
                  <span>{allRecords.length} Official Records</span>
                </span>
                <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-card border border-border text-muted-foreground">
                  {heroMetrics.allTimeGoals} Goals Processed
                </span>
              </div>
            </div>
          </div>

          {/* Search & Category Filter Toolbar */}
          <div className="space-y-3 p-4 rounded-2xl hof-navy-surface border border-border/70">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={recordSearchQuery}
                  onChange={(e) => setRecordSearchQuery(e.target.value)}
                  placeholder="Search records, athletes, or milestones..."
                  className="w-full pl-9 pr-9 py-2 rounded-xl text-xs bg-background/80 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-secondary transition-colors"
                />
                {recordSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setRecordSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Reset button if filtered */}
              {(selectedRecordCategory !== "ALL" || recordSearchQuery) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRecordCategory("ALL");
                    setRecordSearchQuery("");
                  }}
                  className="px-3 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground bg-muted/40 hover:bg-muted transition-colors flex items-center gap-1.5 shrink-0 self-end sm:self-auto cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Filters</span>
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            {categories.length > 1 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-1 border-t border-border/40">
                <span className="text-xs font-bold uppercase text-muted-foreground mr-1 shrink-0 flex items-center gap-1">
                  <Filter className="w-3 h-3" /> Category:
                </span>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedRecordCategory(cat)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-colors shrink-0 cursor-pointer ${
                      selectedRecordCategory === cat
                        ? "bg-secondary text-secondary-foreground shadow-sm"
                        : "bg-background/60 hover:bg-background text-muted-foreground hover:text-foreground border border-border/60"
                    }`}
                  >
                    {getCategoryLabel(cat)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Records Grid or Empty State */}
          {filteredRecords.length === 0 ? (
            <div className="text-center p-8 sm:p-12 rounded-2xl hof-navy-surface border border-border/70 space-y-3">
              <Award className="w-12 h-12 text-secondary/40 mx-auto" />
              <h3 className="text-base font-bold uppercase tracking-wide text-foreground">
                {allRecords.length === 0 ? "Records Pending Official Matches" : "No Records Found"}
              </h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
                {allRecords.length === 0
                  ? "All-time records require verified official matches. Complete fixtures and official tournaments will automatically generate and crown record holders here."
                  : `No records matched your current query "${recordSearchQuery}". Try clearing filters to view all entries.`}
              </p>
              {(selectedRecordCategory !== "ALL" || recordSearchQuery) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRecordCategory("ALL");
                    setRecordSearchQuery("");
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-secondary text-secondary-foreground hover:opacity-90 transition-opacity cursor-pointer inline-flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear Filters</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRecords.map((rec) => {
                const Icon = getRecordIcon(rec.category);

                return (
                  <div
                    key={rec.id || rec.recordKey}
                    className="hof-navy-surface rounded-2xl p-6 border border-border/70 hover:border-secondary/50 flex flex-col justify-between transition-all group"
                  >
                    <div>
                      {/* Card Header */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="space-y-0.5">
                          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                            {rec.title}
                          </span>
                          <span className="px-2 py-0.5 rounded text-xs font-bold uppercase inline-block bg-secondary/15 text-secondary border border-secondary/30">
                            {rec.sourceType === "AUTOMATIC" ? "Official Record" : "Historical Archive"}
                          </span>
                        </div>
                        <div className="w-9 h-9 rounded-xl bg-secondary/10 border border-secondary/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                          <Icon className="w-4.5 h-4.5 text-secondary" />
                        </div>
                      </div>

                      {/* Record Value */}
                      <div className="text-3xl sm:text-4xl font-black text-foreground tracking-tight mb-2">
                        {rec.valueFormatted}
                      </div>

                      {/* Transparency Note */}
                      <p className="text-xs text-muted-foreground mb-4 leading-relaxed line-clamp-2">
                        {rec.transparencyNote || "Calculated from verified league data"}
                      </p>
                    </div>

                    {/* Record Holders Section */}
                    <div className="border-t border-border/50 pt-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase text-muted-foreground">
                          Record Holder{rec.holders.length > 1 ? `s (${rec.holders.length})` : ""}:
                        </span>
                      </div>

                      <div className="space-y-2">
                        {rec.holders.length === 0 ? (
                          <span className="text-xs text-muted-foreground italic">None currently eligible</span>
                        ) : (
                          rec.holders.map((h, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between gap-2 p-2 rounded-xl bg-background/50 border border-border/50 hover:border-secondary/40 transition-colors"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                {h.avatar ? (
                                  <img
                                    src={h.avatar}
                                    alt={h.gamerTag}
                                    className="w-8 h-8 rounded-full object-cover border border-secondary/30 shrink-0 bg-secondary/10"
                                    onError={(e) => {
                                      (e.currentTarget as HTMLElement).style.display = "none";
                                      const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                      if (fallback) fallback.style.display = "flex";
                                    }}
                                  />
                                ) : null}
                                <div
                                  className={`w-8 h-8 rounded-full bg-secondary/15 border border-secondary/30 flex items-center justify-center shrink-0 ${
                                    h.avatar ? "hidden" : "flex"
                                  }`}
                                >
                                  <User className="w-3.5 h-3.5 text-secondary" />
                                </div>
                                <div className="min-w-0">
                                  <button
                                    type="button"
                                    onClick={() => openAuditForPlayer(h.gamerTag)}
                                    className="text-xs font-bold text-foreground hover:text-secondary transition-colors text-left truncate block cursor-pointer"
                                  >
                                    {h.gamerTag}
                                  </button>
                                  {h.detail && (
                                    <span className="text-xs text-secondary truncate block">
                                      {h.detail}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => openAuditForPlayer(h.gamerTag)}
                                className="px-2 py-1 rounded-lg text-xs font-bold text-secondary bg-secondary/10 hover:bg-secondary/20 transition-colors shrink-0 cursor-pointer"
                              >
                                Audit
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
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
                {selectedPlayerForAudit.superCupTitles > 0 && (
                  <>
                    <span>•</span>
                    <span><strong>{selectedPlayerForAudit.superCupTitles}</strong> Super Cup</span>
                  </>
                )}
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
