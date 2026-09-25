"use client";

import * as React from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface SkeletonBoneProps extends React.HTMLAttributes<HTMLDivElement> {
  active?: boolean;
}

/**
 * SkeletonBone
 * Individual placeholder bone with compositor-accelerated shimmer sweep.
 */
export const SkeletonBone = React.forwardRef<HTMLDivElement, SkeletonBoneProps>(
  ({ className, active = true, ...props }, ref) => {
    const shouldReduceMotion = useReducedMotion();

    return (
      <div
        ref={ref}
        className={cn(
          "relative overflow-hidden rounded-md bg-muted/60",
          className
        )}
        {...props}
      >
        {active && !shouldReduceMotion && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-foreground/10 to-transparent animate-shimmer-sweep"
          />
        )}
      </div>
    );
  }
);
SkeletonBone.displayName = "SkeletonBone";

export interface LoaderSkeletonProps {
  loading: boolean;
  skeleton: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  morphDuration?: number;
}

/**
 * LoaderSkeleton
 * Skeleton shimmer placeholders that morph into loaded content in Motion for React.
 */
export function LoaderSkeleton({
  loading,
  skeleton,
  children,
  className,
  morphDuration = 0.35,
}: LoaderSkeletonProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{loading ? skeleton : children}</div>;
  }

  return (
    <div className={cn("relative", className)}>
      <AnimatePresence mode="wait" initial={false}>
        {loading ? (
          <motion.div
            key="skeleton-view"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: morphDuration, ease: "easeInOut" }}
            aria-busy="true"
            aria-live="polite"
          >
            {skeleton}
          </motion.div>
        ) : (
          <motion.div
            key="content-view"
            initial={{ opacity: 0, y: 6, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.99 }}
            transition={{
              duration: morphDuration,
              ease: [0.25, 1, 0.5, 1],
            }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * useSkeletonSweep
 * Hook to manage shimmer gate and cadence based on viewport or activity.
 */
export function useSkeletonSweep(active = true) {
  const [isActive, setIsActive] = React.useState(active);

  React.useEffect(() => {
    setIsActive(active);
  }, [active]);

  return {
    active: isActive,
    toggle: () => setIsActive((prev) => !prev),
  };
}

/**
 * useSkeletonResolve
 * Hook to compute stagger delays and animation targets for skeleton lists.
 */
export function useSkeletonResolve(
  index: number,
  loading: boolean,
  staggerDelay = 0.05
) {
  const delay = index * staggerDelay;
  return {
    initial: { opacity: 0, y: 8 },
    animate: {
      opacity: loading ? 1 : 0,
      y: loading ? 0 : -8,
      transition: { delay, duration: 0.25 },
    },
  };
}

/**
 * PlayerCardSkeleton
 * Pre-configured esports player card shimmer skeleton.
 */
export function PlayerCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-4">
        <SkeletonBone className="h-14 w-14 shrink-0 rounded-full" />
        <div className="flex-1 space-y-2">
          <SkeletonBone className="h-4 w-3/4" />
          <SkeletonBone className="h-3 w-1/2" />
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <SkeletonBone className="h-10 rounded-lg" />
        <SkeletonBone className="h-10 rounded-lg" />
        <SkeletonBone className="h-10 rounded-lg" />
      </div>
    </div>
  );
}

/**
 * MatchCardSkeleton
 * Pre-configured esports match preview shimmer skeleton.
 */
export function MatchCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <SkeletonBone className="h-3 w-24" />
        <SkeletonBone className="h-4 w-16 rounded-full" />
      </div>
      <div className="mt-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <SkeletonBone className="h-10 w-10 shrink-0 rounded-full" />
          <SkeletonBone className="h-4 w-28" />
        </div>
        <SkeletonBone className="h-6 w-12 rounded-md" />
        <div className="flex items-center justify-end gap-3 flex-1">
          <SkeletonBone className="h-4 w-28" />
          <SkeletonBone className="h-10 w-10 shrink-0 rounded-full" />
        </div>
      </div>
    </div>
  );
}
