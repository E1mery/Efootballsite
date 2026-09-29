"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Trophy,
  Sparkles,
  ArrowRight,
  Crown,
  ShieldCheck,
  TrendingUp,
  Award,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { resolvePlayerAvatar, findTeam } from "@/lib/teams";
import AuthPromptModal from "@/components/AuthPromptModal";

export type CarouselSlideType =
  | "IN_FORM"
  | "MOTD"
  | "MOTD_RESULT"
  | "HALL_OF_FAME"
  | "TODAY_MATCHES"
  | "REGISTRATION";

export interface CarouselSlide {
  id: string;
  type: CarouselSlideType;
  badge: string;
  tabLabel: string;
  title: string;
  subtitle?: string;
  data: any;
}

interface NewsTrendingCarouselProps {
  slides: CarouselSlide[];
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

function getSlidePositionClass(diff: number, total: number): string {
  if (total <= 1 || diff === 0) return "carousel-card-active";
  if (diff === 1) return "carousel-card-next";
  if (diff === -1) return "carousel-card-prev";
  if (diff > 1) return "carousel-card-hidden-right";
  return "carousel-card-hidden-left";
}

export default function NewsTrendingCarousel({
  slides = [],
  userSession = null,
}: NewsTrendingCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [session, setSession] = useState(userSession);
  const [authModal, setAuthModal] = useState<{
    isOpen: boolean;
    title?: string;
    description?: string;
    redirectUrl?: string;
  }>({ isOpen: false });

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const mouseStartX = useRef<number | null>(null);
  const isMouseDown = useRef(false);
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (userSession) {
      setSession(userSession);
      return;
    }
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("efrl_user");
        if (cached) {
          const parsed = JSON.parse(cached);
          setSession({ authenticated: true, user: parsed, player: parsed.player });
        }
      } catch (e) {
        // ignore
      }
    }

    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          setSession(data);
        } else {
          setSession({ authenticated: false });
        }
      })
      .catch(() => {});
  }, [userSession]);

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

  useEffect(() => {
    if (totalSlides <= 1 || isPaused || authModal.isOpen) {
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
  }, [totalSlides, isPaused, authModal.isOpen, nextSlide]);

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

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;

    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 40) {
      if (deltaX > 0) {
        prevSlide();
      } else {
        nextSlide();
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    isMouseDown.current = true;
    mouseStartX.current = e.clientX;
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isMouseDown.current || mouseStartX.current === null) return;
    const deltaX = e.clientX - mouseStartX.current;
    if (Math.abs(deltaX) > 50) {
      if (deltaX > 0) {
        prevSlide();
      } else {
        nextSlide();
      }
    }
    isMouseDown.current = false;
    mouseStartX.current = null;
  };

  if (totalSlides === 0) {
    return null;
  }

  return (
    <>
      <section
        aria-label="News and Trending Hero Banner"
        role="region"
        aria-roledescription="carousel"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onFocus={() => setIsPaused(true)}
        onBlur={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        className="relative z-20 mx-auto max-w-360 px-2 sm:px-4 lg:px-6 select-none focus:outline-none"
      >
        {/* COVERFLOW STAGE: LARGE CENTERED ACTIVE SLIDE + SMALLER FLANKING PREV/NEXT SLIDES */}
        <div className="carousel-stage-container">
          {/* FLOATING NAVIGATION BUTTONS (DESKTOP & TABLET) */}
          {totalSlides > 1 && (
            <>
              <button
                type="button"
                onClick={prevSlide}
                disabled={totalSlides <= 1}
                aria-label="Previous slide"
                className="carousel-nav-btn absolute left-2 sm:left-4 lg:left-6 top-1/2 -translate-y-1/2 z-40 group flex"
              >
                <ChevronLeft className="h-5 w-5 text-foreground transition-transform duration-200 group-hover:-translate-x-0.5" />
              </button>
              <button
                type="button"
                onClick={nextSlide}
                disabled={totalSlides <= 1}
                aria-label="Next slide"
                className="carousel-nav-btn absolute right-2 sm:right-4 lg:right-6 top-1/2 -translate-y-1/2 z-40 group flex"
              >
                <ChevronRight className="h-5 w-5 text-foreground transition-transform duration-200 group-hover:translate-x-0.5" />
              </button>
            </>
          )}

          {/* SLIDES TRACK */}
          {slides.map((slide, index) => {
            const diff = getSlideDiff(index, currentIndex, totalSlides);
            const isCenter = diff === 0;
            const positionClass = getSlidePositionClass(diff, totalSlides);

            return (
              <div
                key={slide.id || index}
                className={`carousel-slide-card ${positionClass}`}
              >
                {/* Multi-layer Cinematic Sports Background */}
                <div
                  className="carousel-bg-layer"
                  // eslint-disable-next-line shadcn/no-inline-styles -- dynamic background image
                  style={{ backgroundImage: "url('/images/carousel-stadium-bg.jpg')" }}
                />
                {/* 1. Dark transparent base overlay */}
                <div className="carousel-overlay-dark" />
                {/* 2. Left-to-right gradient darker towards text area */}
                <div className="carousel-overlay-gradient" />
                {/* 3. Subtle vignette around edges */}
                <div className="carousel-overlay-vignette" />
                {/* 4. Ambient stadium floodlight / brand glow */}
                <div className="carousel-overlay-glow" />

                {/* Top Brand Accent Line */}
                <div className="h-1 w-full bg-gradient-to-r from-primary via-secondary to-primary opacity-80 relative z-10" />

                {/* Clickable Overlay for Preview / Inactive Cards */}
                {!isCenter && (
                  <button
                    type="button"
                    onClick={() => goToSlide(index)}
                    aria-label={`View ${slide.badge}: ${slide.title}`}
                    className="absolute inset-0 z-30 bg-background/55 hover:bg-background/25 backdrop-blur-sm cursor-pointer transition-all duration-300 flex items-center justify-center group/preview focus:outline-none"
                  >
                    <span className="opacity-0 group-hover/preview:opacity-100 transition-opacity duration-200 px-3.5 py-1.5 rounded-xl bg-card/90 border border-secondary/40 text-xs font-mono font-bold text-secondary shadow-xl">
                      Click to view
                    </span>
                  </button>
                )}

                {/* SLIDE CARD INNER CONTENT */}
                <div className="relative z-10 p-5 sm:p-7 md:p-8 flex-1 flex flex-col justify-between gap-4 md:px-12">

                  {/* MAIN BODY PER SLIDE TYPE */}
                  <div className="flex-1 flex flex-col justify-center py-1 sm:py-2">
                    {/* 1. PLAYERS WHO ARE IN FORM */}
                    {slide.type === "IN_FORM" && (
                      <div className="w-full space-y-3 sm:space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 text-left">
                          <div className="space-y-1">
                            <span className="text-xs font-mono text-secondary font-bold flex items-center gap-1.5">
                              <TrendingUp className="h-3.5 w-3.5 text-secondary" />
                              <span>STANDINGS &amp; WIN-RATE PERFORMANCE LEADERS</span>
                            </span>
                            <h2 className="carousel-headline">
                              {slide.title}
                            </h2>
                            <p className="text-xs sm:text-sm text-muted-foreground max-w-xl leading-relaxed">
                              {slide.subtitle || "Top-ranked contenders evaluated from official table standings, win rate & individual form."}
                            </p>
                          </div>

                          <Link href="/standings" tabIndex={isCenter ? 0 : -1}>
                            <Button variant="yellow" size="sm" className="carousel-cta-btn font-bold text-secondary-foreground text-xs gap-1.5 shrink-0 rounded-xl">
                              <span>Full Standings</span>
                              <ArrowRight className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
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
                                    <img src={ath.avatar} alt={ath.gamerTag} className="h-full w-full object-contain" loading="lazy" />
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

                    {/* 2. MATCH OF THE DAY (ACTIVE CLASH) */}
                    {slide.type === "MOTD" && slide.data && (
                      <div className="w-full flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
                        <div className="space-y-2 text-left max-w-xl">
                          <span className="text-xs font-mono text-secondary font-bold flex items-center gap-1.5 uppercase tracking-wider">
                            <Sparkles className="h-3.5 w-3.5 text-secondary" />
                            <span>{slide.data.division} • {slide.data.round}</span>
                          </span>
                          <h2 className="carousel-headline">
                            {slide.data.homePlayer?.gamerTag} <span className="text-secondary">vs</span> {slide.data.awayPlayer?.gamerTag}
                          </h2>
                          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                            {slide.subtitle || "The featured top-tier showdown of the 24-hour cycle."}
                          </p>
                          <div className="pt-1">
                            <Link href={`/fixtures?highlight=${slide.data.id}`} tabIndex={isCenter ? 0 : -1}>
                              <Button variant="yellow" size="sm" className="carousel-cta-btn font-black text-secondary-foreground text-xs gap-1.5 rounded-xl shadow-lg">
                                <span>View Match Center</span>
                                <ArrowRight className="h-3.5 w-3.5" />
                              </Button>
                            </Link>
                          </div>
                        </div>

                        {/* High-Impact Showdown Card */}
                        <div className="w-full lg:w-auto flex items-center justify-center gap-4 sm:gap-6 p-4 sm:p-5 rounded-2xl bg-card/80 backdrop-blur-xl border border-secondary/30 shadow-xl">
                          <div className="flex flex-col items-center gap-2 text-center min-w-20 sm:min-w-24">
                            <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-2xl bg-background/90 border border-primary/40 flex items-center justify-center overflow-hidden shrink-0 shadow-md">
                              <img
                                src={resolvePlayerAvatar(slide.data.homePlayer)}
                                alt={slide.data.homePlayer?.gamerTag}
                                className="h-full w-full object-contain"
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
                            <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-2xl bg-background/90 border border-primary/40 flex items-center justify-center overflow-hidden shrink-0 shadow-md">
                              <img
                                src={resolvePlayerAvatar(slide.data.awayPlayer)}
                                alt={slide.data.awayPlayer?.gamerTag}
                                className="h-full w-full object-contain"
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

                    {/* 3. MOTD RESULT (COMPLETED CLASH) */}
                    {slide.type === "MOTD_RESULT" && slide.data && (
                      <div className="w-full flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
                        <div className="space-y-2 text-left max-w-xl">
                          <span className="text-xs font-mono text-secondary font-bold flex items-center gap-1.5 uppercase tracking-wider">
                            <Award className="h-3.5 w-3.5 text-secondary" />
                            <span>{slide.data.division} • {slide.data.round} Final</span>
                          </span>
                          <h2 className="carousel-headline">
                            Match of the Day Concluded
                          </h2>
                          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                            {slide.subtitle}
                          </p>
                          <div className="pt-1">
                            <Link href="/fixtures" tabIndex={isCenter ? 0 : -1}>
                              <Button variant="outline" size="sm" className="carousel-cta-btn font-semibold text-xs border-border gap-1.5 rounded-xl">
                                <span>Fixture Archive</span>
                                <ArrowRight className="h-3.5 w-3.5" />
                              </Button>
                            </Link>
                          </div>
                        </div>

                        {/* Final Scoreboard Card */}
                        <div className="w-full lg:w-auto flex items-center justify-center gap-4 sm:gap-6 p-4 sm:p-5 rounded-2xl bg-card/80 backdrop-blur-xl border border-border shadow-xl font-mono">
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

                    {/* 4. THE HALL OF FAME (TITLE WINNERS LAST SEASON) */}
                    {slide.type === "HALL_OF_FAME" && (
                      <div className="w-full space-y-3 sm:space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 text-left">
                          <div className="space-y-1">
                            <span className="text-xs font-mono text-secondary font-bold flex items-center gap-1.5 uppercase tracking-wider">
                              <Crown className="h-3.5 w-3.5 text-secondary" />
                              <span>REIGNING CHAMPIONS &amp; HISTORIC TITLES</span>
                            </span>
                            <h2 className="carousel-headline">
                              {slide.title}
                            </h2>
                            <p className="text-xs sm:text-sm text-muted-foreground max-w-xl leading-relaxed">
                              {slide.subtitle || "Athletes who conquered Rwanda's official eFootball championships."}
                            </p>
                          </div>

                          <Link href="/#hall-of-fame" tabIndex={isCenter ? 0 : -1}>
                            <Button variant="yellow" size="sm" className="carousel-cta-btn font-bold text-secondary-foreground text-xs gap-1.5 shrink-0 rounded-xl">
                              <span>Explore Hall of Fame</span>
                              <ArrowRight className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                          {slide.data.champions?.map((champ: any) => (
                            <div
                              key={champ.id}
                              className="rounded-xl border border-secondary/35 bg-card/75 backdrop-blur-md p-3.5 sm:p-4 flex items-center justify-between gap-3 shadow-md hover:border-secondary/60 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-secondary/15 border border-secondary/30 flex items-center justify-center shrink-0 shadow-sm">
                                  <Crown className="h-4 w-4 sm:h-5 sm:w-5 text-secondary" />
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

                    {/* 5. TODAY'S CONFIRMED FIXTURES */}
                    {slide.type === "TODAY_MATCHES" && (
                      <div className="w-full flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
                        <div className="space-y-2 text-left max-w-xl">
                          <span className="text-xs font-mono text-primary font-bold flex items-center gap-1.5 uppercase tracking-wider">
                            <Calendar className="h-3.5 w-3.5 text-primary" />
                            <span>CONFIRMED 24-HR CYCLE FIXTURES</span>
                          </span>
                          <h2 className="carousel-headline">
                            {slide.title}
                          </h2>
                          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                            {slide.subtitle || "Matches scheduled today within official Rwandan Time (CAT)."}
                          </p>
                          <div className="pt-1">
                            <Link href="/fixtures" tabIndex={isCenter ? 0 : -1}>
                              <Button variant="yellow" size="sm" className="carousel-cta-btn font-bold text-secondary-foreground text-xs gap-1.5 rounded-xl shadow-lg">
                                <span>Open Fixtures</span>
                                <ArrowRight className="h-3.5 w-3.5" />
                              </Button>
                            </Link>
                          </div>
                        </div>

                        <div className="w-full lg:w-auto flex items-center gap-2.5 overflow-x-auto no-scrollbar max-w-full">
                          {slide.data.matches?.slice(0, 3).map((m: any) => (
                            <div
                              key={m.id}
                              className="p-3 sm:p-3.5 rounded-2xl bg-card/80 backdrop-blur-xl border border-border shrink-0 text-xs space-y-1.5 shadow-md min-w-40 sm:min-w-44"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <Badge variant="outline" className="text-xs font-mono text-primary border-primary/30">
                                  {m.division}
                                </Badge>
                                <span className="font-mono text-muted-foreground text-xs">{m.status}</span>
                              </div>
                              <span className="font-bold text-foreground block truncate max-w-40 text-xs sm:text-sm">
                                {m.homePlayer?.gamerTag} vs {m.awayPlayer?.gamerTag}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 6. SEASON REGISTRATION */}
                    {slide.type === "REGISTRATION" && (
                      <div className="w-full flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
                        <div className="space-y-2 text-left max-w-xl">
                          <span className="text-xs font-mono text-secondary font-bold flex items-center gap-1.5 uppercase tracking-wider">
                            <ShieldCheck className="h-3.5 w-3.5 text-secondary" />
                            <span>OFFICIAL ATHLETE ENROLLMENT</span>
                          </span>
                          <h2 className="carousel-headline">
                            {slide.title}
                          </h2>
                          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                            Athletes compete across Division 1, Division 2, and Division 3 in daily 24-hour matchday cycles with direct WhatsApp matchmaking.
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 shrink-0">
                          <Link href="/register" tabIndex={isCenter ? 0 : -1}>
                            <Button variant="yellow" size="default" className="carousel-cta-btn font-black text-secondary-foreground text-sm gap-2 rounded-xl shadow-lg">
                              <span>Register Athlete</span>
                              <ArrowRight className="h-4 w-4" />
                            </Button>
                          </Link>

                          <Link href="/standings" tabIndex={isCenter ? 0 : -1}>
                            <Button variant="outline" size="default" className="carousel-cta-btn font-bold text-xs border-border rounded-xl">
                              Standings
                            </Button>
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* BOTTOM ROW: MINIMAL FOOTER BRANDING */}
                  <div className="flex items-center justify-between pt-2 border-t border-border/40 text-xs font-mono text-muted-foreground/70">
                    <span className="truncate">eFootball Rwanda League</span>
                    <span className="uppercase tracking-widest hidden sm:inline-block">Season 2026</span>
                  </div>
                </div>

                {/* DYNAMIC PROGRESS LINE ON BOTTOM OF ACTIVE CARD */}
                {isCenter && totalSlides > 1 && !isPaused && (
                  <div className="h-1 w-full bg-border/40 overflow-hidden relative z-10">
                    <div
                      className="h-full bg-secondary transition-all duration-75 ease-linear"
                      // eslint-disable-next-line shadcn/no-inline-styles -- dynamic progress 0-100%
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </section>

      {/* Auth Prompt Modal */}
      <AuthPromptModal
        isOpen={authModal.isOpen}
        onClose={() => setAuthModal({ isOpen: false })}
        actionTitle={authModal.title}
        actionDescription={authModal.description}
        redirectUrl={authModal.redirectUrl || "/"}
      />
    </>
  );
}
