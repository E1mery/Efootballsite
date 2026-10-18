"use client";

import { useState, useMemo, useTransition, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Trophy,
  Calendar,
  Download,
  Share2,
  Check,
  Globe,
  Sliders,
  ArrowLeft,
  MessageSquare,
  Sparkles,
  ExternalLink,
  Clock,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  exportStandingsTablePng,
  exportFixturesPng,
  generateWhatsAppBroadcastText,
  getCompetitionBackground,
  type ExportStandingItem,
  type ExportFixtureItem,
} from "@/lib/matchdayImageExporter";

export interface MatchdayOverviewProps {
  leagueConfig: {
    season: string;
    currentMatchday: number;
    uclStarted?: boolean;
    europaStarted?: boolean;
  };
  allStandings: any[];
  allMatches: any[];
  uclGroupSlots?: any[];
}

export default function MatchdayOverviewManager({
  leagueConfig,
  allStandings,
  allMatches,
  uclGroupSlots = [],
}: MatchdayOverviewProps) {
  const router = useRouter();
  const currentMatchdayNum = leagueConfig.currentMatchday || 1;
  const nextMatchdayNum = currentMatchdayNum + 1;
  const nextMatchdayRoundName = `Matchday ${nextMatchdayNum}`;

  // Find active matchday deadline timestamp
  const currentMatchdayDeadline = useMemo(() => {
    const curRoundName = `Matchday ${currentMatchdayNum}`.toLowerCase();
    for (const m of allMatches) {
      if ((m.round || "").toLowerCase().trim() === curRoundName && m.deadlineDate) {
        return new Date(m.deadlineDate);
      }
    }
    return null;
  }, [allMatches, currentMatchdayNum]);

  const [now, setNow] = useState<Date>(() => new Date());
  const [isSyncing, setIsSyncing] = useState(false);

  // Periodic clock check for deadline arrival
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const isCurrentMatchdayDeadlinePassed = useMemo(() => {
    if (!currentMatchdayDeadline) return false;
    return now >= currentMatchdayDeadline;
  }, [currentMatchdayDeadline, now]);

  // Default selected round: if deadline already elapsed, default to the upcoming next matchday
  const [selectedRound, setSelectedRound] = useState<string>(() => {
    if (currentMatchdayDeadline && new Date() >= currentMatchdayDeadline) {
      return `Matchday ${currentMatchdayNum + 1}`;
    }
    return `Matchday ${currentMatchdayNum}`;
  });
  const [selectedDivisionTab, setSelectedDivisionTab] = useState<string>("ALL");
  const [copiedDivision, setCopiedDivision] = useState<string | null>(null);
  const [exportingState, setExportingState] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Trigger manual sync or server auto-advance
  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await fetch("/api/admin/daily-cycle", { method: "POST" });
      router.refresh();
    } catch (err) {
      console.error("Auto sync error:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Real-time automatic daily cycle sync when deadline expires on screen
  useEffect(() => {
    if (!currentMatchdayDeadline) return;
    const ms = currentMatchdayDeadline.getTime() - Date.now();
    if (ms > 0 && ms < 86400000) {
      const timer = setTimeout(async () => {
        try {
          await fetch("/api/admin/daily-cycle", { method: "POST" });
        } catch {}
        router.refresh();
      }, ms + 1500);
      return () => clearTimeout(timer);
    }
  }, [currentMatchdayDeadline, router]);

  // Extract distinct rounds available in matches
  const availableRounds = useMemo(() => {
    const roundSet = new Set<string>();
    // Ensure current round is always present
    roundSet.add(`Matchday ${currentMatchdayNum}`);

    allMatches.forEach((m) => {
      if (m.round && typeof m.round === "string") {
        roundSet.add(m.round.trim());
      }
    });

    return Array.from(roundSet).sort((a, b) => {
      const numA = parseInt(a.replace(/[^0-9]/g, ""), 10) || 0;
      const numB = parseInt(b.replace(/[^0-9]/g, ""), 10) || 0;
      return numA - numB;
    });
  }, [allMatches, currentMatchdayNum]);

  // Group standings by division
  const divisionStandingsMap = useMemo(() => {
    const map: Record<string, ExportStandingItem[]> = {
      "Division 1": [],
      "Division 2": [],
      "Division 3": [],
    };

    allStandings.forEach((st: any) => {
      const divName = st.division || "Division 1";
      if (!map[divName]) map[divName] = [];
      map[divName].push({
        rank: st.rank || 1,
        gamerTag: st.player?.gamerTag || "Unknown",
        realTeam: st.player?.realTeam || null,
        played: st.played ?? 0,
        won: st.won ?? 0,
        drawn: st.drawn ?? 0,
        lost: st.lost ?? 0,
        goalsFor: st.goalsFor ?? 0,
        goalsAgainst: st.goalsAgainst ?? 0,
        goalDifference: st.goalDifference ?? 0,
        points: st.points ?? 0,
      });
    });

    // Sort each division by Points -> GD -> GF -> Won
    Object.keys(map).forEach((divKey) => {
      map[divKey].sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
        if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
        return b.won - a.won;
      });
      // Re-assign 1-based ranks
      map[divKey] = map[divKey].map((item, idx) => ({ ...item, rank: idx + 1 }));
    });

    return map;
  }, [allStandings]);

  // Helper to extract matches for a specific round dynamically
  const getMatchesForRound = useCallback(
    (roundName: string) => {
      const map: Record<string, ExportFixtureItem[]> = {
        "Division 1": [],
        "Division 2": [],
        "Division 3": [],
        UCL: [],
        EUROPA: [],
      };

      const targetRound = roundName.toLowerCase().trim();

      allMatches.forEach((m: any) => {
        const matchRound = (m.round || "").toLowerCase().trim();
        if (matchRound !== targetRound) return;

        const div = m.division || "Division 1";
        const key = div.toUpperCase().includes("UCL")
          ? "UCL"
          : div.toUpperCase().includes("EUROPA")
          ? "EUROPA"
          : div;

        if (!map[key]) map[key] = [];

        map[key].push({
          id: m.id,
          round: m.round,
          division: m.division,
          homeGamerTag: m.homePlayer?.gamerTag || "TBD",
          homeTeam: m.homePlayer?.realTeam || null,
          awayGamerTag: m.awayPlayer?.gamerTag || "TBD",
          awayTeam: m.awayPlayer?.realTeam || null,
          homeScore: m.homeScore,
          awayScore: m.awayScore,
          status: m.status || "SCHEDULED",
          matchDate: m.matchDate,
          deadlineDate: m.deadlineDate,
        });
      });

      return map;
    },
    [allMatches]
  );

  // Filter matches for the selected round and group by division (active UI view)
  const matchesByDivision = useMemo(() => {
    return getMatchesForRound(selectedRound);
  }, [getMatchesForRound, selectedRound]);

  // Round resolution for downloads:
  // When deadline has elapsed for the current matchday, the fixtures download targets next matchday!
  const fixturesRoundName = useMemo(() => {
    if (isCurrentMatchdayDeadlinePassed && selectedRound === `Matchday ${currentMatchdayNum}`) {
      if (availableRounds.includes(nextMatchdayRoundName)) {
        return nextMatchdayRoundName;
      }
    }
    return selectedRound;
  }, [isCurrentMatchdayDeadlinePassed, selectedRound, currentMatchdayNum, nextMatchdayRoundName, availableRounds]);

  // Standings table represents the concluded round
  const tableRoundName = useMemo(() => {
    if (selectedRound === `Matchday ${currentMatchdayNum}`) {
      return isCurrentMatchdayDeadlinePassed
        ? `Matchday ${currentMatchdayNum}`
        : currentMatchdayNum > 1
        ? `Matchday ${currentMatchdayNum - 1}`
        : `Matchday 1`;
    }
    return selectedRound;
  }, [selectedRound, currentMatchdayNum, isCurrentMatchdayDeadlinePassed]);

  // Divisions to render based on user tab filter
  const activeCompetitions = useMemo(() => {
    const base = [
      { id: "Division 1", title: "Division 1 Premiership", shortTitle: "Div 1" },
      { id: "Division 2", title: "Division 2 Championship", shortTitle: "Div 2" },
      { id: "Division 3", title: "Division 3 Academy", shortTitle: "Div 3" },
    ];

    if (leagueConfig.uclStarted || matchesByDivision.UCL.length > 0) {
      base.push({ id: "UCL", title: "UEFA Champions League", shortTitle: "UCL" });
    }
    if (leagueConfig.europaStarted || matchesByDivision.EUROPA.length > 0) {
      base.push({ id: "EUROPA", title: "UEFA Europa League", shortTitle: "Europa" });
    }

    if (selectedDivisionTab === "ALL") return base;
    return base.filter((c) => c.id === selectedDivisionTab);
  }, [selectedDivisionTab, leagueConfig.uclStarted, leagueConfig.europaStarted, matchesByDivision]);

  // Handle Export Table as PNG
  const handleExportTable = async (division: string) => {
    const key = `table-${division}`;
    setExportingState(key);
    try {
      const standings = divisionStandingsMap[division] || [];
      await exportStandingsTablePng({
        division,
        standings,
        roundName: tableRoundName,
        season: leagueConfig.season,
      });
    } catch (err) {
      console.error("Export Table Error:", err);
    } finally {
      setExportingState(null);
    }
  };

  // Handle Export Fixtures as PNG
  const handleExportFixtures = async (division: string) => {
    const key = `fixtures-${division}`;
    setExportingState(key);
    try {
      const targetMatchesMap = getMatchesForRound(fixturesRoundName);
      const fixtures = targetMatchesMap[division] || [];
      await exportFixturesPng({
        division,
        matches: fixtures,
        roundName: fixturesRoundName,
        season: leagueConfig.season,
      });
    } catch (err) {
      console.error("Export Fixtures Error:", err);
    } finally {
      setExportingState(null);
    }
  };

  // Handle Copy WhatsApp Broadcast
  const handleCopyWhatsApp = (division: string) => {
    const standings = divisionStandingsMap[division] || [];
    const targetMatchesMap = getMatchesForRound(fixturesRoundName);
    const fixtures = targetMatchesMap[division] || [];
    const text = generateWhatsAppBroadcastText({
      division,
      standings,
      fixtures,
      roundName: fixturesRoundName,
      tableRoundName: tableRoundName,
      season: leagueConfig.season,
    });

    navigator.clipboard.writeText(text);
    setCopiedDivision(division);
    setTimeout(() => {
      setCopiedDivision(null);
    }, 2500);
  };

  // Handle Export All Tables in one click
  const handleExportAllTables = async () => {
    setExportingState("all-tables");
    try {
      for (const comp of activeCompetitions) {
        const standings = divisionStandingsMap[comp.id] || [];
        if (standings.length > 0) {
          await exportStandingsTablePng({
            division: comp.id,
            standings,
            roundName: tableRoundName,
            season: leagueConfig.season,
          });
          // Small pause between downloads to prevent browser throttling
          await new Promise((r) => setTimeout(r, 350));
        }
      }
    } finally {
      setExportingState(null);
    }
  };

  // Handle Export All Fixtures in one click
  const handleExportAllFixtures = async () => {
    setExportingState("all-fixtures");
    try {
      const targetMatchesMap = getMatchesForRound(fixturesRoundName);
      for (const comp of activeCompetitions) {
        const fixtures = targetMatchesMap[comp.id] || [];
        if (fixtures.length > 0) {
          await exportFixturesPng({
            division: comp.id,
            matches: fixtures,
            roundName: fixturesRoundName,
            season: leagueConfig.season,
          });
          await new Promise((r) => setTimeout(r, 350));
        }
      }
    } finally {
      setExportingState(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Navigation & Context Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="space-y-1">
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Admin Portal</span>
          </Link>
          <h1 className="text-xl sm:text-2xl font-black uppercase text-foreground tracking-tight flex items-center gap-2.5">
            <Trophy className="h-6 w-6 text-secondary" />
            <span>Matchday Central & Graphics Export Hub</span>
          </h1>
          <p className="text-xs text-muted-foreground max-w-2xl">
            Inspect all division standings and current round matchday fixtures. Download broadcast-grade PNG cards with official stadium backgrounds for WhatsApp status, groups, and social feeds.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link href="/admin">
            <Button variant="outline" size="sm" className="rounded-xl text-xs font-semibold gap-1.5">
              <Sliders className="h-3.5 w-3.5 text-primary" />
              <span>Admin Portal</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Deadline Rollover Status Alert */}
      {isCurrentMatchdayDeadlinePassed && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border border-secondary/30 bg-secondary/10 text-xs text-foreground shadow-sm">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-secondary shrink-0" />
            <div>
              <p className="font-bold text-foreground">
                Matchday {currentMatchdayNum} deadline has arrived.
              </p>
              <p className="text-muted-foreground mt-0.5">
                Downloads automatically target updated standings (after Matchday {currentMatchdayNum}) and upcoming {nextMatchdayRoundName} fixtures.
              </p>
            </div>
          </div>
          <Button
            onClick={handleManualSync}
            size="sm"
            variant="outline"
            className="text-xs h-8 px-3 font-bold shrink-0 self-start sm:self-center"
            disabled={isSyncing}
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isSyncing ? "animate-spin" : ""}`} />
            <span>{isSyncing ? "Syncing..." : "Sync & Advance"}</span>
          </Button>
        </div>
      )}

      {/* Control Strip: Round Selector, Competition Filter, and Master Downloads */}
      <div className="p-4 sm:p-5 rounded-2xl border border-border bg-card/80 backdrop-blur-xl shadow-lg space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Round Selector Dropdown / Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono uppercase font-bold text-muted-foreground flex items-center gap-1.5 mr-1">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              Round:
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {availableRounds.map((rnd) => {
                const isSelected = selectedRound === rnd;
                const isCurrent = rnd === `Matchday ${currentMatchdayNum}`;
                return (
                  <button
                    key={rnd}
                    type="button"
                    onClick={() => startTransition(() => setSelectedRound(rnd))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                    }`}
                  >
                    <span>{rnd}</span>
                    {isCurrent && (
                      <Badge variant="secondary" className="px-1 py-0 text-xs font-bold">
                        Live
                      </Badge>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Master Batch Export Actions */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Button
              onClick={handleExportAllTables}
              disabled={exportingState !== null}
              size="sm"
              className="bg-primary hover:bg-primary text-primary-foreground text-xs font-bold gap-1.5 shadow-md"
              title={`Export all standings tables PNG (${tableRoundName})`}
            >
              <Download className="h-3.5 w-3.5" />
              <span>{exportingState === "all-tables" ? "Exporting..." : "Export All Tables (PNG)"}</span>
            </Button>
            <Button
              onClick={handleExportAllFixtures}
              disabled={exportingState !== null}
              size="sm"
              variant="outline"
              className="text-xs font-bold gap-1.5"
              title={`Export all fixtures PNG (${fixturesRoundName})`}
            >
              <Download className="h-3.5 w-3.5 text-secondary" />
              <span>
                {exportingState === "all-fixtures"
                  ? "Exporting..."
                  : fixturesRoundName !== selectedRound
                  ? `Export ${fixturesRoundName} Fixtures (PNG)`
                  : "Export All Fixtures (PNG)"}
              </span>
            </Button>
          </div>
        </div>

        {/* Division Tab Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/60">
          <span className="text-xs font-mono uppercase font-bold text-muted-foreground mr-1">Filter View:</span>
          <button
            type="button"
            onClick={() => setSelectedDivisionTab("ALL")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              selectedDivisionTab === "ALL"
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            All Divisions Combined
          </button>
          <button
            type="button"
            onClick={() => setSelectedDivisionTab("Division 1")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              selectedDivisionTab === "Division 1"
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            Division 1 (Premiership)
          </button>
          <button
            type="button"
            onClick={() => setSelectedDivisionTab("Division 2")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              selectedDivisionTab === "Division 2"
                ? "bg-secondary text-secondary-foreground shadow-md font-black"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            Division 2 (Championship)
          </button>
          <button
            type="button"
            onClick={() => setSelectedDivisionTab("Division 3")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              selectedDivisionTab === "Division 3"
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            Division 3 (Academy)
          </button>
          {leagueConfig.uclStarted && (
            <button
              type="button"
              onClick={() => setSelectedDivisionTab("UCL")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                selectedDivisionTab === "UCL"
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Trophy className="h-3 w-3" />
              <span>UCL</span>
            </button>
          )}
          {leagueConfig.europaStarted && (
            <button
              type="button"
              onClick={() => setSelectedDivisionTab("EUROPA")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                selectedDivisionTab === "EUROPA"
                  ? "bg-secondary text-secondary-foreground shadow-md font-black"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Globe className="h-3 w-3" />
              <span>Europa</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Divisions Section */}
      <div className="space-y-8">
        {activeCompetitions.map((comp) => {
          const standings = divisionStandingsMap[comp.id] || [];
          const fixtures = matchesByDivision[comp.id] || [];
          const bgPath = getCompetitionBackground(comp.id);
          const isCopied = copiedDivision === comp.id;

          return (
            <div
              key={comp.id}
              className="relative overflow-hidden rounded-3xl border border-border bg-card/70 backdrop-blur-xl shadow-xl space-y-6"
            >
              {/* Competition Stadium Background Glow */}
              <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden opacity-10" aria-hidden="true">
                <Image
                  src={bgPath}
                  alt={comp.title}
                  fill
                  sizes="(max-width: 1200px) 100vw, 1200px"
                  className="object-cover object-center scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-card/80 via-card/95 to-card" />
              </div>

              {/* Relative Content Container */}
              <div className="relative z-10 p-5 sm:p-6 space-y-6">
                {/* Competition Card Header & Dedicated Download Buttons */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border/80">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-secondary">
                        {leagueConfig.season}
                      </span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs font-mono text-muted-foreground">Active Round: {selectedRound}</span>
                    </div>
                    <h2 className="text-lg sm:text-xl font-black uppercase text-foreground tracking-tight flex items-center gap-2">
                      {comp.id.includes("UCL") ? (
                        <Trophy className="h-5 w-5 text-secondary" />
                      ) : comp.id.includes("EUROPA") ? (
                        <Globe className="h-5 w-5 text-secondary" />
                      ) : (
                        <Trophy className="h-5 w-5 text-primary" />
                      )}
                      <span>{comp.title}</span>
                    </h2>
                  </div>

                  {/* Actions Bar for This Specific Division */}
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      onClick={() => handleExportTable(comp.id)}
                      disabled={exportingState !== null}
                      size="sm"
                      className="bg-primary hover:bg-primary text-primary-foreground text-xs font-bold gap-1.5 shadow-md"
                      title={`Download clean branded PNG with official stadium background (${tableRoundName})`}
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>{exportingState === `table-${comp.id}` ? "Exporting..." : "Download Table (PNG)"}</span>
                    </Button>

                    <Button
                      onClick={() => handleExportFixtures(comp.id)}
                      disabled={exportingState !== null}
                      size="sm"
                      variant="outline"
                      className="text-xs font-bold gap-1.5"
                      title={fixturesRoundName !== selectedRound ? `Deadline reached: Download upcoming ${fixturesRoundName} fixtures PNG card` : `Download ${fixturesRoundName} fixtures PNG card`}
                    >
                      <Calendar className="h-3.5 w-3.5 text-secondary" />
                      <span>
                        {exportingState === `fixtures-${comp.id}`
                          ? "Exporting..."
                          : fixturesRoundName !== selectedRound
                          ? `Download ${fixturesRoundName} (PNG)`
                          : "Download Fixtures (PNG)"}
                      </span>
                    </Button>

                    <Button
                      onClick={() => handleCopyWhatsApp(comp.id)}
                      size="sm"
                      variant="outline"
                      className="text-xs font-bold gap-1.5"
                      title="Copy formatted summary to paste directly in WhatsApp groups"
                    >
                      {isCopied ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-secondary" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <MessageSquare className="h-3.5 w-3.5 text-primary" />
                          <span>WhatsApp Text</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Grid: Left = Standings Table, Right = Selected Round Fixtures */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left Column: Standings Table (7 cols on desktop) */}
                  <div className="lg:col-span-7 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Trophy className="h-3.5 w-3.5 text-primary" />
                        <span>Official Standings Table ({standings.length} Players)</span>
                      </h3>
                      <span className="text-xs text-muted-foreground">Top 4 Continental / Bottom 3 Relegation</span>
                    </div>

                    {standings.length === 0 ? (
                      <div className="p-8 rounded-2xl border border-border bg-card/40 text-center text-xs text-muted-foreground">
                        No active standings registered for {comp.title}.
                      </div>
                    ) : (
                      <div className="overflow-x-auto rounded-2xl border border-border bg-card/60">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-border bg-muted/30 text-muted-foreground font-mono font-bold">
                              <th className="py-2.5 px-3 w-10 text-center">#</th>
                              <th className="py-2.5 px-3">Athlete / Tag</th>
                              <th className="py-2.5 px-3 hidden sm:table-cell">Club</th>
                              <th className="py-2.5 px-2 text-center">P</th>
                              <th className="py-2.5 px-2 text-center">W</th>
                              <th className="py-2.5 px-2 text-center">D</th>
                              <th className="py-2.5 px-2 text-center">L</th>
                              <th className="py-2.5 px-2 text-center">GD</th>
                              <th className="py-2.5 px-3 text-center text-secondary font-black">PTS</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/60">
                            {standings.map((row) => {
                              const isTop4 = row.rank <= 4;
                              const isRelegation = standings.length >= 10 && row.rank > standings.length - 3;
                              const gdFormatted = row.goalDifference > 0 ? `+${row.goalDifference}` : `${row.goalDifference}`;

                              return (
                                <tr key={row.gamerTag} className="hover:bg-muted/40 transition-colors">
                                  <td className="py-2.5 px-3 text-center font-bold">
                                    <span
                                      className={`inline-flex items-center justify-center w-5 h-5 rounded-md text-xs font-mono font-bold ${
                                        isTop4
                                          ? "bg-primary/20 text-primary"
                                          : isRelegation
                                          ? "bg-destructive/20 text-destructive"
                                          : "text-muted-foreground"
                                      }`}
                                    >
                                      {row.rank}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3 font-bold text-foreground">
                                    <div className="truncate max-w-36 sm:max-w-44">{row.gamerTag}</div>
                                  </td>
                                  <td className="py-2.5 px-3 text-muted-foreground hidden sm:table-cell">
                                    <div className="truncate max-w-32">{row.realTeam || "Unassigned"}</div>
                                  </td>
                                  <td className="py-2.5 px-2 text-center font-mono text-muted-foreground">{row.played}</td>
                                  <td className="py-2.5 px-2 text-center font-mono text-muted-foreground">{row.won}</td>
                                  <td className="py-2.5 px-2 text-center font-mono text-muted-foreground">{row.drawn}</td>
                                  <td className="py-2.5 px-2 text-center font-mono text-muted-foreground">{row.lost}</td>
                                  <td className="py-2.5 px-2 text-center font-mono font-bold text-foreground">{gdFormatted}</td>
                                  <td className="py-2.5 px-3 text-center font-mono font-black text-secondary text-sm">
                                    {row.points}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Selected Round Fixtures (5 cols on desktop) */}
                  <div className="lg:col-span-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-secondary" />
                        <span>{selectedRound} Fixtures ({fixtures.length})</span>
                      </h3>
                      <span className="text-xs text-muted-foreground">24h Match Window</span>
                    </div>

                    {fixtures.length === 0 ? (
                      <div className="p-8 rounded-2xl border border-border bg-card/40 text-center text-xs text-muted-foreground">
                        No matches scheduled for {comp.title} in {selectedRound}.
                      </div>
                    ) : (
                      <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                        {fixtures.map((m) => {
                          const isFinished = m.status === "FINISHED";
                          const hasScore = m.homeScore != null && m.awayScore != null;

                          return (
                            <div
                              key={m.id}
                              className="p-3.5 rounded-xl border border-border bg-card/90 shadow-sm space-y-2"
                            >
                              <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
                                <span className="uppercase">{m.division}</span>
                                {isFinished ? (
                                  <Badge variant="secondary" className="px-1.5 py-0 text-xs font-bold">
                                    Finished
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="px-1.5 py-0 text-xs font-bold">
                                    Scheduled
                                  </Badge>
                                )}
                              </div>

                              {/* Clashing Players */}
                              <div className="flex items-center justify-between gap-3 pt-1">
                                <div className="min-w-0 flex-1 text-left">
                                  <p className="truncate text-xs sm:text-sm font-black text-foreground">
                                    {m.homeGamerTag}
                                  </p>
                                  <p className="truncate text-xs text-muted-foreground">{m.homeTeam || "Club"}</p>
                                </div>

                                <div className="shrink-0 px-2.5 py-1 rounded-lg bg-muted text-center">
                                  {isFinished && hasScore ? (
                                    <span className="text-sm font-black text-secondary">
                                      {m.homeScore} - {m.awayScore}
                                    </span>
                                  ) : (
                                    <span className="text-xs font-mono font-bold text-muted-foreground">VS</span>
                                  )}
                                </div>

                                <div className="min-w-0 flex-1 text-right">
                                  <p className="truncate text-xs sm:text-sm font-black text-foreground">
                                    {m.awayGamerTag}
                                  </p>
                                  <p className="truncate text-xs text-muted-foreground">{m.awayTeam || "Club"}</p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
