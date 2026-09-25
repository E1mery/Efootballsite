"use client";

import * as React from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export type CurtainEffect = "doors" | "wipe" | "fade" | "iris";

export interface PageCurtainsProps {
  effect?: CurtainEffect;
  isTransitioning: boolean;
  onCovered?: () => void;
  onRevealed?: () => void;
  className?: string;
  children?: React.ReactNode;
}

/**
 * PageCurtains
 * Curated page-transition curtain system swapping between fade, wipe, doors, and iris curtain effects.
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
      }, 250);
      const revealTimer = setTimeout(() => {
        onRevealed?.();
      }, 550);
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
            {/* FADE EFFECT */}
            {effect === "fade" && (
              <motion.div
                key="curtain-fade"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 1, 0] }}
                transition={{
                  duration: 0.55,
                  times: [0, 0.45, 0.55, 1],
                  ease: "easeInOut",
                }}
                className="absolute inset-0 bg-background flex items-center justify-center"
              >
                <div className="h-40 w-40 rounded-full bg-primary/20 blur-3xl animate-efootball-pulse" />
              </motion.div>
            )}

            {/* WIPE EFFECT */}
            {effect === "wipe" && (
              <motion.div
                key="curtain-wipe"
                initial={{ x: "-100%" }}
                animate={{ x: ["-100%", "0%", "0%", "100%"] }}
                transition={{
                  duration: 0.55,
                  times: [0, 0.45, 0.55, 1],
                  ease: [0.76, 0, 0.24, 1] as const,
                }}
                className="absolute inset-0 border-r-2 border-secondary bg-primary shadow-2xl flex items-center justify-center"
              >
                <div className="h-1 w-24 rounded-full bg-secondary" />
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
                    duration: 0.55,
                    times: [0, 0.45, 0.55, 1],
                    ease: [0.77, 0, 0.175, 1] as const,
                  }}
                  className="h-full w-1/2 border-r border-border bg-card flex items-center justify-end pr-6 shadow-2xl"
                >
                  <div className="h-20 w-1 rounded-full bg-primary" />
                </motion.div>

                {/* Right Door */}
                <motion.div
                  initial={{ x: "100%" }}
                  animate={{ x: ["100%", "0%", "0%", "100%"] }}
                  transition={{
                    duration: 0.55,
                    times: [0, 0.45, 0.55, 1],
                    ease: [0.77, 0, 0.175, 1] as const,
                  }}
                  className="h-full w-1/2 border-l border-border bg-card flex items-center justify-start pl-6 shadow-2xl"
                >
                  <div className="h-20 w-1 rounded-full bg-secondary" />
                </motion.div>
              </div>
            )}

            {/* IRIS CURTAIN EFFECT */}
            {effect === "iris" && (
              <motion.div
                key="curtain-iris"
                initial={{ scale: 0, opacity: 0.9 }}
                animate={{ scale: [0, 5, 5, 0], opacity: [0.9, 1, 1, 0] }}
                transition={{
                  duration: 0.55,
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

/**
 * useCurtains
 * Hook to manage curtain transition states and cycle/select effects.
 */
export function useCurtains(initialEffect: CurtainEffect = "doors") {
  const [effect, setEffect] = React.useState<CurtainEffect>(initialEffect);
  const [isTransitioning, setIsTransitioning] = React.useState(false);

  const startTransition = React.useCallback(
    (customEffect?: CurtainEffect) => {
      if (customEffect) {
        setEffect(customEffect);
      }
      setIsTransitioning(true);
    },
    []
  );

  const finishTransition = React.useCallback(() => {
    setIsTransitioning(false);
  }, []);

  return {
    effect,
    setEffect,
    isTransitioning,
    startTransition,
    finishTransition,
  };
}
