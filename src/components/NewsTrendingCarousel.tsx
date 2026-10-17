"use client";

import { useState, useEffect, useRef, useCallback, memo } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Minus,
  Flame,
  Calendar,
  Sparkles,
  Award,
  Crown,
  TrendingUp,
  ShieldCheck,
  Megaphone,
  Trophy,
  Zap,
  CheckCircle2,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
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
  onCardClick: (index: number) => void;
}

interface SuperCupCarouselPredictionProps {
  homePlayer: any;
  awayPlayer: any;
  initialPollStats?: {
    totalVotes?: number;
    f1Votes?: number;
    f2Votes?: number;
    homeVotes?: number;
    awayVotes?: number;
    f1Pct?: number;
    f2Pct?: number;
    homePct?: number;
    awayPct?: number;
  };
  isFinished: boolean;
  winnerPlayer: any;
}

const SuperCupCarouselPrediction = memo(function SuperCupCarouselPrediction({
  homePlayer,
  awayPlayer,
  initialPollStats,
  isFinished,
  winnerPlayer,
}: SuperCupCarouselPredictionProps) {
  const [voterId, setVoterId] = useState<string>("");
  const [userVotedWinnerId, setUserVotedWinnerId] = useState<string | null>(null);
  const [voting, setVoting] = useState(false);
  const [pollStats, setPollStats] = useState({
    totalVotes: initialPollStats?.totalVotes || 0,
    f1Votes: initialPollStats?.f1Votes ?? initialPollStats?.homeVotes ?? 0,
    f2Votes: initialPollStats?.f2Votes ?? initialPollStats?.awayVotes ?? 0,
    f1Pct: initialPollStats?.f1Pct ?? initialPollStats?.homePct ?? 50,
    f2Pct: initialPollStats?.f2Pct ?? initialPollStats?.awayPct ?? 50,
  });

  useEffect(() => {
    let vid = "";
    try {
      const stored = localStorage.getItem("efrl_user");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.id) vid = parsed.id;
      }
    } catch {}

    if (!vid) {
      let guestId = localStorage.getItem("efrl_supercup_voter_id");
      if (!guestId) {
        guestId = "voter_" + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
        localStorage.setItem("efrl_supercup_voter_id", guestId);
      }
      vid = guestId;
    }
    setVoterId(vid);

    // Fetch live user vote status
    fetch(`/api/continental/trophy-poll?competition=SUPER_CUP&voterId=${encodeURIComponent(vid)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.active) {
          if (data.userVotedWinnerId) {
            setUserVotedWinnerId(data.userVotedWinnerId);
          }
          if (data.totalVotes !== undefined) {
            setPollStats({
              totalVotes: data.totalVotes,
              f1Votes: data.finalist1?.votes || 0,
              f2Votes: data.finalist2?.votes || 0,
              f1Pct: data.finalist1?.percentage ?? 50,
              f2Pct: data.finalist2?.percentage ?? 50,
            });
          }
        }
      })
      .catch(() => {});
  }, []);

  const handleQuickVote = async (predictedWinnerPlayerId: string) => {
    if (!voterId || voting || isFinished || !predictedWinnerPlayerId) return;
    setVoting(true);

    const isF1 = predictedWinnerPlayerId === homePlayer?.id;
    const prevF1Votes = pollStats.f1Votes;
    const prevF2Votes = pollStats.f2Votes;
    const prevTotal = pollStats.totalVotes;
    const hadVoted = Boolean(userVotedWinnerId);

    let newF1Votes = prevF1Votes;
    let newF2Votes = prevF2Votes;
    let newTotal = prevTotal;

    if (!hadVoted) {
      newTotal += 1;
      if (isF1) newF1Votes += 1;
      else newF2Votes += 1;
    } else if (userVotedWinnerId !== predictedWinnerPlayerId) {
      if (isF1) {
        newF1Votes += 1;
        newF2Votes = Math.max(0, newF2Votes - 1);
      } else {
        newF2Votes += 1;
        newF1Votes = Math.max(0, newF1Votes - 1);
      }
    }

    const newF1Pct = newTotal > 0 ? Math.round((newF1Votes / newTotal) * 100) : 50;
    const newF2Pct = newTotal > 0 ? 100 - newF1Pct : 50;

    setUserVotedWinnerId(predictedWinnerPlayerId);
    setPollStats({
      totalVotes: newTotal,
      f1Votes: newF1Votes,
      f2Votes: newF2Votes,
      f1Pct: newF1Pct,
      f2Pct: newF2Pct,
    });

    try {
      const res = await fetch("/api/continental/trophy-poll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          competition: "SUPER_CUP",
          predictedWinnerPlayerId,
          voterId,
        }),
      });
      if (!res.ok) {
        throw new Error("Failed to record prediction");
      }
    } catch {
      setUserVotedWinnerId(null);
      setPollStats({
        totalVotes: prevTotal,
        f1Votes: prevF1Votes,
        f2Votes: prevF2Votes,
        f1Pct: prevTotal > 0 ? Math.round((prevF1Votes / prevTotal) * 100) : 50,
        f2Pct: prevTotal > 0 ? Math.round((prevF2Votes / prevTotal) * 100) : 50,
      });
    } finally {
      setVoting(false);
    }
  };

  if (isFinished && winnerPlayer) {
    return (
      <div className="flex items-center gap-2 text-xs font-mono text-secondary font-bold">
        <Crown className="h-4 w-4 text-secondary shrink-0" />
        <span className="truncate">
          Super Cup Champion: @{winnerPlayer.gamerTag} ({findTeam(winnerPlayer.realTeam)?.shortName || winnerPlayer.realTeam || "Winner"})
        </span>
      </div>
    );
  }

  return (
    <div className="w-full sm:max-w-md space-y-1.5">
      <div className="flex items-center justify-between text-xs font-mono font-bold">
        <span className="text-primary truncate max-w-28 sm:max-w-36">
          @{homePlayer?.gamerTag} {pollStats.f1Pct}%
        </span>
        <span className="text-muted-foreground text-xs font-normal">
          Prediction Poll ({pollStats.totalVotes} votes)
        </span>
        <span className="text-secondary truncate max-w-28 sm:max-w-36 text-right">
          {pollStats.f2Pct}% @{awayPlayer?.gamerTag}
        </span>
      </div>

      <div className="h-2 w-full rounded-full bg-muted overflow-hidden flex shadow-inner border border-border/40">
        {/* eslint-disable shadcn/no-inline-styles -- dynamic prediction poll percentage */}
        <div
          className="h-full bg-primary transition-all duration-500"
          style={{ width: `${pollStats.f1Pct}%` }}
        />
        <div
          className="h-full bg-secondary transition-all duration-500"
          style={{ width: `${pollStats.f2Pct}%` }}
        />
        {/* eslint-enable shadcn/no-inline-styles */}
      </div>

      <div className="flex items-center gap-2 pt-0.5">
        <button
          type="button"
          disabled={voting}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleQuickVote(homePlayer?.id);
          }}
          onMouseDown={(e) => e.stopPropagation()}
          className={cn(
            "px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer pointer-events-auto border flex items-center gap-1",
            userVotedWinnerId === homePlayer?.id
              ? "bg-primary text-primary-foreground border-primary shadow-sm"
              : "bg-card/90 text-foreground hover:bg-primary/15 hover:text-primary hover:border-primary/50 border-border/70"
          )}
        >
          {userVotedWinnerId === homePlayer?.id && (
            <CheckCircle2 className="h-3 w-3 text-primary-foreground shrink-0" />
          )}
          <span>
            {userVotedWinnerId === homePlayer?.id
              ? "Your Pick"
              : `Predict @${homePlayer?.gamerTag || "Home"}`}
          </span>
        </button>

        <button
          type="button"
          disabled={voting}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleQuickVote(awayPlayer?.id);
          }}
          onMouseDown={(e) => e.stopPropagation()}
          className={cn(
            "px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer pointer-events-auto border flex items-center gap-1",
            userVotedWinnerId === awayPlayer?.id
              ? "bg-secondary text-secondary-foreground border-secondary shadow-sm"
              : "bg-card/90 text-foreground hover:bg-secondary/15 hover:text-secondary hover:border-secondary/50 border-border/70"
          )}
        >
          {userVotedWinnerId === awayPlayer?.id && (
            <CheckCircle2 className="h-3 w-3 text-secondary-foreground shrink-0" />
          )}
          <span>
            {userVotedWinnerId === awayPlayer?.id
              ? "Your Pick"
              : `Predict @${awayPlayer?.gamerTag || "Away"}`}
          </span>
        </button>
      </div>
    </div>
  );
});

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

  const isSuperCupSlide = Boolean(
    slide.type === "SUPER_CUP" ||
    slide.featuredImage === "/images/super-cup-bg.jpg" ||
    slide.featuredImage === "/images/super-cup-stadium-bg.jpg" ||
    slide.data?.competition === "SUPER_CUP" ||
    slide.data?.division === "SUPER_CUP" ||
    slide.data?.isSuperCup === true ||
    slide.id?.startsWith("sys-announcement-super-cup")
  );

  const isEuropaSlide = !isSuperCupSlide && Boolean(
    slide.category?.toLowerCase().includes("europa") ||
    slide.title?.toLowerCase().includes("europa") ||
    slide.description?.toLowerCase().includes("europa") ||
    slide.buttonUrl?.toLowerCase().includes("europa") ||
    slide.featuredImage === "/images/europa-stadium-bg.jpg" ||
    slide.data?.competition === "EUROPA" ||
    slide.data?.division === "EUROPA" ||
    (slide.data?.subType === "DRAW_SCHEDULED" && Boolean(slide.data?.europaTimeStr) && !slide.data?.uclTimeStr)
  );

  const isUclSlide = !isSuperCupSlide && !isEuropaSlide && Boolean(
    slide.category?.toLowerCase().includes("ucl") ||
    slide.title?.toLowerCase().includes("ucl") ||
    slide.title?.toLowerCase().includes("champions league") ||
    slide.description?.toLowerCase().includes("ucl") ||
    slide.description?.toLowerCase().includes("champions league") ||
    slide.buttonUrl?.toLowerCase().includes("ucl") ||
    slide.featuredImage === "/images/ucl-stadium-bg.jpg" ||
    slide.data?.competition === "UCL" ||
    slide.data?.division === "UCL" ||
    (slide.data?.subType === "DRAW_SCHEDULED" && Boolean(slide.data?.uclTimeStr))
  );

  const isDerbySlide = Boolean(
    slide.type === "DERBY" ||
    slide.category?.toLowerCase() === "derby" ||
    slide.tabLabel?.toLowerCase().includes("derby")
  );

  const isMotwSlide = !isSuperCupSlide && !isDerbySlide && Boolean(
    slide.type === "MOTW" ||
    slide.featuredImage === "/images/motw-stadium-bg.jpg" ||
    slide.badge?.toLowerCase().includes("match of the week") ||
    (slide.category?.toLowerCase() === "match" && (slide.title || "").toLowerCase().includes("match of the week")) ||
    (slide.tabLabel?.toLowerCase().includes("match of the week"))
  );

  const isCustomFeaturedImage = Boolean(
    slide.featuredImage &&
    slide.featuredImage !== "/images/carousel-stadium-bg.jpg" &&
    slide.featuredImage !== "/images/ucl-stadium-bg.jpg" &&
    slide.featuredImage !== "/images/europa-stadium-bg.jpg" &&
    slide.featuredImage !== "/images/motw-stadium-bg.jpg" &&
    slide.featuredImage !== "/images/super-cup-bg.jpg" &&
    slide.featuredImage !== "/images/super-cup-stadium-bg.jpg"
  );

  const ambientBackgroundImage = isSuperCupSlide
    ? "/images/super-cup-bg.jpg"
    : (isMotwSlide || isDerbySlide)
    ? (slide.featuredImage || "/images/motw-stadium-bg.jpg")
    : isCustomFeaturedImage
    ? slide.featuredImage
    : isEuropaSlide
    ? "/images/europa-stadium-bg.jpg"
    : isUclSlide
    ? "/images/ucl-stadium-bg.jpg"
    : "/images/carousel-stadium-bg.jpg";

  const effectiveFeaturedImage = isCustomFeaturedImage
    ? slide.featuredImage
    : isSuperCupSlide
    ? (slide.featuredImage && slide.featuredImage !== "/images/super-cup-bg.jpg" && slide.featuredImage !== "/images/super-cup-stadium-bg.jpg" ? slide.featuredImage : null)
    : (isMotwSlide || isDerbySlide)
    ? null
    : isEuropaSlide
    ? "/images/europa-stadium-bg.jpg"
    : isUclSlide
    ? "/images/ucl-stadium-bg.jpg"
    : null;

  return (
    <motion.div
      key={slide.id || index}
      className={cn(
        "carousel-slide-card absolute will-change-transform select-none cursor-pointer bg-background border border-border shadow-2xl rounded-3xl pointer-events-auto",
        isCenter && (isSuperCupSlide ? "border-secondary/60 carousel-card-supercup" : "carousel-card-active")
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
      onClick={(e) => {
        if (!isCenter) {
          e.stopPropagation();
          onCardClick(index);
        }
      }}
    >
      {/* Dynamic Background Image */}
      <div
        className={cn(
          "absolute inset-0 overflow-hidden pointer-events-none transition-opacity duration-500",
          isSuperCupSlide ? "opacity-95" : isMotwSlide ? "opacity-90" : "opacity-30"
        )}
      >
        <img
          src={ambientBackgroundImage}
          alt=""
          aria-hidden="true"
          className={cn(
            "h-full w-full object-cover",
            isSuperCupSlide ? "object-center" : isMotwSlide ? "object-center" : ""
          )}
        />
      </div>
      <div
        className={cn(
          "absolute inset-0 pointer-events-none",
          isSuperCupSlide
            ? "bg-gradient-to-t from-background/95 via-background/60 to-background/25 sm:from-background/90 sm:via-background/40 sm:to-transparent"
            : isMotwSlide
            ? "bg-gradient-to-t from-background/90 via-background/35 to-background/20 sm:from-background/85 sm:via-background/20 sm:to-background/10"
            : "bg-gradient-to-t from-background via-background/80 to-transparent"
        )}
      />

      {/* UEFA Super Cup Ambient European Night Glow Overlay */}
      {isSuperCupSlide && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-80 sm:w-96 h-40 bg-secondary/15 rounded-full blur-3xl" />
          <div className="absolute -bottom-10 left-4 w-60 h-36 bg-primary/15 rounded-full blur-3xl" />
          <div className="absolute -bottom-10 right-4 w-60 h-36 bg-secondary/15 rounded-full blur-3xl" />
        </div>
      )}

      {/* Top Brand Accent Line */}
      <div
        className={cn(
          "h-1 w-full relative z-10",
          isSuperCupSlide
            ? "bg-gradient-to-r from-secondary via-primary to-secondary"
            : "bg-gradient-to-r from-primary via-secondary to-primary"
        )}
      />

      {/* Clickable Overlay for Preview / Inactive Cards */}
      {!isCenter && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onCardClick(index);
          }}
          onPointerDown={(e) => e.stopPropagation()}
          aria-label={`View ${slide.category}: ${slide.title}`}
          className="absolute inset-0 z-30 bg-background/40 hover:bg-background/15 backdrop-blur-sm cursor-pointer transition-all duration-300 flex items-center justify-center group/preview focus:outline-none pointer-events-auto"
        >
          <span className="opacity-0 group-hover/preview:opacity-100 transition-opacity duration-200 px-3 py-1 rounded-xl bg-card/90 border border-secondary/40 text-xs font-mono font-bold text-secondary shadow-xl pointer-events-none">
            Click to view
          </span>
        </button>
      )}

      {/* SLIDE CARD INNER CONTENT */}
      <div className="carousel-slide-body relative z-10 p-3.5 sm:p-6 md:p-8 flex-1 flex flex-col justify-between gap-3 sm:gap-4 md:px-10 lg:px-12 w-full h-full overflow-hidden">
        <div className="flex-1 flex flex-col justify-center py-1 sm:py-2">
          {/* ========================================================================= */}
          {/* 00. SUPER CUP SHOWDOWN / MATCH / ANNOUNCEMENT */}
          {/* ========================================================================= */}
          {slide.type === "SUPER_CUP" && (() => {
            const scData = slide.data || {};
            const homePlayer = scData.homePlayer || scData.uclChampion || null;
            const awayPlayer = scData.awayPlayer || scData.europaChampion || null;
            const matchStatus = scData.matchStatus || (scData.status === "FINISHED" ? "FINISHED" : scData.status === "LIVE" ? "LIVE" : "SCHEDULED");
            const isFinished = matchStatus === "FINISHED" || scData.status === "FINISHED";
            const isLive = matchStatus === "LIVE" || scData.status === "LIVE";
            const homeScore = scData.homeScore ?? scData.match?.homeScore ?? null;
            const awayScore = scData.awayScore ?? scData.match?.awayScore ?? null;
            const winnerPlayer = scData.winner || (isFinished && homeScore !== null && awayScore !== null ? (homeScore > awayScore ? homePlayer : awayScore > homeScore ? awayPlayer : null) : null);
            const isHomeWinner = Boolean(winnerPlayer && homePlayer && ((winnerPlayer.id && winnerPlayer.id === homePlayer.id) || (winnerPlayer.gamerTag && winnerPlayer.gamerTag === homePlayer.gamerTag)));
            const isAwayWinner = Boolean(winnerPlayer && awayPlayer && ((winnerPlayer.id && winnerPlayer.id === awayPlayer.id) || (winnerPlayer.gamerTag && winnerPlayer.gamerTag === awayPlayer.gamerTag)));
            const pollStats = scData.pollStats || { totalVotes: 0, f1Votes: 0, f2Votes: 0, f1Pct: 50, f2Pct: 50 };
            const formattedKickoff = scData.formattedKickoffFull || (scData.formattedKickoffDate && scData.formattedKickoffTime ? `${scData.formattedKickoffDate} • ${scData.formattedKickoffTime} (CAT)` : null);
            const hasContenders = Boolean(homePlayer && awayPlayer);

            const homeTeam = homePlayer?.realTeam ? findTeam(homePlayer.realTeam) : null;
            const awayTeam = awayPlayer?.realTeam ? findTeam(awayPlayer.realTeam) : null;

            return (
              <div className="w-full flex-1 flex flex-col justify-between my-auto py-1 sm:py-2 gap-2 sm:gap-3 h-full">
                {/* TOP HEADER ROW: Badges & Kickoff / Status Indicator */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-1.5 shrink-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-secondary/15 border border-secondary/40 text-secondary font-mono text-xs font-bold uppercase tracking-wider">
                      <Trophy className="h-3.5 w-3.5 text-secondary" />
                      <span>{slide.badge || "UEFA Super Cup"}</span>
                    </span>

                    <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-card/80 border border-border text-foreground font-mono text-xs font-semibold">
                      <Sparkles className="h-3 w-3 text-secondary" />
                      <span>Season 10 Opener</span>
                    </span>

                    {isFinished ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-secondary/20 border border-secondary/40 text-secondary font-mono text-xs font-bold">
                        <Crown className="h-3.5 w-3.5 text-secondary" />
                        <span>Trophy Lifted</span>
                      </span>
                    ) : isLive ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-destructive/20 border border-destructive/50 text-destructive font-mono text-xs font-black animate-pulse">
                        <span className="h-2 w-2 rounded-full bg-destructive" />
                        <span>LIVE FINAL SHOWDOWN</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-card/80 border border-border text-foreground font-mono text-xs font-medium">
                        <span>Single-Match Final</span>
                      </span>
                    )}
                  </div>

                  {formattedKickoff && !isFinished && (
                    <span className="text-xs font-mono text-muted-foreground flex items-center gap-1.5 font-medium">
                      <Calendar className="h-3.5 w-3.5 text-secondary shrink-0" />
                      <span>{formattedKickoff}</span>
                    </span>
                  )}
                </div>

                {/* SHOWDOWN HEADLINE */}
                {hasContenders && (
                  <div className="space-y-0.5 text-left sm:text-center shrink-0">
                    <h2 className="text-sm sm:text-lg md:text-xl font-black text-foreground uppercase tracking-tight leading-tight drop-shadow-sm">
                      {isFinished && winnerPlayer
                        ? `🏆 ${winnerPlayer.gamerTag} Wins The UEFA Super Cup!`
                        : isLive
                        ? `LIVE: ${homePlayer.gamerTag} vs ${awayPlayer.gamerTag} • UEFA Super Cup`
                        : `Clash of Champions: ${homePlayer.gamerTag} vs ${awayPlayer.gamerTag}`}
                    </h2>
                    <p className="text-xs text-muted-foreground font-medium line-clamp-1 hidden sm:block">
                      {isFinished
                        ? "Continental supremacy decided. The season opens with a championship performance."
                        : `Champions League Winner @${homePlayer.gamerTag} takes on Europa League Winner @${awayPlayer.gamerTag} for continental glory.`}
                    </p>
                  </div>
                )}

                {/* MAIN CONTENT: Esports Head-to-Head Arena */}
                {hasContenders ? (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-2 sm:gap-4 items-center flex-1 my-auto">
                    {/* LEFT: UCL Winner Contender */}
                    <div
                      className={cn(
                        "rounded-2xl p-2.5 sm:p-3 md:p-3.5 bg-card/90 backdrop-blur-xl border transition-all flex md:flex-col items-center justify-between md:justify-center gap-2 sm:gap-2.5 text-left md:text-center shadow-lg relative overflow-hidden md:col-span-4",
                        isHomeWinner ? "border-secondary/70 supercup-glow" : "border-primary/40 hover:border-primary/60"
                      )}
                    >
                      <div className="w-full flex items-center justify-between md:justify-center gap-1.5">
                        <span className="inline-flex items-center gap-1 text-xs font-mono font-black text-primary uppercase tracking-wide px-2 py-0.5 rounded-md bg-primary/15 border border-primary/30">
                          <Crown className="h-3 w-3 text-primary shrink-0" />
                          <span>UCL Winner</span>
                        </span>
                        {isHomeWinner && (
                          <span className="inline-flex items-center gap-0.5 text-xs font-mono font-black text-secondary uppercase px-1.5 py-0.5 rounded bg-secondary/20 border border-secondary/40">
                            CHAMPION
                          </span>
                        )}
                      </div>

                      <div className="relative my-0.5 sm:my-1 shrink-0">
                        <div
                          className={cn(
                            "h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 rounded-2xl bg-background/95 border flex items-center justify-center overflow-hidden shadow-xl p-1",
                            isHomeWinner ? "border-secondary ring-2 ring-secondary/50" : "border-primary/50"
                          )}
                        >
                          <img
                            src={resolvePlayerAvatar(homePlayer)}
                            alt={homePlayer.gamerTag}
                            className="h-full w-full object-contain aspect-square"
                            loading="lazy"
                          />
                        </div>
                        {homeTeam?.logo && (
                          <div className="absolute -bottom-1 -right-1 h-6 w-6 sm:h-7 sm:w-7 rounded-full bg-background border border-border p-0.5 shadow-md flex items-center justify-center">
                            <img
                              src={homeTeam.logo}
                              alt={homeTeam.name}
                              className="h-full w-full object-contain"
                              loading="lazy"
                            />
                          </div>
                        )}
                        {isHomeWinner && (
                          <Crown className="h-5 w-5 sm:h-6 sm:w-6 text-secondary absolute -top-2.5 -right-2.5 animate-bounce drop-shadow" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1 md:flex-initial">
                        <span className="text-xs sm:text-sm md:text-base font-black text-foreground block truncate">
                          @{homePlayer.gamerTag}
                        </span>
                        <span className="text-xs text-muted-foreground font-semibold block truncate">
                          {homeTeam?.name || homePlayer.realTeam || "Champions League Winner"}
                        </span>
                      </div>

                      {(isLive || isFinished) && (
                        <div className="md:mt-0.5 px-3 py-0.5 sm:py-1 rounded-xl bg-background border border-border text-base sm:text-xl font-mono font-black text-foreground shadow-inner">
                          {homeScore ?? 0}
                        </div>
                      )}
                    </div>

                    {/* CENTER: 3D UEFA Super Cup Trophy & Match State */}
                    <div className="flex flex-col items-center justify-center text-center gap-1 sm:gap-1.5 py-0.5 md:col-span-4">
                      <div className="relative h-14 w-14 sm:h-18 sm:w-18 md:h-22 md:w-22 flex items-center justify-center">
                        <div className="absolute inset-0 rounded-full bg-secondary/20 blur-xl pointer-events-none" />
                        <img
                          src="/assets/trophies/super-cup.png"
                          alt="UEFA Super Cup Trophy"
                          className="h-full w-full object-contain filter drop-shadow-xl transition-transform hover:scale-105 duration-300"
                          loading="lazy"
                        />
                      </div>

                      {isFinished ? (
                        <div className="flex flex-col items-center gap-0.5">
                          <div className="px-3 sm:px-4 py-0.5 sm:py-1 rounded-xl bg-secondary/15 border border-secondary/40 text-foreground font-mono text-sm sm:text-lg font-black tracking-widest shadow-inner">
                            {homeScore ?? 0} - {awayScore ?? 0}
                          </div>
                          <span className="text-xs font-mono uppercase font-bold text-secondary tracking-widest">
                            FINAL SCORE
                          </span>
                        </div>
                      ) : isLive ? (
                        <div className="flex flex-col items-center gap-0.5">
                          <div className="px-3 sm:px-4 py-0.5 sm:py-1 rounded-xl bg-destructive/20 border border-destructive/50 text-foreground font-mono text-sm sm:text-lg font-black tracking-widest shadow-inner animate-pulse">
                            {homeScore ?? 0} - {awayScore ?? 0}
                          </div>
                          <span className="text-xs font-mono uppercase font-black text-destructive tracking-widest">
                            IN PLAY
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-0.5">
                          <div className="px-3.5 py-0.5 sm:px-4 sm:py-1 rounded-xl bg-secondary/20 border border-secondary/40 font-mono text-xs sm:text-sm font-black text-secondary shadow-inner">
                            VS
                          </div>
                          <span className="text-xs font-mono uppercase font-bold text-muted-foreground tracking-widest">
                            SUPER CUP FINAL
                          </span>
                        </div>
                      )}
                    </div>

                    {/* RIGHT: Europa Winner Contender */}
                    <div
                      className={cn(
                        "rounded-2xl p-2.5 sm:p-3 md:p-3.5 bg-card/90 backdrop-blur-xl border transition-all flex md:flex-col items-center justify-between md:justify-center gap-2 sm:gap-2.5 text-left md:text-center shadow-lg relative overflow-hidden md:col-span-4",
                        isAwayWinner ? "border-secondary/70 supercup-glow" : "border-secondary/40 hover:border-secondary/60"
                      )}
                    >
                      <div className="w-full flex items-center justify-between md:justify-center gap-1.5">
                        <span className="inline-flex items-center gap-1 text-xs font-mono font-black text-secondary uppercase tracking-wide px-2 py-0.5 rounded-md bg-secondary/15 border border-secondary/30">
                          <Award className="h-3 w-3 text-secondary shrink-0" />
                          <span>Europa Winner</span>
                        </span>
                        {isAwayWinner && (
                          <span className="inline-flex items-center gap-0.5 text-xs font-mono font-black text-secondary uppercase px-1.5 py-0.5 rounded bg-secondary/20 border border-secondary/40">
                            CHAMPION
                          </span>
                        )}
                      </div>

                      <div className="relative my-0.5 sm:my-1 shrink-0">
                        <div
                          className={cn(
                            "h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 rounded-2xl bg-background/95 border flex items-center justify-center overflow-hidden shadow-xl p-1",
                            isAwayWinner ? "border-secondary ring-2 ring-secondary/50" : "border-secondary/50"
                          )}
                        >
                          <img
                            src={resolvePlayerAvatar(awayPlayer)}
                            alt={awayPlayer.gamerTag}
                            className="h-full w-full object-contain aspect-square"
                            loading="lazy"
                          />
                        </div>
                        {awayTeam?.logo && (
                          <div className="absolute -bottom-1 -right-1 h-6 w-6 sm:h-7 sm:w-7 rounded-full bg-background border border-border p-0.5 shadow-md flex items-center justify-center">
                            <img
                              src={awayTeam.logo}
                              alt={awayTeam.name}
                              className="h-full w-full object-contain"
                              loading="lazy"
                            />
                          </div>
                        )}
                        {isAwayWinner && (
                          <Crown className="h-5 w-5 sm:h-6 sm:w-6 text-secondary absolute -top-2.5 -right-2.5 animate-bounce drop-shadow" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1 md:flex-initial">
                        <span className="text-xs sm:text-sm md:text-base font-black text-foreground block truncate">
                          @{awayPlayer.gamerTag}
                        </span>
                        <span className="text-xs text-muted-foreground font-semibold block truncate">
                          {awayTeam?.name || awayPlayer.realTeam || "Europa League Winner"}
                        </span>
                      </div>

                      {(isLive || isFinished) && (
                        <div className="md:mt-0.5 px-3 py-0.5 sm:py-1 rounded-xl bg-background border border-border text-base sm:text-xl font-mono font-black text-foreground shadow-inner">
                          {awayScore ?? 0}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Fallback when participants await confirmation */
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-card/85 backdrop-blur-xl border border-secondary/35 shadow-xl flex-1 my-auto">
                    <div className="space-y-2 text-left max-w-xl">
                      <h3 className="text-lg sm:text-2xl font-black text-foreground drop-shadow-sm">
                        {slide.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-foreground/85 leading-relaxed">
                        {slide.subtitle || slide.description}
                      </p>
                    </div>
                    <div className="relative h-20 w-20 sm:h-24 sm:w-24 shrink-0 flex items-center justify-center">
                      <div className="absolute inset-0 rounded-full bg-secondary/20 blur-xl pointer-events-none" />
                      <img
                        src="/assets/trophies/super-cup.png"
                        alt="Super Cup Trophy"
                        className="h-full w-full object-contain filter drop-shadow-xl"
                        loading="lazy"
                      />
                    </div>
                  </div>
                )}

                {/* BOTTOM FOOTER: Interactive Prediction Poll + CTA Button */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-3 pt-1 border-t border-border/40 shrink-0">
                  {hasContenders ? (
                    <SuperCupCarouselPrediction
                      homePlayer={homePlayer}
                      awayPlayer={awayPlayer}
                      initialPollStats={pollStats}
                      isFinished={isFinished}
                      winnerPlayer={winnerPlayer}
                    />
                  ) : (
                    <div className="text-xs text-muted-foreground font-mono">
                      Mandatory Qualification: UCL Winner vs Europa League Winner
                    </div>
                  )}

                  {slide.buttonText && slide.buttonUrl && (
                    <Link
                      href={slide.buttonUrl}
                      tabIndex={isCenter ? 0 : -1}
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                      className={cn(
                        buttonVariants({ variant: "yellow", size: "default" }),
                        "carousel-cta-btn font-black text-secondary-foreground text-xs sm:text-sm gap-2 rounded-xl shadow-lg cursor-pointer pointer-events-auto inline-flex items-center shrink-0 w-full sm:w-auto justify-center"
                      )}
                    >
                      <span>{slide.buttonText}</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })()}

          {/* ========================================================================= */}
          {/* 0A. MATCH OF THE WEEK (MOTW) & OFFICIAL DERBY HEAD-TO-HEAD SHOWCASE */}
          {/* ========================================================================= */}
          {(slide.type === "MOTW" || slide.type === "DERBY") && slide.data && (
            <div className="w-full flex-1 flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-6 my-auto">
              <div className="space-y-2.5 sm:space-y-3 text-left max-w-md lg:max-w-lg w-full p-3.5 sm:p-5 rounded-2xl bg-card/85 backdrop-blur-xl border border-secondary/30 shadow-xl">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono text-secondary font-bold uppercase tracking-wider flex items-center gap-1.5">
                    {slide.type === "DERBY" ? <Flame className="h-3.5 w-3.5 text-secondary" /> : <Sparkles className="h-3.5 w-3.5 text-secondary" />}
                    <span>{slide.type === "DERBY" ? (slide.data.derbyName || "Official Derby") : "Match of the Week"}</span>
                  </span>
                  <span className="text-xs font-mono text-muted-foreground font-semibold">
                    • {slide.data.division} • {slide.data.round}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5 text-secondary shrink-0" />
                  <span className="text-foreground font-semibold">
                    Kickoff: {slide.data.formattedKickoffFull || "Official Schedule"}
                  </span>
                </div>

                <h2 className="carousel-headline font-black text-foreground drop-shadow-sm">
                  {slide.title}
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

              {/* Head-to-Head Card with resolved player avatars & clubs */}
              <div className="w-full md:w-auto flex items-center justify-center gap-3 sm:gap-6 p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-card/85 backdrop-blur-xl border border-secondary/40 shadow-xl shrink-0">
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
                    <span className="text-xs text-muted-foreground font-semibold block truncate max-w-20 sm:max-w-28">
                      {findTeam(slide.data.homePlayer?.realTeam)?.shortName || slide.data.homePlayer?.realTeam || "HOME"}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-0.5 sm:gap-1">
                  <div className="px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-lg sm:rounded-xl bg-secondary/20 border border-secondary/40 font-mono text-xs sm:text-sm font-black text-secondary shadow-inner">
                    VS
                  </div>
                  <span className="text-xs font-mono text-secondary font-bold">
                    {slide.type === "DERBY" ? "DERBY" : "MOTW"}
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
                    <span className="text-xs text-muted-foreground font-semibold block truncate max-w-20 sm:max-w-28">
                      {findTeam(slide.data.awayPlayer?.realTeam)?.shortName || slide.data.awayPlayer?.realTeam || "AWAY"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 0B. PUBLISHED LEAGUE TABLE CAROUSEL SLIDE (WITH FULL COMPONENTS) */}
          {/* ========================================================================= */}
          {slide.type === "LEAGUE_TABLE" && slide.data && (
            <div className="w-full space-y-2.5 sm:space-y-3.5 my-auto">
              {/* Header Row: Title, In-Form Leader Highlight, and CTA */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 text-left">
                <div className="space-y-0.5 sm:space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono text-secondary font-bold flex items-center gap-1.5 uppercase">
                      <Trophy className="h-3.5 w-3.5 text-secondary" />
                      <span>{slide.data.division} Standings</span>
                    </span>
                    {slide.data.inFormLeaderPlayer && (
                      <span className="inline-flex items-center gap-1 text-xs font-mono text-secondary font-bold px-2 py-0.5 rounded-lg bg-secondary/15 border border-secondary/35">
                        <Flame className="h-3 w-3 text-secondary" />
                        <span>In-Form Leader: {slide.data.inFormLeaderPlayer.gamerTag}</span>
                      </span>
                    )}
                  </div>
                  <h2 className="carousel-headline font-black text-foreground drop-shadow-sm truncate">
                    {slide.title}
                  </h2>
                </div>

                {slide.buttonText && slide.buttonUrl && (
                  <Link
                    href={slide.buttonUrl}
                    tabIndex={isCenter ? 0 : -1}
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    className={cn(
                      buttonVariants({ variant: "yellow", size: "sm" }),
                      "carousel-cta-btn font-bold text-secondary-foreground text-xs gap-1.5 shrink-0 rounded-xl cursor-pointer pointer-events-auto inline-flex items-center shadow-md self-start sm:self-auto"
                    )}
                  >
                    <span>{slide.buttonText}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                )}
              </div>

              {/* Responsive High-Impact League Table */}
              <div className="w-full rounded-2xl border border-border/80 bg-card/80 backdrop-blur-md overflow-hidden shadow-lg">
                <div className="w-full overflow-x-auto no-scrollbar">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-background/80 text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground border-b border-border/60">
                        <th className="py-2 px-2.5 sm:px-3 text-center w-12 sm:w-16">Pos</th>
                        <th className="py-2 px-2.5 sm:px-3">Athlete</th>
                        <th className="py-2 px-1.5 sm:px-2 text-center">MP</th>
                        <th className="py-2 px-1.5 sm:px-2 text-center text-primary font-bold">W</th>
                        <th className="py-2 px-1.5 sm:px-2 text-center text-muted-foreground hidden sm:table-cell">D</th>
                        <th className="py-2 px-1.5 sm:px-2 text-center text-destructive hidden sm:table-cell">L</th>
                        <th className="py-2 px-1.5 sm:px-2 text-center font-bold">GD</th>
                        <th className="py-2 px-2 text-center font-black text-secondary">Pts</th>
                        <th className="py-2 px-2 sm:px-3 text-center hidden md:table-cell">Form</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40 font-mono">
                      {slide.data.standings?.map((row: any) => {
                        const isTop = row.isTopForm;
                        const clubObj = row.club ? findTeam(row.club) : null;
                        const forms = Array.isArray(row.form) ? row.form : ["D"];

                        return (
                          <tr
                            key={row.id || row.rank}
                            className={cn(
                              "transition-colors",
                              isTop
                                ? "bg-secondary/10 hover:bg-secondary/15"
                                : "hover:bg-muted/40"
                            )}
                          >
                            {/* 1. Rank & Movement Indicator */}
                            <td className="py-2 px-2.5 sm:px-3 text-center align-middle whitespace-nowrap">
                              <div className="flex items-center justify-center gap-1">
                                <span
                                  className={cn(
                                    "inline-flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-md text-xs font-black",
                                    row.rank === 1
                                      ? "bg-secondary/20 text-secondary border border-secondary/40 font-black"
                                      : row.rank <= 3
                                      ? "bg-primary/20 text-primary border border-primary/30"
                                      : "bg-muted/50 text-muted-foreground border border-border/50"
                                  )}
                                >
                                  {row.rank}
                                </span>

                                {/* Movement Indicator: ArrowUp, ArrowDown, or Minus */}
                                <span className="inline-flex items-center justify-center min-w-4 text-xs">
                                  {row.movement === "UP" ? (
                                    <span
                                      className="inline-flex items-center text-primary font-black gap-0.5"
                                      title={`Gained ${row.delta} spots`}
                                    >
                                      <ArrowUp className="h-3 w-3" strokeWidth={2.5} />
                                      {row.delta > 0 && (
                                        <span className="text-xs font-mono leading-none hidden sm:inline">
                                          {row.delta}
                                        </span>
                                      )}
                                    </span>
                                  ) : row.movement === "DOWN" ? (
                                    <span
                                      className="inline-flex items-center text-destructive font-black gap-0.5"
                                      title={`Lost ${row.delta} spots`}
                                    >
                                      <ArrowDown className="h-3 w-3" strokeWidth={2.5} />
                                      {row.delta > 0 && (
                                        <span className="text-xs font-mono leading-none hidden sm:inline">
                                          {row.delta}
                                        </span>
                                      )}
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground font-bold" title="Unchanged position">
                                      <Minus className="h-3 w-3" strokeWidth={2.5} />
                                    </span>
                                  )}
                                </span>
                              </div>
                            </td>

                            {/* 2. Athlete GamerTag, Club & Avatar (with In-Form Leader indicator if applicable) */}
                            <td className="py-2 px-2.5 sm:px-3 align-middle font-sans">
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-lg overflow-hidden bg-background/90 border border-border/80 flex items-center justify-center shrink-0 shadow-sm">
                                  {row.avatar ? (
                                    <img
                                      src={row.avatar}
                                      alt={row.gamerTag}
                                      className="h-full w-full object-contain aspect-square"
                                      loading="lazy"
                                    />
                                  ) : (
                                    <span className="text-xs font-black text-primary font-mono">
                                      {(row.gamerTag || "PL").substring(0, 2).toUpperCase()}
                                    </span>
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-black text-foreground text-xs sm:text-sm truncate">
                                      {row.gamerTag}
                                    </span>
                                    {isTop && (
                                      <span
                                        className="inline-flex items-center gap-0.5 text-xs font-mono font-bold text-secondary px-1.5 py-0 rounded bg-secondary/20 border border-secondary/40 shrink-0"
                                        title="Best Current Form / Win Streak"
                                      >
                                        <Flame className="h-2.5 w-2.5 text-secondary" />
                                        <span>Form Leader</span>
                                      </span>
                                    )}
                                  </div>
                                  {row.club && (
                                    <span className="text-xs text-muted-foreground truncate block">
                                      {clubObj?.shortName || row.club}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Core Statistics: MP, W, D, L, GD, Pts */}
                            <td className="py-2 px-1.5 sm:px-2 text-center align-middle font-mono font-medium text-foreground">
                              {row.played}
                            </td>
                            <td className="py-2 px-1.5 sm:px-2 text-center align-middle font-mono font-bold text-primary">
                              {row.won}
                            </td>
                            <td className="py-2 px-1.5 sm:px-2 text-center align-middle font-mono text-muted-foreground hidden sm:table-cell">
                              {row.drawn}
                            </td>
                            <td className="py-2 px-1.5 sm:px-2 text-center align-middle font-mono text-destructive hidden sm:table-cell">
                              {row.lost}
                            </td>
                            <td className="py-2 px-1.5 sm:px-2 text-center align-middle font-mono font-semibold text-foreground">
                              {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                            </td>
                            <td className="py-2 px-2 text-center align-middle font-mono font-black text-xs sm:text-sm text-secondary">
                              {row.points}
                            </td>

                            {/* Form Badges/Pills (W / D / L) */}
                            <td className="py-2 px-2 sm:px-3 text-center align-middle hidden md:table-cell">
                              <div className="flex items-center justify-center gap-1 font-mono">
                                {forms.map((f: string, i: number) => (
                                  <span
                                    key={i}
                                    className={cn(
                                      "inline-flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded text-xs font-bold",
                                      f === "W"
                                        ? "bg-primary/20 text-primary border border-primary/30"
                                        : f === "D"
                                        ? "bg-secondary/20 text-secondary border border-secondary/30"
                                        : "bg-destructive/20 text-destructive border border-destructive/30"
                                    )}
                                  >
                                    {f}
                                  </span>
                                ))}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 1. MATCH OF THE DAY AUTOMATED SYSTEM SHOWDOWN */}
          {/* ========================================================================= */}
          {slide.type === "MOTD" && slide.data && (
            <div className="w-full flex-1 flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-6 my-auto">
              <div className="space-y-2.5 sm:space-y-3 text-left max-w-xl w-full">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-muted-foreground font-semibold">
                    {[
                      "Match of the Day",
                      slide.data.division,
                      slide.data.round
                    ]
                      .filter(Boolean)
                      .join(" • ")}
                  </span>
                </div>

                <h2 className="carousel-headline font-black text-foreground drop-shadow-sm">
                  {slide.data.homePlayer?.gamerTag && slide.data.awayPlayer?.gamerTag ? (
                    <>
                      {slide.data.homePlayer.gamerTag}{" "}
                      <span className="text-secondary">vs</span>{" "}
                      {slide.data.awayPlayer.gamerTag}
                    </>
                  ) : (
                    slide.title || "Match of the Day"
                  )}
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
              <div className="w-full md:w-auto flex items-center justify-center gap-3 sm:gap-6 p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-card/85 backdrop-blur-xl border border-secondary/30 shadow-xl shrink-0">
                <div className="flex flex-col items-center gap-1.5 sm:gap-2 text-center min-w-16 sm:min-w-24">
                  <div className="h-11 w-11 sm:h-14 sm:w-14 md:h-16 md:w-16 rounded-xl sm:rounded-2xl bg-background/90 border border-primary/40 flex items-center justify-center overflow-hidden shrink-0 shadow-md">
                    <img
                      src={resolvePlayerAvatar(slide.data.homePlayer)}
                      alt={slide.data.homePlayer?.gamerTag || "Home Player"}
                      className="h-full w-full object-contain aspect-square"
                      loading="lazy"
                    />
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-black text-foreground block truncate max-w-20 sm:max-w-28">
                      {slide.data.homePlayer?.gamerTag || "HOME"}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono font-bold block truncate max-w-20 sm:max-w-28">
                      {findTeam(slide.data.homePlayer?.realTeam)?.shortName || slide.data.homePlayer?.realTeam || "HOME"}
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
                      alt={slide.data.awayPlayer?.gamerTag || "Away Player"}
                      className="h-full w-full object-contain aspect-square"
                      loading="lazy"
                    />
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-black text-foreground block truncate max-w-20 sm:max-w-28">
                      {slide.data.awayPlayer?.gamerTag || "AWAY"}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono font-bold block truncate max-w-20 sm:max-w-28">
                      {findTeam(slide.data.awayPlayer?.realTeam)?.shortName || slide.data.awayPlayer?.realTeam || "AWAY"}
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
            <div className="w-full flex-1 flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-6 my-auto">
              <div className="space-y-2.5 sm:space-y-3 text-left max-w-xl w-full">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-muted-foreground font-semibold">
                    {[
                      "Final Result",
                      slide.data.division,
                      slide.data.round
                    ]
                      .filter(Boolean)
                      .join(" • ")}
                  </span>
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
              <div className="w-full md:w-auto flex items-center justify-center gap-3 sm:gap-6 p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-card/85 backdrop-blur-xl border border-border shadow-xl font-mono shrink-0">
                <div className="text-right min-w-16 sm:min-w-24">
                  <span className="text-xs sm:text-sm font-black text-foreground block truncate max-w-20 sm:max-w-28">
                    {slide.data.homePlayer?.gamerTag || "HOME"}
                  </span>
                  <span className="text-xs text-muted-foreground font-bold block truncate max-w-20 sm:max-w-28">
                    {findTeam(slide.data.homePlayer?.realTeam)?.shortName || slide.data.homePlayer?.realTeam || "HOME"}
                  </span>
                </div>

                <div className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl sm:rounded-2xl bg-background/90 border border-border text-base sm:text-2xl font-black text-secondary tracking-widest shadow-inner">
                  {slide.data.homeScore ?? 0} : {slide.data.awayScore ?? 0}
                </div>

                <div className="text-left min-w-16 sm:min-w-24">
                  <span className="text-xs sm:text-sm font-black text-foreground block truncate max-w-20 sm:max-w-28">
                    {slide.data.awayPlayer?.gamerTag || "AWAY"}
                  </span>
                  <span className="text-xs text-muted-foreground font-bold block truncate max-w-20 sm:max-w-28">
                    {findTeam(slide.data.awayPlayer?.realTeam)?.shortName || slide.data.awayPlayer?.realTeam || "AWAY"}
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
                      <span className="text-xs font-mono font-bold text-secondary px-1.5 py-0">
                        #{ath.rank}
                      </span>
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
                      <span className="text-xs font-mono font-bold text-secondary px-1.5 py-0">
                        {champ.season}
                      </span>
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
            <div className="w-full flex-1 flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-6 my-auto">
              <div className="space-y-2.5 sm:space-y-3 text-left max-w-xl w-full">
                <span className="text-xs font-mono text-secondary font-bold flex items-center gap-1.5 uppercase">
                  <ShieldCheck className="h-3.5 w-3.5 text-secondary" />
                  <span>OFFICIAL ATHLETE ENROLLMENT</span>
                </span>
                <h2 className="carousel-headline font-black text-foreground drop-shadow-sm">
                  {slide.title}
                </h2>
                <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed line-clamp-4 sm:line-clamp-3">
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
            <div className="w-full flex-1 flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-6 my-auto">
              {/* Left Column: Text & CTA */}
              <div className="space-y-2.5 sm:space-y-3.5 text-left max-w-xl flex-1 w-full">
                <div className="flex items-center gap-2 flex-wrap">
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
              <div className="w-full md:w-auto shrink-0 flex items-center justify-center">
                {/* 1. LEAGUE START SHOWCASE */}
                {slide.data?.subType === "LEAGUE_START" && (
                  <div className="w-full sm:w-auto min-w-0 max-w-full sm:min-w-64 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-card/85 backdrop-blur-xl border border-secondary/35 shadow-xl space-y-2.5 sm:space-y-3">
                    <div className="flex items-center justify-between border-b border-border/70 pb-2">
                      <span className="text-xs font-mono font-bold text-secondary uppercase flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-secondary" />
                        <span>Official Kickoff (CAT)</span>
                      </span>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-xs text-muted-foreground font-mono font-semibold block">
                        Kickoff Date &amp; Time:
                      </span>
                      <span className="text-xs sm:text-sm font-black text-foreground block">
                        {slide.data?.formattedKickoffFull || slide.data?.formattedKickoffDate || "Confirmed by Admin"}
                      </span>
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
                    </div>

                    <div className="space-y-1.5 sm:space-y-2 text-xs font-mono">
                      <div className="flex items-center justify-between p-2 rounded-lg sm:rounded-xl bg-background/70 border border-secondary/30 gap-2">
                        <span className="font-bold text-foreground flex items-center gap-1.5 truncate">
                          <Crown className="h-3.5 w-3.5 text-secondary shrink-0" />
                          <span>UCL</span>
                        </span>
                        <span className="text-xs font-mono font-bold text-secondary px-1.5 py-0 shrink-0">
                          {slide.data?.uclStageLabel || "Quarter-Finals"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-2 rounded-lg sm:rounded-xl bg-background/70 border border-primary/30 gap-2">
                        <span className="font-bold text-foreground flex items-center gap-1.5 truncate">
                          <Award className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span>Europa</span>
                        </span>
                        <span className="text-xs font-mono font-bold text-primary px-1.5 py-0 shrink-0">
                          {slide.data?.europaStageLabel || "Quarter-Finals"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* DEFAULT BROADCAST NOTICE SHOWCASE / FEATURED IMAGE */}
                {!["LEAGUE_START", "DRAW_SCHEDULED", "DRAW_RESULTS", "CONTINENTAL_ADVANCE"].includes(slide.data?.subType) && (
                  effectiveFeaturedImage ? (
                    <div className="relative rounded-2xl overflow-hidden border border-border/80 bg-card/60 shadow-2xl shrink-0 max-h-48 sm:max-h-60 lg:max-h-72 max-w-full lg:max-w-md w-auto flex items-center justify-center mx-auto lg:mx-0">
                      <img
                        src={effectiveFeaturedImage}
                        alt={slide.title}
                        className="w-auto h-auto max-h-44 sm:max-h-56 lg:max-h-72 max-w-full rounded-2xl object-contain aspect-auto"
                        loading="lazy"
                      />
                    </div>
                  ) : (
                    <div className="relative rounded-2xl overflow-hidden border border-secondary/35 bg-card/75 backdrop-blur-md shadow-2xl shrink-0 p-3 sm:p-4 max-w-sm">
                      <div className="flex items-center gap-2 mb-1.5 text-xs font-mono text-secondary font-bold">
                        <Megaphone className="h-4 w-4" />
                        <span>COMMISSIONER NOTICE</span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-3 sm:line-clamp-4">
                        {slide.description}
                      </p>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 7. STANDARD NEWS ARTICLE (Admin Created or System Published) */}
          {/* ========================================================================= */}
          {(!slide.type || slide.type === "NEWS") && (
            <div className="w-full flex-1 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 sm:gap-6 my-auto">
              {/* Text & CTA */}
              <div
                className={cn(
                  "space-y-2.5 sm:space-y-3 text-left w-full",
                  effectiveFeaturedImage
                    ? "flex-1 min-w-0 max-w-xl"
                    : "max-w-2xl flex-1"
                )}
              >
                <div className="flex items-center gap-2 flex-wrap">
                  {formattedPublishDate && (
                    <span className="text-xs font-mono text-muted-foreground flex items-center gap-1 font-semibold">
                      <Calendar className="h-3 w-3" />
                      <span>{formattedPublishDate}</span>
                    </span>
                  )}
                </div>

                <h2 className="text-xl sm:text-3xl font-black text-foreground uppercase tracking-tight leading-tight drop-shadow-sm">
                  {slide.title}
                </h2>

                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed whitespace-pre-line line-clamp-3 sm:line-clamp-4">
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

              {/* Featured Image with auto ratio according to uploaded image */}
              {effectiveFeaturedImage && (
                <div className="relative rounded-2xl overflow-hidden border border-border/80 bg-card/60 shadow-2xl shrink-0 max-h-48 sm:max-h-60 lg:max-h-72 max-w-full lg:max-w-md w-auto flex items-center justify-center mx-auto lg:mx-0">
                  <img
                    src={effectiveFeaturedImage}
                    alt={slide.title}
                    className="w-auto h-auto max-h-44 sm:max-h-56 lg:max-h-72 max-w-full rounded-2xl object-contain aspect-auto"
                    loading="lazy"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* BOTTOM ROW: League Branding & Verified Bulletins */}
        <div className="flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:justify-between pt-3 border-t border-border/40 text-xs font-mono text-muted-foreground w-full mt-auto shrink-0">
          <span className="text-xs leading-snug">
            eFootball Rwanda League • Official News Bulletin
          </span>
          <span className="uppercase tracking-widest hidden sm:inline-block font-semibold text-secondary">
            Live Bulletin
          </span>
        </div>
      </div>

      {/* Dynamic progress line on bottom of active card */}
      {isCenter && totalSlides > 1 && (
        <div className="h-1 w-full bg-border/40 overflow-hidden relative z-10 shrink-0">
          <div
            key={`progress-${index}`}
            className={cn(
              "h-full bg-secondary carousel-progress-line",
              isPaused ? "carousel-progress-paused" : "carousel-progress-running"
            )}
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
  const [containerWidth, setContainerWidth] = useState(1200);

  const containerRef = useRef<HTMLDivElement>(null);
  const currentIndexRef = useRef(currentIndex);

  const totalSlides = slides.length;

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

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
    },
    [totalSlides, scrollX]
  );

  const nextSlide = useCallback(() => {
    if (totalSlides <= 1) return;
    const next = (currentIndexRef.current + 1) % totalSlides;
    jumpToIndex(next);
  }, [totalSlides, jumpToIndex]);

  const prevSlide = useCallback(() => {
    if (totalSlides <= 1) return;
    const prev = (currentIndexRef.current - 1 + totalSlides) % totalSlides;
    jumpToIndex(prev);
  }, [totalSlides, jumpToIndex]);

  // Keep motion value in sync if currentIndex changes externally
  useEffect(() => {
    if (currentIndex >= totalSlides && totalSlides > 0) {
      jumpToIndex(totalSlides - 1);
    }
  }, [totalSlides, currentIndex, jumpToIndex]);

  // Clean auto-rotation timer
  useEffect(() => {
    if (totalSlides <= 1 || isPaused || isDragging) {
      return;
    }

    const timer = setInterval(() => {
      nextSlide();
    }, ROTATION_INTERVAL_MS);

    return () => {
      clearInterval(timer);
    };
  }, [totalSlides, isPaused, isDragging, nextSlide]);

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
      const offset = info.offset.x;
      let targetIndex: number;
      // Flick detection or swipe past 50px
      if (Math.abs(velocity) > 200 || Math.abs(offset) > 50) {
        targetIndex =
          velocity < -200 || offset < -50
            ? currentIndexRef.current + 1
            : currentIndexRef.current - 1;
      } else {
        targetIndex = Math.round(scrollX.get());
      }
      const clamped = Math.min(Math.max(targetIndex, 0), totalSlides - 1);
      jumpToIndex(clamped);
    },
    [scrollX, totalSlides, jumpToIndex]
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
              onPointerDown={(e) => e.stopPropagation()}
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
              onPointerDown={(e) => e.stopPropagation()}
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
