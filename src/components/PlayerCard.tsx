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
    <div className="esports-card group relative overflow-hidden rounded-2xl border border-border bg-card/70 p-4 sm:p-5 transition-all hover:border-primary/50 shadow-lg">
      {/* Top Banner with Rating & Position */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap min-w-0">
          {rank && (
            <span
              className={`flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-lg text-xs font-black aspect-square ${
                rank === 1
                  ? "bg-secondary text-secondary-foreground font-black shadow-lg"
                  : rank === 2
                  ? "bg-muted text-secondary-foreground font-black"
                  : rank === 3
                  ? "bg-secondary text-white font-black"
                  : "bg-muted text-foreground"
              }`}
            >
              #{rank}
            </span>
          )}
          <Badge variant="secondary" className="font-mono text-xs font-bold text-primary">
            {player.position || "CF"}
          </Badge>
          {player.division && (
            <Badge variant="yellow" className="text-xs">
              {player.division}
            </Badge>
          )}
        </div>

        {/* eFootball Card OVR Rating */}
        <div className="flex flex-col items-center justify-center rounded-xl bg-gradient-to-b from-secondary to-secondary px-2 sm:px-2.5 py-1 text-secondary-foreground shadow-md shrink-0">
          <span className="text-xs font-black uppercase tracking-tighter">OVR</span>
          <span className="text-base sm:text-lg font-black leading-none">{player.overallRating}</span>
        </div>
      </div>

      {/* Player Identity with Responsive Avatar */}
      <div className="mt-3.5 flex items-center gap-3">
        <div className="flex h-11 w-11 sm:h-12 sm:w-12 md:h-14 md:w-14 shrink-0 aspect-square items-center justify-center rounded-2xl bg-card border border-border p-1.5 shadow-md overflow-hidden group-hover:border-primary/50 transition-colors">
          <img
            src={avatarUrl}
            alt={player.realTeam || player.gamerTag}
            className="h-full w-full object-contain filter drop-shadow-sm"
            loading="lazy"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(player.gamerTag || "player")}`;
            }}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h4 className="text-sm sm:text-base font-extrabold text-white group-hover:text-primary transition-colors truncate">
              {player.gamerTag}
            </h4>
            {player.realTeam && (
              <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-muted text-primary font-bold border border-primary/20 truncate">
                {teamObj?.shortName || player.realTeam}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate mt-0.5">{player.fullName}</p>
          <span className="inline-block text-xs font-mono text-muted-foreground truncate">
            Konami ID: {player.efootballId}
          </span>
        </div>
      </div>

      {/* Mobile Badge */}
      <div className="mt-3 flex items-center gap-2 rounded-lg bg-background/60 p-2 border border-border/80 text-xs text-muted-foreground">
        <Smartphone className="h-3.5 w-3.5 text-primary" />
        <span className="font-semibold text-foreground">eFootball Mobile Athlete</span>
      </div>

      {/* Player Stats Grid */}
      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border/80 pt-3 text-center">
        <div className="rounded-lg bg-background/40 p-1.5">
          <span className="text-xs text-muted-foreground font-bold block uppercase">Goals</span>
          <span className="text-base font-black text-secondary">{player.goals}</span>
        </div>
        <div className="rounded-lg bg-background/40 p-1.5">
          <span className="text-xs text-muted-foreground font-bold block uppercase">Assists</span>
          <span className="text-base font-black text-primary">{player.assists}</span>
        </div>
        <div className="rounded-lg bg-background/40 p-1.5">
          <span className="text-xs text-muted-foreground font-bold block uppercase">MVP</span>
          <span className="text-base font-black text-primary">{player.mvpAwards}</span>
        </div>
      </div>
    </div>
  );
}
