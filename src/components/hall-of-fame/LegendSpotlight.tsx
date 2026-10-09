"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Crown,
  ChevronLeft,
  ChevronRight,
  Trophy,
  Flame,
  Award,
  Calendar,
  Quote as QuoteIcon,
  User,
} from "lucide-react";
import { PlayerCareerStats } from "@/lib/hallOfFameStatsService";

interface LegendSpotlightProps {
  legends: PlayerCareerStats[];
}

export default function LegendSpotlight({ legends = [] }: LegendSpotlightProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!legends || legends.length === 0) {
    return (
      <section className="py-8 sm:py-12 border-b border-border/40">
        <div className="text-center p-8 sm:p-12 rounded-2xl hof-navy-surface border border-border/60">
          <Crown className="w-12 h-12 text-secondary/40 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-foreground uppercase tracking-wide">
            Legend Spotlight
          </h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
            No players have been officially inducted into the spotlight yet. Records will appear here as championships are confirmed.
          </p>
        </div>
      </section>
    );
  }

  const current = legends[currentIndex % legends.length];
  const activeYears = current.seasonsParticipated && current.seasonsParticipated.length > 0
    ? current.seasonsParticipated.join(" • ")
    : "Active Career";

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? legends.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === legends.length - 1 ? 0 : prev + 1));
  };

  return (
    <section className="py-8 sm:py-12 border-b border-border/40">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-secondary" />
            <span className="text-xs font-bold tracking-widest uppercase text-secondary">
              LEGEND SPOTLIGHT
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black uppercase text-foreground tracking-tight">
            All-Time Legend of Rwanda
          </h2>
        </div>

        {/* Carousel controls */}
        {legends.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden sm:inline mr-2">
              {currentIndex + 1} of {legends.length}
            </span>
            <button
              onClick={handlePrev}
              aria-label="Previous legend"
              className="p-2 rounded-lg bg-card/60 hover:bg-card border border-border text-foreground hover:text-secondary transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              aria-label="Next legend"
              className="p-2 rounded-lg bg-card/60 hover:bg-card border border-border text-foreground hover:text-secondary transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Featured Legend Card */}
      <div className="relative rounded-2xl overflow-hidden hof-gold-card p-6 sm:p-8 lg:p-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Portrait & Laurel Laurel Halo */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center">
            <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-full p-2 bg-gradient-to-tr from-secondary/40 via-secondary/10 to-transparent">
              <div className="relative w-full h-full rounded-full overflow-hidden border-2 border-secondary bg-background/80 flex items-center justify-center">
                {current.avatar ? (
                  <Image
                    src={current.avatar}
                    alt={current.gamerTag}
                    fill
                    className="object-cover"
                    sizes="224px"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <User className="w-16 h-16 text-secondary/60" />
                    <span className="text-xs uppercase font-bold mt-1 text-secondary">
                      {current.gamerTag.slice(0, 2)}
                    </span>
                  </div>
                )}
              </div>

              {/* Laurel / Crown Badge at Top */}
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-background/95 border border-secondary shadow-lg flex items-center gap-1.5 whitespace-nowrap">
                <Crown className="w-3.5 h-3.5 text-secondary" />
                <span className="text-xs font-black uppercase tracking-wider text-secondary">
                  ALL-TIME LEGEND
                </span>
              </div>
            </div>

            {/* Country Flag & National Identity */}
            <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              <span>🇷🇼</span>
              <span>Rwanda</span>
              <span>•</span>
              <span className="text-foreground">{current.currentDivision || "Top Flight"}</span>
            </div>
          </div>

          {/* Right Column: Player Info, Stats Row, Quote */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div>
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 mb-1">
                <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black uppercase tracking-tight text-foreground">
                  {current.gamerTag}
                </h3>
              </div>
              {current.fullName && (
                <p className="text-sm font-medium text-muted-foreground">
                  {current.fullName}
                </p>
              )}
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-background/40 border border-border/60 text-center">
                <div className="flex items-center justify-center gap-1 text-xs uppercase font-bold text-muted-foreground mb-1">
                  <Trophy className="w-3 h-3 text-secondary" />
                  <span>Titles</span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-foreground">
                  {current.totalTrophies}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-background/40 border border-border/60 text-center">
                <div className="flex items-center justify-center gap-1 text-xs uppercase font-bold text-muted-foreground mb-1">
                  <Flame className="w-3 h-3 text-secondary" />
                  <span>Goals</span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-foreground">
                  {current.goalsScored}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-background/40 border border-border/60 text-center">
                <div className="flex items-center justify-center gap-1 text-xs uppercase font-bold text-muted-foreground mb-1">
                  <Award className="w-3 h-3 text-secondary" />
                  <span>Wins</span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-foreground">
                  {current.wins}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-background/40 border border-border/60 text-center">
                <div className="flex items-center justify-center gap-1 text-xs uppercase font-bold text-muted-foreground mb-1">
                  <Calendar className="w-3 h-3 text-secondary" />
                  <span>Win Rate</span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-foreground">
                  {current.winPercentage.toFixed(1)}%
                </div>
              </div>
            </div>

            {/* Active Seasons indicator */}
            <div className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground/80">Active Campaigns: </span>
              {activeYears}
            </div>

            {/* Optional Quote */}
            {current.quote && current.quote.trim().length > 0 && (
              <div className="relative p-4 rounded-xl bg-background/60 border border-secondary/20 italic text-sm text-foreground/90">
                <QuoteIcon className="w-4 h-4 text-secondary/60 absolute -top-2 -left-2" />
                <p className="pl-2">“{current.quote}”</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
