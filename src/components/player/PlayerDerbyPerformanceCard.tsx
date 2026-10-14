"use client";

import { useState, useEffect } from "react";
import { Flame, Swords } from "lucide-react";
import type { PlayerDerbyStats } from "@/lib/derbyCore";

interface PlayerDerbyPerformanceCardProps {
  stats?: PlayerDerbyStats;
  playerId?: string;
  gamerTag?: string;
  clubName?: string | null;
  compact?: boolean;
  onViewDerbyH2H?: () => void;
}

/**
 * Displays a player's official derby performance record.
 * STRICT REQUIREMENT: Only displays Matches Played, Wins, Draws, Defeats.
 * Derby win rate / win percentage is NEVER calculated, displayed, or exposed.
 */
export default function PlayerDerbyPerformanceCard({
  stats: initialStats,
  playerId,
  gamerTag,
  clubName,
  compact = false,
  onViewDerbyH2H,
}: PlayerDerbyPerformanceCardProps) {
  const [stats, setStats] = useState<PlayerDerbyStats | undefined>(initialStats);
  const [loading, setLoading] = useState<boolean>(!initialStats && Boolean(playerId));

  useEffect(() => {
    if (initialStats) {
      setStats(initialStats);
      return;
    }

    if (!playerId) return;

    let isMounted = true;
    setLoading(true);

    fetch(`/api/derbies/player-h2h?playerId=${encodeURIComponent(playerId)}`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.stats) {
          setStats(data.stats);
        }
      })
      .catch((err) => {
        console.error("Failed to load player derby stats:", err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [playerId, initialStats]);

  const { matchesPlayed = 0, wins = 0, draws = 0, defeats = 0 } = stats || {};

  return (
    <div className="esports-card rounded-2xl border border-border bg-card/70 p-4 sm:p-5 space-y-4 shadow-lg relative overflow-hidden">
      {/* Decorative flair */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/80 pb-3 gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary/15 text-secondary border border-secondary/30 shrink-0">
            <Flame className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-black uppercase text-foreground tracking-wide truncate">
              Derby Performance
            </h3>
            <p className="text-xs text-muted-foreground truncate">
              {gamerTag ? `@${gamerTag}` : "Official Rivalries"}
              {clubName ? ` • ${clubName}` : ""}
            </p>
          </div>
        </div>

        <span className="font-mono text-xs text-secondary font-bold shrink-0 uppercase tracking-wider">
          Official Rivalries
        </span>
      </div>

      {/* 4 Permitted Statistics Grid (STRICT: NO WIN RATE) */}
      <div className={`grid ${compact ? "grid-cols-2 gap-2" : "grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3"}`}>
        {/* 1. Matches Played */}
        <div className="rounded-xl bg-background/60 border border-border/70 p-3 text-center space-y-1">
          <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider block">
            Played
          </span>
          <span className="text-xl sm:text-2xl font-black font-mono text-foreground">
            {loading ? "..." : matchesPlayed}
          </span>
        </div>

        {/* 2. Wins */}
        <div className="rounded-xl bg-background/60 border border-border/70 p-3 text-center space-y-1">
          <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider block">
            Wins
          </span>
          <span className="text-xl sm:text-2xl font-black font-mono text-secondary">
            {loading ? "..." : wins}
          </span>
        </div>

        {/* 3. Draws */}
        <div className="rounded-xl bg-background/60 border border-border/70 p-3 text-center space-y-1">
          <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider block">
            Draws
          </span>
          <span className="text-xl sm:text-2xl font-black font-mono text-muted-foreground">
            {loading ? "..." : draws}
          </span>
        </div>

        {/* 4. Defeats */}
        <div className="rounded-xl bg-background/60 border border-border/70 p-3 text-center space-y-1">
          <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider block">
            Defeats
          </span>
          <span className="text-xl sm:text-2xl font-black font-mono text-destructive">
            {loading ? "..." : defeats}
          </span>
        </div>
      </div>

      {/* Empty State note if no qualifying derby played */}
      {!loading && matchesPlayed === 0 && (
        <p className="text-xs text-muted-foreground italic text-center pt-1">
          No confirmed official derby fixtures recorded yet for this athlete.
        </p>
      )}

      {/* View Rivalries Button */}
      {onViewDerbyH2H && (
        <button
          type="button"
          onClick={onViewDerbyH2H}
          className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-secondary/10 hover:bg-secondary/20 border border-secondary/20 text-xs font-bold text-secondary transition-all"
        >
          <Swords className="h-3.5 w-3.5" />
          <span>View Rivalries & H2H</span>
        </button>
      )}
    </div>
  );
}
