import Link from "next/link";
import { Trophy, Flame, Phone, Calendar, Clock, Sparkles, MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import MotdPredictionPoll from "@/components/MotdPredictionPoll";
import { resolvePlayerAvatar, findTeam } from "@/lib/teams";

interface MotdProps {
  match: {
    id: string;
    division?: string;
    round: string;
    homePlayer: any;
    awayPlayer: any;
    homeScore: number | null;
    awayScore: number | null;
    status: string;
    deadlineDate?: string | Date;
    motdHeadline?: string;
    motdHomeRank?: number;
    motdAwayRank?: number;
    motdHomePoints?: number;
    motdAwayPoints?: number;
    homeStanding?: any;
    awayStanding?: any;
  };
}

export default function MatchOfTheDayCard({ match }: MotdProps) {
  if (!match) return null;
  const homeRank = match.motdHomeRank || match.homeStanding?.rank || 1;
  const awayRank = match.motdAwayRank || match.awayStanding?.rank || 2;
  const homePoints = match.motdHomePoints ?? match.homeStanding?.points ?? 0;
  const awayPoints = match.motdAwayPoints ?? match.awayStanding?.points ?? 0;

  const headline =
    match.motdHeadline ||
    (homeRank <= 2 && awayRank <= 2
      ? "TOP OF THE TABLE BLOCKBUSTER (#1 vs #2)"
      : `MARQUEE CLASH: #${homeRank} vs #${awayRank}`);

  const isLive = match.status === "LIVE";
  const isFinished = match.status === "FINISHED";
  const isForfeit = match.status === "FORFEIT";

  return (
    <div className="relative overflow-hidden rounded-3xl border-2 border-secondary/50 bg-gradient-to-br from-background via-card to-secondary/20 p-5 sm:p-8 shadow-2xl group">
      {/* Shimmer Light Sweep */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-secondary/10 to-transparent" />

      {/* Background glowing flair */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-secondary/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-primary/15 rounded-full blur-3xl pointer-events-none animate-pulse" />

      {/* Top Banner Ribbon */}
      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-secondary/30 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground font-black shadow-lg animate-pulse">
            <Sparkles className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-secondary"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-secondary">
                OFFICIAL MATCH OF THE DAY
              </span>
              <Badge variant="yellow" className="text-xs font-mono">
                TABLE SELECTED
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-foreground font-semibold mt-0.5">{headline}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="font-mono text-xs text-foreground border border-border">
            {match.division} • {match.round}
          </Badge>
          {isLive ? (
            <Badge variant="live" className="text-xs gap-1.5">
              <span className="h-2 w-2 rounded-full bg-destructive animate-ping" />
              LIVE NOW
            </Badge>
          ) : isFinished ? (
            <Badge variant="secondary" className="text-xs">
              FINISHED
            </Badge>
          ) : (
            <Badge variant="default" className="text-xs text-secondary border border-secondary/30 bg-secondary/20">
              ⚡ 24-HR CYCLE ACTIVE
            </Badge>
          )}
        </div>
      </div>

      {/* Central Showdown Arena */}
      <div className="relative grid grid-cols-1 lg:grid-cols-11 items-center gap-6 my-2">
        {/* Home Contender */}
        <div className="lg:col-span-5 rounded-2xl border border-primary/30 bg-background/70 p-5 space-y-3 relative shadow-lg hover:border-primary/60 transition-all">
          <div className="flex items-center justify-between">
            <Badge variant="default" className="text-xs font-mono font-bold bg-primary/20 text-primary border-primary/30">
              RANK #{homeRank} • {homePoints} PTS
            </Badge>
            <span className="text-xs font-mono font-bold text-primary">HOME ATHLETE</span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex h-14 w-14 sm:h-16 sm:w-16 shrink-0 aspect-square items-center justify-center rounded-2xl bg-card border-2 border-primary p-1.5 shadow-lg overflow-hidden">
              {match.homePlayer ? (
                <img
                  src={resolvePlayerAvatar(match.homePlayer)}
                  alt={match.homePlayer?.realTeam || match.homePlayer?.gamerTag}
                  className="h-full w-full object-contain"
                  loading="lazy"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(match.homePlayer?.gamerTag || "player")}`;
                  }}
                />
              ) : (
                <span className="text-primary font-black text-xl">HM</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h3 className="text-lg sm:text-xl md:text-2xl font-black text-white tracking-tight truncate">
                  {match.homePlayer?.gamerTag}
                </h3>
                {match.homePlayer?.realTeam && (
                  <Badge variant="outline" className="text-xs py-0 px-2 font-bold border-primary/40 text-primary bg-primary/30 truncate">
                    {findTeam(match.homePlayer.realTeam)?.name || match.homePlayer.realTeam}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-foreground truncate mt-0.5">{match.homePlayer?.fullName}</p>
              <p className="text-xs text-muted-foreground font-mono mt-0.5 truncate">
                Konami ID: {match.homePlayer?.efootballId}
              </p>
            </div>
          </div>

          {match.homePlayer?.whatsapp && (
            <div className="pt-2 border-t border-border flex items-center justify-between">
              <span className="text-xs font-mono text-muted-foreground">{match.homePlayer.whatsapp}</span>
              <a
                href={`https://wa.me/${String(match.homePlayer.whatsapp).replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-primary hover:underline"
              >
                <MessageCircle className="h-3.5 w-3.5" /> WhatsApp Direct
              </a>
            </div>
          )}
        </div>

        {/* VS / Score Divider with Pulsing Energy Rings */}
        <div className="lg:col-span-1 text-center flex flex-col items-center justify-center my-2 lg:my-0">
          {isLive || isFinished || isForfeit ? (
            <div className="rounded-2xl bg-background border-2 border-secondary/50 p-3 font-mono text-xl sm:text-2xl font-black text-secondary shadow-xl">
              {match.homeScore ?? 0} : {match.awayScore ?? 0}
            </div>
          ) : (
            <div className="relative flex items-center justify-center">
              <div className="absolute -inset-3 rounded-full border-2 border-secondary/40 animate-ping opacity-75 pointer-events-none" />
              <div className="absolute -inset-1 rounded-full bg-secondary blur-sm opacity-50" />
              <div className="relative flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-secondary border-2 border-secondary text-secondary-foreground font-black text-sm sm:text-base shadow-xl">
                VS
              </div>
            </div>
          )}
        </div>

        {/* Away Contender */}
        <div className="lg:col-span-5 rounded-2xl border border-primary/30 bg-background/70 p-5 space-y-3 relative shadow-lg hover:border-primary/60 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-primary">AWAY ATHLETE</span>
            <Badge variant="green" className="text-xs font-mono font-bold">
              RANK #{awayRank} • {awayPoints} PTS
            </Badge>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex h-14 w-14 sm:h-16 sm:w-16 shrink-0 aspect-square items-center justify-center rounded-2xl bg-card border-2 border-primary p-1.5 shadow-lg overflow-hidden">
              {match.awayPlayer ? (
                <img
                  src={resolvePlayerAvatar(match.awayPlayer)}
                  alt={match.awayPlayer?.realTeam || match.awayPlayer?.gamerTag}
                  className="h-full w-full object-contain"
                  loading="lazy"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(match.awayPlayer?.gamerTag || "player")}`;
                  }}
                />
              ) : (
                <span className="text-primary font-black text-xl">AW</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h3 className="text-lg sm:text-xl md:text-2xl font-black text-white tracking-tight truncate">
                  {match.awayPlayer?.gamerTag}
                </h3>
                {match.awayPlayer?.realTeam && (
                  <Badge variant="outline" className="text-xs py-0 px-2 font-bold border-primary/40 text-primary bg-primary/30">
                    {findTeam(match.awayPlayer.realTeam)?.name || match.awayPlayer.realTeam}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-foreground truncate mt-0.5">{match.awayPlayer?.fullName}</p>
              <p className="text-xs text-muted-foreground font-mono mt-0.5 truncate">
                Konami ID: {match.awayPlayer?.efootballId}
              </p>
            </div>
          </div>

          {match.awayPlayer?.whatsapp && (
            <div className="pt-2 border-t border-border flex items-center justify-between">
              <span className="text-xs font-mono text-muted-foreground">{match.awayPlayer.whatsapp}</span>
              <a
                href={`https://wa.me/${String(match.awayPlayer.whatsapp).replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-primary hover:underline"
              >
                <MessageCircle className="h-3.5 w-3.5" /> WhatsApp Direct
              </a>
            </div>
          )}
        </div>
      </div>

      {/* MOTD User & Community Prediction Poll */}
      <MotdPredictionPoll
        matchId={match.id}
        homeGamerTag={match.homePlayer?.gamerTag || "Home Contender"}
        awayGamerTag={match.awayPlayer?.gamerTag || "Away Contender"}
        isFinished={isFinished || isForfeit}
      />

      {/* Footer Info */}
      <div className="relative mt-5 pt-4 border-t border-secondary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Trophy className="h-4 w-4 text-secondary" />
          <span>Selected on merit from current league standings. Highest stakes clash of the day.</span>
        </span>

        <Link href="/fixtures" className="text-secondary font-bold hover:underline flex items-center gap-1">
          <span>View All Fixtures</span> →
        </Link>
      </div>
    </div>
  );
}
