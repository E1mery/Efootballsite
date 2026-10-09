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
} from "lucide-react";
import { HallOfFameEntry } from "@/components/HallOfFameCarousel";
import { BRANDING_ASSETS } from "@/lib/assets.config";

interface HallOfFameTimelineProps {
  entries: HallOfFameEntry[];
  availableCompetitions?: string[];
}

export default function HallOfFameTimeline({
  entries = [],
  availableCompetitions = [],
}: HallOfFameTimelineProps) {
  const [selectedComp, setSelectedComp] = useState<string>("ALL");

  // Derive unique competitions from entries if not explicitly provided
  const competitions = useMemo(() => {
    const list = new Set<string>();
    entries.forEach((e) => {
      if (e.tournamentName) list.add(e.tournamentName);
    });
    availableCompetitions.forEach((c) => list.add(c));
    return ["ALL", ...Array.from(list)];
  }, [entries, availableCompetitions]);

  // Filter entries
  const filteredEntries = useMemo(() => {
    if (selectedComp === "ALL") return entries;
    return entries.filter(
      (e) =>
        e.tournamentName.toLowerCase().includes(selectedComp.toLowerCase()) ||
        (e.trophyType && e.trophyType.toLowerCase() === selectedComp.toLowerCase())
    );
  }, [entries, selectedComp]);

  return (
    <section className="relative rounded-3xl overflow-hidden border border-border/60 bg-card/30 p-6 sm:p-10 my-6 sm:my-8">
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
            onChange={(e) => setSelectedComp(e.target.value)}
            className="bg-card/80 border border-border rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-foreground focus:outline-none focus:border-secondary"
          >
            <option value="ALL">All Competitions</option>
            {competitions
              .filter((c) => c !== "ALL")
              .map((c) => (
                <option key={c} value={c}>
                  {c}
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
                        <div className="text-xs font-bold uppercase tracking-wide text-foreground truncate">
                          {item.championName}
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
