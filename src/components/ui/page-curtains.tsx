"use client";

import * as React from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Trophy, Compass } from "lucide-react";

export type CurtainEffect = "wipe";

export interface PageCurtainsProps {
  effect?: CurtainEffect;
  isTransitioning: boolean;
  pageTitle?: string;
  pageSubtitle?: string;
  onCovered?: () => void;
  onRevealed?: () => void;
  className?: string;
  children?: React.ReactNode;
}

/**
 * PageCurtains
 * Wipe-only page transition curtain with smooth hold delay and destination page title in yellow.
 * Uses exact website background color (bg-background) and theme yellow (text-secondary).
 */
export function PageCurtains({
  isTransitioning,
  pageTitle = "Loading",
  pageSubtitle,
  onCovered,
  onRevealed,
  className,
  children,
}: PageCurtainsProps) {
  const shouldReduceMotion = useReducedMotion();

  React.useEffect(() => {
    if (isTransitioning) {
      // Cover phase reached at ~0.35s
      const coverTimer = setTimeout(() => {
        onCovered?.();
      }, 350);

      // Reveal phase finishes at ~1.15s (allows ~0.45s smooth hold delay)
      const revealTimer = setTimeout(() => {
        onRevealed?.();
      }, 1150);

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
    <div className={cn("relative w-full", className)}>
      {children}

      <AnimatePresence>
        {isTransitioning && (
          <div
            aria-hidden="true"
            className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
          >
            {/* WIPE CURTAIN with website background color */}
            <motion.div
              key="curtain-wipe"
              initial={{ x: "-100%" }}
              animate={{ x: ["-100%", "0%", "0%", "100%"] }}
              transition={{
                duration: 1.15,
                times: [0, 0.32, 0.68, 1],
                ease: [0.76, 0, 0.24, 1] as const,
              }}
              className="absolute inset-0 bg-background border-l-2 border-r-2 border-secondary/50 shadow-2xl flex flex-col items-center justify-center p-6"
            >
              {/* Subtle ambient brand glow behind center content */}
              <div className="absolute inset-0 bg-hero-glow pointer-events-none opacity-80" />

              {/* Destination Page Showcase during hold delay */}
              <motion.div
                initial={{ opacity: 0, scale: 0.94, y: 10 }}
                animate={{
                  opacity: [0, 1, 1, 0],
                  scale: [0.94, 1, 1, 0.97],
                  y: [10, 0, 0, -6],
                }}
                transition={{
                  duration: 1.15,
                  times: [0.12, 0.32, 0.68, 0.88],
                  ease: "easeInOut",
                }}
                className="relative z-10 flex flex-col items-center justify-center gap-3 text-center max-w-lg px-4"
              >
                {/* Mini Crest & Category Badge */}
                <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-secondary/30 bg-card/80 backdrop-blur-md shadow-md">
                  <Compass className="h-3.5 w-3.5 text-secondary animate-spin" />
                  <span className="font-mono text-xs uppercase font-bold tracking-widest text-muted-foreground">
                    Opening Page
                  </span>
                </div>

                {/* DESTINATION PAGE NAME IN YELLOW */}
                <h2 className="text-2xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-secondary drop-shadow-md">
                  {pageTitle}
                </h2>

                {/* Optional League Subtitle */}
                {pageSubtitle && (
                  <p className="text-xs sm:text-sm font-semibold tracking-wide text-muted-foreground max-w-md">
                    {pageSubtitle}
                  </p>
                )}

                {/* Smooth Progress Bar Indicator */}
                <div className="w-48 h-1 rounded-full bg-muted/60 overflow-hidden mt-2">
                  <motion.div
                    className="h-full bg-secondary rounded-full"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{
                      duration: 0.9,
                      ease: [0.65, 0, 0.35, 1] as const,
                    }}
                  />
                </div>
              </motion.div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * useCurtains
 * Hook to manage wipe curtain transition states.
 */
export function useCurtains() {
  const [isTransitioning, setIsTransitioning] = React.useState(false);

  const startTransition = React.useCallback(() => {
    setIsTransitioning(true);
  }, []);

  const finishTransition = React.useCallback(() => {
    setIsTransitioning(false);
  }, []);

  return {
    isTransitioning,
    startTransition,
    finishTransition,
  };
}
