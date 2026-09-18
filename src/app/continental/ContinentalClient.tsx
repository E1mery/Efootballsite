"use client";

import { useState, useEffect } from "react";
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
  Calendar,
  Sparkles,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function ContinentalClient({
  leagueConfig,
  uclQualified,
  europaQualified,
  uclSlots,
  europaSlots,
  uclMatches = [],
  europaMatches = [],
  uclGroupStandings = [],
  europaGroupStandings = [],
  isDivisionSeasonFinished = false,
  currentPlayer,
}: {
  leagueConfig: any;
  uclQualified: any[];
  europaQualified: any[];
  uclSlots: any[];
  europaSlots: any[];
  uclMatches?: any[];
  europaMatches?: any[];
  uclGroupStandings?: any[];
  europaGroupStandings?: any[];
  isDivisionSeasonFinished?: boolean;
  currentPlayer?: any;
}) {
  const router = useRouter();
  const [selectedCompetition, setSelectedCompetition] = useState<"UCL" | "EUROPA">("UCL");
  const [activeTab, setActiveTab] = useState<"DRAWS" | "GROUPS" | "KNOCKOUT" | "TROPHY_POLL">("DRAWS");

  const [votingLoading, setVotingLoading] = useState<string | null>(null);
  const [voteError, setVoteError] = useState<string | null>(null);
  const [voteSuccess, setVoteSuccess] = useState<string | null>(null);

  // Trophy Poll state
  const [pollData, setPollData] = useState<any>(null);
  const [pollLoading, setPollLoading] = useState(false);
  const [castingVote, setCastingVote] = useState(false);
  const [pollMsg, setPollMsg] = useState<string | null>(null);

  const isUclStarted = leagueConfig.uclStarted;
  const isEuropaStarted = leagueConfig.europaStarted;
  const isStarted = selectedCompetition === "UCL" ? isUclStarted : isEuropaStarted;

  const currentMatches = selectedCompetition === "UCL" ? uclMatches : europaMatches;
  const currentStandings = selectedCompetition === "UCL" ? uclGroupStandings : europaGroupStandings;
  const currentSlots = selectedCompetition === "UCL" ? uclSlots : europaSlots;
  const currentQualified = selectedCompetition === "UCL" ? uclQualified : europaQualified;

  // Filter matches by stage
  const groupMatches = currentMatches.filter((m) => m.stage === "GROUP" || m.round.includes("Group Stage"));
  const qfMatches = currentMatches.filter((m) => m.stage === "QUARTER_FINAL" || m.round.includes("Quarter-Final"));
  const sfMatches = currentMatches.filter((m) => m.stage === "SEMI_FINAL" || m.round.includes("Semi-Final"));
  const finalMatch = currentMatches.find((m) => m.stage === "FINAL" || m.round.includes("Grand Final"));

  // Check if current logged-in player is qualified
  const isPlayerUclQualified = currentPlayer && uclQualified.some((q) => q.playerId === currentPlayer.id);
  const isPlayerEuropaQualified = currentPlayer && europaQualified.some((q) => q.playerId === currentPlayer.id);
  const isCurrentQualified = selectedCompetition === "UCL" ? isPlayerUclQualified : isPlayerEuropaQualified;

  const playerUclSlot = uclSlots.find((s) => s.playerId === currentPlayer?.id);
  const playerEuropaSlot = europaSlots.find((s) => s.playerId === currentPlayer?.id);
  const playerCurrentSlot = selectedCompetition === "UCL" ? playerUclSlot : playerEuropaSlot;

  // Fetch trophy poll data
  useEffect(() => {
    async function loadPoll() {
      try {
        setPollLoading(true);
        const res = await fetch(`/api/continental/trophy-poll?competition=${selectedCompetition}`);
        const data = await res.json();
        setPollData(data);
      } catch (err) {
        console.error("Poll fetch error:", err);
      } finally {
        setPollLoading(false);
      }
    }
    loadPoll();
  }, [selectedCompetition]);

  const handleCastTrophyVote = async (predictedWinnerPlayerId: string) => {
    if (!currentPlayer) {
      alert("Please log in to participate in the Grand Final Trophy Prediction Poll.");
      router.push("/login");
      return;
    }

    setCastingVote(true);
    setPollMsg(null);
    try {
      const res = await fetch("/api/continental/trophy-poll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ competition: selectedCompetition, predictedWinnerPlayerId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to vote");
      setPollMsg(data.message);
      // Reload poll
      const pollRes = await fetch(`/api/continental/trophy-poll?competition=${selectedCompetition}`);
      const refreshedData = await pollRes.json();
      setPollData(refreshedData);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setCastingVote(false);
    }
  };

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
    <div className="space-y-8">
      {/* Navigation Switcher: UCL vs EUROPA */}
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

      {/* Division Regular Season Status Notice */}
      {!isDivisionSeasonFinished && (
        <div className="rounded-2xl border border-sky-500/30 bg-sky-950/20 p-4 text-xs text-sky-300 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-sky-400 shrink-0" />
            <span>
              <strong>Regular Division Season Active:</strong> UCL and Europa continental cups unlock upon the conclusion of Division 1, 2, and 3 season matches.
            </span>
          </div>
          <Badge variant="secondary" className="font-mono text-[10px] shrink-0">
            Division Season in Play
          </Badge>
        </div>
      )}

      {/* Tournament Stage Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto no-scrollbar scroll-smooth -mx-4 px-4 sm:mx-0 sm:px-0">
        <button
          onClick={() => setActiveTab("DRAWS")}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all shrink-0 whitespace-nowrap min-h-[38px] ${
            activeTab === "DRAWS"
              ? selectedCompetition === "UCL"
                ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/40"
                : "bg-amber-600/20 text-amber-300 border border-amber-500/40"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Vote className="h-3.5 w-3.5" />
          <span>Interactive Group Draws</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300">
            {currentSlots.length}/16
          </span>
        </button>

        <button
          onClick={() => setActiveTab("GROUPS")}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all shrink-0 whitespace-nowrap min-h-[38px] ${
            activeTab === "GROUPS"
              ? selectedCompetition === "UCL"
                ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/40"
                : "bg-amber-600/20 text-amber-300 border border-amber-500/40"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Calendar className="h-3.5 w-3.5" />
          <span>Group Stage (2-Leg Matches)</span>
          {groupMatches.length > 0 && (
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-800 text-emerald-400">
              {groupMatches.filter((m) => m.status === "FINISHED").length}/{groupMatches.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("KNOCKOUT")}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all shrink-0 whitespace-nowrap min-h-[38px] ${
            activeTab === "KNOCKOUT"
              ? selectedCompetition === "UCL"
                ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/40"
                : "bg-amber-600/20 text-amber-300 border border-amber-500/40"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Trophy className="h-3.5 w-3.5" />
          <span>Knockouts (QF, SF, Final)</span>
        </button>

        {pollData?.active && (
          <button
            onClick={() => setActiveTab("TROPHY_POLL")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all animate-pulse shrink-0 whitespace-nowrap min-h-[38px] ${
              activeTab === "TROPHY_POLL"
                ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/50"
                : "text-yellow-400 hover:bg-yellow-500/10"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-yellow-400" />
            <span>Grand Final Trophy Poll</span>
            <span className="text-[10px] font-mono px-1.5 rounded-full bg-yellow-400 text-slate-950 font-black">
              LIVE
            </span>
          </button>
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

      {/* ===================================================================== */}
      {/* TAB 1: INTERACTIVE PLAYER GROUP DRAWS */}
      {/* ===================================================================== */}
      {activeTab === "DRAWS" && (
        <div className="space-y-8">
          {!isStarted ? (
            <div className="rounded-3xl border border-indigo-500/20 bg-slate-950/90 p-10 text-center space-y-4 shadow-2xl">
              <div className="inline-flex p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
                <Lock className="h-10 w-10" />
              </div>
              <Badge variant="destructive" className="font-mono text-xs">
                TOURNAMENT LOCKED PENDING COMMISSIONER ACTIVATION
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-black uppercase text-white">
                eFootball {selectedCompetition} Group Draws
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
                Group draws will be triggered by the League Administrator once division matches conclude. Qualified athletes will choose their groups through this portal.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Group Voting Banner & Division Rules */}
              <div
                className={`rounded-3xl border p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-4 ${
                  selectedCompetition === "UCL"
                    ? "border-indigo-500/30 bg-gradient-to-r from-indigo-950/40 via-slate-950 to-slate-950"
                    : "border-amber-500/30 bg-gradient-to-r from-amber-950/40 via-slate-950 to-slate-950"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Vote className="h-5 w-5 text-indigo-400" />
                      <span className="text-xs font-black uppercase tracking-widest text-indigo-400">
                        Live Player Group Draw Phase
                      </span>
                    </div>
                    <h3 className="text-2xl font-black uppercase text-white">
                      {selectedCompetition} Interactive Group Selection
                    </h3>
                    <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                      <strong>Division Separation Rule:</strong> No 3 players from the same division can vote for or participate in the same group (maximum 2 players per division per group). All draws are transparent and visible to all athletes.
                    </p>
                  </div>

                  {playerCurrentSlot && (
                    <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-700 text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Your Current Slot</span>
                      <span className="text-base font-black text-indigo-300">{playerCurrentSlot.groupName}</span>
                    </div>
                  )}
                </div>

                {/* 4 Interactive Groups Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                  {groups.map((groupName) => {
                    const groupMembers = currentSlots.filter((s) => s.groupName === groupName);
                    const isFull = groupMembers.length >= 4;

                    // Enforce rule: No 3 players from same division
                    let isDivisionBlocked = false;
                    if (currentPlayer) {
                      const sameDivCount = groupMembers.filter(
                        (s) => s.playerDivision === currentPlayer.division && s.playerId !== currentPlayer.id
                      ).length;
                      if (sameDivCount >= 2) isDivisionBlocked = true;
                    }

                    const isCurrentInThisGroup = playerCurrentSlot?.groupName === groupName;

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

                        {/* Action Button */}
                        <div>
                          {isCurrentInThisGroup ? (
                            <Button size="sm" disabled className="w-full text-xs font-bold bg-indigo-600 text-white">
                              ✓ Your Selected Group
                            </Button>
                          ) : isDivisionBlocked ? (
                            <div className="text-center py-1.5 px-2 rounded-xl bg-rose-950/30 border border-rose-500/20 text-[10px] text-rose-300 font-bold">
                              Division Cap (Max 2 from {currentPlayer?.division})
                            </div>
                          ) : isFull ? (
                            <div className="text-center py-1.5 px-2 rounded-xl bg-slate-900 text-[10px] text-slate-500 font-bold">
                              Group Full (4/4)
                            </div>
                          ) : isCurrentQualified ? (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={votingLoading === groupName}
                              onClick={() => handleVoteGroup(selectedCompetition, groupName)}
                              className="w-full text-xs font-bold border-indigo-500/40 text-indigo-300 hover:bg-indigo-600 hover:text-white"
                            >
                              {votingLoading === groupName ? "Joining..." : `Vote / Join ${groupName}`}
                            </Button>
                          ) : (
                            <div className="text-center py-1.5 px-2 rounded-xl bg-slate-900 text-[10px] text-slate-500">
                              {selectedCompetition} Qualifiers Only
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

          {/* Qualified Roster List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-400" />
                <span>16 Officially Qualified {selectedCompetition} Athletes</span>
              </h3>
              <span className="text-xs text-slate-400 font-mono">
                {selectedCompetition === "UCL"
                  ? "8 from Div 1 • 4 from Div 2 • 4 from Div 3"
                  : "4 from Div 1 • 6 from Div 2 • 6 from Div 3"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {currentQualified.map((s, idx) => (
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

      {/* ===================================================================== */}
      {/* TAB 2: GROUP STAGE (STANDINGS & 2-LEGGED FIXTURES) */}
      {/* ===================================================================== */}
      {activeTab === "GROUPS" && (
        <div className="space-y-8">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <span className="font-bold text-white block">Group Stage Format: 2-Legged Simultaneous Matches</span>
              <span className="text-slate-400">
                Each fixture consists of Home and Away legs played in the same session. Players upload 2 screenshot proofs and enter aggregate goals. Top 2 in each group advance to Quarter-Finals.
              </span>
            </div>
            <Badge variant="yellow" className="self-start sm:self-center font-mono">
              Top 2 Advance to QF
            </Badge>
          </div>

          {/* Group Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {groups.map((grp) => {
              const grpStandings = currentStandings.filter((s) => s.division.includes(grp));
              return (
                <div key={grp} className="rounded-2xl border border-slate-800 bg-slate-950/90 p-5 space-y-3 shadow-lg">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-black uppercase text-sm text-white">{grp} Table</span>
                    <span className="text-[11px] text-slate-400 font-mono">Top 2 Qualify for QF</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="text-[10px] uppercase text-slate-500 border-b border-slate-800/60">
                          <th className="py-2">Pos</th>
                          <th className="py-2">Athlete</th>
                          <th className="py-2 text-center">P</th>
                          <th className="py-2 text-center">W</th>
                          <th className="py-2 text-center">D</th>
                          <th className="py-2 text-center">L</th>
                          <th className="py-2 text-center">GD</th>
                          <th className="py-2 text-right">Pts</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/40">
                        {grpStandings.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="py-4 text-center text-slate-500">
                              No matches recorded yet
                            </td>
                          </tr>
                        ) : (
                          grpStandings.map((s, idx) => (
                            <tr
                              key={s.id}
                              className={`transition-colors ${idx < 2 ? "bg-emerald-950/10 font-bold" : ""}`}
                            >
                              <td className="py-2 font-mono">
                                <span
                                  className={`inline-block w-5 h-5 rounded-full text-center text-[10px] leading-5 ${
                                    idx < 2 ? "bg-emerald-500/20 text-emerald-300 font-bold" : "text-slate-500"
                                  }`}
                                >
                                  {idx + 1}
                                </span>
                              </td>
                              <td className="py-2 text-white truncate max-w-[120px]">{s.player.gamerTag}</td>
                              <td className="py-2 text-center font-mono text-slate-300">{s.played}</td>
                              <td className="py-2 text-center font-mono text-slate-300">{s.won}</td>
                              <td className="py-2 text-center font-mono text-slate-300">{s.drawn}</td>
                              <td className="py-2 text-center font-mono text-slate-300">{s.lost}</td>
                              <td className="py-2 text-center font-mono text-slate-300">
                                {s.goalDifference > 0 ? `+${s.goalDifference}` : s.goalDifference}
                              </td>
                              <td className="py-2 text-right font-mono font-black text-yellow-400">{s.points}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Group Fixtures List */}
          <div className="space-y-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
              <Calendar className="h-4 w-4 text-sky-400" />
              <span>Group Stage Fixtures (2-Legged Simultaneous Matches)</span>
            </h3>

            {groupMatches.length === 0 ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8 text-center text-xs text-slate-400">
                Group stage fixtures have not yet been generated by the commissioner. Complete the group draws first.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {groupMatches.map((m) => {
                  const isFinished = m.status === "FINISHED";
                  const hasLeg2 = m.leg2HomeScore !== null && m.leg2AwayScore !== null;
                  const aggHome = m.aggregateHomeScore ?? (isFinished ? (m.homeScore || 0) + (m.leg2HomeScore || 0) : null);
                  const aggAway = m.aggregateAwayScore ?? (isFinished ? (m.awayScore || 0) + (m.leg2AwayScore || 0) : null);

                  return (
                    <div
                      key={m.id}
                      className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 space-y-3 hover:border-slate-700 transition-all"
                    >
                      <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800/60 pb-2">
                        <span className="font-bold text-indigo-400">
                          {m.groupName || "Group Stage"} • {m.round}
                        </span>
                        <Badge
                          variant={isFinished ? "secondary" : "destructive"}
                          className="text-[9px] px-1.5 py-0"
                        >
                          {isFinished ? "FINISHED" : "SCHEDULED"}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-3 items-center text-center">
                        <div className="text-left">
                          <span className="font-bold text-white block text-sm">{m.homePlayer.gamerTag}</span>
                          <span className="text-[10px] text-slate-500">{m.homePlayer.division}</span>
                        </div>

                        <div className="space-y-1">
                          {isFinished ? (
                            <div>
                              <span className="text-lg font-black text-yellow-400 font-mono">
                                {m.homeScore} - {m.awayScore}
                              </span>
                              {hasLeg2 && (
                                <span className="text-[10px] text-slate-400 block font-mono">
                                  Leg 2: {m.leg2HomeScore} - {m.leg2AwayScore}
                                </span>
                              )}
                              {aggHome !== null && aggAway !== null && (
                                <span className="text-[10px] font-bold text-emerald-400 block font-mono">
                                  Agg: {aggHome} - {aggAway}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs font-mono text-slate-500">2-Leg Match</span>
                          )}
                        </div>

                        <div className="text-right">
                          <span className="font-bold text-white block text-sm">{m.awayPlayer.gamerTag}</span>
                          <span className="text-[10px] text-slate-500">{m.awayPlayer.division}</span>
                        </div>
                      </div>

                      {m.screenshotUrl && (
                        <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">Proofs:</span>
                          <div className="flex gap-2">
                            <a
                              href={m.screenshotUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-sky-400 hover:underline"
                            >
                              Leg 1 Proof
                            </a>
                            {m.leg2ScreenshotUrl && (
                              <a
                                href={m.leg2ScreenshotUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-sky-400 hover:underline"
                              >
                                • Leg 2 Proof
                              </a>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: KNOCKOUT STAGE (QF, SF, FINAL) */}
      {/* ===================================================================== */}
      {activeTab === "KNOCKOUT" && (
        <div className="space-y-8">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 text-xs text-slate-300 space-y-1">
            <span className="font-bold text-white block">Knockout Stage Progression:</span>
            <p className="text-slate-400">
              • <strong>Quarter-Finals & Semi-Finals:</strong> 2 legs played simultaneously. Aggregate scores decide who advances.
            </p>
            <p className="text-slate-400">
              • <strong>Grand Final:</strong> Single-match showdown (1 leg). Winner lifts the {selectedCompetition} Trophy!
            </p>
          </div>

          {/* Quarter Finals */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-sm font-black uppercase text-white flex items-center gap-2">
                <Shield className="h-4 w-4 text-indigo-400" />
                <span>Quarter-Finals (2 Legs at Once • Aggregate Decider)</span>
              </h3>
              <Badge variant="secondary" className="text-[10px]">
                8 Players
              </Badge>
            </div>

            {qfMatches.length === 0 ? (
              <p className="text-xs text-slate-500 py-4">Quarter-Finals will be generated once group stage concludes.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {qfMatches.map((m) => {
                  const isFinished = m.status === "FINISHED";
                  const aggHome = m.aggregateHomeScore ?? (isFinished ? (m.homeScore || 0) + (m.leg2HomeScore || 0) : null);
                  const aggAway = m.aggregateAwayScore ?? (isFinished ? (m.awayScore || 0) + (m.leg2AwayScore || 0) : null);

                  return (
                    <div key={m.id} className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span className="font-bold text-indigo-300">{m.round}</span>
                        <span>{isFinished ? "FINISHED" : "SCHEDULED"}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm font-bold text-white">
                        <span>{m.homePlayer.gamerTag}</span>
                        {isFinished ? (
                          <span className="font-mono text-yellow-400">
                            Agg: {aggHome} - {aggAway}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500">vs</span>
                        )}
                        <span>{m.awayPlayer.gamerTag}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Semi Finals */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-sm font-black uppercase text-white flex items-center gap-2">
                <Flame className="h-4 w-4 text-amber-400" />
                <span>Semi-Finals (2 Legs at Once • Aggregate Decider)</span>
              </h3>
              <Badge variant="yellow" className="text-[10px]">
                4 Players
              </Badge>
            </div>

            {sfMatches.length === 0 ? (
              <p className="text-xs text-slate-500 py-4">Semi-Finals will be generated once Quarter-Finals conclude.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sfMatches.map((m) => {
                  const isFinished = m.status === "FINISHED";
                  const aggHome = m.aggregateHomeScore ?? (isFinished ? (m.homeScore || 0) + (m.leg2HomeScore || 0) : null);
                  const aggAway = m.aggregateAwayScore ?? (isFinished ? (m.awayScore || 0) + (m.leg2AwayScore || 0) : null);

                  return (
                    <div key={m.id} className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span className="font-bold text-amber-300">{m.round}</span>
                        <span>{isFinished ? "FINISHED" : "SCHEDULED"}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm font-bold text-white">
                        <span>{m.homePlayer.gamerTag}</span>
                        {isFinished ? (
                          <span className="font-mono text-yellow-400">
                            Agg: {aggHome} - {aggAway}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500">vs</span>
                        )}
                        <span>{m.awayPlayer.gamerTag}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Grand Final */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-sm font-black uppercase text-white flex items-center gap-2">
                <Trophy className="h-4 w-4 text-yellow-400" />
                <span>The Grand Final (Single Match Showdown • 1 Leg Only)</span>
              </h3>
              <Badge variant="live" className="text-[10px]">
                CHAMPIONSHIP MATCH
              </Badge>
            </div>

            {!finalMatch ? (
              <p className="text-xs text-slate-500 py-4">Grand Final will be unlocked once Semi-Finals conclude.</p>
            ) : (
              <div className="rounded-3xl border border-yellow-500/40 bg-gradient-to-b from-yellow-950/20 via-slate-950 to-slate-950 p-6 sm:p-8 text-center space-y-6 shadow-2xl">
                <Badge variant="yellow" className="font-black tracking-widest text-xs uppercase px-3 py-1">
                  OFFICIAL GRAND FINAL
                </Badge>

                <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-6">
                  <div className="space-y-1 text-center sm:text-right">
                    <h4 className="text-xl font-black text-white">{finalMatch.homePlayer.gamerTag}</h4>
                    <p className="text-xs text-slate-400">{finalMatch.homePlayer.fullName}</p>
                    <Badge variant="secondary" className="text-[10px]">
                      {finalMatch.homePlayer.division}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <Trophy className="h-12 w-12 text-yellow-400 mx-auto animate-bounce" />
                    {finalMatch.status === "FINISHED" ? (
                      <span className="text-3xl font-black text-yellow-400 font-mono">
                        {finalMatch.homeScore} - {finalMatch.awayScore}
                      </span>
                    ) : (
                      <span className="text-sm font-bold text-slate-400 uppercase tracking-widest block">
                        Single Match Final
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 text-center sm:text-left">
                    <h4 className="text-xl font-black text-white">{finalMatch.awayPlayer.gamerTag}</h4>
                    <p className="text-xs text-slate-400">{finalMatch.awayPlayer.fullName}</p>
                    <Badge variant="secondary" className="text-[10px]">
                      {finalMatch.awayPlayer.division}
                    </Badge>
                  </div>
                </div>

                {/* Trophy Poll button link */}
                <div className="pt-4 border-t border-slate-800">
                  <Button
                    onClick={() => setActiveTab("TROPHY_POLL")}
                    className="bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black text-xs uppercase tracking-wider"
                  >
                    🏆 Vote in the Grand Final Trophy Prediction Poll
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 4: GRAND FINAL TROPHY PREDICTION POLL */}
      {/* ===================================================================== */}
      {activeTab === "TROPHY_POLL" && (
        <div className="space-y-6">
          {!pollData?.active ? (
            <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-8 text-center space-y-3">
              <Trophy className="h-10 w-10 text-slate-600 mx-auto" />
              <h3 className="text-lg font-bold text-white">Trophy Prediction Poll Unavailable</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                The Trophy Prediction Poll activates automatically when the two Grand Finalists are decided following the Semi-Finals. All players across the league (including reserve pool) will be invited to vote.
              </p>
            </div>
          ) : (
            <div className="rounded-3xl border border-yellow-500/40 bg-gradient-to-r from-yellow-950/30 via-slate-950 to-indigo-950/30 p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="h-5 w-5 text-yellow-400" />
                    <span className="text-xs font-black uppercase tracking-widest text-yellow-400">
                      League-Wide Championship Poll
                    </span>
                  </div>
                  <h2 className="text-2xl font-black uppercase text-white">
                    Who Will Lift the {selectedCompetition} Trophy?
                  </h2>
                  <p className="text-xs text-slate-300 mt-1">
                    Open to all players in the league, including the reserve pool. Cast your vote for the ultimate champion!
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Total Predictions Cast</span>
                  <span className="text-2xl font-black text-yellow-400 font-mono">{pollData.totalVotes}</span>
                </div>
              </div>

              {pollMsg && (
                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>{pollMsg}</span>
                </div>
              )}

              {/* Finalists Prediction Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Finalist 1 */}
                <div
                  className={`rounded-2xl border p-6 space-y-4 text-center transition-all ${
                    pollData.userVotedWinnerId === pollData.finalist1.id
                      ? "border-yellow-400 bg-yellow-950/20 shadow-lg shadow-yellow-500/20"
                      : "border-slate-800 bg-slate-900/60"
                  }`}
                >
                  <Badge variant="secondary" className="text-[10px]">
                    Finalist 1 • {pollData.finalist1.division}
                  </Badge>
                  <h3 className="text-2xl font-black text-white">{pollData.finalist1.gamerTag}</h3>
                  <p className="text-xs text-slate-400">{pollData.finalist1.fullName}</p>

                  <div className="pt-2">
                    <span className="text-4xl font-black text-yellow-400 font-mono">
                      {pollData.finalist1.percentage}%
                    </span>
                    <span className="text-xs text-slate-400 block mt-1 font-mono">
                      {pollData.finalist1.votes} votes
                    </span>
                  </div>

                  <Button
                    onClick={() => handleCastTrophyVote(pollData.finalist1.id)}
                    disabled={castingVote}
                    className={`w-full text-xs font-bold uppercase tracking-wider ${
                      pollData.userVotedWinnerId === pollData.finalist1.id
                        ? "bg-yellow-500 text-slate-950 font-black"
                        : "bg-slate-800 hover:bg-yellow-500 hover:text-slate-950 text-white"
                    }`}
                  >
                    {pollData.userVotedWinnerId === pollData.finalist1.id
                      ? "✓ Your Predicted Champion"
                      : `Vote ${pollData.finalist1.gamerTag} to Win`}
                  </Button>
                </div>

                {/* Finalist 2 */}
                <div
                  className={`rounded-2xl border p-6 space-y-4 text-center transition-all ${
                    pollData.userVotedWinnerId === pollData.finalist2.id
                      ? "border-yellow-400 bg-yellow-950/20 shadow-lg shadow-yellow-500/20"
                      : "border-slate-800 bg-slate-900/60"
                  }`}
                >
                  <Badge variant="secondary" className="text-[10px]">
                    Finalist 2 • {pollData.finalist2.division}
                  </Badge>
                  <h3 className="text-2xl font-black text-white">{pollData.finalist2.gamerTag}</h3>
                  <p className="text-xs text-slate-400">{pollData.finalist2.fullName}</p>

                  <div className="pt-2">
                    <span className="text-4xl font-black text-yellow-400 font-mono">
                      {pollData.finalist2.percentage}%
                    </span>
                    <span className="text-xs text-slate-400 block mt-1 font-mono">
                      {pollData.finalist2.votes} votes
                    </span>
                  </div>

                  <Button
                    onClick={() => handleCastTrophyVote(pollData.finalist2.id)}
                    disabled={castingVote}
                    className={`w-full text-xs font-bold uppercase tracking-wider ${
                      pollData.userVotedWinnerId === pollData.finalist2.id
                        ? "bg-yellow-500 text-slate-950 font-black"
                        : "bg-slate-800 hover:bg-yellow-500 hover:text-slate-950 text-white"
                    }`}
                  >
                    {pollData.userVotedWinnerId === pollData.finalist2.id
                      ? "✓ Your Predicted Champion"
                      : `Vote ${pollData.finalist2.gamerTag} to Win`}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
