"use client";

import * as React from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ButtonRollingText } from "@/components/ui/button-rolling-text";
import { Sparkles, Trophy, Users, Shield, ArrowRight, RefreshCw } from "lucide-react";

export type CurtainEffect = "fade" | "wipe" | "doors" | "iris";

export interface PageCurtainsProps {
  effect?: CurtainEffect;
  isTransitioning: boolean;
  onCovered?: () => void;
  onRevealed?: () => void;
  className?: string;
  children?: React.ReactNode;
}

const transitionTiming = {
  duration: 0.45,
  ease: [0.77, 0, 0.175, 1] as const,
};

/**
 * PageCurtains
 * Motion curtain overlay that executes fade, wipe, doors, or iris effects to mask and reveal content.
 */
export function PageCurtains({
  effect = "doors",
  isTransitioning,
  onCovered,
  onRevealed,
  className,
  children,
}: PageCurtainsProps) {
  const shouldReduceMotion = useReducedMotion();

  React.useEffect(() => {
    if (isTransitioning) {
      const coverTimer = setTimeout(() => {
        onCovered?.();
      }, 450);
      const revealTimer = setTimeout(() => {
        onRevealed?.();
      }, 900);
      return () => {
        clearTimeout(coverTimer);
        clearTimeout(revealTimer);
      };
    }
  }, [isTransitioning, onCovered, onRevealed]);

  if (shouldReduceMotion) {
    return <div className={cn("relative w-full", className)}>{children}</div>;
  }

  return (
    <div className={cn("relative w-full overflow-hidden", className)}>
      {children}

      <AnimatePresence>
        {isTransitioning && (
          <div
            aria-hidden="true"
            className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center"
          >
            {/* FADE EFFECT */}
            {effect === "fade" && (
              <motion.div
                key="curtain-fade"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 1, 0] }}
                transition={{ duration: 0.9, times: [0, 0.45, 0.55, 1] }}
                className="absolute inset-0 bg-background flex items-center justify-center"
              >
                <div className="h-32 w-32 rounded-full bg-primary/20 blur-2xl animate-efootball-pulse" />
              </motion.div>
            )}

            {/* WIPE EFFECT */}
            {effect === "wipe" && (
              <motion.div
                key="curtain-wipe"
                initial={{ x: "-100%" }}
                animate={{ x: ["-100%", "0%", "0%", "100%"] }}
                transition={{
                  duration: 0.9,
                  times: [0, 0.45, 0.55, 1],
                  ease: [0.76, 0, 0.24, 1] as const,
                }}
                className="absolute inset-0 border-r-2 border-secondary bg-primary flex items-center justify-center shadow-2xl"
              >
                <div className="flex items-center gap-3 text-primary-foreground font-bold tracking-widest uppercase text-sm">
                  <Sparkles className="h-5 w-5 text-secondary animate-pulse" />
                  <span>eFootball Transition</span>
                </div>
              </motion.div>
            )}

            {/* DOORS EFFECT */}
            {effect === "doors" && (
              <div key="curtain-doors" className="absolute inset-0 flex">
                {/* Left Door */}
                <motion.div
                  initial={{ x: "-100%" }}
                  animate={{ x: ["-100%", "0%", "0%", "-100%"] }}
                  transition={{
                    duration: 0.9,
                    times: [0, 0.45, 0.55, 1],
                    ease: [0.77, 0, 0.175, 1] as const,
                  }}
                  className="h-full w-1/2 border-r border-border bg-card flex items-center justify-end pr-6 shadow-2xl"
                >
                  <div className="h-16 w-1 rounded-full bg-primary" />
                </motion.div>

                {/* Right Door */}
                <motion.div
                  initial={{ x: "100%" }}
                  animate={{ x: ["100%", "0%", "0%", "100%"] }}
                  transition={{
                    duration: 0.9,
                    times: [0, 0.45, 0.55, 1],
                    ease: [0.77, 0, 0.175, 1] as const,
                  }}
                  className="h-full w-1/2 border-l border-border bg-card flex items-center justify-start pl-6 shadow-2xl"
                >
                  <div className="h-16 w-1 rounded-full bg-secondary" />
                </motion.div>
              </div>
            )}

            {/* IRIS EFFECT */}
            {effect === "iris" && (
              <motion.div
                key="curtain-iris"
                initial={{ scale: 0, opacity: 0.8 }}
                animate={{ scale: [0, 6, 6, 0], opacity: [0.8, 1, 1, 0] }}
                transition={{
                  duration: 0.9,
                  times: [0, 0.45, 0.55, 1],
                  ease: [0.65, 0, 0.35, 1] as const,
                }}
                className="h-96 w-96 rounded-full bg-background border-4 border-primary shadow-2xl flex items-center justify-center"
              >
                <div className="h-64 w-64 rounded-full border-2 border-secondary/60 bg-card/40 blur-sm" />
              </motion.div>
            )}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface DemoPageContent {
  id: string;
  badge: string;
  title: string;
  description: string;
  statLabel: string;
  statValue: string;
  icon: React.ReactNode;
}

const DEMO_PAGES: DemoPageContent[] = [
  {
    id: "matchday",
    badge: "Matchday Live",
    title: "Kigali Titans vs APR eSports",
    description: "National eFootball Premiership Division 1 — Week 14 Headline Clash",
    statLabel: "Live Spectators",
    statValue: "14,820",
    icon: <Shield className="h-8 w-8 text-primary" />,
  },
  {
    id: "mvp",
    badge: "Leaderboard",
    title: "Elite Striker Rankings",
    description: "Current golden boot race across all Rwandan national gaming clubs",
    statLabel: "Top Goals Scored",
    statValue: "28 Goals",
    icon: <Trophy className="h-8 w-8 text-secondary" />,
  },
  {
    id: "roster",
    badge: "Club Profiles",
    title: "Rayon Sports eClub",
    description: "Confirmed tournament roster for upcoming Continental Championship",
    statLabel: "Active Squad",
    statValue: "12 Athletes",
    icon: <Users className="h-8 w-8 text-accent-foreground" />,
  },
];

/**
 * CuratedCurtainsDemo
 * Interactive curated demo swapping between fade, wipe, doors, and iris curtain effects.
 */
export function CuratedCurtainsDemo() {
  const [currentEffect, setCurrentEffect] = React.useState<CurtainEffect>("doors");
  const [activePageIndex, setActivePageIndex] = React.useState(0);
  const [isTransitioning, setIsTransitioning] = React.useState(false);
  const [nextPageIndex, setNextPageIndex] = React.useState<number | null>(null);

  const triggerSwap = (targetIndex: number) => {
    if (isTransitioning || targetIndex === activePageIndex) return;
    setNextPageIndex(targetIndex);
    setIsTransitioning(true);
  };

  const handleNext = () => {
    const next = (activePageIndex + 1) % DEMO_PAGES.length;
    triggerSwap(next);
  };

  const handleCovered = () => {
    if (nextPageIndex !== null) {
      setActivePageIndex(nextPageIndex);
      setNextPageIndex(null);
    }
  };

  const handleRevealed = () => {
    setIsTransitioning(false);
  };

  const currentPage = DEMO_PAGES[activePageIndex];

  return (
    <div className="w-full max-w-4xl mx-auto rounded-2xl border border-border bg-card p-6 md:p-8 shadow-xl">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Curated Transition System
            </span>
            <Badge variant="outline" className="border-primary/40 text-primary uppercase text-xs">
              Motion for React
            </Badge>
          </div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-foreground mt-1">
            Page Curtains Showcase
          </h2>
        </div>

        {/* Effect Selector */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted/60 border border-border">
          {(["doors", "wipe", "fade", "iris"] as CurtainEffect[]).map((eff) => (
            <button
              key={eff}
              type="button"
              onClick={() => setCurrentEffect(eff)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-bold capitalize transition-colors duration-200",
                currentEffect === eff
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {eff}
            </button>
          ))}
        </div>
      </div>

      {/* Main Transition View Stage */}
      <div className="relative mt-6 min-h-64 rounded-xl border border-border/80 bg-background/50 p-6 md:p-8 overflow-hidden">
        <PageCurtains
          effect={currentEffect}
          isTransitioning={isTransitioning}
          onCovered={handleCovered}
          onRevealed={handleRevealed}
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-card border border-border shadow-sm">
                  {currentPage.icon}
                </div>
                <div>
                  <Badge variant="secondary" className="font-bold text-xs uppercase">
                    {currentPage.badge}
                  </Badge>
                  <h3 className="text-2xl font-bold text-foreground mt-1">
                    {currentPage.title}
                  </h3>
                </div>
              </div>
              <p className="text-sm text-muted-foreground max-w-xl">
                {currentPage.description}
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-4 text-center shrink-0 w-full md:w-48 shadow-sm">
              <span className="text-xs uppercase font-bold tracking-wider text-muted-foreground block">
                {currentPage.statLabel}
              </span>
              <span className="text-xl font-extrabold text-foreground mt-1 block">
                {currentPage.statValue}
              </span>
            </div>
          </div>
        </PageCurtains>
      </div>

      {/* Bottom Action Footer */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        {/* Quick Page Jump Pills */}
        <div className="flex items-center gap-2">
          {DEMO_PAGES.map((page, idx) => (
            <Button
              key={page.id}
              variant={activePageIndex === idx ? "default" : "outline"}
              size="sm"
              disabled={isTransitioning}
              onClick={() => triggerSwap(idx)}
              className="text-xs font-semibold"
            >
              Page {idx + 1}
            </Button>
          ))}
        </div>

        {/* Primary CTA with Rolling Text */}
        <div className="flex items-center gap-3">
          <ButtonRollingText
            variant="yellow"
            size="default"
            text={`Swap View via ${currentEffect.toUpperCase()}`}
            duplicateText="Rolling In New Screen!"
            stagger
            disabled={isTransitioning}
            onClick={handleNext}
            icon={isTransitioning ? <RefreshCw className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            iconPosition="right"
          />
        </div>
      </div>
    </div>
  );
}
