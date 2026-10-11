"use client";

import { useState } from "react";
import Image from "next/image";
import { Trophy, Shield, Flame, CheckCircle, Clock, Calendar, ChevronRight, Crown } from "lucide-react";
import { resolvePlayerAvatar } from "@/lib/teams";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface PlayoffMatchParticipant {
  id?: string;
  gamerTag: string;
  fullName?: string | null;
  realTeam?: string | null;
  avatar?: string | null;
}

export interface PlayoffMatchData {
  id: string;
  round: string;
  stage: string;
  status: string;
  matchDate?: string | Date | null;
  homeScore?: number | null;
  awayScore?: number | null;
  leg2HomeScore?: number | null;
  leg2AwayScore?: number | null;
  aggregateHomeScore?: number | null;
  aggregateAwayScore?: number | null;
  homePlayer?: PlayoffMatchParticipant | null;
  awayPlayer?: PlayoffMatchParticipant | null;
}

interface TournamentPlayoffBracketProps {
  competition: "UCL" | "EUROPA";
  matches: PlayoffMatchData[];
  trophyImage?: string;
  onSelectMatch?: (match: PlayoffMatchData) => void;
}

function BracketTeamRow({
  player,
  leg1,
  leg2,
  aggregate,
  isWinner,
  isFinished,
  isHome,
  competition,
}: {
  player?: PlayoffMatchParticipant | null;
  leg1?: number | null;
  leg2?: number | null;
  aggregate?: number | null;
  isWinner?: boolean;
  isFinished?: boolean;
  isHome: boolean;
  competition: "UCL" | "EUROPA";
}) {
  const isUcl = competition === "UCL";
  const avatarUrl = player ? resolvePlayerAvatar(player) : null;
  const isTBD = !player || !player.gamerTag;

  return (
    <div
      className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg transition-all ${
        isWinner && isFinished
          ? isUcl
            ? "bg-primary/15 font-bold"
            : "bg-secondary/15 font-bold"
          : "hover:bg-muted/40"
      }`}
    >
      {/* Left: Avatar + Names */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <div className="h-6 w-6 rounded-md bg-card border border-border p-0.5 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={player?.gamerTag || "Team"}
              className="h-full w-full object-contain"
              loading="lazy"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(player?.gamerTag || "player")}`;
              }}
            />
          ) : (
            <Shield className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p
            className={`truncate text-xs ${
              isTBD
                ? "text-muted-foreground italic font-mono"
                : isWinner && isFinished
                ? "text-foreground font-black"
                : "text-foreground font-semibold"
            }`}
          >
            {isTBD ? "TBD" : player.gamerTag}
          </p>
          {player?.realTeam && (
            <p className="truncate text-xs text-muted-foreground leading-none">{player.realTeam}</p>
          )}
        </div>
      </div>

      {/* Right: Scores */}
      <div className="flex items-center gap-1 shrink-0 font-mono text-xs">
        {leg1 !== null && leg1 !== undefined && leg2 !== null && leg2 !== undefined && (
          <span className="text-muted-foreground text-xs hidden sm:inline-block">
            ({leg1}, {leg2})
          </span>
        )}
        <span
          className={`w-6 text-center font-black ${
            isFinished
              ? isWinner
                ? isUcl
                  ? "text-primary text-sm"
                  : "text-secondary text-sm"
                : "text-muted-foreground"
              : "text-muted-foreground"
          }`}
        >
          {isFinished ? (aggregate !== null && aggregate !== undefined ? aggregate : "-") : "-"}
        </span>
      </div>
    </div>
  );
}

