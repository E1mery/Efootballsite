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
  Eye,
  SlidersHorizontal,
  Info,
  Layers,
  History,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import HallOfFameCarousel, { HallOfFameEntry } from "@/components/HallOfFameCarousel";
import { HallOfFameStatsResult, PlayerCareerStats, AllTimeRecord } from "@/lib/hallOfFameStatsService";

interface HallOfFameClientProps {
  entries: HallOfFameEntry[];
  stats: HallOfFameStatsResult;
}

export default function HallOfFameClient({ entries = [], stats }: HallOfFameClientProps) {
  // Navigation tabs: CHAMPIONS, RECORDS, LEADERBOARD
  const [activeTab, setActiveTab] = useState<"CHAMPIONS" | "RECORDS" | "LEADERBOARD">("CHAMPIONS");
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

  // Available competitions
  const competitions = useMemo(() => {
    return [
      { id: "ALL", label: "All Competitions" },
      { id: "Division 1", label: "Division 1 (Premiership)" },
      { id: "UCL", label: "Champions League (UCL)" },
      { id: "EUROPA", label: "Europa League" },
      { id: "Division 2", label: "Division 2" },
      { id: "Division 3", label: "Division 3" },
    ];
  }, []);

  // Filtered Champions (Crowned inductees)
  const filteredChampions = useMemo(() => {
    return entries.filter((entry) => {
      const matchSeason = selectedSeason === "ALL" || entry.season === selectedSeason;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        entry.championName.toLowerCase().includes(q) ||
        (entry.championRealName && entry.championRealName.toLowerCase().includes(q)) ||
        entry.tournamentName.toLowerCase().includes(q) ||
        entry.season.toLowerCase().includes(q);

      return matchSeason && matchQuery;
    });
  }, [entries, selectedSeason, searchQuery]);

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

  // Combined records: automatic + manual
  const allRecords = useMemo(() => {
    const auto = stats?.allTimeRecords || [];
    const manual = stats?.manualRecords || [];
    return [...auto, ...manual];
  }, [stats]);

  // Find player stats helper
  const openAuditModal = (gamerTag: string) => {
    const player = stats?.players?.find(
      (p) => p.gamerTag.toLowerCase() === gamerTag.toLowerCase()
    );
    if (player) {
      setSelectedPlayerForAudit(player);
    }
  };

  const hasOfficialData = stats?.hasOfficialData ?? false;
  const metrics = stats?.metrics;

  return (
    <div className="space-y-10">
      {/* Overview Analytics Bar */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-border bg-card/60 p-4 backdrop-blur-md">
          <span className="text-xs font-mono uppercase text-muted-foreground block">
            Official Matches
          </span>
          <div className="text-xl sm:text-2xl font-black text-foreground mt-0.5 font-mono">
            {metrics?.totalOfficialMatchesProcessed ?? 0}
          </div>
          <span className="text-xs text-muted-foreground mt-0.5 block">
            Verified league fixtures
          </span>
        </div>

        <div className="rounded-2xl border border-border bg-card/60 p-4 backdrop-blur-md">
          <span className="text-xs font-mono uppercase text-muted-foreground block">
            Total Goals Recorded
          </span>
          <div className="text-xl sm:text-2xl font-black text-secondary mt-0.5 font-mono">
            {metrics?.totalGoalsProcessed ?? 0}
          </div>
          <span className="text-xs text-muted-foreground mt-0.5 block">
            Competitive match goals
          </span>
        </div>

        <div className="rounded-2xl border border-border bg-card/60 p-4 backdrop-blur-md">
          <span className="text-xs font-mono uppercase text-muted-foreground block">
            Inducted Champions
          </span>
          <div className="text-xl sm:text-2xl font-black text-foreground mt-0.5 font-mono">
            {entries.length}
          </div>
          <span className="text-xs text-muted-foreground mt-0.5 block">
            Immortalized athletes
          </span>
        </div>

        <div className="rounded-2xl border border-border bg-card/60 p-4 backdrop-blur-md">
          <span className="text-xs font-mono uppercase text-muted-foreground block">
            Athletes Tracked
          </span>
          <div className="text-xl sm:text-2xl font-black text-foreground mt-0.5 font-mono">
            {metrics?.totalPlayersAnalyzed ?? 0}
          </div>
          <span className="text-xs text-muted-foreground mt-0.5 block">
            Career statistics database
          </span>
        </div>
      </section>

      {/* Hero Carousel: Crowned Titleholders */}
      <section className="space-y-3">
        <HallOfFameCarousel entries={entries} />
      </section>

      {/* Main Interactive Tabs Navigation */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          {/* Subtab selection pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveTab("CHAMPIONS")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shrink-0 ${
                activeTab === "CHAMPIONS"
                  ? "bg-secondary text-secondary-foreground shadow-md font-black"
                  : "bg-card/70 border border-border text-muted-foreground hover:text-foreground hover:bg-card"
              }`}
            >
              <Crown className="h-4 w-4" />
              <span>Immortalized Champions ({entries.length})</span>
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
              <span>Statistical Leaderboard</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative min-w-56 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search athlete, title..."
              className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-card/80 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-secondary/50 transition-colors"
            />
          </div>
        </div>

        {/* Global Filters Strip */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 bg-card/40 border border-border/80 p-3 rounded-2xl backdrop-blur-sm">
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
            <span className="text-xs font-mono uppercase text-muted-foreground mr-1 shrink-0 flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" /> Season:
            </span>
            {seasons.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSelectedSeason(s)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors shrink-0 ${
                  selectedSeason === s
                    ? "bg-secondary text-secondary-foreground shadow-sm"
                    : "bg-muted/40 text-muted-foreground hover:text-foreground"
                }`}
              >
                {s === "ALL" ? "All Seasons" : s}
              </button>
            ))}
          </div>

          {activeTab === "LEADERBOARD" && (
            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
              <span className="text-xs font-mono uppercase text-muted-foreground mr-1 shrink-0 flex items-center gap-1">
                <Shield className="h-3.5 w-3.5" /> Comp:
              </span>
              {competitions.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCompetition(c.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors shrink-0 ${
                    selectedCompetition === c.id
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted/40 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: IMMORTALIZED CHAMPIONS */}
        {/* ========================================================================= */}
        {activeTab === "CHAMPIONS" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black uppercase text-foreground tracking-tight flex items-center gap-2">
                  <Crown className="h-5 w-5 text-secondary" />
                  Official Hall of Fame Inductees
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Athletes officially crowned as championship winners across Rwanda&apos;s eFootball tournaments.
                </p>
              </div>
            </div>

            {filteredChampions.length === 0 ? (
              <div className="rounded-2xl border border-border/80 bg-card/50 p-10 text-center backdrop-blur-sm">
                <Crown className="h-8 w-8 text-secondary/40 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">
                  {entries.length === 0 ? "No Champions Inducted Yet" : "No Matching Champions"}
                </h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                  {entries.length === 0
                    ? "Championship athletes across Division 1, Division 2, Division 3, UCL, and Europa League will be immortalized here."
                    : "Try adjusting your search query or season filter to find inducted champions."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredChampions.map((entry) => {
                  const playerStats = stats?.players?.find(
                    (p) => p.gamerTag.toLowerCase() === entry.championName.toLowerCase()
                  );

                  return (
                    <div
                      key={entry.id}
                      className="group relative overflow-hidden rounded-2xl border border-border bg-card/80 hover:border-secondary/40 p-5 backdrop-blur-md transition-all shadow-lg flex flex-col justify-between"
                    >
                      <div className="space-y-4">
                        {/* Top Bar: Season and Trophy Type */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-mono font-bold text-secondary uppercase tracking-wider">
                            {entry.season}
                          </span>
                          <span className="text-xs font-mono font-bold text-muted-foreground uppercase flex items-center gap-1">
                            <Trophy className="h-3.5 w-3.5 text-secondary" />
                            {entry.trophyType === "UCL"
                              ? "UCL Champion"
                              : entry.trophyType === "EUROPA"
                              ? "Europa Champion"
                              : entry.trophyType === "SILVER"
                              ? "Runner-up"
                              : "League Champion"}
                          </span>
                        </div>

                        {/* Player Image and Main Profile */}
                        <div className="flex items-center gap-3.5">
                          <div className="relative h-16 w-16 sm:h-20 sm:w-20 rounded-2xl overflow-hidden bg-muted/60 border border-secondary/30 shrink-0 flex items-center justify-center">
                            {entry.playerImage ? (
                              <img
                                src={entry.playerImage}
                                alt={entry.championName}
                                className="h-full w-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <User className="h-8 w-8 text-secondary/60" />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <Crown className="h-4 w-4 text-secondary shrink-0" />
                              <h3 className="text-base sm:text-lg font-black text-foreground truncate">
                                {entry.championName}
                              </h3>
                            </div>
                            {entry.championRealName && (
                              <p className="text-xs font-medium text-muted-foreground truncate mt-0.5">
                                {entry.championRealName}
                              </p>
                            )}
                            <p className="text-xs font-semibold text-secondary truncate mt-1">
                              {entry.tournamentName}
                            </p>
                          </div>
                        </div>

                        {/* Intelligent Real-Time Statistics Box */}
                        {playerStats && playerStats.matchesPlayed > 0 ? (
                          <div className="p-3 rounded-xl bg-background/80 border border-border/80 space-y-2">
                            <div className="flex items-center justify-between text-xs font-mono">
                              <span className="text-muted-foreground">Career League Record:</span>
                              <span className="text-foreground font-bold">
                                {playerStats.wins}W - {playerStats.draws}D - {playerStats.losses}L
                              </span>
                            </div>

                            <div className="grid grid-cols-3 gap-2 text-center pt-1.5 border-t border-border/60">
                              <div>
                                <span className="text-xs text-muted-foreground uppercase block font-mono">
                                  Matches
                                </span>
                                <span className="text-xs font-black text-foreground font-mono">
                                  {playerStats.matchesPlayed}
                                </span>
                              </div>
                              <div>
                                <span className="text-xs text-muted-foreground uppercase block font-mono">
                                  Goals
                                </span>
                                <span className="text-xs font-black text-secondary font-mono">
                                  {playerStats.goalsScored}
                                </span>
                              </div>
                              <div>
                                <span className="text-xs text-muted-foreground uppercase block font-mono">
                                  Win Rate
                                </span>
                                <span className="text-xs font-black text-foreground font-mono">
                                  {playerStats.winPercentage.toFixed(0)}%
                                </span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="p-3 rounded-xl bg-muted/40 border border-border/80 space-y-1.5 text-xs font-mono">
                            {entry.prizeWon && (
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Prize:</span>
                                <span className="font-bold text-foreground truncate max-w-48 text-right">
                                  {entry.prizeWon}
                                </span>
                              </div>
                            )}
                            {entry.runnerUp && (
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Runner-up:</span>
                                <span className="font-bold text-muted-foreground truncate max-w-48 text-right">
                                  {entry.runnerUp}
                                </span>
                              </div>
                            )}
                            <div className="text-xs text-muted-foreground font-sans italic">
                              Official Tournament Winner
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Footer Actions */}
                      <div className="pt-3 mt-4 border-t border-border flex items-center justify-between text-xs">
                        <span className="text-muted-foreground font-mono flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-secondary" />
                          {new Date(entry.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            year: "numeric",
                            timeZone: "Africa/Kigali",
                          })}
                        </span>

                        {playerStats ? (
                          <button
                            type="button"
                            onClick={() => openAuditModal(entry.championName)}
                            className="text-xs font-bold text-secondary hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>View Stats</span>
                          </button>
                        ) : (
                          <span className="text-secondary font-bold text-xs uppercase">
                            Hall of Fame
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: AUTOMATIC ALL-TIME RECORDS (Requirement 02 & 10) */}
        {/* ========================================================================= */}
        {activeTab === "RECORDS" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black uppercase text-foreground tracking-tight flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-secondary" />
                  All-Time League Records
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Automatically computed from verified league matches, with ties fully supported.
                </p>
              </div>
            </div>

            {/* Empty database state (Requirement 16) */}
            {!hasOfficialData && allRecords.length === 0 ? (
              <div className="rounded-3xl border border-border bg-card/60 p-12 text-center backdrop-blur-sm">
                <Trophy className="h-12 w-12 text-secondary/30 mx-auto mb-3" />
                <h3 className="text-base font-black text-foreground uppercase tracking-wide">
                  NO STATISTICS AVAILABLE YET
                </h3>
                <p className="text-xs text-muted-foreground mt-1.5 max-w-md mx-auto leading-relaxed">
                  Official statistics will appear here once verified league matches are recorded. All records are calculated automatically from real match data without fake demo values.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {allRecords.map((record) => {
                  const isManual = record.sourceType === "MANUAL";

                  return (
                    <div
                      key={record.id}
                      className="group relative overflow-hidden rounded-2xl border border-border bg-card/85 p-5 backdrop-blur-md shadow-xl flex flex-col justify-between hover:border-secondary/40 transition-all"
                    >
                      <div className="space-y-4">
                        {/* Header: Title and Source Type */}
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
                            {record.title}
                          </span>

                          {isManual ? (
                            <Badge variant="outline" className="text-xs font-mono font-bold">
                              ✎ Historical
                            </Badge>
                          ) : (
                            <Badge variant="yellow" className="text-xs font-mono font-bold">
                              🔒 Official
                            </Badge>
                          )}
                        </div>

                        {/* Big Metric Display */}
                        <div className="p-4 rounded-xl bg-background/90 border border-secondary/20 flex items-center justify-between">
                          <div>
                            <span className="text-xs font-mono text-muted-foreground uppercase block">
                              Record Value
                            </span>
                            <div className="text-2xl sm:text-3xl font-black text-secondary font-mono tracking-tight">
                              {record.valueFormatted}
                            </div>
                          </div>
                          <div className="h-10 w-10 rounded-xl bg-secondary/10 border border-secondary/25 flex items-center justify-center shrink-0">
                            {record.category === "GOALS" ? (
                              <Flame className="h-5 w-5 text-secondary" />
                            ) : record.category === "WIN_RATE" ? (
                              <TrendingUp className="h-5 w-5 text-secondary" />
                            ) : (
                              <Trophy className="h-5 w-5 text-secondary" />
                            )}
                          </div>
                        </div>

                        {/* Record Holders (Supports Ties) */}
                        <div className="space-y-2">
                          <span className="text-xs font-mono uppercase text-muted-foreground block font-bold">
                            Record Holder{record.holders.length > 1 ? "s (Tied)" : ""}:
                          </span>

                          <div className="space-y-2">
                            {record.holders.map((holder, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40 border border-border/80"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="h-8 w-8 rounded-lg overflow-hidden bg-muted border border-border shrink-0 flex items-center justify-center">
                                    {holder.avatar ? (
                                      <img
                                        src={holder.avatar}
                                        alt={holder.gamerTag}
                                        className="h-full w-full object-cover"
                                      />
                                    ) : (
                                      <User className="h-4 w-4 text-muted-foreground" />
                                    )}
                                  </div>

                                  <div className="min-w-0">
                                    <div className="text-xs font-black text-foreground truncate">
                                      {holder.gamerTag}
                                    </div>
                                    {holder.detail && (
                                      <div className="text-xs text-muted-foreground truncate">
                                        {holder.detail}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {!isManual && (
                                  <button
                                    type="button"
                                    onClick={() => openAuditModal(holder.gamerTag)}
                                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-card shrink-0 transition-colors cursor-pointer"
                                    title="View Athlete Statistics"
                                  >
                                    <Eye className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Record Footer / Transparency Note */}
                      <div className="pt-3 mt-4 border-t border-border/80 text-xs text-muted-foreground flex items-center justify-between font-mono">
                        <span className="truncate max-w-64" title={record.transparencyNote}>
                          {record.transparencyNote}
                        </span>
                        <Info className="h-3.5 w-3.5 text-muted-foreground shrink-0 ml-1" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: ALL-TIME STATISTICAL LEADERBOARD (Requirement 01, 06, 07) */}
        {/* ========================================================================= */}
        {activeTab === "LEADERBOARD" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black uppercase text-foreground tracking-tight flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-secondary" />
                  All-Time Statistical Leaderboard
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Complete career and seasonal records calculated directly from official match results.
                </p>
              </div>
            </div>

            {/* Empty check */}
            {!hasOfficialData && filteredPlayers.length === 0 ? (
              <div className="rounded-3xl border border-border bg-card/60 p-12 text-center backdrop-blur-sm">
                <TrendingUp className="h-12 w-12 text-secondary/30 mx-auto mb-3" />
                <h3 className="text-base font-black text-foreground uppercase tracking-wide">
                  NO STATISTICS AVAILABLE YET
                </h3>
                <p className="text-xs text-muted-foreground mt-1.5 max-w-md mx-auto leading-relaxed">
                  Official statistics will appear here once verified league matches are recorded. All career matches, goals, and trophies update automatically.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Table View */}
                <div className="overflow-x-auto rounded-2xl border border-border bg-card/80 backdrop-blur-md">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-muted/40 text-muted-foreground uppercase text-xs border-b border-border">
                      <tr>
                        <th className="py-3 px-4">Rank & Athlete</th>
                        <th className="py-3 px-3 text-center">Division</th>
                        <th className="py-3 px-3 text-center">Matches</th>
                        <th className="py-3 px-3 text-center">W - D - L</th>
                        <th className="py-3 px-3 text-center">Goals (GD)</th>
                        <th className="py-3 px-3 text-center">Clean Sheets</th>
                        <th className="py-3 px-3 text-center">Win Rate</th>
                        <th className="py-3 px-3 text-center">Trophies</th>
                        <th className="py-3 px-3 text-center">Streak</th>
                        <th className="py-3 px-4 text-right">Audit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {filteredPlayers.map((player, idx) => (
                        <tr
                          key={player.gamerTag}
                          className="hover:bg-muted/20 transition-colors group"
                        >
                          {/* Rank & Athlete */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-bold text-muted-foreground w-5 text-right font-mono">
                                #{idx + 1}
                              </span>

                              <div className="h-8 w-8 rounded-lg overflow-hidden bg-muted border border-border shrink-0 flex items-center justify-center">
                                {player.avatar ? (
                                  <img
                                    src={player.avatar}
                                    alt={player.gamerTag}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <User className="h-4 w-4 text-muted-foreground" />
                                )}
                              </div>

                              <div className="min-w-0">
                                <div className="font-black text-foreground font-sans flex items-center gap-1.5">
                                  <span>{player.gamerTag}</span>
                                  {player.isInducted && (
                                    <Crown className="h-3 w-3 text-secondary shrink-0" />
                                  )}
                                </div>
                                {player.fullName && (
                                  <div className="text-xs text-muted-foreground font-sans truncate">
                                    {player.fullName}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Division */}
                          <td className="py-3 px-3 text-center text-xs font-sans text-muted-foreground">
                            {player.currentDivision || "Division 1"}
                          </td>

                          {/* Matches */}
                          <td className="py-3 px-3 text-center font-bold text-foreground">
                            {player.matchesPlayed}
                          </td>

                          {/* W - D - L */}
                          <td className="py-3 px-3 text-center text-muted-foreground">
                            <span className="text-foreground font-bold">{player.wins}</span> -{" "}
                            {player.draws} - {player.losses}
                          </td>

                          {/* Goals (GD) */}
                          <td className="py-3 px-3 text-center">
                            <span className="font-bold text-secondary">
                              {player.goalsScored}
                            </span>{" "}
                            <span className="text-xs text-muted-foreground">
                              ({player.goalDifference > 0 ? `+${player.goalDifference}` : player.goalDifference})
                            </span>
                          </td>

                          {/* Clean Sheets */}
                          <td className="py-3 px-3 text-center text-muted-foreground">
                            {player.cleanSheets}
                          </td>

                          {/* Win Rate */}
                          <td className="py-3 px-3 text-center font-bold text-foreground">
                            {player.winPercentage.toFixed(1)}%
                          </td>

                          {/* Trophies Breakdown */}
                          <td className="py-3 px-3 text-center">
                            {player.totalTrophies > 0 ? (
                              <Badge variant="yellow" className="text-xs font-bold font-mono">
                                🏆 {player.totalTrophies}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>

                          {/* Streak */}
                          <td className="py-3 px-3 text-center">
                            {player.currentWinStreak > 0 ? (
                              <span className="text-secondary font-bold flex items-center justify-center gap-1">
                                <Flame className="h-3 w-3" />
                                {player.currentWinStreak}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>

                          {/* Audit Button */}
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => setSelectedPlayerForAudit(player)}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-muted/60 hover:bg-card text-foreground border border-border/80 transition-colors inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Eye className="h-3 w-3 text-secondary" />
                              <span>Inspect</span>
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
      </section>

      {/* ========================================================================= */}
      {/* AUDIT / TRANSPARENCY MODAL (Requirement 12) */}
      {/* ========================================================================= */}
      {selectedPlayerForAudit && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-4 animate-fade-in"
        >
          <div className="relative w-full max-w-3xl max-h-screen overflow-y-auto rounded-3xl border border-secondary/30 bg-card p-6 sm:p-8 space-y-6 shadow-2xl my-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
              <div className="flex items-center gap-3.5">
                <div className="h-14 w-14 rounded-2xl overflow-hidden bg-muted border border-secondary/30 shrink-0 flex items-center justify-center">
                  {selectedPlayerForAudit.avatar ? (
                    <img
                      src={selectedPlayerForAudit.avatar}
                      alt={selectedPlayerForAudit.gamerTag}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User className="h-7 w-7 text-secondary" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-black text-foreground">
                      {selectedPlayerForAudit.gamerTag}
                    </h3>
                    {selectedPlayerForAudit.isInducted && (
                      <Badge variant="yellow" className="text-xs font-mono">
                        👑 Inducted
                      </Badge>
                    )}
                  </div>
                  {selectedPlayerForAudit.fullName && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {selectedPlayerForAudit.fullName}
                    </p>
                  )}
                  <p className="text-xs font-mono text-secondary mt-1">
                    {selectedPlayerForAudit.currentDivision || "Division 1"} •{" "}
                    {selectedPlayerForAudit.seasonsParticipated.length} Season(s) Active
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedPlayerForAudit(null)}
                className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-background border border-border text-center">
                <span className="text-xs font-mono uppercase text-muted-foreground block">
                  Matches
                </span>
                <span className="text-lg font-black text-foreground font-mono">
                  {selectedPlayerForAudit.matchesPlayed}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-background border border-border text-center">
                <span className="text-xs font-mono uppercase text-muted-foreground block">
                  Record
                </span>
                <span className="text-lg font-black text-foreground font-mono">
                  {selectedPlayerForAudit.wins}W - {selectedPlayerForAudit.draws}D - {selectedPlayerForAudit.losses}L
                </span>
              </div>
              <div className="p-3 rounded-xl bg-background border border-border text-center">
                <span className="text-xs font-mono uppercase text-muted-foreground block">
                  Goals (GD)
                </span>
                <span className="text-lg font-black text-secondary font-mono">
                  {selectedPlayerForAudit.goalsScored} ({selectedPlayerForAudit.goalDifference > 0 ? `+${selectedPlayerForAudit.goalDifference}` : selectedPlayerForAudit.goalDifference})
                </span>
              </div>
              <div className="p-3 rounded-xl bg-background border border-border text-center">
                <span className="text-xs font-mono uppercase text-muted-foreground block">
                  Win Rate
                </span>
                <span className="text-lg font-black text-foreground font-mono">
                  {selectedPlayerForAudit.winPercentage.toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Trophies Breakdown (Requirement 06) */}
            <div className="p-4 rounded-2xl bg-secondary/10 border border-secondary/25 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-secondary font-bold flex items-center gap-1.5">
                  <Trophy className="h-4 w-4" />
                  Official Trophies Won ({selectedPlayerForAudit.totalTrophies})
                </span>
                <span className="text-xs text-muted-foreground font-mono">
                  All Competitions
                </span>
              </div>

              <div className="flex items-center gap-3 flex-wrap text-xs font-mono">
                <span className="text-foreground">
                  <strong>{selectedPlayerForAudit.leagueTitles}</strong> Division 1
                </span>
                <span className="text-muted-foreground">•</span>
                <span className="text-foreground">
                  <strong>{selectedPlayerForAudit.uclTitles}</strong> UCL
                </span>
                <span className="text-muted-foreground">•</span>
                <span className="text-foreground">
                  <strong>{selectedPlayerForAudit.europaTitles}</strong> Europa
                </span>
                <span className="text-muted-foreground">•</span>
                <span className="text-foreground">
                  <strong>{selectedPlayerForAudit.d2Titles + selectedPlayerForAudit.d3Titles}</strong> Lower Tier
                </span>
              </div>
            </div>

            {/* Official Matches Verified Log (Requirement 12) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-muted-foreground font-bold flex items-center gap-1.5">
                  <History className="h-4 w-4 text-secondary" />
                  Verified Official Match Log ({selectedPlayerForAudit.officialMatchesSummary.length})
                </span>
                <span className="text-xs text-muted-foreground font-mono">
                  Database Verified Only
                </span>
              </div>

              {selectedPlayerForAudit.officialMatchesSummary.length === 0 ? (
                <div className="p-6 rounded-xl border border-border bg-background/50 text-center text-xs text-muted-foreground">
                  No individual match logs available in the current active season cycle.
                </div>
              ) : (
                <div className="overflow-x-auto max-h-60 rounded-xl border border-border">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-muted/60 text-muted-foreground uppercase text-xs sticky top-0">
                      <tr>
                        <th className="py-2 px-3">Date</th>
                        <th className="py-2 px-3">Comp</th>
                        <th className="py-2 px-3">Opponent</th>
                        <th className="py-2 px-3 text-center">Score</th>
                        <th className="py-2 px-3 text-center">Outcome</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60 bg-background/80">
                      {selectedPlayerForAudit.officialMatchesSummary.map((m, idx) => (
                        <tr key={idx} className="hover:bg-muted/20">
                          <td className="py-2 px-3 text-muted-foreground">
                            {new Date(m.date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </td>
                          <td className="py-2 px-3 text-foreground font-bold truncate max-w-28">
                            {m.competition}
                          </td>
                          <td className="py-2 px-3 text-foreground truncate max-w-32">
                            vs {m.opponentGamerTag} ({m.homeOrAway})
                          </td>
                          <td className="py-2 px-3 text-center font-bold text-secondary">
                            {m.playerScore} - {m.opponentScore}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <span
                              className={`px-1.5 py-0.5 rounded text-xs font-bold ${
                                m.result === "W"
                                  ? "bg-secondary text-secondary-foreground"
                                  : m.result === "D"
                                  ? "bg-muted text-muted-foreground"
                                  : "bg-destructive/20 text-destructive"
                              }`}
                            >
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

            {/* Modal Footer */}
            <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground font-mono">
              <span className="flex items-center gap-1 text-secondary">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Verified League Engine Record
              </span>
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

      {/* Community Call to Action */}
      <section className="rounded-2xl border border-secondary/25 bg-gradient-to-r from-card via-card/90 to-card p-6 sm:p-8 backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-center sm:text-left">
          <h3 className="text-lg font-black text-foreground uppercase tracking-tight flex items-center justify-center sm:justify-start gap-2">
            <Sparkles className="h-4 w-4 text-secondary" />
            Cement Your Esports Legacy
          </h3>
          <p className="text-xs text-muted-foreground max-w-xl">
            Compete in official Rwandan eFootball divisions, advance to continental UCL and Europa tournaments, and earn your place among immortalized champions.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/standings"
            className="px-4 py-2 rounded-xl text-xs font-bold bg-card border border-border text-foreground hover:bg-muted transition-colors flex items-center gap-1.5"
          >
            <Shield className="h-3.5 w-3.5 text-primary" />
            <span>View Standings</span>
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 rounded-xl text-xs font-bold bg-secondary text-secondary-foreground hover:opacity-90 transition-opacity flex items-center gap-1.5"
          >
            <span>Join Season</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
