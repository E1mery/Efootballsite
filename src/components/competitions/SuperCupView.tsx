"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Trophy,
  Crown,
  Shield,
  Calendar,
  Clock,
  Sparkles,
  Users,
  CheckCircle,
  AlertTriangle,
  History,
  Flame,
  Award,
} from "lucide-react";
import { resolvePlayerAvatar } from "@/lib/teams";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import SuperCupPredictionPoll from "./SuperCupPredictionPoll";

export interface SuperCupPlayer {
  id?: string;
  gamerTag: string;
  fullName?: string | null;
  realTeam?: string | null;
  avatar?: string | null;
}

export interface SuperCupMatchData {
  id: string;
  division: string;
  stage: string;
  round: string;
  status: string;
  matchDate: string | Date;
  deadlineDate?: string | Date;
  homeScore?: number | null;
  awayScore?: number | null;
  homePlayerId: string;
  awayPlayerId: string;
  homePlayer?: SuperCupPlayer | null;
  awayPlayer?: SuperCupPlayer | null;
  screenshotUrl?: string | null;
  notes?: string | null;
}

export interface SuperCupViewProps {
  season?: string;
  currentPlayer?: any;
  uclChampion?: SuperCupPlayer | null;
  europaChampion?: SuperCupPlayer | null;
  superCupMatch?: SuperCupMatchData | null;
  pastSuperCupWinners?: any[];
  onOpenSubmitResult?: (match: any) => void;
}

