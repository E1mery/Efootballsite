"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import {
  Calendar,
  Filter,
  Trophy,
  Crown,
  User,
  Medal,
  ChevronRight,
  Star,
} from "lucide-react";
import { HallOfFameEntry } from "@/components/HallOfFameCarousel";
import { BRANDING_ASSETS } from "@/lib/assets.config";

interface HallOfFameTimelineProps {
  entries: HallOfFameEntry[];
  availableCompetitions?: string[];
  selectedCompetition?: string;
  onSelectCompetition?: (competition: string) => void;
}

const CANONICAL_COMPETITION_OPTIONS = [
  { key: "ALL", label: "All Competitions" },
  { key: "Division 1", label: "Division 1 (Premiership)" },
  { key: "Division 2", label: "Division 2" },
  { key: "Division 3", label: "Division 3" },
  { key: "EUROPA", label: "Europa League" },
  { key: "UCL", label: "Champions League (UCL)" },
  { key: "SUPER_CUP", label: "UEFA Super Cup" },
];

function matchesCompetition(entry: HallOfFameEntry, targetComp: string): boolean {
  if (targetComp === "ALL") return true;
  const tourUpper = (entry.tournamentName || "").toUpperCase();
  const trophyUpper = (entry.trophyType || "").toUpperCase();
  const targetUpper = targetComp.toUpperCase();

  // UEFA Super Cup
  if (targetUpper.includes("SUPER") || targetUpper === "SUPER_CUP") {
    return (
      tourUpper.includes("SUPER") ||
      trophyUpper.includes("SUPER") ||
      trophyUpper === "SUPER_CUP"
    );
  }

  // Champions League / UCL
  if (targetUpper.includes("UCL") || targetUpper.includes("CHAMPIONS")) {
    return (
      tourUpper.includes("UCL") ||
      tourUpper.includes("CHAMPIONS") ||
      trophyUpper.includes("UCL")
    );
  }

  // Europa League
  if (targetUpper.includes("EUROPA")) {
    return tourUpper.includes("EUROPA") || trophyUpper.includes("EUROPA");
  }

  // Division 1 / Premiership
  if (targetUpper.includes("DIVISION 1") || targetUpper.includes("PREMIER")) {
    return (
      tourUpper.includes("DIVISION 1") ||
      tourUpper.includes("PREMIER") ||
      trophyUpper.includes("DIVISION 1")
    );
  }

  // Division 2
  if (targetUpper.includes("DIVISION 2")) {
    return tourUpper.includes("DIVISION 2") || trophyUpper.includes("DIVISION 2");
  }

  // Division 3
  if (targetUpper.includes("DIVISION 3")) {
    return tourUpper.includes("DIVISION 3") || trophyUpper.includes("DIVISION 3");
  }

  return tourUpper.includes(targetUpper) || trophyUpper.includes(targetUpper);
}

