import { Badge } from "@/components/ui/badge";
import { Tv, Smartphone, Calendar, ShieldAlert, Eye, MessageSquare } from "lucide-react";
import { resolvePlayerAvatar, findTeam } from "@/lib/teams";

interface PlayerInfo {
  id: string;
  gamerTag: string;
  fullName: string;
  efootballId: string;
  whatsapp?: string | null;
  platform?: string;
  division?: string;
  avatar?: string | null;
  realTeam?: string | null;
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
          ? "border-secondary/60 bg-gradient-to-br from-card via-background to-secondary/20 shadow-lg"
          : isLive
          ? "border-destructive/50 bg-card/90 shadow-lg"
          : isForfeit
          ? "border-destructive/30 bg-destructive/10 hover:border-destructive/50"
          : "border-border bg-card/60 hover:border-border"
      }`}
    >
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between border-b border-border/80 pb-2.5 mb-3 gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-muted-foreground">
          <Smartphone className="h-3.5 w-3.5 text-primary shrink-0" />
          <Badge variant="outline" className="text-xs font-mono px-2 py-0 border-border">
            {match.division || "eFootball"}
          </Badge>
          <Badge variant="yellow" className="text-xs font-mono px-2 py-0">
            {match.round}
          </Badge>
          {isTwoLegged && (
            <span className="text-primary text-xs font-bold hidden xs:inline">
              2-Legs
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {isMotd && (
            <Badge variant="yellow" className="text-xs sm:text-xs font-black animate-pulse">
              🌟 MOTD
            </Badge>
          )}
          {isLive && (
            <Badge variant="live" className="gap-1 px-2 py-0.5 text-xs sm:text-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-destructive animate-ping" />
              LIVE
            </Badge>
          )}
          {isFinished && (
            <Badge variant="secondary" className="text-xs text-foreground bg-muted/90 font-bold">
              COMPLETED
            </Badge>
          )}
          {isForfeit && (
            <Badge variant="destructive" className="text-xs gap-1 font-bold">
              <ShieldAlert className="h-3 w-3" />
              FORFEIT
            </Badge>
          )}
          {!isLive && !isFinished && !isForfeit && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground font-medium font-mono">
              <Calendar className="h-3 w-3 text-secondary" />
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
            <div className="flex items-center justify-end gap-1.5 flex-wrap">
              {match.homePlayer?.realTeam && (
                <span className="text-xs font-mono px-1.5 py-0.2 rounded bg-muted text-primary font-bold border border-primary/20">
                  {findTeam(match.homePlayer.realTeam)?.shortName || match.homePlayer.realTeam}
                </span>
              )}
              <h4 className="text-xs sm:text-base font-extrabold text-white tracking-tight truncate">
                {match.homePlayer?.gamerTag}
              </h4>
            </div>
            <span className="text-xs sm:text-xs text-muted-foreground block truncate">
              {match.homePlayer?.fullName}
            </span>
            {match.homePlayer?.realTeam && (
              <span className="text-xs text-muted-foreground block truncate font-medium">
                {match.homePlayer.realTeam}
              </span>
            )}
          </div>
          <div className="flex h-9 w-9 sm:h-11 sm:w-11 md:h-12 md:w-12 shrink-0 aspect-square items-center justify-center rounded-xl bg-card border border-border p-1 font-black text-xs sm:text-sm text-white shadow-md overflow-hidden">
            {match.homePlayer ? (
              <img
                src={resolvePlayerAvatar(match.homePlayer)}
                alt={match.homePlayer?.realTeam || match.homePlayer?.gamerTag}
                className="h-full w-full object-contain filter drop-shadow-sm"
                loading="lazy"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(match.homePlayer?.gamerTag || "player")}`;
                }}
              />
            ) : (
              "HM"
            )}
          </div>
        </div>

        {/* Center Score / VS Box */}
        <div className="shrink-0 flex flex-col items-center justify-center px-1">
          {isLive || isFinished || isForfeit ? (
            <div className="flex items-center gap-1 rounded-xl bg-background border border-border px-2 sm:px-3.5 py-1 font-mono text-xs sm:text-base md:text-lg font-black text-white shadow-inner">
              <span className={match.homeScore! > match.awayScore! ? "text-secondary" : "text-white"}>
                {match.homeScore ?? 0}
              </span>
              <span className="text-muted-foreground">:</span>
              <span className={match.awayScore! > match.homeScore! ? "text-secondary" : "text-white"}>
                {match.awayScore ?? 0}
              </span>
            </div>
          ) : (
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-muted/90 border border-border text-xs sm:text-xs font-black text-muted-foreground">
              VS
            </div>
          )}
        </div>

        {/* Away Player */}
        <div className="flex-1 min-w-0 flex items-center justify-start gap-2 sm:gap-3 text-left">
          <div className="flex h-9 w-9 sm:h-11 sm:w-11 md:h-12 md:w-12 shrink-0 aspect-square items-center justify-center rounded-xl bg-card border border-border p-1 font-black text-xs sm:text-sm text-white shadow-md overflow-hidden">
            {match.awayPlayer ? (
              <img
                src={resolvePlayerAvatar(match.awayPlayer)}
                alt={match.awayPlayer?.realTeam || match.awayPlayer?.gamerTag}
                className="h-full w-full object-contain filter drop-shadow-sm"
                loading="lazy"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(match.awayPlayer?.gamerTag || "player")}`;
                }}
              />
            ) : (
              "AW"
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-start gap-1.5 flex-wrap">
              <h4 className="text-xs sm:text-base font-extrabold text-white tracking-tight truncate">
                {match.awayPlayer?.gamerTag}
              </h4>
              {match.awayPlayer?.realTeam && (
                <span className="text-xs font-mono px-1.5 py-0.2 rounded bg-muted text-primary font-bold border border-primary/20">
                  {findTeam(match.awayPlayer.realTeam)?.shortName || match.awayPlayer.realTeam}
                </span>
              )}
            </div>
            <span className="text-xs sm:text-xs text-muted-foreground block truncate">
              {match.awayPlayer?.fullName}
            </span>
            {match.awayPlayer?.realTeam && (
              <span className="text-xs text-muted-foreground block truncate font-medium">
                {match.awayPlayer.realTeam}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Aggregate Score for 2-Legged Tournaments */}
      {isTwoLegged && match.aggregateHomeScore !== null && match.aggregateHomeScore !== undefined && (
        <div className="mt-2.5 pt-2 border-t border-border/60 flex items-center justify-center text-xs sm:text-xs">
          <span className="font-mono font-black text-secondary bg-secondary/40 border border-secondary/30 px-2.5 py-1 rounded-lg text-center break-words max-w-full inline-block leading-relaxed">
            Aggregate: {match.homePlayer?.gamerTag} {match.aggregateHomeScore} - {match.aggregateAwayScore} {match.awayPlayer?.gamerTag}
            {match.leg2HomeScore !== null && match.leg2HomeScore !== undefined && (
              <span className="text-muted-foreground ml-1.5 font-normal block xs:inline">
                (Leg 1: {match.homeScore}-{match.awayScore}, Leg 2: {match.leg2HomeScore}-{match.leg2AwayScore})
              </span>
            )}
          </span>
        </div>
      )}

      {/* Match Footer */}
      <div className="mt-3 pt-2.5 border-t border-border/60 flex flex-wrap items-center justify-between gap-2 text-xs">
        {match.notes ? (
          <p className="text-muted-foreground italic text-xs sm:text-xs truncate w-52 sm:max-w-xs">
            &quot;{match.notes}&quot;
          </p>
        ) : (
          <span className="text-xs text-muted-foreground font-mono">10 Mins • {match.platform}</span>
        )}

        <div className="flex items-center gap-2 ml-auto">
          {approvedSub?.screenshotUrl && (
            <a
              href={approvedSub.screenshotUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-primary bg-card border border-border px-2.5 py-1 rounded-lg transition"
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
              className="inline-flex items-center gap-1 text-xs font-bold text-destructive hover:text-destructive ml-auto"
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
