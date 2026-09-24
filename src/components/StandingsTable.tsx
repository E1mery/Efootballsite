import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trophy, Globe, ArrowUp, ArrowDown, AlertTriangle, ShieldAlert, Smartphone, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { resolvePlayerAvatar, findTeam } from "@/lib/teams";

interface StandingRow {
  id: string;
  rank: number;
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
  };
}

interface StandingsTableProps {
  standings: StandingRow[];
  divisionName?: string;
  compact?: boolean;
}

export default function StandingsTable({
  standings,
  divisionName = "Division 1",
  compact = false,
}: StandingsTableProps) {
  return (
    <div className="w-full overflow-x-auto no-scrollbar scroll-smooth">
      <Table className="w-full">
        <TableHeader>
          <TableRow>
            <TableHead className="w-14 text-center">Pos</TableHead>
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
          {standings.map((row) => {
            const forms = row.form ? row.form.split(",") : ["D"];
            const rank = row.rank;
            const missed = row.consecutiveMissed || 0;
            const isDisqualified = row.isDisqualified || missed >= 3;

            // Qualification & Relegation flags:
            let isUcl = false;
            let isEuropa = false;
            let isPromotion = false;
            let isRelegation = false;

            const totalRows = standings.length;
            const isBottomThree = totalRows >= 4 && rank > totalRows - 3;

            if (divisionName === "Division 1") {
              if (rank <= 8) isUcl = true;
              else if (rank <= 12) isEuropa = true;
              if (isBottomThree) isRelegation = true;
            } else if (divisionName === "Division 2") {
              if (rank <= 3) isPromotion = true;
              if (rank <= 4) isUcl = true;
              else if (rank <= 10) isEuropa = true;
              if (isBottomThree) isRelegation = true;
            } else if (divisionName === "Division 3") {
              if (rank <= 3) isPromotion = true;
              if (rank <= 4) isUcl = true;
              else if (rank <= 10) isEuropa = true;
              // Division 3 is lowest domestic tier
            }

            const cleanWa = row.player.whatsapp?.replace(/[^0-9]/g, "") || "";

            return (
              <TableRow
                key={row.id}
                className={`group transition-colors ${
                  isDisqualified
                    ? "bg-destructive/20 hover:bg-destructive/30 opacity-75"
                    : isRelegation && !compact
                    ? "bg-destructive/15 hover:bg-destructive/25"
                    : isUcl && !compact
                    ? "hover:bg-primary/20"
                    : "hover:bg-muted/60"
                }`}
              >
                {/* Rank */}
                <TableCell className="text-center font-bold">
                  <div className="flex items-center justify-center gap-1">
                    <span
                      className={`inline-flex h-6 w-6 items-center justify-center rounded-md text-xs font-black ${
                        isUcl
                          ? "bg-primary/20 text-primary border border-primary/30"
                          : isPromotion
                          ? "bg-primary/20 text-primary border border-primary/30"
                          : isRelegation
                          ? "bg-destructive/20 text-destructive border border-destructive/30"
                          : "text-muted-foreground"
                      }`}
                    >
                      {rank}
                    </span>
                  </div>
                </TableCell>

                {/* Mobile Athlete Identity */}
                <TableCell>
                  {(() => {
                    const avatarUrl = resolvePlayerAvatar(row.player);
                    const teamObj = row.player.realTeam ? findTeam(row.player.realTeam) : null;
                    return (
                      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                        <div className="flex h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 shrink-0 aspect-square items-center justify-center rounded-xl bg-card border border-border p-0.5 shadow-sm overflow-hidden">
                          {avatarUrl ? (
                            <img
                              src={avatarUrl}
                              alt={row.player.realTeam || row.player.gamerTag}
                              className="h-full w-full object-contain filter drop-shadow-sm"
                              loading="lazy"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(row.player?.gamerTag || "player")}`;
                              }}
                            />
                          ) : (
                            <span className="font-black text-xs text-primary">
                              {row.player.gamerTag.slice(0, 2).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                            <span className="font-bold text-white text-xs sm:text-sm tracking-wide group-hover:text-primary transition-colors truncate">
                              {row.player.gamerTag}
                            </span>

                            {row.player.realTeam && (
                              <Badge
                                variant="outline"
                                className="text-xs py-0 px-1.5 font-bold border-primary/40 text-primary bg-primary/20"
                                title={`Official Representation: ${row.player.realTeam}`}
                              >
                                {teamObj?.shortName || row.player.realTeam}
                              </Badge>
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
                            <span>{row.player.fullName}</span>
                            <span>•</span>
                            <span className="font-mono text-muted-foreground text-xs">
                              {row.player.efootballId}
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
                      <span>{row.player.whatsapp}</span>
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
                      <Badge variant="destructive" className="text-xs">
                        Disqualified
                      </Badge>
                    ) : isUcl ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-primary/20 text-primary border border-primary/30">
                        <Trophy className="h-3 w-3" />
                        UCL League
                      </span>
                    ) : isPromotion ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-primary/20 text-primary border border-primary/30">
                        <ArrowUp className="h-3 w-3" />
                        Promoted
                      </span>
                    ) : isEuropa ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-secondary/20 text-secondary border border-secondary/30">
                        <Globe className="h-3 w-3" />
                        Europa League
                      </span>
                    ) : isRelegation ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-destructive/20 text-destructive border border-destructive/30">
                        <ArrowDown className="h-3 w-3" />
                        {divisionName === "Division 1"
                          ? "Relegation (Div 2)"
                          : divisionName === "Division 2"
                          ? "Relegation (Div 3)"
                          : "Relegated"}
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
    </div>
  );
}