export default function HallOfFameTimeline({
  entries = [],
  availableCompetitions = [],
  selectedCompetition,
  onSelectCompetition,
}: HallOfFameTimelineProps) {
  const [internalSelectedComp, setInternalSelectedComp] = useState<string>("ALL");
  const selectedComp = selectedCompetition !== undefined ? selectedCompetition : internalSelectedComp;

  const handleCompChange = (val: string) => {
    if (onSelectCompetition) {
      onSelectCompetition(val);
    } else {
      setInternalSelectedComp(val);
    }
  };

  // Build competition dropdown list
  const competitionOptions = useMemo(() => {
    const defaultKeys = new Set(CANONICAL_COMPETITION_OPTIONS.map((o) => o.key));
    const extraOptions: Array<{ key: string; label: string }> = [];

    entries.forEach((e) => {
      const name = e.tournamentName;
      if (name) {
        const upper = name.toUpperCase();
        if (
          !upper.includes("SUPER") &&
          !upper.includes("UCL") &&
          !upper.includes("CHAMPIONS") &&
          !upper.includes("EUROPA") &&
          !upper.includes("DIVISION 1") &&
          !upper.includes("DIVISION 2") &&
          !upper.includes("DIVISION 3") &&
          !defaultKeys.has(name)
        ) {
          defaultKeys.add(name);
          extraOptions.push({ key: name, label: name });
        }
      }
    });

    return [...CANONICAL_COMPETITION_OPTIONS, ...extraOptions];
  }, [entries]);

  // Count total titles per champion across all entries to indicate multi-title winners with stars
  const championTitleCounts = useMemo(() => {
    const counts = new Map<string, number>();
    entries.forEach((e) => {
      const key = (e.championName || "").trim().toLowerCase();
      if (key) {
        counts.set(key, (counts.get(key) || 0) + 1);
      }
    });
    return counts;
  }, [entries]);

  // Filter entries
  const filteredEntries = useMemo(() => {
    return entries.filter((e) => matchesCompetition(e, selectedComp));
  }, [entries, selectedComp]);

  return (
    <section
      id="hall-of-fame-timeline"
      className="relative rounded-3xl overflow-hidden border border-border/60 bg-card/30 p-6 sm:p-10 my-6 sm:my-8"
    >
      {/* Historical Timeline Stadium Background */}
      <div className="absolute inset-0 pointer-events-none -z-10">
        <Image
          src={BRANDING_ASSETS.hofTimelineStadiumBg}
          alt="Hall of Fame Historical Timeline Background"
          fill
          className="object-cover object-center opacity-35 mix-blend-luminosity"
          sizes="(max-width: 1280px) 100vw, 1280px"
        />
        {/* Navy Scrims & Vignette for maximum text contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/85 to-background" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-transparent to-background/90" />
      </div>

      {/* Chronological Horizon Beam (Historical timeline progression line) */}
      <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-px pointer-events-none -z-10 opacity-60 timeline-horizon-beam" />
      <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-primary/10 blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-secondary/10 blur-3xl pointer-events-none -z-10" />

      {/* Section Header */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-secondary" />
            <span className="text-xs font-bold tracking-widest uppercase text-secondary">
              CHRONOLOGY
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black uppercase text-foreground tracking-tight">
            Hall of Fame Timeline
          </h2>
        </div>

        {/* Filter Dropdown */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Filter className="w-3.5 h-3.5 text-muted-foreground" />
          <select
            value={selectedComp}
            onChange={(e) => handleCompChange(e.target.value)}
            className="bg-card/80 border border-border rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-foreground focus:outline-none focus:border-secondary"
          >
            {competitionOptions.map((opt) => (
              <option key={opt.key} value={opt.key}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filteredEntries.length === 0 ? (
        <div className="relative z-10 text-center p-8 sm:p-12 rounded-2xl hof-navy-surface border border-border/60">
          <Calendar className="w-12 h-12 text-secondary/40 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-foreground uppercase tracking-wide">
            Timeline Open
          </h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
            No milestones found for this selection. Official champions will be chronicled in chronological order.
          </p>
        </div>
      ) : (
        <div className="relative z-10 overflow-x-auto pb-4 pt-2 scrollbar-none">
          <div className="flex gap-4 sm:gap-6 min-w-max">
            {filteredEntries.map((item, index) => {
              return (
                <div
                  key={item.id || index}
                  className="w-72 sm:w-80 hof-navy-surface rounded-2xl p-5 border border-border/60 hover:border-secondary/50 flex flex-col justify-between transition-all group backdrop-blur-md"
                >
                  <div>
                    {/* Header: Season & Trophy Icon */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2.5 py-1 rounded-full bg-secondary/15 border border-secondary/30 text-xs font-black uppercase tracking-wider text-secondary">
                        {item.season}
                      </span>
                      <Trophy className="w-4 h-4 text-secondary/80 group-hover:scale-110 transition-transform" />
                    </div>

                    {/* Competition Name */}
                    <h3 className="text-sm font-bold uppercase tracking-wide text-foreground mb-4 line-clamp-1">
                      {item.tournamentName}
                    </h3>

                    {/* Winner profile */}
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-background/50 border border-border/50">
                      <div className="relative w-12 h-12 rounded-full overflow-hidden border border-secondary/40 bg-card flex items-center justify-center shrink-0">
                        {item.playerImage ? (
                          <Image
                            src={item.playerImage}
                            alt={item.championName}
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        ) : (
                          <User className="w-6 h-6 text-secondary/60" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold uppercase tracking-wide text-foreground truncate flex items-center gap-1">
                          <span>{item.championName}</span>
                          {(() => {
                            const count = championTitleCounts.get((item.championName || "").trim().toLowerCase()) || 1;
                            if (count <= 1) return null;
                            return (
                              <span
                                className="inline-flex items-center gap-0.5 text-secondary"
                                title={`${count} Championship Titles`}
                              >
                                {Array.from({ length: Math.min(count, 4) }).map((_, i) => (
                                  <Star key={i} className="w-3 h-3 fill-secondary text-secondary" />
                                ))}
                                {count > 4 && (
                                  <span className="text-xs font-black">+{count - 4}</span>
                                )}
                              </span>
                            );
                          })()}
                        </div>
                        {item.championRealName && (
                          <div className="text-xs text-muted-foreground truncate">
                            {item.championRealName}
                          </div>
                        )}
                        <div className="text-xs text-secondary font-semibold mt-0.5">
                          Champion
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Prize Won / Notes */}
                  {item.prizeWon && (
                    <div className="border-t border-border/50 mt-4 pt-3 text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground/80">Prize: </span>
                      {item.prizeWon}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