function MatchCardBox({
  match,
  label,
  competition,
  isFinal = false,
  onSelect,
}: {
  match?: PlayoffMatchData | null;
  label: string;
  competition: "UCL" | "EUROPA";
  isFinal?: boolean;
  onSelect?: (m: PlayoffMatchData) => void;
}) {
  const isUcl = competition === "UCL";
  const isFinished = match?.status === "FINISHED";
  const isLive = match?.status === "LIVE";

  // Calculate aggregates
  let aggHome: number | null = null;
  let aggAway: number | null = null;

  if (isFinished && match) {
    if (isFinal) {
      aggHome = match.homeScore ?? null;
      aggAway = match.awayScore ?? null;
    } else {
      aggHome =
        match.aggregateHomeScore ??
        (match.homeScore !== null && match.homeScore !== undefined
          ? (match.homeScore || 0) + (match.leg2HomeScore || 0)
          : null);
      aggAway =
        match.aggregateAwayScore ??
        (match.awayScore !== null && match.awayScore !== undefined
          ? (match.awayScore || 0) + (match.leg2AwayScore || 0)
          : null);
    }
  }

  const homeWins = isFinished && aggHome !== null && aggAway !== null && aggHome > aggAway;
  const awayWins = isFinished && aggHome !== null && aggAway !== null && aggAway > aggHome;

  return (
    <div
      onClick={() => match && onSelect && onSelect(match)}
      className={`rounded-xl border transition-all ${
        isFinal
          ? isUcl
            ? "ucl-panel ucl-glow border-primary/50"
            : "europa-panel europa-glow border-secondary/50"
          : isUcl
          ? "border-primary/25 bg-card/85 hover:border-primary/50"
          : "border-secondary/25 bg-card/85 hover:border-secondary/50"
      } p-2.5 shadow-md ${match ? "cursor-pointer" : ""}`}
    >
      {/* Header pill */}
      <div className="flex items-center justify-between pb-1.5 mb-1 border-b border-border text-xs">
        <span
          className={`font-black uppercase tracking-wider text-xs ${
            isUcl ? "text-primary" : "text-secondary"
          }`}
        >
          {label}
        </span>
        <div className="flex items-center gap-1">
          {isLive && (
            <Badge variant="live" className="text-xs px-1.5 py-0">
              LIVE
            </Badge>
          )}
          {isFinished && (
            <span className="text-xs text-muted-foreground font-semibold">FT</span>
          )}
          {!isFinished && !isLive && (
            <span className="text-xs text-muted-foreground font-mono">
              {isFinal ? "1 LEG" : "2 LEGS"}
            </span>
          )}
        </div>
      </div>

      {/* Participants */}
      <div className="space-y-1">
        <BracketTeamRow
          player={match?.homePlayer}
          leg1={match?.homeScore}
          leg2={match?.leg2HomeScore}
          aggregate={aggHome}
          isWinner={homeWins}
          isFinished={isFinished}
          isHome={true}
          competition={competition}
        />
        <BracketTeamRow
          player={match?.awayPlayer}
          leg1={match?.awayScore}
          leg2={match?.leg2AwayScore}
          aggregate={aggAway}
          isWinner={awayWins}
          isFinished={isFinished}
          isHome={false}
          competition={competition}
        />
      </div>
    </div>
  );
}

