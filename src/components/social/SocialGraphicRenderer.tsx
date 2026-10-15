"use client";

import Image from "next/image";
import {
  Trophy,
  Swords,
  Shield,
  ShieldCheck,
  Calendar,
  Clock,
  Flame,
  Globe,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Minus,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SocialGraphicData, SocialEventCategory } from "@/lib/socialFeedTypes";
import { getBackgroundByKeyOrPath } from "@/lib/socialBackgroundEngine";

interface SocialGraphicRendererProps {
  data: SocialGraphicData;
  headline?: string;
  season?: string | null;
  division?: string | null;
  postType?: string;
  mediaUrl?: string | null;
}

export default function SocialGraphicRenderer({
  data,
  headline,
  season,
  division,
  postType = "",
  mediaUrl,
}: SocialGraphicRendererProps) {
  const bg = getBackgroundByKeyOrPath(data.backgroundKey);
  const bgImage = mediaUrl || bg.imagePath;
  const upperType = postType.toUpperCase();
  const isResult = data.isConfirmedResult || upperType.endsWith("_RESULT");
  const isMatchCategory = data.category === "MATCHES_RESULTS" || Boolean(data.homeGamerTag && data.awayGamerTag);
  const isDrawCategory = data.category === "COMPETITION_DRAWS" || upperType.includes("DRAW");
  const isStandingsCategory = data.category === "STANDINGS_STATS" || upperType.includes("STANDINGS");
  const isSeasonCategory = data.category === "SEASON_ACTIVITIES" || upperType.includes("SEASON") || upperType.includes("KICKOFF");
  const isNoticeCategory = data.category === "ADMIN_ANNOUNCEMENTS" || upperType.includes("NOTICE");

  return (
    <div className="relative w-full ig-post-aspect ig-stadium-card flex flex-col justify-between p-3.5 sm:p-5 select-none overflow-hidden rounded-t-3xl border-b border-border">
      {/* 1. Sharp, Vibrant Stadium Background (Zero Blur, Vivid Atmosphere) */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
        <Image
          src={bgImage}
          alt={bg.name}
          fill
          unoptimized
          sizes="(max-width: 768px) 100vw, 600px"
          className="object-cover object-center"
          priority
        />
        {/* Soft edge vignette to preserve text contrast while stadium pitch & arena stay bright and clear */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-transparent to-background/45" />
      </div>

      {/* 2. Top Broadcast Header Bar */}
      <div className="relative z-10 flex items-center justify-between gap-2 border-b border-border/40 pb-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-7 w-7 rounded-xl bg-card/90 border border-border flex items-center justify-center p-1 shadow-md shrink-0">
            <Image
              src="/logo.png"
              alt="Rwanda eFootball League"
              width={24}
              height={24}
              className="object-contain"
            />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-black text-xs uppercase tracking-wider text-white truncate">
              {season || "Season 1 (2026)"}
            </span>
            <span className="text-xs text-muted-foreground font-mono truncate">
              RWANDA eFOOTBALL LEAGUE
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Badge
            variant={data.badgeVariant || "default"}
            className="text-xs font-black uppercase tracking-wider px-2.5 py-0.5 shadow-md"
          >
            {data.badgeLabel || division || "Official Broadcast"}
          </Badge>
        </div>
      </div>

      {/* 3. Dynamic Centerpiece Graphic Template */}
      <div className="relative z-10 my-auto w-full py-3 flex flex-col items-center justify-center">
        {/* Banner Headline */}
        <div className="mb-3 sm:mb-4 text-center max-w-md mx-auto">
          <span className="inline-block px-3 sm:px-4 py-1 rounded-full text-xs sm:text-sm font-black uppercase tracking-widest bg-gradient-to-r from-primary via-secondary to-primary text-black shadow-lg">
            {data.bannerTitle || headline || "RWANDA eFOOTBALL LEAGUE"}
          </span>
          {data.subtitle && (
            <p className="text-xs font-mono font-bold text-muted-foreground uppercase tracking-widest mt-1">
              {data.subtitle}
            </p>
          )}
        </div>

        {/* ========================================================================= */}
        {/* TEMPLATE A: MATCH & RESULTS (MOTD, MOTW, DERBIES, PREVIEWS, FINALS) */}
        {/* ========================================================================= */}
        {isMatchCategory && data.homeGamerTag && data.awayGamerTag ? (
          <div className="w-full flex items-center justify-between gap-2 sm:gap-4 px-1 sm:px-2">
            {/* Home Side */}
            <div className="flex-1 flex flex-col items-center text-center space-y-1.5 min-w-0">
              <div className="relative h-16 w-16 sm:h-24 sm:w-24 rounded-2xl sm:rounded-3xl bg-card/90 border border-border p-2 sm:p-3 shadow-2xl flex items-center justify-center hover:scale-105 transition-transform">
                <img
                  src={data.homeLogo || "/logo.png"}
                  alt={data.homeGamerTag}
                  className="h-full w-full object-contain filter drop-shadow-md"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(data.homeGamerTag || "Home")}`;
                  }}
                />
              </div>
              <div className="space-y-0.5 max-w-full">
                <p className="font-black text-xs sm:text-base text-white truncate drop-shadow-sm">
                  {data.homeGamerTag}
                </p>
                <p className="text-xs font-semibold text-muted-foreground truncate">
                  {data.homeTeamName || "Club"}
                </p>
              </div>
            </div>

            {/* Center: Scoreline or VS Badge (STRICT: NO GOALSCORERS) */}
            <div className="shrink-0 flex flex-col items-center justify-center px-1 sm:px-2 z-10">
              {isResult ? (
                <div className="flex flex-col items-center space-y-1.5">
                  <div className="flex items-center gap-2 sm:gap-3 bg-card/95 px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-2xl border border-border shadow-2xl">
                    <span className="text-xl sm:text-4xl font-black text-white font-mono tracking-tight">
                      {data.homeScore ?? 0}
                    </span>
                    <span className="text-muted-foreground font-black text-sm sm:text-base">-</span>
                    <span className="text-xl sm:text-4xl font-black text-white font-mono tracking-tight">
                      {data.awayScore ?? 0}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-destructive uppercase tracking-widest">
                    CONFIRMED RESULT
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center space-y-1">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-gradient-to-br from-primary/30 via-background to-secondary/30 border border-border flex items-center justify-center shadow-xl">
                    <span className="font-black text-xs sm:text-sm text-white tracking-widest">
                      VS
                    </span>
                  </div>
                  {data.kickoffTime && (
                    <span className="text-xs font-mono font-bold text-muted-foreground uppercase">
                      {data.kickoffTime} CAT
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Away Side */}
            <div className="flex-1 flex flex-col items-center text-center space-y-1.5 min-w-0">
              <div className="relative h-16 w-16 sm:h-24 sm:w-24 rounded-2xl sm:rounded-3xl bg-card/90 border border-border p-2 sm:p-3 shadow-2xl flex items-center justify-center hover:scale-105 transition-transform">
                <img
                  src={data.awayLogo || "/logo.png"}
                  alt={data.awayGamerTag}
                  className="h-full w-full object-contain filter drop-shadow-md"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(data.awayGamerTag || "Away")}`;
                  }}
                />
              </div>
              <div className="space-y-0.5 max-w-full">
                <p className="font-black text-xs sm:text-base text-white truncate drop-shadow-sm">
                  {data.awayGamerTag}
                </p>
                <p className="text-xs font-semibold text-muted-foreground truncate">
                  {data.awayTeamName || "Club"}
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {/* ========================================================================= */}
        {/* TEMPLATE B: CONFIRMED GROUP DRAW RESULTS (4 GROUPS WITH REAL ATHLETES) */}
        {/* ========================================================================= */}
        {isDrawCategory && data.groups && data.groups.length > 0 ? (
          <div className="w-full grid grid-cols-2 gap-2 sm:gap-2.5 max-w-lg mx-auto">
            {data.groups.map((group) => (
              <div
                key={group.groupName}
                className="rounded-2xl border border-border/80 bg-card/90 p-2 sm:p-2.5 shadow-xl"
              >
                <div className="flex items-center justify-between border-b border-border/60 pb-1 mb-1.5">
                  <span className="font-black text-xs uppercase tracking-wider text-secondary">
                    {group.groupName}
                  </span>
                  <Globe className="h-3 w-3 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  {group.slots.slice(0, 4).map((slot, sIdx) => (
                    <div
                      key={sIdx}
                      className="flex items-center gap-1.5 text-xs bg-background/60 rounded-lg p-1 border border-border/40"
                    >
                      <img
                        src={slot.avatar || "/logo.png"}
                        alt={slot.gamerTag}
                        className="h-4 w-4 rounded-full object-contain shrink-0"
                      />
                      <span className="font-bold text-white truncate text-xs flex-1">
                        {slot.gamerTag}
                      </span>
                      {slot.division && (
                        <span className="text-xs text-muted-foreground font-mono">
                          {slot.division.replace("Division ", "D")}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {/* ========================================================================= */}
        {/* TEMPLATE C: UPCOMING DRAW ANNOUNCEMENT (TROPHY + KICKOFF TIME) */}
        {/* ========================================================================= */}
        {isDrawCategory && !data.groups && (
          <div className="text-center space-y-3 py-2">
            {data.trophyAsset && (
              <div className="relative h-24 w-24 sm:h-32 sm:w-32 mx-auto drop-shadow-2xl">
                <Image
                  src={data.trophyAsset}
                  alt="Competition Trophy"
                  fill
                  className="object-contain"
                />
              </div>
            )}
            <div className="space-y-1">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-secondary">
                LIVE ANIMATED DRAW EVENT
              </span>
              <p className="text-sm sm:text-base font-black text-white">
                {data.kickoffDate && data.kickoffTime
                  ? `${data.kickoffDate} at ${data.kickoffTime} CAT`
                  : "DATE TO BE ANNOUNCED"}
              </p>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                Watch the live broadcast event on the Continental Cups page.
              </p>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TEMPLATE D: STANDINGS TABLE SNAPSHOT */}
        {/* ========================================================================= */}
        {isStandingsCategory && data.standingsRows && data.standingsRows.length > 0 ? (
          <div className="w-full max-w-lg mx-auto rounded-2xl border border-border bg-card/95 p-2 sm:p-3 shadow-2xl">
            <div className="grid grid-cols-12 gap-1 text-xs font-mono font-black uppercase text-muted-foreground border-b border-border/80 pb-1 mb-1">
              <span className="col-span-1 text-center">#</span>
              <span className="col-span-6">ATHLETE & CLUB</span>
              <span className="col-span-1 text-center">P</span>
              <span className="col-span-2 text-center">GD</span>
              <span className="col-span-2 text-right">PTS</span>
            </div>
            <div className="space-y-1">
              {data.standingsRows.slice(0, 6).map((row) => (
                <div
                  key={row.rank}
                  className={`grid grid-cols-12 gap-1 items-center text-xs py-1 px-1.5 rounded-lg border ${
                    row.rank === 1
                      ? "border-secondary/40 bg-secondary/10"
                      : "border-border/40 bg-background/50"
                  }`}
                >
                  <span className="col-span-1 text-center font-bold font-mono text-white">
                    {row.rank}
                  </span>
                  <div className="col-span-6 flex items-center gap-1.5 min-w-0">
                    {row.movement === "UP" ? (
                      <ArrowUp className="h-3 w-3 text-secondary shrink-0" />
                    ) : row.movement === "DOWN" ? (
                      <ArrowDown className="h-3 w-3 text-destructive shrink-0" />
                    ) : (
                      <Minus className="h-3 w-3 text-muted-foreground shrink-0" />
                    )}
                    <span className="font-bold text-white truncate text-xs">
                      {row.gamerTag}
                    </span>
                    {row.realTeam && (
                      <span className="text-xs text-muted-foreground truncate hidden sm:inline">
                        ({row.realTeam})
                      </span>
                    )}
                  </div>
                  <span className="col-span-1 text-center font-mono text-muted-foreground">
                    {row.played}
                  </span>
                  <span className="col-span-2 text-center font-mono text-muted-foreground">
                    {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                  </span>
                  <span className="col-span-2 text-right font-mono font-black text-white">
                    {row.points}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* ========================================================================= */}
        {/* TEMPLATE E: CONFIRMED CHAMPIONS & HALL OF FAME */}
        {/* ========================================================================= */}
        {isSeasonCategory && upperType.includes("CHAMPION") && data.winnerGamerTag ? (
          <div className="text-center space-y-3 py-2">
            {data.trophyAsset && (
              <div className="relative h-28 w-28 sm:h-36 sm:w-36 mx-auto drop-shadow-2xl animate-pulse">
                <Image
                  src={data.trophyAsset}
                  alt="Official Trophy"
                  fill
                  className="object-contain"
                />
              </div>
            )}
            <div className="space-y-1">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-secondary">
                OFFICIAL CHAMPION CROWNED
              </span>
              <h3 className="text-lg sm:text-2xl font-black text-white tracking-tight uppercase">
                {data.winnerGamerTag}
              </h3>
              <p className="text-xs text-muted-foreground">
                Inducted into Rwanda eFootball League Hall of Fame
              </p>
            </div>
          </div>
        ) : null}

        {/* ========================================================================= */}
        {/* TEMPLATE F: SEASON KICKOFF & NOTICES */}
        {/* ========================================================================= */}
        {isSeasonCategory && upperType.includes("KICKOFF") && (
          <div className="text-center space-y-3 py-3 max-w-sm mx-auto">
            <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-3xl bg-secondary/20 border border-secondary/40 flex items-center justify-center mx-auto text-secondary shadow-xl">
              <Trophy className="h-8 w-8 sm:h-10 sm:w-10" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base sm:text-lg font-black text-white uppercase">
                {season || "Season 1 (2026)"} Kickoff
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Division 1, Division 2, and Division 3 officially active. Matchday fixtures unlocked.
              </p>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TEMPLATE G: ADMINISTRATIVE NOTICES */}
        {/* ========================================================================= */}
        {isNoticeCategory && (
          <div className="text-center space-y-3 py-4 max-w-md mx-auto rounded-2xl bg-card/90 border border-border p-4 shadow-2xl">
            <ShieldCheck className="h-10 w-10 text-primary mx-auto" />
            <div className="space-y-1">
              <h4 className="text-sm sm:text-base font-black text-white uppercase">
                {data.noticeTitle || headline || "Official League Directive"}
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Verified by Rwanda eFootball League Administration. Compliance mandatory for all participants.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 4. Bottom Graphic Footer Strip */}
      <div className="relative z-10 flex items-center justify-between text-xs font-mono font-bold text-muted-foreground pt-2.5 border-t border-border/40">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-primary animate-ping" />
          <span>RWANDA eFOOTBALL LEAGUE</span>
        </span>
        <span className="flex items-center gap-1">
          <Shield className="h-3 w-3 text-secondary" />
          <span>OFFICIAL MEDIA</span>
        </span>
      </div>
    </div>
  );
}
