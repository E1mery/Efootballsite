"use client";

import * as React from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  active?: boolean;
}

/**
 * Skeleton
 * Core shimmer placeholder bone component that matches existing typography and card dimensions.
 */
export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
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
Skeleton.displayName = "Skeleton";

export interface LoaderSkeletonProps {
  loading: boolean;
  skeleton: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  morphDuration?: number;
}

/**
 * LoaderSkeleton
 * Skeleton shimmer placeholders that morph naturally into loaded content in Motion for React.
 */
export function LoaderSkeleton({
  loading,
  skeleton,
  children,
  className,
  morphDuration = 0.3,
}: LoaderSkeletonProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{loading ? skeleton : children}</div>;
  }

  return (
    <div className={cn("relative w-full", className)}>
      <AnimatePresence mode="wait" initial={false}>
        {loading ? (
          <motion.div
            key="skeleton-view"
            initial={{ opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.99 }}
            transition={{ duration: morphDuration, ease: "easeInOut" }}
            aria-busy="true"
            aria-live="polite"
          >
            {skeleton}
          </motion.div>
        ) : (
          <motion.div
            key="content-view"
            initial={{ opacity: 0, y: 4, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.99 }}
            transition={{
              duration: morphDuration,
              ease: [0.25, 1, 0.5, 1] as const,
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
 * StandingsTableSkeleton
 * Reusable skeleton placeholder precisely mirroring StandingsTable.tsx layout and spacing.
 */
export function StandingsTableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="w-full space-y-3 rounded-2xl border border-border bg-card/60 p-4 shadow-xl backdrop-blur-md">
      {/* Table Header Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-border/80">
        <div className="flex items-center gap-3">
          <Skeleton className="h-6 w-16 rounded-md" />
          <Skeleton className="h-6 w-48 rounded-md" />
        </div>
        <Skeleton className="h-6 w-32 rounded-md" />
      </div>

      {/* Rows */}
      <div className="space-y-2 pt-1">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={`row-skel-${i}`}
            className="flex items-center justify-between gap-4 rounded-xl border border-border/40 bg-background/40 p-3"
          >
            <div className="flex items-center gap-3 flex-1">
              <Skeleton className="h-6 w-6 rounded-full shrink-0" />
              <Skeleton className="h-8 w-8 rounded-full shrink-0" />
              <div className="space-y-1.5 flex-1 max-w-xs">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-4">
              <Skeleton className="h-4 w-8" />
              <Skeleton className="h-4 w-8" />
              <Skeleton className="h-4 w-8" />
              <Skeleton className="h-4 w-10 font-bold" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * MatchCardSkeleton
 * Reusable skeleton placeholder mirroring MatchCard.tsx layout and spacing.
 */
export function MatchCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card/80 p-5 shadow-lg backdrop-blur-md space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-border/60">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-16 rounded-full" />
      </div>
      <div className="flex items-center justify-between gap-4 py-2">
        <div className="flex items-center gap-3 flex-1">
          <Skeleton className="h-10 w-10 rounded-full shrink-0" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-7 w-14 rounded-lg" />
        <div className="flex items-center justify-end gap-3 flex-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-10 rounded-full shrink-0" />
        </div>
      </div>
    </div>
  );
}

/**
 * PlayerCardSkeleton
 * Reusable skeleton placeholder mirroring PlayerCard.tsx layout and spacing.
 */
export function PlayerCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card/80 p-5 shadow-lg backdrop-blur-md space-y-4">
      <div className="flex items-center gap-4">
        <Skeleton className="h-14 w-14 rounded-full shrink-0" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/60">
        <Skeleton className="h-10 rounded-lg" />
        <Skeleton className="h-10 rounded-lg" />
        <Skeleton className="h-10 rounded-lg" />
      </div>
    </div>
  );
}