export default function TournamentPlayoffBracket({
  competition,
  matches = [],
  trophyImage,
  onSelectMatch,
}: TournamentPlayoffBracketProps) {
  const isUcl = competition === "UCL";
  const [activeMobileView, setActiveMobileView] = useState<"ALL" | "QF" | "SF" | "FINAL">("ALL");

  // Extract matches by round
  const qfMatches = matches.filter(
    (m) => m.stage === "QUARTER_FINAL" || m.round?.toLowerCase().includes("quarter")
  );
  const sfMatches = matches.filter(
    (m) => m.stage === "SEMI_FINAL" || m.round?.toLowerCase().includes("semi")
  );
  const finalMatch = matches.find(
    (m) => m.stage === "FINAL" || m.round?.toLowerCase().includes("final")
  );

  const qf1 = qfMatches[0] || null;
  const qf2 = qfMatches[1] || null;
  const qf3 = qfMatches[2] || null;
  const qf4 = qfMatches[3] || null;

  const sf1 = sfMatches[0] || null;
  const sf2 = sfMatches[1] || null;

  // Check if champion is confirmed
  let champion: PlayoffMatchParticipant | null = null;
  if (finalMatch && finalMatch.status === "FINISHED") {
    const hScore = finalMatch.aggregateHomeScore ?? finalMatch.homeScore ?? 0;
    const aScore = finalMatch.aggregateAwayScore ?? finalMatch.awayScore ?? 0;
    if (hScore > aScore && finalMatch.homePlayer) {
      champion = finalMatch.homePlayer;
    } else if (aScore > hScore && finalMatch.awayPlayer) {
      champion = finalMatch.awayPlayer;
    }
  }

  const trophySrc =
    trophyImage ||
    (isUcl ? "/assets/trophies/champions-league.png" : "/assets/trophies/europa-league.png");

  const hasAnyPlayoffMatches = matches.length > 0;

  return (
    <div
      className={`rounded-3xl border ${
        isUcl ? "border-primary/40 ucl-theme-bg" : "border-secondary/40 europa-theme-bg"
      } p-4 sm:p-6 lg:p-8 relative overflow-hidden shadow-2xl`}
    >
      {/* Atmospheric Stadium Background Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-35 z-0">
        <div
          className={`absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-72 rounded-full blur-3xl ${
            isUcl ? "bg-primary/20" : "bg-secondary/20"
          }`}
        />
      </div>

      {/* Content wrapper */}
      <div className="relative z-10 space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <div className="flex items-center gap-2">
              {isUcl ? (
                <Shield className="h-5 w-5 text-primary" />
              ) : (
                <Flame className="h-5 w-5 text-secondary" />
              )}
              <h2 className="text-xl sm:text-2xl font-black uppercase text-foreground tracking-tight">
                {isUcl ? "Champions League" : "Europa League"} Playoff Road to Final
              </h2>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Broadcast Tournament Bracket • 2-Legged Knockout Series with Single Match Grand Final
            </p>
          </div>

          {/* Mobile view switch buttons */}
          <div className="flex items-center gap-1 self-stretch sm:self-auto overflow-x-auto p-1 rounded-xl bg-card border border-border">
            <Button
              variant={activeMobileView === "ALL" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveMobileView("ALL")}
              className="text-xs h-7 px-2.5 font-bold"
            >
              Full Stage
            </Button>
            <Button
              variant={activeMobileView === "QF" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveMobileView("QF")}
              className="text-xs h-7 px-2.5 font-bold"
            >
              Quarter-Finals
            </Button>
            <Button
              variant={activeMobileView === "SF" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveMobileView("SF")}
              className="text-xs h-7 px-2.5 font-bold"
            >
              Semi-Finals
            </Button>
            <Button
              variant={activeMobileView === "FINAL" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveMobileView("FINAL")}
              className="text-xs h-7 px-2.5 font-bold"
            >
              Final
            </Button>
          </div>
        </div>

        {/* Champion Showcase Banner (if crowned) */}
        {champion && (
          <div
            className={`rounded-2xl border p-4 sm:p-5 text-center ${
              isUcl
                ? "border-primary bg-primary/10 ucl-glow"
                : "border-secondary bg-secondary/10 europa-glow"
            } flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6`}
          >
            <div className="relative">
              <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-card border border-border p-1 flex items-center justify-center overflow-hidden shadow-lg">
                <img
                  src={resolvePlayerAvatar(champion)}
                  alt={champion.gamerTag}
                  className="h-full w-full object-contain"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(champion?.gamerTag || "player")}`;
                  }}
                />
              </div>
              <Crown className="h-5 w-5 text-secondary absolute -top-2 -right-2 animate-bounce" />
            </div>
            <div className="text-center sm:text-left">
              <span className="text-xs font-black uppercase tracking-widest text-secondary block">
                Official {isUcl ? "UEFA Champions League" : "UEFA Europa League"} Champion
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-foreground">{champion.gamerTag}</h3>
              {champion.fullName && (
                <p className="text-xs text-muted-foreground">{champion.fullName}</p>
              )}
            </div>
            <div className="sm:ml-auto">
              <Badge variant="secondary" className="font-bold text-xs px-3 py-1">
                🏆 TITLE CONFIRMED
              </Badge>
            </div>
          </div>
        )}

        {!hasAnyPlayoffMatches ? (
          /* Empty state */
          <div className="rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center space-y-3">
            <Trophy className="h-10 w-10 text-muted-foreground mx-auto" />
            <h3 className="text-base font-bold text-foreground">Playoff Bracket Awaiting Fixtures</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              The official playoff bracket unlocks once the group stage matches conclude and the top 2
              athletes from Groups A, B, C, and D are determined.
            </p>
          </div>
        ) : (
          /* Main Broadcast Bracket */
          <div>
            {/* DESKTOP BROADCAST VIEW (Full Flow: Left Wing -> Center Trophy -> Right Wing) */}
            <div
              className={`hidden lg:grid grid-cols-5 gap-3 items-center ${
                activeMobileView === "ALL" ? "lg:grid" : ""
              }`}
            >
              {/* Column 1: Left Wing Quarter-Finals (QF1, QF2) */}
              <div className="space-y-6">
                <div>
                  <span className="text-xs font-bold uppercase text-muted-foreground block text-center mb-1">
                    Quarter-Final 1
                  </span>
                  <MatchCardBox
                    match={qf1}
                    label="QF 1 (A1 vs B2)"
                    competition={competition}
                    onSelect={onSelectMatch}
                  />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase text-muted-foreground block text-center mb-1">
                    Quarter-Final 2
                  </span>
                  <MatchCardBox
                    match={qf2}
                    label="QF 2 (C1 vs D2)"
                    competition={competition}
                    onSelect={onSelectMatch}
                  />
                </div>
              </div>

              {/* Column 2: Semi-Final 1 */}
              <div className="space-y-4 my-auto">
                <span className="text-xs font-bold uppercase text-muted-foreground block text-center mb-1">
                  Semi-Final 1
                </span>
                <MatchCardBox
                  match={sf1}
                  label="Semi-Final 1"
                  competition={competition}
                  onSelect={onSelectMatch}
                />
              </div>

              {/* Column 3: The Grand Final Destination & Trophy */}
              <div className="text-center space-y-3 px-2">
                <div className="relative inline-block mx-auto group">
                  <div
                    className={`h-28 w-28 sm:h-32 sm:w-32 mx-auto relative flex items-center justify-center p-2 rounded-3xl ${
                      isUcl ? "ucl-glow" : "europa-glow"
                    }`}
                  >
                    <img
                      src={trophySrc}
                      alt={`${competition} Trophy`}
                      className="h-full w-full object-contain filter drop-shadow-xl transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                  <span className="text-xs font-black uppercase tracking-wider text-muted-foreground block mt-1">
                    Championship Trophy
                  </span>
                </div>

                <div className="pt-1">
                  <span className="text-xs font-black uppercase text-secondary block text-center mb-1">
                    The Grand Final
                  </span>
                  <MatchCardBox
                    match={finalMatch}
                    label="Championship Match"
                    competition={competition}
                    isFinal={true}
                    onSelect={onSelectMatch}
                  />
                </div>
              </div>

              {/* Column 4: Semi-Final 2 */}
              <div className="space-y-4 my-auto">
                <span className="text-xs font-bold uppercase text-muted-foreground block text-center mb-1">
                  Semi-Final 2
                </span>
                <MatchCardBox
                  match={sf2}
                  label="Semi-Final 2"
                  competition={competition}
                  onSelect={onSelectMatch}
                />
              </div>

              {/* Column 5: Right Wing Quarter-Finals (QF3, QF4) */}
              <div className="space-y-6">
                <div>
                  <span className="text-xs font-bold uppercase text-muted-foreground block text-center mb-1">
                    Quarter-Final 3
                  </span>
                  <MatchCardBox
                    match={qf3}
                    label="QF 3 (B1 vs A2)"
                    competition={competition}
                    onSelect={onSelectMatch}
                  />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase text-muted-foreground block text-center mb-1">
                    Quarter-Final 4
                  </span>
                  <MatchCardBox
                    match={qf4}
                    label="QF 4 (D1 vs C2)"
                    competition={competition}
                    onSelect={onSelectMatch}
                  />
                </div>
              </div>
            </div>

            {/* MOBILE & TABLET ADAPTIVE ROUND VIEW */}
            <div className="lg:hidden space-y-6">
              {(activeMobileView === "ALL" || activeMobileView === "FINAL") && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-border pb-1">
                    <span className="text-xs font-black uppercase text-secondary">
                      The Grand Final (Single Match)
                    </span>
                    <Trophy className="h-4 w-4 text-secondary" />
                  </div>
                  <div className="h-20 w-20 mx-auto flex items-center justify-center">
                    <img
                      src={trophySrc}
                      alt="Trophy"
                      className="h-full w-full object-contain filter drop-shadow-md"
                    />
                  </div>
                  <MatchCardBox
                    match={finalMatch}
                    label="Grand Final Showdown"
                    competition={competition}
                    isFinal={true}
                    onSelect={onSelectMatch}
                  />
                </div>
              )}

              {(activeMobileView === "ALL" || activeMobileView === "SF") && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-border pb-1">
                    <span className="text-xs font-black uppercase text-foreground">
                      Semi-Finals (2 Legs Aggregate)
                    </span>
                    <Flame className="h-4 w-4 text-primary" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <MatchCardBox
                      match={sf1}
                      label="Semi-Final 1"
                      competition={competition}
                      onSelect={onSelectMatch}
                    />
                    <MatchCardBox
                      match={sf2}
                      label="Semi-Final 2"
                      competition={competition}
                      onSelect={onSelectMatch}
                    />
                  </div>
                </div>
              )}

              {(activeMobileView === "ALL" || activeMobileView === "QF") && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-border pb-1">
                    <span className="text-xs font-black uppercase text-foreground">
                      Quarter-Finals (2 Legs Aggregate)
                    </span>
                    <Shield className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <MatchCardBox
                      match={qf1}
                      label="QF 1 (A1 vs B2)"
                      competition={competition}
                      onSelect={onSelectMatch}
                    />
                    <MatchCardBox
                      match={qf2}
                      label="QF 2 (C1 vs D2)"
                      competition={competition}
                      onSelect={onSelectMatch}
                    />
                    <MatchCardBox
                      match={qf3}
                      label="QF 3 (B1 vs A2)"
                      competition={competition}
                      onSelect={onSelectMatch}
                    />
                    <MatchCardBox
                      match={qf4}
                      label="QF 4 (D1 vs C2)"
                      competition={competition}
                      onSelect={onSelectMatch}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
