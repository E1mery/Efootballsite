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
    <div className="relative overflow-hidden rounded-3xl border-2 border-yellow-500/60 bg-gradient-to-br from-slate-950 via-slate-900 to-yellow-950/25 p-5 sm:p-8 shadow-2xl shadow-yellow-500/20 group">
      {/* Animated Shimmer Light Sweep */}
      <div className="pointer-events-none absolute inset-0 -translate-x-full animate-[shimmer_4s_infinite] bg-gradient-to-r from-transparent via-yellow-400/[0.08] to-transparent" />

      {/* Dynamic Background glowing flairs */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-yellow-500/15 rounded-full blur-3xl pointer-events-none animate-pulse duration-1000" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-sky-500/15 rounded-full blur-3xl pointer-events-none animate-pulse duration-1000 delay-500" />

      {/* Top Banner Ribbon */}
      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-yellow-500/30 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 font-black shadow-lg shadow-yellow-500/40 animate-pulse">
            <Sparkles className="h-5 w-5 text-slate-950" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-300 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-400"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-200 to-yellow-400">
                OFFICIAL MATCH OF THE DAY
              </span>
              <Badge variant="yellow" className="text-[10px] font-mono animate-bounce">
                🔥 FEATURED
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-slate-200 font-bold mt-0.5">{headline}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="font-mono text-xs text-slate-300 border border-slate-700">
            {match.division} • {match.round}
          </Badge>
          {isLive ? (
            <Badge variant="live" className="text-xs gap-1.5">
              <span className="h-2 w-2 rounded-full bg-red-400 animate-ping" />
              LIVE NOW
            </Badge>
          ) : isFinished ? (
            <Badge variant="secondary" className="text-xs">
              FINISHED
            </Badge>
          ) : (
            <Badge variant="default" className="text-xs text-yellow-300 border-yellow-500/30 bg-yellow-950/40">
              ⚡ 24-HR CYCLE ACTIVE
            </Badge>
          )}
        </div>
      </div>

      {/* Central Showdown Arena */}
      <div className="relative grid grid-cols-1 lg:grid-cols-11 items-center gap-6 my-2">
        {/* Home Contender */}
        <div className="lg:col-span-5 rounded-2xl border border-sky-500/40 bg-slate-950/80 p-5 space-y-3 relative shadow-lg shadow-sky-950/40 hover:border-sky-400/60 transition-all">
          <div className="flex items-center justify-between">
            <Badge variant="default" className="text-xs font-mono font-bold bg-sky-950/60 text-sky-300 border-sky-500/30">
              RANK #{homeRank} • {homePoints} PTS
            </Badge>
            <span className="text-[11px] font-mono font-bold text-sky-400">HOME ATHLETE</span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex h-14 w-14 sm:h-16 sm:w-16 shrink-0 aspect-square items-center justify-center rounded-2xl bg-white/95 border-2 border-sky-400 p-1.5 shadow-xl shadow-sky-500/30 overflow-hidden">
              {match.homePlayer ? (
                <img
                  src={resolvePlayerAvatar(match.homePlayer)}
                  alt={match.homePlayer?.realTeam || match.homePlayer?.gamerTag}
                  className="h-full w-full object-contain filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]"
                  loading="lazy"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(match.homePlayer?.gamerTag || "player")}`;
                  }}
                />
              ) : (
                <span className="text-sky-600 font-black text-xl">HM</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h3 className="text-lg sm:text-xl md:text-2xl font-black text-white tracking-tight truncate">
                  {match.homePlayer?.gamerTag}
                </h3>
                {match.homePlayer?.realTeam && (
                  <Badge variant="outline" className="text-[10px] py-0 px-2 font-bold border-sky-500/40 text-sky-400 bg-sky-950/30 truncate">
                    {findTeam(match.homePlayer.realTeam)?.name || match.homePlayer.realTeam}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-300 truncate mt-0.5">{match.homePlayer?.fullName}</p>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">
                Konami ID: {match.homePlayer?.efootballId}
              </p>
            </div>
          </div>

          {match.homePlayer?.whatsapp && (
            <div className="pt-2 border-t border-slate-900 flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400">{match.homePlayer.whatsapp}</span>
              <a
                href={`https://wa.me/${match.homePlayer.whatsapp.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 hover:text-emerald-300 hover:underline"
              >
                <MessageCircle className="h-3.5 w-3.5" /> WhatsApp Direct
              </a>
            </div>
          )}
        </div>

        {/* VS / Score Divider with Pulsing Energy Rings */}
        <div className="lg:col-span-1 text-center flex flex-col items-center justify-center my-2 lg:my-0">
          {isLive || isFinished || isForfeit ? (
            <div className="rounded-2xl bg-slate-950 border-2 border-yellow-500/50 p-3 font-mono text-xl sm:text-2xl font-black text-yellow-400 shadow-xl shadow-yellow-500/10">
              {match.homeScore ?? 0} : {match.awayScore ?? 0}
            </div>
          ) : (
            <div className="relative flex items-center justify-center">
              <div className="absolute -inset-3 rounded-full border-2 border-yellow-400/40 animate-ping opacity-75 pointer-events-none" />
              <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-yellow-500 to-amber-300 blur-sm opacity-50" />
              <div className="relative flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 via-yellow-500 to-amber-600 border-2 border-yellow-200 text-slate-950 font-black text-sm sm:text-base shadow-2xl shadow-yellow-500/40">
                VS
              </div>
            </div>
          )}
        </div>

        {/* Away Contender */}
        <div className="lg:col-span-5 rounded-2xl border border-emerald-500/40 bg-slate-950/80 p-5 space-y-3 relative shadow-lg shadow-emerald-950/40 hover:border-emerald-400/60 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold text-emerald-400">AWAY ATHLETE</span>
            <Badge variant="green" className="text-xs font-mono font-bold">
              RANK #{awayRank} • {awayPoints} PTS
            </Badge>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex h-14 w-14 sm:h-16 sm:w-16 shrink-0 aspect-square items-center justify-center rounded-2xl bg-white/95 border-2 border-emerald-400 p-1.5 shadow-xl shadow-emerald-500/30 overflow-hidden">
              {match.awayPlayer ? (
                <img
                  src={resolvePlayerAvatar(match.awayPlayer)}
                  alt={match.awayPlayer?.realTeam || match.awayPlayer?.gamerTag}
                  className="h-full w-full object-contain filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]"
                  loading="lazy"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(match.awayPlayer?.gamerTag || "player")}`;
                  }}
                />
              ) : (
                <span className="text-emerald-600 font-black text-xl">AW</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h3 className="text-lg sm:text-xl md:text-2xl font-black text-white tracking-tight truncate">
                  {match.awayPlayer?.gamerTag}
                </h3>
                {match.awayPlayer?.realTeam && (
                  <Badge variant="outline" className="text-[10px] py-0 px-2 font-bold border-emerald-500/40 text-emerald-400 bg-emerald-950/30">
                    {findTeam(match.awayPlayer.realTeam)?.name || match.awayPlayer.realTeam}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-300 truncate mt-0.5">{match.awayPlayer?.fullName}</p>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">
                Konami ID: {match.awayPlayer?.efootballId}
              </p>
            </div>
          </div>

          {match.awayPlayer?.whatsapp && (
            <div className="pt-2 border-t border-slate-900 flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400">{match.awayPlayer.whatsapp}</span>
              <a
                href={`https://wa.me/${match.awayPlayer.whatsapp.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 hover:text-emerald-300 hover:underline"
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
      <div className="relative mt-5 pt-4 border-t border-yellow-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400">
        <span className="flex items-center gap-1.5">
          <Trophy className="h-4 w-4 text-yellow-400" />
          <span>Selected on merit from current league standings. Highest stakes clash of the day.</span>
        </span>

        <Link href="/fixtures" className="text-yellow-400 font-bold hover:underline flex items-center gap-1">
          <span>View All Fixtures</span> →
        </Link>
      </div>
    </div>
  );
}
