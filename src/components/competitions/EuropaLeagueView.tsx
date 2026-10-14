"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Award,
  Flame,
  Calendar,
  Clock,
  Sparkles,
  Users,
  CheckCircle,
  AlertTriangle,
  History,
  Crown,
  Table,
} from "lucide-react";
import { resolvePlayerAvatar } from "@/lib/teams";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import TournamentPlayoffBracket, { PlayoffMatchData } from "./TournamentPlayoffBracket";

export interface EuropaLeagueViewProps {
  season?: string;
  currentPlayer?: any;
  leagueConfig?: any;
  qualifiedPlayers?: any[];
  groupSlots?: any[];
  matches?: any[];
  standings?: any[];
  pastChampions?: any[];
  onOpenSubmitResult?: (match: any) => void;
}

export default function EuropaLeagueView({
  season = "Season 1 (2026)",
  currentPlayer,
  leagueConfig,
  qualifiedPlayers = [],
  groupSlots = [],
  matches = [],
  standings = [],
  pastChampions = [],
  onOpenSubmitResult,
}: EuropaLeagueViewProps) {
  const [activeTab, setActiveTab] = useState<
    "OVERVIEW" | "BRACKET" | "GROUPS" | "FIXTURES" | "DRAWS" | "PARTICIPANTS" | "HISTORY"
  >("OVERVIEW");
  const [fixtureStageFilter, setFixtureStageFilter] = useState<string>("ALL");

  const isEuropaStarted = Boolean(leagueConfig?.europaStarted);
  const isDrawDone = Boolean(leagueConfig?.europaDrawCompleted || groupSlots.length >= 16);

  // Filter matches by stage
  const playoffMatches: PlayoffMatchData[] = matches.filter(
    (m) =>
      m.stage === "QUARTER_FINAL" ||
      m.stage === "SEMI_FINAL" ||
      m.stage === "FINAL" ||
      m.round?.includes("Quarter") ||
      m.round?.includes("Semi") ||
      m.round?.includes("Final")
  );

  const filteredMatches = matches.filter((m) => {
    if (fixtureStageFilter === "ALL") return true;
    if (fixtureStageFilter === "GROUP") return m.stage === "GROUP" || m.round?.includes("Group");
    if (fixtureStageFilter === "KNOCKOUT")
      return m.stage === "QUARTER_FINAL" || m.stage === "SEMI_FINAL" || m.stage === "FINAL";
    return true;
  });

  // Check if logged-in player is in Europa
  const isUserQualified = currentPlayer && qualifiedPlayers.some((p) => p.playerId === currentPlayer.id);
  const userSlot = currentPlayer && groupSlots.find((s) => s.playerId === currentPlayer.id);

  // User's active match in Europa
  const userPendingMatch =
    currentPlayer &&
    matches.find(
      (m) =>
        (m.homePlayerId === currentPlayer.id || m.awayPlayerId === currentPlayer.id) &&
        (m.status === "SCHEDULED" || m.status === "LIVE")
    );

  // Current Europa Champion
  const finalMatch = matches.find((m) => m.stage === "FINAL" && m.status === "FINISHED");
  let currentChampion: any = null;
  if (finalMatch) {
    const h = finalMatch.aggregateHomeScore ?? finalMatch.homeScore ?? 0;
    const a = finalMatch.aggregateAwayScore ?? finalMatch.awayScore ?? 0;
    currentChampion = h > a ? finalMatch.homePlayer : finalMatch.awayPlayer;
  }

  const groupsList = ["Group A", "Group B", "Group C", "Group D"];

  return (
    <div className="space-y-6">
      {/* Top Banner with Official UEFA Europa League Visual Identity */}
      <div className="relative overflow-hidden rounded-3xl border border-secondary/40 europa-theme-bg p-6 sm:p-8 shadow-2xl">
        {/* Stadium Background */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <img
            src="/images/europa-stadium-bg.jpg"
            alt="Europa League Stadium Atmosphere"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-transparent" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-black uppercase text-secondary tracking-wider">
                UEFA Competition Center • {season}
              </span>
              <Badge variant={isEuropaStarted ? "secondary" : "destructive"} className="text-xs">
                {isEuropaStarted ? "TOURNAMENT ACTIVE" : "REGULAR SEASON STAGE"}
              </Badge>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-foreground">
              UEFA Europa League
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The prestigious European club esports tournament in Rwanda. 16 high-caliber athletes
              ranked right behind UCL positions across Division 1, 2, and 3 clash through group stages
              and knockout aggregate ties for the Europa League cup and a ticket to the Super Cup!
            </p>

            {/* Player's personal status badge */}
            {currentPlayer && (
              <div className="pt-2">
                {isUserQualified ? (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-secondary/50 bg-secondary/10 text-secondary text-xs font-bold">
                    <CheckCircle className="h-4 w-4" />
                    <span>
                      You are an Official Europa League Competitor
                      {userSlot ? ` (${userSlot.groupName})` : " (Awaiting Draw)"}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground italic">
                    Viewing as spectator. Europa League spots are earned via domestic league rankings.
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Trophy visual */}
          <div className="relative shrink-0 mx-auto md:mx-0">
            <div className="h-32 w-32 sm:h-40 sm:w-40 relative flex items-center justify-center p-2 rounded-3xl europa-glow bg-card/60 border border-secondary/40 backdrop-blur-md">
              <img
                src="/assets/trophies/europa-league.png"
                alt="UEFA Europa League Trophy"
                className="h-full w-full object-contain filter drop-shadow-2xl"
              />
            </div>
            <span className="text-xs font-black uppercase tracking-wider text-muted-foreground block text-center mt-2">
              The Europa League Cup
            </span>
          </div>
        </div>

        {/* Player action reminder */}
        {userPendingMatch && onOpenSubmitResult && (
          <div className="mt-6 pt-4 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-secondary shrink-0" />
              <p className="text-xs text-foreground font-semibold">
                You have a scheduled Europa League match against{" "}
                <strong className="text-secondary">
                  {userPendingMatch.homePlayerId === currentPlayer.id
                    ? userPendingMatch.awayPlayer?.gamerTag
                    : userPendingMatch.homePlayer?.gamerTag}
                </strong>
                .
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => onOpenSubmitResult(userPendingMatch)}
              className="text-xs font-bold bg-secondary text-secondary-foreground hover:bg-secondary/90"
            >
              Submit Official Result
            </Button>
          </div>
        )}
      </div>

      {/* Internal Navigation Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth p-1.5 rounded-2xl bg-card border border-border">
        <Button
          variant={activeTab === "OVERVIEW" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("OVERVIEW")}
          className="text-xs font-bold shrink-0 whitespace-nowrap"
        >
          Overview
        </Button>
        <Button
          variant={activeTab === "BRACKET" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("BRACKET")}
          className="text-xs font-bold gap-1 shrink-0 whitespace-nowrap"
        >
          <Flame className="h-3.5 w-3.5 text-secondary" /> Playoff Bracket
        </Button>
        <Button
          variant={activeTab === "GROUPS" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("GROUPS")}
          className="text-xs font-bold gap-1 shrink-0 whitespace-nowrap"
        >
          <Table className="h-3.5 w-3.5" /> Group Tables
        </Button>
        <Button
          variant={activeTab === "FIXTURES" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("FIXTURES")}
          className="text-xs font-bold gap-1 shrink-0 whitespace-nowrap"
        >
          <Calendar className="h-3.5 w-3.5" /> Fixtures & Results
        </Button>
        <Button
          variant={activeTab === "DRAWS" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("DRAWS")}
          className="text-xs font-bold gap-1 shrink-0 whitespace-nowrap"
        >
          <Sparkles className="h-3.5 w-3.5" /> Draw & Groups
        </Button>
        <Button
          variant={activeTab === "PARTICIPANTS" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("PARTICIPANTS")}
          className="text-xs font-bold gap-1 shrink-0 whitespace-nowrap"
        >
          <Users className="h-3.5 w-3.5" /> 16 Competitors
        </Button>
        <Button
          variant={activeTab === "HISTORY" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("HISTORY")}
          className="text-xs font-bold gap-1 shrink-0 whitespace-nowrap"
        >
          <History className="h-3.5 w-3.5" /> Hall of Champions
        </Button>
      </div>

      {/* =================================================================== */}
      {/* TAB 1: OVERVIEW */}
      {/* =================================================================== */}
      {activeTab === "OVERVIEW" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="europa-panel rounded-2xl p-5 space-y-2">
              <span className="text-xs font-black uppercase text-secondary">Tournament Structure</span>
              <p className="text-sm font-bold text-foreground">16 Athletes • 4 Groups of 4</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Positions 9-16 in Division 1, and positions 5-8 in Division 2 and Division 3 qualify
                for Europa League. Group matches are 2 legs played simultaneously.
              </p>
            </div>

            <div className="europa-panel rounded-2xl p-5 space-y-2">
              <span className="text-xs font-black uppercase text-secondary">The Knockout Path</span>
              <p className="text-sm font-bold text-foreground">Quarter-Finals to Grand Final</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Top 2 athletes from each group reach Quarter-Finals. Aggregates determine semi-finalists,
                followed by the one-off championship showdown.
              </p>
            </div>

            <div className="europa-panel rounded-2xl p-5 space-y-2">
              <span className="text-xs font-black uppercase text-secondary">Super Cup Gateway</span>
              <p className="text-sm font-bold text-foreground">Clash of Titans</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                The crowned Europa League Champion earns mandatory qualification into the UEFA Super
                Cup, going head-to-head against the UCL Champion!
              </p>
            </div>
          </div>

          {/* Quick Playoff Bracket Preview */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black uppercase text-foreground">Playoff Bracket Preview</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab("BRACKET")}
                className="text-xs font-bold gap-1 border-secondary/40 text-secondary hover:bg-secondary/10"
              >
                Expand Broadcast Bracket
              </Button>
            </div>
            <TournamentPlayoffBracket competition="EUROPA" matches={playoffMatches} />
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 2: PLAYOFF BRACKET */}
      {/* =================================================================== */}
      {activeTab === "BRACKET" && (
        <div className="space-y-4">
          <TournamentPlayoffBracket
            competition="EUROPA"
            matches={playoffMatches}
            onSelectMatch={(m) => {
              if (onOpenSubmitResult && currentPlayer && (m.homePlayer?.id === currentPlayer.id || m.awayPlayer?.id === currentPlayer.id)) {
                onOpenSubmitResult(m);
              }
            }}
          />
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 3: GROUP TABLES */}
      {/* =================================================================== */}
      {activeTab === "GROUPS" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {groupsList.map((grp) => {
              const groupRows = standings
                .filter((s) => s.division?.includes(grp))
                .sort((a, b) => (b.points ?? 0) - (a.points ?? 0) || (b.goalDifference ?? 0) - (a.goalDifference ?? 0));

              return (
                <div key={grp} className="europa-panel rounded-2xl p-4 sm:p-5 space-y-3">
                  <div className="flex items-center justify-between border-b border-border pb-2">
                    <h3 className="text-sm font-black uppercase text-secondary flex items-center gap-2">
                      <div className="relative h-5 w-5 shrink-0">
                        <Image
                          src="/assets/trophies/europa-league.png"
                          alt="Europa League Trophy"
                          fill
                          sizes="20px"
                          className="object-contain drop-shadow"
                        />
                      </div>
                      <span>{grp}</span>
                    </h3>
                    <span className="text-xs text-muted-foreground font-mono">Top 2 Advance</span>
                  </div>

                  {groupRows.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-4 text-center">
                      Group slots awaiting official Europa draw completion.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-border text-muted-foreground text-left">
                            <th className="py-1 px-1 w-6">#</th>
                            <th className="py-1 px-2">Athlete</th>
                            <th className="py-1 px-1 text-center">P</th>
                            <th className="py-1 px-1 text-center">GD</th>
                            <th className="py-1 px-1 text-center font-bold">PTS</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                          {groupRows.map((row, idx) => {
                            const isAdvancing = idx < 2;
                            return (
                              <tr
                                key={row.id || idx}
                                className={isAdvancing ? "bg-secondary/5" : ""}
                              >
                                <td className="py-2 px-1 font-mono font-bold">
                                  <span
                                    className={`inline-block w-4 text-center ${
                                      isAdvancing ? "text-secondary" : "text-muted-foreground"
                                    }`}
                                  >
                                    {idx + 1}
                                  </span>
                                </td>
                                <td className="py-2 px-2">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <div className="h-5 w-5 rounded-md bg-card border border-border p-0.5 shrink-0 overflow-hidden">
                                      <img
                                        src={resolvePlayerAvatar(row.player)}
                                        alt={row.player?.gamerTag || "player"}
                                        className="h-full w-full object-contain"
                                      />
                                    </div>
                                    <span className="truncate font-semibold text-foreground">
                                      {row.player?.gamerTag}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-2 px-1 text-center font-mono text-muted-foreground">
                                  {row.played ?? 0}
                                </td>
                                <td className="py-2 px-1 text-center font-mono text-muted-foreground">
                                  {row.goalDifference ?? 0}
                                </td>
                                <td className="py-2 px-1 text-center font-mono font-black text-foreground">
                                  {row.points ?? 0}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 4: FIXTURES & RESULTS */}
      {/* =================================================================== */}
      {activeTab === "FIXTURES" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2 border-b border-border pb-3">
            <span className="text-xs font-bold uppercase text-muted-foreground">Filter Matches:</span>
            <div className="flex items-center gap-1">
              <Button
                variant={fixtureStageFilter === "ALL" ? "default" : "outline"}
                size="sm"
                onClick={() => setFixtureStageFilter("ALL")}
                className="text-xs h-7 px-2.5 font-bold"
              >
                All
              </Button>
              <Button
                variant={fixtureStageFilter === "GROUP" ? "default" : "outline"}
                size="sm"
                onClick={() => setFixtureStageFilter("GROUP")}
                className="text-xs h-7 px-2.5 font-bold"
              >
                Group Stage
              </Button>
              <Button
                variant={fixtureStageFilter === "KNOCKOUT" ? "default" : "outline"}
                size="sm"
                onClick={() => setFixtureStageFilter("KNOCKOUT")}
                className="text-xs h-7 px-2.5 font-bold"
              >
                Knockouts
              </Button>
            </div>
          </div>

          {filteredMatches.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
              No matches found for the selected category.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredMatches.map((m) => {
                const isFinished = m.status === "FINISHED";
                const aggHome =
                  m.aggregateHomeScore ?? (isFinished ? (m.homeScore || 0) + (m.leg2HomeScore || 0) : null);
                const aggAway =
                  m.aggregateAwayScore ?? (isFinished ? (m.awayScore || 0) + (m.leg2AwayScore || 0) : null);
                const isUserMatch =
                  currentPlayer && (m.homePlayerId === currentPlayer.id || m.awayPlayerId === currentPlayer.id);

                return (
                  <div
                    key={m.id}
                    className={`rounded-xl border ${
                      isUserMatch
                        ? "border-secondary bg-secondary/5 shadow-md"
                        : "border-border bg-card/80"
                    } p-3.5 space-y-2`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-secondary">{m.round}</span>
                      <span className="text-muted-foreground font-mono">{m.status}</span>
                    </div>

                    <div className="flex items-center justify-between gap-3 text-sm font-bold text-foreground">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="h-7 w-7 rounded-lg bg-card border border-border p-0.5 flex items-center justify-center shrink-0">
                          <img
                            src={resolvePlayerAvatar(m.homePlayer)}
                            alt={m.homePlayer?.gamerTag}
                            className="h-full w-full object-contain"
                          />
                        </div>
                        <span className="truncate">{m.homePlayer?.gamerTag}</span>
                      </div>

                      <div className="font-mono text-center shrink-0 px-2">
                        {isFinished ? (
                          <span className="text-secondary font-black">
                            {aggHome} - {aggAway}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">vs</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 min-w-0 flex-1 justify-end">
                        <span className="truncate">{m.awayPlayer?.gamerTag}</span>
                        <div className="h-7 w-7 rounded-lg bg-card border border-border p-0.5 flex items-center justify-center shrink-0">
                          <img
                            src={resolvePlayerAvatar(m.awayPlayer)}
                            alt={m.awayPlayer?.gamerTag}
                            className="h-full w-full object-contain"
                          />
                        </div>
                      </div>
                    </div>

                    {isUserMatch && !isFinished && onOpenSubmitResult && (
                      <div className="pt-2 border-t border-border flex justify-end">
                        <Button
                          size="sm"
                          onClick={() => onOpenSubmitResult(m)}
                          className="text-xs h-7 px-3 font-bold bg-secondary text-secondary-foreground hover:bg-secondary/90"
                        >
                          Submit Result Proof
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 5: DRAWS */}
      {/* =================================================================== */}
      {activeTab === "DRAWS" && (
        <div className="space-y-6">
          <div className="europa-panel rounded-2xl p-6 space-y-3">
            <h3 className="text-base font-black uppercase text-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-secondary" />
              <span>Official Europa Draw Information</span>
            </h3>
            <p className="text-xs text-muted-foreground">
              Status: {isDrawDone ? "Concluded and Locked" : "Pending Official Draw Event"}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {groupsList.map((grp) => {
              const slotsInGrp = groupSlots.filter((s) => s.groupName === grp);
              return (
                <div key={grp} className="europa-panel rounded-xl p-4 space-y-2">
                  <span className="text-xs font-black uppercase text-secondary block">{grp}</span>
                  <div className="space-y-1.5">
                    {slotsInGrp.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">Awaiting draw seeding</p>
                    ) : (
                      slotsInGrp.map((slot, sIdx) => (
                        <div
                          key={slot.id || sIdx}
                          className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-card border border-border"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-muted-foreground">{sIdx + 1}.</span>
                            <span className="font-semibold text-foreground">
                              {slot.player?.gamerTag}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground font-mono">
                            {slot.playerDivision}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 6: PARTICIPANTS */}
      {/* =================================================================== */}
      {activeTab === "PARTICIPANTS" && (
        <div className="space-y-4">
          <h3 className="text-sm font-black uppercase text-muted-foreground">
            Official 16 Qualified Europa Competitors
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {qualifiedPlayers.map((q, idx) => (
              <div
                key={q.id || idx}
                className="europa-panel rounded-xl p-3 flex items-center gap-3 space-x-1"
              >
                <div className="h-10 w-10 rounded-xl bg-card border border-border p-1 flex items-center justify-center shrink-0">
                  <img
                    src={resolvePlayerAvatar(q.player || q)}
                    alt={q.player?.gamerTag || q.gamerTag}
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-foreground">
                    {q.player?.gamerTag || q.gamerTag}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {q.seedLabel || q.division}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 7: HISTORY & PAST CHAMPIONS */}
      {/* =================================================================== */}
      {activeTab === "HISTORY" && (
        <div className="space-y-4">
          <h3 className="text-sm font-black uppercase text-muted-foreground">
            UEFA Europa League Roll of Honor
          </h3>
          {pastChampions.length === 0 && !currentChampion ? (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
              No historical Europa League champion records archived yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentChampion && (
                <div className="europa-panel rounded-2xl p-5 border-secondary/50 europa-glow space-y-2">
                  <Badge variant="secondary" className="text-xs font-bold">
                    REIGNING CHAMPION
                  </Badge>
                  <h4 className="text-lg font-black text-foreground">{currentChampion.gamerTag}</h4>
                  <p className="text-xs text-muted-foreground">
                    Crowned in {season} • Reached UEFA Super Cup Showdown
                  </p>
                </div>
              )}
              {pastChampions.map((c, i) => (
                <div key={c.id || i} className="europa-panel rounded-2xl p-5 space-y-2">
                  <span className="text-xs font-mono text-secondary font-bold">{c.season}</span>
                  <h4 className="text-lg font-black text-foreground">{c.championName}</h4>
                  {c.runnerUp && (
                    <p className="text-xs text-muted-foreground">Runner-Up: {c.runnerUp}</p>
                  )}
                  {c.notes && <p className="text-xs text-muted-foreground">{c.notes}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
