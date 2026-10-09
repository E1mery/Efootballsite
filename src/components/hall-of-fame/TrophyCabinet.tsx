"use client";

import { Trophy, Crown, Award, Shield, ChevronRight } from "lucide-react";
import { getTrophyForCompetition } from "@/lib/assets.config";

export interface CompetitionTrophyCardData {
  competition: string;
  displayName: string;
  winnersCount: number;
  seasonsCount: number;
  latestChampion?: string | null;
}

interface TrophyCabinetProps {
  competitions: CompetitionTrophyCardData[];
  onSelectCompetition?: (competition: string) => void;
}

export default function TrophyCabinet({
  competitions = [],
  onSelectCompetition,
}: TrophyCabinetProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case "crown":
        return Crown;
      case "award":
        return Award;
      case "shield":
        return Shield;
      default:
        return Trophy;
    }
  };

  return (
    <section className="py-8 sm:py-12 border-b border-border/40">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-secondary" />
            <span className="text-xs font-bold tracking-widest uppercase text-secondary">
              TROPHY CABINET
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black uppercase text-foreground tracking-tight">
            Official Competitions & Silverware
          </h2>
        </div>
        <p className="text-xs text-muted-foreground sm:text-right max-w-xs">
          Loaded dynamically from official league competition registries.
        </p>
      </div>

      {competitions.length === 0 ? (
        <div className="text-center p-8 sm:p-12 rounded-2xl hof-navy-surface border border-border/60">
          <Trophy className="w-12 h-12 text-secondary/40 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-foreground uppercase tracking-wide">
            Trophy Cabinet Empty
          </h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
            No official competitions or titles have been recorded yet. Trophies will appear as league results are finalized.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {competitions.map((item) => {
            const meta = getTrophyForCompetition(item.competition);
            const FallbackIcon = getIcon(meta.fallbackIcon);

            return (
              <div
                key={item.competition}
                className="hof-navy-surface rounded-2xl p-5 border border-border/60 hover:border-secondary/50 flex flex-col justify-between transition-all group"
              >
                {/* Trophy Graphic Top */}
                <div className="flex flex-col items-center text-center pt-2 pb-4">
                  <div className="w-20 h-20 rounded-2xl bg-secondary/10 border border-secondary/20 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform shadow-lg shadow-secondary/5">
                    <FallbackIcon className="w-10 h-10 text-secondary" />
                  </div>
                  <h3 className="text-sm font-bold uppercase tracking-wide text-foreground line-clamp-1">
                    {item.displayName}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {meta.description}
                  </p>
                </div>

                {/* Statistics Bottom */}
                <div className="border-t border-border/50 pt-3 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Recorded Winners:</span>
                    <span className="font-bold text-foreground">
                      {item.winnersCount}
                    </span>
                  </div>

                  {item.latestChampion && (
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">Latest Champion:</span>
                      <span className="font-semibold text-secondary truncate max-w-32">
                        {item.latestChampion}
                      </span>
                    </div>
                  )}

                  <button
                    onClick={() => onSelectCompetition?.(item.competition)}
                    className="w-full mt-2 inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-card/60 hover:bg-secondary/15 border border-border/70 hover:border-secondary/40 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-secondary transition-all"
                  >
                    <span>View Champions</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
