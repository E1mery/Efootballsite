import { Award, Flame, Zap, Shield, Smartphone } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PlayerProps {
  player: {
    id: string;
    gamerTag: string;
    fullName: string;
    efootballId: string;
    position?: string;
    division?: string;
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
  return (
    <div className="esports-card group relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/70 p-5 transition-all hover:border-sky-500/50">
      {/* Top Banner with Rating & Position */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          {rank && (
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-black ${
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
          <Badge variant="secondary" className="font-mono text-xs font-bold text-sky-400">
            {player.position || "CF"}
          </Badge>
          {player.division && (
            <Badge variant="yellow" className="text-[10px]">
              {player.division}
            </Badge>
          )}
        </div>

        {/* eFootball Card OVR Rating */}
        <div className="flex flex-col items-center justify-center rounded-xl bg-gradient-to-b from-yellow-400 to-amber-600 px-2.5 py-1 text-slate-950 shadow-md">
          <span className="text-[10px] font-black uppercase tracking-tighter">OVR</span>
          <span className="text-lg font-black leading-none">{player.overallRating}</span>
        </div>
      </div>

      {/* Player Identity */}
      <div className="mt-3">
        <h4 className="text-base font-extrabold text-white group-hover:text-sky-400 transition-colors">
          {player.gamerTag}
        </h4>
        <p className="text-xs text-slate-400">{player.fullName}</p>
        <span className="inline-block mt-0.5 text-[11px] font-mono text-slate-500">
          Konami ID: {player.efootballId}
        </span>
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
