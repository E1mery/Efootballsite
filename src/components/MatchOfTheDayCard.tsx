import Link from "next/link";
import { Trophy, Flame, Phone, Calendar, Clock, Sparkles, MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
    <div className="relative overflow-hidden rounded-3xl border-2 border-yellow-500/50 bg-gradient-to-br from-slate-950 via-slate-900 to-yellow-950/20 p-6 sm:p-8 shadow-2xl shadow-yellow-500/10">
      {/* Background glowing flair */}
      <div className="absolute -top-20 -right-20 w-80 h-80 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Banner Ribbon */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-yellow-500/20 pb-4 mb-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-yellow-500 text-slate-950 font-black shadow-lg shadow-yellow-500/30 animate-pulse">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-widest text-yellow-400">
                OFFICIAL MATCH OF THE DAY
              </span>
              <Badge variant="yellow" className="text-[10px] font-mono">
                TABLE SELECTED
              </Badge>
            </div>
            <p className="text-xs text-slate-300 font-semibold">{headline}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="font-mono text-xs text-slate-300">
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
            <Badge variant="default" className="text-xs text-sky-400">
              24-HR CYCLE ACTIVE
            </Badge>
          )}
        </div>
      </div>

      {/* Central Showdown Arena */}
      <div className="grid grid-cols-1 lg:grid-cols-11 items-center gap-6 my-2">
        {/* Home Contender */}
        <div className="lg:col-span-5 rounded-2xl border border-sky-500/30 bg-slate-950/70 p-5 space-y-3 relative">
          <div className="flex items-center justify-between">
            <Badge variant="default" className="text-xs font-mono font-bold">
              RANK #{homeRank} • {homePoints} PTS
            </Badge>
            <span className="text-[11px] font-mono text-slate-500">HOME</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-sky-500/20 border-2 border-sky-400 text-sky-400 font-black text-xl shadow-lg shadow-sky-500/20">
              {match.homePlayer?.gamerTag?.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {match.homePlayer?.gamerTag}
              </h3>
              <p className="text-xs text-slate-300">{match.homePlayer?.fullName}</p>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">
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

        {/* VS / Score Divider */}
        <div className="lg:col-span-1 text-center flex flex-col items-center justify-center">
          {isLive || isFinished || isForfeit ? (
            <div className="rounded-2xl bg-slate-950 border border-yellow-500/40 p-3 font-mono text-2xl font-black text-yellow-400 shadow-xl">
              {match.homeScore ?? 0} : {match.awayScore ?? 0}
            </div>
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-500/20 border-2 border-yellow-400 text-yellow-400 font-black text-sm shadow-xl shadow-yellow-500/20 animate-bounce">
              VS
            </div>
          )}
        </div>

        {/* Away Contender */}
        <div className="lg:col-span-5 rounded-2xl border border-emerald-500/30 bg-slate-950/70 p-5 space-y-3 relative">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-500">AWAY</span>
            <Badge variant="green" className="text-xs font-mono font-bold">
              RANK #{awayRank} • {awayPoints} PTS
            </Badge>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 font-black text-xl shadow-lg shadow-emerald-500/20">
              {match.awayPlayer?.gamerTag?.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {match.awayPlayer?.gamerTag}
              </h3>
              <p className="text-xs text-slate-300">{match.awayPlayer?.fullName}</p>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">
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

      {/* Footer Info */}
      <div className="mt-5 pt-4 border-t border-yellow-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400">
        <span className="flex items-center gap-1.5">
          <Trophy className="h-4 w-4 text-yellow-400" />
          <span>Selected on merit from current league standings. Highest stakes clash of the day.</span>
        </span>

        <Link href="/dashboard" className="text-yellow-400 font-bold hover:underline flex items-center gap-1">
          <span>Go to Player Arena</span> →
        </Link>
      </div>
    </div>
  );
}