export default function SuperCupView({
  season = "Season 1 (2026)",
  currentPlayer,
  uclChampion,
  europaChampion,
  superCupMatch,
  pastSuperCupWinners = [],
  onOpenSubmitResult,
}: SuperCupViewProps) {
  const [activeTab, setActiveTab] = useState<"SHOWDOWN" | "OVERVIEW" | "HISTORY">("SHOWDOWN");

  // Countdown timer calculation if scheduled match date is in future
  const [countdown, setCountdown] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isDue: boolean;
  } | null>(null);

  useEffect(() => {
    if (!superCupMatch?.matchDate || superCupMatch.status === "FINISHED") {
      setCountdown(null);
      return;
    }

    const targetTime = new Date(superCupMatch.matchDate).getTime();

    const updateTimer = () => {
      const diff = targetTime - Date.now();
      if (diff <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0, isDue: true });
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setCountdown({ days, hours, minutes, seconds, isDue: false });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [superCupMatch?.matchDate, superCupMatch?.status]);

  const bothFinalistsConfirmed = Boolean(uclChampion && europaChampion);
  const isMatchFinished = superCupMatch?.status === "FINISHED";
  const isMatchLive = superCupMatch?.status === "LIVE";

  // Determine Super Cup winner if match is finished
  let superCupWinner: SuperCupPlayer | null = null;
  if (isMatchFinished && superCupMatch) {
    const h = superCupMatch.homeScore ?? 0;
    const a = superCupMatch.awayScore ?? 0;
    if (h > a) superCupWinner = superCupMatch.homePlayer || null;
    else if (a > h) superCupWinner = superCupMatch.awayPlayer || null;
  }

  // Check if current user is participating
  const isCurrentUserInSuperCup =
    currentPlayer &&
    superCupMatch &&
    (superCupMatch.homePlayerId === currentPlayer.id || superCupMatch.awayPlayerId === currentPlayer.id);

  return (
    <div className="space-y-6">
      {/* Top Banner with Official UEFA Super Cup Visual Identity */}
      <div className="relative overflow-hidden rounded-3xl border border-secondary/50 supercup-theme-bg p-6 sm:p-8 shadow-2xl">
        {/* Atmosphere Vignette Overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-25">
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-transparent" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-black uppercase text-secondary tracking-wider">
                UEFA Competition Center • {season}
              </span>
              <Badge variant={bothFinalistsConfirmed ? "secondary" : "destructive"} className="text-xs">
                {isMatchFinished
                  ? "SUPER CUP CONCLUDED"
                  : bothFinalistsConfirmed
                  ? "FINALISTS LOCKED"
                  : "AWAITING CHAMPIONS"}
              </Badge>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-foreground">
              UEFA Super Cup
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The supreme clash of champions. Contested exclusively between the official
              winner of the UEFA Champions League and the official winner of the UEFA Europa
              League from the same season. Single-match showdown for the ultimate continental supremacy.
            </p>

            {/* Mandatory Qualification Rule Badge */}
            <div className="pt-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-secondary/40 bg-secondary/10 text-secondary text-xs font-bold">
                <Crown className="h-4 w-4" />
                <span>Mandatory Rule: UCL Winner vs Europa League Winner</span>
              </div>
            </div>
          </div>

          {/* Super Cup Trophy Visual */}
          <div className="relative shrink-0 mx-auto md:mx-0">
            <div className="h-32 w-32 sm:h-40 sm:w-40 relative flex items-center justify-center p-2 rounded-3xl supercup-glow bg-card/70 border border-secondary/50 backdrop-blur-md">
              <Image
                src="/assets/trophies/super-cup.png"
                alt="eFootball UEFA Super Cup Trophy"
                fill
                className="object-contain p-2 filter drop-shadow-xl transition-transform hover:scale-105"
                sizes="(max-width: 640px) 128px, 160px"
                priority
              />
            </div>
            <span className="text-xs font-black uppercase tracking-wider text-muted-foreground block text-center mt-2">
              The Super Cup Trophy
            </span>
          </div>
        </div>

        {/* User match reminder if participant and scheduled */}
        {isCurrentUserInSuperCup && !isMatchFinished && onOpenSubmitResult && (
          <div className="mt-6 pt-4 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-secondary shrink-0" />
              <p className="text-xs text-foreground font-semibold">
                You are a Super Cup Finalist! Upload your official match result proof after kickoff.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => onOpenSubmitResult(superCupMatch)}
              className="text-xs font-bold bg-secondary text-secondary-foreground hover:bg-secondary/90"
            >
              Submit Super Cup Score
            </Button>
          </div>
        )}
      </div>

      {/* Internal Navigation Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth p-1.5 rounded-2xl bg-card border border-border">
        <Button
          variant={activeTab === "SHOWDOWN" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("SHOWDOWN")}
          className="text-xs font-bold gap-1 shrink-0 whitespace-nowrap"
        >
          <Trophy className="h-3.5 w-3.5 text-secondary" /> Final Showdown
        </Button>
        <Button
          variant={activeTab === "OVERVIEW" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("OVERVIEW")}
          className="text-xs font-bold gap-1 shrink-0 whitespace-nowrap"
        >
          <Crown className="h-3.5 w-3.5" /> Competition Overview
        </Button>
        <Button
          variant={activeTab === "HISTORY" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("HISTORY")}
          className="text-xs font-bold gap-1 shrink-0 whitespace-nowrap"
        >
          <History className="h-3.5 w-3.5" /> Historical Winners
        </Button>
      </div>

      {/* =================================================================== */}
      {/* TAB 1: FINAL SHOWDOWN */}
      {/* =================================================================== */}
      {activeTab === "SHOWDOWN" && (
        <div className="space-y-6">
          {/* Winner Showcase Banner (if finished) */}
          {superCupWinner && (
            <div className="rounded-3xl border border-secondary bg-secondary/10 supercup-glow p-6 text-center flex flex-col sm:flex-row items-center justify-center gap-6">
              <div className="relative">
                <div className="h-20 w-20 rounded-2xl bg-card border border-border p-1.5 flex items-center justify-center overflow-hidden shadow-xl">
                  <img
                    src={resolvePlayerAvatar(superCupWinner)}
                    alt={superCupWinner.gamerTag}
                    className="h-full w-full object-contain"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(superCupWinner?.gamerTag || "player")}`;
                    }}
                  />
                </div>
                <Crown className="h-6 w-6 text-secondary absolute -top-2.5 -right-2.5 animate-bounce" />
              </div>
              <div className="text-center sm:text-left space-y-0.5">
                <span className="text-xs font-black uppercase tracking-widest text-secondary block">
                  Official UEFA Super Cup Champion
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-foreground">
                  {superCupWinner.gamerTag}
                </h3>
                {superCupWinner.fullName && (
                  <p className="text-xs text-muted-foreground">{superCupWinner.fullName}</p>
                )}
                {superCupWinner.realTeam && (
                  <p className="text-xs text-primary font-bold">{superCupWinner.realTeam}</p>
                )}
              </div>
              <div className="sm:ml-auto flex items-center gap-3">
                <div className="relative h-16 w-16 shrink-0 filter drop-shadow-lg">
                  <Image
                    src="/assets/trophies/super-cup.png"
                    alt="Super Cup Trophy"
                    fill
                    className="object-contain"
                    sizes="64px"
                  />
                </div>
                <Badge variant="secondary" className="font-bold text-xs px-3 py-1">
                  SUPER CUP LIFTED
                </Badge>
              </div>
            </div>
          )}

          {/* Central Match Card / Finalists Presentation */}
          <div className="rounded-3xl border border-secondary/40 supercup-panel p-6 sm:p-10 space-y-8 shadow-xl">
            {/* Header Stage Label */}
            <div className="text-center space-y-1">
              <span className="text-xs font-black uppercase tracking-widest text-secondary block">
                The Annual Clash of Champions
              </span>
              <h2 className="text-2xl sm:text-3xl font-black uppercase text-foreground">
                UCL Champion vs Europa League Champion
              </h2>
            </div>

            {/* Countdown timer if date is configured and match not finished */}
            {countdown && !countdown.isDue && (
              <div className="max-w-md mx-auto p-3.5 rounded-2xl bg-card/80 border border-border text-center space-y-1 shadow-inner">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-secondary" /> Kickoff Countdown
                </span>
                <div className="grid grid-cols-4 gap-2 font-mono text-center pt-1">
                  <div className="p-1 rounded-lg bg-background border border-border">
                    <span className="text-lg font-black text-foreground">{countdown.days}</span>
                    <span className="text-xs text-muted-foreground block">DAYS</span>
                  </div>
                  <div className="p-1 rounded-lg bg-background border border-border">
                    <span className="text-lg font-black text-foreground">{countdown.hours}</span>
                    <span className="text-xs text-muted-foreground block">HRS</span>
                  </div>
                  <div className="p-1 rounded-lg bg-background border border-border">
                    <span className="text-lg font-black text-foreground">{countdown.minutes}</span>
                    <span className="text-xs text-muted-foreground block">MIN</span>
                  </div>
                  <div className="p-1 rounded-lg bg-background border border-border">
                    <span className="text-lg font-black text-secondary">{countdown.seconds}</span>
                    <span className="text-xs text-muted-foreground block">SEC</span>
                  </div>
                </div>
              </div>
            )}

            {/* Two Finalists Arena Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              {/* Left Finalist: UCL Champion */}
              <div className="ucl-panel rounded-2xl p-5 text-center space-y-3">
                <div className="flex items-center justify-center gap-1.5 text-xs font-black uppercase text-primary">
                  <Shield className="h-4 w-4" />
                  <span>UCL Champion</span>
                </div>
                {uclChampion ? (
                  <div className="space-y-2">
                    <div className="h-20 w-20 rounded-2xl bg-card border border-border p-1.5 mx-auto flex items-center justify-center overflow-hidden shadow-md">
                      <img
                        src={resolvePlayerAvatar(uclChampion)}
                        alt={uclChampion.gamerTag}
                        className="h-full w-full object-contain"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(uclChampion.gamerTag)}`;
                        }}
                      />
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-foreground">{uclChampion.gamerTag}</h4>
                      {uclChampion.fullName && (
                        <p className="text-xs text-muted-foreground">{uclChampion.fullName}</p>
                      )}
                      {uclChampion.realTeam && (
                        <p className="text-xs text-primary font-bold">{uclChampion.realTeam}</p>
                      )}
                    </div>
                    <Badge variant="secondary" className="text-xs font-bold">
                      CONFIRMED QUALIFIER
                    </Badge>
                  </div>
                ) : (
                  <div className="py-6 space-y-2">
                    <div className="h-16 w-16 rounded-2xl bg-card/60 border border-dashed border-border mx-auto flex items-center justify-center">
                      <Shield className="h-8 w-8 text-muted-foreground/60" />
                    </div>
                    <p className="text-xs text-muted-foreground italic font-semibold">
                      Awaiting UCL Champion
                    </p>
                    <p className="text-xs text-muted-foreground leading-tight">
                      Determined when the UCL Grand Final concludes.
                    </p>
                  </div>
                )}
              </div>

              {/* Center Match / Scoreboard / Trophy Presentation */}
              <div className="text-center space-y-3 px-2">
                <div className="relative inline-block mx-auto">
                  <div className="relative h-24 w-24 mx-auto rounded-3xl bg-card/80 border border-secondary/40 p-2 flex items-center justify-center supercup-glow shadow-xl">
                    <Image
                      src="/assets/trophies/super-cup.png"
                      alt="UEFA Super Cup Trophy"
                      fill
                      className="object-contain p-1 filter drop-shadow-md"
                      sizes="96px"
                    />
                  </div>
                </div>

                {isMatchFinished && superCupMatch ? (
                  <div className="space-y-1">
                    <div className="font-mono text-3xl sm:text-4xl font-black text-secondary">
                      {superCupMatch.homeScore} - {superCupMatch.awayScore}
                    </div>
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest block">
                      Full Time Result
                    </span>
                  </div>
                ) : isMatchLive ? (
                  <div className="space-y-1">
                    <Badge variant="live" className="text-xs font-black animate-pulse px-3 py-1">
                      MATCH LIVE NOW
                    </Badge>
                    <p className="text-xs text-muted-foreground font-mono">1 Leg Showdown</p>
                  </div>
                ) : bothFinalistsConfirmed ? (
                  <div className="space-y-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-secondary block">
                      Single Match Decider
                    </span>
                    <p className="text-xs text-muted-foreground">
                      {superCupMatch?.matchDate
                        ? new Date(superCupMatch.matchDate).toLocaleDateString()
                        : "Match Fixture Ready"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <Badge variant="destructive" className="text-xs font-semibold">
                      Awaiting Finalists
                    </Badge>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Qualifiers lock once both continental grand finals finish.
                    </p>
                  </div>
                )}
              </div>

              {/* Right Finalist: Europa League Champion */}
              <div className="europa-panel rounded-2xl p-5 text-center space-y-3">
                <div className="flex items-center justify-center gap-1.5 text-xs font-black uppercase text-secondary">
                  <Flame className="h-4 w-4" />
                  <span>Europa League Champion</span>
                </div>
                {europaChampion ? (
                  <div className="space-y-2">
                    <div className="h-20 w-20 rounded-2xl bg-card border border-border p-1.5 mx-auto flex items-center justify-center overflow-hidden shadow-md">
                      <img
                        src={resolvePlayerAvatar(europaChampion)}
                        alt={europaChampion.gamerTag}
                        className="h-full w-full object-contain"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(europaChampion.gamerTag)}`;
                        }}
                      />
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-foreground">{europaChampion.gamerTag}</h4>
                      {europaChampion.fullName && (
                        <p className="text-xs text-muted-foreground">{europaChampion.fullName}</p>
                      )}
                      {europaChampion.realTeam && (
                        <p className="text-xs text-secondary font-bold">{europaChampion.realTeam}</p>
                      )}
                    </div>
                    <Badge variant="secondary" className="text-xs font-bold">
                      CONFIRMED QUALIFIER
                    </Badge>
                  </div>
                ) : (
                  <div className="py-6 space-y-2">
                    <div className="h-16 w-16 rounded-2xl bg-card/60 border border-dashed border-border mx-auto flex items-center justify-center">
                      <Flame className="h-8 w-8 text-muted-foreground/60" />
                    </div>
                    <p className="text-xs text-muted-foreground italic font-semibold">
                      Awaiting Europa Champion
                    </p>
                    <p className="text-xs text-muted-foreground leading-tight">
                      Determined when the Europa League Grand Final concludes.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Community Super Cup Winner Prediction Poll */}
            <SuperCupPredictionPoll />
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 2: OVERVIEW */}
      {/* =================================================================== */}
      {activeTab === "OVERVIEW" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="supercup-panel rounded-2xl p-5 space-y-2">
              <span className="text-xs font-black uppercase text-secondary">Pinnacle Honor</span>
              <p className="text-sm font-bold text-foreground">Highest Single Match Trophy</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                The Super Cup crowns the definitive kings of African and Rwandan eFootball. It pits
                the best of the best against each other in a high-stakes, one-match winner-take-all spectacle.
              </p>
            </div>

            <div className="supercup-panel rounded-2xl p-5 space-y-2">
              <span className="text-xs font-black uppercase text-secondary">Qualification Law</span>
              <p className="text-sm font-bold text-foreground">Strict Sporting Merit</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Admins and commissioners cannot hand-pick replacement teams. Qualification is locked
                to the champions of UCL and Europa League from the corresponding season.
              </p>
            </div>

            <div className="supercup-panel rounded-2xl p-5 space-y-2">
              <span className="text-xs font-black uppercase text-secondary">Hall of Fame Legacy</span>
              <p className="text-sm font-bold text-foreground">Permanent Induction</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                The Super Cup winner is permanently enshrined in the Rwanda eFootball Hall of Fame and
                the official Season Archive record book.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 3: HISTORICAL WINNERS */}
      {/* =================================================================== */}
      {activeTab === "HISTORY" && (
        <div className="space-y-4">
          <h3 className="text-sm font-black uppercase text-muted-foreground">
            UEFA Super Cup Roll of Honor
          </h3>
          {pastSuperCupWinners.length === 0 && !superCupWinner ? (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
              No historical Super Cup records archived yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {superCupWinner && (
                <div className="supercup-panel rounded-2xl p-5 border-secondary/50 supercup-glow flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <Badge variant="secondary" className="text-xs font-bold">
                      REIGNING SUPER CUP WINNER
                    </Badge>
                    <h4 className="text-lg font-black text-foreground">{superCupWinner.gamerTag}</h4>
                    <p className="text-xs text-muted-foreground">
                      Crowned in {season} • Defeated Continental Champions
                    </p>
                  </div>
                  <div className="relative h-12 w-12 shrink-0 filter drop-shadow">
                    <Image
                      src="/assets/trophies/super-cup.png"
                      alt="Super Cup Trophy"
                      fill
                      className="object-contain"
                      sizes="48px"
                    />
                  </div>
                </div>
              )}
              {pastSuperCupWinners.map((w, idx) => (
                <div key={w.id || idx} className="supercup-panel rounded-2xl p-5 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-xs font-mono text-secondary font-bold">{w.season}</span>
                    <h4 className="text-lg font-black text-foreground">{w.championName}</h4>
                    {w.runnerUp && (
                      <p className="text-xs text-muted-foreground">Runner-Up: {w.runnerUp}</p>
                    )}
                    {w.notes && <p className="text-xs text-muted-foreground">{w.notes}</p>}
                  </div>
                  <div className="relative h-10 w-10 shrink-0 opacity-80 filter drop-shadow">
                    <Image
                      src="/assets/trophies/super-cup.png"
                      alt="Super Cup Trophy"
                      fill
                      className="object-contain"
                      sizes="40px"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
