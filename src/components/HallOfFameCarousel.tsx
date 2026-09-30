"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Crown,
  Trophy,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Award,
  Calendar,
  User,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface HallOfFameEntry {
  id: string;
  tournamentName: string;
  season: string;
  championName: string;
  championRealName?: string | null;
  playerImage?: string | null;
  runnerUp?: string | null;
  prizeWon?: string | null;
  trophyType?: string;
  notes?: string | null;
  createdAt: string | Date;
}

interface HallOfFameCarouselProps {
  entries: HallOfFameEntry[];
}

const ROTATION_INTERVAL_MS = 7000;

export default function HallOfFameCarousel({
  entries = [],
}: HallOfFameCarouselProps) {
  const shouldReduceMotion = useReducedMotion();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [direction, setDirection] = useState(1); // 1 = next, -1 = prev

  const totalEntries = entries.length;

  const nextSlide = useCallback(() => {
    if (totalEntries <= 1) return;
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % totalEntries);
  }, [totalEntries]);

  const prevSlide = useCallback(() => {
    if (totalEntries <= 1) return;
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + totalEntries) % totalEntries);
  }, [totalEntries]);

  const goToSlide = (index: number) => {
    if (index >= 0 && index < totalEntries && index !== currentIndex) {
      setDirection(index > currentIndex ? 1 : -1);
      setCurrentIndex(index);
    }
  };

  // Auto-rotation timer
  useEffect(() => {
    if (totalEntries <= 1 || isPaused) return;

    const timer = setInterval(() => {
      nextSlide();
    }, ROTATION_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [totalEntries, isPaused, nextSlide]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      prevSlide();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      nextSlide();
    }
  };

  // Empty State (No Champions crowned yet)
  if (totalEntries === 0) {
    return (
      <div className="rounded-3xl border border-border/80 bg-background/60 p-10 text-center backdrop-blur-md shadow-xl">
        <Crown className="h-10 w-10 text-secondary/40 mx-auto mb-2.5 animate-pulse" />
        <h4 className="text-sm font-bold text-foreground uppercase tracking-wide">
          Inaugural Season in Progress
        </h4>
        <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto leading-relaxed">
          Championship winners across Division 1, Division 2, Division 3, UCL,
          and Europa League will be immortalized here upon tournament conclusion.
        </p>
      </div>
    );
  }

  const activeEntry = entries[currentIndex] || entries[0];

  const slideVariants = {
    enter: (dir: number) => ({
      x: shouldReduceMotion ? 0 : dir > 0 ? 80 : -80,
      opacity: 0,
      scale: 0.98,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        x: { type: "spring" as const, stiffness: 280, damping: 28 },
        opacity: { duration: 0.35 },
        scale: { duration: 0.35 },
      },
    },
    exit: (dir: number) => ({
      x: shouldReduceMotion ? 0 : dir > 0 ? -80 : 80,
      opacity: 0,
      scale: 0.98,
      transition: {
        x: { type: "spring" as const, stiffness: 280, damping: 28 },
        opacity: { duration: 0.25 },
      },
    }),
  };

  return (
    <div
      role="region"
      aria-label="Hall of Fame Winners Carousel"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      className="relative w-full space-y-4 select-none focus:outline-none"
    >
      {/* Main Carousel Card Container */}
      <div className="relative overflow-hidden rounded-3xl border border-secondary/25 bg-gradient-to-b from-card/95 via-card/85 to-background/95 shadow-2xl backdrop-blur-xl">
        {/* Subtle Ambient Gold Glow */}
        <div className="absolute -top-16 -right-16 w-56 h-56 bg-secondary/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Gold Border Accent */}
        <div className="h-1 w-full bg-gradient-to-r from-primary via-secondary to-primary opacity-80" />

        <div className="p-6 sm:p-8 lg:p-10 min-h-80 sm:min-h-96 flex items-center">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={activeEntry.id}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="w-full flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12"
            >
              {/* Left Column: Winner Details & Championship Pedigree */}
              <div className="flex-1 space-y-4 text-left w-full">
                {/* Header badges */}
                <div className="flex items-center gap-2.5 flex-wrap">
                  <Badge
                    variant="yellow"
                    className="text-xs uppercase font-black tracking-wider px-3 py-1 shadow-sm"
                  >
                    <Trophy className="h-3.5 w-3.5 mr-1 text-secondary-foreground" />
                    <span>{activeEntry.season}</span>
                  </Badge>

                  <Badge
                    variant="outline"
                    className="text-xs font-mono font-bold uppercase tracking-wider text-secondary border-secondary/35 bg-secondary/10 px-2.5 py-0.5"
                  >
                    <Sparkles className="h-3 w-3 mr-1 text-secondary" />
                    <span>👑 {activeEntry.trophyType === "UCL" ? "UCL Champion" : activeEntry.trophyType === "EUROPA" ? "Europa Champion" : "Title Champion"}</span>
                  </Badge>
                </div>

                {/* Tournament title */}
                <div>
                  <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest block font-bold">
                    Official Tournament Title
                  </span>
                  <h3 className="text-base sm:text-lg font-black text-foreground mt-0.5 tracking-tight">
                    {activeEntry.tournamentName}
                  </h3>
                </div>

                {/* Champion Banner Box */}
                <div className="p-4 sm:p-5 rounded-2xl bg-secondary/15 border border-secondary/30 space-y-1.5 shadow-lg relative overflow-hidden">
                  <div className="flex items-center gap-2">
                    <Crown className="h-5 w-5 text-secondary" />
                    <span className="text-xs font-mono uppercase text-secondary font-black tracking-widest block">
                      Immortalized Champion
                    </span>
                  </div>

                  <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-foreground tracking-tight drop-shadow-md">
                    {activeEntry.championName}
                  </div>

                  {activeEntry.championRealName && (
                    <div className="text-xs sm:text-sm font-semibold text-secondary flex items-center gap-1.5 pt-0.5">
                      <User className="h-3.5 w-3.5" />
                      <span>{activeEntry.championRealName}</span>
                    </div>
                  )}

                  {activeEntry.prizeWon && (
                    <div className="text-xs font-mono text-foreground/80 pt-1 flex items-center gap-1.5">
                      <Award className="h-3.5 w-3.5 text-secondary" />
                      <span className="font-bold">Prize: {activeEntry.prizeWon}</span>
                    </div>
                  )}
                </div>

                {/* Honored Footer info */}
                <div className="pt-2 flex items-center justify-between text-xs font-mono text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-secondary" />
                    <span>
                      Honored:{" "}
                      {new Date(activeEntry.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        year: "numeric",
                        timeZone: "Africa/Kigali",
                      })}
                    </span>
                  </span>

                  <span className="text-secondary font-bold uppercase tracking-wider">
                    eFootball Rwanda League Hall of Fame
                  </span>
                </div>
              </div>

              {/* Right Column: Player Picture with AUTO RATIO */}
              <div className="shrink-0 flex items-center justify-center w-full lg:w-auto">
                {activeEntry.playerImage ? (
                  <div className="relative rounded-2xl overflow-hidden border border-secondary/35 bg-black/50 backdrop-blur-md shadow-2xl p-2 flex items-center justify-center max-h-64 sm:max-h-72 lg:max-h-80 w-auto group/winner">
                    {/* Golden spotlight behind picture */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-secondary/15 via-transparent to-primary/15 opacity-60 pointer-events-none" />

                    <img
                      src={activeEntry.playerImage}
                      alt={`${activeEntry.championName} - ${activeEntry.tournamentName} Winner`}
                      className="w-auto h-auto max-h-60 sm:max-h-68 lg:max-h-76 max-w-full rounded-xl object-contain aspect-auto group-hover/winner:scale-105 transition-transform duration-500 shadow-md relative z-10"
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 sm:p-12 rounded-2xl border border-secondary/20 bg-card/60 backdrop-blur-md text-center max-w-xs shadow-xl">
                    <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-secondary/10 border border-secondary/30 flex items-center justify-center mb-3 shadow-inner">
                      <Crown className="h-8 w-8 sm:h-10 sm:w-10 text-secondary" />
                    </div>
                    <span className="text-sm font-black text-foreground">
                      {activeEntry.championName}
                    </span>
                    <span className="text-xs font-mono text-muted-foreground mt-1">
                      {activeEntry.season} Champion
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Floating Navigation Arrows (Rendered only when multiple winners) */}
        {totalEntries > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                prevSlide();
              }}
              aria-label="Previous Champion"
              className="carousel-nav-btn absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 z-30 group cursor-pointer"
            >
              <ChevronLeft className="h-5 w-5 text-foreground group-hover:-translate-x-0.5 transition-transform" />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                nextSlide();
              }}
              aria-label="Next Champion"
              className="carousel-nav-btn absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-30 group cursor-pointer"
            >
              <ChevronRight className="h-5 w-5 text-foreground group-hover:translate-x-0.5 transition-transform" />
            </button>
          </>
        )}
      </div>

      {/* Champion Quick Selector Chips & Pagination Dots (when multiple winners exist) */}
      {totalEntries > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
          {/* Quick Selector Pills */}
          <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
            {entries.map((entry, idx) => (
              <button
                key={entry.id || idx}
                type="button"
                onClick={() => goToSlide(idx)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all duration-200 border cursor-pointer inline-flex items-center gap-1.5",
                  idx === currentIndex
                    ? "bg-secondary text-secondary-foreground border-secondary shadow-md scale-105"
                    : "bg-card/70 hover:bg-card text-muted-foreground border-border hover:border-secondary/40"
                )}
              >
                <Crown className={cn("h-3.5 w-3.5", idx === currentIndex ? "text-secondary-foreground" : "text-secondary")} />
                <span>{entry.championName}</span>
                <span className="opacity-70 text-xs hidden md:inline">({entry.season})</span>
              </button>
            ))}
          </div>

          {/* Dots Indicator */}
          <div className="flex items-center gap-1.5">
            {entries.map((entry, idx) => (
              <button
                key={`dot-${entry.id || idx}`}
                type="button"
                onClick={() => goToSlide(idx)}
                aria-label={`Go to champion ${idx + 1}`}
                className={cn(
                  "carousel-dot",
                  idx === currentIndex
                    ? "carousel-dot-active"
                    : "carousel-dot-inactive"
                )}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
