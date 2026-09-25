"use client";

import * as React from "react";
import Link from "next/link";
import {
  LoaderSkeleton,
  SkeletonBone,
  PlayerCardSkeleton,
  MatchCardSkeleton,
} from "@/components/ui/loader-skeleton";
import { ButtonRollingText } from "@/components/ui/button-rolling-text";
import { CuratedCurtainsDemo } from "@/components/ui/page-curtains";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  RotateCcw,
  CheckCircle2,
  ArrowRight,
  Shield,
  Trophy,
} from "lucide-react";

export default function HomeMotionExperience() {
  const [isLoading, setIsLoading] = React.useState(true);

  return (
    <section className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-border">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-secondary animate-ping" />
            <Badge variant="outline" className="border-secondary text-secondary text-xs uppercase font-bold tracking-wider">
              New Interactive Experience
            </Badge>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-tight text-foreground">
            Motion for React <span className="efootball-gradient-text">Showcase</span>
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl">
            Skeleton shimmer placeholders morphing to loaded content, primary rolling-text CTAs, and curated curtain page transitions.
          </p>
        </div>

        <Link href="/motion-demo">
          <ButtonRollingText
            variant="default"
            size="sm"
            text="Open Dedicated Demo Page"
            duplicateText="View Full Suite →"
            icon={<ArrowRight className="h-4 w-4" />}
            iconPosition="right"
          />
        </Link>
      </div>

      {/* Grid: Morphing Skeleton on Left, Features on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Interactive Morphing Loader Skeleton */}
        <div className="lg:col-span-5 space-y-4 rounded-2xl border border-border bg-card/60 p-6 backdrop-blur-md shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-primary">
                @motion/loader-skeleton
              </span>
              <h3 className="text-base font-bold text-foreground">
                Shimmer Placeholder Morph
              </h3>
            </div>
            <Button
              variant={isLoading ? "yellow" : "outline"}
              size="sm"
              onClick={() => setIsLoading((prev) => !prev)}
              className="text-xs font-bold"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              {isLoading ? "Morph To Content" : "Reset Skeleton"}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Click &quot;Morph To Content&quot; above to watch the shimmer skeleton morph smoothly into loaded esports cards without layout shift.
          </p>

          <LoaderSkeleton
            loading={isLoading}
            skeleton={<PlayerCardSkeleton />}
          >
            <div className="rounded-xl border border-primary/40 bg-card p-4 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 shrink-0 rounded-full bg-primary/20 border border-primary/50 flex items-center justify-center text-primary font-black text-xl">
                  ET
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-foreground">Eric Tuyisenge</h4>
                    <Badge variant="secondary" className="text-xs">
                      MVP Rank 1
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Kigali Titans Esports • Forward
                  </p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-background/60 border border-border p-2">
                  <span className="text-xs text-muted-foreground block">Rating</span>
                  <span className="text-sm font-extrabold text-foreground">94 OVR</span>
                </div>
                <div className="rounded-lg bg-background/60 border border-border p-2">
                  <span className="text-xs text-muted-foreground block">Goals</span>
                  <span className="text-sm font-extrabold text-foreground">32</span>
                </div>
                <div className="rounded-lg bg-background/60 border border-border p-2">
                  <span className="text-xs text-muted-foreground block">Win Rate</span>
                  <span className="text-sm font-extrabold text-foreground">87%</span>
                </div>
              </div>
            </div>
          </LoaderSkeleton>

          {/* Shimmer sweep indicators */}
          <div className="pt-2 space-y-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
              <CheckCircle2 className="h-3.5 w-3.5 text-secondary" />
              <span>Hardware-accelerated shimmer sweep</span>
            </div>
            <SkeletonBone className="h-2.5 w-full" />
            <SkeletonBone className="h-2.5 w-3/4" />
          </div>
        </div>

        {/* Right Column: Curated Page Curtains Demo */}
        <div className="lg:col-span-7">
          <CuratedCurtainsDemo />
        </div>
      </div>
    </section>
  );
}
