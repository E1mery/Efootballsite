"use client";

import { useState, useEffect, useRef, useCallback, memo } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Newspaper,
  Calendar,
  Sparkles,
  Award,
  Crown,
  TrendingUp,
  ShieldCheck,
  Megaphone,
  Trophy,
  Zap,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
  type MotionValue,
  type PanInfo,
} from "framer-motion";
import { cn } from "@/lib/utils";
import { resolvePlayerAvatar, findTeam } from "@/lib/teams";

export interface CarouselSlide {
  id: string;
  type?: string;
  badge?: string;
  category: string;
  tabLabel?: string;
  title: string;
  subtitle?: string;
  description: string;
  featuredImage: string;
  buttonText?: string | null;
  buttonUrl?: string | null;
  publishDate?: string | Date;
  expirationDate?: string | Date;
  data?: any;
}

interface NewsTrendingCarouselProps {
  slides?: CarouselSlide[];
  userSession?: { authenticated: boolean; user?: any; player?: any } | null;
}

const ROTATION_INTERVAL_MS = 8000;

interface CoverflowCardProps {
  slide: CarouselSlide;
  index: number;
  totalSlides: number;
  scrollX: MotionValue<number>;
  centerGap: number;
  stackSpacing: number;
  rotation: number;
  shouldReduceMotion: boolean | null;
  isCenter: boolean;
  isPaused: boolean;
  isMobile: boolean;
  progress: number;
  onCardClick: (index: number) => void;
}

