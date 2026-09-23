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
    <div className="esports-card group relative overflow-hidden rounded-xl border border-border bg-card/70 p-5 transition-all hover:border-primary/50">
      {/* Top Banner with Rating & Position */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          {rank && (
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-black ${
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
        <div className="flex flex-col items-center justify-center rounded-xl bg-gradient-to-b from-secondary to-secondary px-2.5 py-1 text-secondary-foreground shadow-md">
          <span className="text-xs font-black uppercase tracking-tighter">OVR</span>
          <span className="text-lg font-black leading-none">{player.overallRating}</span>
        </div>
      </div>

      {/* Player Identity */}
      <div className="mt-3">
        <h4 className="text-base font-extrabold text-white group-hover:text-primary transition-colors">
          {player.gamerTag}
        </h4>
        <p className="text-xs text-muted-foreground">{player.fullName}</p>
        <span className="inline-block mt-0.5 text-xs font-mono text-muted-foreground">
          Konami ID: {player.efootballId}
        </span>
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
