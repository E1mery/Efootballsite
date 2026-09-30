"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, useReducedMotion } from "framer-motion";
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

function getSlideDiff(index: number, current: number, total: number): number {
  if (total <= 1) return 0;
  if (total === 2) {
    if (index === current) return 0;
    return 1;
  }
  let diff = index - current;
  if (diff > total / 2) diff -= total;
  if (diff < -total / 2) diff += total;
  return diff;
}

export default function NewsTrendingCarousel({
  slides = [],
}: NewsTrendingCarouselProps) {
  const shouldReduceMotion = useReducedMotion();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);

  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const totalSlides = slides.length;

  const nextSlide = useCallback(() => {
    if (totalSlides <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
    setProgress(0);
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    if (totalSlides <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
    setProgress(0);
  }, [totalSlides]);

  const goToSlide = (index: number) => {
    if (index >= 0 && index < totalSlides) {
      setCurrentIndex(index);
      setProgress(0);
    }
  };

  const getCoverflowProps = useCallback(
    (diff: number) => {
      if (totalSlides <= 1 || diff === 0) {
        return {
          x: "-50%",
          y: 0,
          z: 0,
          rotateY: 0,
          scale: 1,
          opacity: 1,
          zIndex: 30,
          filter: "brightness(1) blur(0px)",
          pointerEvents: "auto" as const,
        };
      }

      if (shouldReduceMotion) {
        if (diff === 1) {
          return {
            x: "calc(-50% + 72%)",
            y: 0,
            z: 0,
            rotateY: 0,
            scale: 0.9,
            opacity: 0.5,
            zIndex: 20,
            filter: "brightness(0.8) blur(0px)",
            pointerEvents: "auto" as const,
          };
        }
        if (diff === -1) {
          return {
            x: "calc(-50% - 72%)",
            y: 0,
            z: 0,
            rotateY: 0,
            scale: 0.9,
            opacity: 0.5,
            zIndex: 20,
            filter: "brightness(0.8) blur(0px)",
            pointerEvents: "auto" as const,
          };
        }
        return {
          x: diff > 0 ? "calc(-50% + 140%)" : "calc(-50% - 140%)",
          y: 0,
          z: 0,
          rotateY: 0,
          scale: 0.75,
          opacity: 0,
          zIndex: 10,
          filter: "brightness(0.5) blur(0px)",
          pointerEvents: "none" as const,
        };
      }

      // 3D Motion Coverflow
      if (diff === 1) {
        return {
          x: "calc(-50% + 70%)",
          y: 0,
          z: -140,
          rotateY: -30,
          scale: 0.86,
          opacity: 0.55,
          zIndex: 20,
          filter: "brightness(0.75) blur(0.5px)",
          pointerEvents: "auto" as const,
        };
      }
      if (diff === -1) {
        return {
          x: "calc(-50% - 70%)",
          y: 0,
          z: -140,
          rotateY: 30,
          scale: 0.86,
          opacity: 0.55,
          zIndex: 20,
          filter: "brightness(0.75) blur(0.5px)",
          pointerEvents: "auto" as const,
        };
      }
      if (diff > 1) {
        return {
          x: "calc(-50% + 140%)",
          y: 0,
          z: -280,
          rotateY: -45,
          scale: 0.72,
          opacity: 0,
          zIndex: 10,
          filter: "brightness(0.5) blur(2px)",
          pointerEvents: "none" as const,
        };
      }
      // diff < -1
      return {
        x: "calc(-50% - 140%)",
        y: 0,
        z: -280,
        rotateY: 45,
        scale: 0.72,
        opacity: 0,
        zIndex: 10,
        filter: "brightness(0.5) blur(2px)",
        pointerEvents: "none" as const,
      };
    },
    [totalSlides, shouldReduceMotion]
  );

  useEffect(() => {
    if (totalSlides <= 1 || isPaused) {
      return;
    }

    const stepMs = 50;
    const increment = (stepMs / ROTATION_INTERVAL_MS) * 100;

    progressTimerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          nextSlide();
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
  }, [totalSlides, isPaused, nextSlide]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      prevSlide();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      nextSlide();
    } else if (e.key === "Home") {
      e.preventDefault();
      goToSlide(0);
    } else if (e.key === "End") {
      e.preventDefault();
      goToSlide(totalSlides - 1);
    }
  };

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
      {/* COVERFLOW STAGE */}
      <div className="carousel-stage-container">
        {slides.map((slide, index) => {
          const diff = getSlideDiff(index, currentIndex, totalSlides);
          const isCenter = diff === 0;

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
                "carousel-slide-card",
                isCenter && "carousel-card-active"
              )}
              initial={false}
              animate={getCoverflowProps(diff)}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 28,
                mass: 0.9,
              }}
              drag={isCenter && totalSlides > 1 ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.25}
              onDragEnd={(_, info) => {
                const swipeThreshold = 50;
                const velocityThreshold = 350;
                if (
                  info.offset.x < -swipeThreshold ||
                  info.velocity.x < -velocityThreshold
                ) {
                  nextSlide();
                } else if (
                  info.offset.x > swipeThreshold ||
                  info.velocity.x > velocityThreshold
                ) {
                  prevSlide();
                }
              }}
              whileHover={
                !isCenter && Math.abs(diff) === 1
                  ? {
                      scale: 0.89,
                      opacity: 0.8,
                      rotateY: diff === 1 ? -18 : 18,
                      transition: { duration: 0.25 },
                    }
                  : undefined
              }
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
                    goToSlide(index);
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  aria-label={`View ${slide.category}: ${slide.title}`}
                  className="absolute inset-0 z-30 bg-background/55 hover:bg-background/25 backdrop-blur-sm cursor-pointer transition-all duration-300 flex items-center justify-center group/preview focus:outline-none"
                >
                  <span className="opacity-0 group-hover/preview:opacity-100 transition-opacity duration-200 px-3.5 py-1.5 rounded-xl bg-card/90 border border-secondary/40 text-xs font-mono font-bold text-secondary shadow-xl pointer-events-none">
                    Click to view
                  </span>
                </button>
              )}

              {/* SLIDE CARD INNER CONTENT */}
              <div className="relative z-10 p-5 sm:p-7 md:p-8 flex-1 flex flex-col justify-between gap-4 md:px-10 lg:px-12 w-full h-full">
                <div className="flex-1 flex flex-col justify-center py-1 sm:py-2">
                  {/* ========================================================================= */}
                  {/* 1. MATCH OF THE DAY AUTOMATED SYSTEM SHOWDOWN */}
                  {/* ========================================================================= */}
                  {slide.type === "MOTD" && slide.data && (
                    <div className="w-full flex-1 flex flex-col lg:flex-row items-center justify-between gap-6 my-auto">
                      <div className="space-y-3 text-left max-w-xl w-full">
                        <div className="flex items-center gap-2">
                          <Badge variant="yellow" className="text-xs font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 shadow-sm">
                            <Sparkles className="h-3 w-3 mr-1" />
                            <span>{slide.data.division} • {slide.data.round}</span>
                          </Badge>
                          <span className="text-xs font-mono text-muted-foreground font-semibold">Match of the Day</span>
                        </div>

                        <h2 className="carousel-headline font-black text-foreground drop-shadow-sm">
                          {slide.data.homePlayer?.gamerTag} <span className="text-secondary">vs</span> {slide.data.awayPlayer?.gamerTag}
                        </h2>

                        <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed line-clamp-3">
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
                      <div className="w-full lg:w-auto flex items-center justify-center gap-4 sm:gap-6 p-4 sm:p-5 rounded-2xl bg-card/85 backdrop-blur-xl border border-secondary/30 shadow-xl shrink-0">
                        <div className="flex flex-col items-center gap-2 text-center min-w-20 sm:min-w-24">
                          <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-background/90 border border-primary/40 flex items-center justify-center overflow-hidden shrink-0 shadow-md">
                            <img
                              src={resolvePlayerAvatar(slide.data.homePlayer)}
                              alt={slide.data.homePlayer?.gamerTag}
                              className="h-full w-full object-contain aspect-square"
                              loading="lazy"
                            />
                          </div>
                          <div>
                            <span className="text-xs sm:text-sm font-black text-foreground block truncate max-w-28">
                              {slide.data.homePlayer?.gamerTag}
                            </span>
                            <span className="text-xs text-muted-foreground font-mono font-bold">HOME</span>
                          </div>
                        </div>

                        <div className="flex flex-col items-center gap-1">
                          <div className="px-3 py-1 rounded-xl bg-secondary/20 border border-secondary/40 font-mono text-xs sm:text-sm font-black text-secondary shadow-inner">
                            VS
                          </div>
                          <span className="text-xs font-mono text-muted-foreground font-semibold">24H CYCLE</span>
                        </div>

                        <div className="flex flex-col items-center gap-2 text-center min-w-20 sm:min-w-24">
                          <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-background/90 border border-primary/40 flex items-center justify-center overflow-hidden shrink-0 shadow-md">
                            <img
                              src={resolvePlayerAvatar(slide.data.awayPlayer)}
                              alt={slide.data.awayPlayer?.gamerTag}
                              className="h-full w-full object-contain aspect-square"
                              loading="lazy"
                            />
                          </div>
                          <div>
                            <span className="text-xs sm:text-sm font-black text-foreground block truncate max-w-28">
                              {slide.data.awayPlayer?.gamerTag}
                            </span>
                            <span className="text-xs text-muted-foreground font-mono font-bold">AWAY</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ========================================================================= */}
                  {/* 2. MOTD FINAL RESULT AUTOMATED UPDATE */}
                  {/* ========================================================================= */}
                  {slide.type === "MOTD_RESULT" && slide.data && (
                    <div className="w-full flex-1 flex flex-col lg:flex-row items-center justify-between gap-6 my-auto">
                      <div className="space-y-3 text-left max-w-xl w-full">
                        <div className="flex items-center gap-2">
                          <Badge variant="yellow" className="text-xs font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 shadow-sm">
                            <Award className="h-3 w-3 mr-1" />
                            <span>{slide.data.division} • {slide.data.round} Final</span>
                          </Badge>
                        </div>

                        <h2 className="carousel-headline font-black text-foreground drop-shadow-sm">
                          Match of the Day Concluded
                        </h2>

                        <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed line-clamp-3">
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
                      <div className="w-full lg:w-auto flex items-center justify-center gap-4 sm:gap-6 p-4 sm:p-5 rounded-2xl bg-card/85 backdrop-blur-xl border border-border shadow-xl font-mono shrink-0">
                        <div className="text-right min-w-20 sm:min-w-24">
                          <span className="text-xs sm:text-sm font-black text-foreground block truncate max-w-28">
                            {slide.data.homePlayer?.gamerTag}
                          </span>
                          <span className="text-xs text-muted-foreground font-bold">HOME</span>
                        </div>

                        <div className="px-4 py-2 rounded-2xl bg-background/90 border border-border text-lg sm:text-2xl font-black text-secondary tracking-widest shadow-inner">
                          {slide.data.homeScore ?? 0} : {slide.data.awayScore ?? 0}
                        </div>

                        <div className="text-left min-w-20 sm:min-w-24">
                          <span className="text-xs sm:text-sm font-black text-foreground block truncate max-w-28">
                            {slide.data.awayPlayer?.gamerTag}
                          </span>
                          <span className="text-xs text-muted-foreground font-bold">AWAY</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ========================================================================= */}
                  {/* 3. IN-FORM ATHLETES AUTOMATED UPDATE */}
                  {/* ========================================================================= */}
                  {slide.type === "IN_FORM" && slide.data && (
                    <div className="w-full space-y-3 sm:space-y-4 my-auto">
                      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 text-left">
                        <div className="space-y-1">
                          <span className="text-xs font-mono text-secondary font-bold flex items-center gap-1.5 uppercase">
                            <TrendingUp className="h-3.5 w-3.5 text-secondary" />
                            <span>STANDINGS &amp; WIN-RATE PERFORMANCE LEADERS</span>
                          </span>
                          <h2 className="carousel-headline font-black text-foreground drop-shadow-sm">
                            {slide.title}
                          </h2>
                          <p className="text-xs sm:text-sm text-foreground/80 max-w-xl leading-relaxed">
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

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 pt-1">
                        {slide.data.athletes?.map((ath: any) => (
                          <div
                            key={ath.gamerTag}
                            className="rounded-xl border border-border/80 bg-card/75 backdrop-blur-md p-3 sm:p-3.5 space-y-2 shadow-md hover:border-secondary/40 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <Badge variant="outline" className="text-xs font-mono font-bold text-secondary border-secondary/30 bg-secondary/10">
                                Rank #{ath.rank}
                              </Badge>
                              <span className="text-xs font-mono font-bold text-primary">
                                {ath.division}
                              </span>
                            </div>

                            <div className="flex items-center gap-2.5">
                              <div className="flex h-10 w-10 shrink-0 aspect-square items-center justify-center rounded-xl bg-card border border-primary/30 overflow-hidden text-xs font-black text-primary shadow-sm">
                                {ath.avatar ? (
                                  <img src={ath.avatar} alt={ath.gamerTag} className="h-full w-full object-contain aspect-square" loading="lazy" />
                                ) : (
                                  ath.gamerTag.substring(0, 2).toUpperCase()
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <span className="text-sm font-black text-foreground block truncate">
                                  {ath.gamerTag}
                                </span>
                                {ath.realTeam && (
                                  <span className="text-xs text-muted-foreground truncate block">
                                    {findTeam(ath.realTeam)?.name || ath.realTeam}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="pt-1.5 border-t border-border/60 flex items-center justify-between text-xs font-mono">
                              <span className="text-foreground font-bold">{ath.winRate}% Win Rate</span>
                              <span className="text-muted-foreground">{ath.won}W / {ath.played}P</span>
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
                    <div className="w-full space-y-3 sm:space-y-4 my-auto">
                      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 text-left">
                        <div className="space-y-1">
                          <span className="text-xs font-mono text-secondary font-bold flex items-center gap-1.5 uppercase">
                            <Crown className="h-3.5 w-3.5 text-secondary" />
                            <span>REIGNING CHAMPIONS &amp; HISTORIC TITLES</span>
                          </span>
                          <h2 className="carousel-headline font-black text-foreground drop-shadow-sm">
                            {slide.title}
                          </h2>
                          <p className="text-xs sm:text-sm text-foreground/80 max-w-xl leading-relaxed">
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

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                        {slide.data.champions?.map((champ: any) => (
                          <div
                            key={champ.id}
                            className="rounded-xl border border-secondary/35 bg-card/75 backdrop-blur-md p-3.5 sm:p-4 flex items-center justify-between gap-3 shadow-md hover:border-secondary/60 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-xl bg-secondary/15 border border-secondary/30 flex items-center justify-center shrink-0 shadow-sm">
                                <Crown className="h-5 w-5 text-secondary" />
                              </div>
                              <div>
                                <span className="text-xs font-mono uppercase text-secondary font-bold block">
                                  👑 Champion
                                </span>
                                <span className="text-sm font-black text-foreground truncate block">
                                  {champ.championName}
                                </span>
                              </div>
                            </div>

                            <div className="text-right">
                              <Badge variant="yellow" className="text-xs font-mono font-bold">
                                {champ.season}
                              </Badge>
                              <span className="text-xs text-muted-foreground block truncate max-w-28 mt-0.5">
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
                    <div className="w-full flex-1 flex flex-col lg:flex-row items-center justify-between gap-6 my-auto">
                      <div className="space-y-3 text-left max-w-xl w-full">
                        <span className="text-xs font-mono text-secondary font-bold flex items-center gap-1.5 uppercase">
                          <ShieldCheck className="h-3.5 w-3.5 text-secondary" />
                          <span>OFFICIAL ATHLETE ENROLLMENT</span>
                        </span>
                        <h2 className="carousel-headline font-black text-foreground drop-shadow-sm">
                          {slide.title}
                        </h2>
                        <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed">
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
                                "carousel-cta-btn font-black text-secondary-foreground text-sm gap-2 rounded-xl shadow-lg cursor-pointer pointer-events-auto inline-flex items-center"
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
                  {/* 6. STANDARD NEWS ARTICLE (Admin Created or System Published) */}
                  {/* ========================================================================= */}
                  {(!slide.type || slide.type === "NEWS") && (
                    <div className="w-full flex-1 flex flex-col lg:flex-row items-center justify-between gap-6 my-auto">
                      {/* Left Column: Text & CTA */}
                      <div className="space-y-3.5 text-left max-w-2xl flex-1 w-full">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <Badge
                            variant="yellow"
                            className="text-xs font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 shadow-sm"
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

                        <p className="text-xs sm:text-sm md:text-base text-foreground/85 leading-relaxed line-clamp-3 sm:line-clamp-4 whitespace-pre-line max-w-xl font-normal">
                          {slide.description}
                        </p>

                        {/* Optional CTA Button (Rendered only when configured) */}
                        {slide.buttonText && slide.buttonUrl && (
                          <div className="pt-2">
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
                        <div className="relative rounded-2xl overflow-hidden border border-secondary/35 bg-card/75 backdrop-blur-md shadow-2xl shrink-0 max-h-52 sm:max-h-60 lg:max-h-72 max-w-full lg:max-w-md w-auto group/img flex items-center justify-center p-1.5">
                          <img
                            src={slide.featuredImage}
                            alt={slide.title}
                            className="w-auto h-auto max-h-48 sm:max-h-56 lg:max-h-68 max-w-full rounded-xl object-contain aspect-auto group-hover/img:scale-105 transition-transform duration-500 shadow-md"
                            loading="lazy"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* BOTTOM ROW: League Branding & Verified Bulletins */}
                <div className="flex items-center justify-between pt-2 border-t border-border/40 text-xs font-mono text-muted-foreground/80 w-full mt-auto">
                  <span className="truncate">eFootball Rwanda League • News &amp; Updates</span>
                  <span className="uppercase tracking-widest hidden sm:inline-block font-semibold text-secondary">
                    Official Broadcast
                  </span>
                </div>
              </div>

              {/* Dynamic progress line on bottom of active card */}
              {isCenter && totalSlides > 1 && !isPaused && (
                <div className="h-1 w-full bg-border/40 overflow-hidden relative z-10">
                  <div
                    className="h-full bg-secondary transition-all duration-75 ease-linear"
                    // eslint-disable-next-line shadcn/no-inline-styles -- dynamic progress 0-100%
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
            </motion.div>
          );
        })}

        {/* FLOATING NAVIGATION BUTTONS */}
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
              className="carousel-nav-btn absolute left-2 sm:left-4 lg:left-6 top-1/2 -translate-y-1/2 z-50 group flex cursor-pointer pointer-events-auto select-none"
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
              className="carousel-nav-btn absolute right-2 sm:right-4 lg:right-6 top-1/2 -translate-y-1/2 z-50 group flex cursor-pointer pointer-events-auto select-none"
            >
              <ChevronRight className="h-5 w-5 text-foreground transition-transform duration-200 group-hover:translate-x-0.5" />
            </button>
          </>
        )}
      </div>

      {/* Pagination Dots */}
      {totalSlides > 1 && (
        <div className="flex items-center justify-center gap-2 pt-3 sm:pt-4">
          {slides.map((s, idx) => (
            <button
              key={s.id || idx}
              type="button"
              onClick={() => goToSlide(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={cn(
                "carousel-dot",
                idx === currentIndex ? "carousel-dot-active" : "carousel-dot-inactive"
              )}
            />
          ))}
        </div>
      )}
    </section>
  );
}
