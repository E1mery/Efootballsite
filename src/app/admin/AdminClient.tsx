"use client";

import { useState, useEffect } from "react";
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
  UserMinus,
  UserCheck,
  Crown,
  Sparkles,
  PlusCircle,
  Trash2,
  MessageSquare,
  Search,
  Filter,
  Copy,
  Check,
  ExternalLink,
  Phone,
  Mail,
  ArrowRight,
  UserPlus,
  RotateCcw,
  Star,
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
  initialPendingPlayers = [],
  initialReservePlayers = [],
  initialHallOfFame = [],
  initialPlayerMessages = [],
  initialReviews = [],
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
  initialPendingPlayers?: any[];
  initialReservePlayers?: any[];
  initialHallOfFame?: any[];
  initialPlayerMessages?: any[];
  initialReviews?: any[];
}) {
  const router = useRouter();

  type TabType =
    | "DASHBOARD"
    | "PENDING_REGISTRATIONS"
    | "RESERVE_POOL"
    | "TABLES"
    | "ALL_MATCHES"
    | "CONTINENTAL"
    | "RESULTS_QUEUE"
    | "FORFEITS_QUEUE"
    | "ANNOUNCEMENTS"
    | "PLAYERS"
    | "HALL_OF_FAME"
    | "MESSAGES"
    | "REVIEWS";

  const [activeTab, setActiveTab] = useState<TabType>("DASHBOARD");
  const [tableSubTab, setTableSubTab] = useState<"DIV1" | "DIV2" | "DIV3" | "UCL" | "EUROPA">("DIV1");

  // Dynamic Lists State
  const [pendingPlayers, setPendingPlayers] = useState<any[]>(initialPendingPlayers);
  const [reservePlayers, setReservePlayers] = useState<any[]>(initialReservePlayers);
  const [hallOfFame, setHallOfFame] = useState<any[]>(initialHallOfFame);
  const [playersList, setPlayersList] = useState<any[]>(allPlayers);
  const [playerMessages, setPlayerMessages] = useState<any[]>(initialPlayerMessages);
  const [reviewsList, setReviewsList] = useState<any[]>(initialReviews);

  // New admin operations state
  const [recalculatingStandings, setRecalculatingStandings] = useState(false);
  const [resettingTournament, setResettingTournament] = useState(false);
  const [extendingMatchId, setExtendingMatchId] = useState<string | null>(null);

  // All Matches filter state
  const [allMatchesFilterRound, setAllMatchesFilterRound] = useState<string>("ALL");
  const [allMatchesFilterDiv, setAllMatchesFilterDiv] = useState<string>("ALL");
  const [allMatchesFilterStatus, setAllMatchesFilterStatus] = useState<string>("ALL");
  const [allMatchesSearch, setAllMatchesSearch] = useState<string>("");

  // Pending approvals search & filters & actions
  const [pendingSearch, setPendingSearch] = useState("");
  const [pendingDivisionFilter, setPendingDivisionFilter] = useState<"ALL" | "Division 1" | "Division 2" | "Division 3">("ALL");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [batchApproving, setBatchApproving] = useState(false);
  const [refreshingPending, setRefreshingPending] = useState(false);

  // Sync state when props update from server actions / router.refresh()
  useEffect(() => {
    setPendingPlayers(initialPendingPlayers);
  }, [initialPendingPlayers]);

  useEffect(() => {
    setReservePlayers(initialReservePlayers);
  }, [initialReservePlayers]);

  useEffect(() => {
    setPlayersList(allPlayers);
  }, [allPlayers]);

  useEffect(() => {
    setReviewsList(initialReviews);
  }, [initialReviews]);

  // Direct Inquiries & Reply State
  const [replyingMessageId, setReplyingMessageId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);

  // Division Participant Capacity State (Default: 20 per division)
  const [div1Max, setDiv1Max] = useState<number>(leagueConfig?.div1MaxPlayers ?? 20);
  const [div2Max, setDiv2Max] = useState<number>(leagueConfig?.div2MaxPlayers ?? 20);
  const [div3Max, setDiv3Max] = useState<number>(leagueConfig?.div3MaxPlayers ?? 20);
  const [savingCapacity, setSavingCapacity] = useState(false);
  const [capacitySuccessMsg, setCapacitySuccessMsg] = useState("");

  // Pending approval selection state: playerId -> selectedDivision
  const [pendingDivSelection, setPendingDivSelection] = useState<Record<string, string>>({});
  const [pendingActionLoading, setPendingActionLoading] = useState<string | null>(null);

  // Computed division participant counts
  const activeDiv1Count = playersList.filter(
    (p) => p.division === "Division 1" && (p.status === "ACTIVE" || p.status === "WARNING")
  ).length;
  const activeDiv2Count = playersList.filter(
    (p) => p.division === "Division 2" && (p.status === "ACTIVE" || p.status === "WARNING")
  ).length;
  const activeDiv3Count = playersList.filter(
    (p) => p.division === "Division 3" && (p.status === "ACTIVE" || p.status === "WARNING")
  ).length;

  // Filtered pending registrations based on division filter and search query
  const filteredPendingPlayers = pendingPlayers.filter((p) => {
    if (pendingDivisionFilter !== "ALL" && p.division !== pendingDivisionFilter) {
      return false;
    }
    if (pendingSearch.trim()) {
      const q = pendingSearch.toLowerCase().trim();
      const matchTag = p.gamerTag?.toLowerCase().includes(q);
      const matchName = p.fullName?.toLowerCase().includes(q);
      const matchWa = p.whatsapp?.toLowerCase().includes(q);
      const matchEmail = p.user?.email?.toLowerCase().includes(q);
      const matchEfId = p.efootballId?.toLowerCase().includes(q);
      return Boolean(matchTag || matchName || matchWa || matchEmail || matchEfId);
    }
    return true;
  });

  // Player replace modal state
  const [replaceTargetPlayer, setReplaceTargetPlayer] = useState<any | null>(null);
  const [replaceMode, setReplaceMode] = useState<"FROM_RESERVE" | "NEW_DETAILS">("FROM_RESERVE");
  const [selectedReserveId, setSelectedReserveId] = useState<string>("");
  const [repGamerTag, setRepGamerTag] = useState("");
  const [repFullName, setRepFullName] = useState("");
  const [repWhatsapp, setRepWhatsapp] = useState("");
  const [repEmail, setRepEmail] = useState("");
  const [repPassword, setRepPassword] = useState("");
  const [outgoingAction, setOutgoingAction] = useState<"REMOVE" | "MOVE_TO_RESERVE">("REMOVE");
  const [replaceLoading, setReplaceLoading] = useState(false);

  // Hall of fame form state
  const [hofTournament, setHofTournament] = useState("EFRL Division 1 (Premiership)");
  const [hofSeason, setHofSeason] = useState("Season 2026");
  const [hofChampion, setHofChampion] = useState("");
  const [hofRealName, setHofRealName] = useState("");
  const [hofTrophyType, setHofTrophyType] = useState("GOLD");
  const [submittingHof, setSubmittingHof] = useState(false);

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
      if (typeof window !== "undefined") {
        localStorage.removeItem("efrl_user");
      }
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/?loggedOut=admin");
      router.refresh();
    } catch (err) {
      router.push("/?loggedOut=admin");
    }
  };

  // Handler: Approve Athlete or Place in Reserve Pool
  const handleApproveAthlete = async (playerId: string, action: "ADMIT" | "RESERVE") => {
    const selectedDiv =
      pendingDivSelection[playerId] ||
      pendingPlayers.find(p => p.id === playerId)?.division ||
      reservePlayers.find(p => p.id === playerId)?.division ||
      "Division 1";
    setPendingActionLoading(playerId);
    try {
      const res = await fetch("/api/admin/approve-player", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, action, division: selectedDiv }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to process athlete registration");

      alert(data.message);

      if (action === "ADMIT" && data.player) {
        // Remove from pending registrations
        setPendingPlayers(prev => prev.filter(p => p.id !== playerId));
        // Remove from reserve pool if they were on standby
        setReservePlayers(prev => prev.filter(p => p.id !== playerId));
        // Automatically add/update in Athletes Directory
        setPlayersList(prev => {
          const filtered = prev.filter(p => p.id !== playerId);
          return [...filtered, data.player].sort(
            (a, b) => (a.division || "").localeCompare(b.division || "") || a.gamerTag.localeCompare(b.gamerTag)
          );
        });
      } else if (action === "RESERVE" && data.player) {
        // Remove from pending registrations
        setPendingPlayers(prev => prev.filter(p => p.id !== playerId));
        // Remove from active athletes directory
        setPlayersList(prev => prev.filter(p => p.id !== playerId));
        // Add to reserve pool
        setReservePlayers(prev => [data.player, ...prev.filter(p => p.id !== playerId)]);
      }

      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setPendingActionLoading(null);
    }
  };

  // Handler: Reject Pending Registration Application
  const handleRejectAthlete = async (playerId: string, gamerTag: string) => {
    if (!confirm(`Reject athlete application for "${gamerTag}"?\n\nThis will remove their pending registration cleanly without affecting league standings.`)) {
      return;
    }
    setPendingActionLoading(playerId);
    try {
      const res = await fetch("/api/admin/approve-player", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, action: "REJECT" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reject registration");

      alert(data.message);
      setPendingPlayers(prev => prev.filter(p => p.id !== playerId));
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setPendingActionLoading(null);
    }
  };

  // Handler: Batch Process All or Filtered Pending Registrations
  const handleBatchApprovePending = async (action: "ADMIT" | "RESERVE") => {
    if (pendingPlayers.length === 0) return;
    const targetList = pendingPlayers;
    const confirmPrompt =
      action === "ADMIT"
        ? `Admit all ${targetList.length} pending athlete(s) to their chosen division placements?`
        : `Move all ${targetList.length} pending athlete(s) to the Standby Reserve Pool?`;
    if (!confirm(confirmPrompt)) return;

    setBatchApproving(true);
    try {
      const batchPayload = targetList.map((p) => ({
        playerId: p.id,
        action,
        division: pendingDivSelection[p.id] || p.division || "Division 1",
      }));

      const res = await fetch("/api/admin/approve-player", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batch: batchPayload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Batch approval encountered an issue");

      alert(data.message);
      if (data.errors && data.errors.length > 0) {
        alert("Some athletes could not be admitted:\n" + data.errors.join("\n"));
      }
      setPendingPlayers([]);
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setBatchApproving(false);
    }
  };

  // Handler: Manual Refresh Pending Queue
  const handleRefreshPending = () => {
    setRefreshingPending(true);
    router.refresh();
    setTimeout(() => {
      setRefreshingPending(false);
    }, 800);
  };

  // Handler: Copy Konami ID
  const handleCopyKonamiId = (id: string, text: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  // Handler: Remove Any Athlete
  const handleRemoveAthlete = async (playerId: string, gamerTag: string) => {
    if (!confirm(`Are you sure you want to PERMANENTLY remove athlete "${gamerTag}" from the league?\n\nThis will remove their user account, standings, and any unplayed matches.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/remove-player?playerId=${playerId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to remove player");

      alert(data.message);
      setPlayersList(prev => prev.filter(p => p.id !== playerId));
      setPendingPlayers(prev => prev.filter(p => p.id !== playerId));
      setReservePlayers(prev => prev.filter(p => p.id !== playerId));
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Handler: Replace Athlete Submit
  const handleReplaceAthleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replaceTargetPlayer) return;

    setReplaceLoading(true);
    try {
      const payload: any = {
        playerId: replaceTargetPlayer.id,
        replacementMode: replaceMode,
        outgoingAction,
      };

      if (replaceMode === "FROM_RESERVE") {
        if (!selectedReserveId) {
          throw new Error("Please select an athlete from the Reserve Pool.");
        }
        payload.reservePlayerId = selectedReserveId;
      } else {
        payload.newGamerTag = repGamerTag;
        payload.newFullName = repFullName;
        payload.newWhatsapp = repWhatsapp;
        payload.newEmail = repEmail;
        payload.newPassword = repPassword;
      }

      const res = await fetch("/api/admin/replace-player", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to replace athlete");

      alert(data.message);
      setReplaceTargetPlayer(null);
      // Reset form
      setRepGamerTag("");
      setRepFullName("");
      setRepWhatsapp("");
      setRepEmail("");
      setRepPassword("");
      setSelectedReserveId("");
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setReplaceLoading(false);
    }
  };

  // Handler: Add to Hall of Fame
  const handleAddHallOfFame = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingHof(true);
    try {
      const res = await fetch("/api/admin/hall-of-fame", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tournamentName: hofTournament,
          season: hofSeason,
          championName: hofChampion,
          championRealName: hofRealName,
          trophyType: hofTrophyType,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to crown champion in Hall of Fame");

      alert(data.message);
      if (data.entry) {
        setHallOfFame(prev => [data.entry, ...prev]);
      }
      setHofChampion("");
      setHofRealName("");
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmittingHof(false);
    }
  };

  // Handler: Delete Hall of Fame Entry
  const handleDeleteHallOfFame = async (id: string, champName: string) => {
    if (!confirm(`Are you sure you want to remove ${champName} from the Hall of Fame?`)) return;
    try {
      const res = await fetch(`/api/admin/hall-of-fame?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to remove entry");

      setHallOfFame(prev => prev.filter(e => e.id !== id));
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Score verification inputs state: submissionId -> { home: number, away: number }
  const [submissionScores, setSubmissionScores] = useState<Record<string, { home: number; away: number }>>({});
  const [scoreQueueSubTab, setScoreQueueSubTab] = useState<"SUBMISSIONS" | "DIRECT_ENTRY">("SUBMISSIONS");
  const [matchScores, setMatchScores] = useState<Record<string, { home: number; away: number; touched?: boolean }>>({});
  const [selectedMatchdayRound, setSelectedMatchdayRound] = useState<string>(`Matchday ${leagueConfig.currentMatchday}`);
  const [selectedMatchDivision, setSelectedMatchDivision] = useState<string>("ALL");
  const [batchLoading, setBatchLoading] = useState(false);

  const handleScoreChange = (submissionId: string, side: "home" | "away", val: number) => {
    setSubmissionScores((prev) => ({
      ...prev,
      [submissionId]: {
        home: side === "home" ? val : (prev[submissionId]?.home ?? 0),
        away: side === "away" ? val : (prev[submissionId]?.away ?? 0),
      },
    }));
  };

  const handleDirectMatchScoreChange = (matchId: string, side: "home" | "away", val: number) => {
    setMatchScores((prev) => ({
      ...prev,
      [matchId]: {
        home: side === "home" ? val : (prev[matchId]?.home ?? 0),
        away: side === "away" ? val : (prev[matchId]?.away ?? 0),
        touched: true,
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

  // Reset Tournament Schedule & Standings
  const handleResetTournament = async (division: string = "ALL") => {
    const confirmMsg =
      division === "ALL"
        ? "⚠️ CRITICAL ACTION: Are you sure you want to completely RESET all generated matches and reset league table standings to 0 for ALL divisions?\n\nThis will wipe all generated matches, match submissions, and reset player statistics & points back to Matchday 1."
        : `⚠️ WARNING: Are you sure you want to RESET all generated matches and reset table standings to 0 for ${division}?`;

    if (!confirm(confirmMsg)) return;

    if (!confirm(`CONFIRMATION: Are you 100% certain you want to permanently DELETE all generated matches and reset standings to 0 for ${division}? Click OK to proceed.`)) {
      return;
    }

    setResettingTournament(true);
    try {
      const res = await fetch("/api/admin/reset-tournament", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ division }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reset tournament");
      alert(data.message);
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setResettingTournament(false);
    }
  };

  // Recalculate Standings Table (Batch One-Click Update)
  const handleRecalculateStandings = async (division: string = "ALL") => {
    if (
      !confirm(
        `Recalculate and update the official standings table for ${
          division === "ALL" ? "all divisions" : division
        } based on all approved finished matches?`
      )
    ) {
      return;
    }

    setRecalculatingStandings(true);
    try {
      const res = await fetch("/api/admin/recalculate-standings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ division }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to recalculate standings");
      alert(data.message);
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setRecalculatingStandings(false);
    }
  };

  // Extend Deadline / Allow Late Submission for a Match
  const handleExtendDeadline = async (matchId: string, defaultHours: number = 24) => {
    const input = prompt(
      "How many hours would you like to extend this match deadline by?",
      String(defaultHours)
    );
    if (!input) return;

    const hours = parseInt(input, 10);
    if (isNaN(hours) || hours <= 0) {
      alert("Please enter a valid positive number of hours.");
      return;
    }

    setExtendingMatchId(matchId);
    try {
      const res = await fetch("/api/admin/extend-deadline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId,
          extensionHours: hours,
          allowLateSubmission: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to extend deadline");
      alert(data.message);
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setExtendingMatchId(null);
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

  // Trigger 1-Hour Deadline Reminders to Unplayed Players
  const handleTriggerReminders = async () => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/cron/reminders", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send reminders");
      alert(`Automated 1-Hour Deadline Reminder Check:\n• Matches evaluated: ${data.checkedCount}\n• Urgent reminders sent: ${data.remindersSent}${data.details?.length > 0 ? `\n\nDetails:\n` + data.details.join("\n") : "\n(No unplayed matches are within the 1-hour window or reminders already sent)"}`);
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

  // Batch approve all pending submissions at the same time (Update tables once & notify users)
  const handleBatchApproveSubmissions = async () => {
    if (pendingSubmissions.length === 0) return;
    if (
      !confirm(
        `Insert verified goals for ALL ${pendingSubmissions.length} played matches simultaneously? The league table will update once, and an official broadcast notification will be sent to all users.`
      )
    ) {
      return;
    }

    setBatchLoading(true);
    try {
      const updates = pendingSubmissions.map((sub) => ({
        matchId: sub.matchId,
        submissionId: sub.id,
        homeScore: submissionScores[sub.id]?.home !== undefined ? submissionScores[sub.id].home : (sub.homeScore ?? 0),
        awayScore: submissionScores[sub.id]?.away !== undefined ? submissionScores[sub.id].away : (sub.awayScore ?? 0),
      }));

      const res = await fetch("/api/admin/batch-update-scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          updates,
          matchdayName: `Matchday ${leagueConfig.currentMatchday}`,
          notifyUsers: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to batch update match scores");

      alert(`Batch Goal Verification Complete!\n${data.message}`);
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setBatchLoading(false);
    }
  };

  // Batch update matchday goals directly entered by admin (Update tables once & notify users)
  const handleBatchDirectMatchScores = async () => {
    const touchedIds = Object.keys(matchScores).filter((id) => matchScores[id]?.touched);
    if (touchedIds.length === 0) {
      alert("Please enter goals for at least one match before saving.");
      return;
    }

    if (
      !confirm(
        `Insert goals for ${touchedIds.length} played matches simultaneously? League tables will update once and a broadcast notification will be dispatched to all users.`
      )
    ) {
      return;
    }

    setBatchLoading(true);
    try {
      const updates = touchedIds.map((matchId) => ({
        matchId,
        homeScore: matchScores[matchId].home,
        awayScore: matchScores[matchId].away,
      }));

      const res = await fetch("/api/admin/batch-update-scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          updates,
          matchdayName: selectedMatchdayRound,
          notifyUsers: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to batch update scores");

      alert(`Batch Goals Saved!\n${data.message}`);
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setBatchLoading(false);
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

  // Save Division Participant Capacity
  const handleSaveCapacity = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCapacity(true);
    setCapacitySuccessMsg("");
    try {
      const res = await fetch("/api/admin/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          div1MaxPlayers: Number(div1Max),
          div2MaxPlayers: Number(div2Max),
          div3MaxPlayers: Number(div3Max),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update division capacity");
      setCapacitySuccessMsg(data.message || "Division capacities saved successfully!");
      setTimeout(() => setCapacitySuccessMsg(""), 4000);
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingCapacity(false);
    }
  };

  // Reply to Player Message
  const handleReplyToMessage = async (messageId: string) => {
    if (!replyText.trim()) return;
    setSubmittingReply(true);
    try {
      const res = await fetch("/api/admin/messages/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageId,
          replyContent: replyText.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send reply");
      alert(data.message || "Reply sent successfully!");
      if (data.data) {
        setPlayerMessages((prev) =>
          prev.map((m) => (m.id === messageId ? data.data : m))
        );
      }
      setReplyingMessageId(null);
      setReplyText("");
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmittingReply(false);
    }
  };

  // Helper for standings table rendering
  const renderStandingsTable = (title: string, standings: any[], badgeColor: string, maxLimit: number = 20) => {
    return (
      <div className="rounded-3xl border border-slate-800 bg-slate-950/90 overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/40">
          <div className="flex items-center gap-2.5">
            <span className={`h-3 w-3 rounded-full ${badgeColor}`} />
            <h3 className="text-lg font-black uppercase text-white tracking-wide">{title}</h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {standings.length} Registered Competitors (Max {maxLimit})
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

      {/* Primary Navigation Tabs - Mobile & Tablet Horizontally Scrollable */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto no-scrollbar scroll-smooth -mx-4 px-4 sm:mx-0 sm:px-0">
        <button
          onClick={() => setActiveTab("DASHBOARD")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 min-h-[42px] ${
            activeTab === "DASHBOARD"
              ? "bg-sky-500 text-white shadow-lg shadow-sky-500/30"
              : "text-slate-400 hover:text-white hover:bg-slate-900"
          }`}
        >
          <Sliders className="h-4 w-4" />
          <span>Control Center</span>
        </button>

        <button
          onClick={() => setActiveTab("PENDING_REGISTRATIONS")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 min-h-[42px] ${
            activeTab === "PENDING_REGISTRATIONS"
              ? "bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/30"
              : "text-slate-400 hover:text-white hover:bg-slate-900"
          }`}
        >
          <UserCheck className={`h-4 w-4 ${activeTab === "PENDING_REGISTRATIONS" ? "text-slate-950" : "text-amber-400"}`} />
          <span>Pending Approvals</span>
          {pendingPlayers.length > 0 && (
            <Badge
              variant="yellow"
              className={`text-[10px] px-1.5 py-0 font-black ${
                activeTab === "PENDING_REGISTRATIONS"
                  ? "bg-slate-950 text-amber-400"
                  : "bg-amber-400 text-slate-950"
              }`}
            >
              {pendingPlayers.length}
            </Badge>
          )}
        </button>

        <button
          onClick={() => setActiveTab("RESERVE_POOL")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 min-h-[42px] ${
            activeTab === "RESERVE_POOL"
              ? "bg-cyan-500 text-slate-950 font-black shadow-lg shadow-cyan-500/30"
              : "text-slate-400 hover:text-white hover:bg-slate-900"
          }`}
        >
          <Sparkles className="h-4 w-4 text-cyan-400" />
          <span>Reserve Pool ({reservePlayers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("TABLES")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 min-h-[42px] ${
            activeTab === "TABLES"
              ? "bg-sky-500 text-white shadow-lg shadow-sky-500/30"
              : "text-slate-400 hover:text-white hover:bg-slate-900"
          }`}
        >
          <Trophy className="h-4 w-4" />
          <span>All League Tables</span>
        </button>

        <button
          onClick={() => setActiveTab("ALL_MATCHES")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 min-h-[42px] ${
            activeTab === "ALL_MATCHES"
              ? "bg-cyan-500 text-slate-950 font-black shadow-lg shadow-cyan-500/30"
              : "text-slate-400 hover:text-white hover:bg-slate-900"
          }`}
        >
          <Calendar className="h-4 w-4 text-cyan-400" />
          <span>All Generated Matches ({matches.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("CONTINENTAL")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 min-h-[42px] ${
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
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 min-h-[42px] ${
            activeTab === "RESULTS_QUEUE"
              ? "bg-sky-500 text-white shadow-lg shadow-sky-500/30"
              : "text-slate-400 hover:text-white hover:bg-slate-900"
          }`}
        >
          <Upload className="h-4 w-4" />
          <span>Score Verification</span>
          {pendingSubmissions.length > 0 && (
            <Badge variant="live" className="text-[10px] px-1.5 py-0">
              {pendingSubmissions.length}
            </Badge>
          )}
        </button>

        <button
          onClick={() => setActiveTab("FORFEITS_QUEUE")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 min-h-[42px] ${
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
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 min-h-[42px] ${
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
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 min-h-[42px] ${
            activeTab === "PLAYERS"
              ? "bg-sky-500 text-white shadow-lg shadow-sky-500/30"
              : "text-slate-400 hover:text-white hover:bg-slate-900"
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Athletes Directory ({playersList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("HALL_OF_FAME")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 min-h-[42px] ${
            activeTab === "HALL_OF_FAME"
              ? "bg-yellow-500 text-slate-950 font-black shadow-lg shadow-yellow-500/30"
              : "text-slate-400 hover:text-white hover:bg-slate-900"
          }`}
        >
          <Crown className="h-4 w-4 text-yellow-400" />
          <span>Hall of Fame ({hallOfFame.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("MESSAGES")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 min-h-[42px] ${
            activeTab === "MESSAGES"
              ? "bg-indigo-600 text-white font-black shadow-lg shadow-indigo-600/30"
              : "text-slate-400 hover:text-white hover:bg-slate-900"
          }`}
        >
          <MessageSquare className="h-4 w-4 text-indigo-400" />
          <span>Player Inquiries ({playerMessages.length})</span>
          {playerMessages.filter((m) => m.status === "PENDING").length > 0 && (
            <Badge variant="destructive" className="text-[10px] px-1.5 py-0 font-black animate-pulse">
              {playerMessages.filter((m) => m.status === "PENDING").length}
            </Badge>
          )}
        </button>

        <button
          onClick={() => setActiveTab("REVIEWS")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 min-h-[42px] ${
            activeTab === "REVIEWS"
              ? "bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/30"
              : "text-slate-400 hover:text-white hover:bg-slate-900"
          }`}
        >
          <Star className={`h-4 w-4 ${activeTab === "REVIEWS" ? "text-slate-950" : "text-amber-400"}`} />
          <span>Ratings & Reviews ({reviewsList.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: CONTROL CENTER (REGISTRATION, SCHEDULE GENERATOR, 12 AM CYCLE) */}
      {/* ========================================================================= */}
      {activeTab === "DASHBOARD" && (
        <div className="space-y-8">
          {/* Action Required Alert: Pending Registrations */}
          {pendingPlayers.length > 0 && (
            <div className="rounded-3xl border border-amber-500/50 bg-gradient-to-r from-amber-950/40 via-slate-950 to-slate-950 p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 shrink-0">
                  <UserCheck className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black uppercase text-white">Action Required: Pending Registrations</h3>
                    <Badge variant="yellow" className="font-mono text-xs">
                      {pendingPlayers.length} Waiting
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {pendingPlayers.length} new athlete{pendingPlayers.length > 1 ? "s have" : " has"} registered and {pendingPlayers.length > 1 ? "are" : "is"} awaiting commissioner review. Admit them to active divisions or place them in reserve.
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setActiveTab("PENDING_REGISTRATIONS")}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider gap-2 shrink-0 shadow-lg shadow-amber-500/20"
              >
                <span>Review Approvals</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}

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
                <span className="text-2xl font-black text-white">{div1Standings.length} / {div1Max}</span>
                <span className="text-[11px] text-slate-500 block mt-1">Premiership Division</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                <span className="text-xs font-bold text-yellow-400 block">Division 2 Registered</span>
                <span className="text-2xl font-black text-white">{div2Standings.length} / {div2Max}</span>
                <span className="text-[11px] text-slate-500 block mt-1">Championship Division</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                <span className="text-xs font-bold text-emerald-400 block">Division 3 Registered</span>
                <span className="text-2xl font-black text-white">{div3Standings.length} / {div3Max}</span>
                <span className="text-[11px] text-slate-500 block mt-1">National Academy</span>
              </div>
            </div>
          </div>

          {/* Operation 1B: Division Participant Capacity Controller */}
          <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-6 sm:p-8 backdrop-blur-xl shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-black uppercase text-white flex items-center gap-2">
                  <Users className="h-5 w-5 text-indigo-400" />
                  <span>Division Participant Capacity Settings</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Admins can extend the maximum participant capacity per division (default: 20 athletes). Continental UCL and Europa League remain fixed at 16 qualification slots.
                </p>
              </div>

              {capacitySuccessMsg && (
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-500/40 px-3 py-1.5 rounded-xl">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{capacitySuccessMsg}</span>
                </div>
              )}
            </div>

            <form onSubmit={handleSaveCapacity} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2">
                  <label className="text-xs font-bold uppercase text-sky-400 block">
                    Division 1 Capacity
                  </label>
                  <p className="text-[11px] text-slate-400">Premiership maximum participants.</p>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={div1Max}
                    onChange={(e) => setDiv1Max(Number(e.target.value))}
                    className="bg-slate-950 border-slate-700 text-sm font-bold font-mono text-white"
                    required
                  />
                  <span className="text-[10px] text-slate-500 block">Current active: {div1Standings.length} athletes</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2">
                  <label className="text-xs font-bold uppercase text-yellow-400 block">
                    Division 2 Capacity
                  </label>
                  <p className="text-[11px] text-slate-400">Championship maximum participants.</p>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={div2Max}
                    onChange={(e) => setDiv2Max(Number(e.target.value))}
                    className="bg-slate-950 border-slate-700 text-sm font-bold font-mono text-white"
                    required
                  />
                  <span className="text-[10px] text-slate-500 block">Current active: {div2Standings.length} athletes</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2">
                  <label className="text-xs font-bold uppercase text-emerald-400 block">
                    Division 3 Capacity
                  </label>
                  <p className="text-[11px] text-slate-400">National Academy maximum participants.</p>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={div3Max}
                    onChange={(e) => setDiv3Max(Number(e.target.value))}
                    className="bg-slate-950 border-slate-700 text-sm font-bold font-mono text-white"
                    required
                  />
                  <span className="text-[10px] text-slate-500 block">Current active: {div3Standings.length} athletes</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <span className="text-[11px] text-slate-400">
                  UCL & Europa League: <strong>16 Fixed Slots</strong> (Top 8 Div 1 + Top 4 Div 2 + Top 4 Div 3 - Unchanged).
                </span>
                <Button
                  type="submit"
                  disabled={savingCapacity}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-indigo-600/30"
                >
                  {savingCapacity ? "Saving..." : "Save Division Capacity Limits"}
                </Button>
              </div>
            </form>
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

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  onClick={() => handleGenerateSchedule("ALL")}
                  disabled={actionLoading || leagueConfig.registrationOpen}
                  variant="yellow"
                  className="font-bold text-xs uppercase tracking-wider text-slate-950"
                >
                  Generate All Divisions Schedule
                </Button>

                <Button
                  onClick={() => handleResetTournament("ALL")}
                  disabled={resettingTournament}
                  variant="destructive"
                  className="font-bold text-xs uppercase tracking-wider gap-1.5 shadow-lg shadow-rose-600/20"
                >
                  <RotateCcw className={`h-3.5 w-3.5 ${resettingTournament ? "animate-spin" : ""}`} />
                  {resettingTournament ? "Resetting..." : "Reset All Matches & Standings"}
                </Button>
              </div>
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
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleGenerateSchedule("Division 1")}
                    disabled={actionLoading || leagueConfig.registrationOpen}
                    className="w-full text-xs font-bold"
                  >
                    Generate
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleResetTournament("Division 1")}
                    disabled={resettingTournament}
                    className="w-full text-xs font-bold text-rose-400 hover:bg-rose-950/30"
                  >
                    Reset
                  </Button>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-yellow-400 block">Division 2 Schedule</span>
                <p className="text-[11px] text-slate-400">Generate round-robin fixtures strictly for Division 2.</p>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleGenerateSchedule("Division 2")}
                    disabled={actionLoading || leagueConfig.registrationOpen}
                    className="w-full text-xs font-bold"
                  >
                    Generate
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleResetTournament("Division 2")}
                    disabled={resettingTournament}
                    className="w-full text-xs font-bold text-rose-400 hover:bg-rose-950/30"
                  >
                    Reset
                  </Button>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-emerald-400 block">Division 3 Schedule</span>
                <p className="text-[11px] text-slate-400">Generate round-robin fixtures strictly for Division 3.</p>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleGenerateSchedule("Division 3")}
                    disabled={actionLoading || leagueConfig.registrationOpen}
                    className="w-full text-xs font-bold"
                  >
                    Generate
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleResetTournament("Division 3")}
                    disabled={resettingTournament}
                    className="w-full text-xs font-bold text-rose-400 hover:bg-rose-950/30"
                  >
                    Reset
                  </Button>
                </div>
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

              <div className="flex flex-wrap items-center gap-2.5">
                <Button
                  onClick={handleTriggerReminders}
                  disabled={actionLoading}
                  variant="outline"
                  className="border-amber-500/50 text-amber-300 hover:bg-amber-950/30 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5"
                >
                  <Bell className="h-3.5 w-3.5 text-amber-400" />
                  <span>Trigger 1-Hr Reminders</span>
                </Button>

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
      {/* TAB: PENDING ATHLETE REGISTRATIONS */}
      {/* ========================================================================= */}
      {activeTab === "PENDING_REGISTRATIONS" && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-r from-amber-950/30 via-slate-950 to-slate-950 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
            <div>
              <div className="flex items-center gap-2 text-amber-400">
                <UserCheck className="h-6 w-6" />
                <h3 className="text-xl font-black uppercase text-white tracking-tight">Pending Athlete Approval Queue</h3>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                Review and approve newly registered athletes. Verify their Konami eFootball Mobile ID, contact them directly on WhatsApp, assign them to their preferred division, or hold them in the official Reserve Pool.
              </p>
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              <Button
                size="sm"
                variant="outline"
                onClick={handleRefreshPending}
                disabled={refreshingPending}
                className="border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-200 text-xs font-bold gap-1.5"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${refreshingPending ? "animate-spin text-amber-400" : ""}`} />
                <span>{refreshingPending ? "Refreshing..." : "Refresh Queue"}</span>
              </Button>
              <Badge variant="yellow" className="text-xs px-3 py-1 font-mono font-black">
                {pendingPlayers.length} Awaiting Approval
              </Badge>
            </div>
          </div>

          {/* Division Roster Live Capacity Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-sky-500/30 bg-slate-950/80 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">Division 1 (Premiership)</span>
                <Badge
                  variant={activeDiv1Count >= div1Max ? "destructive" : activeDiv1Count >= div1Max * 0.8 ? "yellow" : "secondary"}
                  className="text-[10px] font-mono"
                >
                  {activeDiv1Count >= div1Max ? "FULL" : `${div1Max - activeDiv1Count} Open Slots`}
                </Badge>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-white">{activeDiv1Count} <span className="text-xs font-normal text-slate-400">/ {div1Max} players</span></span>
                <span className="text-xs font-mono text-slate-400">{Math.round((activeDiv1Count / Math.max(1, div1Max)) * 100)}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${activeDiv1Count >= div1Max ? "bg-rose-500" : activeDiv1Count >= div1Max * 0.8 ? "bg-amber-400" : "bg-sky-400"}`}
                  style={{ width: `${Math.min(100, Math.round((activeDiv1Count / Math.max(1, div1Max)) * 100))}%` }}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-yellow-500/30 bg-slate-950/80 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-yellow-400 uppercase tracking-wider">Division 2 (Championship)</span>
                <Badge
                  variant={activeDiv2Count >= div2Max ? "destructive" : activeDiv2Count >= div2Max * 0.8 ? "yellow" : "secondary"}
                  className="text-[10px] font-mono"
                >
                  {activeDiv2Count >= div2Max ? "FULL" : `${div2Max - activeDiv2Count} Open Slots`}
                </Badge>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-white">{activeDiv2Count} <span className="text-xs font-normal text-slate-400">/ {div2Max} players</span></span>
                <span className="text-xs font-mono text-slate-400">{Math.round((activeDiv2Count / Math.max(1, div2Max)) * 100)}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${activeDiv2Count >= div2Max ? "bg-rose-500" : activeDiv2Count >= div2Max * 0.8 ? "bg-amber-400" : "bg-yellow-400"}`}
                  style={{ width: `${Math.min(100, Math.round((activeDiv2Count / Math.max(1, div2Max)) * 100))}%` }}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-500/30 bg-slate-950/80 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Division 3 (Conference)</span>
                <Badge
                  variant={activeDiv3Count >= div3Max ? "destructive" : activeDiv3Count >= div3Max * 0.8 ? "yellow" : "secondary"}
                  className="text-[10px] font-mono"
                >
                  {activeDiv3Count >= div3Max ? "FULL" : `${div3Max - activeDiv3Count} Open Slots`}
                </Badge>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-white">{activeDiv3Count} <span className="text-xs font-normal text-slate-400">/ {div3Max} players</span></span>
                <span className="text-xs font-mono text-slate-400">{Math.round((activeDiv3Count / Math.max(1, div3Max)) * 100)}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${activeDiv3Count >= div3Max ? "bg-rose-500" : activeDiv3Count >= div3Max * 0.8 ? "bg-amber-400" : "bg-emerald-400"}`}
                  style={{ width: `${Math.min(100, Math.round((activeDiv3Count / Math.max(1, div3Max)) * 100))}%` }}
                />
              </div>
            </div>
          </div>

          {/* Filtering, Search & Batch Control Toolbar */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Division Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 md:pb-0">
              {(["ALL", "Division 1", "Division 2", "Division 3"] as const).map((div) => {
                const count =
                  div === "ALL"
                    ? pendingPlayers.length
                    : pendingPlayers.filter((p) => p.division === div).length;
                const isSelected = pendingDivisionFilter === div;
                return (
                  <button
                    key={div}
                    onClick={() => setPendingDivisionFilter(div)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                      isSelected
                        ? "bg-sky-500 text-white shadow-md shadow-sky-500/20"
                        : "bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800"
                    }`}
                  >
                    <span>{div === "ALL" ? "All Requested" : div}</span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                        isSelected ? "bg-sky-600 text-white" : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Search and Batch Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative min-w-[220px]">
                <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search athlete, WA, ID..."
                  value={pendingSearch}
                  onChange={(e) => setPendingSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
                />
                {pendingSearch && (
                  <button
                    onClick={() => setPendingSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs font-bold"
                  >
                    ×
                  </button>
                )}
              </div>

              {pendingPlayers.length > 0 && (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    disabled={batchApproving}
                    onClick={() => handleBatchApprovePending("ADMIT")}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold whitespace-nowrap shadow-md shadow-emerald-600/20"
                  >
                    <UserPlus className="h-3.5 w-3.5 mr-1" />
                    {batchApproving ? "Processing..." : `Batch Admit All (${pendingPlayers.length})`}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={batchApproving}
                    onClick={() => handleBatchApprovePending("RESERVE")}
                    className="border-amber-500/40 text-amber-400 hover:bg-amber-950/40 text-xs font-bold whitespace-nowrap"
                  >
                    <Layers className="h-3.5 w-3.5 mr-1" />
                    Reserve All
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Athletes List */}
          {pendingPlayers.length === 0 ? (
            <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-12 text-center">
              <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto mb-3 opacity-60" />
              <h4 className="text-base font-bold text-white uppercase">Queue is Clear</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                There are no pending registrations awaiting review. All registered players have been either assigned to a division or placed into the reserve pool.
              </p>
            </div>
          ) : filteredPendingPlayers.length === 0 ? (
            <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-10 text-center space-y-2">
              <Search className="h-10 w-10 text-slate-600 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-white uppercase">No Athletes Match Filter</h4>
              <p className="text-xs text-slate-400">
                No pending registrations matched your search &quot;{pendingSearch}&quot; in {pendingDivisionFilter}.
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setPendingSearch("");
                  setPendingDivisionFilter("ALL");
                }}
                className="text-xs mt-2"
              >
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredPendingPlayers.map((p) => {
                const currentSelection = pendingDivSelection[p.id] || p.division || "Division 1";
                const isLoading = pendingActionLoading === p.id;
                const cleanWa = p.whatsapp?.replace(/[^0-9]/g, "") || "";
                const isCopied = copiedId === p.id;

                // Capacity check for selected division
                const targetActiveCount =
                  currentSelection === "Division 1"
                    ? activeDiv1Count
                    : currentSelection === "Division 2"
                    ? activeDiv2Count
                    : activeDiv3Count;
                const targetMax =
                  currentSelection === "Division 1"
                    ? div1Max
                    : currentSelection === "Division 2"
                    ? div2Max
                    : div3Max;
                const isTargetFull = targetActiveCount >= targetMax;

                return (
                  <div
                    key={p.id}
                    className="rounded-2xl border border-slate-800 bg-slate-950/90 p-5 space-y-4 hover:border-slate-700 transition-all shadow-xl flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      {/* Top Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 font-black text-sm shrink-0">
                            {p.gamerTag.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="text-base font-black text-white leading-tight">{p.gamerTag}</h4>
                            <p className="text-xs text-slate-400 font-medium">{p.fullName}</p>
                          </div>
                        </div>
                        <Badge variant="yellow" className="text-[10px] shrink-0 font-bold">
                          Pending
                        </Badge>
                      </div>

                      {/* Information Grid */}
                      <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800/90 space-y-2 text-xs">
                        {/* Konami eFootball Mobile ID */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-slate-400 flex items-center gap-1.5">
                            <span>eFootball ID:</span>
                          </span>
                          <div className="flex items-center gap-1.5 font-mono text-xs">
                            <span className="text-sky-300 font-semibold truncate max-w-[140px]" title={p.efootballId}>
                              {p.efootballId || "N/A"}
                            </span>
                            {p.efootballId && (
                              <button
                                onClick={() => handleCopyKonamiId(p.id, p.efootballId)}
                                title="Copy eFootball ID"
                                className="text-slate-400 hover:text-white transition-colors p-1"
                              >
                                {isCopied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* WhatsApp with click-to-chat */}
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 flex items-center gap-1.5">
                            <Phone className="h-3 w-3 text-emerald-400" />
                            <span>WhatsApp:</span>
                          </span>
                          {cleanWa ? (
                            <a
                              href={`https://wa.me/${cleanWa}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-mono text-emerald-400 font-bold hover:underline flex items-center gap-1"
                              title="Click to open WhatsApp chat"
                            >
                              <span>{p.whatsapp}</span>
                              <ExternalLink className="h-2.5 w-2.5 opacity-60" />
                            </a>
                          ) : (
                            <span className="font-mono text-slate-400">{p.whatsapp}</span>
                          )}
                        </div>

                        {/* Email */}
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 flex items-center gap-1.5">
                            <Mail className="h-3 w-3 text-sky-400" />
                            <span>Email:</span>
                          </span>
                          <span className="font-mono text-slate-300 truncate max-w-[160px]" title={p.user?.email || "N/A"}>
                            {p.user?.email || "N/A"}
                          </span>
                        </div>

                        {/* Requested Division */}
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Requested:</span>
                          <span className="font-bold text-sky-400 bg-sky-950/60 border border-sky-500/30 px-2 py-0.5 rounded-lg text-[11px]">
                            {p.division || "Division 1"}
                          </span>
                        </div>

                        {/* Registered On */}
                        <div className="flex items-center justify-between text-slate-500 text-[11px] pt-1 border-t border-slate-800/80">
                          <span>Registered:</span>
                          <span>{new Date(p.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                      </div>

                      {/* Division Selector & Capacity Warning */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-bold text-slate-300 uppercase">
                            Target Placement:
                          </label>
                          <span className={`text-[10px] font-mono font-bold ${isTargetFull ? "text-rose-400" : "text-emerald-400"}`}>
                            {targetActiveCount}/{targetMax} {isTargetFull ? "• FULL" : "• Slots Open"}
                          </span>
                        </div>
                        <select
                          value={currentSelection}
                          onChange={(e) =>
                            setPendingDivSelection((prev) => ({
                              ...prev,
                              [p.id]: e.target.value,
                            }))
                          }
                          className={`w-full bg-slate-900 border rounded-xl px-3 py-2 text-xs text-white font-medium focus:ring-1 focus:ring-sky-500 ${
                            isTargetFull ? "border-rose-500/50" : "border-slate-700"
                          }`}
                        >
                          <option value="Division 1">Division 1 (Premiership) [{activeDiv1Count}/{div1Max}]</option>
                          <option value="Division 2">Division 2 (Championship) [{activeDiv2Count}/{div2Max}]</option>
                          <option value="Division 3">Division 3 (Conference) [{activeDiv3Count}/{div3Max}]</option>
                        </select>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-3 border-t border-slate-800 space-y-2">
                      <Button
                        size="sm"
                        disabled={isLoading || isTargetFull}
                        onClick={() => handleApproveAthlete(p.id, "ADMIT")}
                        className={`w-full font-bold text-xs ${
                          isTargetFull
                            ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                            : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20"
                        }`}
                      >
                        <UserCheck className="h-4 w-4 mr-1.5" />
                        {isLoading
                          ? "Processing..."
                          : isTargetFull
                          ? `${currentSelection} is Full`
                          : `Admit to ${currentSelection}`}
                      </Button>

                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isLoading}
                          onClick={() => handleApproveAthlete(p.id, "RESERVE")}
                          className="border-amber-500/40 text-amber-400 hover:bg-amber-950/40 text-[11px] font-bold"
                        >
                          <Layers className="h-3.5 w-3.5 mr-1" />
                          Reserve Pool
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={isLoading}
                          onClick={() => handleRejectAthlete(p.id, p.gamerTag)}
                          className="text-[11px] font-bold bg-rose-600/80 hover:bg-rose-600"
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB: RESERVE POOL (STANDBY ATHLETES) */}
      {/* ========================================================================= */}
      {activeTab === "RESERVE_POOL" && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-sky-500/30 bg-sky-950/10 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-sky-400">
                <Layers className="h-5 w-5" />
                <h3 className="text-lg font-black uppercase text-white">League Reserve Pool (Standby Roster)</h3>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Reserve athletes have registered and are placed on standby. They have complete access to view all division standings and league news, but are not assigned fixtures until you admit them or use them to replace an inactive player.
              </p>
            </div>
            <Badge variant="secondary" className="text-xs px-3 py-1 font-mono">
              {reservePlayers.length} In Reserve
            </Badge>
          </div>

          {reservePlayers.length === 0 ? (
            <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-12 text-center">
              <Layers className="h-12 w-12 text-slate-600 mx-auto mb-3" />
              <h4 className="text-base font-bold text-white uppercase">Reserve Pool is Empty</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                No athletes are currently waiting in reserve. When excess athletes register, or when players are replaced and moved to reserve, they will appear here.
              </p>
            </div>
          ) : (
            <div className="rounded-3xl border border-slate-800 bg-slate-950/90 overflow-hidden shadow-xl">
              <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                <h3 className="text-lg font-black uppercase text-white">Standby Athletes</h3>
                <span className="text-xs font-mono text-slate-400">{reservePlayers.length} Total</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/80 text-[11px] font-black uppercase text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3">Gamer Tag</th>
                      <th className="px-4 py-3">Full Name</th>
                      <th className="px-4 py-3">eFootball ID</th>
                      <th className="px-4 py-3">WhatsApp</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Target Division</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {reservePlayers.map((p) => {
                      const currentSelection = pendingDivSelection[p.id] || p.division || "Division 1";
                      const isLoading = pendingActionLoading === p.id;
                      const cleanWa = p.whatsapp?.replace(/[^0-9]/g, "") || "";
                      const isCopied = copiedId === p.id;

                      const targetActiveCount =
                        currentSelection === "Division 1"
                          ? activeDiv1Count
                          : currentSelection === "Division 2"
                          ? activeDiv2Count
                          : activeDiv3Count;
                      const targetMax =
                        currentSelection === "Division 1"
                          ? div1Max
                          : currentSelection === "Division 2"
                          ? div2Max
                          : div3Max;
                      const isTargetFull = targetActiveCount >= targetMax;

                      return (
                        <tr key={p.id} className="hover:bg-slate-900/40">
                          <td className="px-4 py-3 font-bold text-white">{p.gamerTag}</td>
                          <td className="px-4 py-3 text-slate-300">{p.fullName}</td>
                          <td className="px-4 py-3 font-mono text-sky-300">
                            <div className="flex items-center gap-1">
                              <span>{p.efootballId || "N/A"}</span>
                              {p.efootballId && (
                                <button
                                  onClick={() => handleCopyKonamiId(p.id, p.efootballId)}
                                  title="Copy eFootball ID"
                                  className="text-slate-400 hover:text-white p-0.5"
                                >
                                  {isCopied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 font-mono">
                            {cleanWa ? (
                              <a
                                href={`https://wa.me/${cleanWa}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-emerald-400 font-semibold hover:underline flex items-center gap-1"
                              >
                                <span>{p.whatsapp}</span>
                                <ExternalLink className="h-2.5 w-2.5 opacity-60" />
                              </a>
                            ) : (
                              <span className="text-slate-400">{p.whatsapp}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 font-mono text-slate-400">{p.user?.email || "N/A"}</td>
                          <td className="px-4 py-3">
                            <select
                              value={currentSelection}
                              onChange={(e) =>
                                setPendingDivSelection((prev) => ({
                                  ...prev,
                                  [p.id]: e.target.value,
                                }))
                              }
                              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white"
                            >
                              <option value="Division 1">Division 1 [{activeDiv1Count}/{div1Max}]</option>
                              <option value="Division 2">Division 2 [{activeDiv2Count}/{div2Max}]</option>
                              <option value="Division 3">Division 3 [{activeDiv3Count}/{div3Max}]</option>
                            </select>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                disabled={isLoading || isTargetFull}
                                onClick={() => handleApproveAthlete(p.id, "ADMIT")}
                                className="h-7 px-3 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold"
                              >
                                <UserCheck className="h-3 w-3 mr-1" />
                                {isTargetFull ? "Full" : `Admit to ${currentSelection}`}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                disabled={isLoading}
                                onClick={() => handleRemoveAthlete(p.id, p.gamerTag)}
                                className="h-7 px-2 text-[11px] font-bold bg-rose-600/80 hover:bg-rose-600"
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                Remove
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ALL LEAGUE TABLES (DIVISION 1, 2, 3 + UCL & EUROPA) */}
      {/* ========================================================================= */}
      {activeTab === "TABLES" && (
        <div className="space-y-6">
          {/* Master Standings Update & Recalculate Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-emerald-500/40 bg-gradient-to-r from-emerald-950/40 via-slate-950 to-slate-950 shadow-xl">
            <div>
              <h3 className="text-base font-black uppercase text-white flex items-center gap-2">
                <Trophy className="h-5 w-5 text-emerald-400" />
                <span>One-Click Standings Synchronization</span>
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                Recalculates points, wins, draws, losses, goals, and rankings across all division tables simultaneously from all approved finished matches.
              </p>
            </div>
            <Button
              onClick={() => handleRecalculateStandings("ALL")}
              disabled={recalculatingStandings}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider px-5 py-2.5 shadow-lg shadow-emerald-600/30 shrink-0"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${recalculatingStandings ? "animate-spin" : ""}`} />
              {recalculatingStandings ? "Updating Tables..." : "⚡ Update League Table Standings"}
            </Button>
          </div>

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
          {tableSubTab === "DIV1" && renderStandingsTable("Division 1 Premiership Standings", div1Standings, "bg-sky-400", div1Max)}

          {/* Division 2 Table */}
          {tableSubTab === "DIV2" && renderStandingsTable("Division 2 Championship Standings", div2Standings, "bg-yellow-400", div2Max)}

          {/* Division 3 Table */}
          {tableSubTab === "DIV3" && renderStandingsTable("Division 3 Academy Standings", div3Standings, "bg-emerald-400", div3Max)}

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
      {/* TAB: ALL GENERATED MATCHES & TOURNAMENT RESET HUB */}
      {/* ========================================================================= */}
      {activeTab === "ALL_MATCHES" && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl border border-slate-800 bg-slate-950/90 shadow-2xl backdrop-blur-xl">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="yellow">SEASON FIXTURES HUB</Badge>
                <Badge variant="secondary">{matches.length} Total Matches Generated</Badge>
              </div>
              <h2 className="text-xl sm:text-2xl font-black uppercase text-white tracking-tight flex items-center gap-2">
                <Calendar className="h-6 w-6 text-cyan-400" />
                <span>All Generated Matches & Schedule Controls</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                Browse every fixture generated for the league. Reset generated matches, extend late submission deadlines, inspect score proofs, and trigger table updates.
              </p>
            </div>

            {/* Master Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <Button
                onClick={() => handleResetTournament("ALL")}
                disabled={resettingTournament}
                variant="destructive"
                className="font-black text-xs uppercase tracking-wider gap-2 shadow-lg shadow-rose-600/20"
              >
                <RotateCcw className={`h-4 w-4 ${resettingTournament ? "animate-spin" : ""}`} />
                {resettingTournament ? "Resetting Matches..." : "Reset All Generated Matches"}
              </Button>

              <Button
                onClick={() => handleRecalculateStandings("ALL")}
                disabled={recalculatingStandings}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider gap-2 shadow-lg shadow-emerald-600/30"
              >
                <RefreshCw className={`h-4 w-4 ${recalculatingStandings ? "animate-spin" : ""}`} />
                {recalculatingStandings ? "Updating..." : "⚡ Update League Table Standings"}
              </Button>
            </div>
          </div>

          {/* Quick Division Reset Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl border border-sky-500/30 bg-slate-950/80 space-y-2 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-sky-400">Division 1 Fixtures</span>
                  <Badge variant="secondary" className="text-[10px] font-mono">
                    {matches.filter((m: any) => m.division === "Division 1").length} Matches
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Premiership scheduled fixtures & standings.</p>
              </div>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleResetTournament("Division 1")}
                disabled={resettingTournament}
                className="w-full text-xs font-bold gap-1 mt-2"
              >
                <RotateCcw className="h-3 w-3" />
                Reset Division 1 Matches
              </Button>
            </div>

            <div className="p-4 rounded-2xl border border-yellow-500/30 bg-slate-950/80 space-y-2 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-yellow-400">Division 2 Fixtures</span>
                  <Badge variant="secondary" className="text-[10px] font-mono">
                    {matches.filter((m: any) => m.division === "Division 2").length} Matches
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Championship scheduled fixtures & standings.</p>
              </div>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleResetTournament("Division 2")}
                disabled={resettingTournament}
                className="w-full text-xs font-bold gap-1 mt-2"
              >
                <RotateCcw className="h-3 w-3" />
                Reset Division 2 Matches
              </Button>
            </div>

            <div className="p-4 rounded-2xl border border-emerald-500/30 bg-slate-950/80 space-y-2 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-emerald-400">Division 3 Fixtures</span>
                  <Badge variant="secondary" className="text-[10px] font-mono">
                    {matches.filter((m: any) => m.division === "Division 3").length} Matches
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">National Academy scheduled fixtures & standings.</p>
              </div>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleResetTournament("Division 3")}
                disabled={resettingTournament}
                className="w-full text-xs font-bold gap-1 mt-2"
              >
                <RotateCcw className="h-3 w-3" />
                Reset Division 3 Matches
              </Button>
            </div>
          </div>

          {/* Filtering & Search Toolbar */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-xl">
            <div className="flex flex-wrap items-center gap-2">
              {/* Round filter */}
              <select
                value={allMatchesFilterRound}
                onChange={(e) => setAllMatchesFilterRound(e.target.value)}
                className="bg-slate-900 border border-slate-800 text-xs font-bold text-white rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-500"
              >
                <option value="ALL">All Matchday Rounds</option>
                {Array.from(new Set(matches.map((m: any) => m.round)))
                  .filter(Boolean)
                  .map((r: any) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
              </select>

              {/* Division filter */}
              <select
                value={allMatchesFilterDiv}
                onChange={(e) => setAllMatchesFilterDiv(e.target.value)}
                className="bg-slate-900 border border-slate-800 text-xs font-bold text-white rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-500"
              >
                <option value="ALL">All Divisions</option>
                <option value="Division 1">Division 1</option>
                <option value="Division 2">Division 2</option>
                <option value="Division 3">Division 3</option>
                <option value="UCL">Champions League</option>
                <option value="EUROPA">Europa League</option>
              </select>

              {/* Status filter */}
              <select
                value={allMatchesFilterStatus}
                onChange={(e) => setAllMatchesFilterStatus(e.target.value)}
                className="bg-slate-900 border border-slate-800 text-xs font-bold text-white rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="LIVE">Live Window</option>
                <option value="FINISHED">Finished / Approved</option>
                <option value="FORFEIT">Forfeit Walkover</option>
              </select>
            </div>

            {/* Search Input */}
            <div className="relative min-w-[240px]">
              <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search athlete, WA, ID..."
                value={allMatchesSearch}
                onChange={(e) => setAllMatchesSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
              />
              {allMatchesSearch && (
                <button
                  onClick={() => setAllMatchesSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs font-bold"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {/* Filtered Matches Display */}
          {(() => {
            const filtered = matches.filter((m: any) => {
              const matchRound = allMatchesFilterRound === "ALL" || m.round === allMatchesFilterRound;
              const matchDiv = allMatchesFilterDiv === "ALL" || m.division === allMatchesFilterDiv;
              const matchStatus = allMatchesFilterStatus === "ALL" || m.status === allMatchesFilterStatus;

              const search = allMatchesSearch.trim().toLowerCase();
              const matchSearch =
                !search ||
                m.homePlayer?.gamerTag?.toLowerCase().includes(search) ||
                m.awayPlayer?.gamerTag?.toLowerCase().includes(search) ||
                m.homePlayer?.fullName?.toLowerCase().includes(search) ||
                m.awayPlayer?.fullName?.toLowerCase().includes(search) ||
                m.homePlayer?.efootballId?.toLowerCase().includes(search) ||
                m.awayPlayer?.efootballId?.toLowerCase().includes(search);

              return matchRound && matchDiv && matchStatus && matchSearch;
            });

            if (filtered.length === 0) {
              return (
                <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-12 text-center space-y-3">
                  <Calendar className="h-10 w-10 mx-auto text-slate-600" />
                  <p className="font-bold text-slate-300">No generated matches found matching your filters.</p>
                  <p className="text-xs text-slate-500">
                    If no matches have been generated yet, visit the Dashboard tab to run the Division Schedule Generator.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setAllMatchesFilterRound("ALL");
                      setAllMatchesFilterDiv("ALL");
                      setAllMatchesFilterStatus("ALL");
                      setAllMatchesSearch("");
                    }}
                    className="text-xs mt-2"
                  >
                    Reset Filters
                  </Button>
                </div>
              );
            }

            return (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                  <span>Showing <strong>{filtered.length}</strong> of {matches.length} fixtures</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filtered.map((m: any) => {
                    const isFinished = m.status === "FINISHED";
                    const isForfeit = m.status === "FORFEIT";
                    const sub = m.submissions?.[0];
                    const hasScreenshot = Boolean(m.screenshotUrl || sub?.screenshotUrl);
                    const screenshotToInspect = m.screenshotUrl || sub?.screenshotUrl;

                    return (
                      <div
                        key={m.id}
                        className="rounded-2xl border border-slate-800 bg-slate-950/90 p-5 space-y-4 shadow-xl hover:border-slate-700 transition"
                      >
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                          <div className="flex items-center gap-2">
                            <Badge variant="yellow" className="text-xs font-mono">
                              {m.round}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {m.division}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            {m.allowLateSubmission && (
                              <Badge variant="secondary" className="text-[10px] text-emerald-400 bg-emerald-950/30 border-emerald-500/30">
                                ⏰ LATE UPLOAD ON
                              </Badge>
                            )}
                            <Badge
                              variant={
                                isFinished
                                  ? "green"
                                  : isForfeit
                                  ? "destructive"
                                  : sub
                                  ? "yellow"
                                  : "secondary"
                              }
                              className="text-[10px]"
                            >
                              {isFinished
                                ? "FINISHED"
                                : isForfeit
                                ? "FORFEIT"
                                : sub
                                ? "PENDING REVIEW"
                                : m.status}
                            </Badge>
                          </div>
                        </div>

                        {/* Pairing & Score */}
                        <div className="grid grid-cols-12 gap-3 items-center text-center">
                          {/* Home Player */}
                          <div className="col-span-5 text-left space-y-0.5">
                            <span className="text-[10px] font-bold uppercase text-slate-500 block">HOME</span>
                            <span className="font-black text-white text-sm block truncate">
                              {m.homePlayer?.gamerTag}
                            </span>
                            <span className="text-[10px] text-slate-400 block font-mono">
                              {m.homePlayer?.efootballId || "No ID"}
                            </span>
                          </div>

                          {/* Score Box */}
                          <div className="col-span-2 flex flex-col items-center justify-center p-2 rounded-xl bg-slate-900 border border-slate-800">
                            {isFinished || isForfeit ? (
                              <span className="text-base font-black font-mono text-cyan-400">
                                {m.homeScore} - {m.awayScore}
                              </span>
                            ) : sub ? (
                              <div>
                                <span className="text-sm font-black font-mono text-amber-400">
                                  {sub.homeScore} - {sub.awayScore}
                                </span>
                                <span className="text-[8px] text-amber-400 uppercase block font-mono">Pending</span>
                              </div>
                            ) : (
                              <span className="text-xs font-black text-slate-500 font-mono">VS</span>
                            )}
                          </div>

                          {/* Away Player */}
                          <div className="col-span-5 text-right space-y-0.5">
                            <span className="text-[10px] font-bold uppercase text-slate-500 block">AWAY</span>
                            <span className="font-black text-white text-sm block truncate">
                              {m.awayPlayer?.gamerTag}
                            </span>
                            <span className="text-[10px] text-slate-400 block font-mono">
                              {m.awayPlayer?.efootballId || "No ID"}
                            </span>
                          </div>
                        </div>

                        {/* Deadline & Admin Controls */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-900 text-xs">
                          <span className="text-[11px] font-mono text-slate-400">
                            Deadline: {new Date(m.deadlineDate).toLocaleDateString()}
                          </span>

                          <div className="flex items-center gap-2">
                            {hasScreenshot && (
                              <button
                                type="button"
                                onClick={() => setInspectImage(screenshotToInspect)}
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-400 hover:text-sky-300 py-1 px-2 rounded-lg bg-slate-900 border border-slate-800"
                              >
                                <Eye className="h-3 w-3" />
                                Proof
                              </button>
                            )}

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleExtendDeadline(m.id)}
                              disabled={extendingMatchId === m.id}
                              className="text-[11px] h-7 px-2.5 font-bold border-cyan-500/40 text-cyan-300 hover:bg-cyan-950/30"
                            >
                              <Clock className="h-3 w-3 mr-1" />
                              Extend Deadline
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
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
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-4 gap-4">
            <div>
              <h3 className="text-lg font-black uppercase text-white tracking-wide">
                Match Results & Standings Update Hub
              </h3>
              <p className="text-xs text-slate-400">
                Insert match goals for all played games simultaneously. The league table recalculates once, and all users automatically receive an official standings update broadcast.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                onClick={() => handleRecalculateStandings("ALL")}
                disabled={recalculatingStandings}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider px-4 py-2 shadow-lg shadow-emerald-600/30"
              >
                <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${recalculatingStandings ? "animate-spin" : ""}`} />
                {recalculatingStandings ? "Updating Tables..." : "⚡ Update League Table Standings"}
              </Button>

              {/* Sub-tab Switcher */}
              <div className="flex items-center gap-2 bg-slate-900/90 p-1 rounded-xl border border-slate-800 self-start md:self-auto">
              <button
                type="button"
                onClick={() => setScoreQueueSubTab("SUBMISSIONS")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                  scoreQueueSubTab === "SUBMISSIONS"
                    ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <span>Proof Screenshots</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                    scoreQueueSubTab === "SUBMISSIONS"
                      ? "bg-slate-950 text-cyan-400"
                      : "bg-slate-800 text-slate-300"
                  }`}
                >
                  {pendingSubmissions.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setScoreQueueSubTab("DIRECT_ENTRY")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                  scoreQueueSubTab === "DIRECT_ENTRY"
                    ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <span>Direct Matchday Scoring</span>
                <Badge variant="live" className="text-[9px] px-1 py-0">BATCH</Badge>
              </button>
            </div>
          </div>
        </div>

          {/* SUB-TAB 1: PENDING PROOF SCREENSHOTS */}
          {scoreQueueSubTab === "SUBMISSIONS" && (
            <div className="space-y-6">
              {pendingSubmissions.length > 0 && (
                <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/40 via-slate-950 to-emerald-950/30 p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-cyan-400 animate-pulse" />
                      <span className="text-sm font-black text-white uppercase tracking-wider">
                        Simultaneous Batch Score Insertion ({pendingSubmissions.length} Pending)
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">
                      Verify goals in the cards below. Clicking this saves all played matches at once, recalculates all league tables in a single atomic update, and notifies all registered players.
                    </p>
                  </div>
                  <Button
                    disabled={batchLoading}
                    onClick={handleBatchApproveSubmissions}
                    className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black px-5 py-2.5 rounded-xl text-xs gap-2 shadow-lg shadow-emerald-500/20 whitespace-nowrap"
                  >
                    {batchLoading ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-slate-950" />
                    )}
                    Insert All {pendingSubmissions.length} Match Goals & Update Tables Once
                  </Button>
                </div>
              )}

              {pendingSubmissions.length === 0 ? (
                <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-12 text-center text-slate-500 space-y-3">
                  <CheckCircle2 className="h-10 w-10 mx-auto text-emerald-500" />
                  <p className="font-bold text-slate-300">Queue is clear! No pending match score screenshots to review.</p>
                  <p className="text-xs text-slate-500">
                    Switch to the "Direct Matchday Scoring" tab to enter goals for any matchday fixtures directly.
                  </p>
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
                              submissionScores[sub.id]?.home ?? sub.homeScore,
                              submissionScores[sub.id]?.away ?? sub.awayScore
                            )
                          }
                          className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs gap-1.5 shadow-lg shadow-cyan-500/20"
                        >
                          <CheckCircle2 className="h-4 w-4 text-slate-950" />
                          Approve Individually
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

          {/* SUB-TAB 2: DIRECT MATCHDAY GOALS ENTRY */}
          {scoreQueueSubTab === "DIRECT_ENTRY" && (
            <div className="space-y-6">
              {/* Filter and Master Action Header */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-5 space-y-4 shadow-xl">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <div>
                      <label className="text-[10px] font-mono font-bold text-slate-400 uppercase block mb-1">
                        Select Matchday Round
                      </label>
                      <select
                        value={selectedMatchdayRound}
                        onChange={(e) => setSelectedMatchdayRound(e.target.value)}
                        className="bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-cyan-500"
                      >
                        {Array.from(new Set(matches.map((m: any) => m.round)))
                          .filter(Boolean)
                          .map((r: any) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        {!matches.some((m: any) => m.round === `Matchday ${leagueConfig.currentMatchday}`) && (
                          <option value={`Matchday ${leagueConfig.currentMatchday}`}>
                            Matchday {leagueConfig.currentMatchday} (Current)
                          </option>
                        )}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-mono font-bold text-slate-400 uppercase block mb-1">
                        Filter Division
                      </label>
                      <select
                        value={selectedMatchDivision}
                        onChange={(e) => setSelectedMatchDivision(e.target.value)}
                        className="bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-cyan-500"
                      >
                        <option value="ALL">All Divisions</option>
                        <option value="Division 1">Division 1</option>
                        <option value="Division 2">Division 2</option>
                        <option value="Division 3">Division 3</option>
                        <option value="UCL">UCL</option>
                        <option value="Europa">Europa</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end lg:self-auto">
                    <Button
                      disabled={batchLoading}
                      onClick={handleBatchDirectMatchScores}
                      className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black px-6 py-2.5 rounded-xl text-xs gap-2 shadow-lg shadow-emerald-500/20"
                    >
                      {batchLoading ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4 text-slate-950" />
                      )}
                      Save Entered Goals, Update Table Once & Notify Users
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-3">
                  <span>
                    Type the goals scored by each player for their played match. You can fill multiple or all matches in this matchday and click the button above to apply them simultaneously.
                  </span>
                  <span className="font-mono text-cyan-400 font-bold shrink-0 ml-4">
                    {Object.keys(matchScores).filter((id) => matchScores[id]?.touched).length} matches edited
                  </span>
                </div>
              </div>

              {/* Match Fixtures List */}
              {(() => {
                const filteredMatches = matches.filter((m: any) => {
                  const matchesRound = !selectedMatchdayRound || m.round === selectedMatchdayRound;
                  const matchesDiv = selectedMatchDivision === "ALL" || m.division === selectedMatchDivision;
                  return matchesRound && matchesDiv;
                });

                if (filteredMatches.length === 0) {
                  return (
                    <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-12 text-center text-slate-500 space-y-3">
                      <Calendar className="h-10 w-10 mx-auto text-slate-600" />
                      <p className="font-bold text-slate-300">No matches found for {selectedMatchdayRound} ({selectedMatchDivision}).</p>
                      <p className="text-xs text-slate-500">Generate fixtures or select another matchday round above.</p>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredMatches.map((match: any) => {
                      const isEdited = matchScores[match.id]?.touched;
                      const currentHomeScore =
                        matchScores[match.id]?.home !== undefined
                          ? matchScores[match.id].home
                          : (match.homeScore ?? "");
                      const currentAwayScore =
                        matchScores[match.id]?.away !== undefined
                          ? matchScores[match.id].away
                          : (match.awayScore ?? "");

                      return (
                        <div
                          key={match.id}
                          className={`rounded-2xl border p-4 transition space-y-3 bg-slate-950/90 ${
                            isEdited
                              ? "border-emerald-500/60 shadow-lg shadow-emerald-500/10"
                              : "border-slate-800 hover:border-slate-700"
                          }`}
                        >
                          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-[10px] font-mono border-slate-700 text-slate-300">
                                {match.division}
                              </Badge>
                              <span className="text-[11px] font-mono text-slate-400">{match.round}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {match.status === "FINISHED" ? (
                                <Badge variant="live" className="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                  FINISHED ({match.homeScore} - {match.awayScore})
                                </Badge>
                              ) : (
                                <span className="text-[10px] font-mono text-amber-400 font-bold uppercase">
                                  {match.status}
                                </span>
                              )}
                              {isEdited && (
                                <span className="text-[10px] text-emerald-400 font-black tracking-wide">
                                  ● MODIFIED
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Home & Away Scoring Inputs */}
                          <div className="flex items-center justify-between gap-3 py-1">
                            {/* Home Side */}
                            <div className="flex-1 text-left space-y-1">
                              <span className="text-xs font-black text-white block truncate">
                                {match.homePlayer?.gamerTag || "Home Player"}
                              </span>
                              <span className="text-[10px] text-slate-500 block truncate">
                                {match.homePlayer?.whatsapp || ""}
                              </span>
                              <Input
                                type="number"
                                min="0"
                                max="40"
                                placeholder="Goals"
                                value={currentHomeScore}
                                onChange={(e) =>
                                  handleDirectMatchScoreChange(match.id, "home", Number(e.target.value))
                                }
                                className="h-9 text-center font-mono text-base font-black bg-slate-900 border-slate-700 text-cyan-300 focus:border-cyan-400"
                              />
                            </div>

                            {/* Divider / VS */}
                            <div className="flex flex-col items-center justify-center px-1 shrink-0 pt-4">
                              <span className="text-xs font-mono font-bold text-slate-500">VS</span>
                            </div>

                            {/* Away Side */}
                            <div className="flex-1 text-right space-y-1">
                              <span className="text-xs font-black text-white block truncate">
                                {match.awayPlayer?.gamerTag || "Away Player"}
                              </span>
                              <span className="text-[10px] text-slate-500 block truncate">
                                {match.awayPlayer?.whatsapp || ""}
                              </span>
                              <Input
                                type="number"
                                min="0"
                                max="40"
                                placeholder="Goals"
                                value={currentAwayScore}
                                onChange={(e) =>
                                  handleDirectMatchScoreChange(match.id, "away", Number(e.target.value))
                                }
                                className="h-9 text-center font-mono text-base font-black bg-slate-900 border-slate-700 text-cyan-300 focus:border-cyan-400"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
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
                      {playersList.map((p) => (
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
              <span className="text-xs font-mono text-slate-400">{playersList.length} Total</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 text-[11px] font-black uppercase text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Gamer Tag</th>
                    <th className="px-4 py-3">Full Name</th>
                    <th className="px-4 py-3">eFootball ID</th>
                    <th className="px-4 py-3">WhatsApp Number</th>
                    <th className="px-4 py-3">Division</th>
                    <th className="px-4 py-3 text-center">Missed</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {playersList.map((p) => (
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
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setReplaceTargetPlayer(p);
                              setRepGamerTag("");
                              setRepFullName("");
                              setRepWhatsapp(p.whatsapp || "");
                              setRepEmail("");
                              setRepPassword("");
                              setSelectedReserveId(reservePlayers[0]?.id || "");
                            }}
                            className="h-7 px-2 text-[11px] font-bold border-indigo-500/40 text-indigo-400 hover:bg-indigo-950/50 hover:text-indigo-300"
                          >
                            <Shuffle className="h-3 w-3 mr-1" />
                            Replace
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRemoveAthlete(p.id, p.gamerTag)}
                            className="h-7 px-2 text-[11px] font-bold bg-rose-600/80 hover:bg-rose-600 text-white"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Remove
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB: HALL OF FAME MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === "HALL_OF_FAME" && (
        <div className="space-y-8">
          <div className="rounded-3xl border border-yellow-500/30 bg-gradient-to-r from-yellow-950/20 to-amber-950/10 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-yellow-400">
                <Crown className="h-6 w-6" />
                <h3 className="text-xl font-black uppercase text-white tracking-wide">
                  EFRL Hall of Fame Commissioner Office
                </h3>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                Crown champions of Division 1, Division 2, Division 3, UCL, Europa League, and Kigali cups. Immortalized champions are showcased proudly on the League Homepage.
              </p>
            </div>
            <Badge variant="yellow" className="text-xs px-3 py-1 font-mono">
              {hallOfFame.length} Immortalized Champions
            </Badge>
          </div>

          {/* Add Champion Form */}
          <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-6 space-y-5 shadow-xl">
            <div className="flex items-center gap-2 text-yellow-400 border-b border-slate-800 pb-3">
              <Sparkles className="h-5 w-5" />
              <h4 className="text-sm font-black uppercase text-white">Crown New Champion</h4>
            </div>

            <form onSubmit={handleAddHallOfFame} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-slate-400">Tournament Name *</label>
                  <select
                    value={hofTournament}
                    onChange={(e) => setHofTournament(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2.5 text-xs text-white focus:ring-1 focus:ring-yellow-500"
                    required
                  >
                    <option value="EFRL Division 1 (Premiership)">EFRL Division 1 (Premiership)</option>
                    <option value="EFRL Division 2 (Championship)">EFRL Division 2 (Championship)</option>
                    <option value="EFRL Division 3 (Conference)">EFRL Division 3 (Conference)</option>
                    <option value="eFootball Rwanda Champions League (UCL)">eFootball Rwanda Champions League (UCL)</option>
                    <option value="EFRL Europa League">EFRL Europa League</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-slate-400">Season / Year *</label>
                  <Input
                    placeholder="e.g. Season 2026 or Season 1"
                    value={hofSeason}
                    onChange={(e) => setHofSeason(e.target.value)}
                    className="bg-slate-900 border-slate-800 text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-slate-400">Trophy Tier</label>
                  <select
                    value={hofTrophyType}
                    onChange={(e) => setHofTrophyType(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2.5 text-xs text-white focus:ring-1 focus:ring-yellow-500"
                  >
                    <option value="GOLD">Gold Cup / 1st Place</option>
                    <option value="SILVER">Silver Cup / Runner-up</option>
                    <option value="BRONZE">Bronze Cup / 3rd Place</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-yellow-400">Champion Gamer Tag *</label>
                  <Input
                    placeholder="e.g. RW_Sniper99"
                    value={hofChampion}
                    onChange={(e) => setHofChampion(e.target.value)}
                    className="bg-slate-900 border-yellow-500/30 text-xs font-bold text-white"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-slate-400">Champion Real Name</label>
                  <Input
                    placeholder="e.g. Jean-Claude Mugisha"
                    value={hofRealName}
                    onChange={(e) => setHofRealName(e.target.value)}
                    className="bg-slate-900 border-slate-800 text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  disabled={submittingHof || !hofChampion.trim()}
                  className="bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black text-xs px-6 py-2.5 shadow-lg shadow-yellow-500/20"
                >
                  <Crown className="h-4 w-4 mr-2" />
                  {submittingHof ? "Immortalizing..." : "Crown Champion & Add to Hall of Fame"}
                </Button>
              </div>
            </form>
          </div>

          {/* List of Hall of Fame Champions */}
          <div className="space-y-4">
            <h4 className="text-base font-black uppercase text-white flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-400" />
              Immortalized Champions Directory ({hallOfFame.length})
            </h4>

            {hallOfFame.length === 0 ? (
              <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-12 text-center">
                <Crown className="h-12 w-12 text-yellow-500/40 mx-auto mb-3" />
                <h5 className="text-sm font-bold text-white uppercase">No Champions Crowned Yet</h5>
                <p className="text-xs text-slate-400 mt-1">Use the form above to add your first league title winner!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {hallOfFame.map((entry) => (
                  <div
                    key={entry.id}
                    className="relative overflow-hidden rounded-2xl border border-yellow-500/20 bg-slate-950/90 p-5 space-y-4 hover:border-yellow-500/40 transition-all shadow-xl flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <Badge variant="yellow" className="text-[10px] uppercase tracking-wider mb-1">
                            {entry.season}
                          </Badge>
                          <h5 className="text-xs font-bold text-slate-300">{entry.tournamentName}</h5>
                        </div>
                        <div className="h-9 w-9 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center shrink-0">
                          <Crown className="h-5 w-5 text-yellow-400" />
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-900/90 border border-yellow-500/10 space-y-1">
                        <span className="text-[10px] font-mono uppercase text-yellow-400 font-bold block">
                          Champion
                        </span>
                        <div className="text-lg font-black text-white">{entry.championName}</div>
                        {entry.championRealName && (
                          <div className="text-xs text-slate-300 font-medium">{entry.championRealName}</div>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-mono">
                        {new Date(entry.createdAt).toLocaleDateString()}
                      </span>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteHallOfFame(entry.id, entry.championName)}
                        className="h-7 px-2.5 text-[11px] font-bold bg-rose-600/80 hover:bg-rose-600"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB: PLAYER SUPPORT & DIRECT MESSAGES */}
      {/* ========================================================================= */}
      {activeTab === "MESSAGES" && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-indigo-500/30 bg-indigo-950/10 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-indigo-400">
                <MessageSquare className="h-5 w-5" />
                <h3 className="text-lg font-black uppercase text-white">Player Support & Direct Inquiries Desk</h3>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Direct inquiries submitted by athletes from their dashboard. Write official commissioner responses which appear immediately in the athlete&apos;s conversation thread and trigger a direct announcement to their portal.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs px-3 py-1 font-mono">
                {playerMessages.length} Total Messages
              </Badge>
              {playerMessages.filter((m) => m.status === "PENDING").length > 0 && (
                <Badge variant="destructive" className="text-xs px-3 py-1 font-mono animate-pulse">
                  {playerMessages.filter((m) => m.status === "PENDING").length} Pending Reply
                </Badge>
              )}
            </div>
          </div>

          {playerMessages.length === 0 ? (
            <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-12 text-center space-y-2">
              <MessageSquare className="h-12 w-12 text-slate-600 mx-auto mb-2" />
              <h4 className="text-base font-bold text-white uppercase">No Player Inquiries Yet</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                When athletes write direct messages to the league administrators from their personal dashboards, they will appear here for you to interact and reply.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {playerMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`rounded-3xl border p-6 space-y-4 backdrop-blur-xl transition-all shadow-xl ${
                    msg.status === "PENDING"
                      ? "border-amber-500/50 bg-gradient-to-r from-amber-950/20 via-slate-900/90 to-slate-950/90 ring-1 ring-amber-500/20"
                      : "border-slate-800 bg-slate-950/80"
                  }`}
                >
                  {/* Athlete & Message Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-sky-600 text-white font-black text-sm flex items-center justify-center shrink-0">
                        {msg.player?.gamerTag?.slice(0, 2).toUpperCase() || "PL"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-black text-white">{msg.player?.gamerTag}</h4>
                          <Badge variant="secondary" className="text-[10px]">
                            {msg.player?.division}
                          </Badge>
                          <Badge
                            variant={msg.status === "REPLIED" ? "green" : "yellow"}
                            className="text-[10px] font-bold"
                          >
                            {msg.status === "REPLIED" ? "REPLIED" : "PENDING REPLY"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                          <span>{msg.player?.fullName}</span>
                          {msg.player?.whatsapp && (
                            <a
                              href={`https://wa.me/${msg.player.whatsapp.replace(/[^0-9]/g, "")}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-emerald-400 hover:underline flex items-center gap-1 font-mono"
                            >
                              <MessageSquare className="h-3 w-3" />
                              <span>{msg.player.whatsapp}</span>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    <span className="text-[11px] font-mono text-slate-500 self-start sm:self-auto">
                      Received: {new Date(msg.createdAt).toLocaleString()}
                    </span>
                  </div>

                  {/* Subject and Content */}
                  <div className="space-y-2 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4">
                    <span className="text-[10px] font-bold uppercase text-sky-400 tracking-wider block">
                      Topic / Subject:
                    </span>
                    <h5 className="text-sm font-bold text-white">{msg.subject}</h5>
                    <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap pt-1 border-t border-slate-800/50">
                      {msg.content}
                    </p>
                  </div>

                  {/* Existing Admin Reply */}
                  {msg.adminReply && replyingMessageId !== msg.id && (
                    <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/20 p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="green" className="text-[9px] font-black uppercase">
                            YOUR OFFICIAL REPLY SENT
                          </Badge>
                          {msg.repliedAt && (
                            <span className="text-[10px] font-mono text-emerald-400/70">
                              {new Date(msg.repliedAt).toLocaleString()}
                            </span>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setReplyingMessageId(msg.id);
                            setReplyText(msg.adminReply || "");
                          }}
                          className="h-6 text-[11px] text-emerald-400 hover:text-white"
                        >
                          Edit Reply
                        </Button>
                      </div>
                      <p className="text-xs text-emerald-200 leading-relaxed whitespace-pre-wrap">
                        {msg.adminReply}
                      </p>
                    </div>
                  )}

                  {/* Reply Input Form */}
                  {replyingMessageId === msg.id ? (
                    <div className="rounded-2xl border border-indigo-500/40 bg-slate-900 p-4 space-y-3">
                      <label className="text-xs font-bold uppercase text-indigo-400 block">
                        Write Official Reply to {msg.player?.gamerTag}:
                      </label>
                      <textarea
                        rows={3}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Type official response from the League Commissioner..."
                        className="w-full rounded-xl bg-slate-950 border border-slate-800 p-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                        required
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setReplyingMessageId(null);
                            setReplyText("");
                          }}
                          className="text-xs"
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          disabled={submittingReply || !replyText.trim()}
                          onClick={() => handleReplyToMessage(msg.id)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                        >
                          {submittingReply ? "Sending..." : "Submit Reply to Athlete"}
                        </Button>
                      </div>
                    </div>
                  ) : !msg.adminReply ? (
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        onClick={() => {
                          setReplyingMessageId(msg.id);
                          setReplyText("");
                        }}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
                      >
                        <Send className="h-3.5 w-3.5 mr-1.5" />
                        <span>Reply to Athlete</span>
                      </Button>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB: ALL GENERATED MATCHES */}
      {/* ========================================================================= */}
      {activeTab === "ALL_MATCHES" && (
        <div className="space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 rounded-3xl border border-slate-800 bg-slate-950/90 shadow-2xl backdrop-blur-xl">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="yellow">FULL TOURNAMENT SCHEDULE</Badge>
                <Badge variant="secondary">{matches.length} Total Matches</Badge>
              </div>
              <h2 className="text-xl sm:text-2xl font-black uppercase text-white tracking-tight flex items-center gap-2">
                <Calendar className="h-6 w-6 text-cyan-400" />
                <span>All Generated Tournament Matches</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                Browse, search, and manage all scheduled and finished matches across all matchday rounds and divisions. You can extend deadlines to permit late submissions or directly enter verified scores.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <Button
                onClick={() => handleRecalculateStandings("ALL")}
                disabled={recalculatingStandings}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider px-4 py-2.5 shadow-lg shadow-emerald-600/30"
              >
                <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${recalculatingStandings ? "animate-spin" : ""}`} />
                {recalculatingStandings ? "Updating..." : "⚡ Update Standings"}
              </Button>

              <Button
                onClick={() => handleResetTournament("ALL")}
                disabled={resettingTournament}
                variant="destructive"
                className="font-bold text-xs uppercase tracking-wider px-4 py-2.5 gap-1.5 shadow-lg shadow-rose-600/20"
              >
                <RotateCcw className={`h-3.5 w-3.5 ${resettingTournament ? "animate-spin" : ""}`} />
                {resettingTournament ? "Resetting..." : "Reset All Matches"}
              </Button>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 shadow-xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <Input
                  placeholder="Search player or Konami ID..."
                  value={allMatchesSearch}
                  onChange={(e) => setAllMatchesSearch(e.target.value)}
                  className="pl-9 bg-slate-900 border-slate-700 text-xs text-white"
                />
              </div>

              {/* Round Filter */}
              <div>
                <select
                  value={allMatchesFilterRound}
                  onChange={(e) => setAllMatchesFilterRound(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="ALL">All Matchday Rounds</option>
                  {Array.from(new Set(matches.map((m: any) => m.round)))
                    .filter(Boolean)
                    .sort((a: any, b: any) => {
                      const numA = parseInt(a.replace(/\D/g, "") || "0", 10);
                      const numB = parseInt(b.replace(/\D/g, "") || "0", 10);
                      return numA - numB;
                    })
                    .map((r: any) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                </select>
              </div>

              {/* Division Filter */}
              <div>
                <select
                  value={allMatchesFilterDiv}
                  onChange={(e) => setAllMatchesFilterDiv(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="ALL">All Divisions</option>
                  <option value="Division 1">Division 1 (Premiership)</option>
                  <option value="Division 2">Division 2 (Championship)</option>
                  <option value="Division 3">Division 3 (Academy)</option>
                  <option value="UCL">UCL</option>
                  <option value="Europa">Europa</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <select
                  value={allMatchesFilterStatus}
                  onChange={(e) => setAllMatchesFilterStatus(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="ALL">All Match Statuses</option>
                  <option value="SCHEDULED">SCHEDULED (Unplayed)</option>
                  <option value="FINISHED">FINISHED (Played & Verified)</option>
                  <option value="FORFEIT">FORFEIT (Walkover)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Matches List */}
          {(() => {
            const filtered = matches.filter((m: any) => {
              const matchesRound = allMatchesFilterRound === "ALL" || m.round === allMatchesFilterRound;
              const matchesDiv = allMatchesFilterDiv === "ALL" || m.division === allMatchesFilterDiv;
              const matchesStatus = allMatchesFilterStatus === "ALL" || m.status === allMatchesFilterStatus;
              const q = allMatchesSearch.trim().toLowerCase();
              const matchesSearch =
                !q ||
                m.homePlayer?.gamerTag?.toLowerCase().includes(q) ||
                m.awayPlayer?.gamerTag?.toLowerCase().includes(q) ||
                m.homePlayer?.efootballId?.toLowerCase().includes(q) ||
                m.awayPlayer?.efootballId?.toLowerCase().includes(q);
              return matchesRound && matchesDiv && matchesStatus && matchesSearch;
            });

            if (filtered.length === 0) {
              return (
                <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-12 text-center space-y-3">
                  <Calendar className="h-12 w-12 text-slate-600 mx-auto" />
                  <h4 className="text-base font-bold text-white uppercase">No Matches Found</h4>
                  <p className="text-xs text-slate-400">
                    No tournament fixtures match your current filter criteria.
                  </p>
                </div>
              );
            }

            return (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400 px-2 font-mono">
                  <span>Showing {filtered.length} of {matches.length} matches</span>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {filtered.map((match: any) => {
                    const isFinished = match.status === "FINISHED";
                    const isForfeit = match.status === "FORFEIT";
                    const isLateAllowed = match.allowLateSubmission;
                    const cleanDeadline = new Date(match.deadlineDate).toLocaleString();

                    return (
                      <div
                        key={match.id}
                        className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 sm:p-5 hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="yellow" className="text-[10px] font-mono">
                              {match.round}
                            </Badge>
                            <Badge variant="secondary" className="text-[10px]">
                              {match.division}
                            </Badge>
                            {isFinished ? (
                              <Badge variant="green" className="text-[10px] font-black">
                                COMPLETED
                              </Badge>
                            ) : isForfeit ? (
                              <Badge variant="destructive" className="text-[10px] font-black">
                                FORFEIT
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px] border-sky-500/40 text-sky-400">
                                SCHEDULED
                              </Badge>
                            )}
                            {isLateAllowed && (
                              <Badge variant="yellow" className="text-[9px] bg-amber-500/20 border-amber-500/40 text-amber-300">
                                ⏰ LATE UPLOAD ALLOWED
                              </Badge>
                            )}
                          </div>

                          {/* Teams and Scores */}
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <span className="font-bold text-sm text-white block">{match.homePlayer?.gamerTag}</span>
                              <span className="text-[10px] text-slate-400 block font-mono">{match.homePlayer?.efootballId}</span>
                            </div>

                            <div className="px-3 py-1 rounded-xl bg-slate-900 border border-slate-700 text-center min-w-[70px]">
                              {isFinished || isForfeit ? (
                                <span className="font-mono text-base font-black text-cyan-400">
                                  {match.homeScore ?? 0} - {match.awayScore ?? 0}
                                </span>
                              ) : (
                                <span className="text-xs font-black text-slate-500">VS</span>
                              )}
                            </div>

                            <div>
                              <span className="font-bold text-sm text-white block">{match.awayPlayer?.gamerTag}</span>
                              <span className="text-[10px] text-slate-400 block font-mono">{match.awayPlayer?.efootballId}</span>
                            </div>
                          </div>
                        </div>

                        {/* Match Info & Actions */}
                        <div className="flex flex-wrap items-center gap-2 self-end md:self-auto">
                          <div className="text-right mr-2 hidden lg:block">
                            <span className="text-[10px] text-slate-500 block font-mono">Deadline</span>
                            <span className="text-xs text-slate-300 font-mono">{cleanDeadline}</span>
                          </div>

                          {match.screenshotUrl && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setInspectImage(match.screenshotUrl)}
                              className="text-xs gap-1 h-8"
                            >
                              <Eye className="h-3.5 w-3.5 text-sky-400" />
                              <span>Screenshot</span>
                            </Button>
                          )}

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleExtendDeadline(match.id, 24)}
                            disabled={extendingMatchId === match.id}
                            className="text-xs gap-1 h-8 border-amber-500/40 text-amber-300 hover:bg-amber-950/20"
                            title="Extend deadline and permit player to upload scores"
                          >
                            <Clock className="h-3.5 w-3.5 text-amber-400" />
                            <span>{extendingMatchId === match.id ? "Extending..." : "Extend Deadline"}</span>
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB: RATINGS & USER REVIEWS */}
      {/* ========================================================================= */}
      {activeTab === "REVIEWS" && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl border border-slate-800 bg-slate-950/90 shadow-2xl backdrop-blur-xl">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="yellow">COMMUNITY FEEDBACK</Badge>
                <Badge variant="secondary">{reviewsList.length} Total Reviews</Badge>
              </div>
              <h2 className="text-xl sm:text-2xl font-black uppercase text-white tracking-tight flex items-center gap-2">
                <Star className="h-6 w-6 text-amber-400" />
                <span>Player Ratings & Feedback Reviews</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Read direct player feedback, ratings, and league satisfaction reviews submitted from player dashboards.
              </p>
            </div>
          </div>

          {/* Rating Summary Card */}
          {(() => {
            const total = reviewsList.length;
            const sum = reviewsList.reduce((acc: number, r: any) => acc + (r.rating || 5), 0);
            const avg = total > 0 ? (sum / total).toFixed(1) : "5.0";
            const stars = [5, 4, 3, 2, 1];

            return (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center rounded-3xl border border-slate-800 bg-slate-950/80 p-6 shadow-xl">
                <div className="lg:col-span-4 flex flex-col items-center justify-center text-center p-4 border-b lg:border-b-0 lg:border-r border-slate-800">
                  <div className="text-5xl font-black text-white">{avg}</div>
                  <div className="flex items-center gap-1 my-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`h-5 w-5 ${
                          s <= Math.round(Number(avg))
                            ? "text-amber-400 fill-amber-400"
                            : "text-slate-600"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-slate-400 font-mono">Based on {total} athlete ratings</span>
                </div>

                <div className="lg:col-span-8 space-y-2 px-2">
                  {stars.map((star) => {
                    const count = reviewsList.filter((r: any) => r.rating === star).length;
                    const percent = total > 0 ? Math.round((count / total) * 100) : 0;
                    return (
                      <div key={star} className="flex items-center gap-3 text-xs">
                        <span className="w-12 font-bold text-slate-300 flex items-center gap-1">
                          <span>{star}</span>
                          <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                        </span>
                        <div className="flex-1 h-2.5 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
                          <div
                            className="h-full bg-amber-400 rounded-full transition-all"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="w-12 text-right font-mono text-slate-400">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* Reviews List */}
          {reviewsList.length === 0 ? (
            <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-12 text-center space-y-2">
              <Star className="h-12 w-12 text-slate-600 mx-auto mb-2" />
              <h4 className="text-base font-bold text-white uppercase">No Player Reviews Submitted Yet</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                When participating athletes submit ratings and reviews from their dashboard, they will be visible here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reviewsList.map((rev: any) => (
                <div
                  key={rev.id}
                  className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5 space-y-3 hover:border-slate-700 transition-all shadow-lg"
                >
                  <div className="flex items-start justify-between gap-2 border-b border-slate-800/80 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 text-slate-950 font-black text-sm flex items-center justify-center shrink-0">
                        {rev.player?.gamerTag?.slice(0, 2).toUpperCase() || "PL"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-white">{rev.player?.gamerTag}</h4>
                          <Badge variant="secondary" className="text-[10px]">
                            {rev.player?.division}
                          </Badge>
                        </div>
                        <span className="text-[11px] text-slate-400">{rev.player?.fullName}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`h-3.5 w-3.5 ${
                            s <= rev.rating
                              ? "text-amber-400 fill-amber-400"
                              : "text-slate-700"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-bold uppercase text-sky-400 tracking-wider">
                      Category: {rev.category || "GENERAL"}
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                      &quot;{rev.comment}&quot;
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-900 text-right">
                    <span className="text-[10px] font-mono text-slate-500">
                      {new Date(rev.createdAt).toLocaleDateString()} {new Date(rev.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* REPLACE ATHLETE MODAL */}
      {replaceTargetPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4">
          <div className="relative max-w-xl w-full max-h-[90vh] overflow-y-auto rounded-3xl border border-indigo-500/40 bg-slate-950 p-4 sm:p-6 space-y-5 shadow-2xl no-scrollbar">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2 text-indigo-400">
                  <Shuffle className="h-5 w-5" />
                  <h3 className="text-lg font-black uppercase text-white">Replace Active Athlete</h3>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Replacing <strong className="text-white">{replaceTargetPlayer.gamerTag}</strong> ({replaceTargetPlayer.division})
                </p>
              </div>
              <button
                onClick={() => setReplaceTargetPlayer(null)}
                className="rounded-full bg-slate-900 p-1.5 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleReplaceAthleteSubmit} className="space-y-4">
              {/* Replacement Source Mode Tabs */}
              <div className="grid grid-cols-2 gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setReplaceMode("FROM_RESERVE")}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${
                    replaceMode === "FROM_RESERVE"
                      ? "bg-indigo-600 text-white shadow-md"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  From Reserve Pool ({reservePlayers.length})
                </button>
                <button
                  type="button"
                  onClick={() => setReplaceMode("NEW_DETAILS")}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${
                    replaceMode === "NEW_DETAILS"
                      ? "bg-indigo-600 text-white shadow-md"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Register New Athlete
                </button>
              </div>

              {replaceMode === "FROM_RESERVE" ? (
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-slate-400">
                    Select Replacement from Reserve Pool *
                  </label>
                  {reservePlayers.length === 0 ? (
                    <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 text-xs text-amber-300">
                      No athletes currently in the reserve pool. Switch to &quot;Register New Athlete&quot; instead.
                    </div>
                  ) : (
                    <select
                      value={selectedReserveId}
                      onChange={(e) => setSelectedReserveId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white font-medium focus:ring-1 focus:ring-indigo-500"
                      required
                    >
                      <option value="">-- Choose Reserve Athlete --</option>
                      {reservePlayers.map((rp) => (
                        <option key={rp.id} value={rp.id}>
                          {rp.gamerTag} ({rp.fullName}) — WA: {rp.whatsapp}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase text-slate-400">New Gamer Tag *</label>
                      <Input
                        placeholder="e.g. RW_Champion"
                        value={repGamerTag}
                        onChange={(e) => setRepGamerTag(e.target.value)}
                        className="bg-slate-900 border-slate-800 text-xs"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase text-slate-400">Full Name *</label>
                      <Input
                        placeholder="e.g. Jean Paul"
                        value={repFullName}
                        onChange={(e) => setRepFullName(e.target.value)}
                        className="bg-slate-900 border-slate-800 text-xs"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase text-slate-400">WhatsApp Number</label>
                      <Input
                        placeholder="e.g. +250 788 000 000"
                        value={repWhatsapp}
                        onChange={(e) => setRepWhatsapp(e.target.value)}
                        className="bg-slate-900 border-slate-800 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase text-slate-400">Login Email (Optional)</label>
                      <Input
                        type="email"
                        placeholder="New login email"
                        value={repEmail}
                        onChange={(e) => setRepEmail(e.target.value)}
                        className="bg-slate-900 border-slate-800 text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-slate-400">Login Password (Optional)</label>
                    <Input
                      type="password"
                      placeholder="Minimum 6 characters"
                      value={repPassword}
                      onChange={(e) => setRepPassword(e.target.value)}
                      className="bg-slate-900 border-slate-800 text-xs"
                    />
                  </div>
                </div>
              )}

              {/* Action on replaced athlete */}
              <div className="space-y-1.5 pt-2 border-t border-slate-800">
                <label className="text-xs font-bold uppercase text-slate-400">
                  Outgoing Athlete Disposition:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label
                    className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer text-xs ${
                      outgoingAction === "REMOVE"
                        ? "border-rose-500 bg-rose-950/20 text-white font-bold"
                        : "border-slate-800 bg-slate-900 text-slate-400"
                    }`}
                  >
                    <input
                      type="radio"
                      name="outgoingAction"
                      value="REMOVE"
                      checked={outgoingAction === "REMOVE"}
                      onChange={() => setOutgoingAction("REMOVE")}
                      className="text-rose-600"
                    />
                    <span>Delete Account Permanently</span>
                  </label>
                  <label
                    className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer text-xs ${
                      outgoingAction === "MOVE_TO_RESERVE"
                        ? "border-amber-500 bg-amber-950/20 text-white font-bold"
                        : "border-slate-800 bg-slate-900 text-slate-400"
                    }`}
                  >
                    <input
                      type="radio"
                      name="outgoingAction"
                      value="MOVE_TO_RESERVE"
                      checked={outgoingAction === "MOVE_TO_RESERVE"}
                      onChange={() => setOutgoingAction("MOVE_TO_RESERVE")}
                      className="text-amber-500"
                    />
                    <span>Move to Reserve Pool</span>
                  </label>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-indigo-950/20 border border-indigo-500/20 text-[11px] text-indigo-300">
                💡 <strong>Automatic Cascading:</strong> All existing match fixtures, standings points, and UCL/Europa slots associated with this athlete slot will automatically update to display the new athlete&apos;s name immediately.
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setReplaceTargetPlayer(null)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={replaceLoading}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
                >
                  <Shuffle className="h-4 w-4 mr-1.5" />
                  {replaceLoading ? "Replacing..." : "Confirm Athlete Replacement"}
                </Button>
              </div>
            </form>
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
