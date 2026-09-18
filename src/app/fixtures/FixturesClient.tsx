"use client";

import { useState, useMemo, useEffect } from "react";
import MatchCard from "@/components/MatchCard";
import MatchOfTheDayCard from "@/components/MatchOfTheDayCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Gamepad2,
  Search,
  Filter,
  X,
  Trophy,
  Globe,
  ArrowUpDown,
  Flame,
} from "lucide-react";

interface FixturesClientProps {
  initialMatches: any[];
  leagueConfig: any;
  matchOfTheDay?: any;
  initialFilter?: string;
  initialDivision?: string;
  initialRound?: string;
}

export default function FixturesClient({
  initialMatches,
  leagueConfig,
  matchOfTheDay,
  initialFilter = "ALL",
  initialDivision = "ALL",
  initialRound = "ALL",
}: FixturesClientProps) {
  const currentMatchdayName = `Matchday ${leagueConfig?.currentMatchday || 1}`;

  const [divisionFilter, setDivisionFilter] = useState<string>(initialDivision);
  const [roundFilter, setRoundFilter] = useState<string>(initialRound);
  const [statusFilter, setStatusFilter] = useState<string>(initialFilter);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"CHRONOLOGICAL" | "LATEST">("CHRONOLOGICAL");

  // Keep URL search params in sync smoothly without full page reloads
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams();
    if (divisionFilter !== "ALL") params.set("division", divisionFilter);
    if (roundFilter !== "ALL") params.set("round", roundFilter);
    if (statusFilter !== "ALL") params.set("filter", statusFilter);
    if (searchQuery.trim()) params.set("q", searchQuery.trim());
    const newUrl = params.toString() ? `/fixtures?${params.toString()}` : "/fixtures";
    window.history.replaceState(null, "", newUrl);
  }, [divisionFilter, roundFilter, statusFilter, searchQuery]);

  // Extract all distinct rounds present in fixtures sorted naturally
  const distinctRounds = useMemo(() => {
    const roundsSet = new Set<string>();
    initialMatches.forEach((m) => {
      if (m.round) roundsSet.add(m.round);
    });

    return Array.from(roundsSet).sort((a, b) => {
      const getRoundNum = (s: string) => {
        const match = s.match(/\d+/);
        return match ? parseInt(match[0], 10) : 999;
      };
      const numA = getRoundNum(a);
      const numB = getRoundNum(b);
      if (numA !== numB) return numA - numB;
      return a.localeCompare(b);
    });
  }, [initialMatches]);

  // Filter and sort matches
  const filteredMatches = useMemo(() => {
    return initialMatches
      .filter((m) => {
        // Division Filter
        if (divisionFilter !== "ALL") {
          if (divisionFilter === "UCL") {
            if (m.division !== "UCL" && !m.division?.includes("UCL")) return false;
          } else if (divisionFilter === "EUROPA") {
            if (m.division !== "EUROPA" && !m.division?.toLowerCase().includes("europa")) return false;
          } else if (m.division !== divisionFilter) {
            return false;
          }
        }

        // Round Filter
        if (roundFilter !== "ALL" && m.round !== roundFilter) {
          return false;
        }

        // Status Filter
        if (statusFilter === "LIVE" && m.status !== "LIVE") return false;
        if (statusFilter === "SCHEDULED" && m.status !== "SCHEDULED") return false;
        if (statusFilter === "FINISHED" && m.status !== "FINISHED" && m.status !== "FORFEIT") return false;

        // Search Query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const homeTag = m.homePlayer?.gamerTag?.toLowerCase() || "";
          const awayTag = m.awayPlayer?.gamerTag?.toLowerCase() || "";
          const homeName = m.homePlayer?.fullName?.toLowerCase() || "";
          const awayName = m.awayPlayer?.fullName?.toLowerCase() || "";
          const homeId = m.homePlayer?.efootballId?.toLowerCase() || "";
          const awayId = m.awayPlayer?.efootballId?.toLowerCase() || "";
          const roundName = m.round?.toLowerCase() || "";
          const divName = m.division?.toLowerCase() || "";

          if (
            !homeTag.includes(q) &&
            !awayTag.includes(q) &&
            !homeName.includes(q) &&
            !awayName.includes(q) &&
            !homeId.includes(q) &&
            !awayId.includes(q) &&
            !roundName.includes(q) &&
            !divName.includes(q)
          ) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        const getRoundNum = (s: string) => {
          const match = s?.match(/\d+/);
          return match ? parseInt(match[0], 10) : 999;
        };

        if (sortOrder === "CHRONOLOGICAL") {
          const numA = getRoundNum(a.round || "");
          const numB = getRoundNum(b.round || "");
          if (numA !== numB) return numA - numB;
          return new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime();
        } else {
          return new Date(b.matchDate).getTime() - new Date(a.matchDate).getTime();
        }
      });
  }, [initialMatches, divisionFilter, roundFilter, statusFilter, searchQuery, sortOrder]);

  const hasActiveFilters =
    divisionFilter !== "ALL" ||
    roundFilter !== "ALL" ||
    statusFilter !== "ALL" ||
    Boolean(searchQuery.trim());

  const handleResetFilters = () => {
    setDivisionFilter("ALL");
    setRoundFilter("ALL");
    setStatusFilter("ALL");
    setSearchQuery("");
  };

  const handleJumpToCurrentMatchday = () => {
    setRoundFilter(currentMatchdayName);
  };

  // Stats calculation
  const totalCompleted = useMemo(
    () => initialMatches.filter((m) => m.status === "FINISHED" || m.status === "FORFEIT").length,
    [initialMatches]
  );
  const totalUpcoming = useMemo(
    () => initialMatches.filter((m) => m.status === "SCHEDULED").length,
    [initialMatches]
  );

  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6 sm:space-y-8">
      {/* Match of the Day Showcase */}
      {matchOfTheDay && (
        <section className="space-y-2">
          <MatchOfTheDayCard match={matchOfTheDay} />
        </section>
      )}

      {/* Hero Header & Quick Stats */}
      <div className="rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 p-5 sm:p-7 backdrop-blur-xl shadow-2xl relative overflow-hidden space-y-5">
        <div className="absolute top-0 right-0 w-72 h-72 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge variant="yellow" className="font-mono text-[10px] font-black">
                EFRL 2026 FIXTURES
              </Badge>
              <Badge variant="outline" className="text-[10px] text-sky-400 border-sky-500/30">
                Official Season Match Calendar
              </Badge>
              <button
                type="button"
                onClick={handleJumpToCurrentMatchday}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-[10px] font-bold hover:bg-cyan-500/30 transition cursor-pointer"
                title="Click to filter by current matchday"
              >
                <Flame className="h-3 w-3 text-cyan-400 animate-pulse" />
                <span>Current: {currentMatchdayName}</span>
              </button>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black uppercase text-white tracking-tight">
              Official Tournament Match Center
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
              Real-time schedule, results, walkover records, and screenshot verifications across 3 Domestic Divisions, eFootball Champions League, and Europa League.
            </p>
          </div>

          {/* Quick Stats Pill Grid */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 shrink-0">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3 text-center min-w-[80px]">
              <span className="text-[9px] font-black uppercase text-slate-400 block">Total</span>
              <span className="text-base sm:text-xl font-black text-white font-mono">{initialMatches.length}</span>
            </div>
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-3 text-center min-w-[80px]">
              <span className="text-[9px] font-black uppercase text-emerald-400 block">Finished</span>
              <span className="text-base sm:text-xl font-black text-emerald-400 font-mono">{totalCompleted}</span>
            </div>
            <div className="rounded-2xl border border-yellow-500/30 bg-yellow-950/20 p-3 text-center min-w-[80px]">
              <span className="text-[9px] font-black uppercase text-yellow-400 block">Upcoming</span>
              <span className="text-base sm:text-xl font-black text-yellow-400 font-mono">{totalUpcoming}</span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* COMPREHENSIVE FILTERING & SEARCH TOOLBAR */}
        {/* ========================================================================= */}
        <div className="space-y-4">
          {/* Row 1: Division & Competition Selectors (Horizontally scrollable on mobile) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth -mx-2 px-2 sm:mx-0 sm:px-0">
              {[
                { id: "ALL", label: "All Competitions", icon: Trophy },
                { id: "Division 1", label: "Division 1", icon: null },
                { id: "Division 2", label: "Division 2", icon: null },
                { id: "Division 3", label: "Division 3", icon: null },
                { id: "UCL", label: "eFootball UCL", icon: Globe },
                { id: "EUROPA", label: "Europa League", icon: Globe },
              ].map((div) => {
                const isSelected = divisionFilter === div.id;
                const Icon = div.icon;
                return (
                  <button
                    key={div.id}
                    type="button"
                    onClick={() => setDivisionFilter(div.id)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 min-h-[38px] ${
                      isSelected
                        ? "bg-sky-500 text-white shadow-lg shadow-sky-500/30 font-black"
                        : "text-slate-400 hover:text-white bg-slate-900/60 border border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    {Icon && <Icon className="h-3.5 w-3.5" />}
                    <span>{div.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Sort Toggle */}
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setSortOrder(sortOrder === "CHRONOLOGICAL" ? "LATEST" : "CHRONOLOGICAL")
                }
                className="text-xs font-bold border-slate-800 text-slate-300 hover:text-white gap-1.5 h-9"
              >
                <ArrowUpDown className="h-3.5 w-3.5 text-cyan-400" />
                <span>{sortOrder === "CHRONOLOGICAL" ? "Round 1 First" : "Latest First"}</span>
              </Button>
            </div>
          </div>

          {/* Row 2: Matchday / Round Selector, Status Pills, and Athlete Search */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center pt-1">
            {/* Matchday Selector Dropdown */}
            <div className="md:col-span-4 flex items-center gap-2">
              <div className="relative w-full">
                <select
                  value={roundFilter}
                  onChange={(e) => setRoundFilter(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-slate-800 bg-slate-900/90 py-2.5 pl-3.5 pr-8 text-xs font-bold text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                >
                  <option value="ALL">All Matchday Rounds ({distinctRounds.length})</option>
                  {distinctRounds.map((roundName) => (
                    <option key={roundName} value={roundName}>
                      {roundName === currentMatchdayName ? `🔥 ${roundName} (Current Active)` : roundName}
                    </option>
                  ))}
                </select>
                <Filter className="h-3.5 w-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Status Pills */}
            <div className="md:col-span-5 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {[
                { id: "ALL", label: "All Statuses" },
                { id: "SCHEDULED", label: "Scheduled" },
                { id: "LIVE", label: "Live Window" },
                { id: "FINISHED", label: "Completed Results" },
              ].map((st) => {
                const isSelected = statusFilter === st.id;
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setStatusFilter(st.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                      isSelected
                        ? "bg-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-500/20"
                        : "text-slate-400 hover:text-white bg-slate-900 border border-slate-800"
                    }`}
                  >
                    {st.label}
                  </button>
                );
              })}
            </div>

            {/* Realtime Player Search Input */}
            <div className="md:col-span-3 relative">
              <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search athlete tag, name, ID..."
                className="w-full rounded-xl border border-slate-800 bg-slate-900 py-2 pl-9 pr-8 text-xs text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-bold p-1"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Active Filter Indicator & Reset Button */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/60 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-slate-400 font-medium">Active Filters:</span>
                {divisionFilter !== "ALL" && (
                  <Badge variant="yellow" className="text-[10px] gap-1 font-bold">
                    <span>{divisionFilter}</span>
                    <button onClick={() => setDivisionFilter("ALL")} className="hover:text-slate-950 ml-1">×</button>
                  </Badge>
                )}
                {roundFilter !== "ALL" && (
                  <Badge variant="outline" className="text-[10px] gap-1 text-cyan-300 border-cyan-500/40">
                    <span>{roundFilter}</span>
                    <button onClick={() => setRoundFilter("ALL")} className="hover:text-white ml-1">×</button>
                  </Badge>
                )}
                {statusFilter !== "ALL" && (
                  <Badge variant="secondary" className="text-[10px] gap-1 text-white">
                    <span>{statusFilter}</span>
                    <button onClick={() => setStatusFilter("ALL")} className="hover:text-white ml-1">×</button>
                  </Badge>
                )}
                {searchQuery.trim() && (
                  <Badge variant="outline" className="text-[10px] gap-1 text-emerald-400 border-emerald-500/40">
                    <span>&quot;{searchQuery.trim()}&quot;</span>
                    <button onClick={() => setSearchQuery("")} className="hover:text-white ml-1">×</button>
                  </Badge>
                )}
              </div>

              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs font-bold text-amber-400 hover:text-amber-300 transition"
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filter Results Counter */}
      <div className="flex items-center justify-between px-1 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span>
            Showing <strong className="text-white font-mono text-sm">{filteredMatches.length}</strong> of {initialMatches.length} fixtures
          </span>
          {divisionFilter !== "ALL" && (
            <span className="text-sky-400 font-semibold">• {divisionFilter}</span>
          )}
          {roundFilter !== "ALL" && (
            <span className="text-yellow-400 font-semibold">• {roundFilter}</span>
          )}
        </div>
      </div>

      {/* Matches Grid */}
      {filteredMatches.length === 0 ? (
        <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-12 text-center space-y-4">
          <Gamepad2 className="h-12 w-12 text-slate-600 mx-auto" />
          <h3 className="text-lg font-black uppercase text-white">No Generated Fixtures Found</h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
            {initialMatches.length === 0
              ? "The League Commissioner has not yet generated official fixtures for this season. Please check back after registration closes."
              : "No fixtures match your current filter selections. Try selecting another round or clearing your search query."}
          </p>
          {hasActiveFilters && (
            <Button variant="yellow" size="sm" onClick={handleResetFilters} className="text-xs font-black mt-2">
              Reset All Filters
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredMatches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      )}
    </div>
  );
}
