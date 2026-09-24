"use client";

import { Award, Flame, Zap, Shield, Smartphone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { resolvePlayerAvatar, findTeam } from "@/lib/teams";

interface PlayerProps {
  player: {
    id: string;
    gamerTag: string;
    fullName: string;
    efootballId: string;
    position?: string;
    division?: string;
    realTeam?: string;
    avatar?: string;
    overallRating: number;
    goals: number;
    assists: number;
    matchesPlayed: number;
    cleanSheets: number;
    mvpAwards: number;
  };
  rank?: number;
}

export default function PlayerCard({ player, rank }: PlayerProps) {
  const avatarUrl = player.avatar || resolvePlayerAvatar(player);
  const teamObj = player.realTeam ? findTeam(player.realTeam) : null;

  return (
    <div className="esports-card group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5 transition-all hover:border-sky-500/50 shadow-lg">
      {/* Top Banner with Rating & Position */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap min-w-0">
          {rank && (
            <span
              className={`flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-lg text-xs font-black aspect-square ${
                rank === 1
                  ? "bg-yellow-500 text-slate-950 font-black shadow-lg shadow-yellow-500/30"
                  : rank === 2
                  ? "bg-slate-300 text-slate-950 font-black"
                  : rank === 3
                  ? "bg-amber-600 text-white font-black"
                  : "bg-slate-800 text-slate-300"
              }`}
            >
              #{rank}
            </span>
          )}
          <Badge variant="secondary" className="font-mono text-[10px] sm:text-xs font-bold text-sky-400">
            {player.position || "CF"}
          </Badge>
          {player.division && (
            <Badge variant="yellow" className="text-[9px] sm:text-[10px] font-bold">
              {player.division}
            </Badge>
          )}
        </div>

        {/* eFootball Card OVR Rating */}
        <div className="flex flex-col items-center justify-center rounded-xl bg-gradient-to-b from-yellow-400 to-amber-600 px-2 sm:px-2.5 py-1 text-slate-950 shadow-md shrink-0">
          <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-tighter">OVR</span>
          <span className="text-base sm:text-lg font-black leading-none">{player.overallRating}</span>
        </div>
      </div>

      {/* Player Identity with Responsive Avatar */}
      <div className="mt-3.5 flex items-center gap-3">
        <div className="flex h-11 w-11 sm:h-13 sm:w-13 md:h-14 md:w-14 shrink-0 aspect-square items-center justify-center rounded-2xl bg-white/95 border border-slate-700/80 p-1.5 shadow-md overflow-hidden group-hover:border-sky-500/50 transition-colors">
          <img
            src={avatarUrl}
            alt={player.realTeam || player.gamerTag}
            className="h-full w-full object-contain filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]"
            loading="lazy"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(player.gamerTag || "player")}`;
            }}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h4 className="text-sm sm:text-base font-extrabold text-white group-hover:text-sky-400 transition-colors truncate">
              {player.gamerTag}
            </h4>
            {player.realTeam && (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-950 text-amber-400 font-bold border border-amber-500/30 truncate">
                {teamObj?.shortName || player.realTeam}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 truncate mt-0.5">{player.fullName}</p>
          <span className="inline-block text-[10px] sm:text-[11px] font-mono text-slate-500 truncate">
            ID: {player.efootballId}
          </span>
        </div>
      </div>

      {/* Mobile Badge */}
      <div className="mt-3 flex items-center gap-2 rounded-lg bg-slate-950/60 p-2 border border-slate-800/80 text-xs text-slate-400">
        <Smartphone className="h-3.5 w-3.5 text-sky-400" />
        <span className="font-semibold text-slate-300">eFootball Mobile Athlete</span>
      </div>

      {/* Player Stats Grid */}
      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-800/80 pt-3 text-center">
        <div className="rounded-lg bg-slate-950/40 p-1.5">
          <span className="text-[10px] text-slate-400 font-bold block uppercase">Goals</span>
          <span className="text-base font-black text-yellow-400">{player.goals}</span>
        </div>
        <div className="rounded-lg bg-slate-950/40 p-1.5">
          <span className="text-[10px] text-slate-400 font-bold block uppercase">Assists</span>
          <span className="text-base font-black text-sky-400">{player.assists}</span>
        </div>
        <div className="rounded-lg bg-slate-950/40 p-1.5">
          <span className="text-[10px] text-slate-400 font-bold block uppercase">MVP</span>
          <span className="text-base font-black text-emerald-400">{player.mvpAwards}</span>
        </div>
      </div>
    </div>
  );
}
