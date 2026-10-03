"use client";

import React, { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trophy, Globe, ArrowUp, ArrowDown, Minus, AlertTriangle, ShieldAlert, Smartphone, MessageSquare, Shield } from "lucide-react";
import { resolvePlayerAvatar, findTeam } from "@/lib/teams";

interface StandingRow {
  id: string;
  rank: number;
  previousRank?: number | null;
  division: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form: string;
  consecutiveMissed?: number;
  isDisqualified?: boolean;
  player: {
    id: string;
    gamerTag: string;
    fullName: string;
    efootballId: string;
    whatsapp: string;
    platform: string;
    overallRating: number;
    avatar?: string | null;
    realTeam?: string | null;
    status?: string | null;
  };
}

interface StandingsTableProps {
  standings: StandingRow[];
  divisionName?: string;
  compact?: boolean;
  updateKey?: string;
  currentRound?: number;
  currentUserId?: string | null;
  userAlreadyViewed?: boolean;
}

export default function StandingsTable({
  standings,
  divisionName = "Division 1",
  compact = false,
  updateKey,
  currentRound,
  currentUserId,
  userAlreadyViewed = false,
}: StandingsTableProps) {
  // Deterministic 5-level tiebreaker sorting: Points -> GD -> GF -> Won -> GamerTag with deduplication
  const sortedStandings = useMemo(() => {
    const seen = new Set<string>();
    return [...(standings || [])]
      .filter((row) => {
        if (!row || !row.player || (row.player as any).status === "RESERVED") return false;
        const pId = row.player.id || (row as any).playerId;
        if (pId) {
          if (seen.has(pId)) return false;
          seen.add(pId);
        }
        return true;
      })
      .sort((a, b) => {
        // 1. Points (descending)
        if ((b.points ?? 0) !== (a.points ?? 0)) {
          return (b.points ?? 0) - (a.points ?? 0);
        }
        // 2. Goal Difference (descending)
        if ((b.goalDifference ?? 0) !== (a.goalDifference ?? 0)) {
          return (b.goalDifference ?? 0) - (a.goalDifference ?? 0);
        }
        // 3. Goals For (descending)
        if ((b.goalsFor ?? 0) !== (a.goalsFor ?? 0)) {
          return (b.goalsFor ?? 0) - (a.goalsFor ?? 0);
        }
        // 4. Matches Won (descending)
        if ((b.won ?? 0) !== (a.won ?? 0)) {
          return (b.won ?? 0) - (a.won ?? 0);
        }
        // 5. Alphabetical GamerTag (ascending)
        return (a.player?.gamerTag || "").localeCompare(b.player?.gamerTag || "");
      });
  }, [standings]);

  // Derive effective update key from explicit prop or latest standing updatedAt
  const effectiveUpdateKey = useMemo(() => {
    if (updateKey) return updateKey;
    const latestTime = (standings || []).reduce((max, s: any) => {
      const t = s.updatedAt ? new Date(s.updatedAt).getTime() : 0;
      return t > max ? t : max;
    }, 0);
    return `${divisionName}_${latestTime || 0}`;
  }, [updateKey, standings, divisionName]);

  // Round requirement:
  // Round 1: No movement indicators
  // Round 2 onward: movement indicators can be displayed after each standings update
  const maxPlayed = useMemo(() => {
    return Math.max(...(standings || []).map((s) => s.played || 0), 0);
  }, [standings]);

  const isRound2OrLater = useMemo(() => {
    const roundNumber = typeof currentRound === "number" ? currentRound : maxPlayed;
    return roundNumber >= 2 || maxPlayed >= 2;
  }, [currentRound, maxPlayed]);

  const [showMovement, setShowMovement] = useState(false);

  useEffect(() => {
    if (!isRound2OrLater || !effectiveUpdateKey) {
      setShowMovement(false);
      return;
    }

    const userKey = currentUserId ? `u_${currentUserId}` : "guest";
    const storageKey = `ef_standings_viewed_${userKey}_${divisionName}`;
    const storedKey = typeof window !== "undefined" ? localStorage.getItem(storageKey) : null;

    // If server already recorded that this user viewed this update, or if localStorage has it
    if (userAlreadyViewed || storedKey === effectiveUpdateKey) {
      setShowMovement(false);
    } else {
      // First time viewing after this update!
      setShowMovement(true);

      // Record in localStorage immediately so subsequent visits hide movement
      try {
        localStorage.setItem(storageKey, effectiveUpdateKey);
      } catch (e) {}

      // If user is logged in, also record in database
      if (currentUserId) {
        fetch("/api/standings/viewed", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            division: divisionName,
            updateKey: effectiveUpdateKey,
          }),
        }).catch(() => {});
      }
    }
  }, [isRound2OrLater, effectiveUpdateKey, userAlreadyViewed, currentUserId, divisionName]);

  return (
    <div className="w-full overflow-x-auto no-scrollbar scroll-smooth">
      <Table className="w-full">
        <TableHeader>
          <TableRow>
            <TableHead className={`${showMovement ? "w-20" : "w-14"} text-center transition-all`}>Pos</TableHead>
            <TableHead>eFootball Mobile Athlete (Gamer Tag)</TableHead>
            {!compact && <TableHead className="hidden lg:table-cell">WhatsApp Contact</TableHead>}
            <TableHead className="text-center">MP</TableHead>
            <TableHead className="text-center">W</TableHead>
            <TableHead className="text-center">D</TableHead>
            <TableHead className="text-center">L</TableHead>
            {!compact && (
              <>
                <TableHead className="text-center hidden sm:table-cell">GF</TableHead>
                <TableHead className="text-center hidden sm:table-cell">GA</TableHead>
              </>
            )}
            <TableHead className="text-center">GD</TableHead>
            <TableHead className="text-center font-bold text-primary">Pts</TableHead>
            {!compact && (
              <>
                <TableHead className="text-center hidden md:table-cell">Form</TableHead>
                <TableHead className="text-center hidden sm:table-cell">Status / Cup</TableHead>
              </>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedStandings.length === 0 ? (
            <TableRow>
              <TableCell colSpan={compact ? 8 : 12} className="text-center py-10 text-muted-foreground italic text-xs">
                No active athlete standings available for {divisionName} yet.
              </TableCell>
            </TableRow>
          ) : sortedStandings.map((row, idx) => {
              const forms = row.form ? row.form.split(",") : ["D"];
              // Rank is strictly determined by position in sorted standings table
              const rank = idx + 1;
              const missed = row.consecutiveMissed || 0;
              const isDisqualified = Boolean(row.isDisqualified || missed >= 3);

              const totalRows = sortedStandings.length;
              // Bottom 3 athletes face relegation in Division 1 & Division 2 (minimum 4 players required)
              const isBottomThree = totalRows >= 4 && rank > totalRows - 3;

              // Qualification, Promotion, Mid-Table & Relegation flags:
              let isChampion = false;
              let isPromotion = false;
              let isUcl = false;
              let isEuropa = false;
              let isRelegation = false;
              let isMidTable = false;

              if (divisionName === "Division 1") {
                if (rank === 1) {
                  isChampion = true;
                  isUcl = true;
                } else if (rank <= 8) {
                  isUcl = true;
                } else if (rank <= 16) {
                  isEuropa = true;
                } else if (isBottomThree) {
                  isRelegation = true;
                } else {
                  isMidTable = true;
                }
              } else if (divisionName === "Division 2") {
                if (isBottomThree) {
                  isRelegation = true;
                } else if (rank <= 3) {
                  isPromotion = true;
                  isUcl = true; // Top 3 in Div 2 are promoted to Div 1 AND qualify for UCL
                } else if (rank === 4) {
                  isUcl = true; // 4th in Div 2 qualifies for UCL
                } else if (rank <= 8) {
                  isEuropa = true; // 5th to 8th qualify for Europa League
                } else {
                  isMidTable = true; // Mid-table safe from relegation
                }
              } else if (divisionName === "Division 3") {
                // Division 3 is the foundational Academy tier - NO relegation!
                if (rank <= 3) {
                  isPromotion = true;
                  isUcl = true; // Top 3 in Div 3 are promoted to Div 2 AND qualify for UCL
                } else if (rank === 4) {
                  isUcl = true; // 4th in Div 3 qualifies for UCL
                } else if (rank <= 8) {
                  isEuropa = true; // 5th to 8th qualify for Europa League
                } else {
                  isMidTable = true; // National Academy Mid-Table
                }
              } else {
                if (rank <= 2) isUcl = true;
                else isMidTable = true;
              }

              const cleanWa = row.player?.whatsapp?.replace(/[^0-9]/g, "") || "";

            return (
              <TableRow
                key={row.id}
                className={`group transition-colors ${
                  isDisqualified
                    ? "bg-destructive/20 hover:bg-destructive/30 opacity-75"
                    : isRelegation && !compact
                    ? "bg-destructive/10 hover:bg-destructive/20"
                    : (isPromotion || isChampion) && !compact
                    ? "bg-primary/10 hover:bg-primary/20"
                    : isUcl && !compact
                    ? "bg-primary/5 hover:bg-primary/15"
                    : isEuropa && !compact
                    ? "bg-secondary/5 hover:bg-secondary/15"
                    : "hover:bg-muted/60"
                }`}
              >
                {/* Rank & Movement */}
                <TableCell className="text-center font-bold">
                  <div className="flex items-center justify-center gap-1.5">
                    <span
                      className={`inline-flex h-6 w-6 items-center justify-center rounded-md text-xs font-black ${
                        isDisqualified
                          ? "bg-destructive/20 text-destructive border border-destructive/30"
                          : isRelegation
                          ? "bg-destructive/20 text-destructive border border-destructive/40"
                          : isChampion
                          ? "bg-primary/25 text-primary border border-primary/50 shadow-sm"
                          : isPromotion
                          ? "bg-primary/20 text-primary border border-primary/40 shadow-sm"
                          : isUcl
                          ? "bg-primary/20 text-primary border border-primary/30"
                          : isEuropa
                          ? "bg-secondary/20 text-secondary border border-secondary/30"
                          : "bg-muted/40 text-muted-foreground border border-border/60"
                      }`}
                    >
                      {rank}
                    </span>

                    {showMovement && (
                      <span className="inline-flex items-center justify-center min-w-5 text-xs">
                        {(() => {
                          const prevRank = row.previousRank;
                          if (prevRank === null || prevRank === undefined || prevRank <= 0 || prevRank === rank) {
                            return (
                              <span
                                className="inline-flex items-center text-muted-foreground font-bold"
                                title="Position unchanged (—)"
                              >
                                <Minus className="h-3 w-3" strokeWidth={2.5} />
                              </span>
                            );
                          }
                          if (rank < prevRank) {
                            const diff = prevRank - rank;
                            return (
                              <span
                                className="inline-flex items-center text-primary font-black gap-0.5"
                                title={`Moved up ${diff} spot${diff > 1 ? "s" : ""} (Previous: #${prevRank})`}
                              >
                                <ArrowUp className="h-3 w-3" strokeWidth={2.5} />
                                {diff > 0 && <span className="text-xs font-mono leading-none">{diff}</span>}
                              </span>
                            );
                          } else {
                            const diff = rank - prevRank;
                            return (
                              <span
                                className="inline-flex items-center text-destructive font-black gap-0.5"
                                title={`Dropped ${diff} spot${diff > 1 ? "s" : ""} (Previous: #${prevRank})`}
                              >
                                <ArrowDown className="h-3 w-3" strokeWidth={2.5} />
                                {diff > 0 && <span className="text-xs font-mono leading-none">{diff}</span>}
                              </span>
                            );
                          }
                        })()}
                      </span>
                    )}
                  </div>
                </TableCell>

                {/* Mobile Athlete Identity */}
                <TableCell>
                  {(() => {
                    const player = row.player;
                    const avatarUrl = resolvePlayerAvatar(player);
                    const teamObj = player?.realTeam ? findTeam(player.realTeam) : null;
                    const gamerTag = player?.gamerTag || "Unknown";
                    const fullName = player?.fullName || "Esports Athlete";
                    const efootballId = player?.efootballId || "N/A";
                    const realTeam = player?.realTeam || "";

                    return (
                      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                        <div className="flex h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 shrink-0 aspect-square items-center justify-center rounded-xl bg-card border border-border p-0.5 shadow-sm overflow-hidden">
                          {avatarUrl ? (
                            <img
                              src={avatarUrl}
                              alt={realTeam || gamerTag}
                              className="h-full w-full object-contain filter drop-shadow-sm"
                              loading="lazy"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(gamerTag)}`;
                              }}
                            />
                          ) : (
                            <span className="font-black text-xs text-primary">
                              {(gamerTag.slice(0, 2) || "PL").toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                            <span className="font-bold text-white text-xs sm:text-sm tracking-wide group-hover:text-primary transition-colors truncate">
                              {gamerTag}
                            </span>

                            {realTeam && (
                              <span
                                className="text-xs py-0 px-1.5 font-bold text-primary"
                                title={`Official Representation: ${realTeam}`}
                              >
                                {teamObj?.shortName || realTeam}
                              </span>
                            )}

                            {missed >= 3 ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-black bg-destructive/20 text-destructive border border-destructive/40 animate-pulse">
                                <ShieldAlert className="h-3 w-3" />
                                3/3 Missed (Disqualified)
                              </span>
                            ) : missed === 2 ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-bold bg-secondary/20 text-secondary border border-secondary/40">
                                <AlertTriangle className="h-3 w-3" />
                                2/3 Missed Warning
                              </span>
                            ) : null}
                          </div>

                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{fullName}</span>
                            <span>•</span>
                            <span className="font-mono text-muted-foreground text-xs">
                              {efootballId}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </TableCell>

                {/* WhatsApp Direct Link */}
                {!compact && (
                  <TableCell className="hidden lg:table-cell text-xs">
                    <a
                      href={`https://wa.me/${cleanWa}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:text-primary font-mono text-xs"
                    >
                      <MessageSquare className="h-3 w-3" />
                      <span>{row.player?.whatsapp || "N/A"}</span>
                    </a>
                  </TableCell>
                )}

                {/* Match Stats */}
                <TableCell className="text-center font-medium text-foreground">
                  {row.played}
                </TableCell>
                <TableCell className="text-center font-medium text-primary">
                  {row.won}
                </TableCell>
                <TableCell className="text-center font-medium text-muted-foreground">
                  {row.drawn}
                </TableCell>
                <TableCell className="text-center font-medium text-destructive">
                  {row.lost}
                </TableCell>

                {!compact && (
                  <>
                    <TableCell className="text-center text-muted-foreground hidden sm:table-cell">
                      {row.goalsFor}
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground hidden sm:table-cell">
                      {row.goalsAgainst}
                    </TableCell>
                  </>
                )}

                <TableCell className="text-center font-semibold text-foreground">
                  {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                </TableCell>

                <TableCell className="text-center font-black text-base text-secondary">
                  {row.points}
                </TableCell>

                {/* Form Pills */}
                {!compact && (
                  <TableCell className="text-center hidden md:table-cell">
                    <div className="flex items-center justify-center gap-1">
                      {forms.map((f, i) => (
                        <span
                          key={i}
                          className={`inline-flex h-5 w-5 items-center justify-center rounded text-xs font-bold ${
                            f === "W"
                              ? "bg-primary/20 text-primary border border-primary/30"
                              : f === "D"
                              ? "bg-secondary/20 text-secondary border border-secondary/30"
                              : "bg-destructive/20 text-destructive border border-destructive/30"
                          }`}
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                )}

                {/* Status / Cup */}
                {!compact && (
                  <TableCell className="text-center hidden sm:table-cell">
                    {isDisqualified ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-destructive/20 text-destructive border border-destructive/30">
                        <ShieldAlert className="h-3 w-3" />
                        Disqualified
                      </span>
                    ) : divisionName === "Division 1" ? (
                      isRelegation ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-destructive/20 text-destructive border border-destructive/30">
                          <ArrowDown className="h-3 w-3" />
                          Relegation (Div 2)
                        </span>
                      ) : isChampion ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-primary/25 text-primary border border-primary/40 font-black">
                          <Trophy className="h-3 w-3" />
                          Champion • UCL
                        </span>
                      ) : isUcl ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-primary/20 text-primary border border-primary/30">
                          <Trophy className="h-3 w-3" />
                          UCL League
                        </span>
                      ) : isEuropa ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-secondary/20 text-secondary border border-secondary/30">
                          <Globe className="h-3 w-3" />
                          Europa League
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-muted/60 text-muted-foreground border border-border">
                          <Shield className="h-3 w-3" />
                          Mid-Table (Safe)
                        </span>
                      )
                    ) : divisionName === "Division 2" ? (
                      isRelegation ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-destructive/20 text-destructive border border-destructive/30">
                          <ArrowDown className="h-3 w-3" />
                          Relegation (Div 3)
                        </span>
                      ) : isPromotion ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-primary/20 text-primary border border-primary/40">
                          <ArrowUp className="h-3 w-3" />
                          Promoted (Div 1) • UCL
                        </span>
                      ) : isUcl ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-primary/20 text-primary border border-primary/30">
                          <Trophy className="h-3 w-3" />
                          UCL League
                        </span>
                      ) : isEuropa ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-secondary/20 text-secondary border border-secondary/30">
                          <Globe className="h-3 w-3" />
                          Europa League
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-muted/60 text-muted-foreground border border-border">
                          <Shield className="h-3 w-3" />
                          Mid-Table (Safe)
                        </span>
                      )
                    ) : divisionName === "Division 3" ? (
                      isPromotion ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-primary/20 text-primary border border-primary/40">
                          <ArrowUp className="h-3 w-3" />
                          Promoted (Div 2) • UCL
                        </span>
                      ) : isUcl ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-primary/20 text-primary border border-primary/30">
                          <Trophy className="h-3 w-3" />
                          UCL League
                        </span>
                      ) : isEuropa ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-secondary/20 text-secondary border border-secondary/30">
                          <Globe className="h-3 w-3" />
                          Europa League
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-muted/60 text-muted-foreground border border-border">
                          <Shield className="h-3 w-3" />
                          Mid-Table (Academy)
                        </span>
                      )
                    ) : isUcl ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-primary/20 text-primary border border-primary/30">
                        <Trophy className="h-3 w-3" />
                        Qualified
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Mid-Table</span>
                    )}
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {/* Table Legend */}
      {!compact && (
        <div className="p-4 border-t border-border bg-card/40 flex flex-wrap items-center gap-x-6 gap-y-2.5 text-xs">
          <span className="font-bold text-muted-foreground uppercase tracking-wider text-xs">
            {divisionName} Table Legend:
          </span>
          {divisionName === "Division 1" ? (
            <>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-primary/25 border border-primary/40" />
                <span className="text-foreground font-semibold">1st: Champion & UCL</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-primary/20 border border-primary/30" />
                <span className="text-foreground">2nd - 8th: UCL League</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-secondary/20 border border-secondary/30" />
                <span className="text-foreground">9th - 16th: Europa League</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-muted/60 border border-border" />
                <span className="text-muted-foreground">Mid-Table (Safe)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-destructive/20 border border-destructive/30" />
                <span className="text-destructive font-semibold">Bottom 3: Relegation (Div 2)</span>
              </div>
            </>
          ) : divisionName === "Division 2" ? (
            <>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-primary/20 border border-primary/40" />
                <span className="text-foreground font-semibold">Top 3: PROMOTED to Div 1 & UCL</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-primary/20 border border-primary/30" />
                <span className="text-foreground">4th: UCL League</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-secondary/20 border border-secondary/30" />
                <span className="text-foreground">5th - 8th: Europa League</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-muted/60 border border-border" />
                <span className="text-muted-foreground">Mid-Table (Safe)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-destructive/20 border border-destructive/30" />
                <span className="text-destructive font-semibold">Bottom 3: Relegation (Div 3)</span>
              </div>
            </>
          ) : divisionName === "Division 3" ? (
            <>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-primary/20 border border-primary/40" />
                <span className="text-foreground font-semibold">Top 3: PROMOTED to Div 2 & UCL</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-primary/20 border border-primary/30" />
                <span className="text-foreground">4th: UCL League</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-secondary/20 border border-secondary/30" />
                <span className="text-foreground">5th - 8th: Europa League</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-muted/60 border border-border" />
                <span className="text-muted-foreground">Mid-Table (Academy • No Relegation)</span>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded bg-primary/20 border border-primary/30" />
              <span className="text-foreground">Qualified Slots</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
