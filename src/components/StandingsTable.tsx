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
  const validStandings = (standings || []).filter((row) => Boolean(row && row.player));

  return (
    <div className="w-full overflow-x-auto no-scrollbar scroll-smooth">
      <Table className="min-w-[620px] sm:min-w-[720px]">
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
            <TableHead className="text-center font-bold text-sky-400">Pts</TableHead>
            {!compact && (
              <>
                <TableHead className="text-center hidden md:table-cell">Form</TableHead>
                <TableHead className="text-center hidden sm:table-cell">Status / Cup</TableHead>
              </>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {validStandings.length === 0 ? (
            <TableRow>
              <TableCell colSpan={compact ? 8 : 12} className="text-center py-10 text-slate-500 italic text-xs">
                No active athlete standings available for {divisionName} yet.
              </TableCell>
            </TableRow>
          ) : validStandings.map((row, idx) => {
              const forms = row.form ? row.form.split(",") : ["D"];
              const rank = row.rank ?? (idx + 1);
              const missed = row.consecutiveMissed || 0;
              const isDisqualified = row.isDisqualified || missed >= 3;

              // Qualification & Relegation flags:
              let isUcl = false;
              let isEuropa = false;
              let isPromotion = false;
              let isRelegation = false;

              const totalRows = validStandings.length;
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

              const cleanWa = row.player?.whatsapp?.replace(/[^0-9]/g, "") || "";

            return (
              <TableRow
                key={row.id}
                className={`group transition-colors ${
                  isDisqualified
                    ? "bg-red-950/20 hover:bg-red-950/30 opacity-75"
                    : isRelegation && !compact
                    ? "bg-red-950/15 hover:bg-red-950/25"
                    : isUcl && !compact
                    ? "hover:bg-sky-950/20"
                    : "hover:bg-slate-800/60"
                }`}
              >
                {/* Rank */}
                <TableCell className="text-center font-bold">
                  <div className="flex items-center justify-center gap-1">
                    <span
                      className={`inline-flex h-6 w-6 items-center justify-center rounded-md text-xs font-black ${
                        isUcl
                          ? "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                          : isPromotion
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : isRelegation
                          ? "bg-red-500/20 text-red-400 border border-red-500/30"
                          : "text-slate-400"
                      }`}
                    >
                      {rank}
                    </span>
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
                        <div className="flex h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 shrink-0 aspect-square items-center justify-center rounded-xl bg-white/95 border border-slate-700/80 p-0.5 shadow-sm overflow-hidden">
                          {avatarUrl ? (
                            <img
                              src={avatarUrl}
                              alt={realTeam || gamerTag}
                              className="h-full w-full object-contain filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]"
                              loading="lazy"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(gamerTag)}`;
                              }}
                            />
                          ) : (
                            <span className="font-black text-xs text-sky-400">
                              {(gamerTag.slice(0, 2) || "PL").toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                            <span className="font-bold text-white text-xs sm:text-sm tracking-wide group-hover:text-sky-400 transition-colors truncate">
                              {gamerTag}
                            </span>

                            {realTeam && (
                              <Badge
                                variant="outline"
                                className="text-[10px] py-0 px-1.5 font-bold border-sky-500/40 text-sky-400 bg-sky-950/20"
                                title={`Official Representation: ${realTeam}`}
                              >
                                {teamObj?.shortName || realTeam}
                              </Badge>
                            )}

                            {missed >= 3 ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-black bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse">
                                <ShieldAlert className="h-3 w-3" />
                                3/3 Missed (Disqualified)
                              </span>
                            ) : missed === 2 ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40">
                                <AlertTriangle className="h-3 w-3" />
                                2/3 Missed Warning
                              </span>
                            ) : null}
                          </div>

                          <div className="flex items-center gap-2 text-[11px] text-slate-400">
                            <span>{fullName}</span>
                            <span>•</span>
                            <span className="font-mono text-slate-500 text-[10px]">
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
                      className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-mono text-[11px]"
                    >
                      <MessageSquare className="h-3 w-3" />
                      <span>{row.player?.whatsapp || "N/A"}</span>
                    </a>
                  </TableCell>
                )}

                {/* Match Stats */}
                <TableCell className="text-center font-medium text-slate-300">
                  {row.played}
                </TableCell>
                <TableCell className="text-center font-medium text-emerald-400">
                  {row.won}
                </TableCell>
                <TableCell className="text-center font-medium text-slate-400">
                  {row.drawn}
                </TableCell>
                <TableCell className="text-center font-medium text-red-400">
                  {row.lost}
                </TableCell>

                {!compact && (
                  <>
                    <TableCell className="text-center text-slate-400 hidden sm:table-cell">
                      {row.goalsFor}
                    </TableCell>
                    <TableCell className="text-center text-slate-400 hidden sm:table-cell">
                      {row.goalsAgainst}
                    </TableCell>
                  </>
                )}

                <TableCell className="text-center font-semibold text-slate-200">
                  {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                </TableCell>

                <TableCell className="text-center font-black text-base text-yellow-400">
                  {row.points}
                </TableCell>

                {/* Form Pills */}
                {!compact && (
                  <TableCell className="text-center hidden md:table-cell">
                    <div className="flex items-center justify-center gap-1">
                      {forms.map((f, i) => (
                        <span
                          key={i}
                          className={`inline-flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold ${
                            f === "W"
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : f === "D"
                              ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                              : "bg-red-500/20 text-red-400 border border-red-500/30"
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
                      <Badge variant="destructive" className="text-[10px]">
                        Disqualified
                      </Badge>
                    ) : isUcl ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/20 text-sky-400 border border-sky-500/30">
                        <Trophy className="h-3 w-3" />
                        UCL League
                      </span>
                    ) : isPromotion ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        <ArrowUp className="h-3 w-3" />
                        Promoted
                      </span>
                    ) : isEuropa ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        <Globe className="h-3 w-3" />
                        Europa League
                      </span>
                    ) : isRelegation ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                        <ArrowDown className="h-3 w-3" />
                        {divisionName === "Division 1"
                          ? "Relegation (Div 2)"
                          : divisionName === "Division 2"
                          ? "Relegation (Div 3)"
                          : "Relegated"}
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-500">Mid-Table</span>
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
