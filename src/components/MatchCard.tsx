import { Badge } from "@/components/ui/badge";
import { Tv, Smartphone, Calendar, ShieldAlert, Eye, MessageSquare } from "lucide-react";

interface PlayerInfo {
  id: string;
  gamerTag: string;
  fullName: string;
  efootballId: string;
  whatsapp?: string | null;
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
    leg2HomeScore?: number | null;
    leg2AwayScore?: number | null;
    aggregateHomeScore?: number | null;
    aggregateAwayScore?: number | null;
    stage?: string | null;
    round: string;
    platform: string;
    status: string;
    matchDate: Date | string;
    notes?: string | null;
    streamUrl?: string | null;
    isMatchOfTheDay?: boolean;
    submissions?: Array<{ screenshotUrl?: string | null; status?: string }>;
  };
}

export default function MatchCard({ match }: MatchProps) {
  const isMotd = Boolean(match.isMatchOfTheDay);
  const isLive = match.status === "LIVE";
  const isFinished = match.status === "FINISHED";
  const isForfeit = match.status === "FORFEIT";
  const isTwoLegged =
    match.stage === "GROUP" ||
    match.stage === "QUARTER_FINAL" ||
    match.stage === "SEMI_FINAL" ||
    Boolean(match.aggregateHomeScore !== null && match.aggregateHomeScore !== undefined);

  const approvedSub =
    match.submissions?.find((s) => s.status === "APPROVED") ||
    match.submissions?.[0];

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
      className={`esports-card relative overflow-hidden rounded-2xl border p-3.5 sm:p-5 transition-all ${
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
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800/80 pb-2.5 mb-3 gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-slate-400">
          <Smartphone className="h-3.5 w-3.5 text-sky-400 shrink-0" />
          <Badge variant="outline" className="text-[10px] font-mono px-2 py-0 border-slate-700">
            {match.division || "eFootball"}
          </Badge>
          <Badge variant="yellow" className="text-[10px] font-mono px-2 py-0">
            {match.round}
          </Badge>
          {isTwoLegged && (
            <span className="text-indigo-400 text-[10px] font-bold hidden xs:inline">
              2-Legs
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {isMotd && (
            <Badge variant="yellow" className="text-[9px] sm:text-[10px] font-black animate-pulse">
              🌟 MOTD
            </Badge>
          )}
          {isLive && (
            <Badge variant="live" className="gap-1 px-2 py-0.5 text-[10px] sm:text-[11px]">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping" />
              LIVE
            </Badge>
          )}
          {isFinished && (
            <Badge variant="secondary" className="text-[10px] text-slate-300 bg-slate-800/90 font-bold">
              COMPLETED
            </Badge>
          )}
          {isForfeit && (
            <Badge variant="destructive" className="text-[10px] gap-1 font-bold">
              <ShieldAlert className="h-3 w-3" />
              FORFEIT
            </Badge>
          )}
          {!isLive && !isFinished && !isForfeit && (
            <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium font-mono">
              <Calendar className="h-3 w-3 text-yellow-400" />
              <span>{formattedDate}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Scoreboard: Fluid Responsive 3-Column Flexbox (Never breaks on mobile) */}
      <div className="flex items-center justify-between gap-2 sm:gap-4 my-2.5">
        {/* Home Player */}
        <div className="flex-1 min-w-0 flex items-center justify-end gap-2 sm:gap-3 text-right">
          <div className="min-w-0 flex-1">
            <h4 className="text-xs sm:text-base font-extrabold text-white tracking-tight truncate">
              {match.homePlayer?.gamerTag}
            </h4>
            <span className="text-[10px] sm:text-[11px] text-slate-400 block truncate">
              {match.homePlayer?.fullName}
            </span>
            <span className="text-[9px] sm:text-[10px] text-slate-500 font-mono hidden sm:block truncate">
              ID: {match.homePlayer?.efootballId}
            </span>
          </div>
          <div className="flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-sky-600 border border-sky-400/30 font-black text-xs sm:text-sm text-white shadow-md">
            {match.homePlayer?.gamerTag ? match.homePlayer.gamerTag.slice(0, 2).toUpperCase() : "HM"}
          </div>
        </div>

        {/* Center Score / VS Box */}
        <div className="shrink-0 flex flex-col items-center justify-center px-1">
          {isLive || isFinished || isForfeit ? (
            <div className="flex items-center gap-1 rounded-xl bg-slate-950 border border-slate-800 px-2.5 sm:px-3.5 py-1 font-mono text-sm sm:text-lg font-black text-white shadow-inner">
              <span className={match.homeScore! > match.awayScore! ? "text-yellow-400" : "text-white"}>
                {match.homeScore ?? 0}
              </span>
              <span className="text-slate-600">:</span>
              <span className={match.awayScore! > match.homeScore! ? "text-yellow-400" : "text-white"}>
                {match.awayScore ?? 0}
              </span>
            </div>
          ) : (
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-slate-800/90 border border-slate-700 text-[10px] sm:text-xs font-black text-slate-400">
              VS
            </div>
          )}
        </div>

        {/* Away Player */}
        <div className="flex-1 min-w-0 flex items-center justify-start gap-2 sm:gap-3 text-left">
          <div className="flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 border border-emerald-400/30 font-black text-xs sm:text-sm text-white shadow-md">
            {match.awayPlayer?.gamerTag ? match.awayPlayer.gamerTag.slice(0, 2).toUpperCase() : "AW"}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-xs sm:text-base font-extrabold text-white tracking-tight truncate">
              {match.awayPlayer?.gamerTag}
            </h4>
            <span className="text-[10px] sm:text-[11px] text-slate-400 block truncate">
              {match.awayPlayer?.fullName}
            </span>
            <span className="text-[9px] sm:text-[10px] text-slate-500 font-mono hidden sm:block truncate">
              ID: {match.awayPlayer?.efootballId}
            </span>
          </div>
        </div>
      </div>

      {/* Aggregate Score for 2-Legged Tournaments */}
      {isTwoLegged && match.aggregateHomeScore !== null && match.aggregateHomeScore !== undefined && (
        <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-center text-[10px] sm:text-[11px]">
          <span className="font-mono font-black text-amber-300 bg-amber-950/40 border border-amber-500/30 px-2.5 py-1 rounded-lg text-center break-words max-w-full inline-block leading-relaxed">
            Aggregate: {match.homePlayer?.gamerTag} {match.aggregateHomeScore} - {match.aggregateAwayScore} {match.awayPlayer?.gamerTag}
            {match.leg2HomeScore !== null && match.leg2HomeScore !== undefined && (
              <span className="text-slate-400 ml-1.5 font-normal block xs:inline">
                (Leg 1: {match.homeScore}-{match.awayScore}, Leg 2: {match.leg2HomeScore}-{match.leg2AwayScore})
              </span>
            )}
          </span>
        </div>
      )}

      {/* Match Footer */}
      <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-2 text-xs">
        {match.notes ? (
          <p className="text-slate-400 italic text-[10px] sm:text-[11px] truncate max-w-[200px] sm:max-w-xs">
            &quot;{match.notes}&quot;
          </p>
        ) : (
          <span className="text-[10px] text-slate-500 font-mono">10 Mins • {match.platform}</span>
        )}

        <div className="flex items-center gap-2 ml-auto">
          {approvedSub?.screenshotUrl && (
            <a
              href={approvedSub.screenshotUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-400 hover:text-sky-300 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg transition"
            >
              <Eye className="h-3 w-3" />
              <span>Score Proof</span>
            </a>
          )}

          {match.streamUrl && (
            <a
              href={match.streamUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs font-bold text-red-400 hover:text-red-300 ml-auto"
            >
              <Tv className="h-3.5 w-3.5" />
              <span>Stream</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
