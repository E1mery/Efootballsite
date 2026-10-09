"use client";

import { useRef } from "react";
import Image from "next/image";
import {
  Users,
  ChevronLeft,
  ChevronRight,
  Trophy,
  Flame,
  Award,
  Crown,
  User,
  ArrowRight,
} from "lucide-react";
import { PlayerCareerStats } from "@/lib/hallOfFameStatsService";

interface HallOfFamePlayersProps {
  players: PlayerCareerStats[];
  onViewAll?: () => void;
  onSelectPlayer?: (player: PlayerCareerStats) => void;
}

export default function HallOfFamePlayers({
  players = [],
  onViewAll,
  onSelectPlayer,
}: HallOfFamePlayersProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -320, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 320, behavior: "smooth" });
    }
  };

  return (
    <section className="py-8 sm:py-12 border-b border-border/40">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-secondary" />
            <span className="text-xs font-bold tracking-widest uppercase text-secondary">
              IMMORTAL ATHLETES
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black uppercase text-foreground tracking-tight">
            Hall of Fame Inductees
          </h2>
        </div>

        {/* Carousel controls & View all link */}
        <div className="flex items-center gap-3">
          {onViewAll && (
            <button
              onClick={onViewAll}
              className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-secondary hover:underline mr-2"
            >
              <span>View All Players</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {players.length > 0 && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={scrollLeft}
                aria-label="Scroll left"
                className="p-2 rounded-lg bg-card/60 hover:bg-card border border-border text-foreground hover:text-secondary transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={scrollRight}
                aria-label="Scroll right"
                className="p-2 rounded-lg bg-card/60 hover:bg-card border border-border text-foreground hover:text-secondary transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {players.length === 0 ? (
        <div className="text-center p-8 sm:p-12 rounded-2xl hof-navy-surface border border-border/60">
          <Crown className="w-12 h-12 text-secondary/40 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-foreground uppercase tracking-wide">
            No Inductees Yet
          </h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
            Players who win championships or achieve hall of fame eligibility will appear here in the inducted gallery.
          </p>
        </div>
      ) : (
        <div
          ref={scrollRef}
          className="flex gap-4 sm:gap-6 overflow-x-auto pb-4 pt-1 snap-x scrollbar-none"
        >
          {players.map((p) => {
            const inductionLabel = p.seasonsParticipated && p.seasonsParticipated.length > 0
              ? p.seasonsParticipated[0]
              : "Inducted Legend";

            return (
              <div
                key={p.gamerTag}
                onClick={() => onSelectPlayer?.(p)}
                className="w-72 sm:w-80 shrink-0 snap-start hof-navy-surface rounded-2xl p-5 border border-border/60 hover:border-secondary/60 transition-all flex flex-col justify-between cursor-pointer group"
              >
                <div>
                  {/* Card Header: Avatar & Badge */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-secondary/40 bg-background flex items-center justify-center">
                      {p.avatar ? (
                        <Image
                          src={p.avatar}
                          alt={p.gamerTag}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      ) : (
                        <User className="w-8 h-8 text-secondary/60" />
                      )}
                    </div>

                    <div className="px-2.5 py-1 rounded-full bg-secondary/15 border border-secondary/30 text-xs font-black uppercase tracking-wider text-secondary flex items-center gap-1">
                      <Crown className="w-3 h-3" />
                      <span>LEGEND</span>
                    </div>
                  </div>

                  {/* Name and Tag */}
                  <div className="mb-4">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <h3 className="text-lg font-black uppercase tracking-tight text-foreground group-hover:text-secondary transition-colors truncate">
                        {p.gamerTag}
                      </h3>
                      <span className="text-xs">🇷🇼</span>
                    </div>
                    {p.fullName && (
                      <p className="text-xs text-muted-foreground truncate">
                        {p.fullName}
                      </p>
                    )}
                  </div>

                  {/* Player Stats Grid */}
                  <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-background/50 border border-border/40 text-center mb-4">
                    <div>
                      <div className="flex items-center justify-center gap-0.5 text-xs uppercase font-bold text-muted-foreground">
                        <Trophy className="w-2.5 h-2.5 text-secondary" />
                        <span>Titles</span>
                      </div>
                      <div className="text-base font-black text-foreground">
                        {p.totalTrophies}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-center gap-0.5 text-xs uppercase font-bold text-muted-foreground">
                        <Flame className="w-2.5 h-2.5 text-secondary" />
                        <span>Goals</span>
                      </div>
                      <div className="text-base font-black text-foreground">
                        {p.goalsScored}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-center gap-0.5 text-xs uppercase font-bold text-muted-foreground">
                        <Award className="w-2.5 h-2.5 text-secondary" />
                        <span>Wins</span>
                      </div>
                      <div className="text-base font-black text-foreground">
                        {p.wins}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Footer: Induction badge */}
                <div className="border-t border-border/50 pt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Hall of Fame</span>
                  <span className="font-semibold text-secondary">
                    {inductionLabel}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
