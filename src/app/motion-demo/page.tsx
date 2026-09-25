"use client";

import * as React from "react";
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
  Gamepad2,
  Trophy,
  Sparkles,
  ArrowRight,
  Flame,
  RotateCcw,
  CheckCircle2,
} from "lucide-react";

export default function MotionShowcasePage() {
  const [isLoading, setIsLoading] = React.useState(true);

  const toggleLoading = () => {
    setIsLoading((prev) => !prev);
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl space-y-16">
      {/* Hero Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Motion for React Components</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-black tracking-tight text-foreground">
          Interactive Motion Showcase
        </h1>
        <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
          Production-ready animated components built with Motion for React and
          shadcn architecture, styled strictly with design system tokens.
        </p>
      </div>

      {/* SECTION 1: Loader Skeleton Morphing */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-primary/40 text-primary text-xs">
                @motion/loader-skeleton
              </Badge>
              <span className="text-xs text-muted-foreground">Stateful Morph</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-foreground mt-1">
              Skeleton Shimmer Placeholders Morphing to Content
            </h2>
          </div>

          <Button
            variant={isLoading ? "yellow" : "outline"}
            size="sm"
            onClick={toggleLoading}
            className="self-start sm:self-auto font-bold"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            {isLoading ? "Render Loaded Content" : "Reset To Shimmer Skeleton"}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Player Card */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              Player Profile Card
            </span>
            <LoaderSkeleton
              loading={isLoading}
              skeleton={<PlayerCardSkeleton />}
            >
              <div className="rounded-xl border border-border bg-card p-4 shadow-sm hover:border-primary/40 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 shrink-0 rounded-full bg-primary/20 border border-primary/50 flex items-center justify-center text-primary font-black text-xl">
                    ET
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-foreground">Eric Tuyisenge</h4>
                      <Badge variant="secondary" className="text-xs">
                        #1 Rank
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
          </div>

          {/* Card 2: Match Fixture Card */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              Matchday Fixture Card
            </span>
            <LoaderSkeleton
              loading={isLoading}
              skeleton={<MatchCardSkeleton />}
            >
              <div className="rounded-xl border border-border bg-card p-5 shadow-sm hover:border-primary/40 transition-colors">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Division 1 • Round 12
                  </span>
                  <Badge variant="outline" className="border-secondary text-secondary text-xs">
                    Live Tomorrow
                  </Badge>
                </div>
                <div className="mt-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="h-10 w-10 shrink-0 rounded-full bg-primary/20 border border-primary flex items-center justify-center font-bold text-xs">
                      KT
                    </div>
                    <span className="text-sm font-bold text-foreground truncate">
                      Kigali Titans
                    </span>
                  </div>
                  <div className="px-3 py-1 rounded-md bg-muted text-xs font-black tracking-widest">
                    VS
                  </div>
                  <div className="flex items-center justify-end gap-3 flex-1">
                    <span className="text-sm font-bold text-foreground truncate text-right">
                      APR eSports
                    </span>
                    <div className="h-10 w-10 shrink-0 rounded-full bg-secondary/20 border border-secondary flex items-center justify-center font-bold text-xs">
                      APR
                    </div>
                  </div>
                </div>
              </div>
            </LoaderSkeleton>
          </div>
        </div>

        {/* Micro bone preview */}
        <div className="p-4 rounded-xl border border-border bg-card/40 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <span>Compositor-accelerated Shimmer Sweep Bones</span>
          </div>
          <div className="space-y-2">
            <SkeletonBone className="h-3 w-full" />
            <SkeletonBone className="h-3 w-5/6" />
            <SkeletonBone className="h-3 w-2/3" />
          </div>
        </div>
      </section>

      {/* SECTION 2: Button Rolling Text */}
      <section className="space-y-6">
        <div className="pb-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-primary/40 text-primary text-xs">
              @motion/button-rolling-text
            </Badge>
            <span className="text-xs text-muted-foreground">Hover & Keyboard Focus</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-foreground mt-1">
            Primary Call-to-Action with Rolling Duplicate Label
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Hover over the buttons or press Tab to focus them with keyboard navigation.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Default Unified Roll */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
              Unified Label Roll
            </span>
            <ButtonRollingText
              variant="default"
              size="lg"
              className="w-full"
              text="Register Tournament"
              duplicateText="Claim Your Spot!"
              icon={<Trophy className="h-4 w-4" />}
            />
          </div>

          {/* Staggered Character Roll */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                Staggered Wave Roll
              </span>
              <Badge variant="secondary" className="text-xs">
                Staggered
              </Badge>
            </div>
            <ButtonRollingText
              variant="yellow"
              size="lg"
              stagger
              className="w-full"
              text="Enter Match Arena"
              duplicateText="Ready For Kickoff!"
              icon={<Gamepad2 className="h-4 w-4" />}
            />
          </div>

          {/* Outline Variant */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
              Outline Secondary CTA
            </span>
            <ButtonRollingText
              variant="outline"
              size="lg"
              className="w-full"
              text="Explore League Standings"
              duplicateText="View Full Table"
              icon={<ArrowRight className="h-4 w-4" />}
            />
          </div>

          {/* Destructive / High Impact */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
              Destructive / Action
            </span>
            <ButtonRollingText
              variant="destructive"
              size="default"
              stagger
              className="w-full"
              text="Surrender Current Match"
              duplicateText="Confirm Forfeit?"
              icon={<Flame className="h-4 w-4" />}
            />
          </div>

          {/* Small Size */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
              Compact Size Button
            </span>
            <ButtonRollingText
              variant="default"
              size="sm"
              className="w-full"
              text="Quick Prediction Poll"
              duplicateText="Vote For Winner"
            />
          </div>

          {/* Ghost Variant */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
              Ghost Link Action
            </span>
            <ButtonRollingText
              variant="ghost"
              size="default"
              className="w-full"
              text="Download Rulebook PDF"
              duplicateText="Save Rules v2.4"
            />
          </div>
        </div>
      </section>

      {/* SECTION 3: Curated Page Curtains Transition Demo */}
      <section className="space-y-6">
        <div className="pb-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-primary/40 text-primary text-xs">
              @motion/page-curtains
            </Badge>
            <span className="text-xs text-muted-foreground">Transition Engine</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-foreground mt-1">
            Curated Page-Transition Demo: Fade, Wipe, Doors & Iris
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Switch between transition styles and swap views to observe the cover and reveal curtain effects.
          </p>
        </div>

        <CuratedCurtainsDemo />
      </section>
    </div>
  );
}
