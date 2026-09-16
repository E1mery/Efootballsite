import { Badge } from "@/components/ui/badge";
import { Tv, Smartphone, Calendar, ShieldAlert } from "lucide-react";

interface PlayerInfo {
  id: string;
  gamerTag: string;
  fullName: string;
  efootballId: string;
  platform?: string;
  division?: string;
}

interface MatchProps {
  match: {
    id: string;
    division?: string;
    homePlayer: PlayerInfo;
    awayPlayer: PlayerInfo;
    homeScore: number | null;
    awayScore: number | null;
    round: string;
    platform: string;
    status: string;
    matchDate: Date | string;
    notes?: string | null;
    streamUrl?: string | null;
    isMatchOfTheDay?: boolean;
  };
}

export default function MatchCard({ match }: MatchProps) {
  const isMotd = Boolean(match.isMatchOfTheDay);
  const isLive = match.status === "LIVE";
  const isFinished = match.status === "FINISHED";
  const isForfeit = match.status === "FORFEIT";
  const dateObj = new Date(match.matchDate);
  const formattedTime = dateObj.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const formattedDate = dateObj.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <div
      className={`esports-card relative overflow-hidden rounded-2xl border p-4 sm:p-5 transition-all ${
        isMotd
          ? "border-yellow-500/60 bg-gradient-to-br from-slate-900 via-slate-950 to-yellow-950/20 shadow-lg shadow-yellow-500/10"
          : isLive
          ? "border-red-500/50 bg-slate-900/90 shadow-lg shadow-red-500/10"
          : isForfeit
          ? "border-red-500/30 bg-red-950/10 hover:border-red-500/50"
          : "border-slate-800 bg-slate-900/60 hover:border-slate-700"
      }`}
    >
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-3 text-xs">
        <div className="flex items-center gap-2 text-slate-400">
          <Smartphone className="h-3.5 w-3.5 text-sky-400" />
          <span className="font-semibold text-slate-300">
            {match.division ? `${match.division} • ` : ""}
            {match.round}
          </span>
          <span className="text-slate-600">•</span>
          <span className="text-emerald-400 font-mono text-[10px]">Mobile Gaming</span>
        </div>

        <div className="flex items-center gap-1.5">
          {isMotd && (
            <Badge variant="yellow" className="text-[10px] font-black">
              🌟 MOTD
            </Badge>
          )}
          {isLive && (
            <Badge variant="live" className="gap-1 px-2 py-0.5 text-[11px]">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping" />
              LIVE MATCH
            </Badge>
          )}
          {isFinished && (
            <Badge variant="secondary" className="text-[10px] text-slate-400 bg-slate-800/80">
              FT RESULT
            </Badge>
          )}
          {isForfeit && (
            <Badge variant="destructive" className="text-[10px] gap-1">
              <ShieldAlert className="h-3 w-3" />
              FORFEIT / WALKOVER
            </Badge>
          )}
          {!isLive && !isFinished && !isForfeit && (
            <div className="flex items-center gap-1.5 text-slate-400 font-medium">
              <Calendar className="h-3 w-3 text-yellow-400" />
              <span>{formattedDate} - {formattedTime}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Scoreboard */}
      <div className="grid grid-cols-7 items-center gap-2 my-2">
        {/* Home Player */}
        <div className="col-span-3 flex items-center justify-end gap-3 text-right">
          <div>
            <h4 className="text-sm sm:text-base font-extrabold text-white tracking-wide truncate max-w-[130px] sm:max-w-[180px]">
              {match.homePlayer?.gamerTag}
            </h4>
            <span className="text-[11px] text-slate-400 font-medium block truncate max-w-[130px]">
              {match.homePlayer?.fullName}
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              {match.homePlayer?.efootballId}
            </span>
          </div>
          <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-sky-600 border border-sky-400/30 font-black text-xs sm:text-sm text-white shadow-md">
            {match.homePlayer?.gamerTag.slice(0, 2).toUpperCase()}
          </div>
        </div>

        {/* Score or VS Badge */}
        <div className="col-span-1 flex flex-col items-center justify-center">
          {isLive || isFinished || isForfeit ? (
            <div className="flex items-center gap-1.5 rounded-lg bg-slate-950/80 border border-slate-800 px-2.5 sm:px-3 py-1 font-mono text-base sm:text-xl font-black text-white shadow-inner">
              <span className={match.homeScore! > match.awayScore! ? "text-yellow-400" : "text-white"}>
                {match.homeScore}
              </span>
              <span className="text-slate-600">:</span>
              <span className={match.awayScore! > match.homeScore! ? "text-yellow-400" : "text-white"}>
                {match.awayScore}
              </span>
            </div>
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800/80 border border-slate-700 text-xs font-bold text-slate-400">
              VS
            </div>
          )}
        </div>

        {/* Away Player */}
        <div className="col-span-3 flex items-center justify-start gap-3 text-left">
          <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-600 border border-emerald-400/30 font-black text-xs sm:text-sm text-white shadow-md">
            {match.awayPlayer?.gamerTag.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h4 className="text-sm sm:text-base font-extrabold text-white tracking-wide truncate max-w-[130px] sm:max-w-[180px]">
              {match.awayPlayer?.gamerTag}
            </h4>
            <span className="text-[11px] text-slate-400 font-medium block truncate max-w-[130px]">
              {match.awayPlayer?.fullName}
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              {match.awayPlayer?.efootballId}
            </span>
          </div>
        </div>
      </div>

      {/* Match Footer */}
      {(match.notes || match.streamUrl) && (
        <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-xs">
          {match.notes ? (
            <p className="text-slate-400 italic text-[11px] truncate max-w-[80%]">
              "{match.notes}"
            </p>
          ) : <div />}

          {match.streamUrl && (
            <a
              href={match.streamUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-xs font-bold text-red-400 hover:text-red-300 ml-auto"
            >
              <Tv className="h-3.5 w-3.5" />
              <span>Watch Broadcast</span>
            </a>
          )}
        </div>
      )}
    </div>
  );
}
