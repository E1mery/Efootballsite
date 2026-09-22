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
  Clock,
  Play,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ContinentalDrawExperience from "@/components/ContinentalDrawExperience";
import { resolvePlayerAvatar, findTeam } from "@/lib/teams";

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
  isAdmin = false,
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
  isAdmin?: boolean;
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

  // Scheduled Draw Date & Time
  const scheduledDrawTime =
    selectedCompetition === "UCL" ? leagueConfig.uclDrawTime : leagueConfig.europaDrawTime;

  const isDrawCompleted =
    selectedCompetition === "UCL" ? leagueConfig.uclDrawCompleted : leagueConfig.europaDrawCompleted;

  const [drawCountdown, setDrawCountdown] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isDue: boolean;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, isDue: false });

  useEffect(() => {
    if (!scheduledDrawTime) return;

    const calcCountdown = () => {
      const target = new Date(scheduledDrawTime).getTime();
      const now = Date.now();
      const diff = target - now;

      if (diff <= 0) {
        setDrawCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0, isDue: true });
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setDrawCountdown({ days, hours, minutes, seconds, isDue: false });
      }
    };

    calcCountdown();
    const interval = setInterval(calcCountdown, 1000);
    return () => clearInterval(interval);
  }, [scheduledDrawTime]);

  const handleCommitOfficialDraw = async (slots: any[]) => {
    const res = await fetch("/api/admin/continental/schedule-draw", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "COMMIT_DRAW",
        competition: selectedCompetition,
        slots,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to commit official draw");
    setVoteSuccess(`Official ${selectedCompetition} Draw locked & saved!`);
    setTimeout(() => {
      router.refresh();
    }, 1200);
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
      {/* TAB 1: OFFICIAL LIVE ANIMATED DRAWS EVENT */}
      {/* ===================================================================== */}
      {activeTab === "DRAWS" && (
        <div className="space-y-8">
          {/* Scheduled Future Draw Countdown (if not yet due and not unlocked and not admin) */}
          {scheduledDrawTime && !drawCountdown.isDue && !isStarted && !isAdmin ? (
            <div className="rounded-3xl border border-indigo-500/30 bg-gradient-to-b from-indigo-950/60 via-slate-950 to-slate-950 p-8 sm:p-12 text-center space-y-6 shadow-2xl backdrop-blur-xl">
              <div className="inline-flex p-4 rounded-2xl bg-indigo-500/15 border border-indigo-500/40 text-indigo-400">
                <Clock className="h-10 w-10 animate-pulse" />
              </div>

              <div className="space-y-2">
                <Badge variant="yellow" className="text-xs font-black tracking-widest uppercase">
                  Official Draws Event Countdown
                </Badge>
                <h2 className="text-3xl sm:text-4xl font-black uppercase text-white tracking-tight">
                  eFootball {selectedCompetition} Group Draws Broadcast
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
                  Scheduled by League Commissioner for{" "}
                  <strong className="text-white">
                    {new Date(scheduledDrawTime).toLocaleDateString()} at{" "}
                    {new Date(scheduledDrawTime).toLocaleTimeString()}
                  </strong>
                  . The live animated spin draw will unlock when this timer reaches 00:00:00.
                </p>
              </div>

              {/* Countdown Digits */}
              <div className="grid grid-cols-4 gap-3 max-w-md mx-auto pt-2">
                <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800">
                  <span className="text-2xl sm:text-3xl font-black text-white font-mono block">
                    {String(drawCountdown.days).padStart(2, "0")}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-slate-500">Days</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800">
                  <span className="text-2xl sm:text-3xl font-black text-white font-mono block">
                    {String(drawCountdown.hours).padStart(2, "0")}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-slate-500">Hours</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800">
                  <span className="text-2xl sm:text-3xl font-black text-white font-mono block">
                    {String(drawCountdown.minutes).padStart(2, "0")}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-slate-500">Minutes</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800">
                  <span className="text-2xl sm:text-3xl font-black text-indigo-400 font-mono block animate-pulse">
                    {String(drawCountdown.seconds).padStart(2, "0")}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-slate-500">Seconds</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 max-w-lg mx-auto text-xs text-slate-400">
                ⚡ <strong>UEFA-style Division Protection:</strong> The animated draw system will automatically ensure no group has more than 2 athletes from the same league!
              </div>
            </div>
          ) : !isStarted && !isAdmin && !scheduledDrawTime ? (
            <div className="rounded-3xl border border-indigo-500/20 bg-slate-950/90 p-10 text-center space-y-4 shadow-2xl">
              <div className="inline-flex p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
                <Lock className="h-10 w-10" />
              </div>
              <Badge variant="destructive" className="font-mono text-xs">
                TOURNAMENT LOCKED PENDING COMMISSIONER SCHEDULING
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-black uppercase text-white">
                eFootball {selectedCompetition} Group Draws
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
                Official group draws will be unlocked and scheduled by the League Administrator after regular season division fixtures conclude.
              </p>
            </div>
          ) : (
            /* Broadcast-Grade Animated Draw Experience */
            <ContinentalDrawExperience
              competition={selectedCompetition}
              qualifiedAthletes={currentQualified.map((q) => ({
                id: q.player.id,
                gamerTag: q.player.gamerTag,
                fullName: q.player.fullName,
                division: q.player.division,
                realTeam: q.player.realTeam,
                avatar: q.player.avatar,
                overallRating: q.player.overallRating || 85,
              }))}
              existingSlots={currentSlots}
              isAdmin={isAdmin}
              onCommitDraw={isAdmin ? handleCommitOfficialDraw : undefined}
            />
          )}

          {/* Qualified Roster List (Grouped by Pots with Club Crests) */}
          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-400" />
                <span>16 Officially Qualified {selectedCompetition} Athletes</span>
              </h3>
              <span className="text-xs text-slate-400 font-mono">
                {selectedCompetition === "UCL"
                  ? "8 from Div 1 (Premier League) • 4 from Div 2 (La Liga) • 4 from Div 3 (Serie A)"
                  : "4 from Div 1 (Premier League) • 6 from Div 2 (La Liga) • 6 from Div 3 (Serie A)"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {currentQualified.map((s, idx) => {
                const avatarUrl = resolvePlayerAvatar(s.player);
                return (
                  <div
                    key={s.id}
                    className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 space-y-2 transition-all hover:border-indigo-500/40"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-black text-indigo-400">#{idx + 1}</span>
                      <Badge variant="secondary" className="text-[10px]">
                        {s.seedLabel}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-3">
                      <img
                        src={avatarUrl}
                        alt={s.player.gamerTag}
                        className="h-10 w-10 rounded-xl object-contain bg-slate-900 p-1 border border-slate-800 shrink-0 shadow-md"
                        onError={(e: any) => {
                          e.target.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${s.player.gamerTag}`;
                        }}
                      />
                      <div className="truncate">
                        <h4 className="font-extrabold text-white text-sm truncate">
                          {s.player.gamerTag}
                        </h4>
                        {s.player.realTeam ? (
                          <span className="text-xs font-bold text-amber-400 truncate block">
                            {s.player.realTeam}
                          </span>
                        ) : (
                          <p className="text-[11px] text-slate-400 truncate">{s.player.fullName}</p>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-[11px] text-slate-500">
                      <Badge
                        variant={
                          s.player.division === "Division 1"
                            ? "secondary"
                            : s.player.division === "Division 2"
                            ? "yellow"
                            : "live"
                        }
                        className="text-[9px] px-1 py-0"
                      >
                        {s.player.division}
                      </Badge>
                      <span className="font-bold text-yellow-400">{s.points} Pts</span>
                    </div>
                  </div>
                );
              })}
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
                              <td className="py-2.5 text-white">
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="h-6 w-6 rounded-md bg-slate-900 border border-slate-800 p-0.5 flex items-center justify-center shrink-0 overflow-hidden">
                                    <img
                                      src={resolvePlayerAvatar(s.player)}
                                      alt={s.player.realTeam || s.player.gamerTag}
                                      className="h-full w-full object-contain"
                                    />
                                  </div>
                                  <div className="truncate">
                                    <div className="flex items-center gap-1.5 truncate">
                                      <span className="font-bold truncate text-xs">{s.player.gamerTag}</span>
                                      {s.player.realTeam && (
                                        <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-800 text-sky-400 font-bold border border-sky-500/20 hidden sm:inline-block">
                                          {findTeam(s.player.realTeam)?.shortName || s.player.realTeam}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </td>
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
                        <div className="flex items-center gap-2.5 text-left">
                          <div className="h-8 w-8 rounded-lg bg-slate-900 border border-slate-800 p-1 flex items-center justify-center shrink-0 overflow-hidden">
                            <img
                              src={resolvePlayerAvatar(m.homePlayer)}
                              alt={m.homePlayer.realTeam || m.homePlayer.gamerTag}
                              className="h-full w-full object-contain"
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1 flex-wrap">
                              <span className="font-bold text-white block text-xs sm:text-sm truncate">{m.homePlayer.gamerTag}</span>
                              {m.homePlayer.realTeam && (
                                <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-800 text-sky-400 font-bold">
                                  {findTeam(m.homePlayer.realTeam)?.shortName || m.homePlayer.realTeam}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-500 block truncate">{m.homePlayer.division}</span>
                          </div>
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

                        <div className="flex items-center justify-end gap-2.5 text-right">
                          <div className="min-w-0">
                            <div className="flex items-center justify-end gap-1 flex-wrap">
                              <span className="font-bold text-white block text-xs sm:text-sm truncate">{m.awayPlayer.gamerTag}</span>
                              {m.awayPlayer.realTeam && (
                                <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-800 text-emerald-400 font-bold">
                                  {findTeam(m.awayPlayer.realTeam)?.shortName || m.awayPlayer.realTeam}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-500 block truncate">{m.awayPlayer.division}</span>
                          </div>
                          <div className="h-8 w-8 rounded-lg bg-slate-900 border border-slate-800 p-1 flex items-center justify-center shrink-0 overflow-hidden">
                            <img
                              src={resolvePlayerAvatar(m.awayPlayer)}
                              alt={m.awayPlayer.realTeam || m.awayPlayer.gamerTag}
                              className="h-full w-full object-contain"
                            />
                          </div>
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
                      <div className="flex items-center justify-between gap-3 text-sm font-bold text-white">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="h-6 w-6 rounded-md bg-slate-900 border border-slate-800 p-0.5 flex items-center justify-center shrink-0 overflow-hidden">
                            <img
                              src={resolvePlayerAvatar(m.homePlayer)}
                              alt={m.homePlayer.realTeam || m.homePlayer.gamerTag}
                              className="h-full w-full object-contain"
                            />
                          </div>
                          <span className="truncate">{m.homePlayer.gamerTag}</span>
                        </div>
                        {isFinished ? (
                          <span className="font-mono text-yellow-400 shrink-0">
                            Agg: {aggHome} - {aggAway}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500 shrink-0">vs</span>
                        )}
                        <div className="flex items-center gap-2 min-w-0 justify-end">
                          <span className="truncate">{m.awayPlayer.gamerTag}</span>
                          <div className="h-6 w-6 rounded-md bg-slate-900 border border-slate-800 p-0.5 flex items-center justify-center shrink-0 overflow-hidden">
                            <img
                              src={resolvePlayerAvatar(m.awayPlayer)}
                              alt={m.awayPlayer.realTeam || m.awayPlayer.gamerTag}
                              className="h-full w-full object-contain"
                            />
                          </div>
                        </div>
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
                      <div className="flex items-center justify-between gap-3 text-sm font-bold text-white">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="h-6 w-6 rounded-md bg-slate-900 border border-slate-800 p-0.5 flex items-center justify-center shrink-0 overflow-hidden">
                            <img
                              src={resolvePlayerAvatar(m.homePlayer)}
                              alt={m.homePlayer.realTeam || m.homePlayer.gamerTag}
                              className="h-full w-full object-contain"
                            />
                          </div>
                          <span className="truncate">{m.homePlayer.gamerTag}</span>
                        </div>
                        {isFinished ? (
                          <span className="font-mono text-yellow-400 shrink-0">
                            Agg: {aggHome} - {aggAway}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500 shrink-0">vs</span>
                        )}
                        <div className="flex items-center gap-2 min-w-0 justify-end">
                          <span className="truncate">{m.awayPlayer.gamerTag}</span>
                          <div className="h-6 w-6 rounded-md bg-slate-900 border border-slate-800 p-0.5 flex items-center justify-center shrink-0 overflow-hidden">
                            <img
                              src={resolvePlayerAvatar(m.awayPlayer)}
                              alt={m.awayPlayer.realTeam || m.awayPlayer.gamerTag}
                              className="h-full w-full object-contain"
                            />
                          </div>
                        </div>
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
                  <div className="space-y-2 text-center sm:text-right">
                    <div className="h-16 w-16 rounded-2xl bg-slate-900 border border-slate-700 p-2 mx-auto sm:ml-auto sm:mr-0 flex items-center justify-center overflow-hidden shadow-lg">
                      <img
                        src={resolvePlayerAvatar(finalMatch.homePlayer)}
                        alt={finalMatch.homePlayer.realTeam || finalMatch.homePlayer.gamerTag}
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <h4 className="text-xl font-black text-white">{finalMatch.homePlayer.gamerTag}</h4>
                    <p className="text-xs text-slate-400">{finalMatch.homePlayer.fullName}</p>
                    {finalMatch.homePlayer.realTeam && (
                      <span className="text-xs font-bold text-sky-400 block">{finalMatch.homePlayer.realTeam}</span>
                    )}
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

                  <div className="space-y-2 text-center sm:text-left">
                    <div className="h-16 w-16 rounded-2xl bg-slate-900 border border-slate-700 p-2 mx-auto sm:mr-auto sm:ml-0 flex items-center justify-center overflow-hidden shadow-lg">
                      <img
                        src={resolvePlayerAvatar(finalMatch.awayPlayer)}
                        alt={finalMatch.awayPlayer.realTeam || finalMatch.awayPlayer.gamerTag}
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <h4 className="text-xl font-black text-white">{finalMatch.awayPlayer.gamerTag}</h4>
                    <p className="text-xs text-slate-400">{finalMatch.awayPlayer.fullName}</p>
                    {finalMatch.awayPlayer.realTeam && (
                      <span className="text-xs font-bold text-amber-400 block">{finalMatch.awayPlayer.realTeam}</span>
                    )}
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
