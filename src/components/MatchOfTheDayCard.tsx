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
    <div className="relative overflow-hidden rounded-3xl border-2 border-secondary/50 bg-gradient-to-br from-background via-card to-secondary/20 p-6 sm:p-8 shadow-2xl">
      {/* Background glowing flair */}
      <div className="absolute -top-20 -right-20 w-80 h-80 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Banner Ribbon */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-secondary/20 pb-4 mb-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-secondary text-secondary-foreground font-black shadow-lg animate-pulse">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-widest text-secondary">
                OFFICIAL MATCH OF THE DAY
              </span>
              <Badge variant="yellow" className="text-xs font-mono">
                TABLE SELECTED
              </Badge>
            </div>
            <p className="text-xs text-foreground font-semibold">{headline}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="font-mono text-xs text-foreground">
            {match.division} • {match.round}
          </Badge>
          {isLive ? (
            <Badge variant="live" className="text-xs">
              LIVE NOW
            </Badge>
          ) : isFinished ? (
            <Badge variant="secondary" className="text-xs">
              FINISHED
            </Badge>
          ) : (
            <Badge variant="default" className="text-xs text-primary">
              24-HR CYCLE ACTIVE
            </Badge>
          )}
        </div>
      </div>

      {/* Central Showdown Arena */}
      <div className="grid grid-cols-1 lg:grid-cols-11 items-center gap-6 my-2">
        {/* Home Contender */}
        <div className="lg:col-span-5 rounded-2xl border border-primary/30 bg-background/70 p-5 space-y-3 relative">
          <div className="flex items-center justify-between">
            <Badge variant="default" className="text-xs font-mono font-bold">
              RANK #{homeRank} • {homePoints} PTS
            </Badge>
            <span className="text-xs font-mono text-muted-foreground">HOME</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-card border-2 border-primary p-1.5 shadow-lg overflow-hidden">
              {match.homePlayer ? (
                <img
                  src={resolvePlayerAvatar(match.homePlayer)}
                  alt={match.homePlayer?.realTeam || match.homePlayer?.gamerTag}
                  className="h-full w-full object-contain"
                />
              ) : (
                <span className="text-primary font-black text-xl">HM</span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {match.homePlayer?.gamerTag}
                </h3>
                {match.homePlayer?.realTeam && (
                  <Badge variant="outline" className="text-xs py-0 px-2 font-bold border-primary/40 text-primary bg-primary/30">
                    {match.homePlayer.realTeam}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-foreground">{match.homePlayer?.fullName}</p>
              <p className="text-xs text-muted-foreground font-mono mt-0.5">
                Konami ID: {match.homePlayer?.efootballId}
              </p>
            </div>
          </div>

          {match.homePlayer?.whatsapp && (
            <div className="pt-2 border-t border-border flex items-center justify-between">
              <span className="text-xs font-mono text-muted-foreground">{match.homePlayer.whatsapp}</span>
              <a
                href={`https://wa.me/${match.homePlayer.whatsapp.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-primary hover:underline"
              >
                <MessageCircle className="h-3.5 w-3.5" /> WhatsApp Direct
              </a>
            </div>
          )}
        </div>

        {/* VS / Score Divider */}
        <div className="lg:col-span-1 text-center flex flex-col items-center justify-center">
          {isLive || isFinished || isForfeit ? (
            <div className="rounded-2xl bg-background border border-secondary/40 p-3 font-mono text-2xl font-black text-secondary shadow-xl">
              {match.homeScore ?? 0} : {match.awayScore ?? 0}
            </div>
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary/20 border-2 border-secondary text-secondary font-black text-sm shadow-xl animate-bounce">
              VS
            </div>
          )}
        </div>

        {/* Away Contender */}
        <div className="lg:col-span-5 rounded-2xl border border-primary/30 bg-background/70 p-5 space-y-3 relative">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-muted-foreground">AWAY</span>
            <Badge variant="green" className="text-xs font-mono font-bold">
              RANK #{awayRank} • {awayPoints} PTS
            </Badge>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-card border-2 border-primary p-1.5 shadow-lg overflow-hidden">
              {match.awayPlayer ? (
                <img
                  src={resolvePlayerAvatar(match.awayPlayer)}
                  alt={match.awayPlayer?.realTeam || match.awayPlayer?.gamerTag}
                  className="h-full w-full object-contain"
                />
              ) : (
                <span className="text-primary font-black text-xl">AW</span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {match.awayPlayer?.gamerTag}
                </h3>
                {match.awayPlayer?.realTeam && (
                  <Badge variant="outline" className="text-xs py-0 px-2 font-bold border-primary/40 text-primary bg-primary/30">
                    {match.awayPlayer.realTeam}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-foreground">{match.awayPlayer?.fullName}</p>
              <p className="text-xs text-muted-foreground font-mono mt-0.5">
                Konami ID: {match.awayPlayer?.efootballId}
              </p>
            </div>
          </div>

          {match.awayPlayer?.whatsapp && (
            <div className="pt-2 border-t border-border flex items-center justify-between">
              <span className="text-xs font-mono text-muted-foreground">{match.awayPlayer.whatsapp}</span>
              <a
                href={`https://wa.me/${match.awayPlayer.whatsapp.replace(/[^0-9]/g, "")}`}
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
      <div className="mt-5 pt-4 border-t border-secondary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Trophy className="h-4 w-4 text-secondary" />
          <span>Selected on merit from current league standings. Highest stakes clash of the day.</span>
        </span>

        <Link href="/dashboard" className="text-secondary font-bold hover:underline flex items-center gap-1">
          <span>Go to Player Arena</span> →
        </Link>
      </div>
    </div>
  );
}
