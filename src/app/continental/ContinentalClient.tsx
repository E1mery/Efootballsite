"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Trophy,
  Globe,
  Award,
  Gamepad2,
  Shield,
  Flame,
  CheckCircle,
  Lock,
  Vote,
  AlertTriangle,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function ContinentalClient({
  leagueConfig,
  uclQualified,
  europaQualified,
  uclSlots,
  europaSlots,
  currentPlayer,
}: {
  leagueConfig: any;
  uclQualified: any[];
  europaQualified: any[];
  uclSlots: any[];
  europaSlots: any[];
  currentPlayer?: any;
}) {
  const router = useRouter();
  const [selectedCompetition, setSelectedCompetition] = useState<"UCL" | "EUROPA">("UCL");
  const [votingLoading, setVotingLoading] = useState<string | null>(null);
  const [voteError, setVoteError] = useState<string | null>(null);
  const [voteSuccess, setVoteSuccess] = useState<string | null>(null);

  const isUclStarted = leagueConfig.uclStarted;
  const isEuropaStarted = leagueConfig.europaStarted;

  // Check if current logged-in player is qualified for UCL
  const isPlayerUclQualified = currentPlayer && uclQualified.some((q) => q.playerId === currentPlayer.id);
  // Check if current player is qualified for Europa
  const isPlayerEuropaQualified = currentPlayer && europaQualified.some((q) => q.playerId === currentPlayer.id);

  // Check which group player is currently voted into
  const playerUclSlot = uclSlots.find((s) => s.playerId === currentPlayer?.id);
  const playerEuropaSlot = europaSlots.find((s) => s.playerId === currentPlayer?.id);

  const handleVoteGroup = async (competition: "UCL" | "EUROPA", groupName: string) => {
    if (!currentPlayer) {
      alert("Please log in to your player account to cast your group vote.");
      router.push("/login");
      return;
    }

    setVotingLoading(groupName);
    setVoteError(null);
    setVoteSuccess(null);

    try {
      const res = await fetch("/api/continental/vote-group", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ competition, groupName }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to vote for group");
      }

      setVoteSuccess(data.message);
      setTimeout(() => {
        router.refresh();
      }, 1000);
    } catch (err: any) {
      setVoteError(err.message);
    } finally {
      setVotingLoading(null);
    }
  };

  const groups = ["Group A", "Group B", "Group C", "Group D"];

  return (
    <div className="space-y-12">
      {/* Navigation Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth w-full sm:w-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <button
            onClick={() => {
              setSelectedCompetition("UCL");
              setVoteError(null);
              setVoteSuccess(null);
            }}
            className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all shrink-0 whitespace-nowrap ${
              selectedCompetition === "UCL"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <Trophy className="h-4 w-4 text-yellow-400" />
            <span>eFootball Champions League (UCL)</span>
            {!isUclStarted && <Lock className="h-3.5 w-3.5 text-slate-400" />}
          </button>

          <button
            onClick={() => {
              setSelectedCompetition("EUROPA");
              setVoteError(null);
              setVoteSuccess(null);
            }}
            className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all shrink-0 whitespace-nowrap ${
              selectedCompetition === "EUROPA"
                ? "bg-amber-600 text-white shadow-lg shadow-amber-600/30"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <Globe className="h-4 w-4 text-amber-300" />
            <span>eFootball Europa League (UEL)</span>
            {!isEuropaStarted && <Lock className="h-3.5 w-3.5 text-slate-400" />}
          </button>
        </div>

        {/* Qualification Status for Current Player */}
        {currentPlayer && (
          <div className="text-xs">
            <span className="text-slate-400">Your Status: </span>
            {isPlayerUclQualified ? (
              <Badge variant="live">UCL Qualified ({currentPlayer.division})</Badge>
            ) : isPlayerEuropaQualified ? (
              <Badge variant="yellow">Europa Qualified ({currentPlayer.division})</Badge>
            ) : (
              <Badge variant="secondary">Division Standby</Badge>
            )}
          </div>
        )}
      </div>

      {voteError && (
        <div className="p-4 rounded-2xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-red-400 shrink-0" />
          <span>{voteError}</span>
        </div>
      )}

      {voteSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />
          <span>{voteSuccess}</span>
        </div>
      )}

      {/* ================================================================= */}
      {/* SECTION: UCL COMPETITION */}
      {/* ================================================================= */}
      {selectedCompetition === "UCL" && (
        <div className="space-y-10">
          {!isUclStarted ? (
            <div className="rounded-3xl border border-indigo-500/20 bg-slate-950/90 p-10 text-center space-y-4 shadow-2xl">
              <div className="inline-flex p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
                <Lock className="h-10 w-10" />
              </div>
              <Badge variant="destructive" className="font-mono text-xs">
                TOURNAMENT LOCKED BY DEFAULT
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-black uppercase text-white">
                eFootball Champions League is Pending Commissioner Activation
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
                In accordance with official EFRL regulations, UCL is locked during regular division play. The League Administrator will officially unlock the tournament and voting slots once Division 1, 2, and 3 regular season matches conclude.
              </p>
            </div>
          ) : (
            <div className="space-y-10">
              {/* Group Voting Instructions */}
              <div className="rounded-3xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/40 via-slate-950 to-slate-950 p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Vote className="h-5 w-5 text-indigo-400" />
                      <span className="text-xs font-black uppercase tracking-widest text-indigo-400">
                        Interactive Group Draw & Voting Stage
                      </span>
                    </div>
                    <h3 className="text-2xl font-black uppercase text-white">
                      Select Your UCL Group Slot
                    </h3>
                    <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                      <strong>Strict Rule:</strong> No players who were in the same division can choose the same group (Division 2 and 3: max 1 per group; Division 1: max 2 per group).
                    </p>
                  </div>

                  {playerUclSlot && (
                    <div className="p-3 rounded-2xl bg-indigo-950/60 border border-indigo-500/40 text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Your Current Slot</span>
                      <span className="text-base font-black text-indigo-300">{playerUclSlot.groupName}</span>
                    </div>
                  )}
                </div>

                {/* 4 Interactive Groups Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                  {groups.map((groupName) => {
                    const groupMembers = uclSlots.filter((s) => s.groupName === groupName);
                    const isFull = groupMembers.length >= 4;

                    // Check if current player division is already blocked in this group
                    let isDivisionBlocked = false;
                    if (currentPlayer) {
                      const sameDivCount = groupMembers.filter(
                        (s) => s.playerDivision === currentPlayer.division && s.playerId !== currentPlayer.id
                      ).length;

                      if (
                        (currentPlayer.division === "Division 2" || currentPlayer.division === "Division 3") &&
                        sameDivCount >= 1
                      ) {
                        isDivisionBlocked = true;
                      } else if (currentPlayer.division === "Division 1" && sameDivCount >= 2) {
                        isDivisionBlocked = true;
                      }
                    }

                    const isCurrentInThisGroup = playerUclSlot?.groupName === groupName;

                    return (
                      <div
                        key={groupName}
                        className={`rounded-2xl border p-5 space-y-4 transition-all ${
                          isCurrentInThisGroup
                            ? "border-indigo-400 bg-indigo-950/30 shadow-lg shadow-indigo-500/20"
                            : isDivisionBlocked
                            ? "border-slate-800 bg-slate-950/40 opacity-70"
                            : "border-slate-800 bg-slate-900/60 hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                          <span className="text-sm font-black uppercase text-indigo-300">{groupName}</span>
                          <span className="text-xs font-mono text-slate-400 font-bold">{groupMembers.length}/4 Slots</span>
                        </div>

                        {/* Roster in this Group */}
                        <div className="space-y-2 min-h-[140px]">
                          {groupMembers.length === 0 ? (
                            <p className="text-xs text-slate-500 py-6 text-center">Open group slots available</p>
                          ) : (
                            groupMembers.map((slot, idx) => (
                              <div
                                key={slot.id}
                                className="flex items-center justify-between rounded-xl bg-slate-950/80 p-2 text-xs border border-slate-800"
                              >
                                <span className="font-bold text-white truncate max-w-[100px]">
                                  {idx + 1}. {slot.player.gamerTag}
                                </span>
                                <Badge
                                  variant={
                                    slot.playerDivision === "Division 1"
                                      ? "secondary"
                                      : slot.playerDivision === "Division 2"
                                      ? "yellow"
                                      : "live"
                                  }
                                  className="text-[9px] px-1.5 py-0"
                                >
                                  {slot.playerDivision}
                                </Badge>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Group Action Button */}
                        <div>
                          {isCurrentInThisGroup ? (
                            <Button size="sm" disabled className="w-full text-xs font-bold bg-indigo-600 text-white">
                              ✓ Your Selected Group
                            </Button>
                          ) : isDivisionBlocked ? (
                            <div className="text-center py-1.5 px-2 rounded-xl bg-rose-950/30 border border-rose-500/20 text-[10px] text-rose-300 font-bold">
                              Division Slot Already Taken
                            </div>
                          ) : isFull ? (
                            <div className="text-center py-1.5 px-2 rounded-xl bg-slate-900 text-[10px] text-slate-500 font-bold">
                              Group Full (4/4)
                            </div>
                          ) : isPlayerUclQualified ? (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={votingLoading === groupName}
                              onClick={() => handleVoteGroup("UCL", groupName)}
                              className="w-full text-xs font-bold border-indigo-500/40 text-indigo-300 hover:bg-indigo-600 hover:text-white"
                            >
                              {votingLoading === groupName ? "Joining..." : `Vote / Join ${groupName}`}
                            </Button>
                          ) : (
                            <div className="text-center py-1.5 px-2 rounded-xl bg-slate-900 text-[10px] text-slate-500">
                              UCL Qualifiers Only
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* 16 UCL Qualified Roster */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-400" />
                <span>16 Officially Qualified UCL Esports Athletes</span>
              </h3>
              <span className="text-xs text-slate-400 font-mono">8 from Div 1 • 4 from Div 2 • 4 from Div 3</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {uclQualified.map((s, idx) => (
                <div
                  key={s.id}
                  className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 space-y-1.5 transition-all hover:border-indigo-500/40"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-black text-indigo-400">#{idx + 1}</span>
                    <Badge variant="secondary" className="text-[10px]">
                      {s.seedLabel}
                    </Badge>
                  </div>
                  <h4 className="font-extrabold text-white text-sm">{s.player.gamerTag}</h4>
                  <p className="text-xs text-slate-400">{s.player.fullName}</p>
                  <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="font-mono text-emerald-400">{s.player.whatsapp}</span>
                    <span className="font-bold text-yellow-400">{s.points} Pts</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* SECTION: EUROPA LEAGUE */}
      {/* ================================================================= */}
      {selectedCompetition === "EUROPA" && (
        <div className="space-y-10">
          {!isEuropaStarted ? (
            <div className="rounded-3xl border border-amber-500/20 bg-slate-950/90 p-10 text-center space-y-4 shadow-2xl">
              <div className="inline-flex p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                <Lock className="h-10 w-10" />
              </div>
              <Badge variant="destructive" className="font-mono text-xs">
                TOURNAMENT LOCKED BY DEFAULT
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-black uppercase text-white">
                eFootball Europa League is Pending Commissioner Activation
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
                Europa League is locked during regular division play. The League Administrator will officially unlock the tournament once division stages conclude.
              </p>
            </div>
          ) : (
            <div className="space-y-10">
              {/* Europa Groups */}
              <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-r from-amber-950/40 via-slate-950 to-slate-950 p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Vote className="h-5 w-5 text-amber-400" />
                      <span className="text-xs font-black uppercase tracking-widest text-amber-400">
                        Europa League Group Selection
                      </span>
                    </div>
                    <h3 className="text-2xl font-black uppercase text-white">
                      Europa League Groups & Knockout Slots
                    </h3>
                    <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                      <strong>Strict Rule:</strong> Division separation rules strictly apply.
                    </p>
                  </div>

                  {playerEuropaSlot && (
                    <div className="p-3 rounded-2xl bg-amber-950/60 border border-amber-500/40 text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Your Current Slot</span>
                      <span className="text-base font-black text-amber-300">{playerEuropaSlot.groupName}</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                  {groups.map((groupName) => {
                    const groupMembers = europaSlots.filter((s) => s.groupName === groupName);
                    const isFull = groupMembers.length >= 4;

                    let isDivisionBlocked = false;
                    if (currentPlayer) {
                      const sameDivCount = groupMembers.filter(
                        (s) => s.playerDivision === currentPlayer.division && s.playerId !== currentPlayer.id
                      ).length;
                      if (sameDivCount >= 2) isDivisionBlocked = true;
                    }

                    const isCurrentInThisGroup = playerEuropaSlot?.groupName === groupName;

                    return (
                      <div
                        key={groupName}
                        className={`rounded-2xl border p-5 space-y-4 transition-all ${
                          isCurrentInThisGroup
                            ? "border-amber-400 bg-amber-950/30 shadow-lg shadow-amber-500/20"
                            : isDivisionBlocked
                            ? "border-slate-800 bg-slate-950/40 opacity-70"
                            : "border-slate-800 bg-slate-900/60 hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                          <span className="text-sm font-black uppercase text-amber-300">{groupName}</span>
                          <span className="text-xs font-mono text-slate-400 font-bold">{groupMembers.length}/4 Slots</span>
                        </div>

                        <div className="space-y-2 min-h-[140px]">
                          {groupMembers.length === 0 ? (
                            <p className="text-xs text-slate-500 py-6 text-center">Open group slots available</p>
                          ) : (
                            groupMembers.map((slot, idx) => (
                              <div
                                key={slot.id}
                                className="flex items-center justify-between rounded-xl bg-slate-950/80 p-2 text-xs border border-slate-800"
                              >
                                <span className="font-bold text-white truncate max-w-[100px]">
                                  {idx + 1}. {slot.player.gamerTag}
                                </span>
                                <Badge variant="yellow" className="text-[9px] px-1.5 py-0">
                                  {slot.playerDivision}
                                </Badge>
                              </div>
                            ))
                          )}
                        </div>

                        <div>
                          {isCurrentInThisGroup ? (
                            <Button size="sm" disabled className="w-full text-xs font-bold bg-amber-600 text-white">
                              ✓ Your Selected Group
                            </Button>
                          ) : isDivisionBlocked ? (
                            <div className="text-center py-1.5 px-2 rounded-xl bg-rose-950/30 border border-rose-500/20 text-[10px] text-rose-300 font-bold">
                              Division Slot Taken
                            </div>
                          ) : isFull ? (
                            <div className="text-center py-1.5 px-2 rounded-xl bg-slate-900 text-[10px] text-slate-500 font-bold">
                              Group Full (4/4)
                            </div>
                          ) : isPlayerEuropaQualified ? (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={votingLoading === groupName}
                              onClick={() => handleVoteGroup("EUROPA", groupName)}
                              className="w-full text-xs font-bold border-amber-500/40 text-amber-300 hover:bg-amber-600 hover:text-white"
                            >
                              {votingLoading === groupName ? "Joining..." : `Vote / Join ${groupName}`}
                            </Button>
                          ) : (
                            <div className="text-center py-1.5 px-2 rounded-xl bg-slate-900 text-[10px] text-slate-500">
                              Europa Qualifiers Only
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* 16 Europa Contenders */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Flame className="h-4 w-4 text-amber-400" />
                <span>16 Europa League Qualified Esports Athletes</span>
              </h3>
              <span className="text-xs text-slate-400 font-mono">Div 1 (#9-12) • Div 2 (#5-10) • Div 3 (#5-10)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {europaQualified.map((s, idx) => (
                <div
                  key={s.id}
                  className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 space-y-1.5 transition-all hover:border-amber-500/40"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-black text-amber-400">#{idx + 1}</span>
                    <Badge variant="yellow" className="text-[10px]">
                      {s.seedLabel}
                    </Badge>
                  </div>
                  <h4 className="font-extrabold text-white text-sm">{s.player.gamerTag}</h4>
                  <p className="text-xs text-slate-400">{s.player.fullName}</p>
                  <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="font-mono text-emerald-400">{s.player.whatsapp}</span>
                    <span className="font-bold text-yellow-400">{s.points} Pts</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
