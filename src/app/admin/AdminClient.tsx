"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Bell,
  Upload,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Trophy,
  Calendar,
  Send,
  User,
  Users,
  Eye,
  AlertTriangle,
  RefreshCw,
  Clock,
  LogOut,
  Sliders,
  Globe,
  Shuffle,
  Layers,
  ChevronRight,
  Play,
  Lock,
  Unlock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function AdminClient({
  matches,
  pendingSubmissions,
  pendingForfeits,
  allPlayers,
  announcements,
  flaggedPlayers,
  leagueConfig,
  div1Standings,
  div2Standings,
  div3Standings,
  uclSlots,
  europaSlots,
  adminEmail,
}: {
  matches: any[];
  pendingSubmissions: any[];
  pendingForfeits: any[];
  allPlayers: any[];
  announcements: any[];
  flaggedPlayers: any[];
  leagueConfig: any;
  div1Standings: any[];
  div2Standings: any[];
  div3Standings: any[];
  uclSlots: any[];
  europaSlots: any[];
  adminEmail?: string;
}) {
  const router = useRouter();

  type TabType =
    | "DASHBOARD"
    | "TABLES"
    | "CONTINENTAL"
    | "RESULTS_QUEUE"
    | "FORFEITS_QUEUE"
    | "ANNOUNCEMENTS"
    | "PLAYERS";

  const [activeTab, setActiveTab] = useState<TabType>("DASHBOARD");
  const [tableSubTab, setTableSubTab] = useState<"DIV1" | "DIV2" | "DIV3" | "UCL" | "EUROPA">("DIV1");

  // Announcement Form State
  const [annTitle, setAnnTitle] = useState("");
  const [annContent, setAnnContent] = useState("");
  const [annType, setAnnType] = useState<"BROADCAST" | "INDIVIDUAL">("BROADCAST");
  const [targetPlayerId, setTargetPlayerId] = useState(allPlayers[0]?.id || "");
  const [isPinned, setIsPinned] = useState(false);
  const [postingAnn, setPostingAnn] = useState(false);
  const [annSuccessMsg, setAnnSuccessMsg] = useState("");

  // Review and action states
  const [reviewLoading, setReviewLoading] = useState<string | null>(null);
  const [inspectImage, setInspectImage] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Logout handler
  const handleLogout = async () => {
    if (!confirm("Are you sure you want to log out of the League Admin Office?")) return;
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/?loggedOut=admin");
      router.refresh();
    } catch (err) {
      router.push("/?loggedOut=admin");
    }
  };

  // Score verification inputs state: submissionId -> { home: number, away: number }
  const [submissionScores, setSubmissionScores] = useState<Record<string, { home: number; away: number }>>({});

  const handleScoreChange = (submissionId: string, side: "home" | "away", val: number) => {
    setSubmissionScores((prev) => ({
      ...prev,
      [submissionId]: {
        home: side === "home" ? val : (prev[submissionId]?.home ?? 0),
        away: side === "away" ? val : (prev[submissionId]?.away ?? 0),
      },
    }));
  };

  // Toggle Registration Open/Close
  const handleToggleRegistration = async (newStatus: boolean) => {
    const actionText = newStatus ? "OPEN" : "CLOSE";
    if (!confirm(`Are you sure you want to ${actionText} league registration?`)) return;

    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationOpen: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update registration status");
      alert(data.message || `Registration successfully ${newStatus ? "opened" : "closed"}!`);
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Generate Scheduled Round Robin Matches
  const handleGenerateSchedule = async (division: string) => {
    const confirmMsg =
      division === "ALL"
        ? "Generate round-robin scheduled matches (round trip home & away) for ALL divisions?"
        : `Generate round-robin scheduled matches for ${division}?`;
    if (!confirm(confirmMsg)) return;

    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/generate-schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ division }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate schedule");
      alert(data.message);
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Trigger 12:00 AM Daily Cycle
  const handleTriggerDailyCycle = async () => {
    if (!confirm("Trigger 12:00 AM cycle now? This will advance the matchday and process any expired unplayed matches.")) {
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/daily-cycle", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to advance matchday");
      alert(data.message);
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle UCL / Europa Started
  const handleToggleCompetition = async (comp: "UCL" | "EUROPA", started: boolean) => {
    const actionText = started ? "START and UNLOCK" : "LOCK";
    if (!confirm(`Are you sure you want to ${actionText} the ${comp} competition?`)) return;

    setActionLoading(true);
    try {
      const payload = comp === "UCL" ? { uclStarted: started } : { europaStarted: started };
      const res = await fetch("/api/admin/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update competition status");
      alert(`eFootball ${comp} is now ${started ? "officially started and unlocked" : "locked"}!`);
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Conduct Auto Seeded Draw
  const handleAutoDraw = async (competition: "UCL" | "EUROPA") => {
    if (
      !confirm(
        `Conduct official seeded draw for ${competition}? The system will distribute qualified players across Groups A, B, C, D strictly enforcing the division separation constraint (no players from same division in same group).`
      )
    ) {
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch("/api/continental/vote-group", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ competition, action: "AUTO_DRAW" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Draw failed");
      alert(data.message);
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Review Result Submission with Verified Score (Goals) Insertion
  const handleReviewSubmission = async (
    submissionId: string,
    decision: "APPROVE" | "REJECT",
    defaultHome: number = 0,
    defaultAway: number = 0
  ) => {
    setReviewLoading(submissionId);
    try {
      const verifiedHomeScore =
        submissionScores[submissionId]?.home !== undefined
          ? submissionScores[submissionId].home
          : defaultHome;
      const verifiedAwayScore =
        submissionScores[submissionId]?.away !== undefined
          ? submissionScores[submissionId].away
          : defaultAway;

      const res = await fetch("/api/admin/approve-submission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actionType: "RESULT_SUBMISSION",
          submissionId,
          decision,
          verifiedHomeScore,
          verifiedAwayScore,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");

      alert(data.message);
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setReviewLoading(null);
    }
  };

  // Execute End of Season Automatic Promotions for Div 2 and Div 3
  const handleEndSeasonPromotions = async () => {
    if (
      !confirm(
        "Are you sure you want to finalize the season and execute automatic promotions for the top 3 players in Division 2 and Division 3?"
      )
    )
      return;

    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/end-season", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to execute season promotions");

      alert(`Season promotions finalized successfully!\n${data.message}`);
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Review Forfeit Claim
  const handleReviewForfeit = async (claimId: string, decision: "APPROVE" | "REJECT") => {
    setReviewLoading(claimId);
    try {
      const res = await fetch("/api/admin/approve-submission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actionType: "FORFEIT_CLAIM",
          claimId,
          decision,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");

      alert(data.message);
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setReviewLoading(null);
    }
  };

  // Post Announcement
  const handlePostAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    setPostingAnn(true);
    setAnnSuccessMsg("");

    try {
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: annTitle,
          content: annContent,
          type: annType,
          targetPlayerId: annType === "INDIVIDUAL" ? targetPlayerId : null,
          isPinned,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to post announcement");

      setAnnSuccessMsg(data.message);
      setAnnTitle("");
      setAnnContent("");
      setTimeout(() => {
        router.refresh();
      }, 1200);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setPostingAnn(false);
    }
  };

  // Helper for standings table rendering
  const renderStandingsTable = (title: string, standings: any[], badgeColor: string) => {
    return (
      <div className="rounded-3xl border border-slate-800 bg-slate-950/90 overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/40">
          <div className="flex items-center gap-2.5">
            <span className={`h-3 w-3 rounded-full ${badgeColor}`} />
            <h3 className="text-lg font-black uppercase text-white tracking-wide">{title}</h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {standings.length} Registered Competitors (Max 20)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-[11px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3 text-center">Pos</th>
                <th className="px-4 py-3">Player / GamerTag</th>
                <th className="px-4 py-3">WhatsApp</th>
                <th className="px-3 py-3 text-center">P</th>
                <th className="px-3 py-3 text-center">W</th>
                <th className="px-3 py-3 text-center">D</th>
                <th className="px-3 py-3 text-center">L</th>
                <th className="px-3 py-3 text-center">GF</th>
                <th className="px-3 py-3 text-center">GA</th>
                <th className="px-3 py-3 text-center">GD</th>
                <th className="px-4 py-3 text-center font-black text-yellow-400">PTS</th>
                <th className="px-3 py-3 text-center">Form</th>
                <th className="px-4 py-3 text-center">Missed</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {standings.length === 0 ? (
                <tr>
                  <td colSpan={14} className="py-8 text-center text-slate-500 font-mono">
                    No players registered in this division yet.
                  </td>
                </tr>
              ) : (
                standings.map((s, idx) => {
                  const rank = idx + 1;
                  const isTop8Ucl = rank <= 8 && s.division === "Division 1";
                  const isTop4Ucl = rank <= 4 && (s.division === "Division 2" || s.division === "Division 3");
                  const isRelegation = rank > 17; // Last 3 of 20

                  return (
                    <tr
                      key={s.id}
                      className={`hover:bg-slate-900/50 transition-colors ${
                        s.isDisqualified ? "bg-red-950/20 opacity-60" : ""
                      }`}
                    >
                      <td className="px-4 py-3.5 text-center font-bold font-mono">
                        <span
                          className={`inline-flex items-center justify-center h-6 w-6 rounded-md text-xs font-black ${
                            isTop8Ucl || isTop4Ucl
                              ? "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                              : isRelegation
                              ? "bg-red-500/20 text-red-400 border border-red-500/30"
                              : "text-slate-400"
                          }`}
                        >
                          {rank}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-bold text-white">
                        <div className="flex items-center gap-2">
                          <span>{s.player.gamerTag}</span>
                          {s.isDisqualified && (
                            <Badge variant="destructive" className="text-[9px] px-1 py-0">
                              DQ
                            </Badge>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 block font-normal">
                          {s.player.fullName} ({s.player.efootballId})
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-emerald-400">
                        {s.player.whatsapp}
                      </td>
                      <td className="px-3 py-3.5 text-center font-mono text-slate-300">{s.played}</td>
                      <td className="px-3 py-3.5 text-center font-mono text-emerald-400">{s.won}</td>
                      <td className="px-3 py-3.5 text-center font-mono text-slate-400">{s.drawn}</td>
                      <td className="px-3 py-3.5 text-center font-mono text-rose-400">{s.lost}</td>
                      <td className="px-3 py-3.5 text-center font-mono text-slate-400">{s.goalsFor}</td>
                      <td className="px-3 py-3.5 text-center font-mono text-slate-400">{s.goalsAgainst}</td>
                      <td
                        className={`px-3 py-3.5 text-center font-mono font-bold ${
                          s.goalDifference > 0
                            ? "text-emerald-400"
                            : s.goalDifference < 0
                            ? "text-rose-400"
                            : "text-slate-400"
                        }`}
                      >
                        {s.goalDifference > 0 ? `+${s.goalDifference}` : s.goalDifference}
                      </td>
                      <td className="px-4 py-3.5 text-center font-mono font-black text-yellow-400 text-sm">
                        {s.points}
                      </td>
                      <td className="px-3 py-3.5 text-center font-mono text-[10px] text-slate-400">
                        {s.form}
                      </td>
                      <td className="px-4 py-3.5 text-center font-mono">
                        <span
                          className={`font-bold ${
                            s.consecutiveMissed >= 2 ? "text-red-400" : "text-slate-400"
                          }`}
                        >
                          {s.consecutiveMissed}/3
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {s.isDisqualified ? (
                          <Badge variant="destructive" className="text-[10px]">
                            Disqualified
                          </Badge>
                        ) : s.consecutiveMissed >= 2 ? (
                          <Badge variant="yellow" className="text-[10px]">
                            Warning
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px]">
                            Active
                          </Badge>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Top Commissioner Bar */}
      <div className="rounded-3xl border border-red-500/30 bg-gradient-to-r from-red-950/40 via-slate-950 to-slate-950 p-6 shadow-2xl backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="destructive" className="font-mono text-[10px] px-2 py-0.5 tracking-wider">
              ADMIN OFFICE COMMISSIONER
            </Badge>
            <span className="text-xs font-mono text-slate-400">Logged in as: {adminEmail || "admin@efootball.rw"}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase text-white tracking-tight flex items-center gap-2">
            <span>eFootball Rwanda Admin Office</span>
          </h1>
          <p className="text-xs text-slate-400">
            Full commissioner control over league registration, one-way round robin schedules, score screenshot verification, automated promotions, and continental cups.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleLogout}
            variant="destructive"
            size="sm"
            className="font-black uppercase tracking-wider text-xs gap-1.5 shadow-lg shadow-red-600/20"
          >
            <LogOut className="h-4 w-4" />
            <span>Log Out</span>
          </Button>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab("DASHBOARD")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === "DASHBOARD"
              ? "bg-sky-500 text-white shadow-lg shadow-sky-500/30"
              : "text-slate-400 hover:text-white hover:bg-slate-900"
          }`}
        >
          <Sliders className="h-4 w-4" />
          <span>Control Center</span>
        </button>

        <button
          onClick={() => setActiveTab("TABLES")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === "TABLES"
              ? "bg-sky-500 text-white shadow-lg shadow-sky-500/30"
              : "text-slate-400 hover:text-white hover:bg-slate-900"
          }`}
        >
          <Trophy className="h-4 w-4" />
          <span>All League Tables</span>
        </button>

        <button
          onClick={() => setActiveTab("CONTINENTAL")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === "CONTINENTAL"
              ? "bg-sky-500 text-white shadow-lg shadow-sky-500/30"
              : "text-slate-400 hover:text-white hover:bg-slate-900"
          }`}
        >
          <Globe className="h-4 w-4" />
          <span>UCL & Europa Hub</span>
        </button>

        <button
          onClick={() => setActiveTab("RESULTS_QUEUE")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === "RESULTS_QUEUE"
              ? "bg-sky-500 text-white shadow-lg shadow-sky-500/30"
              : "text-slate-400 hover:text-white hover:bg-slate-900"
          }`}
        >
          <Upload className="h-4 w-4" />
          <span>Score Verification & Results Queue</span>
          {pendingSubmissions.length > 0 && (
            <Badge variant="live" className="text-[10px] px-1.5 py-0">
              {pendingSubmissions.length}
            </Badge>
          )}
        </button>

        <button
          onClick={() => setActiveTab("FORFEITS_QUEUE")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === "FORFEITS_QUEUE"
              ? "bg-sky-500 text-white shadow-lg shadow-sky-500/30"
              : "text-slate-400 hover:text-white hover:bg-slate-900"
          }`}
        >
          <ShieldAlert className="h-4 w-4" />
          <span>Forfeit Claims</span>
          {pendingForfeits.length > 0 && (
            <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
              {pendingForfeits.length}
            </Badge>
          )}
        </button>

        <button
          onClick={() => setActiveTab("ANNOUNCEMENTS")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === "ANNOUNCEMENTS"
              ? "bg-sky-500 text-white shadow-lg shadow-sky-500/30"
              : "text-slate-400 hover:text-white hover:bg-slate-900"
          }`}
        >
          <Bell className="h-4 w-4" />
          <span>Announcements</span>
        </button>

        <button
          onClick={() => setActiveTab("PLAYERS")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === "PLAYERS"
              ? "bg-sky-500 text-white shadow-lg shadow-sky-500/30"
              : "text-slate-400 hover:text-white hover:bg-slate-900"
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Players ({allPlayers.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: CONTROL CENTER (REGISTRATION, SCHEDULE GENERATOR, 12 AM CYCLE) */}
      {/* ========================================================================= */}
      {activeTab === "DASHBOARD" && (
        <div className="space-y-8">
          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5 space-y-1">
              <span className="text-xs font-bold uppercase text-slate-400">Registration Status</span>
              <div className="flex items-center justify-between pt-1">
                <span
                  className={`text-xl font-black uppercase ${
                    leagueConfig.registrationOpen ? "text-emerald-400" : "text-amber-400"
                  }`}
                >
                  {leagueConfig.registrationOpen ? "Open" : "Closed"}
                </span>
                <Badge variant={leagueConfig.registrationOpen ? "secondary" : "yellow"}>
                  {leagueConfig.registrationOpen ? "ACCEPTING PLAYERS" : "SEASON ACTIVE"}
                </Badge>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5 space-y-1">
              <span className="text-xs font-bold uppercase text-slate-400">Current Matchday</span>
              <div className="flex items-center justify-between pt-1">
                <span className="text-2xl font-black text-sky-400">Matchday {leagueConfig.currentMatchday}</span>
                <Clock className="h-5 w-5 text-sky-400" />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5 space-y-1">
              <span className="text-xs font-bold uppercase text-slate-400">UCL Status</span>
              <div className="flex items-center justify-between pt-1">
                <span
                  className={`text-lg font-black uppercase ${
                    leagueConfig.uclStarted ? "text-yellow-400" : "text-slate-500"
                  }`}
                >
                  {leagueConfig.uclStarted ? "In Progress" : "Locked"}
                </span>
                {leagueConfig.uclStarted ? (
                  <Unlock className="h-5 w-5 text-yellow-400" />
                ) : (
                  <Lock className="h-5 w-5 text-slate-500" />
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5 space-y-1">
              <span className="text-xs font-bold uppercase text-slate-400">Europa Status</span>
              <div className="flex items-center justify-between pt-1">
                <span
                  className={`text-lg font-black uppercase ${
                    leagueConfig.europaStarted ? "text-amber-400" : "text-slate-500"
                  }`}
                >
                  {leagueConfig.europaStarted ? "In Progress" : "Locked"}
                </span>
                {leagueConfig.europaStarted ? (
                  <Unlock className="h-5 w-5 text-amber-400" />
                ) : (
                  <Lock className="h-5 w-5 text-slate-500" />
                )}
              </div>
            </div>
          </div>

          {/* Operation 1: Registration Controls */}
          <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-6 sm:p-8 backdrop-blur-xl shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-black uppercase text-white flex items-center gap-2">
                  <Sliders className="h-5 w-5 text-sky-400" />
                  <span>League Registration Lifecycle Controller</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Start or end player registration. When ended, you can generate scheduled round-robin division fixtures.
                </p>
              </div>

              <div>
                {leagueConfig.registrationOpen ? (
                  <Button
                    onClick={() => handleToggleRegistration(false)}
                    disabled={actionLoading}
                    variant="destructive"
                    className="font-bold text-xs uppercase tracking-wider"
                  >
                    End / Close Registration
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleToggleRegistration(true)}
                    disabled={actionLoading}
                    variant="default"
                    className="bg-emerald-600 hover:bg-emerald-500 font-bold text-xs uppercase tracking-wider"
                  >
                    Re-open League Registration
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                <span className="text-xs font-bold text-sky-400 block">Division 1 Registered</span>
                <span className="text-2xl font-black text-white">{div1Standings.length} / 20</span>
                <span className="text-[11px] text-slate-500 block mt-1">Premiership Division</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                <span className="text-xs font-bold text-yellow-400 block">Division 2 Registered</span>
                <span className="text-2xl font-black text-white">{div2Standings.length} / 20</span>
                <span className="text-[11px] text-slate-500 block mt-1">Championship Division</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                <span className="text-xs font-bold text-emerald-400 block">Division 3 Registered</span>
                <span className="text-2xl font-black text-white">{div3Standings.length} / 20</span>
                <span className="text-[11px] text-slate-500 block mt-1">National Academy</span>
              </div>
            </div>
          </div>

          {/* Operation 2: Round Robin Schedule Generator */}
          <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-6 sm:p-8 backdrop-blur-xl shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-black uppercase text-white flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-yellow-400" />
                  <span>Division Round-Robin Schedule Generator (One-Way 1 Match per Pairing)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Generates paired single round-robin matches (one-way 1 match only per pairing, home only) for registered players once registration has closed.
                </p>
              </div>

              <Button
                onClick={() => handleGenerateSchedule("ALL")}
                disabled={actionLoading || leagueConfig.registrationOpen}
                variant="yellow"
                className="font-bold text-xs uppercase tracking-wider text-slate-950"
              >
                Generate All Divisions Schedule
              </Button>
            </div>

            {leagueConfig.registrationOpen && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-950/30 p-3 text-xs text-amber-300 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
                <span>
                  Please click <strong>&quot;End / Close Registration&quot;</strong> above first before generating the official tournament schedule.
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-sky-400 block">Division 1 Schedule</span>
                <p className="text-[11px] text-slate-400">Generate round-robin fixtures strictly for Division 1.</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleGenerateSchedule("Division 1")}
                  disabled={actionLoading || leagueConfig.registrationOpen}
                  className="w-full text-xs font-bold"
                >
                  Generate Div 1 Only
                </Button>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-yellow-400 block">Division 2 Schedule</span>
                <p className="text-[11px] text-slate-400">Generate round-robin fixtures strictly for Division 2.</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleGenerateSchedule("Division 2")}
                  disabled={actionLoading || leagueConfig.registrationOpen}
                  className="w-full text-xs font-bold"
                >
                  Generate Div 2 Only
                </Button>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-emerald-400 block">Division 3 Schedule</span>
                <p className="text-[11px] text-slate-400">Generate round-robin fixtures strictly for Division 3.</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleGenerateSchedule("Division 3")}
                  disabled={actionLoading || leagueConfig.registrationOpen}
                  className="w-full text-xs font-bold"
                >
                  Generate Div 3 Only
                </Button>
              </div>
            </div>
          </div>

          {/* Operation 3: 12:00 AM Automated Daily Cycle Trigger */}
          <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-6 sm:p-8 backdrop-blur-xl shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-black uppercase text-white flex items-center gap-2">
                  <Clock className="h-5 w-5 text-emerald-400" />
                  <span>12:00 AM Midnight Matchday Fixture Advance Cycle</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  At 12:00 AM midnight, the system automatically drops next fixtures and marks expired unplayed matches (enforcing 3 missed matches disqualifications). You can also manually advance the cycle here.
                </p>
              </div>

              <Button
                onClick={handleTriggerDailyCycle}
                disabled={actionLoading}
                variant="default"
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Advance to Matchday {leagueConfig.currentMatchday + 1}</span>
              </Button>
            </div>

            <div className="text-xs text-slate-400 space-y-1">
              <p>• Current active round: <strong>Matchday {leagueConfig.currentMatchday}</strong></p>
              <p>• Next scheduled round: <strong>Matchday {leagueConfig.currentMatchday + 1}</strong></p>
              <p>• Players have strictly 24 hours to coordinate on WhatsApp and upload proof before midnight expiration.</p>
            </div>
          </div>

          {/* Operation 4: Table-Based Match of the Day Controller */}
          <div className="rounded-3xl border border-yellow-500/30 bg-slate-950/90 p-6 sm:p-8 backdrop-blur-xl shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="yellow" className="text-[10px] font-mono">
                    AUTOMATIC SELECTION ENGINE
                  </Badge>
                  <span className="text-xs font-bold text-yellow-400 uppercase tracking-widest">
                    Rule: Except on Round 1
                  </span>
                </div>
                <h3 className="text-lg font-black uppercase text-white flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-400" />
                  <span>Match of the Day (MOTD) System</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  The system analyzes current league table standings (points, rank sums, proximity of top 4 contenders) to select the daily marquee clash. Round 1 is excluded as standings are not yet established.
                </p>
              </div>

              <Button
                onClick={async () => {
                  setActionLoading(true);
                  try {
                    const res = await fetch("/api/matches/motd", { method: "POST" });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || "Failed to sync Match of the Day");
                    alert(data.message);
                    router.refresh();
                  } catch (err: any) {
                    alert(err.message);
                  } finally {
                    setActionLoading(false);
                  }
                }}
                disabled={actionLoading || leagueConfig.currentMatchday <= 1}
                variant="yellow"
                className="font-bold text-xs uppercase tracking-wider text-slate-950"
              >
                Re-evaluate MOTD from Table
              </Button>
            </div>

            <div className="pt-1">
              {leagueConfig.currentMatchday <= 1 ? (
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-400 shrink-0" />
                  <div>
                    <span className="font-bold text-white block">Round 1 Rule Enforced</span>
                    <span>
                      Match of the Day is not selected on Round 1 because all teams start with zero points. Selection activates automatically starting from Round 2 based on official table rankings.
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-yellow-500/20 text-xs text-slate-300">
                  <span className="font-bold text-yellow-400 block mb-1">Active MOTD Status</span>
                  <p>
                    The system evaluates active fixtures for Matchday {leagueConfig.currentMatchday} and highlights the clash with the highest stakes, points, and top-table ranking.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Operation 5: End Season & Automatic Promotions */}
          <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-6 sm:p-8 backdrop-blur-xl shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-amber-400" />
                  <h3 className="text-lg font-black uppercase text-white">
                    Season Finale & Automatic Promotions
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  At season end, the top 3 players from Division 2 promote to Division 1, and the top 3 from Division 3 promote to Division 2.
                </p>
              </div>

              <Button
                onClick={handleEndSeasonPromotions}
                disabled={actionLoading}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20"
              >
                Execute Season Promotions
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Div 2 Top 3 Preview */}
              <div className="p-4 rounded-2xl bg-[#070b16] border border-amber-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="yellow" className="text-[10px]">
                    PROMOTING TO DIVISION 1
                  </Badge>
                  <span className="text-[10px] text-slate-400 font-mono">Division 2 (Top 3)</span>
                </div>
                <div className="space-y-1.5 pt-1">
                  {div2Standings.slice(0, 3).map((s, idx) => (
                    <div key={s.id} className="flex items-center justify-between text-xs py-1 border-b border-slate-800/60">
                      <span className="font-bold text-white">
                        #{idx + 1} {s.player?.gamerTag || "Unknown"}
                      </span>
                      <span className="font-mono text-amber-400 font-black">{s.points} Pts</span>
                    </div>
                  ))}
                  {div2Standings.length === 0 && (
                    <p className="text-xs text-slate-500 italic">No Division 2 standings registered.</p>
                  )}
                </div>
              </div>

              {/* Div 3 Top 3 Preview */}
              <div className="p-4 rounded-2xl bg-[#070b16] border border-emerald-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-[10px] border-emerald-500/40 text-emerald-400">
                    PROMOTING TO DIVISION 2
                  </Badge>
                  <span className="text-[10px] text-slate-400 font-mono">Division 3 (Top 3)</span>
                </div>
                <div className="space-y-1.5 pt-1">
                  {div3Standings.slice(0, 3).map((s, idx) => (
                    <div key={s.id} className="flex items-center justify-between text-xs py-1 border-b border-slate-800/60">
                      <span className="font-bold text-white">
                        #{idx + 1} {s.player?.gamerTag || "Unknown"}
                      </span>
                      <span className="font-mono text-emerald-400 font-black">{s.points} Pts</span>
                    </div>
                  ))}
                  {div3Standings.length === 0 && (
                    <p className="text-xs text-slate-500 italic">No Division 3 standings registered.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ALL LEAGUE TABLES (DIVISION 1, 2, 3 + UCL & EUROPA) */}
      {/* ========================================================================= */}
      {activeTab === "TABLES" && (
        <div className="space-y-6">
          {/* Table Sub-Navigation */}
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
            <button
              onClick={() => setTableSubTab("DIV1")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                tableSubTab === "DIV1"
                  ? "bg-sky-500 text-white shadow-lg shadow-sky-500/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              Division 1 (Premiership)
            </button>

            <button
              onClick={() => setTableSubTab("DIV2")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                tableSubTab === "DIV2"
                  ? "bg-yellow-500 text-slate-950 shadow-lg shadow-yellow-500/20 font-black"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              Division 2 (Championship)
            </button>

            <button
              onClick={() => setTableSubTab("DIV3")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                tableSubTab === "DIV3"
                  ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              Division 3 (Academy)
            </button>

            <button
              onClick={() => setTableSubTab("UCL")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                tableSubTab === "UCL"
                  ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              <Trophy className="h-3.5 w-3.5" />
              <span>UCL Groups</span>
              {!leagueConfig.uclStarted && <Lock className="h-3 w-3 text-slate-500" />}
            </button>

            <button
              onClick={() => setTableSubTab("EUROPA")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                tableSubTab === "EUROPA"
                  ? "bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              <Globe className="h-3.5 w-3.5" />
              <span>Europa Groups</span>
              {!leagueConfig.europaStarted && <Lock className="h-3 w-3 text-slate-500" />}
            </button>
          </div>

          {/* Division 1 Table */}
          {tableSubTab === "DIV1" && renderStandingsTable("Division 1 Premiership Standings", div1Standings, "bg-sky-400")}

          {/* Division 2 Table */}
          {tableSubTab === "DIV2" && renderStandingsTable("Division 2 Championship Standings", div2Standings, "bg-yellow-400")}

          {/* Division 3 Table */}
          {tableSubTab === "DIV3" && renderStandingsTable("Division 3 Academy Standings", div3Standings, "bg-emerald-400")}

          {/* UCL Tables */}
          {tableSubTab === "UCL" && (
            <div className="space-y-6">
              {!leagueConfig.uclStarted ? (
                <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-8 text-center space-y-4">
                  <div className="inline-flex p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
                    <Lock className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-black uppercase text-white">eFootball Champions League is Locked</h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    UCL is locked by default until the league season ends. As administrator, you can inaugurate the UCL competition below.
                  </p>
                  <Button
                    onClick={() => handleToggleCompetition("UCL", true)}
                    disabled={actionLoading}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase"
                  >
                    Unlock & Start UCL Now
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-black uppercase text-white flex items-center gap-2">
                        <Trophy className="h-6 w-6 text-yellow-400" />
                        <span>eFootball Champions League (UCL) Group Stage</span>
                      </h3>
                      <p className="text-xs text-slate-400">
                        16 Qualified Players (Top 8 Div 1, Top 4 Div 2, Top 4 Div 3). Strict division separation enforced.
                      </p>
                    </div>

                    <Button
                      onClick={() => handleAutoDraw("UCL")}
                      disabled={actionLoading}
                      variant="outline"
                      className="text-xs font-bold gap-1.5"
                    >
                      <Shuffle className="h-3.5 w-3.5" />
                      <span>Conduct Seeded Draw</span>
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {["Group A", "Group B", "Group C", "Group D"].map((grpName) => {
                      const groupSlots = uclSlots.filter((s) => s.groupName === grpName);
                      return (
                        <div
                          key={grpName}
                          className="rounded-2xl border border-indigo-500/30 bg-slate-950/80 p-5 space-y-3"
                        >
                          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                            <span className="text-sm font-black uppercase text-indigo-400">{grpName}</span>
                            <span className="text-xs font-mono text-slate-400">{groupSlots.length}/4 Players</span>
                          </div>

                          <div className="space-y-2">
                            {groupSlots.length === 0 ? (
                              <p className="text-xs text-slate-500 py-3 text-center">Awaiting player votes or seeded draw...</p>
                            ) : (
                              groupSlots.map((slot, pIdx) => (
                                <div
                                  key={slot.id}
                                  className="flex items-center justify-between rounded-xl bg-slate-900/60 p-2.5 text-xs border border-slate-800/80"
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-slate-500 text-[10px]">{pIdx + 1}.</span>
                                    <div>
                                      <span className="font-bold text-white block">{slot.player.gamerTag}</span>
                                      <span className="text-[10px] text-slate-400">{slot.player.efootballId}</span>
                                    </div>
                                  </div>
                                  <Badge
                                    variant={
                                      slot.playerDivision === "Division 1"
                                        ? "secondary"
                                        : slot.playerDivision === "Division 2"
                                        ? "yellow"
                                        : "live"
                                    }
                                    className="text-[10px]"
                                  >
                                    {slot.playerDivision}
                                  </Badge>
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
            </div>
          )}

          {/* Europa Tables */}
          {tableSubTab === "EUROPA" && (
            <div className="space-y-6">
              {!leagueConfig.europaStarted ? (
                <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-8 text-center space-y-4">
                  <div className="inline-flex p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                    <Lock className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-black uppercase text-white">eFootball Europa League is Locked</h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Europa League is locked by default until inaugurated by the administrator.
                  </p>
                  <Button
                    onClick={() => handleToggleCompetition("EUROPA", true)}
                    disabled={actionLoading}
                    className="bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs uppercase"
                  >
                    Unlock & Start Europa League Now
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-black uppercase text-white flex items-center gap-2">
                        <Globe className="h-6 w-6 text-amber-400" />
                        <span>eFootball Europa League (UEL) Group Stage</span>
                      </h3>
                      <p className="text-xs text-slate-400">
                        Qualified: Div 1 ranks 9-12, Div 2 ranks 5-10, Div 3 ranks 5-10. Strict division separation enforced.
                      </p>
                    </div>

                    <Button
                      onClick={() => handleAutoDraw("EUROPA")}
                      disabled={actionLoading}
                      variant="outline"
                      className="text-xs font-bold gap-1.5"
                    >
                      <Shuffle className="h-3.5 w-3.5" />
                      <span>Conduct Seeded Draw</span>
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {["Group A", "Group B", "Group C", "Group D"].map((grpName) => {
                      const groupSlots = europaSlots.filter((s) => s.groupName === grpName);
                      return (
                        <div
                          key={grpName}
                          className="rounded-2xl border border-amber-500/30 bg-slate-950/80 p-5 space-y-3"
                        >
                          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                            <span className="text-sm font-black uppercase text-amber-400">{grpName}</span>
                            <span className="text-xs font-mono text-slate-400">{groupSlots.length}/4 Players</span>
                          </div>

                          <div className="space-y-2">
                            {groupSlots.length === 0 ? (
                              <p className="text-xs text-slate-500 py-3 text-center">Awaiting player votes or seeded draw...</p>
                            ) : (
                              groupSlots.map((slot, pIdx) => (
                                <div
                                  key={slot.id}
                                  className="flex items-center justify-between rounded-xl bg-slate-900/60 p-2.5 text-xs border border-slate-800/80"
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-slate-500 text-[10px]">{pIdx + 1}.</span>
                                    <div>
                                      <span className="font-bold text-white block">{slot.player.gamerTag}</span>
                                      <span className="text-[10px] text-slate-400">{slot.player.efootballId}</span>
                                    </div>
                                  </div>
                                  <Badge variant="yellow" className="text-[10px]">
                                    {slot.playerDivision}
                                  </Badge>
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
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: CONTINENTAL CUPS COMMISSIONER HUB */}
      {/* ========================================================================= */}
      {activeTab === "CONTINENTAL" && (
        <div className="space-y-8">
          <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-6 sm:p-8 backdrop-blur-xl shadow-xl space-y-6">
            <div>
              <h3 className="text-xl font-black uppercase text-white flex items-center gap-2">
                <Globe className="h-6 w-6 text-yellow-400" />
                <span>Continental Cups Administration & Group Voting Constraints</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Official Rule: <em>No players who were in the same division can choose or share the same group</em> in either UCL or Europa League.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* UCL Card */}
              <div className="rounded-2xl border border-indigo-500/30 bg-slate-900/60 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-indigo-400" />
                    <span className="font-black uppercase text-white">eFootball UCL</span>
                  </div>
                  <Badge variant={leagueConfig.uclStarted ? "secondary" : "destructive"}>
                    {leagueConfig.uclStarted ? "UNLOCKED / ACTIVE" : "LOCKED"}
                  </Badge>
                </div>
                <p className="text-xs text-slate-300">
                  16 Total Players: <strong>Top 8 from Division 1</strong>, <strong>Top 4 from Division 2</strong>, <strong>Top 4 from Division 3</strong>.
                </p>

                <div className="flex items-center gap-3 pt-2">
                  {leagueConfig.uclStarted ? (
                    <Button
                      onClick={() => handleToggleCompetition("UCL", false)}
                      disabled={actionLoading}
                      variant="destructive"
                      size="sm"
                      className="text-xs font-bold"
                    >
                      Lock UCL
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleToggleCompetition("UCL", true)}
                      disabled={actionLoading}
                      variant="default"
                      size="sm"
                      className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
                    >
                      Unlock & Launch UCL
                    </Button>
                  )}

                  <Button
                    onClick={() => handleAutoDraw("UCL")}
                    disabled={actionLoading || !leagueConfig.uclStarted}
                    variant="outline"
                    size="sm"
                    className="text-xs font-bold gap-1"
                  >
                    <Shuffle className="h-3 w-3" /> Auto Seeded Draw
                  </Button>
                </div>
              </div>

              {/* Europa Card */}
              <div className="rounded-2xl border border-amber-500/30 bg-slate-900/60 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-amber-400" />
                    <span className="font-black uppercase text-white">eFootball Europa League</span>
                  </div>
                  <Badge variant={leagueConfig.europaStarted ? "yellow" : "destructive"}>
                    {leagueConfig.europaStarted ? "UNLOCKED / ACTIVE" : "LOCKED"}
                  </Badge>
                </div>
                <p className="text-xs text-slate-300">
                  16 Total Players: <strong>Div 1 (ranks 9-12)</strong>, <strong>Div 2 (ranks 5-10)</strong>, <strong>Div 3 (ranks 5-10)</strong>.
                </p>

                <div className="flex items-center gap-3 pt-2">
                  {leagueConfig.europaStarted ? (
                    <Button
                      onClick={() => handleToggleCompetition("EUROPA", false)}
                      disabled={actionLoading}
                      variant="destructive"
                      size="sm"
                      className="text-xs font-bold"
                    >
                      Lock Europa
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleToggleCompetition("EUROPA", true)}
                      disabled={actionLoading}
                      variant="default"
                      size="sm"
                      className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold"
                    >
                      Unlock & Launch Europa
                    </Button>
                  )}

                  <Button
                    onClick={() => handleAutoDraw("EUROPA")}
                    disabled={actionLoading || !leagueConfig.europaStarted}
                    variant="outline"
                    size="sm"
                    className="text-xs font-bold gap-1"
                  >
                    <Shuffle className="h-3 w-3" /> Auto Seeded Draw
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: RESULTS SUBMISSIONS QUEUE */}
      {/* ========================================================================= */}
      {activeTab === "RESULTS_QUEUE" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-lg font-black uppercase text-white">Results Verification Queue</h3>
              <p className="text-xs text-slate-400">
                Inspect player-uploaded end-game screenshot proof. Approving instantly updates official league standings.
              </p>
            </div>
            <Badge variant="live">{pendingSubmissions.length} Pending</Badge>
          </div>

          {pendingSubmissions.length === 0 ? (
            <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-12 text-center text-slate-500 space-y-3">
              <CheckCircle2 className="h-10 w-10 mx-auto text-slate-600" />
              <p className="font-bold">Queue is clear! No pending match score screenshots to review.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {pendingSubmissions.map((sub) => (
                <div
                  key={sub.id}
                  className="rounded-2xl border border-slate-800 bg-slate-950/90 p-5 space-y-4 shadow-xl relative"
                >
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                    <span className="text-xs font-mono text-sky-400 font-bold">{sub.match.round}</span>
                    <Badge variant="live" className="text-[10px]">
                      Submitted by: {sub.submittedByPlayer.gamerTag}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between py-2 text-center">
                    <div className="flex-1 text-left">
                      <span className="font-black text-white text-sm block">{sub.match.homePlayer.gamerTag}</span>
                      <span className="text-[10px] text-slate-500 block">{sub.match.homePlayer.whatsapp}</span>
                    </div>
                    <div className="px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs text-slate-400">
                      Claimed: {sub.homeScore} - {sub.awayScore}
                    </div>
                    <div className="flex-1 text-right">
                      <span className="font-black text-white text-sm block">{sub.match.awayPlayer.gamerTag}</span>
                      <span className="text-[10px] text-slate-500 block">{sub.match.awayPlayer.whatsapp}</span>
                    </div>
                  </div>

                  {sub.screenshotUrl && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-300">Konami Full-Time Screenshot:</span>
                        <button
                          type="button"
                          onClick={() => setInspectImage(sub.screenshotUrl)}
                          className="text-sky-400 hover:underline flex items-center gap-1 text-[11px]"
                        >
                          <Eye className="h-3 w-3" /> View Fullscreen
                        </button>
                      </div>
                      <div
                        className="rounded-xl overflow-hidden border border-slate-800 h-44 cursor-pointer"
                        onClick={() => setInspectImage(sub.screenshotUrl)}
                      >
                        <img
                          src={sub.screenshotUrl}
                          alt="Full time score screenshot"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  )}

                  {/* Official Score & Goals Verification Inputs */}
                  <div className="rounded-xl bg-[#080d1e] border border-cyan-500/30 p-3 space-y-2">
                    <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-widest block">
                      Verified Match Goals (Insert From Screenshot):
                    </span>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 text-center">
                        <span className="text-[10px] font-bold text-slate-300 block mb-1">
                          {sub.match.homePlayer.gamerTag} (Home)
                        </span>
                        <Input
                          type="number"
                          min="0"
                          max="40"
                          value={submissionScores[sub.id]?.home ?? sub.homeScore}
                          onChange={(e) => handleScoreChange(sub.id, "home", Number(e.target.value))}
                          className="text-center font-mono text-lg font-black bg-slate-900 border-cyan-500/40 text-cyan-300 h-9"
                        />
                      </div>

                      <span className="text-xl font-black text-slate-500 mt-4">-</span>

                      <div className="flex-1 text-center">
                        <span className="text-[10px] font-bold text-slate-300 block mb-1">
                          {sub.match.awayPlayer.gamerTag} (Away)
                        </span>
                        <Input
                          type="number"
                          min="0"
                          max="40"
                          value={submissionScores[sub.id]?.away ?? sub.awayScore}
                          onChange={(e) => handleScoreChange(sub.id, "away", Number(e.target.value))}
                          className="text-center font-mono text-lg font-black bg-slate-900 border-cyan-500/40 text-cyan-300 h-9"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <Button
                      variant="default"
                      size="sm"
                      disabled={reviewLoading === sub.id}
                      onClick={() =>
                        handleReviewSubmission(
                          sub.id,
                          "APPROVE",
                          sub.homeScore,
                          sub.awayScore
                        )
                      }
                      className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs gap-1.5 shadow-lg shadow-cyan-500/20"
                    >
                      <CheckCircle2 className="h-4 w-4 text-slate-950" />
                      Insert Scores & Update Table
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={reviewLoading === sub.id}
                      onClick={() => handleReviewSubmission(sub.id, "REJECT")}
                      className="font-bold gap-1 text-xs"
                    >
                      <XCircle className="h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: FORFEIT CLAIMS QUEUE */}
      {/* ========================================================================= */}
      {activeTab === "FORFEITS_QUEUE" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-lg font-black uppercase text-white">Forfeit Claims Arbitration</h3>
              <p className="text-xs text-slate-400">
                Inspect proof that an opponent was unavailable or uncommunicative on WhatsApp. Approving awards a 3-0 walkover.
              </p>
            </div>
            <Badge variant="destructive">{pendingForfeits.length} Claims</Badge>
          </div>

          {pendingForfeits.length === 0 ? (
            <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-12 text-center text-slate-500 space-y-3">
              <CheckCircle2 className="h-10 w-10 mx-auto text-slate-600" />
              <p className="font-bold">No active forfeit disputes reported.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {pendingForfeits.map((claim) => (
                <div
                  key={claim.id}
                  className="rounded-2xl border border-red-500/30 bg-slate-950/90 p-5 space-y-4 shadow-xl"
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <span className="text-xs font-mono text-red-400 font-bold">{claim.match.round}</span>
                    <Badge variant="destructive" className="text-[10px]">
                      Dispute Claim
                    </Badge>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-slate-400">Claimant (Reporting Player):</span>
                      <p className="font-bold text-emerald-400">
                        {claim.claimantPlayer.gamerTag} ({claim.claimantPlayer.whatsapp})
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400">Accused (Non-responsive Opponent):</span>
                      <p className="font-bold text-rose-400">
                        {claim.accusedPlayer.gamerTag} ({claim.accusedPlayer.whatsapp})
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400">Claimant Statement:</span>
                      <p className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200">
                        {claim.reason}
                      </p>
                    </div>
                  </div>

                  {claim.proofScreenshotUrl && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-300">WhatsApp / Room Proof Screenshot:</span>
                        <button
                          type="button"
                          onClick={() => setInspectImage(claim.proofScreenshotUrl)}
                          className="text-sky-400 hover:underline flex items-center gap-1 text-[11px]"
                        >
                          <Eye className="h-3 w-3" /> View Fullscreen
                        </button>
                      </div>
                      <div
                        className="rounded-xl overflow-hidden border border-slate-800 h-44 cursor-pointer"
                        onClick={() => setInspectImage(claim.proofScreenshotUrl)}
                      >
                        <img
                          src={claim.proofScreenshotUrl}
                          alt="Forfeit proof screenshot"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={reviewLoading === claim.id}
                      onClick={() => handleReviewForfeit(claim.id, "APPROVE")}
                      className="font-bold gap-1"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Approve 3-0 Walkover
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={reviewLoading === claim.id}
                      onClick={() => handleReviewForfeit(claim.id, "REJECT")}
                      className="font-bold gap-1"
                    >
                      <XCircle className="h-4 w-4" />
                      Reject Claim
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: ANNOUNCEMENTS CENTER */}
      {/* ========================================================================= */}
      {activeTab === "ANNOUNCEMENTS" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-6 rounded-3xl border border-slate-800 bg-slate-950/90 p-6 sm:p-8 shadow-xl space-y-4">
            <h3 className="text-lg font-black uppercase text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Send className="h-5 w-5 text-sky-400" />
              <span>Broadcast or Direct Player Message</span>
            </h3>

            {annSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs">
                {annSuccessMsg}
              </div>
            )}

            <form onSubmit={handlePostAnnouncement} className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase text-slate-300 block mb-1">Notice Headline</label>
                <Input
                  required
                  placeholder="e.g. 24-Hour Cycle Fixture Warning"
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-300 block mb-1">Notice Content</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Type your official administrative communication..."
                  value={annContent}
                  onChange={(e) => setAnnContent(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/80 p-3 text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase text-slate-300 block mb-1">Target Audience</label>
                  <select
                    value={annType}
                    onChange={(e: any) => setAnnType(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 p-2 text-xs text-white"
                  >
                    <option value="BROADCAST">Broadcast (All Players)</option>
                    <option value="INDIVIDUAL">Individual Player Notice</option>
                  </select>
                </div>

                {annType === "INDIVIDUAL" && (
                  <div>
                    <label className="text-xs font-bold uppercase text-slate-300 block mb-1">Select Player</label>
                    <select
                      value={targetPlayerId}
                      onChange={(e) => setTargetPlayerId(e.target.value)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-900 p-2 text-xs text-white"
                    >
                      {allPlayers.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.gamerTag} ({p.division})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="pinNotice"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="rounded border-slate-800"
                />
                <label htmlFor="pinNotice" className="text-xs text-slate-300">
                  Pin to Top of Player Noticeboard
                </label>
              </div>

              <Button type="submit" disabled={postingAnn} className="w-full font-bold">
                {postingAnn ? "Transmitting..." : "Send Announcement"}
              </Button>
            </form>
          </div>

          <div className="lg:col-span-6 rounded-3xl border border-slate-800 bg-slate-950/90 p-6 sm:p-8 shadow-xl space-y-4">
            <h3 className="text-lg font-black uppercase text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Bell className="h-5 w-5 text-yellow-400" />
              <span>Recent Announcements Feed</span>
            </h3>

            <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
              {announcements.map((ann) => (
                <div key={ann.id} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs">{ann.title}</span>
                    <Badge variant={ann.type === "BROADCAST" ? "secondary" : "yellow"} className="text-[9px]">
                      {ann.type}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-400">{ann.content}</p>
                  <span className="text-[10px] text-slate-500 font-mono block">
                    {new Date(ann.createdAt).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: ALL REGISTERED PLAYERS & DISCIPLINE ROSTER */}
      {/* ========================================================================= */}
      {activeTab === "PLAYERS" && (
        <div className="space-y-6">
          {flaggedPlayers.length > 0 && (
            <div className="rounded-2xl border border-red-500/30 bg-red-950/20 p-5 space-y-3">
              <div className="flex items-center gap-2 text-red-400">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <h4 className="font-black uppercase text-sm">Disciplinary Alert (2+ Missed Matches)</h4>
              </div>
              <p className="text-xs text-slate-300">
                The players below have missed consecutive fixtures without approval. EFRL rule mandates immediate disqualification upon reaching 3 missed matches.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {flaggedPlayers.map((fp) => (
                  <div key={fp.id} className="p-3 rounded-xl bg-slate-900/80 border border-red-500/20 text-xs">
                    <span className="font-bold text-white">{fp.gamerTag}</span>
                    <span className="text-rose-400 block font-mono">
                      Missed: {fp.consecutiveMissed}/3 {fp.isDisqualified ? "(DISQUALIFIED)" : "(FINAL WARNING)"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-3xl border border-slate-800 bg-slate-950/90 overflow-hidden shadow-xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-lg font-black uppercase text-white">Registered Athletes Directory</h3>
              <span className="text-xs font-mono text-slate-400">{allPlayers.length} Total</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 text-[11px] font-black uppercase text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Gamer Tag</th>
                    <th className="px-4 py-3">Full Name</th>
                    <th className="px-4 py-3">Konami ID</th>
                    <th className="px-4 py-3">WhatsApp Number</th>
                    <th className="px-4 py-3">Division</th>
                    <th className="px-4 py-3 text-center">Missed</th>
                    <th className="px-4 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {allPlayers.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-900/40">
                      <td className="px-4 py-3 font-bold text-white">{p.gamerTag}</td>
                      <td className="px-4 py-3 text-slate-300">{p.fullName}</td>
                      <td className="px-4 py-3 font-mono text-slate-400">{p.efootballId}</td>
                      <td className="px-4 py-3 font-mono text-emerald-400">{p.whatsapp}</td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            p.division === "Division 1"
                              ? "secondary"
                              : p.division === "Division 2"
                              ? "yellow"
                              : "live"
                          }
                          className="text-[10px]"
                        >
                          {p.division}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center font-mono font-bold">
                        <span className={p.consecutiveMissed >= 2 ? "text-rose-400" : "text-slate-400"}>
                          {p.consecutiveMissed}/3
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge
                          variant={p.isDisqualified ? "destructive" : "secondary"}
                          className="text-[10px]"
                        >
                          {p.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* FULLSCREEN IMAGE INSPECTION MODAL */}
      {inspectImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
          onClick={() => setInspectImage(null)}
        >
          <div className="relative max-w-4xl w-full max-h-[90vh] overflow-hidden rounded-2xl border border-slate-700 bg-slate-950">
            <button
              onClick={() => setInspectImage(null)}
              className="absolute top-4 right-4 z-10 rounded-full bg-slate-900/80 p-2 text-white hover:bg-slate-800"
            >
              ✕
            </button>
            <img
              src={inspectImage}
              alt="Screenshot Evidence Inspection"
              className="w-full h-auto max-h-[85vh] object-contain mx-auto"
            />
          </div>
        </div>
      )}
    </div>
  );
}