const CoverflowCard = memo(function CoverflowCard({
  slide,
  index,
  totalSlides,
  scrollX,
  centerGap,
  stackSpacing,
  rotation,
  shouldReduceMotion,
  isCenter,
  isPaused,
  isMobile,
  progress,
  onCardClick,
}: CoverflowCardProps) {
  // Continuous 3D transforms driven directly by spring physics
  const rotateY = useTransform(scrollX, (value) => {
    if (shouldReduceMotion) return 0;
    const pos = index - value;
    const absPos = Math.abs(pos);
    if (absPos < 0.5) return -pos * (rotation * 2);
    return pos < 0 ? rotation : -rotation;
  });

  const x = useTransform(scrollX, (value) => {
    const pos = index - value;
    const absPos = Math.abs(pos);
    if (absPos < 1) {
      return `calc(-50% + ${Math.round(pos * centerGap)}px)`;
    }
    const offset =
      pos < 0
        ? -centerGap - (absPos - 1) * stackSpacing
        : centerGap + (absPos - 1) * stackSpacing;
    return `calc(-50% + ${Math.round(offset)}px)`;
  });

  const z = useTransform(scrollX, (value) => {
    if (shouldReduceMotion) return 0;
    const absPos = Math.abs(index - value);
    return absPos > 0.5 ? -180 : absPos * -360;
  });

  const scale = useTransform(scrollX, (value) => {
    const absPos = Math.abs(index - value);
    return Math.max(isMobile ? 0.84 : 0.76, 1 - absPos * (isMobile ? 0.1 : 0.12));
  });

  const opacity = useTransform(scrollX, (value) => {
    const absPos = Math.abs(index - value);
    if (absPos <= 0.6) return 1;
    if (absPos <= 1.6) return isMobile ? 0.4 : 0.65;
    if (absPos <= 2.6) return isMobile ? 0.1 : 0.25;
    return 0;
  });

  const zIndex = useTransform(
    scrollX,
    (value) => 1000 - Math.round(Math.abs(index - value) * 10)
  );

  const filter = useTransform(scrollX, (value) => {
    const absPos = Math.abs(index - value);
    const brightness = absPos < 0.5 ? 1 : 0.72;
    const blur = absPos > 1.2 ? Math.min(2, (absPos - 1.2) * 2) : 0;
    return `brightness(${brightness}) blur(${blur}px)`;
  });

  const formattedPublishDate = slide.publishDate
    ? new Date(slide.publishDate).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <motion.div
      key={slide.id || index}
      className={cn(
        "carousel-slide-card absolute will-change-transform select-none cursor-pointer",
        isCenter && "carousel-card-active"
      )}
      /* eslint-disable shadcn/no-inline-styles -- framer-motion reactive 3D transform bindings */
      style={{
        x,
        z,
        rotateY,
        scale,
        opacity,
        zIndex,
        filter,
      }}
      /* eslint-enable shadcn/no-inline-styles */
      onClick={() => {
        if (!isCenter) {
          onCardClick(index);
        }
      }}
    >
      {/* Cinematic Ambient Background Image */}
      <div className="carousel-bg-layer overflow-hidden">
        <img
          src="/images/carousel-stadium-bg.jpg"
          alt=""
          aria-hidden="true"
          className="h-full w-full object-cover opacity-60"
        />
      </div>
      <div className="carousel-overlay-dark" />
      <div className="carousel-overlay-gradient" />
      <div className="carousel-overlay-vignette" />
      <div className="carousel-overlay-glow" />

      {/* Top Brand Accent Line */}
      <div className="h-1 w-full bg-gradient-to-r from-primary via-secondary to-primary opacity-80 relative z-10" />

      {/* Clickable Overlay for Preview / Inactive Cards */}
      {!isCenter && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onCardClick(index);
          }}
          aria-label={`View ${slide.category}: ${slide.title}`}
          className="absolute inset-0 z-30 bg-background/40 hover:bg-background/15 backdrop-blur-sm cursor-pointer transition-all duration-300 flex items-center justify-center group/preview focus:outline-none"
        >
          <span className="opacity-0 group-hover/preview:opacity-100 transition-opacity duration-200 px-3 py-1 rounded-xl bg-card/90 border border-secondary/40 text-xs font-mono font-bold text-secondary shadow-xl pointer-events-none">
            Click to view
          </span>
        </button>
      )}

      {/* SLIDE CARD INNER CONTENT */}
      <div className="relative z-10 p-3.5 sm:p-6 md:p-8 flex-1 flex flex-col justify-between gap-3 sm:gap-4 md:px-10 lg:px-12 w-full h-full overflow-hidden">
        <div className="flex-1 flex flex-col justify-center py-1 sm:py-2">
          {/* ========================================================================= */}
          {/* 1. MATCH OF THE DAY AUTOMATED SYSTEM SHOWDOWN */}
          {/* ========================================================================= */}
          {slide.type === "MOTD" && slide.data && (
            <div className="w-full flex-1 flex flex-col lg:flex-row items-center justify-between gap-3 sm:gap-6 my-auto">
              <div className="space-y-2.5 sm:space-y-3 text-left max-w-xl w-full">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="yellow"
                    className="text-xs font-mono font-bold uppercase tracking-wider px-2 py-0.5 shadow-sm"
                  >
                    <Sparkles className="h-3 w-3 mr-1" />
                    <span>
                      {slide.data.division} • {slide.data.round}
                    </span>
                  </Badge>
                  <span className="text-xs font-mono text-muted-foreground font-semibold">
                    Match of the Day
                  </span>
                </div>

                <h2 className="carousel-headline font-black text-foreground drop-shadow-sm">
                  {slide.data.homePlayer?.gamerTag}{" "}
                  <span className="text-secondary">vs</span>{" "}
                  {slide.data.awayPlayer?.gamerTag}
                </h2>

                <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed line-clamp-2 sm:line-clamp-3">
                  {slide.subtitle || slide.description}
                </p>

                {slide.buttonText && slide.buttonUrl && (
                  <div className="pt-1">
                    <Link
                      href={slide.buttonUrl}
                      tabIndex={isCenter ? 0 : -1}
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                      className={cn(
                        buttonVariants({ variant: "yellow", size: "default" }),
                        "carousel-cta-btn font-black text-secondary-foreground text-xs sm:text-sm gap-2 rounded-xl shadow-lg cursor-pointer pointer-events-auto inline-flex items-center"
                      )}
                    >
                      <span>{slide.buttonText}</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                )}
              </div>

              {/* Head-to-Head Card with Auto Ratio Avatars */}
              <div className="w-full lg:w-auto flex items-center justify-center gap-3 sm:gap-6 p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-card/85 backdrop-blur-xl border border-secondary/30 shadow-xl shrink-0">
                <div className="flex flex-col items-center gap-1.5 sm:gap-2 text-center min-w-16 sm:min-w-24">
                  <div className="h-11 w-11 sm:h-14 sm:w-14 md:h-16 md:w-16 rounded-xl sm:rounded-2xl bg-background/90 border border-primary/40 flex items-center justify-center overflow-hidden shrink-0 shadow-md">
                    <img
                      src={resolvePlayerAvatar(slide.data.homePlayer)}
                      alt={slide.data.homePlayer?.gamerTag}
                      className="h-full w-full object-contain aspect-square"
                      loading="lazy"
                    />
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-black text-foreground block truncate max-w-20 sm:max-w-28">
                      {slide.data.homePlayer?.gamerTag}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono font-bold">
                      HOME
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-0.5 sm:gap-1">
                  <div className="px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-lg sm:rounded-xl bg-secondary/20 border border-secondary/40 font-mono text-xs sm:text-sm font-black text-secondary shadow-inner">
                    VS
                  </div>
                  <span className="text-xs font-mono text-muted-foreground font-semibold">
                    24H CYCLE
                  </span>
                </div>

                <div className="flex flex-col items-center gap-1.5 sm:gap-2 text-center min-w-16 sm:min-w-24">
                  <div className="h-11 w-11 sm:h-14 sm:w-14 md:h-16 md:w-16 rounded-xl sm:rounded-2xl bg-background/90 border border-primary/40 flex items-center justify-center overflow-hidden shrink-0 shadow-md">
                    <img
                      src={resolvePlayerAvatar(slide.data.awayPlayer)}
                      alt={slide.data.awayPlayer?.gamerTag}
                      className="h-full w-full object-contain aspect-square"
                      loading="lazy"
                    />
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-black text-foreground block truncate max-w-20 sm:max-w-28">
                      {slide.data.awayPlayer?.gamerTag}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono font-bold">
                      AWAY
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 2. MOTD FINAL RESULT AUTOMATED UPDATE */}
          {/* ========================================================================= */}
          {slide.type === "MOTD_RESULT" && slide.data && (
            <div className="w-full flex-1 flex flex-col lg:flex-row items-center justify-between gap-3 sm:gap-6 my-auto">
              <div className="space-y-2.5 sm:space-y-3 text-left max-w-xl w-full">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="yellow"
                    className="text-xs font-mono font-bold uppercase tracking-wider px-2 py-0.5 shadow-sm"
                  >
                    <Award className="h-3 w-3 mr-1" />
                    <span>
                      {slide.data.division} • {slide.data.round} Final
                    </span>
                  </Badge>
                </div>

                <h2 className="carousel-headline font-black text-foreground drop-shadow-sm">
                  Match of the Day Concluded
                </h2>

                <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed line-clamp-2 sm:line-clamp-3">
                  {slide.subtitle || slide.description}
                </p>

                {slide.buttonText && slide.buttonUrl && (
                  <div className="pt-1">
                    <Link
                      href={slide.buttonUrl}
                      tabIndex={isCenter ? 0 : -1}
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                      className={cn(
                        buttonVariants({ variant: "outline", size: "default" }),
                        "carousel-cta-btn font-semibold text-xs border-border gap-1.5 rounded-xl cursor-pointer pointer-events-auto inline-flex items-center"
                      )}
                    >
                      <span>{slide.buttonText}</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                )}
              </div>

              {/* Scoreboard Card */}
              <div className="w-full lg:w-auto flex items-center justify-center gap-3 sm:gap-6 p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-card/85 backdrop-blur-xl border border-border shadow-xl font-mono shrink-0">
                <div className="text-right min-w-16 sm:min-w-24">
                  <span className="text-xs sm:text-sm font-black text-foreground block truncate max-w-20 sm:max-w-28">
                    {slide.data.homePlayer?.gamerTag}
                  </span>
                  <span className="text-xs text-muted-foreground font-bold">
                    HOME
                  </span>
                </div>

                <div className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl sm:rounded-2xl bg-background/90 border border-border text-base sm:text-2xl font-black text-secondary tracking-widest shadow-inner">
                  {slide.data.homeScore ?? 0} : {slide.data.awayScore ?? 0}
                </div>

                <div className="text-left min-w-16 sm:min-w-24">
                  <span className="text-xs sm:text-sm font-black text-foreground block truncate max-w-20 sm:max-w-28">
                    {slide.data.awayPlayer?.gamerTag}
                  </span>
                  <span className="text-xs text-muted-foreground font-bold">
                    AWAY
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 3. IN-FORM ATHLETES AUTOMATED UPDATE */}
          {/* ========================================================================= */}
          {slide.type === "IN_FORM" && slide.data && (
            <div className="w-full space-y-2.5 sm:space-y-4 my-auto">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2.5 sm:gap-3 text-left">
                <div className="space-y-1">
                  <span className="text-xs font-mono text-secondary font-bold flex items-center gap-1.5 uppercase">
                    <TrendingUp className="h-3.5 w-3.5 text-secondary" />
                    <span>STANDINGS &amp; PERFORMANCE LEADERS</span>
                  </span>
                  <h2 className="carousel-headline font-black text-foreground drop-shadow-sm">
                    {slide.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-foreground/80 max-w-xl leading-relaxed line-clamp-2 sm:line-clamp-3">
                    {slide.subtitle || slide.description}
                  </p>
                </div>

                {slide.buttonText && slide.buttonUrl && (
                  <Link
                    href={slide.buttonUrl}
                    tabIndex={isCenter ? 0 : -1}
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    className={cn(
                      buttonVariants({ variant: "yellow", size: "sm" }),
                      "carousel-cta-btn font-bold text-secondary-foreground text-xs gap-1.5 shrink-0 rounded-xl cursor-pointer pointer-events-auto inline-flex items-center"
                    )}
                  >
                    <span>{slide.buttonText}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                )}
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 pt-1">
                {slide.data.athletes?.slice(0, 4).map((ath: any) => (
                  <div
                    key={ath.gamerTag}
                    className="rounded-xl border border-border/80 bg-card/75 backdrop-blur-md p-2 sm:p-3 space-y-1.5 sm:space-y-2 shadow-md hover:border-secondary/40 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <Badge
                        variant="outline"
                        className="text-xs font-mono font-bold text-secondary border-secondary/30 bg-secondary/10 px-1.5 py-0"
                      >
                        #{ath.rank}
                      </Badge>
                      <span className="text-xs font-mono font-bold text-primary truncate max-w-20">
                        {ath.division}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 aspect-square items-center justify-center rounded-lg sm:rounded-xl bg-card border border-primary/30 overflow-hidden text-xs font-black text-primary shadow-sm">
                        {ath.avatar ? (
                          <img
                            src={ath.avatar}
                            alt={ath.gamerTag}
                            className="h-full w-full object-contain aspect-square"
                            loading="lazy"
                          />
                        ) : (
                          ath.gamerTag.substring(0, 2).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-xs sm:text-sm font-black text-foreground block truncate">
                          {ath.gamerTag}
                        </span>
                        {ath.realTeam && (
                          <span className="text-xs text-muted-foreground truncate block">
                            {findTeam(ath.realTeam)?.name || ath.realTeam}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="pt-1 border-t border-border/60 flex items-center justify-between text-xs font-mono">
                      <span className="text-foreground font-bold">
                        {ath.winRate}% Win
                      </span>
                      <span className="text-muted-foreground">
                        {ath.won}W / {ath.played}P
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 4. HALL OF FAME REIGNING CHAMPIONS */}
          {/* ========================================================================= */}
          {slide.type === "HALL_OF_FAME" && slide.data && (
            <div className="w-full space-y-2.5 sm:space-y-4 my-auto">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2.5 sm:gap-3 text-left">
                <div className="space-y-1">
                  <span className="text-xs font-mono text-secondary font-bold flex items-center gap-1.5 uppercase">
                    <Crown className="h-3.5 w-3.5 text-secondary" />
                    <span>REIGNING CHAMPIONS &amp; HISTORIC TITLES</span>
                  </span>
                  <h2 className="carousel-headline font-black text-foreground drop-shadow-sm">
                    {slide.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-foreground/80 max-w-xl leading-relaxed line-clamp-2 sm:line-clamp-3">
                    {slide.subtitle || slide.description}
                  </p>
                </div>

                {slide.buttonText && slide.buttonUrl && (
                  <Link
                    href={slide.buttonUrl}
                    tabIndex={isCenter ? 0 : -1}
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    className={cn(
                      buttonVariants({ variant: "yellow", size: "sm" }),
                      "carousel-cta-btn font-bold text-secondary-foreground text-xs gap-1.5 shrink-0 rounded-xl cursor-pointer pointer-events-auto inline-flex items-center"
                    )}
                  >
                    <span>{slide.buttonText}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 pt-1">
                {slide.data.champions?.slice(0, 3).map((champ: any) => (
                  <div
                    key={champ.id}
                    className="rounded-xl border border-secondary/35 bg-card/75 backdrop-blur-md p-2.5 sm:p-3.5 flex items-center justify-between gap-2 shadow-md hover:border-secondary/60 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-secondary/15 border border-secondary/30 flex items-center justify-center shrink-0 shadow-sm">
                        <Crown className="h-4 w-4 sm:h-5 sm:w-5 text-secondary" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-mono uppercase text-secondary font-bold block">
                          👑 Champion
                        </span>
                        <span className="text-xs sm:text-sm font-black text-foreground truncate block">
                          {champ.championName}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <Badge
                        variant="yellow"
                        className="text-xs font-mono font-bold px-1.5 py-0"
                      >
                        {champ.season}
                      </Badge>
                      <span className="text-xs text-muted-foreground block truncate max-w-24 mt-0.5">
                        {champ.tournamentName}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 5. SEASON REGISTRATION AUTOMATED BULLETIN */}
          {/* ========================================================================= */}
          {slide.type === "REGISTRATION" && (
            <div className="w-full flex-1 flex flex-col lg:flex-row items-center justify-between gap-3 sm:gap-6 my-auto">
              <div className="space-y-2.5 sm:space-y-3 text-left max-w-xl w-full">
                <span className="text-xs font-mono text-secondary font-bold flex items-center gap-1.5 uppercase">
                  <ShieldCheck className="h-3.5 w-3.5 text-secondary" />
                  <span>OFFICIAL ATHLETE ENROLLMENT</span>
                </span>
                <h2 className="carousel-headline font-black text-foreground drop-shadow-sm">
                  {slide.title}
                </h2>
                <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed line-clamp-2 sm:line-clamp-3">
                  {slide.description}
                </p>

                {slide.buttonText && slide.buttonUrl && (
                  <div className="flex flex-wrap items-center gap-3 shrink-0 pt-1">
                    <Link
                      href={slide.buttonUrl}
                      tabIndex={isCenter ? 0 : -1}
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                      className={cn(
                        buttonVariants({ variant: "yellow", size: "default" }),
                        "carousel-cta-btn font-black text-secondary-foreground text-xs sm:text-sm gap-2 rounded-xl shadow-lg cursor-pointer pointer-events-auto inline-flex items-center"
                      )}
                    >
                      <span>{slide.buttonText}</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 6. SYSTEM ANNOUNCEMENTS (Official League & Tournament Milestones) */}
          {/* ========================================================================= */}
          {slide.type === "SYSTEM_ANNOUNCEMENT" && (
            <div className="w-full flex-1 flex flex-col lg:flex-row items-center justify-between gap-3 sm:gap-6 my-auto">
              {/* Left Column: Text & CTA */}
              <div className="space-y-2.5 sm:space-y-3.5 text-left max-w-xl flex-1 w-full">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge
                    variant="yellow"
                    className="text-xs font-mono font-bold uppercase tracking-wider px-2 py-0.5 shadow-sm"
                  >
                    <Megaphone className="h-3 w-3 mr-1" />
                    <span>System Announcement</span>
                  </Badge>
                  {slide.subtitle && (
                    <span className="text-xs font-mono text-secondary font-semibold">
                      {slide.data?.subType === "LEAGUE_START"
                        ? "Schedule Confirmed"
                        : slide.data?.subType === "DRAW_SCHEDULED"
                        ? "Draw Scheduled"
                        : slide.data?.subType === "DRAW_RESULTS"
                        ? "Draw Complete"
                        : slide.data?.subType === "CONTINENTAL_ADVANCE"
                        ? "Knockout Active"
                        : "Official Notice"}
                    </span>
                  )}
                </div>

                <h2 className="carousel-headline font-black text-foreground tracking-tight leading-tight drop-shadow-sm">
                  {slide.title}
                </h2>

                <p className="text-xs sm:text-sm md:text-base text-foreground/85 leading-relaxed line-clamp-2 sm:line-clamp-4 max-w-xl font-normal">
                  {slide.description}
                </p>

                {slide.buttonText && slide.buttonUrl && (
                  <div className="pt-1 sm:pt-2">
                    <Link
                      href={slide.buttonUrl}
                      tabIndex={isCenter ? 0 : -1}
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                      className={cn(
                        buttonVariants({ variant: "yellow", size: "default" }),
                        "carousel-cta-btn font-black text-secondary-foreground text-xs sm:text-sm gap-2 rounded-xl shadow-lg cursor-pointer pointer-events-auto inline-flex items-center"
                      )}
                    >
                      <span>{slide.buttonText}</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                )}
              </div>

              {/* Right Column: Dynamic Visual Showcase based on subType */}
              <div className="w-full lg:w-auto shrink-0 flex items-center justify-center">
                {/* 1. LEAGUE START SHOWCASE */}
                {slide.data?.subType === "LEAGUE_START" && (
                  <div className="w-full sm:w-auto min-w-0 max-w-full sm:min-w-64 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-card/85 backdrop-blur-xl border border-secondary/35 shadow-xl space-y-2.5 sm:space-y-3">
                    <div className="flex items-center justify-between border-b border-border/70 pb-2">
                      <span className="text-xs font-mono font-bold text-secondary uppercase flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-secondary" />
                        <span>Official Kickoff (CAT)</span>
                      </span>
                      <Badge variant="outline" className="text-xs font-mono font-bold text-primary border-primary/30 px-1.5 py-0">
                        12:00 AM
                      </Badge>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-xs text-muted-foreground font-mono font-semibold block">
                        Kickoff Date &amp; Time:
                      </span>
                      <span className="text-xs sm:text-sm font-black text-foreground block">
                        {slide.data?.formattedKickoffFull || slide.data?.formattedKickoffDate || "Confirmed by Admin"}
                      </span>
                    </div>

                    <div className="pt-1 flex items-center gap-1.5 sm:gap-2 flex-wrap">
                      <Badge variant="yellow" className="text-xs font-mono font-bold px-1.5 py-0">
                        Division 1
                      </Badge>
                      <Badge variant="outline" className="text-xs font-mono font-bold border-secondary/40 text-secondary px-1.5 py-0">
                        Division 2
                      </Badge>
                      <Badge variant="outline" className="text-xs font-mono font-bold border-primary/40 text-primary px-1.5 py-0">
                        Division 3
                      </Badge>
                    </div>
                  </div>
                )}

                {/* 2. DRAW SCHEDULED SHOWCASE */}
                {slide.data?.subType === "DRAW_SCHEDULED" && (
                  <div className="w-full sm:w-auto min-w-0 max-w-full sm:min-w-64 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-card/85 backdrop-blur-xl border border-secondary/35 shadow-xl space-y-2.5 sm:space-y-3">
                    <div className="flex items-center justify-between border-b border-border/70 pb-2">
                      <span className="text-xs font-mono font-bold text-secondary uppercase flex items-center gap-1.5">
                        <Trophy className="h-3.5 w-3.5 text-secondary" />
                        <span>Live Draws</span>
                      </span>
                      <Badge variant="yellow" className="text-xs font-mono font-bold px-1.5 py-0">
                        Scheduled
                      </Badge>
                    </div>

                    <div className="space-y-2 text-xs font-mono">
                      {slide.data?.uclTimeStr && (
                        <div className="flex items-center justify-between p-2 rounded-lg sm:rounded-xl bg-background/70 border border-border gap-2">
                          <span className="font-bold text-foreground flex items-center gap-1.5 shrink-0">
                            <Sparkles className="h-3 w-3 text-secondary" />
                            <span>UCL:</span>
                          </span>
                          <span className="text-secondary font-bold text-right truncate">{slide.data.uclTimeStr} (CAT)</span>
                        </div>
                      )}
                      {slide.data?.europaTimeStr && (
                        <div className="flex items-center justify-between p-2 rounded-lg sm:rounded-xl bg-background/70 border border-border gap-2">
                          <span className="font-bold text-foreground flex items-center gap-1.5 shrink-0">
                            <Award className="h-3 w-3 text-primary" />
                            <span>Europa:</span>
                          </span>
                          <span className="text-primary font-bold text-right truncate">{slide.data.europaTimeStr} (CAT)</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 3. DRAW RESULTS SHOWCASE */}
                {slide.data?.subType === "DRAW_RESULTS" && (
                  <div className="w-full sm:w-auto min-w-0 max-w-full sm:min-w-64 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-card/85 backdrop-blur-xl border border-secondary/35 shadow-xl space-y-2.5 sm:space-y-3">
                    <div className="flex items-center justify-between border-b border-border/70 pb-2">
                      <span className="text-xs font-mono font-bold text-secondary uppercase flex items-center gap-1.5">
                        <Trophy className="h-3.5 w-3.5 text-secondary" />
                        <span>Draw Complete</span>
                      </span>
                      <Badge variant="yellow" className="text-xs font-mono font-bold px-1.5 py-0">
                        4 Groups Locked
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 sm:gap-2 text-center text-xs font-mono">
                      <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-background/70 border border-secondary/30 font-bold text-secondary">
                        Group A
                      </div>
                      <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-background/70 border border-secondary/30 font-bold text-secondary">
                        Group B
                      </div>
                      <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-background/70 border border-secondary/30 font-bold text-secondary">
                        Group C
                      </div>
                      <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-background/70 border border-secondary/30 font-bold text-secondary">
                        Group D
                      </div>
                    </div>

                    <p className="text-xs font-mono text-muted-foreground text-center pt-0.5">
                      Top 2 athletes advance to Quarter-Finals
                    </p>
                  </div>
                )}

                {/* 4. BOTH ADVANCE SHOWCASE */}
                {slide.data?.subType === "CONTINENTAL_ADVANCE" && (
                  <div className="w-full sm:w-auto min-w-0 max-w-full sm:min-w-64 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-card/85 backdrop-blur-xl border border-secondary/35 shadow-xl space-y-2.5 sm:space-y-3">
                    <div className="flex items-center justify-between border-b border-border/70 pb-2">
                      <span className="text-xs font-mono font-bold text-secondary uppercase flex items-center gap-1.5">
                        <Zap className="h-3.5 w-3.5 text-secondary" />
                        <span>Knockout Phase</span>
                      </span>
                      <Badge variant="yellow" className="text-xs font-mono font-bold px-1.5 py-0">
                        Both Active
                      </Badge>
                    </div>

                    <div className="space-y-1.5 sm:space-y-2 text-xs font-mono">
                      <div className="flex items-center justify-between p-2 rounded-lg sm:rounded-xl bg-background/70 border border-secondary/30 gap-2">
                        <span className="font-bold text-foreground flex items-center gap-1.5 truncate">
                          <Crown className="h-3.5 w-3.5 text-secondary shrink-0" />
                          <span>UCL</span>
                        </span>
                        <Badge variant="yellow" className="text-xs font-mono font-bold px-1.5 py-0 shrink-0">
                          {slide.data?.uclStageLabel || "Quarter-Finals"}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between p-2 rounded-lg sm:rounded-xl bg-background/70 border border-primary/30 gap-2">
                        <span className="font-bold text-foreground flex items-center gap-1.5 truncate">
                          <Award className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span>Europa</span>
                        </span>
                        <Badge variant="outline" className="text-xs font-mono font-bold text-primary border-primary/40 px-1.5 py-0 shrink-0">
                          {slide.data?.europaStageLabel || "Quarter-Finals"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}

                {/* DEFAULT BROADCAST NOTICE SHOWCASE */}
                {!["LEAGUE_START", "DRAW_SCHEDULED", "DRAW_RESULTS", "CONTINENTAL_ADVANCE"].includes(slide.data?.subType) && (
                  <div className="relative rounded-2xl overflow-hidden border border-secondary/35 bg-card/75 backdrop-blur-md shadow-2xl shrink-0 p-3 sm:p-4 max-w-sm">
                    <div className="flex items-center gap-2 mb-1.5 text-xs font-mono text-secondary font-bold">
                      <Megaphone className="h-4 w-4" />
                      <span>COMMISSIONER NOTICE</span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-3 sm:line-clamp-4">
                      {slide.description}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 7. STANDARD NEWS ARTICLE (Admin Created or System Published) */}
          {/* ========================================================================= */}
          {(!slide.type || slide.type === "NEWS") && (
            <div className="w-full flex-1 flex flex-col lg:flex-row items-center justify-between gap-3 sm:gap-6 my-auto">
              {/* Left Column: Text & CTA */}
              <div className="space-y-2.5 sm:space-y-3.5 text-left max-w-2xl flex-1 w-full">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge
                    variant="yellow"
                    className="text-xs font-mono font-bold uppercase tracking-wider px-2 py-0.5 shadow-sm"
                  >
                    <Newspaper className="h-3 w-3 mr-1" />
                    <span>{slide.category}</span>
                  </Badge>
                  {formattedPublishDate && (
                    <span className="text-xs font-mono text-muted-foreground flex items-center gap-1.5 font-semibold">
                      <Calendar className="h-3.5 w-3.5 text-secondary" />
                      <span>{formattedPublishDate}</span>
                    </span>
                  )}
                </div>

                <h2 className="carousel-headline font-black text-foreground tracking-tight leading-tight drop-shadow-sm">
                  {slide.title}
                </h2>

                <p className="text-xs sm:text-sm md:text-base text-foreground/85 leading-relaxed line-clamp-2 sm:line-clamp-4 whitespace-pre-line max-w-xl font-normal">
                  {slide.description}
                </p>

                {/* Optional CTA Button (Rendered only when configured) */}
                {slide.buttonText && slide.buttonUrl && (
                  <div className="pt-1 sm:pt-2">
                    <Link
                      href={slide.buttonUrl}
                      tabIndex={isCenter ? 0 : -1}
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                      className={cn(
                        buttonVariants({ variant: "yellow", size: "default" }),
                        "carousel-cta-btn font-black text-secondary-foreground text-xs sm:text-sm gap-2 rounded-xl shadow-lg cursor-pointer pointer-events-auto inline-flex items-center"
                      )}
                    >
                      <span>{slide.buttonText}</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                )}
              </div>

              {/* Right Column: Featured Image with auto ratio according to uploaded image */}
              {slide.featuredImage && (
                <div className="relative rounded-xl sm:rounded-2xl overflow-hidden border border-secondary/35 bg-card/75 backdrop-blur-md shadow-2xl shrink-0 max-h-32 sm:max-h-52 lg:max-h-68 max-w-full lg:max-w-md w-auto group/img flex items-center justify-center p-1 sm:p-1.5">
                  <img
                    src={slide.featuredImage}
                    alt={slide.title}
                    className="w-auto h-auto max-h-28 sm:max-h-48 lg:max-h-64 max-w-full rounded-lg sm:rounded-xl object-contain aspect-auto group-hover/img:scale-105 transition-transform duration-500 shadow-md"
                    loading="lazy"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* BOTTOM ROW: League Branding & Verified Bulletins */}
        <div className="flex items-center justify-between pt-1.5 sm:pt-2 border-t border-border/40 text-xs font-mono text-muted-foreground/80 w-full mt-auto shrink-0">
          <span className="truncate">
            eFootball Rwanda League • Official
          </span>
          <span className="uppercase tracking-widest hidden sm:inline-block font-semibold text-secondary">
            Live Bulletin
          </span>
        </div>
      </div>

      {/* Dynamic progress line on bottom of active card */}
      {isCenter && totalSlides > 1 && !isPaused && (
        <div className="h-1 w-full bg-border/40 overflow-hidden relative z-10 shrink-0">
          <div
            className="h-full bg-secondary transition-all duration-75 ease-linear"
            // eslint-disable-next-line shadcn/no-inline-styles -- dynamic progress 0-100%
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </motion.div>
  );
});

export default function NewsTrendingCarousel({
  slides = [],
}: NewsTrendingCarouselProps) {
  const shouldReduceMotion = useReducedMotion();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [containerWidth, setContainerWidth] = useState(1200);

  const containerRef = useRef<HTMLDivElement>(null);
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const totalSlides = slides.length;

  // Real-time Motion value for physics-driven Coverflow
  const scrollX = useMotionValue(0);
  const springX = useSpring(scrollX, {
    stiffness: 170,
    damping: 26,
    mass: 0.9,
  });
  const effectiveScrollX = shouldReduceMotion ? scrollX : springX;

  // Track container width for responsive Coverflow spacing
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width);
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  const isSmallMobile = containerWidth < 480;
  const isMobile = containerWidth < 768;
  const isTablet = containerWidth >= 768 && containerWidth < 1024;

  const centerGap = isSmallMobile
    ? Math.round(containerWidth * 0.78)
    : isMobile
    ? Math.round(containerWidth * 0.68)
    : isTablet
    ? Math.round(containerWidth * 0.52)
    : Math.round(Math.min(520, containerWidth * 0.44));

  const stackSpacing = isSmallMobile ? 28 : isMobile ? 48 : isTablet ? 75 : 105;
  const rotation = isSmallMobile ? 12 : isMobile ? 16 : isTablet ? 24 : 32;

  const jumpToIndex = useCallback(
    (index: number) => {
      if (totalSlides <= 0) return;
      const clamped = Math.min(Math.max(index, 0), totalSlides - 1);
      setCurrentIndex(clamped);
      scrollX.set(clamped);
      setProgress(0);
    },
    [totalSlides, scrollX]
  );

  const nextSlide = useCallback(() => {
    if (totalSlides <= 1) return;
    const next = (currentIndex + 1) % totalSlides;
    jumpToIndex(next);
  }, [totalSlides, currentIndex, jumpToIndex]);

  const prevSlide = useCallback(() => {
    if (totalSlides <= 1) return;
    const prev = (currentIndex - 1 + totalSlides) % totalSlides;
    jumpToIndex(prev);
  }, [totalSlides, currentIndex, jumpToIndex]);

  // Keep motion value in sync if currentIndex changes externally
  useEffect(() => {
    if (currentIndex >= totalSlides && totalSlides > 0) {
      jumpToIndex(totalSlides - 1);
    }
  }, [totalSlides, currentIndex, jumpToIndex]);

  // Auto-rotation timer
  useEffect(() => {
    if (totalSlides <= 1 || isPaused || isDragging) {
      return;
    }

    const stepMs = 50;
    const increment = (stepMs / ROTATION_INTERVAL_MS) * 100;

    progressTimerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          const next = (currentIndex + 1) % totalSlides;
          jumpToIndex(next);
          return 0;
        }
        return prev + increment;
      });
    }, stepMs);

    return () => {
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
      }
    };
  }, [totalSlides, isPaused, isDragging, currentIndex, jumpToIndex]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      prevSlide();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      nextSlide();
    } else if (e.key === "Home") {
      e.preventDefault();
      jumpToIndex(0);
    } else if (e.key === "End") {
      e.preventDefault();
      jumpToIndex(totalSlides - 1);
    }
  };

  // Drag interaction handlers
  const handleDragStart = useCallback(() => {
    setIsDragging(true);
    setIsPaused(true);
  }, []);

  const handleDrag = useCallback(
    (_: unknown, info: PanInfo) => {
      const sensitivity = centerGap * 0.9;
      const currentVal = scrollX.get();
      const nextVal = currentVal - info.delta.x / sensitivity;
      const minBound = -0.3;
      const maxBound = totalSlides - 1 + 0.3;
      scrollX.set(Math.min(Math.max(nextVal, minBound), maxBound));
    },
    [centerGap, scrollX, totalSlides]
  );

  const handleDragEnd = useCallback(
    (_: unknown, info: PanInfo) => {
      setIsDragging(false);
      setIsPaused(false);
      const velocity = info.velocity.x;
      let targetIndex: number;
      // Flick detection: fast finger swipe advances to next/prev slide cleanly
      if (Math.abs(velocity) > 280) {
        targetIndex = velocity < 0 ? currentIndex + 1 : currentIndex - 1;
      } else {
        targetIndex = Math.round(scrollX.get());
      }
      const clamped = Math.min(Math.max(targetIndex, 0), totalSlides - 1);
      jumpToIndex(clamped);
    },
    [scrollX, totalSlides, jumpToIndex, currentIndex]
  );

  if (totalSlides === 0) {
    return null;
  }

  return (
    <section
      aria-label="News & Trending Hero Banner"
      role="region"
      aria-roledescription="carousel"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      className="relative z-20 mx-auto max-w-360 px-2 sm:px-4 lg:px-6 select-none focus:outline-none"
    >
      {/* 3D MOTION COVERFLOW STAGE */}
      <motion.div
        ref={containerRef}
        className={cn(
          "carousel-stage-container cursor-grab active:cursor-grabbing touch-pan-y relative",
          isDragging && "cursor-grabbing"
        )}
        drag={totalSlides > 1 ? "x" : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.12}
        dragMomentum={false}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
      >
        <div className="relative w-full h-full flex items-center justify-center pointer-events-none carousel-3d-stage">
          {slides.map((slide, index) => (
            <CoverflowCard
              key={slide.id || index}
              slide={slide}
              index={index}
              totalSlides={totalSlides}
              scrollX={effectiveScrollX}
              centerGap={centerGap}
              stackSpacing={stackSpacing}
              rotation={rotation}
              shouldReduceMotion={shouldReduceMotion}
              isCenter={index === currentIndex}
              isPaused={isPaused}
              isMobile={isMobile}
              progress={progress}
              onCardClick={jumpToIndex}
            />
          ))}
        </div>

        {/* FLOATING NAVIGATION BUTTONS (Tablets & Desktop) */}
        {totalSlides > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                prevSlide();
              }}
              onMouseDown={(e) => e.stopPropagation()}
              disabled={totalSlides <= 1}
              aria-label="Previous news slide"
              className="carousel-nav-btn absolute left-2 sm:left-4 lg:left-6 top-1/2 -translate-y-1/2 z-50 group hidden sm:flex cursor-pointer pointer-events-auto select-none"
            >
              <ChevronLeft className="h-5 w-5 text-foreground transition-transform duration-200 group-hover:-translate-x-0.5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                nextSlide();
              }}
              onMouseDown={(e) => e.stopPropagation()}
              disabled={totalSlides <= 1}
              aria-label="Next news slide"
              className="carousel-nav-btn absolute right-2 sm:right-4 lg:right-6 top-1/2 -translate-y-1/2 z-50 group hidden sm:flex cursor-pointer pointer-events-auto select-none"
            >
              <ChevronRight className="h-5 w-5 text-foreground transition-transform duration-200 group-hover:translate-x-0.5" />
            </button>
          </>
        )}
      </motion.div>

      {/* Pagination Bar with Mobile Navigation Controls */}
      {totalSlides > 1 && (
        <div className="flex items-center justify-center gap-3 pt-3 sm:pt-4">
          {/* Mobile-friendly mini arrow for left */}
          <button
            type="button"
            onClick={prevSlide}
            aria-label="Previous slide"
            className="sm:hidden h-7 w-7 rounded-lg bg-card/90 border border-border text-foreground flex items-center justify-center cursor-pointer active:scale-95 shadow-sm"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {/* Pagination dots */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {slides.map((s, idx) => (
              <button
                key={s.id || idx}
                type="button"
                onClick={() => jumpToIndex(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={cn(
                  "carousel-dot cursor-pointer",
                  idx === currentIndex
                    ? "carousel-dot-active"
                    : "carousel-dot-inactive"
                )}
              />
            ))}
          </div>

          {/* Mobile-friendly mini arrow for right */}
          <button
            type="button"
            onClick={nextSlide}
            aria-label="Next slide"
            className="sm:hidden h-7 w-7 rounded-lg bg-card/90 border border-border text-foreground flex items-center justify-center cursor-pointer active:scale-95 shadow-sm"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </section>
  );
}
