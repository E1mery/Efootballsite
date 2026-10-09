"use client";

import { useState, useMemo } from "react";
import {
  Crown,
  Trophy,
  X,
  History,
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

  // Combined records: automatic + manual
  const allRecords = useMemo(() => {
    const auto = stats?.allTimeRecords || [];
    const man = stats?.manualRecords || [];
    return [...auto, ...man];
  }, [stats]);

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
            onSelectCompetition={() => {
              setActiveTab("RECORDS");
            }}
          />

          {/* Section 5: All-Time Records (RENDERED ONLY ONCE) */}
          <AllTimeRecords
            records={allRecords}
            onViewAllRecords={() => setActiveTab("RECORDS")}
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
