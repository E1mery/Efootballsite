"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Bell,
  Upload,
  ShieldAlert,
  ShieldCheck,
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
  ArrowDown,
  UserPlus,
  RotateCcw,
  Star,
  KeyRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getTeamsForDivision, resolvePlayerAvatar, findTeam } from "@/lib/teams";
import ContinentalDrawExperience from "@/components/ContinentalDrawExperience";

function toLocalDatetimeInput(dateInput: Date | string | null | undefined): string {
  if (!dateInput) return "";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

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
  initialPasswordResets = [],
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
  initialPasswordResets?: any[];
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
    | "REVIEWS"
    | "PASSWORD_RESETS";

  const [activeTab, setActiveTab] = useState<TabType>("DASHBOARD");
  const [tableSubTab, setTableSubTab] = useState<"DIV1" | "DIV2" | "DIV3" | "UCL" | "EUROPA">("DIV1");

  // Dynamic Lists State
  const [pendingPlayers, setPendingPlayers] = useState<any[]>(initialPendingPlayers);
  const [reservePlayers, setReservePlayers] = useState<any[]>(initialReservePlayers);
  const [hallOfFame, setHallOfFame] = useState<any[]>(initialHallOfFame);
  const [playersList, setPlayersList] = useState<any[]>(allPlayers);
  const [playerMessages, setPlayerMessages] = useState<any[]>(initialPlayerMessages);
  const [reviewsList, setReviewsList] = useState<any[]>(initialReviews);
  const [passwordResets, setPasswordResets] = useState<any[]>(initialPasswordResets);

  // New admin operations state
  const [recalculatingStandings, setRecalculatingStandings] = useState(false);
  const [resettingTournament, setResettingTournament] = useState(false);
  const [resettingTeams, setResettingTeams] = useState(false);
  const [auditingTeams, setAuditingTeams] = useState(false);
  const [extendingMatchId, setExtendingMatchId] = useState<string | null>(null);
  const [reopeningMatchId, setReopeningMatchId] = useState<string | null>(null);
  const [uclDrawInput, setUclDrawInput] = useState<string>(
    toLocalDatetimeInput(leagueConfig?.uclDrawTime)
  );
  const [europaDrawInput, setEuropaDrawInput] = useState<string>(
    toLocalDatetimeInput(leagueConfig?.europaDrawTime)
  );

  // Club Assignment / Edit State
  const [editingClubPlayer, setEditingClubPlayer] = useState<any | null>(null);
  const [selectedClubName, setSelectedClubName] = useState<string>("");
  const [updatingClub, setUpdatingClub] = useState(false);

  // Division Assignment / Edit State
  const [editingDivisionPlayer, setEditingDivisionPlayer] = useState<any | null>(null);
  const [selectedTargetDivision, setSelectedTargetDivision] = useState<string>("Division 1");
  const [updatingDivision, setUpdatingDivision] = useState(false);

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

  // Password resets search & filters & actions
  const [resetSearch, setResetSearch] = useState("");
  const [resetStatusFilter, setResetStatusFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "COMPLETED">("ALL");
  const [resetActionLoading, setResetActionLoading] = useState<string | null>(null);

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

  useEffect(() => {
    setPasswordResets(initialPasswordResets);
  }, [initialPasswordResets]);

  // Direct Inquiries & Reply State
  const [replyingMessageId, setReplyingMessageId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);
  const [inquiriesSubTab, setInquiriesSubTab] = useState<"PENDING" | "HISTORY" | "ALL">("PENDING");
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null);

  // Dynamic current time ticker to ensure 24h message history auto-deletion updates live
  const [messagesNow, setMessagesNow] = useState<number>(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setMessagesNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  // Filter out any replied messages whose 24-hour retention window has expired
  const activePlayerMessages = useMemo(() => {
    const cutoff24h = messagesNow - 24 * 60 * 60 * 1000;
    return playerMessages.filter((m) => {
      if (m.status === "REPLIED" || m.adminReply) {
        const timeRef = m.repliedAt || m.updatedAt;
        if (timeRef && new Date(timeRef).getTime() <= cutoff24h) {
          return false;
        }
      }
      return true;
    });
  }, [playerMessages, messagesNow]);

  const pendingMessages = useMemo(() => {
    return activePlayerMessages.filter((m) => m.status === "PENDING" && !m.adminReply);
  }, [activePlayerMessages]);

  const historyMessages = useMemo(() => {
    return activePlayerMessages.filter((m) => m.status === "REPLIED" || !!m.adminReply);
  }, [activePlayerMessages]);

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

  // Filtered password reset requests based on status filter and search query
  const filteredPasswordResets = passwordResets.filter((r) => {
    if (resetStatusFilter !== "ALL" && r.status !== resetStatusFilter) {
      return false;
    }
    if (resetSearch.trim()) {
      const q = resetSearch.toLowerCase().trim();
      const matchEmail = r.email?.toLowerCase().includes(q);
      const matchTag = r.player?.gamerTag?.toLowerCase().includes(q);
      const matchName = r.player?.fullName?.toLowerCase().includes(q);
      const matchWa = r.player?.whatsapp?.toLowerCase().includes(q);
      const matchDiv = r.player?.division?.toLowerCase().includes(q);
      return Boolean(matchEmail || matchTag || matchName || matchWa || matchDiv);
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

  // Fixed Kickoff date for schedule generator (Midnight 12:00 AM)
  const [leagueStartDate, setLeagueStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  });

  // Generate Scheduled Round Robin Matches
  const handleGenerateSchedule = async (division: string) => {
    const confirmMsg =
      division === "ALL"
        ? `Generate single-leg round-robin fixtures (1 leg only, 1 match per pairing, starting on ${leagueStartDate} at 12:00 AM midnight) for ALL divisions?`
        : `Generate single-leg round-robin fixtures (1 leg only, 1 match per pairing, starting on ${leagueStartDate} at 12:00 AM midnight) for ${division}?`;
    if (!confirm(confirmMsg)) return;

    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/generate-schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ division, startDate: leagueStartDate }),
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

  // Reset Real Teams & Avatars for Players
  const handleResetRealTeams = async (division: string = "ALL") => {
    if (
      !confirm(
        `Are you sure you want to reset real football team choices and avatars for ${
          division === "ALL" ? "ALL registered players across the entire league" : division
        }? All affected players will have their chosen club cleared and will start selecting fresh.`
      )
    ) {
      return;
    }

    setResettingTeams(true);
    try {
      const res = await fetch("/api/admin/teams/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ division }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reset real football teams");
      alert(data.message);
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setResettingTeams(false);
    }
  };

  // Audit and verify player club assignments against division
  const handleAuditTeams = async () => {
    setAuditingTeams(true);
    try {
      const res = await fetch("/api/admin/teams/audit");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to audit team assignments");

      if (data.mismatchedCount === 0) {
        alert(
          `✅ Perfect Alignment!\nAll ${data.validCount} assigned clubs correctly match their respective division:\n` +
          `• Division 1: Premier League\n` +
          `• Division 2: La Liga\n` +
          `• Division 3: Serie A\n\nNo mismatches found!`
        );
        return;
      }

      const listStr = data.mismatches
        .slice(0, 10)
        .map(
          (m: any) =>
            `• ${m.gamerTag} (${m.playerDivision}) -> ${m.currentTeam} (${m.teamDivision} / ${m.teamLeague})`
        )
        .join("\n");

      const overflowMsg = data.mismatches.length > 10 ? `\n...and ${data.mismatches.length - 10} more` : "";

      const confirmFix = confirm(
        `⚠️ Found ${data.mismatchedCount} mismatched club assignment(s):\n\n${listStr}${overflowMsg}\n\nWould you like to automatically clear these mismatched club assignments so affected players can select valid clubs from their correct division?`
      );

      if (confirmFix) {
        const fixRes = await fetch("/api/admin/teams/audit?fix=true");
        const fixData = await fixRes.json();
        if (!fixRes.ok) throw new Error(fixData.error || "Failed to fix mismatched teams");
        alert(
          `Successfully reset ${fixData.fixedCount} mismatched player club choices. Athletes can now pick clubs from their correct division.`
        );
        router.refresh();
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setAuditingTeams(false);
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

  // Reopen Submissions for a Match (Unlocks Player Dashboard Result & Forfeit Buttons)
  const handleReopenSubmissions = async (matchId: string, defaultHours: number = 24) => {
    if (
      !confirm(
        "Reopen submission buttons for this fixture? Both athletes will receive permission to upload/re-upload scores and screenshot proof, and deadline will be extended."
      )
    ) {
      return;
    }
    setReopeningMatchId(matchId);
    try {
      const res = await fetch("/api/admin/reopen-submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId, extensionHours: defaultHours }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reopen submissions");
      alert(data.message);
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setReopeningMatchId(null);
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

  // Schedule Continental Draw Event (Preserving exact local time)
  const handleScheduleDraw = async (competition: "UCL" | "EUROPA", drawTime: string) => {
    if (!drawTime) {
      alert("Please choose a valid date and time for the draw event.");
      return;
    }
    setActionLoading(true);
    try {
      const isoDrawTime = new Date(drawTime).toISOString();
      const res = await fetch("/api/admin/continental/schedule-draw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SCHEDULE_DRAW",
          competition,
          drawTime: isoDrawTime,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to schedule draw");
      alert(data.message);
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Launch Official Live Animated Draws System (Broadcasts simultaneously to all player portals)
  const handleLaunchLiveDraw = async (competition: "UCL" | "EUROPA") => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/continental/schedule-draw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "LAUNCH_LIVE_DRAW",
          competition,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to launch live draw");

      if (leagueConfig) {
        if (competition === "UCL") {
          leagueConfig.uclStarted = true;
          leagueConfig.uclDrawCompleted = false;
        } else {
          leagueConfig.europaStarted = true;
          leagueConfig.europaDrawCompleted = false;
        }
      }

      setActiveDrawModal(competition);
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Reset Continental Draw
  const handleResetDraw = async (competition: "UCL" | "EUROPA") => {
    if (!confirm(`Reset the official draw for ${competition}? Existing group allocations will be cleared.`)) {
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/continental/schedule-draw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "RESET_DRAW",
          competition,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reset draw");
      alert(data.message);
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Continental Animated Draws Modal State (Admin Exclusive)
  const [activeDrawModal, setActiveDrawModal] = useState<"UCL" | "EUROPA" | null>(null);

  const uclQualifiedAthletes = useMemo(() => {
    const d1Top8 = (div1Standings || []).slice(0, 8).map((s: any) => ({
      id: s.player.id,
      gamerTag: s.player.gamerTag,
      fullName: s.player.fullName,
      division: "Division 1",
      realTeam: s.player.realTeam,
      avatar: s.player.avatar,
      overallRating: s.player.overallRating || 88,
    }));
    const d2Top4 = (div2Standings || []).slice(0, 4).map((s: any) => ({
      id: s.player.id,
      gamerTag: s.player.gamerTag,
      fullName: s.player.fullName,
      division: "Division 2",
      realTeam: s.player.realTeam,
      avatar: s.player.avatar,
      overallRating: s.player.overallRating || 85,
    }));
    const d3Top4 = (div3Standings || []).slice(0, 4).map((s: any) => ({
      id: s.player.id,
      gamerTag: s.player.gamerTag,
      fullName: s.player.fullName,
      division: "Division 3",
      realTeam: s.player.realTeam,
      avatar: s.player.avatar,
      overallRating: s.player.overallRating || 82,
    }));
    return [...d1Top8, ...d2Top4, ...d3Top4];
  }, [div1Standings, div2Standings, div3Standings]);

  const europaQualifiedAthletes = useMemo(() => {
    const d1Next4 = (div1Standings || []).slice(8, 12).map((s: any) => ({
      id: s.player.id,
      gamerTag: s.player.gamerTag,
      fullName: s.player.fullName,
      division: "Division 1",
      realTeam: s.player.realTeam,
      avatar: s.player.avatar,
      overallRating: s.player.overallRating || 86,
    }));
    const d2Next6 = (div2Standings || []).slice(4, 10).map((s: any) => ({
      id: s.player.id,
      gamerTag: s.player.gamerTag,
      fullName: s.player.fullName,
      division: "Division 2",
      realTeam: s.player.realTeam,
      avatar: s.player.avatar,
      overallRating: s.player.overallRating || 83,
    }));
    const d3Next6 = (div3Standings || []).slice(4, 10).map((s: any) => ({
      id: s.player.id,
      gamerTag: s.player.gamerTag,
      fullName: s.player.fullName,
      division: "Division 3",
      realTeam: s.player.realTeam,
      avatar: s.player.avatar,
      overallRating: s.player.overallRating || 80,
    }));
    return [...d1Next4, ...d2Next6, ...d3Next6];
  }, [div1Standings, div2Standings, div3Standings]);

  const handleCommitDrawFromModal = async (competition: "UCL" | "EUROPA", slots: any[]) => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/continental/schedule-draw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "COMMIT_DRAW",
          competition,
          slots,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to commit official draw");
      alert(`Official ${competition} Draw locked & saved successfully!`);
      setActiveDrawModal(null);
      router.refresh();
    } catch (err: any) {
      alert(`Error committing draw: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Update Player Club Assignment
  const handleUpdatePlayerClub = async (playerId: string, realTeam: string) => {
    setUpdatingClub(true);
    try {
      const res = await fetch("/api/admin/update-player", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId,
          realTeam,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Failed to update player club (${res.status} ${res.statusText})`);
      alert(data.message || "Player club updated successfully!");
      setEditingClubPlayer(null);
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUpdatingClub(false);
    }
  };

  // Update Athlete Division Placement
  const handleUpdatePlayerDivision = async (playerId: string, targetDivision: string) => {
    if (!targetDivision) return;
    setUpdatingDivision(true);
    try {
      const res = await fetch("/api/admin/update-player", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId,
          division: targetDivision,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Failed to update player division (${res.status})`);
      alert(data.message || `Successfully moved athlete to ${targetDivision}!`);
      setEditingDivisionPlayer(null);
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUpdatingDivision(false);
    }
  };

  // Generate Continental Fixtures (Group stage, QF, SF, Final)
  const handleGenerateContinentalFixtures = async (
    competition: "UCL" | "EUROPA",
    stage: "GROUP" | "QUARTER_FINAL" | "SEMI_FINAL" | "FINAL"
  ) => {
    const stageLabels: Record<string, string> = {
      GROUP: "Group Stage Fixtures (2-legged matches)",
      QUARTER_FINAL: "Quarter-Finals (Top 2 from each group, 2-legged matches)",
      SEMI_FINAL: "Semi-Finals (2-legged matches)",
      FINAL: "Grand Final (Single-match showdown) & Launch Trophy Prediction Poll",
    };

    if (!confirm(`Generate ${competition} ${stageLabels[stage]}?`)) return;

    setActionLoading(true);
    try {
      const res = await fetch("/api/continental/generate-fixtures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ competition, stage }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate fixtures");
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

  // Execute End of Season Relegations, Promotions, or Complete Season Wipe
  const handleExecuteSeasonTransition = async (
    action: "ALL" | "RELEGATE_ONLY" | "PROMOTE_ONLY" | "WIPE_FOR_NEW_SEASON" = "ALL"
  ) => {
    let confirmMsg =
      "Are you sure you want to finalize the season and execute BOTH promotions (Top 3 of Div 2 & 3) AND relegations (Bottom 3 of Div 1 & 2)?";
    if (action === "RELEGATE_ONLY") {
      confirmMsg =
        "Are you sure you want to trigger DIVISION RELEGATIONS now?\n\n• Bottom 3 in Division 1 -> Relegated to Division 2\n• Bottom 3 in Division 2 -> Relegated to Division 3\n\nAll relegated athletes will immediately access their new division data and schedules.";
    } else if (action === "PROMOTE_ONLY") {
      confirmMsg =
        "Are you sure you want to trigger DIVISION PROMOTIONS?\n\n• Top 3 in Division 2 -> Promoted to Division 1\n• Top 3 in Division 3 -> Promoted to Division 2";
    } else if (action === "WIPE_FOR_NEW_SEASON") {
      confirmMsg =
        "⚠️ CRITICAL ACTION: Conclude the current season and WIPE all season data?\n\n1. Champions and podium athletes will be permanently enshrined into the Hall of Fame.\n2. All matches, submissions, forfeit claims, and continental slots will be cleared.\n3. Standings and statistics will be reset to 0.\n4. Real team selections will be reset to null so all players can draft fresh clubs for the new season.\n5. The league season counter will advance (e.g. to Season 2).\n\nAre you sure you want to execute the Season Reset?";
    }

    if (!confirm(confirmMsg)) return;

    if (action === "WIPE_FOR_NEW_SEASON") {
      if (!confirm("FINAL CONFIRMATION: Type OK to wipe all season fixtures and advance to the new season.")) {
        return;
      }
    }

    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/end-season", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to execute season transition");

      alert(`Operation Completed Successfully!\n\n${data.message}`);
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
      alert(data.message || "Reply sent successfully! Stored in Message History (auto-deletes in 24 hours).");
      if (data.data) {
        setPlayerMessages((prev) =>
          prev.map((m) => (m.id === messageId ? data.data : m))
        );
      }
      setReplyingMessageId(null);
      setReplyText("");
      setInquiriesSubTab("HISTORY");
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmittingReply(false);
    }
  };

  // Delete message from Message History
  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm("Are you sure you want to delete this conversation from Message History?")) return;
    setDeletingMessageId(messageId);
    try {
      const res = await fetch(`/api/admin/messages/reply?id=${encodeURIComponent(messageId)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete message");
      setPlayerMessages((prev) => prev.filter((m) => m.id !== messageId));
      router.refresh();
    } catch (err: any) {
      alert(err.message || "Failed to delete message");
    } finally {
      setDeletingMessageId(null);
    }
  };

  // Handler: Approve Password Reset Request
  const handleApprovePasswordReset = async (requestId: string, gamerTag?: string) => {
    if (
      !confirm(
        `Grant password reset permission to athlete "${gamerTag || "User"}"?\n\nOnce approved, the user will be able to enter a new password on the sign-in page and immediately log into their account.`
      )
    ) {
      return;
    }

    setResetActionLoading(requestId);
    try {
      const res = await fetch("/api/admin/password-resets/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to approve password reset request");

      alert(data.message || "Password reset request approved successfully!");
      setPasswordResets((prev) =>
        prev.map((r) =>
          r.id === requestId
            ? { ...r, status: "APPROVED", approvedAt: new Date().toISOString() }
            : r
        )
      );
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setResetActionLoading(null);
    }
  };

  // Handler: Delete or Reject Password Reset Request
  const handleDeletePasswordReset = async (requestId: string, action: "DELETE" | "REJECT") => {
    const promptText =
      action === "DELETE"
        ? "Are you sure you want to delete this password reset record?"
        : "Are you sure you want to reject this password reset request?";
    if (!confirm(promptText)) return;

    setResetActionLoading(requestId);
    try {
      const res = await fetch("/api/admin/password-resets/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update password reset request");

      alert(data.message || "Request updated successfully");
      if (action === "DELETE") {
        setPasswordResets((prev) => prev.filter((r) => r.id !== requestId));
      } else {
        setPasswordResets((prev) =>
          prev.map((r) => (r.id === requestId ? { ...r, status: "REJECTED" } : r))
        );
      }
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setResetActionLoading(null);
    }
  };

  // Helper for standings table rendering
  const renderStandingsTable = (title: string, standings: any[], badgeColor: string, maxLimit: number = 20) => {
    return (
      <div className="rounded-3xl border border-border bg-background/90 overflow-hidden shadow-xl">
        <div className="p-5 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card/40">
          <div className="flex items-center gap-2.5">
            <span className={`h-3 w-3 rounded-full ${badgeColor}`} />
            <h3 className="text-lg font-black uppercase text-white tracking-wide">{title}</h3>
          </div>
          <span className="text-xs font-mono text-muted-foreground">
            {standings.length} Registered Competitors (Max {maxLimit})
          </span>
        </div>

        <div className="overflow-x-auto no-scrollbar scroll-smooth">
          <table className="w-full text-left text-xs">
            <thead className="bg-card/80 text-xs font-black uppercase tracking-wider text-muted-foreground border-b border-border">
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
                <th className="px-4 py-3 text-center font-black text-secondary">PTS</th>
                <th className="px-3 py-3 text-center">Form</th>
                <th className="px-4 py-3 text-center">Missed</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {standings.length === 0 ? (
                <tr>
                  <td colSpan={14} className="py-8 text-center text-muted-foreground font-mono">
                    No players registered in this division yet.
                  </td>
                </tr>
              ) : (
                standings.map((s, idx) => {
                  const rank = idx + 1;
                  const isTop8Ucl = rank <= 8 && s.division === "Division 1";
                  const isTop4Ucl = rank <= 4 && (s.division === "Division 2" || s.division === "Division 3");
                  const isRelegation =
                    (s.division === "Division 1" || s.division === "Division 2") &&
                    standings.length >= 4 &&
                    rank > standings.length - 3;

                  return (
                    <tr
                      key={s.id}
                      className={`hover:bg-card/50 transition-colors ${
                        s.isDisqualified ? "bg-destructive/20 opacity-60" : ""
                      }`}
                    >
                      <td className="px-4 py-3.5 text-center font-bold font-mono">
                        <span
                          className={`inline-flex items-center justify-center h-6 w-6 rounded-md text-xs font-black ${
                            isTop8Ucl || isTop4Ucl
                              ? "bg-primary/20 text-primary border border-primary/30"
                              : isRelegation
                              ? "bg-destructive/20 text-destructive border border-destructive/30"
                              : "text-muted-foreground"
                          }`}
                        >
                          {rank}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-bold text-white">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-card border border-border/80 p-0.5 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                            <img
                              src={resolvePlayerAvatar(s.player)}
                              alt={s.player.realTeam || s.player.gamerTag || "Team Crest"}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(s.player.gamerTag || "player")}`;
                              }}
                            />
                          </div>
                          <span>{s.player.gamerTag}</span>
                          {s.player.realTeam && (
                            <span className="text-xs text-secondary font-bold bg-secondary/10 border border-secondary/20 px-1.5 py-0.5 rounded">
                              {findTeam(s.player.realTeam)?.shortName || s.player.realTeam}
                            </span>
                          )}
                          {s.isDisqualified && (
                            <Badge variant="destructive" className="text-xs px-1 py-0">
                              DQ
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground block font-normal ml-8">
                          {s.player.fullName} ({s.player.efootballId})
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-primary">
                        {s.player.whatsapp}
                      </td>
                      <td className="px-3 py-3.5 text-center font-mono text-foreground">{s.played}</td>
                      <td className="px-3 py-3.5 text-center font-mono text-primary">{s.won}</td>
                      <td className="px-3 py-3.5 text-center font-mono text-muted-foreground">{s.drawn}</td>
                      <td className="px-3 py-3.5 text-center font-mono text-destructive">{s.lost}</td>
                      <td className="px-3 py-3.5 text-center font-mono text-muted-foreground">{s.goalsFor}</td>
                      <td className="px-3 py-3.5 text-center font-mono text-muted-foreground">{s.goalsAgainst}</td>
                      <td
                        className={`px-3 py-3.5 text-center font-mono font-bold ${
                          s.goalDifference > 0
                            ? "text-primary"
                            : s.goalDifference < 0
                            ? "text-destructive"
                            : "text-muted-foreground"
                        }`}
                      >
                        {s.goalDifference > 0 ? `+${s.goalDifference}` : s.goalDifference}
                      </td>
                      <td className="px-4 py-3.5 text-center font-mono font-black text-secondary text-sm">
                        {s.points}
                      </td>
                      <td className="px-3 py-3.5 text-center font-mono text-xs text-muted-foreground">
                        {s.form}
                      </td>
                      <td className="px-4 py-3.5 text-center font-mono">
                        <span
                          className={`font-bold ${
                            s.consecutiveMissed >= 2 ? "text-destructive" : "text-muted-foreground"
                          }`}
                        >
                          {s.consecutiveMissed}/3
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {s.isDisqualified ? (
                          <Badge variant="destructive" className="text-xs">
                            Disqualified
                          </Badge>
                        ) : isRelegation ? (
                          <Badge variant="destructive" className="text-xs bg-destructive/20 text-destructive border-destructive/40">
                            Relegation ({s.division === "Division 1" ? "Div 2" : "Div 3"})
                          </Badge>
                        ) : s.consecutiveMissed >= 2 ? (
                          <Badge variant="yellow" className="text-xs">
                            Warning
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
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
      <div className="rounded-3xl border border-border bg-card/80 p-6 shadow-2xl backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="yellow" className="font-mono text-xs px-2 py-0.5 tracking-wider">
              ADMIN OFFICE COMMISSIONER
            </Badge>
            <span className="text-xs font-mono text-muted-foreground">Logged in as: {adminEmail || "admin@efootball.rw"}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase text-white tracking-tight flex items-center gap-2">
            <span>eFootball Rwanda Admin Office</span>
          </h1>
          <p className="text-xs text-muted-foreground">
            Full commissioner control over league registration, one-way round robin schedules, score screenshot verification, automated promotions, and continental cups.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleLogout}
            variant="destructive"
            size="sm"
            className="font-black uppercase tracking-wider text-xs gap-1.5 shadow-lg"
          >
            <LogOut className="h-4 w-4" />
            <span>Log Out</span>
          </Button>
        </div>
      </div>

      {/* Primary Navigation Tabs - Mobile & Tablet Horizontally Scrollable */}
      <div className="flex items-center gap-2 border-b border-border pb-3 overflow-x-auto no-scrollbar scroll-smooth -mx-4 px-4 sm:mx-0 sm:px-0">
        <button
          onClick={() => setActiveTab("DASHBOARD")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 h-11 ${
            activeTab === "DASHBOARD"
              ? "bg-primary text-white shadow-lg"
              : "text-muted-foreground hover:text-white hover:bg-card"
          }`}
        >
          <Sliders className="h-4 w-4" />
          <span>Control Center</span>
        </button>

        <button
          onClick={() => setActiveTab("PENDING_REGISTRATIONS")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 h-11 ${
            activeTab === "PENDING_REGISTRATIONS"
              ? "bg-secondary text-secondary-foreground font-black shadow-lg"
              : "text-muted-foreground hover:text-white hover:bg-card"
          }`}
        >
          <UserCheck className={`h-4 w-4 ${activeTab === "PENDING_REGISTRATIONS" ? "text-secondary-foreground" : "text-secondary"}`} />
          <span>Pending Approvals</span>
          {pendingPlayers.length > 0 && (
            <Badge
              variant="yellow"
              className={`text-xs px-1.5 py-0 font-black ${
                activeTab === "PENDING_REGISTRATIONS"
                  ? "bg-background text-secondary"
                  : "bg-secondary text-secondary-foreground"
              }`}
            >
              {pendingPlayers.length}
            </Badge>
          )}
        </button>

        <button
          onClick={() => setActiveTab("RESERVE_POOL")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 h-11 ${
            activeTab === "RESERVE_POOL"
              ? "bg-primary text-white font-black shadow-lg"
              : "text-muted-foreground hover:text-white hover:bg-card"
          }`}
        >
          <Sparkles className="h-4 w-4 text-primary" />
          <span>Reserve Pool ({reservePlayers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("TABLES")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 h-11 ${
            activeTab === "TABLES"
              ? "bg-primary text-white shadow-lg"
              : "text-muted-foreground hover:text-white hover:bg-card"
          }`}
        >
          <Trophy className="h-4 w-4" />
          <span>All League Tables</span>
        </button>

        <button
          onClick={() => setActiveTab("ALL_MATCHES")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 h-11 ${
            activeTab === "ALL_MATCHES"
              ? "bg-primary text-white font-black shadow-lg"
              : "text-muted-foreground hover:text-white hover:bg-card"
          }`}
        >
          <Calendar className="h-4 w-4 text-primary" />
          <span>All Generated Matches ({matches.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("CONTINENTAL")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 h-11 ${
            activeTab === "CONTINENTAL"
              ? "bg-primary text-white shadow-lg"
              : "text-muted-foreground hover:text-white hover:bg-card"
          }`}
        >
          <Globe className="h-4 w-4" />
          <span>UCL & Europa Hub</span>
        </button>

        <button
          onClick={() => setActiveTab("RESULTS_QUEUE")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 h-11 ${
            activeTab === "RESULTS_QUEUE"
              ? "bg-primary text-white shadow-lg"
              : "text-muted-foreground hover:text-white hover:bg-card"
          }`}
        >
          <Upload className="h-4 w-4" />
          <span>Score Verification</span>
          {pendingSubmissions.length > 0 && (
            <Badge variant="live" className="text-xs px-1.5 py-0">
              {pendingSubmissions.length}
            </Badge>
          )}
        </button>

        <button
          onClick={() => setActiveTab("FORFEITS_QUEUE")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 h-11 ${
            activeTab === "FORFEITS_QUEUE"
              ? "bg-primary text-white shadow-lg"
              : "text-muted-foreground hover:text-white hover:bg-card"
          }`}
        >
          <ShieldAlert className="h-4 w-4" />
          <span>Forfeit Claims</span>
          {pendingForfeits.length > 0 && (
            <Badge variant="destructive" className="text-xs px-1.5 py-0">
              {pendingForfeits.length}
            </Badge>
          )}
        </button>

        <button
          onClick={() => setActiveTab("ANNOUNCEMENTS")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 h-11 ${
            activeTab === "ANNOUNCEMENTS"
              ? "bg-primary text-white shadow-lg"
              : "text-muted-foreground hover:text-white hover:bg-card"
          }`}
        >
          <Bell className="h-4 w-4" />
          <span>Announcements</span>
        </button>

        <button
          onClick={() => setActiveTab("PLAYERS")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 h-11 ${
            activeTab === "PLAYERS"
              ? "bg-primary text-white shadow-lg"
              : "text-muted-foreground hover:text-white hover:bg-card"
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Athletes Directory ({playersList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("HALL_OF_FAME")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 h-11 ${
            activeTab === "HALL_OF_FAME"
              ? "bg-secondary text-secondary-foreground font-black shadow-lg"
              : "text-muted-foreground hover:text-white hover:bg-card"
          }`}
        >
          <Crown className="h-4 w-4 text-secondary" />
          <span>Hall of Fame ({hallOfFame.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("MESSAGES")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 h-11 ${
            activeTab === "MESSAGES"
              ? "bg-primary text-white font-black shadow-lg"
              : "text-muted-foreground hover:text-white hover:bg-card"
          }`}
        >
          <MessageSquare className="h-4 w-4 text-primary" />
          <span>Player Inquiries ({activePlayerMessages.length})</span>
          {pendingMessages.length > 0 && (
            <Badge variant="destructive" className="text-xs px-1.5 py-0 font-black animate-pulse">
              {pendingMessages.length}
            </Badge>
          )}
        </button>

        <button
          onClick={() => setActiveTab("REVIEWS")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 h-11 ${
            activeTab === "REVIEWS"
              ? "bg-secondary text-secondary-foreground font-black shadow-lg"
              : "text-muted-foreground hover:text-white hover:bg-card"
          }`}
        >
          <Star className={`h-4 w-4 ${activeTab === "REVIEWS" ? "text-secondary-foreground" : "text-secondary"}`} />
          <span>Ratings & Reviews ({reviewsList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("PASSWORD_RESETS")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 h-11 ${
            activeTab === "PASSWORD_RESETS"
              ? "bg-destructive text-white font-black shadow-lg"
              : "text-muted-foreground hover:text-white hover:bg-card"
          }`}
        >
          <KeyRound className={`h-4 w-4 ${activeTab === "PASSWORD_RESETS" ? "text-white" : "text-destructive"}`} />
          <span>Password Resets ({passwordResets.length})</span>
          {passwordResets.filter((r) => r.status === "PENDING").length > 0 && (
            <Badge variant="destructive" className="text-xs px-1.5 py-0 font-black animate-pulse">
              {passwordResets.filter((r) => r.status === "PENDING").length}
            </Badge>
          )}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: CONTROL CENTER (REGISTRATION, SCHEDULE GENERATOR, 12 AM CYCLE) */}
      {/* ========================================================================= */}
      {activeTab === "DASHBOARD" && (
        <div className="space-y-8">
          {/* Action Required Alert: Pending Registrations */}
          {pendingPlayers.length > 0 && (
            <div className="rounded-3xl border border-secondary/50 bg-gradient-to-r from-secondary/40 via-background to-background p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/20 border border-secondary/40 text-secondary shrink-0">
                  <UserCheck className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black uppercase text-white">Action Required: Pending Registrations</h3>
                    <Badge variant="yellow" className="font-mono text-xs">
                      {pendingPlayers.length} Waiting
                    </Badge>
                  </div>
                  <p className="text-xs text-foreground mt-0.5">
                    {pendingPlayers.length} new athlete{pendingPlayers.length > 1 ? "s have" : " has"} registered and {pendingPlayers.length > 1 ? "are" : "is"} awaiting commissioner review. Admit them to active divisions or place them in reserve.
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setActiveTab("PENDING_REGISTRATIONS")}
                className="bg-secondary hover:bg-secondary text-secondary-foreground font-black text-xs uppercase tracking-wider gap-2 shrink-0 shadow-lg"
              >
                <span>Review Approvals</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Action Required Alert: Password Reset Requests */}
          {passwordResets.filter((r) => r.status === "PENDING").length > 0 && (
            <div className="rounded-3xl border border-destructive/40 bg-card/90 p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/20 border border-destructive/40 text-destructive shrink-0">
                  <KeyRound className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black uppercase text-white">Action Required: Password Reset Requests</h3>
                    <Badge variant="destructive" className="font-mono text-xs">
                      {passwordResets.filter((r) => r.status === "PENDING").length} Waiting
                    </Badge>
                  </div>
                  <p className="text-xs text-foreground mt-0.5">
                    {passwordResets.filter((r) => r.status === "PENDING").length} athlete(s) forgot their password and requested permission to reset it.
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setActiveTab("PASSWORD_RESETS")}
                className="bg-destructive hover:bg-destructive text-white font-black text-xs uppercase tracking-wider gap-2 shrink-0 shadow-lg"
              >
                <span>Review Reset Requests</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-border bg-background/80 p-5 space-y-1">
              <span className="text-xs font-bold uppercase text-muted-foreground">Registration Status</span>
              <div className="flex items-center justify-between pt-1">
                <span
                  className={`text-xl font-black uppercase ${
                    leagueConfig.registrationOpen ? "text-primary" : "text-secondary"
                  }`}
                >
                  {leagueConfig.registrationOpen ? "Open" : "Closed"}
                </span>
                <Badge variant={leagueConfig.registrationOpen ? "secondary" : "yellow"}>
                  {leagueConfig.registrationOpen ? "ACCEPTING PLAYERS" : "SEASON ACTIVE"}
                </Badge>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-background/80 p-5 space-y-1">
              <span className="text-xs font-bold uppercase text-muted-foreground">Current Matchday</span>
              <div className="flex items-center justify-between pt-1">
                <span className="text-2xl font-black text-primary">Matchday {leagueConfig.currentMatchday}</span>
                <Clock className="h-5 w-5 text-primary" />
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-background/80 p-5 space-y-1">
              <span className="text-xs font-bold uppercase text-muted-foreground">UCL Status</span>
              <div className="flex items-center justify-between pt-1">
                <span
                  className={`text-lg font-black uppercase ${
                    leagueConfig.uclStarted ? "text-secondary" : "text-muted-foreground"
                  }`}
                >
                  {leagueConfig.uclStarted ? "In Progress" : "Locked"}
                </span>
                {leagueConfig.uclStarted ? (
                  <Unlock className="h-5 w-5 text-secondary" />
                ) : (
                  <Lock className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-background/80 p-5 space-y-1">
              <span className="text-xs font-bold uppercase text-muted-foreground">Europa Status</span>
              <div className="flex items-center justify-between pt-1">
                <span
                  className={`text-lg font-black uppercase ${
                    leagueConfig.europaStarted ? "text-secondary" : "text-muted-foreground"
                  }`}
                >
                  {leagueConfig.europaStarted ? "In Progress" : "Locked"}
                </span>
                {leagueConfig.europaStarted ? (
                  <Unlock className="h-5 w-5 text-secondary" />
                ) : (
                  <Lock className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </div>
          </div>

          {/* Operation 1: Registration Controls */}
          <div className="rounded-3xl border border-border bg-background/90 p-6 sm:p-8 backdrop-blur-xl shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
              <div>
                <h3 className="text-lg font-black uppercase text-white flex items-center gap-2">
                  <Sliders className="h-5 w-5 text-primary" />
                  <span>League Registration Lifecycle Controller</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
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
                    className="bg-primary hover:bg-primary font-bold text-xs uppercase tracking-wider"
                  >
                    Re-open League Registration
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-card/60 border border-border">
                <span className="text-xs font-bold text-primary block">Division 1 Registered</span>
                <span className="text-2xl font-black text-white">{div1Standings.length} / {div1Max}</span>
                <span className="text-xs text-muted-foreground block mt-1">Premiership Division</span>
              </div>
              <div className="p-4 rounded-2xl bg-card/60 border border-border">
                <span className="text-xs font-bold text-secondary block">Division 2 Registered</span>
                <span className="text-2xl font-black text-white">{div2Standings.length} / {div2Max}</span>
                <span className="text-xs text-muted-foreground block mt-1">Championship Division</span>
              </div>
              <div className="p-4 rounded-2xl bg-card/60 border border-border">
                <span className="text-xs font-bold text-primary block">Division 3 Registered</span>
                <span className="text-2xl font-black text-white">{div3Standings.length} / {div3Max}</span>
                <span className="text-xs text-muted-foreground block mt-1">National Academy</span>
              </div>
            </div>
          </div>

          {/* Operation 1B: Division Participant Capacity Controller */}
          <div className="rounded-3xl border border-border bg-background/90 p-6 sm:p-8 backdrop-blur-xl shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
              <div>
                <h3 className="text-lg font-black uppercase text-white flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <span>Division Participant Capacity Settings</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Admins can extend the maximum participant capacity per division (default: 20 athletes). Continental UCL and Europa League remain fixed at 16 qualification slots.
                </p>
              </div>

              {capacitySuccessMsg && (
                <div className="flex items-center gap-2 text-xs font-bold text-primary bg-primary/40 border border-primary/40 px-3 py-1.5 rounded-xl">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{capacitySuccessMsg}</span>
                </div>
              )}
            </div>

            <form onSubmit={handleSaveCapacity} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-card/70 border border-border space-y-2">
                  <label className="text-xs font-bold uppercase text-primary block">
                    Division 1 Capacity
                  </label>
                  <p className="text-xs text-muted-foreground">Premiership maximum participants.</p>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={div1Max}
                    onChange={(e) => setDiv1Max(Number(e.target.value))}
                    className="bg-background border-border text-sm font-bold font-mono text-white"
                    required
                  />
                  <span className="text-xs text-muted-foreground block">Current active: {div1Standings.length} athletes</span>
                </div>

                <div className="p-4 rounded-2xl bg-card/70 border border-border space-y-2">
                  <label className="text-xs font-bold uppercase text-secondary block">
                    Division 2 Capacity
                  </label>
                  <p className="text-xs text-muted-foreground">Championship maximum participants.</p>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={div2Max}
                    onChange={(e) => setDiv2Max(Number(e.target.value))}
                    className="bg-background border-border text-sm font-bold font-mono text-white"
                    required
                  />
                  <span className="text-xs text-muted-foreground block">Current active: {div2Standings.length} athletes</span>
                </div>

                <div className="p-4 rounded-2xl bg-card/70 border border-border space-y-2">
                  <label className="text-xs font-bold uppercase text-primary block">
                    Division 3 Capacity
                  </label>
                  <p className="text-xs text-muted-foreground">National Academy maximum participants.</p>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={div3Max}
                    onChange={(e) => setDiv3Max(Number(e.target.value))}
                    className="bg-background border-border text-sm font-bold font-mono text-white"
                    required
                  />
                  <span className="text-xs text-muted-foreground block">Current active: {div3Standings.length} athletes</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <span className="text-xs text-muted-foreground">
                  UCL & Europa League: <strong>16 Fixed Slots</strong> (Top 8 Div 1 + Top 4 Div 2 + Top 4 Div 3 - Unchanged).
                </span>
                <Button
                  type="submit"
                  disabled={savingCapacity}
                  className="bg-primary hover:bg-primary text-white font-black text-xs uppercase tracking-wider shadow-lg"
                >
                  {savingCapacity ? "Saving..." : "Save Division Capacity Limits"}
                </Button>
              </div>
            </form>
          </div>

          {/* Operation 2: Round Robin Schedule Generator */}
          <div className="rounded-3xl border border-border bg-background/90 p-6 sm:p-8 backdrop-blur-xl shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
              <div>
                <h3 className="text-lg font-black uppercase text-white flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-secondary" />
                  <span>Division Round-Robin Schedule Generator (One-Way 1 Match per Pairing)</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Generates paired single round-robin matches (one-way 1 match only per pairing, home only) for registered players once registration has closed.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 bg-card border border-border p-1.5 rounded-xl">
                  <span className="text-xs font-bold text-muted-foreground pl-1.5">Kickoff Date:</span>
                  <input
                    type="date"
                    value={leagueStartDate}
                    onChange={(e) => setLeagueStartDate(e.target.value)}
                    className="bg-background border border-border rounded-lg px-2.5 py-1 text-xs text-white font-mono focus:border-secondary focus:outline-none"
                  />
                  <Badge variant="outline" className="text-xs font-mono border-secondary/40 text-secondary bg-secondary/10">
                    Dropout: 12:00 AM Midnight
                  </Badge>
                </div>

                <Button
                  onClick={() => handleGenerateSchedule("ALL")}
                  disabled={actionLoading || leagueConfig.registrationOpen}
                  variant="yellow"
                  className="font-bold text-xs uppercase tracking-wider text-secondary-foreground"
                >
                  Generate All Divisions Schedule
                </Button>

                <Button
                  onClick={() => handleResetTournament("ALL")}
                  disabled={resettingTournament}
                  variant="destructive"
                  className="font-bold text-xs uppercase tracking-wider gap-1.5 shadow-lg"
                >
                  <RotateCcw className={`h-3.5 w-3.5 ${resettingTournament ? "animate-spin" : ""}`} />
                  {resettingTournament ? "Resetting..." : "Reset All Matches & Standings"}
                </Button>

                <Button
                  onClick={() => handleResetRealTeams("ALL")}
                  disabled={resettingTeams}
                  variant="outline"
                  className="font-bold text-xs uppercase tracking-wider gap-1.5 border-destructive/50 text-destructive hover:bg-destructive/20"
                  title="Clear all players real team assignments and avatars so they can select fresh"
                >
                  <RotateCcw className={`h-3.5 w-3.5 ${resettingTeams ? "animate-spin" : ""}`} />
                  {resettingTeams ? "Resetting Clubs..." : "Reset All Real Team Choices"}
                </Button>

                <Button
                  onClick={handleAuditTeams}
                  disabled={auditingTeams}
                  variant="outline"
                  className="font-bold text-xs uppercase tracking-wider gap-1.5 border-secondary/50 text-secondary hover:bg-secondary/20"
                  title="Check whether every athlete's assigned real team matches their division (Div 1 = Premier League, Div 2 = La Liga, Div 3 = Serie A)"
                >
                  <ShieldCheck className={`h-3.5 w-3.5 ${auditingTeams ? "animate-spin" : ""}`} />
                  {auditingTeams ? "Auditing Teams..." : "Audit Team Divisions"}
                </Button>
              </div>
            </div>

            {leagueConfig.registrationOpen && (
              <div className="rounded-xl border border-secondary/30 bg-secondary/30 p-3 text-xs text-secondary flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-secondary" />
                <span>
                  Please click <strong>&quot;End / Close Registration&quot;</strong> above first before generating the official tournament schedule.
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-card/60 border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-primary block">Division 1 Schedule</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${div1Standings.length % 2 === 0 && div1Standings.length >= 2 ? "bg-primary/20 text-primary" : "bg-secondary/20 text-secondary"}`}>
                    {div1Standings.length} Players {div1Standings.length % 2 === 0 && div1Standings.length >= 2 ? `(${div1Standings.length - 1} rounds)` : "(Odd: needs even)"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {div1Standings.length % 2 === 0 && div1Standings.length >= 2
                    ? `1 leg only: 10 matches/day, each player plays ${div1Standings.length - 1} matches with 0 intervals.`
                    : `Needs an even number of players (e.g. 20) so all players play every round with no intervals.`}
                </p>
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
                    className="w-full text-xs font-bold text-destructive hover:bg-destructive/30"
                  >
                    Reset
                  </Button>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-card/60 border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-secondary block">Division 2 Schedule</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${div2Standings.length % 2 === 0 && div2Standings.length >= 2 ? "bg-primary/20 text-primary" : "bg-secondary/20 text-secondary"}`}>
                    {div2Standings.length} Players {div2Standings.length % 2 === 0 && div2Standings.length >= 2 ? `(${div2Standings.length - 1} rounds)` : "(Odd: needs even)"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {div2Standings.length % 2 === 0 && div2Standings.length >= 2
                    ? `1 leg only: all players play every round, each plays ${div2Standings.length - 1} matches.`
                    : `Needs an even number of players so all players play every round with no intervals.`}
                </p>
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
                    className="w-full text-xs font-bold text-destructive hover:bg-destructive/30"
                  >
                    Reset
                  </Button>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-card/60 border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-primary block">Division 3 Schedule</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${div3Standings.length % 2 === 0 && div3Standings.length >= 2 ? "bg-primary/20 text-primary" : "bg-secondary/20 text-secondary"}`}>
                    {div3Standings.length} Players {div3Standings.length % 2 === 0 && div3Standings.length >= 2 ? `(${div3Standings.length - 1} rounds)` : "(Odd: needs even)"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {div3Standings.length % 2 === 0 && div3Standings.length >= 2
                    ? `1 leg only: all players play every round, each plays ${div3Standings.length - 1} matches.`
                    : `Needs an even number of players so all players play every round with no intervals.`}
                </p>
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
                    className="w-full text-xs font-bold text-destructive hover:bg-destructive/30"
                  >
                    Reset
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Operation 3: 12:00 AM Automated Daily Cycle Trigger */}
          <div className="rounded-3xl border border-border bg-background/90 p-6 sm:p-8 backdrop-blur-xl shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
              <div>
                <h3 className="text-lg font-black uppercase text-white flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  <span>12:00 AM Midnight Matchday Fixture Advance Cycle</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  At 12:00 AM midnight, the system automatically drops next fixtures and marks expired unplayed matches (enforcing 3 missed matches disqualifications). You can also manually advance the cycle here.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-primary/30 bg-primary/20 text-primary text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span>Automated 1-Hr System Reminders Active</span>
                </div>

                <Button
                  onClick={handleTriggerReminders}
                  disabled={actionLoading}
                  variant="outline"
                  className="border-secondary/50 text-secondary hover:bg-secondary/30 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5"
                >
                  <Bell className="h-3.5 w-3.5 text-secondary" />
                  <span>Manual Check Reminders</span>
                </Button>

                <Button
                  onClick={handleTriggerDailyCycle}
                  disabled={actionLoading}
                  variant="default"
                  className="bg-primary hover:bg-primary text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Advance to Matchday {leagueConfig.currentMatchday + 1}</span>
                </Button>
              </div>
            </div>

            <div className="text-xs text-muted-foreground space-y-1">
              <p>• Current active round: <strong>Matchday {leagueConfig.currentMatchday}</strong></p>
              <p>• Next scheduled round: <strong>Matchday {leagueConfig.currentMatchday + 1}</strong></p>
              <p>• Players have strictly 24 hours to coordinate on WhatsApp and upload proof before midnight expiration.</p>
            </div>
          </div>

          {/* Operation 4: Table-Based Match of the Day Controller */}
          <div className="rounded-3xl border border-secondary/30 bg-background/90 p-6 sm:p-8 backdrop-blur-xl shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="yellow" className="text-xs font-mono">
                    AUTOMATIC SELECTION ENGINE
                  </Badge>
                  <span className="text-xs font-bold text-secondary uppercase tracking-widest">
                    Rule: Except on Round 1
                  </span>
                </div>
                <h3 className="text-lg font-black uppercase text-white flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-secondary" />
                  <span>Match of the Day (MOTD) System</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
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
                className="font-bold text-xs uppercase tracking-wider text-secondary-foreground"
              >
                Re-evaluate MOTD from Table
              </Button>
            </div>

            <div className="pt-1">
              {leagueConfig.currentMatchday <= 1 ? (
                <div className="p-4 rounded-2xl bg-card/60 border border-border text-xs text-muted-foreground flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-secondary shrink-0" />
                  <div>
                    <span className="font-bold text-white block">Round 1 Rule Enforced</span>
                    <span>
                      Match of the Day is not selected on Round 1 because all teams start with zero points. Selection activates automatically starting from Round 2 based on official table rankings.
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-card/60 border border-secondary/20 text-xs text-foreground">
                  <span className="font-bold text-secondary block mb-1">Active MOTD Status</span>
                  <p>
                    The system evaluates active fixtures for Matchday {leagueConfig.currentMatchday} and highlights the clash with the highest stakes, points, and top-table ranking.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Operation 5: End Season Finale: Promotions & Relegations */}
          <div className="rounded-3xl border border-secondary/30 bg-gradient-to-b from-background via-card to-background p-6 sm:p-8 backdrop-blur-xl shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-secondary" />
                  <h3 className="text-lg font-black uppercase text-white">
                    Season Finale & Transition
                  </h3>
                  <Badge variant="outline" className="border-primary/40 text-primary bg-primary/10 font-mono text-xs">
                    Active: {leagueConfig?.season || "Season 1 (2026)"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Promote/relegate division athletes or conclude the entire season, archiving winners to Hall of Fame, wiping season fixtures, and resetting for a fresh club draft.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <Button
                  onClick={() => handleExecuteSeasonTransition("RELEGATE_ONLY")}
                  disabled={actionLoading}
                  className="bg-destructive hover:bg-destructive text-white font-black text-xs uppercase tracking-wider shadow-lg"
                >
                  <ArrowDown className="h-3.5 w-3.5 mr-1" />
                  Relegate Bottom 3
                </Button>
                <Button
                  onClick={() => handleExecuteSeasonTransition("ALL")}
                  disabled={actionLoading}
                  className="bg-secondary hover:bg-secondary text-secondary-foreground font-black text-xs uppercase tracking-wider shadow-lg"
                >
                  <Sparkles className="h-3.5 w-3.5 mr-1" />
                  Execute Promotions & Relegations
                </Button>
                <Button
                  onClick={() => handleExecuteSeasonTransition("WIPE_FOR_NEW_SEASON")}
                  disabled={actionLoading}
                  className="bg-primary hover:bg-primary text-white font-black text-xs uppercase tracking-wider shadow-lg"
                  title="Archive champions to Hall of Fame, wipe fixtures & standings, reset clubs to null, and advance season"
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1" />
                  Conclude Season & Wipe Data for New Season
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Div 1 Bottom 3 Preview (Relegation to Div 2) */}
              <div className="p-4 rounded-2xl bg-background border border-destructive/30 space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="destructive" className="text-xs bg-destructive/20 text-destructive border border-destructive/40">
                    RELEGATING TO DIV 2
                  </Badge>
                  <span className="text-xs text-muted-foreground font-mono">Div 1 (Bottom 3)</span>
                </div>
                <div className="space-y-1.5 pt-1">
                  {div1Standings.length >= 4 ? (
                    div1Standings.slice(-3).map((s, idx) => (
                      <div key={s.id} className="flex items-center justify-between text-xs py-1 border-b border-border/60">
                        <span className="font-bold text-white truncate w-32">
                          #{div1Standings.length - 3 + idx + 1} {s.player?.gamerTag || "Unknown"}
                        </span>
                        <span className="font-mono text-destructive font-black">{s.points} Pts</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground italic">Need at least 4 Division 1 players.</p>
                  )}
                </div>
              </div>

              {/* Div 2 Bottom 3 Preview (Relegation to Div 3) */}
              <div className="p-4 rounded-2xl bg-background border border-destructive/30 space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="destructive" className="text-xs bg-destructive/20 text-destructive border border-destructive/40">
                    RELEGATING TO DIV 3
                  </Badge>
                  <span className="text-xs text-muted-foreground font-mono">Div 2 (Bottom 3)</span>
                </div>
                <div className="space-y-1.5 pt-1">
                  {div2Standings.length >= 4 ? (
                    div2Standings.slice(-3).map((s, idx) => (
                      <div key={s.id} className="flex items-center justify-between text-xs py-1 border-b border-border/60">
                        <span className="font-bold text-white truncate w-32">
                          #{div2Standings.length - 3 + idx + 1} {s.player?.gamerTag || "Unknown"}
                        </span>
                        <span className="font-mono text-destructive font-black">{s.points} Pts</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground italic">Need at least 4 Division 2 players.</p>
                  )}
                </div>
              </div>

              {/* Div 2 Top 3 Preview (Promoting to Div 1) */}
              <div className="p-4 rounded-2xl bg-background border border-secondary/30 space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="yellow" className="text-xs">
                    PROMOTING TO DIV 1
                  </Badge>
                  <span className="text-xs text-muted-foreground font-mono">Div 2 (Top 3)</span>
                </div>
                <div className="space-y-1.5 pt-1">
                  {div2Standings.slice(0, 3).map((s, idx) => (
                    <div key={s.id} className="flex items-center justify-between text-xs py-1 border-b border-border/60">
                      <span className="font-bold text-white truncate w-32">
                        #{idx + 1} {s.player?.gamerTag || "Unknown"}
                      </span>
                      <span className="font-mono text-secondary font-black">{s.points} Pts</span>
                    </div>
                  ))}
                  {div2Standings.length === 0 && (
                    <p className="text-xs text-muted-foreground italic">No Division 2 standings registered.</p>
                  )}
                </div>
              </div>

              {/* Div 3 Top 3 Preview (Promoting to Div 2) */}
              <div className="p-4 rounded-2xl bg-background border border-primary/30 space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs border-primary/40 text-primary">
                    PROMOTING TO DIV 2
                  </Badge>
                  <span className="text-xs text-muted-foreground font-mono">Div 3 (Top 3)</span>
                </div>
                <div className="space-y-1.5 pt-1">
                  {div3Standings.slice(0, 3).map((s, idx) => (
                    <div key={s.id} className="flex items-center justify-between text-xs py-1 border-b border-border/60">
                      <span className="font-bold text-white truncate w-32">
                        #{idx + 1} {s.player?.gamerTag || "Unknown"}
                      </span>
                      <span className="font-mono text-primary font-black">{s.points} Pts</span>
                    </div>
                  ))}
                  {div3Standings.length === 0 && (
                    <p className="text-xs text-muted-foreground italic">No Division 3 standings registered.</p>
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
          <div className="rounded-3xl border border-secondary/30 bg-gradient-to-r from-secondary/30 via-background to-background p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
            <div>
              <div className="flex items-center gap-2 text-secondary">
                <UserCheck className="h-6 w-6" />
                <h3 className="text-xl font-black uppercase text-white tracking-tight">Pending Athlete Approval Queue</h3>
              </div>
              <p className="text-xs text-foreground mt-1 max-w-2xl">
                Review and approve newly registered athletes. Verify their Konami eFootball Mobile ID, contact them directly on WhatsApp, assign them to their preferred division, or hold them in the official Reserve Pool.
              </p>
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              <Button
                size="sm"
                variant="outline"
                onClick={handleRefreshPending}
                disabled={refreshingPending}
                className="border-border bg-card/80 hover:bg-muted text-foreground text-xs font-bold gap-1.5"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${refreshingPending ? "animate-spin text-secondary" : ""}`} />
                <span>{refreshingPending ? "Refreshing..." : "Refresh Queue"}</span>
              </Button>
              <Badge variant="yellow" className="text-xs px-3 py-1 font-mono font-black">
                {pendingPlayers.length} Awaiting Approval
              </Badge>
            </div>
          </div>

          {/* Division Roster Live Capacity Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-primary/30 bg-background/80 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-primary uppercase tracking-wider">Division 1 (Premiership)</span>
                <Badge
                  variant={activeDiv1Count >= div1Max ? "destructive" : activeDiv1Count >= div1Max * 0.8 ? "yellow" : "secondary"}
                  className="text-xs font-mono"
                >
                  {activeDiv1Count >= div1Max ? "FULL" : `${div1Max - activeDiv1Count} Open Slots`}
                </Badge>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-white">{activeDiv1Count} <span className="text-xs font-normal text-muted-foreground">/ {div1Max} players</span></span>
                <span className="text-xs font-mono text-muted-foreground">{Math.round((activeDiv1Count / Math.max(1, div1Max)) * 100)}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${activeDiv1Count >= div1Max ? "bg-destructive" : activeDiv1Count >= div1Max * 0.8 ? "bg-secondary" : "bg-primary"}`}
                  // eslint-disable-next-line shadcn/no-inline-styles -- dynamic 0-100% width has no static token equivalent
                  style={{ width: `${Math.min(100, Math.round((activeDiv1Count / Math.max(1, div1Max)) * 100))}%` }}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-secondary/30 bg-background/80 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-secondary uppercase tracking-wider">Division 2 (Championship)</span>
                <Badge
                  variant={activeDiv2Count >= div2Max ? "destructive" : activeDiv2Count >= div2Max * 0.8 ? "yellow" : "secondary"}
                  className="text-xs font-mono"
                >
                  {activeDiv2Count >= div2Max ? "FULL" : `${div2Max - activeDiv2Count} Open Slots`}
                </Badge>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-white">{activeDiv2Count} <span className="text-xs font-normal text-muted-foreground">/ {div2Max} players</span></span>
                <span className="text-xs font-mono text-muted-foreground">{Math.round((activeDiv2Count / Math.max(1, div2Max)) * 100)}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${activeDiv2Count >= div2Max ? "bg-destructive" : activeDiv2Count >= div2Max * 0.8 ? "bg-secondary" : "bg-secondary"}`}
                  // eslint-disable-next-line shadcn/no-inline-styles -- dynamic 0-100% width has no static token equivalent
                  style={{ width: `${Math.min(100, Math.round((activeDiv2Count / Math.max(1, div2Max)) * 100))}%` }}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-primary/30 bg-background/80 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-primary uppercase tracking-wider">Division 3 (Conference)</span>
                <Badge
                  variant={activeDiv3Count >= div3Max ? "destructive" : activeDiv3Count >= div3Max * 0.8 ? "yellow" : "secondary"}
                  className="text-xs font-mono"
                >
                  {activeDiv3Count >= div3Max ? "FULL" : `${div3Max - activeDiv3Count} Open Slots`}
                </Badge>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-white">{activeDiv3Count} <span className="text-xs font-normal text-muted-foreground">/ {div3Max} players</span></span>
                <span className="text-xs font-mono text-muted-foreground">{Math.round((activeDiv3Count / Math.max(1, div3Max)) * 100)}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${activeDiv3Count >= div3Max ? "bg-destructive" : activeDiv3Count >= div3Max * 0.8 ? "bg-secondary" : "bg-primary"}`}
                  // eslint-disable-next-line shadcn/no-inline-styles -- dynamic 0-100% width has no static token equivalent
                  style={{ width: `${Math.min(100, Math.round((activeDiv3Count / Math.max(1, div3Max)) * 100))}%` }}
                />
              </div>
            </div>
          </div>

          {/* Filtering, Search & Batch Control Toolbar */}
          <div className="rounded-2xl border border-border bg-background/70 p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
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
                        ? "bg-primary text-white shadow-md"
                        : "bg-card text-muted-foreground hover:text-white hover:bg-muted border border-border"
                    }`}
                  >
                    <span>{div === "ALL" ? "All Requested" : div}</span>
                    <span
                      className={`text-xs font-mono px-1.5 py-0.2 rounded-full ${
                        isSelected ? "bg-primary text-white" : "bg-muted text-muted-foreground"
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
              <div className="relative w-56">
                <Search className="h-3.5 w-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search athlete, WA, ID..."
                  value={pendingSearch}
                  onChange={(e) => setPendingSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-card border border-border text-xs text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                />
                {pendingSearch && (
                  <button
                    onClick={() => setPendingSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white text-xs font-bold"
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
                    className="bg-primary hover:bg-primary text-white text-xs font-bold whitespace-nowrap shadow-md"
                  >
                    <UserPlus className="h-3.5 w-3.5 mr-1" />
                    {batchApproving ? "Processing..." : `Batch Admit All (${pendingPlayers.length})`}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={batchApproving}
                    onClick={() => handleBatchApprovePending("RESERVE")}
                    className="border-secondary/40 text-secondary hover:bg-secondary/40 text-xs font-bold whitespace-nowrap"
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
            <div className="rounded-3xl border border-border bg-background/60 p-12 text-center">
              <CheckCircle2 className="h-12 w-12 text-primary mx-auto mb-3 opacity-60" />
              <h4 className="text-base font-bold text-white uppercase">Queue is Clear</h4>
              <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                There are no pending registrations awaiting review. All registered players have been either assigned to a division or placed into the reserve pool.
              </p>
            </div>
          ) : filteredPendingPlayers.length === 0 ? (
            <div className="rounded-3xl border border-border bg-background/60 p-10 text-center space-y-2">
              <Search className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
              <h4 className="text-sm font-bold text-white uppercase">No Athletes Match Filter</h4>
              <p className="text-xs text-muted-foreground">
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
                    className="rounded-2xl border border-border bg-background/90 p-5 space-y-4 hover:border-border transition-all shadow-xl flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      {/* Top Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary/10 border border-secondary/30 text-secondary font-black text-sm shrink-0">
                            {p.gamerTag.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="text-base font-black text-white leading-tight">{p.gamerTag}</h4>
                            <p className="text-xs text-muted-foreground font-medium">{p.fullName}</p>
                          </div>
                        </div>
                        <Badge variant="yellow" className="text-xs shrink-0 font-bold">
                          Pending
                        </Badge>
                      </div>

                      {/* Information Grid */}
                      <div className="p-3.5 rounded-xl bg-card/90 border border-border/90 space-y-2 text-xs">
                        {/* Konami eFootball Mobile ID */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-muted-foreground flex items-center gap-1.5">
                            <span>eFootball ID:</span>
                          </span>
                          <div className="flex items-center gap-1.5 font-mono text-xs">
                            <span className="text-primary font-semibold truncate w-36" title={p.efootballId}>
                              {p.efootballId || "N/A"}
                            </span>
                            {p.efootballId && (
                              <button
                                onClick={() => handleCopyKonamiId(p.id, p.efootballId)}
                                title="Copy eFootball ID"
                                className="text-muted-foreground hover:text-white transition-colors p-1"
                              >
                                {isCopied ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* WhatsApp with click-to-chat */}
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground flex items-center gap-1.5">
                            <Phone className="h-3 w-3 text-primary" />
                            <span>WhatsApp:</span>
                          </span>
                          {cleanWa ? (
                            <a
                              href={`https://wa.me/${cleanWa}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-mono text-primary font-bold hover:underline flex items-center gap-1"
                              title="Click to open WhatsApp chat"
                            >
                              <span>{p.whatsapp}</span>
                              <ExternalLink className="h-2.5 w-2.5 opacity-60" />
                            </a>
                          ) : (
                            <span className="font-mono text-muted-foreground">{p.whatsapp}</span>
                          )}
                        </div>

                        {/* Email */}
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground flex items-center gap-1.5">
                            <Mail className="h-3 w-3 text-primary" />
                            <span>Email:</span>
                          </span>
                          <span className="font-mono text-foreground truncate w-40" title={p.user?.email || "N/A"}>
                            {p.user?.email || "N/A"}
                          </span>
                        </div>

                        {/* Requested Division */}
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Requested:</span>
                          <span className="font-bold text-primary bg-primary/60 border border-primary/30 px-2 py-0.5 rounded-lg text-xs">
                            {p.division || "Division 1"}
                          </span>
                        </div>

                        {/* Registered On */}
                        <div className="flex items-center justify-between text-muted-foreground text-xs pt-1 border-t border-border/80">
                          <span>Registered:</span>
                          <span>{new Date(p.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                      </div>

                      {/* Division Selector & Capacity Warning */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-foreground uppercase">
                            Target Placement:
                          </label>
                          <span className={`text-xs font-mono font-bold ${isTargetFull ? "text-destructive" : "text-primary"}`}>
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
                          className={`w-full bg-card border rounded-xl px-3 py-2 text-xs text-white font-medium focus:ring-1 focus:ring-primary ${
                            isTargetFull ? "border-destructive/50" : "border-border"
                          }`}
                        >
                          <option value="Division 1">Division 1 (Premiership) [{activeDiv1Count}/{div1Max}]</option>
                          <option value="Division 2">Division 2 (Championship) [{activeDiv2Count}/{div2Max}]</option>
                          <option value="Division 3">Division 3 (Conference) [{activeDiv3Count}/{div3Max}]</option>
                        </select>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-3 border-t border-border space-y-2">
                      <Button
                        size="sm"
                        disabled={isLoading || isTargetFull}
                        onClick={() => handleApproveAthlete(p.id, "ADMIT")}
                        className={`w-full font-bold text-xs ${
                          isTargetFull
                            ? "bg-muted text-muted-foreground cursor-not-allowed"
                            : "bg-primary hover:bg-primary text-white shadow-lg"
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
                          className="border-secondary/40 text-secondary hover:bg-secondary/40 text-xs font-bold"
                        >
                          <Layers className="h-3.5 w-3.5 mr-1" />
                          Reserve Pool
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={isLoading}
                          onClick={() => handleRejectAthlete(p.id, p.gamerTag)}
                          className="text-xs font-bold bg-destructive/80 hover:bg-destructive"
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
          <div className="rounded-3xl border border-primary/30 bg-primary/10 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-primary">
                <Layers className="h-5 w-5" />
                <h3 className="text-lg font-black uppercase text-white">League Reserve Pool (Standby Roster)</h3>
              </div>
              <p className="text-xs text-foreground mt-1">
                Reserve athletes have registered and are placed on standby. They have complete access to view all division standings and league news, but are not assigned fixtures until you admit them or use them to replace an inactive player.
              </p>
            </div>
            <Badge variant="secondary" className="text-xs px-3 py-1 font-mono">
              {reservePlayers.length} In Reserve
            </Badge>
          </div>

          {reservePlayers.length === 0 ? (
            <div className="rounded-3xl border border-border bg-background/60 p-12 text-center">
              <Layers className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <h4 className="text-base font-bold text-white uppercase">Reserve Pool is Empty</h4>
              <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                No athletes are currently waiting in reserve. When excess athletes register, or when players are replaced and moved to reserve, they will appear here.
              </p>
            </div>
          ) : (
            <div className="rounded-3xl border border-border bg-background/90 overflow-hidden shadow-xl">
              <div className="p-5 border-b border-border flex items-center justify-between">
                <h3 className="text-lg font-black uppercase text-white">Standby Athletes</h3>
                <span className="text-xs font-mono text-muted-foreground">{reservePlayers.length} Total</span>
              </div>
              <div className="overflow-x-auto no-scrollbar scroll-smooth">
                <table className="w-full text-left text-xs">
                  <thead className="bg-card/80 text-xs font-black uppercase text-muted-foreground border-b border-border">
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
                  <tbody className="divide-y divide-border/60">
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
                        <tr key={p.id} className="hover:bg-card/40">
                          <td className="px-4 py-3 font-bold text-white">{p.gamerTag}</td>
                          <td className="px-4 py-3 text-foreground">{p.fullName}</td>
                          <td className="px-4 py-3 font-mono text-primary">
                            <div className="flex items-center gap-1">
                              <span>{p.efootballId || "N/A"}</span>
                              {p.efootballId && (
                                <button
                                  onClick={() => handleCopyKonamiId(p.id, p.efootballId)}
                                  title="Copy eFootball ID"
                                  className="text-muted-foreground hover:text-white p-0.5"
                                >
                                  {isCopied ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
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
                                className="text-primary font-semibold hover:underline flex items-center gap-1"
                              >
                                <span>{p.whatsapp}</span>
                                <ExternalLink className="h-2.5 w-2.5 opacity-60" />
                              </a>
                            ) : (
                              <span className="text-muted-foreground">{p.whatsapp}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 font-mono text-muted-foreground">{p.user?.email || "N/A"}</td>
                          <td className="px-4 py-3">
                            <select
                              value={currentSelection}
                              onChange={(e) =>
                                setPendingDivSelection((prev) => ({
                                  ...prev,
                                  [p.id]: e.target.value,
                                }))
                              }
                              className="bg-card border border-border rounded-lg px-2.5 py-1 text-xs text-white"
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
                                className="h-7 px-3 bg-primary hover:bg-primary text-white text-xs font-bold"
                              >
                                <UserCheck className="h-3 w-3 mr-1" />
                                {isTargetFull ? "Full" : `Admit to ${currentSelection}`}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                disabled={isLoading}
                                onClick={() => handleRemoveAthlete(p.id, p.gamerTag)}
                                className="h-7 px-2 text-xs font-bold bg-destructive/80 hover:bg-destructive"
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-primary/40 bg-gradient-to-r from-primary/40 via-background to-background shadow-xl">
            <div>
              <h3 className="text-base font-black uppercase text-white flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                <span>One-Click Standings Synchronization</span>
              </h3>
              <p className="text-xs text-foreground mt-1">
                Recalculates points, wins, draws, losses, goals, and rankings across all division tables simultaneously from all approved finished matches.
              </p>
            </div>
            <Button
              onClick={() => handleRecalculateStandings("ALL")}
              disabled={recalculatingStandings}
              className="bg-primary hover:bg-primary text-white font-black text-xs uppercase tracking-wider px-5 py-2.5 shadow-lg shrink-0"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${recalculatingStandings ? "animate-spin" : ""}`} />
              {recalculatingStandings ? "Updating Tables..." : "⚡ Update League Table Standings"}
            </Button>
          </div>

          {/* Relegations & Promotions Commissioner Trigger Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl border border-border bg-card/80 shadow-xl">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="yellow" className="text-xs font-black">
                  RELEGATION & PROMOTION DISPATCH
                </Badge>
                <span className="text-xs font-mono text-muted-foreground">Commissioner Authority</span>
              </div>
              <h3 className="text-base font-black uppercase text-white flex items-center gap-2">
                <ArrowDown className="h-4 w-4 text-secondary" />
                <span>Trigger Official Division Relegations & Promotions</span>
              </h3>
              <p className="text-xs text-foreground">
                • <strong>Div 1</strong>: Bottom 3 relegated to Div 2 &bull; <strong>Div 2</strong>: Bottom 3 relegated to Div 3, Top 3 promoted to Div 1 &bull; <strong>Div 3</strong>: Top 3 promoted to Div 2.<br />
                Relegated players automatically transition their portal and calendar access to their new division.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <Button
                onClick={() => handleExecuteSeasonTransition("RELEGATE_ONLY")}
                disabled={actionLoading}
                className="bg-destructive hover:bg-destructive text-white font-black text-xs uppercase tracking-wider px-4 py-2.5 shadow-lg"
                title="Move bottom 3 players in Division 1 to Division 2, and bottom 3 in Division 2 to Division 3"
              >
                <ArrowDown className="h-3.5 w-3.5 mr-1" />
                Relegate Bottom 3
              </Button>
              <Button
                onClick={() => handleExecuteSeasonTransition("ALL")}
                disabled={actionLoading}
                className="bg-gradient-to-r from-secondary to-secondary hover:from-secondary hover:to-secondary text-secondary-foreground font-black text-xs uppercase tracking-wider px-4 py-2.5 shadow-lg"
                title="Execute both promotions and relegations in one transaction"
              >
                <Sparkles className="h-3.5 w-3.5 mr-1" />
                Full Season Transition
              </Button>
            </div>
          </div>

          {/* Table Sub-Navigation */}
          <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
            <button
              onClick={() => setTableSubTab("DIV1")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                tableSubTab === "DIV1"
                  ? "bg-primary text-white shadow-lg"
                  : "text-muted-foreground hover:text-white hover:bg-card"
              }`}
            >
              Division 1 (Premiership)
            </button>

            <button
              onClick={() => setTableSubTab("DIV2")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                tableSubTab === "DIV2"
                  ? "bg-secondary text-secondary-foreground shadow-lg font-black"
                  : "text-muted-foreground hover:text-white hover:bg-card"
              }`}
            >
              Division 2 (Championship)
            </button>

            <button
              onClick={() => setTableSubTab("DIV3")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                tableSubTab === "DIV3"
                  ? "bg-primary text-white shadow-lg"
                  : "text-muted-foreground hover:text-white hover:bg-card"
              }`}
            >
              Division 3 (Academy)
            </button>

            <button
              onClick={() => setTableSubTab("UCL")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                tableSubTab === "UCL"
                  ? "bg-primary text-white shadow-lg"
                  : "text-muted-foreground hover:text-white hover:bg-card"
              }`}
            >
              <Trophy className="h-3.5 w-3.5" />
              <span>UCL Groups</span>
              {!leagueConfig.uclStarted && <Lock className="h-3 w-3 text-muted-foreground" />}
            </button>

            <button
              onClick={() => setTableSubTab("EUROPA")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                tableSubTab === "EUROPA"
                  ? "bg-secondary text-secondary-foreground font-black shadow-lg"
                  : "text-muted-foreground hover:text-white hover:bg-card"
              }`}
            >
              <Globe className="h-3.5 w-3.5" />
              <span>Europa Groups</span>
              {!leagueConfig.europaStarted && <Lock className="h-3 w-3 text-muted-foreground" />}
            </button>
          </div>

          {/* Division 1 Table */}
          {tableSubTab === "DIV1" && renderStandingsTable("Division 1 Premiership Standings", div1Standings, "bg-primary", div1Max)}

          {/* Division 2 Table */}
          {tableSubTab === "DIV2" && renderStandingsTable("Division 2 Championship Standings", div2Standings, "bg-secondary", div2Max)}

          {/* Division 3 Table */}
          {tableSubTab === "DIV3" && renderStandingsTable("Division 3 Academy Standings", div3Standings, "bg-primary", div3Max)}

          {/* UCL Tables */}
          {tableSubTab === "UCL" && (
            <div className="space-y-6">
              {!leagueConfig.uclStarted ? (
                <div className="rounded-3xl border border-border bg-background/90 p-8 text-center space-y-4">
                  <div className="inline-flex p-4 rounded-2xl bg-primary/10 border border-primary/30 text-primary">
                    <Lock className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-black uppercase text-white">eFootball Champions League is Locked</h3>
                  <p className="text-xs text-muted-foreground max-w-md mx-auto">
                    UCL is locked by default until the league season ends. As administrator, you can inaugurate the UCL competition below.
                  </p>
                  <Button
                    onClick={() => handleToggleCompetition("UCL", true)}
                    disabled={actionLoading}
                    className="bg-primary hover:bg-primary text-white font-bold text-xs uppercase"
                  >
                    Unlock & Start UCL Now
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-black uppercase text-white flex items-center gap-2">
                        <Trophy className="h-6 w-6 text-secondary" />
                        <span>eFootball Champions League (UCL) Group Stage</span>
                      </h3>
                      <p className="text-xs text-muted-foreground">
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
                          className="rounded-2xl border border-primary/30 bg-background/80 p-5 space-y-3"
                        >
                          <div className="flex items-center justify-between border-b border-border pb-2">
                            <span className="text-sm font-black uppercase text-primary">{grpName}</span>
                            <span className="text-xs font-mono text-muted-foreground">{groupSlots.length}/4 Players</span>
                          </div>

                          <div className="space-y-2">
                            {groupSlots.length === 0 ? (
                              <p className="text-xs text-muted-foreground py-3 text-center">Awaiting player votes or seeded draw...</p>
                            ) : (
                              groupSlots.map((slot, pIdx) => (
                                <div
                                  key={slot.id}
                                  className="flex items-center justify-between rounded-xl bg-card/60 p-2.5 text-xs border border-border/80"
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-muted-foreground text-xs">{pIdx + 1}.</span>
                                    <div className="w-5 h-5 rounded-full bg-background border border-border/80 p-0.5 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                                      <img
                                        src={resolvePlayerAvatar(slot.player)}
                                        alt={slot.player?.realTeam || slot.player?.gamerTag || "Team"}
                                        className="w-full h-full object-contain"
                                        onError={(e) => {
                                          (e.currentTarget as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(slot.player?.gamerTag || "player")}`;
                                        }}
                                      />
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-1.5">
                                        <span className="font-bold text-white block">{slot.player.gamerTag}</span>
                                        {slot.player.realTeam && (
                                          <span className="text-xs text-secondary font-bold">
                                            ({findTeam(slot.player.realTeam)?.shortName || slot.player.realTeam})
                                          </span>
                                        )}
                                      </div>
                                      <span className="text-xs text-muted-foreground">{slot.player.efootballId}</span>
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
                                    className="text-xs"
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
                <div className="rounded-3xl border border-border bg-background/90 p-8 text-center space-y-4">
                  <div className="inline-flex p-4 rounded-2xl bg-secondary/10 border border-secondary/30 text-secondary">
                    <Lock className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-black uppercase text-white">eFootball Europa League is Locked</h3>
                  <p className="text-xs text-muted-foreground max-w-md mx-auto">
                    Europa League is locked by default until inaugurated by the administrator.
                  </p>
                  <Button
                    onClick={() => handleToggleCompetition("EUROPA", true)}
                    disabled={actionLoading}
                    className="bg-secondary hover:bg-secondary text-white font-bold text-xs uppercase"
                  >
                    Unlock & Start Europa League Now
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-black uppercase text-white flex items-center gap-2">
                        <Globe className="h-6 w-6 text-secondary" />
                        <span>eFootball Europa League (UEL) Group Stage</span>
                      </h3>
                      <p className="text-xs text-muted-foreground">
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
                          className="rounded-2xl border border-secondary/30 bg-background/80 p-5 space-y-3"
                        >
                          <div className="flex items-center justify-between border-b border-border pb-2">
                            <span className="text-sm font-black uppercase text-secondary">{grpName}</span>
                            <span className="text-xs font-mono text-muted-foreground">{groupSlots.length}/4 Players</span>
                          </div>

                          <div className="space-y-2">
                            {groupSlots.length === 0 ? (
                              <p className="text-xs text-muted-foreground py-3 text-center">Awaiting player votes or seeded draw...</p>
                            ) : (
                              groupSlots.map((slot, pIdx) => (
                                <div
                                  key={slot.id}
                                  className="flex items-center justify-between rounded-xl bg-card/60 p-2.5 text-xs border border-border/80"
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-muted-foreground text-xs">{pIdx + 1}.</span>
                                    <div className="w-5 h-5 rounded-full bg-background border border-border/80 p-0.5 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                                      <img
                                        src={resolvePlayerAvatar(slot.player)}
                                        alt={slot.player?.realTeam || slot.player?.gamerTag || "Team"}
                                        className="w-full h-full object-contain"
                                        onError={(e) => {
                                          (e.currentTarget as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(slot.player?.gamerTag || "player")}`;
                                        }}
                                      />
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-1.5">
                                        <span className="font-bold text-white block">{slot.player.gamerTag}</span>
                                        {slot.player.realTeam && (
                                          <span className="text-xs text-secondary font-bold">
                                            ({findTeam(slot.player.realTeam)?.shortName || slot.player.realTeam})
                                          </span>
                                        )}
                                      </div>
                                      <span className="text-xs text-muted-foreground">{slot.player.efootballId}</span>
                                    </div>
                                  </div>
                                  <Badge variant="yellow" className="text-xs">
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
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl border border-border bg-background/90 shadow-2xl backdrop-blur-xl">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="yellow">SEASON FIXTURES HUB</Badge>
                <Badge variant="secondary">{matches.length} Total Matches Generated</Badge>
              </div>
              <h2 className="text-xl sm:text-2xl font-black uppercase text-white tracking-tight flex items-center gap-2">
                <Calendar className="h-6 w-6 text-primary" />
                <span>All Generated Matches & Schedule Controls</span>
              </h2>
              <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
                Browse every fixture generated for the league. Reset generated matches, extend late submission deadlines, inspect score proofs, and trigger table updates.
              </p>
            </div>

            {/* Master Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <Button
                onClick={() => handleResetTournament("ALL")}
                disabled={resettingTournament}
                variant="destructive"
                className="font-black text-xs uppercase tracking-wider gap-2 shadow-lg"
              >
                <RotateCcw className={`h-4 w-4 ${resettingTournament ? "animate-spin" : ""}`} />
                {resettingTournament ? "Resetting Matches..." : "Reset All Generated Matches"}
              </Button>

              <Button
                onClick={() => handleRecalculateStandings("ALL")}
                disabled={recalculatingStandings}
                className="bg-primary hover:bg-primary text-white font-black text-xs uppercase tracking-wider gap-2 shadow-lg"
              >
                <RefreshCw className={`h-4 w-4 ${recalculatingStandings ? "animate-spin" : ""}`} />
                {recalculatingStandings ? "Updating..." : "⚡ Update League Table Standings"}
              </Button>
            </div>
          </div>

          {/* Quick Division Reset Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl border border-primary/30 bg-background/80 space-y-2 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-primary">Division 1 Fixtures</span>
                  <Badge variant="secondary" className="text-xs font-mono">
                    {matches.filter((m: any) => m.division === "Division 1").length} Matches
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Premiership scheduled fixtures & standings.</p>
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

            <div className="p-4 rounded-2xl border border-secondary/30 bg-background/80 space-y-2 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-secondary">Division 2 Fixtures</span>
                  <Badge variant="secondary" className="text-xs font-mono">
                    {matches.filter((m: any) => m.division === "Division 2").length} Matches
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Championship scheduled fixtures & standings.</p>
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

            <div className="p-4 rounded-2xl border border-primary/30 bg-background/80 space-y-2 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-primary">Division 3 Fixtures</span>
                  <Badge variant="secondary" className="text-xs font-mono">
                    {matches.filter((m: any) => m.division === "Division 3").length} Matches
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">National Academy scheduled fixtures & standings.</p>
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
          <div className="rounded-2xl border border-border bg-background/90 p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-xl">
            <div className="flex flex-wrap items-center gap-2">
              {/* Round filter */}
              <select
                value={allMatchesFilterRound}
                onChange={(e) => setAllMatchesFilterRound(e.target.value)}
                className="bg-card border border-border text-xs font-bold text-white rounded-xl px-3 py-2 focus:outline-none focus:border-primary"
              >
                <option value="ALL">All Matchday Rounds</option>
                {Array.from(new Set(matches.map((m: any) => m.round)))
                  .filter(Boolean)
                  .sort((a: any, b: any) => {
                    const numA = parseInt(String(a).replace(/\D/g, "") || "0", 10);
                    const numB = parseInt(String(b).replace(/\D/g, "") || "0", 10);
                    return numA - numB;
                  })
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
                className="bg-card border border-border text-xs font-bold text-white rounded-xl px-3 py-2 focus:outline-none focus:border-primary"
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
                className="bg-card border border-border text-xs font-bold text-white rounded-xl px-3 py-2 focus:outline-none focus:border-primary"
              >
                <option value="ALL">All Statuses</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="LIVE">Live Window</option>
                <option value="FINISHED">Finished / Approved</option>
                <option value="FORFEIT">Forfeit Walkover</option>
              </select>
            </div>

            {/* Search Input */}
            <div className="relative w-60">
              <Search className="h-3.5 w-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search athlete, WA, ID..."
                value={allMatchesSearch}
                onChange={(e) => setAllMatchesSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-card border border-border text-xs text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary"
              />
              {allMatchesSearch && (
                <button
                  onClick={() => setAllMatchesSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white text-xs font-bold"
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
                <div className="rounded-3xl border border-border bg-background/80 p-12 text-center space-y-3">
                  <Calendar className="h-10 w-10 mx-auto text-muted-foreground" />
                  <p className="font-bold text-foreground">No generated matches found matching your filters.</p>
                  <p className="text-xs text-muted-foreground">
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
                <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
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
                        className="rounded-2xl border border-border bg-background/90 p-5 space-y-4 shadow-xl hover:border-border transition"
                      >
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-border/80 pb-3">
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
                              <Badge variant="secondary" className="text-xs text-primary bg-primary/30 border-primary/30">
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
                              className="text-xs"
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
                            <span className="text-xs font-bold uppercase text-muted-foreground block">HOME</span>
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 rounded-full bg-card border border-border/80 p-0.5 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                                <img
                                  src={resolvePlayerAvatar(m.homePlayer)}
                                  alt={m.homePlayer?.realTeam || m.homePlayer?.gamerTag || "Home"}
                                  className="w-full h-full object-contain"
                                  onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(m.homePlayer?.gamerTag || "player")}`;
                                  }}
                                />
                              </div>
                              <span className="font-black text-white text-sm block truncate">
                                {m.homePlayer?.gamerTag}
                              </span>
                              {m.homePlayer?.realTeam && (
                                <span className="text-xs text-secondary font-bold shrink-0">
                                  ({findTeam(m.homePlayer.realTeam)?.shortName || m.homePlayer.realTeam})
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground block font-mono pl-7">
                              {m.homePlayer?.efootballId || "No ID"}
                            </span>
                          </div>

                          {/* Score Box */}
                          <div className="col-span-2 flex flex-col items-center justify-center p-2 rounded-xl bg-card border border-border">
                            {isFinished || isForfeit ? (
                              <span className="text-base font-black font-mono text-primary">
                                {m.homeScore} - {m.awayScore}
                              </span>
                            ) : sub ? (
                              <div>
                                <span className="text-sm font-black font-mono text-secondary">
                                  {sub.homeScore} - {sub.awayScore}
                                </span>
                                <span className="text-xs text-secondary uppercase block font-mono">Pending</span>
                              </div>
                            ) : (
                              <span className="text-xs font-black text-muted-foreground font-mono">VS</span>
                            )}
                          </div>

                          {/* Away Player */}
                          <div className="col-span-5 text-right space-y-0.5">
                            <span className="text-xs font-bold uppercase text-muted-foreground block">AWAY</span>
                            <div className="flex items-center justify-end gap-2">
                              {m.awayPlayer?.realTeam && (
                                <span className="text-xs text-secondary font-bold shrink-0">
                                  ({findTeam(m.awayPlayer.realTeam)?.shortName || m.awayPlayer.realTeam})
                                </span>
                              )}
                              <span className="font-black text-white text-sm block truncate">
                                {m.awayPlayer?.gamerTag}
                              </span>
                              <div className="w-5 h-5 rounded-full bg-card border border-border/80 p-0.5 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                                <img
                                  src={resolvePlayerAvatar(m.awayPlayer)}
                                  alt={m.awayPlayer?.realTeam || m.awayPlayer?.gamerTag || "Away"}
                                  className="w-full h-full object-contain"
                                  onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(m.awayPlayer?.gamerTag || "player")}`;
                                  }}
                                />
                              </div>
                            </div>
                            <span className="text-xs text-muted-foreground block font-mono pr-7">
                              {m.awayPlayer?.efootballId || "No ID"}
                            </span>
                          </div>
                        </div>

                        {/* Deadline & Admin Controls */}
                        <div className="flex items-center justify-between pt-2 border-t border-border text-xs">
                          <span className="text-xs font-mono text-muted-foreground">
                            Deadline: {new Date(m.deadlineDate).toLocaleDateString()}
                          </span>

                          <div className="flex items-center gap-2">
                            {hasScreenshot && (
                              <button
                                type="button"
                                onClick={() => setInspectImage(screenshotToInspect)}
                                className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-primary py-1 px-2 rounded-lg bg-card border border-border"
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
                              className="text-xs h-7 px-2.5 font-bold border-primary/40 text-primary hover:bg-primary/30"
                            >
                              <Clock className="h-3 w-3 mr-1" />
                              Extend Deadline
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleReopenSubmissions(m.id)}
                              disabled={reopeningMatchId === m.id}
                              className="text-xs h-7 px-2.5 font-bold border-primary/40 text-primary hover:bg-primary/30"
                              title="Reopen submission and forfeit buttons for both athletes"
                            >
                              <Unlock className="h-3 w-3 mr-1" />
                              {reopeningMatchId === m.id ? "Reopening..." : "Reopen Submissions"}
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
          <div className="rounded-3xl border border-border bg-background/90 p-6 sm:p-8 backdrop-blur-xl shadow-xl space-y-6">
            <div>
              <h3 className="text-xl font-black uppercase text-white flex items-center gap-2">
                <Globe className="h-6 w-6 text-secondary" />
                <span>Continental Cups Administration & Group Voting Constraints</span>
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Official Rule: <em>No players who were in the same division can choose or share the same group</em> in either UCL or Europa League.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* UCL Card */}
              <div className="rounded-2xl border border-primary/30 bg-card/60 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-primary" />
                    <span className="font-black uppercase text-white">eFootball UCL</span>
                  </div>
                  <Badge variant={leagueConfig.uclStarted ? "secondary" : "destructive"}>
                    {leagueConfig.uclStarted ? "UNLOCKED / ACTIVE" : "LOCKED"}
                  </Badge>
                </div>
                <p className="text-xs text-foreground">
                  16 Total Players: <strong>Top 8 from Division 1</strong>, <strong>Top 4 from Division 2</strong>, <strong>Top 4 from Division 3</strong>.
                </p>

                {/* Schedule Draw Event Controls */}
                <div className="p-3.5 rounded-xl bg-background/80 border border-border space-y-2">
                  {!leagueConfig.uclStarted && (
                    <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive flex items-center gap-2">
                      <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" />
                      <span>UCL is currently <strong>LOCKED</strong>. Click &quot;Unlock UCL&quot; below once domestic qualifications conclude before scheduling or launching draws.</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-primary flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-primary" />
                      UCL Draw Date & Time
                    </span>
                    {leagueConfig.uclDrawTime && (
                      <Badge variant="secondary" className="text-xs font-mono">
                        {new Date(leagueConfig.uclDrawTime).toLocaleDateString()} {new Date(leagueConfig.uclDrawTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="datetime-local"
                      value={uclDrawInput}
                      onChange={(e) => setUclDrawInput(e.target.value)}
                      disabled={actionLoading || !leagueConfig.uclStarted}
                      className="bg-card border-border text-xs text-white disabled:opacity-50"
                    />
                    <Button
                      onClick={() => handleScheduleDraw("UCL", uclDrawInput)}
                      disabled={actionLoading || !leagueConfig.uclStarted}
                      size="sm"
                      variant="outline"
                      className="text-xs shrink-0 font-bold border-primary/40 text-primary hover:bg-primary hover:text-white disabled:opacity-40"
                    >
                      Schedule Event
                    </Button>
                  </div>
                  <div className="flex flex-col gap-2 pt-1">
                    <Button
                      type="button"
                      onClick={() => handleLaunchLiveDraw("UCL")}
                      disabled={actionLoading || !leagueConfig.uclStarted}
                      className="w-full bg-gradient-to-r from-primary via-primary to-primary hover:brightness-110 text-white font-black text-xs gap-2 py-2.5 rounded-xl shadow-lg disabled:opacity-40 disabled:pointer-events-none"
                    >
                      <Sparkles className="h-4 w-4 text-secondary animate-pulse" />
                      <span>Launch Official UCL Animated Draws System</span>
                    </Button>
                    <div className="flex items-center justify-between text-xs px-1">
                      <span className="text-muted-foreground font-mono">Commissioners Only</span>
                      <button
                        onClick={() => handleResetDraw("UCL")}
                        className="text-xs text-destructive hover:underline"
                      >
                        Reset Draw Slots
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border">
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
                      className="bg-primary hover:bg-primary text-white text-xs font-bold"
                    >
                      Unlock UCL
                    </Button>
                  )}

                  <Button
                    onClick={() => handleAutoDraw("UCL")}
                    disabled={actionLoading || !leagueConfig.uclStarted}
                    variant="outline"
                    size="sm"
                    className="text-xs font-bold gap-1"
                  >
                    <Shuffle className="h-3 w-3" /> Quick Seeded Draw
                  </Button>
                </div>

                {/* Fixture & Knockout Stage Controllers */}
                <div className="pt-2 border-t border-border space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                    Fixture & Knockout Controllers:
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={() => handleGenerateContinentalFixtures("UCL", "GROUP")}
                      disabled={actionLoading || !leagueConfig.uclStarted}
                      variant="outline"
                      size="sm"
                      className="text-xs font-bold border-primary/40 text-primary hover:bg-primary hover:text-white"
                    >
                      1. Generate Group Stage (2-Leg)
                    </Button>
                    <Button
                      onClick={() => handleGenerateContinentalFixtures("UCL", "QUARTER_FINAL")}
                      disabled={actionLoading || !leagueConfig.uclStarted}
                      variant="outline"
                      size="sm"
                      className="text-xs font-bold border-primary/40 text-primary hover:bg-primary hover:text-white"
                    >
                      2. Advance to Quarter-Finals
                    </Button>
                    <Button
                      onClick={() => handleGenerateContinentalFixtures("UCL", "SEMI_FINAL")}
                      disabled={actionLoading || !leagueConfig.uclStarted}
                      variant="outline"
                      size="sm"
                      className="text-xs font-bold border-primary/40 text-primary hover:bg-primary hover:text-white"
                    >
                      3. Advance to Semi-Finals
                    </Button>
                    <Button
                      onClick={() => handleGenerateContinentalFixtures("UCL", "FINAL")}
                      disabled={actionLoading || !leagueConfig.uclStarted}
                      variant="default"
                      size="sm"
                      className="text-xs font-bold bg-secondary text-secondary-foreground hover:bg-secondary font-black"
                    >
                      4. Generate Final & Poll
                    </Button>
                  </div>
                </div>
              </div>

              {/* Europa Card */}
              <div className="rounded-2xl border border-secondary/30 bg-card/60 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-secondary" />
                    <span className="font-black uppercase text-white">eFootball Europa League</span>
                  </div>
                  <Badge variant={leagueConfig.europaStarted ? "yellow" : "destructive"}>
                    {leagueConfig.europaStarted ? "UNLOCKED / ACTIVE" : "LOCKED"}
                  </Badge>
                </div>
                <p className="text-xs text-foreground">
                  16 Total Players: <strong>Div 1 (ranks 9-12)</strong>, <strong>Div 2 (ranks 5-10)</strong>, <strong>Div 3 (ranks 5-10)</strong>.
                </p>

                {/* Schedule Draw Event Controls */}
                <div className="p-3.5 rounded-xl bg-background/80 border border-border space-y-2">
                  {!leagueConfig.europaStarted && (
                    <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive flex items-center gap-2">
                      <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" />
                      <span>Europa League is currently <strong>LOCKED</strong>. Click &quot;Unlock Europa&quot; below once domestic qualifications conclude before scheduling or launching draws.</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-secondary flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-secondary" />
                      Europa Draw Date & Time
                    </span>
                    {leagueConfig.europaDrawTime && (
                      <Badge variant="secondary" className="text-xs font-mono">
                        {new Date(leagueConfig.europaDrawTime).toLocaleDateString()} {new Date(leagueConfig.europaDrawTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="datetime-local"
                      value={europaDrawInput}
                      onChange={(e) => setEuropaDrawInput(e.target.value)}
                      disabled={actionLoading || !leagueConfig.europaStarted}
                      className="bg-card border-border text-xs text-white disabled:opacity-50"
                    />
                    <Button
                      onClick={() => handleScheduleDraw("EUROPA", europaDrawInput)}
                      disabled={actionLoading || !leagueConfig.europaStarted}
                      size="sm"
                      variant="outline"
                      className="text-xs shrink-0 font-bold border-secondary/40 text-secondary hover:bg-secondary hover:text-white disabled:opacity-40"
                    >
                      Schedule Event
                    </Button>
                  </div>
                  <div className="flex flex-col gap-2 pt-1">
                    <Button
                      type="button"
                      onClick={() => handleLaunchLiveDraw("EUROPA")}
                      disabled={actionLoading || !leagueConfig.europaStarted}
                      className="w-full bg-gradient-to-r from-secondary via-secondary to-secondary hover:brightness-110 text-white font-black text-xs gap-2 py-2.5 rounded-xl shadow-lg disabled:opacity-40 disabled:pointer-events-none"
                    >
                      <Sparkles className="h-4 w-4 text-secondary animate-pulse" />
                      <span>Launch Official Europa Animated Draws System</span>
                    </Button>
                    <div className="flex items-center justify-between text-xs px-1">
                      <span className="text-muted-foreground font-mono">Commissioners Only</span>
                      <button
                        onClick={() => handleResetDraw("EUROPA")}
                        className="text-xs text-destructive hover:underline"
                      >
                        Reset Draw Slots
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border">
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
                      className="bg-secondary hover:bg-secondary text-white text-xs font-bold"
                    >
                      Unlock & Launch Europa Draws
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

                {/* Fixture & Knockout Stage Controllers */}
                <div className="pt-2 border-t border-border space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                    Fixture & Knockout Controllers:
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={() => handleGenerateContinentalFixtures("EUROPA", "GROUP")}
                      disabled={actionLoading || !leagueConfig.europaStarted}
                      variant="outline"
                      size="sm"
                      className="text-xs font-bold border-secondary/40 text-secondary hover:bg-secondary hover:text-white"
                    >
                      1. Generate Group Stage (2-Leg)
                    </Button>
                    <Button
                      onClick={() => handleGenerateContinentalFixtures("EUROPA", "QUARTER_FINAL")}
                      disabled={actionLoading || !leagueConfig.europaStarted}
                      variant="outline"
                      size="sm"
                      className="text-xs font-bold border-secondary/40 text-secondary hover:bg-secondary hover:text-white"
                    >
                      2. Advance to Quarter-Finals
                    </Button>
                    <Button
                      onClick={() => handleGenerateContinentalFixtures("EUROPA", "SEMI_FINAL")}
                      disabled={actionLoading || !leagueConfig.europaStarted}
                      variant="outline"
                      size="sm"
                      className="text-xs font-bold border-secondary/40 text-secondary hover:bg-secondary hover:text-white"
                    >
                      3. Advance to Semi-Finals
                    </Button>
                    <Button
                      onClick={() => handleGenerateContinentalFixtures("EUROPA", "FINAL")}
                      disabled={actionLoading || !leagueConfig.europaStarted}
                      variant="default"
                      size="sm"
                      className="text-xs font-bold bg-secondary text-secondary-foreground hover:bg-secondary font-black"
                    >
                      4. Generate Final & Poll
                    </Button>
                  </div>
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
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-border pb-4 gap-4">
            <div>
              <h3 className="text-lg font-black uppercase text-white tracking-wide">
                Match Results & Standings Update Hub
              </h3>
              <p className="text-xs text-muted-foreground">
                Insert match goals for all played games simultaneously. The league table recalculates once, and all users automatically receive an official standings update broadcast.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                onClick={() => handleRecalculateStandings("ALL")}
                disabled={recalculatingStandings}
                className="bg-primary hover:bg-primary text-white font-black text-xs uppercase tracking-wider px-4 py-2 shadow-lg"
              >
                <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${recalculatingStandings ? "animate-spin" : ""}`} />
                {recalculatingStandings ? "Updating Tables..." : "⚡ Update League Table Standings"}
              </Button>

              {/* Sub-tab Switcher */}
              <div className="flex items-center gap-2 bg-card/90 p-1 rounded-xl border border-border self-start md:self-auto">
              <button
                type="button"
                onClick={() => setScoreQueueSubTab("SUBMISSIONS")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                  scoreQueueSubTab === "SUBMISSIONS"
                    ? "bg-primary text-white shadow-md"
                    : "text-muted-foreground hover:text-white"
                }`}
              >
                <span>Proof Screenshots</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-xs font-black ${
                    scoreQueueSubTab === "SUBMISSIONS"
                      ? "bg-background text-primary"
                      : "bg-muted text-foreground"
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
                    ? "bg-primary text-white shadow-md"
                    : "text-muted-foreground hover:text-white"
                }`}
              >
                <span>Direct Matchday Scoring</span>
                <Badge variant="live" className="text-xs px-1 py-0">BATCH</Badge>
              </button>
            </div>
          </div>
        </div>

          {/* SUB-TAB 1: PENDING PROOF SCREENSHOTS */}
          {scoreQueueSubTab === "SUBMISSIONS" && (
            <div className="space-y-6">
              {pendingSubmissions.length > 0 && (
                <div className="rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/40 via-background to-primary/30 p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                      <span className="text-sm font-black text-white uppercase tracking-wider">
                        Simultaneous Batch Score Insertion ({pendingSubmissions.length} Pending)
                      </span>
                    </div>
                    <p className="text-xs text-foreground">
                      Verify goals in the cards below. Clicking this saves all played matches at once, recalculates all league tables in a single atomic update, and notifies all registered players.
                    </p>
                  </div>
                  <Button
                    disabled={batchLoading}
                    onClick={handleBatchApproveSubmissions}
                    className="bg-gradient-to-r from-primary to-primary hover:from-primary hover:to-primary text-white font-black px-5 py-2.5 rounded-xl text-xs gap-2 shadow-lg whitespace-nowrap"
                  >
                    {batchLoading ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-white" />
                    )}
                    Insert All {pendingSubmissions.length} Match Goals & Update Tables Once
                  </Button>
                </div>
              )}

              {pendingSubmissions.length === 0 ? (
                <div className="rounded-3xl border border-border bg-background/80 p-12 text-center text-muted-foreground space-y-3">
                  <CheckCircle2 className="h-10 w-10 mx-auto text-primary" />
                  <p className="font-bold text-foreground">Queue is clear! No pending match score screenshots to review.</p>
                  <p className="text-xs text-muted-foreground">
                    Switch to the "Direct Matchday Scoring" tab to enter goals for any matchday fixtures directly.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {pendingSubmissions.map((sub) => (
                    <div
                      key={sub.id}
                      className="rounded-2xl border border-border bg-background/90 p-5 space-y-4 shadow-xl relative"
                    >
                      <div className="flex items-center justify-between border-b border-border/80 pb-3">
                        <span className="text-xs font-mono text-primary font-bold">{sub.match.round}</span>
                        <Badge variant="live" className="text-xs">
                          Submitted by: {sub.submittedByPlayer.gamerTag}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between py-2 text-center gap-2">
                        <div className="flex-1 text-left flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-card border border-border/80 p-0.5 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                            <img
                              src={resolvePlayerAvatar(sub.match.homePlayer)}
                              alt={sub.match.homePlayer?.realTeam || sub.match.homePlayer?.gamerTag || "Home"}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(sub.match.homePlayer?.gamerTag || "player")}`;
                              }}
                            />
                          </div>
                          <div>
                            <span className="font-black text-white text-sm block">{sub.match.homePlayer.gamerTag}</span>
                            {sub.match.homePlayer?.realTeam && (
                              <span className="text-xs text-secondary font-bold block">
                                {findTeam(sub.match.homePlayer.realTeam)?.shortName || sub.match.homePlayer.realTeam}
                              </span>
                            )}
                            <span className="text-xs text-muted-foreground block">{sub.match.homePlayer.whatsapp}</span>
                          </div>
                        </div>
                        <div className="px-3 py-1 rounded-xl bg-card border border-border font-mono text-xs text-muted-foreground shrink-0">
                          Claimed: {sub.homeScore} - {sub.awayScore}
                        </div>
                        <div className="flex-1 text-right flex items-center justify-end gap-2">
                          <div>
                            <span className="font-black text-white text-sm block">{sub.match.awayPlayer.gamerTag}</span>
                            {sub.match.awayPlayer?.realTeam && (
                              <span className="text-xs text-secondary font-bold block">
                                {findTeam(sub.match.awayPlayer.realTeam)?.shortName || sub.match.awayPlayer.realTeam}
                              </span>
                            )}
                            <span className="text-xs text-muted-foreground block">{sub.match.awayPlayer.whatsapp}</span>
                          </div>
                          <div className="w-6 h-6 rounded-full bg-card border border-border/80 p-0.5 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                            <img
                              src={resolvePlayerAvatar(sub.match.awayPlayer)}
                              alt={sub.match.awayPlayer?.realTeam || sub.match.awayPlayer?.gamerTag || "Away"}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(sub.match.awayPlayer?.gamerTag || "player")}`;
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      {sub.leg2ScreenshotUrl ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-secondary">2-Legged Match Proofs (Both Legs):</span>
                            {sub.aggregateHomeScore !== null && (
                              <span className="font-mono font-bold text-primary text-xs">
                                Submitted Agg: {sub.aggregateHomeScore} - {sub.aggregateAwayScore}
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>Leg 1 Screenshot</span>
                                <button
                                  type="button"
                                  onClick={() => setInspectImage(sub.screenshotUrl)}
                                  className="text-primary hover:underline"
                                >
                                  Zoom
                                </button>
                              </div>
                              <div
                                className="rounded-xl overflow-hidden border border-border h-36 cursor-pointer"
                                onClick={() => setInspectImage(sub.screenshotUrl)}
                              >
                                <img
                                  src={sub.screenshotUrl}
                                  alt="Leg 1 screenshot"
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>Leg 2 Screenshot</span>
                                <button
                                  type="button"
                                  onClick={() => setInspectImage(sub.leg2ScreenshotUrl)}
                                  className="text-secondary hover:underline"
                                >
                                  Zoom
                                </button>
                              </div>
                              <div
                                className="rounded-xl overflow-hidden border border-border h-36 cursor-pointer"
                                onClick={() => setInspectImage(sub.leg2ScreenshotUrl)}
                              >
                                <img
                                  src={sub.leg2ScreenshotUrl}
                                  alt="Leg 2 screenshot"
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : sub.screenshotUrl && (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-foreground">Konami Full-Time Screenshot:</span>
                            <button
                              type="button"
                              onClick={() => setInspectImage(sub.screenshotUrl)}
                              className="text-primary hover:underline flex items-center gap-1 text-xs"
                            >
                              <Eye className="h-3 w-3" /> View Fullscreen
                            </button>
                          </div>
                          <div
                            className="rounded-xl overflow-hidden border border-border h-44 cursor-pointer"
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
                      <div className="rounded-xl bg-background border border-primary/30 p-3 space-y-2">
                        <span className="text-xs font-mono font-bold text-primary uppercase tracking-widest block">
                          Verified Match Goals (Insert From Screenshot):
                        </span>
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex-1 text-center">
                            <span className="text-xs font-bold text-foreground block mb-1">
                              {sub.match.homePlayer.gamerTag} (Home)
                            </span>
                            <Input
                              type="number"
                              min="0"
                              max="40"
                              value={submissionScores[sub.id]?.home ?? sub.homeScore}
                              onChange={(e) => handleScoreChange(sub.id, "home", Number(e.target.value))}
                              className="text-center font-mono text-lg font-black bg-card border-primary/40 text-primary h-9"
                            />
                          </div>

                          <span className="text-xl font-black text-muted-foreground mt-4">-</span>

                          <div className="flex-1 text-center">
                            <span className="text-xs font-bold text-foreground block mb-1">
                              {sub.match.awayPlayer.gamerTag} (Away)
                            </span>
                            <Input
                              type="number"
                              min="0"
                              max="40"
                              value={submissionScores[sub.id]?.away ?? sub.awayScore}
                              onChange={(e) => handleScoreChange(sub.id, "away", Number(e.target.value))}
                              className="text-center font-mono text-lg font-black bg-card border-primary/40 text-primary h-9"
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
                          className="bg-primary hover:bg-primary text-white font-black text-xs gap-1.5 shadow-lg"
                        >
                          <CheckCircle2 className="h-4 w-4 text-white" />
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
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={reopeningMatchId === sub.matchId}
                          onClick={() => handleReopenSubmissions(sub.matchId)}
                          className="font-bold gap-1 text-xs border-primary/40 text-primary hover:bg-primary/20"
                          title="Reopen submission buttons for this fixture"
                        >
                          <Unlock className="h-3.5 w-3.5 text-primary" />
                          Reopen
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
              <div className="rounded-2xl border border-border bg-background/90 p-5 space-y-4 shadow-xl">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <div>
                      <label className="text-xs font-mono font-bold text-muted-foreground uppercase block mb-1">
                        Select Matchday Round
                      </label>
                      <select
                        value={selectedMatchdayRound}
                        onChange={(e) => setSelectedMatchdayRound(e.target.value)}
                        className="bg-card border border-border text-white rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-primary"
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
                      <label className="text-xs font-mono font-bold text-muted-foreground uppercase block mb-1">
                        Filter Division
                      </label>
                      <select
                        value={selectedMatchDivision}
                        onChange={(e) => setSelectedMatchDivision(e.target.value)}
                        className="bg-card border border-border text-white rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-primary"
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
                      className="bg-gradient-to-r from-primary to-primary hover:from-primary hover:to-primary text-white font-black px-6 py-2.5 rounded-xl text-xs gap-2 shadow-lg"
                    >
                      {batchLoading ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4 text-white" />
                      )}
                      Save Entered Goals, Update Table Once & Notify Users
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border/80 pt-3">
                  <span>
                    Type the goals scored by each player for their played match. You can fill multiple or all matches in this matchday and click the button above to apply them simultaneously.
                  </span>
                  <span className="font-mono text-primary font-bold shrink-0 ml-4">
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
                    <div className="rounded-3xl border border-border bg-background/80 p-12 text-center text-muted-foreground space-y-3">
                      <Calendar className="h-10 w-10 mx-auto text-muted-foreground" />
                      <p className="font-bold text-foreground">No matches found for {selectedMatchdayRound} ({selectedMatchDivision}).</p>
                      <p className="text-xs text-muted-foreground">Generate fixtures or select another matchday round above.</p>
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
                          className={`rounded-2xl border p-4 transition space-y-3 bg-background/90 ${
                            isEdited
                              ? "border-primary/60 shadow-lg"
                              : "border-border hover:border-border"
                          }`}
                        >
                          <div className="flex items-center justify-between border-b border-border/80 pb-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs font-mono border-border text-foreground">
                                {match.division}
                              </Badge>
                              <span className="text-xs font-mono text-muted-foreground">{match.round}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {match.status === "FINISHED" ? (
                                <Badge variant="live" className="text-xs bg-primary/20 text-primary border border-primary/30">
                                  FINISHED ({match.homeScore} - {match.awayScore})
                                </Badge>
                              ) : (
                                <span className="text-xs font-mono text-secondary font-bold uppercase">
                                  {match.status}
                                </span>
                              )}
                              {isEdited && (
                                <span className="text-xs text-primary font-black tracking-wide">
                                  ● MODIFIED
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Home & Away Scoring Inputs */}
                          <div className="flex items-center justify-between gap-3 py-1">
                            {/* Home Side */}
                            <div className="flex-1 text-left space-y-1">
                              <div className="flex items-center gap-1.5">
                                <div className="w-5 h-5 rounded-full bg-card border border-border/80 p-0.5 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                                  <img
                                    src={resolvePlayerAvatar(match.homePlayer)}
                                    alt={match.homePlayer?.realTeam || match.homePlayer?.gamerTag || "Home"}
                                    className="w-full h-full object-contain"
                                    onError={(e) => {
                                      (e.currentTarget as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(match.homePlayer?.gamerTag || "player")}`;
                                    }}
                                  />
                                </div>
                                <span className="text-xs font-black text-white block truncate">
                                  {match.homePlayer?.gamerTag || "Home Player"}
                                </span>
                                {match.homePlayer?.realTeam && (
                                  <span className="text-xs text-secondary font-bold shrink-0">
                                    ({findTeam(match.homePlayer.realTeam)?.shortName || match.homePlayer.realTeam})
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground block truncate pl-6">
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
                                className="h-9 text-center font-mono text-base font-black bg-card border-border text-primary focus:border-primary"
                              />
                            </div>

                            {/* Divider / VS */}
                            <div className="flex flex-col items-center justify-center px-1 shrink-0 pt-4">
                              <span className="text-xs font-mono font-bold text-muted-foreground">VS</span>
                            </div>

                            {/* Away Side */}
                            <div className="flex-1 text-right space-y-1">
                              <div className="flex items-center justify-end gap-1.5">
                                {match.awayPlayer?.realTeam && (
                                  <span className="text-xs text-secondary font-bold shrink-0">
                                    ({findTeam(match.awayPlayer.realTeam)?.shortName || match.awayPlayer.realTeam})
                                  </span>
                                )}
                                <span className="text-xs font-black text-white block truncate">
                                  {match.awayPlayer?.gamerTag || "Away Player"}
                                </span>
                                <div className="w-5 h-5 rounded-full bg-card border border-border/80 p-0.5 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                                  <img
                                    src={resolvePlayerAvatar(match.awayPlayer)}
                                    alt={match.awayPlayer?.realTeam || match.awayPlayer?.gamerTag || "Away"}
                                    className="w-full h-full object-contain"
                                    onError={(e) => {
                                      (e.currentTarget as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(match.awayPlayer?.gamerTag || "player")}`;
                                    }}
                                  />
                                </div>
                              </div>
                              <span className="text-xs text-muted-foreground block truncate pr-6">
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
                                className="h-9 text-center font-mono text-base font-black bg-card border-border text-primary focus:border-primary"
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
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h3 className="text-lg font-black uppercase text-white">Forfeit Claims Arbitration</h3>
              <p className="text-xs text-muted-foreground">
                Inspect proof that an opponent was unavailable or uncommunicative on WhatsApp. Approving awards a 3-0 walkover.
              </p>
            </div>
            <Badge variant="destructive">{pendingForfeits.length} Claims</Badge>
          </div>

          {pendingForfeits.length === 0 ? (
            <div className="rounded-3xl border border-border bg-background/80 p-12 text-center text-muted-foreground space-y-3">
              <CheckCircle2 className="h-10 w-10 mx-auto text-muted-foreground" />
              <p className="font-bold">No active forfeit disputes reported.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {pendingForfeits.map((claim) => (
                <div
                  key={claim.id}
                  className="rounded-2xl border border-destructive/30 bg-background/90 p-5 space-y-4 shadow-xl"
                >
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <span className="text-xs font-mono text-destructive font-bold">{claim.match.round}</span>
                    <Badge variant="destructive" className="text-xs">
                      Dispute Claim
                    </Badge>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">Claimant (Reporting Player):</span>
                      <p className="font-bold text-primary">
                        {claim.claimantPlayer.gamerTag} ({claim.claimantPlayer.whatsapp})
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Accused (Non-responsive Opponent):</span>
                      <p className="font-bold text-destructive">
                        {claim.accusedPlayer.gamerTag} ({claim.accusedPlayer.whatsapp})
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Claimant Statement:</span>
                      <p className="p-2.5 rounded-xl bg-card border border-border text-foreground">
                        {claim.reason}
                      </p>
                    </div>
                  </div>

                  {claim.proofScreenshotUrl && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-foreground">WhatsApp / Room Proof Screenshot:</span>
                        <button
                          type="button"
                          onClick={() => setInspectImage(claim.proofScreenshotUrl)}
                          className="text-primary hover:underline flex items-center gap-1 text-xs"
                        >
                          <Eye className="h-3 w-3" /> View Fullscreen
                        </button>
                      </div>
                      <div
                        className="rounded-xl overflow-hidden border border-border h-44 cursor-pointer"
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

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={reviewLoading === claim.id}
                      onClick={() => handleReviewForfeit(claim.id, "APPROVE")}
                      className="font-bold gap-1 text-xs"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Approve 3-0
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={reviewLoading === claim.id}
                      onClick={() => handleReviewForfeit(claim.id, "REJECT")}
                      className="font-bold gap-1 text-xs"
                    >
                      <XCircle className="h-4 w-4" />
                      Reject Claim
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={reopeningMatchId === claim.matchId}
                      onClick={() => handleReopenSubmissions(claim.matchId)}
                      className="font-bold gap-1 text-xs border-primary/40 text-primary hover:bg-primary/20"
                      title="Clear forfeit and reopen submission buttons for both athletes"
                    >
                      <Unlock className="h-3.5 w-3.5 text-primary" />
                      Reopen Match
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
          <div className="lg:col-span-6 rounded-3xl border border-border bg-background/90 p-6 sm:p-8 shadow-xl space-y-4">
            <h3 className="text-lg font-black uppercase text-white flex items-center gap-2 border-b border-border pb-3">
              <Send className="h-5 w-5 text-primary" />
              <span>Broadcast or Direct Player Message</span>
            </h3>

            {annSuccessMsg && (
              <div className="p-3 rounded-xl bg-primary/10 border border-primary/30 text-primary text-xs">
                {annSuccessMsg}
              </div>
            )}

            <form onSubmit={handlePostAnnouncement} className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase text-foreground block mb-1">Notice Headline</label>
                <Input
                  required
                  placeholder="e.g. 24-Hour Cycle Fixture Warning"
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-foreground block mb-1">Notice Content</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Type your official administrative communication..."
                  value={annContent}
                  onChange={(e) => setAnnContent(e.target.value)}
                  className="w-full rounded-xl border border-border bg-card/80 p-3 text-xs text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase text-foreground block mb-1">Target Audience</label>
                  <select
                    value={annType}
                    onChange={(e: any) => setAnnType(e.target.value)}
                    className="w-full rounded-xl border border-border bg-card p-2 text-xs text-white"
                  >
                    <option value="BROADCAST">Broadcast (All Players)</option>
                    <option value="INDIVIDUAL">Individual Player Notice</option>
                  </select>
                </div>

                {annType === "INDIVIDUAL" && (
                  <div>
                    <label className="text-xs font-bold uppercase text-foreground block mb-1">Select Player</label>
                    <select
                      value={targetPlayerId}
                      onChange={(e) => setTargetPlayerId(e.target.value)}
                      className="w-full rounded-xl border border-border bg-card p-2 text-xs text-white"
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
                  className="rounded border-border"
                />
                <label htmlFor="pinNotice" className="text-xs text-foreground">
                  Pin to Top of Player Noticeboard
                </label>
              </div>

              <Button type="submit" disabled={postingAnn} className="w-full font-bold">
                {postingAnn ? "Transmitting..." : "Send Announcement"}
              </Button>
            </form>
          </div>

          <div className="lg:col-span-6 rounded-3xl border border-border bg-background/90 p-6 sm:p-8 shadow-xl space-y-4">
            <h3 className="text-lg font-black uppercase text-white flex items-center gap-2 border-b border-border pb-3">
              <Bell className="h-5 w-5 text-secondary" />
              <span>Recent Announcements Feed</span>
            </h3>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {announcements.map((ann) => (
                <div key={ann.id} className="p-4 rounded-2xl bg-card/60 border border-border space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs">{ann.title}</span>
                    <Badge variant={ann.type === "BROADCAST" ? "secondary" : "yellow"} className="text-xs">
                      {ann.type}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{ann.content}</p>
                  <span className="text-xs text-muted-foreground font-mono block">
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
            <div className="rounded-2xl border border-destructive/30 bg-destructive/20 p-5 space-y-3">
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <h4 className="font-black uppercase text-sm">Disciplinary Alert (2+ Missed Matches)</h4>
              </div>
              <p className="text-xs text-foreground">
                The players below have missed consecutive fixtures without approval. EFRL rule mandates immediate disqualification upon reaching 3 missed matches.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {flaggedPlayers.map((fp) => (
                  <div key={fp.id} className="p-3 rounded-xl bg-card/80 border border-destructive/20 text-xs">
                    <span className="font-bold text-white">{fp.gamerTag}</span>
                    <span className="text-destructive block font-mono">
                      Missed: {fp.consecutiveMissed}/3 {fp.isDisqualified ? "(DISQUALIFIED)" : "(FINAL WARNING)"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-3xl border border-border bg-background/90 overflow-hidden shadow-xl">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h3 className="text-lg font-black uppercase text-white">Registered Athletes Directory</h3>
              <span className="text-xs font-mono text-muted-foreground">{playersList.length} Total</span>
            </div>

            <div className="overflow-x-auto no-scrollbar scroll-smooth">
              <table className="w-full text-left text-xs">
                <thead className="bg-card/80 text-xs font-black uppercase text-muted-foreground border-b border-border">
                  <tr>
                    <th className="px-4 py-3">Athlete</th>
                    <th className="px-4 py-3">Official Club</th>
                    <th className="px-4 py-3">Full Name</th>
                    <th className="px-4 py-3">eFootball ID</th>
                    <th className="px-4 py-3">WhatsApp Number</th>
                    <th className="px-4 py-3">Division</th>
                    <th className="px-4 py-3 text-center">Missed</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {playersList.map((p) => {
                    const avatarUrl = p.avatar || resolvePlayerAvatar(p);
                    const teamObj = p.realTeam ? findTeam(p.realTeam) : null;
                    return (
                      <tr key={p.id} className="hover:bg-card/40">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-lg bg-card border border-border flex items-center justify-center p-1 shrink-0 overflow-hidden shadow">
                              {avatarUrl ? (
                                <img
                                  src={avatarUrl}
                                  alt={p.realTeam || p.gamerTag}
                                  className="h-full w-full object-contain"
                                />
                              ) : (
                                <span className="font-black text-xs text-primary">
                                  {p.gamerTag.slice(0, 2).toUpperCase()}
                                </span>
                              )}
                            </div>
                            <span className="font-bold text-white">{p.gamerTag}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {p.realTeam ? (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-semibold text-white">{p.realTeam}</span>
                              {teamObj && (
                                <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-muted text-foreground">
                                  {teamObj.shortName}
                                </span>
                              )}
                              {teamObj && teamObj.division !== p.division && (
                                <span
                                  className="text-xs font-black px-1.5 py-0.5 rounded bg-destructive/20 text-destructive border border-destructive/30"
                                  title={`Mismatch: ${teamObj.shortName} belongs to ${teamObj.division} (${teamObj.league}), but athlete is in ${p.division}`}
                                >
                                  WRONG DIV ({teamObj.league})
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground italic">No Club Assigned</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-foreground">{p.fullName}</td>
                        <td className="px-4 py-3 font-mono text-muted-foreground">{p.efootballId}</td>
                        <td className="px-4 py-3 font-mono text-primary">{p.whatsapp}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <Badge
                              variant={
                                p.division === "Division 1"
                                  ? "secondary"
                                  : p.division === "Division 2"
                                  ? "yellow"
                                  : "live"
                              }
                              className="text-xs"
                            >
                              {p.division}
                            </Badge>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingDivisionPlayer(p);
                                setSelectedTargetDivision(p.division);
                              }}
                              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
                              title="Change Division"
                            >
                              <Layers className="h-3 w-3" />
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center font-mono font-bold">
                          <span className={p.consecutiveMissed >= 3 ? "text-destructive font-black animate-pulse" : p.consecutiveMissed >= 2 ? "text-destructive" : "text-muted-foreground"}>
                            {p.consecutiveMissed}/3
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {p.consecutiveMissed >= 3 || p.isDisqualified ? (
                            <Badge variant="destructive" className="text-xs animate-pulse">
                              AWAITING SUB
                            </Badge>
                          ) : (
                            <Badge
                              variant={p.isDisqualified ? "destructive" : "secondary"}
                              className="text-xs"
                            >
                              {p.status}
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingDivisionPlayer(p);
                                setSelectedTargetDivision(p.division);
                              }}
                              className="h-7 px-2 text-xs font-bold border-secondary/40 text-secondary hover:bg-secondary/50 hover:text-secondary"
                              title="Change Athlete Division"
                            >
                              <Layers className="h-3 w-3 mr-1" />
                              Division
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingClubPlayer(p);
                                setSelectedClubName(p.realTeam || "");
                              }}
                              className="h-7 px-2 text-xs font-bold border-primary/40 text-primary hover:bg-primary/50 hover:text-primary"
                              title="Assign Real Football Club"
                            >
                              Club
                            </Button>
                            <Button
                              size="sm"
                              variant={p.consecutiveMissed >= 3 || p.isDisqualified ? "yellow" : "outline"}
                              onClick={() => {
                                setReplaceTargetPlayer(p);
                                setRepGamerTag("");
                                setRepFullName("");
                                setRepWhatsapp(p.whatsapp || "");
                                setRepEmail("");
                                setRepPassword("");
                                setSelectedReserveId(reservePlayers[0]?.id || "");
                              }}
                              className={`h-7 px-2 text-xs font-bold ${
                                p.consecutiveMissed >= 3 || p.isDisqualified
                                  ? "bg-secondary text-secondary-foreground hover:bg-secondary font-black shadow-md"
                                  : "border-primary/40 text-primary hover:bg-primary/50 hover:text-primary"
                              }`}
                            >
                              <Shuffle className="h-3 w-3 mr-1" />
                              {p.consecutiveMissed >= 3 || p.isDisqualified ? "Replace (Sub)" : "Replace"}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRemoveAthlete(p.id, p.gamerTag)}
                              className="h-7 px-2 text-xs font-bold bg-destructive/80 hover:bg-destructive text-white"
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB: HALL OF FAME MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === "HALL_OF_FAME" && (
        <div className="space-y-8">
          <div className="rounded-3xl border border-secondary/30 bg-gradient-to-r from-secondary/20 to-secondary/10 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-secondary">
                <Crown className="h-6 w-6" />
                <h3 className="text-xl font-black uppercase text-white tracking-wide">
                  EFRL Hall of Fame Commissioner Office
                </h3>
              </div>
              <p className="text-xs text-foreground mt-1 max-w-2xl">
                Crown champions of Division 1, Division 2, Division 3, UCL, Europa League, and Kigali cups. Immortalized champions are showcased proudly on the League Homepage.
              </p>
            </div>
            <Badge variant="yellow" className="text-xs px-3 py-1 font-mono">
              {hallOfFame.length} Immortalized Champions
            </Badge>
          </div>

          {/* Add Champion Form */}
          <div className="rounded-3xl border border-border bg-background/90 p-6 space-y-5 shadow-xl">
            <div className="flex items-center gap-2 text-secondary border-b border-border pb-3">
              <Sparkles className="h-5 w-5" />
              <h4 className="text-sm font-black uppercase text-white">Crown New Champion</h4>
            </div>

            <form onSubmit={handleAddHallOfFame} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Tournament Name *</label>
                  <select
                    value={hofTournament}
                    onChange={(e) => setHofTournament(e.target.value)}
                    className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-xs text-white focus:ring-1 focus:ring-secondary"
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
                  <label className="text-xs font-bold uppercase text-muted-foreground">Season / Year *</label>
                  <Input
                    placeholder="e.g. Season 2026 or Season 1"
                    value={hofSeason}
                    onChange={(e) => setHofSeason(e.target.value)}
                    className="bg-card border-border text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Trophy Tier</label>
                  <select
                    value={hofTrophyType}
                    onChange={(e) => setHofTrophyType(e.target.value)}
                    className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-xs text-white focus:ring-1 focus:ring-secondary"
                  >
                    <option value="GOLD">Gold Cup / 1st Place</option>
                    <option value="SILVER">Silver Cup / Runner-up</option>
                    <option value="BRONZE">Bronze Cup / 3rd Place</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-secondary">Champion Gamer Tag *</label>
                  <Input
                    placeholder="e.g. RW_Sniper99"
                    value={hofChampion}
                    onChange={(e) => setHofChampion(e.target.value)}
                    className="bg-card border-secondary/30 text-xs font-bold text-white"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Champion Real Name</label>
                  <Input
                    placeholder="e.g. Jean-Claude Mugisha"
                    value={hofRealName}
                    onChange={(e) => setHofRealName(e.target.value)}
                    className="bg-card border-border text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  disabled={submittingHof || !hofChampion.trim()}
                  className="bg-secondary hover:bg-secondary text-secondary-foreground font-black text-xs px-6 py-2.5 shadow-lg"
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
              <Trophy className="h-5 w-5 text-secondary" />
              Immortalized Champions Directory ({hallOfFame.length})
            </h4>

            {hallOfFame.length === 0 ? (
              <div className="rounded-3xl border border-border bg-background/60 p-12 text-center">
                <Crown className="h-12 w-12 text-secondary/40 mx-auto mb-3" />
                <h5 className="text-sm font-bold text-white uppercase">No Champions Crowned Yet</h5>
                <p className="text-xs text-muted-foreground mt-1">Use the form above to add your first league title winner!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {hallOfFame.map((entry) => (
                  <div
                    key={entry.id}
                    className="relative overflow-hidden rounded-2xl border border-secondary/20 bg-background/90 p-5 space-y-4 hover:border-secondary/40 transition-all shadow-xl flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <Badge variant="yellow" className="text-xs uppercase tracking-wider mb-1">
                            {entry.season}
                          </Badge>
                          <h5 className="text-xs font-bold text-foreground">{entry.tournamentName}</h5>
                        </div>
                        <div className="h-9 w-9 rounded-xl bg-secondary/10 border border-secondary/30 flex items-center justify-center shrink-0">
                          <Crown className="h-5 w-5 text-secondary" />
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-card/90 border border-secondary/10 space-y-1">
                        <span className="text-xs font-mono uppercase text-secondary font-bold block">
                          Champion
                        </span>
                        <div className="text-lg font-black text-white">{entry.championName}</div>
                        {entry.championRealName && (
                          <div className="text-xs text-foreground font-medium">{entry.championRealName}</div>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-border/80 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground font-mono">
                        {new Date(entry.createdAt).toLocaleDateString()}
                      </span>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteHallOfFame(entry.id, entry.championName)}
                        className="h-7 px-2.5 text-xs font-bold bg-destructive/80 hover:bg-destructive"
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
          {/* Header Banner */}
          <div className="rounded-3xl border border-primary/30 bg-primary/10 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-primary">
                <MessageSquare className="h-5 w-5" />
                <h3 className="text-lg font-black uppercase text-white">Player Support & Direct Inquiries Desk</h3>
              </div>
              <p className="text-xs text-foreground mt-1">
                Direct inquiries submitted by athletes from their dashboard. Write official commissioner responses which appear immediately in the athlete&apos;s conversation thread. Replied messages are stored in Message History and automatically delete after 24 hours.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="text-xs px-3 py-1 font-mono">
                {activePlayerMessages.length} Total Messages
              </Badge>
              {pendingMessages.length > 0 && (
                <Badge variant="destructive" className="text-xs px-3 py-1 font-mono animate-pulse">
                  {pendingMessages.length} Pending Reply
                </Badge>
              )}
              {historyMessages.length > 0 && (
                <Badge variant="outline" className="text-xs px-3 py-1 font-mono border-primary/40 text-primary bg-primary/20">
                  {historyMessages.length} in History
                </Badge>
              )}
            </div>
          </div>

          {/* Sub-Navigation between Pending Inquiries, Message History, and All */}
          <div className="flex items-center gap-2 border-b border-border pb-3 overflow-x-auto no-scrollbar scroll-smooth">
            <button
              onClick={() => setInquiriesSubTab("PENDING")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 h-10 ${
                inquiriesSubTab === "PENDING"
                  ? "bg-secondary text-secondary-foreground font-black shadow-lg"
                  : "text-muted-foreground hover:text-white hover:bg-card"
              }`}
            >
              <Clock className="h-4 w-4" />
              <span>Active Inquiries</span>
              {pendingMessages.length > 0 && (
                <Badge variant="destructive" className="text-xs px-1.5 py-0 font-black">
                  {pendingMessages.length}
                </Badge>
              )}
            </button>

            <button
              onClick={() => setInquiriesSubTab("HISTORY")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 h-10 ${
                inquiriesSubTab === "HISTORY"
                  ? "bg-primary text-white font-black shadow-lg"
                  : "text-muted-foreground hover:text-white hover:bg-card"
              }`}
            >
              <RotateCcw className="h-4 w-4" />
              <span>Message History</span>
              {historyMessages.length > 0 && (
                <Badge variant="outline" className="text-xs px-1.5 py-0 font-mono text-muted-foreground border-border/40 bg-white/20">
                  {historyMessages.length}
                </Badge>
              )}
            </button>

            <button
              onClick={() => setInquiriesSubTab("ALL")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 h-10 ${
                inquiriesSubTab === "ALL"
                  ? "bg-primary text-white font-black shadow-lg"
                  : "text-muted-foreground hover:text-white hover:bg-card"
              }`}
            >
              <MessageSquare className="h-4 w-4" />
              <span>All Inquiries</span>
              <span className="text-xs font-mono opacity-80">({activePlayerMessages.length})</span>
            </button>
          </div>

          {/* Message History Information Banner */}
          {inquiriesSubTab === "HISTORY" && (
            <div className="rounded-2xl border border-primary/30 bg-primary/20 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/20 text-primary shrink-0">
                  <RotateCcw className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase text-primary tracking-wide">
                    Replied Inquiries Archive (24-Hour Auto-Deletion)
                  </h4>
                  <p className="text-xs text-primary/80 mt-0.5">
                    Messages you have replied to are stored here in Message History. Each conversation history automatically deletes 24 hours after reply.
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="text-xs font-mono border-primary/40 text-primary bg-primary/40 shrink-0">
                Auto-purged after 24h
              </Badge>
            </div>
          )}

          {/* Messages List or Empty State */}
          {(() => {
            const displayMessages =
              inquiriesSubTab === "PENDING"
                ? pendingMessages
                : inquiriesSubTab === "HISTORY"
                ? historyMessages
                : activePlayerMessages;

            if (displayMessages.length === 0) {
              return (
                <div className="rounded-3xl border border-border bg-background/60 p-12 text-center space-y-2">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <h4 className="text-base font-bold text-white uppercase">
                    {inquiriesSubTab === "PENDING"
                      ? "No Pending Inquiries"
                      : inquiriesSubTab === "HISTORY"
                      ? "No Message History"
                      : "No Player Inquiries Yet"}
                  </h4>
                  <p className="text-xs text-muted-foreground max-w-md mx-auto">
                    {inquiriesSubTab === "PENDING"
                      ? "All athlete inquiries have been replied to! Check the Message History tab to view previously answered conversations."
                      : inquiriesSubTab === "HISTORY"
                      ? "When you reply to athlete messages, they are stored here in Message History and automatically deleted after 24 hours."
                      : "When athletes write direct messages to the league administrators from their personal dashboards, they will appear here for you to interact and reply."}
                  </p>
                </div>
              );
            }

            return (
              <div className="space-y-4">
                {displayMessages.map((msg) => {
                  const isReplied = msg.status === "REPLIED" || !!msg.adminReply;
                  const repliedTimestamp = msg.repliedAt
                    ? new Date(msg.repliedAt).getTime()
                    : new Date(msg.updatedAt).getTime();
                  const msRemaining = Math.max(0, repliedTimestamp + 24 * 60 * 60 * 1000 - messagesNow);
                  const hoursRemaining = Math.floor(msRemaining / (1000 * 60 * 60));
                  const minsRemaining = Math.floor((msRemaining % (1000 * 60 * 60)) / (1000 * 60));

                  return (
                    <div
                      key={msg.id}
                      className={`rounded-3xl border p-6 space-y-4 backdrop-blur-xl transition-all shadow-xl ${
                        !isReplied
                          ? "border-secondary/50 bg-gradient-to-r from-secondary/20 via-card/90 to-background/90 ring-1 ring-secondary/20"
                          : "border-border bg-background/80 hover:border-border"
                      }`}
                    >
                      {/* Athlete & Message Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/80 pb-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary text-white font-black text-sm flex items-center justify-center shrink-0">
                            {msg.player?.gamerTag?.slice(0, 2).toUpperCase() || "PL"}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-base font-black text-white">{msg.player?.gamerTag}</h4>
                              <Badge variant="secondary" className="text-xs">
                                {msg.player?.division}
                              </Badge>
                              <Badge
                                variant={isReplied ? "green" : "yellow"}
                                className="text-xs font-bold"
                              >
                                {isReplied ? "STORED IN HISTORY" : "PENDING REPLY"}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                              <span>{msg.player?.fullName}</span>
                              {msg.player?.whatsapp && (
                                <a
                                  href={`https://wa.me/${msg.player.whatsapp.replace(/[^0-9]/g, "")}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-primary hover:underline flex items-center gap-1 font-mono"
                                >
                                  <MessageSquare className="h-3 w-3" />
                                  <span>{msg.player.whatsapp}</span>
                                </a>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 self-start sm:self-auto flex-wrap">
                          <span className="text-xs font-mono text-muted-foreground">
                            Received: {new Date(msg.createdAt).toLocaleString()}
                          </span>

                          {isReplied && (
                            <div className="flex items-center gap-2">
                              <span className="flex items-center gap-1 text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border border-primary/30 bg-primary/40 text-primary">
                                <Clock className="h-3 w-3 text-primary" />
                                Auto-deletes in {hoursRemaining}h {minsRemaining}m
                              </span>
                              <Button
                                size="sm"
                                variant="destructive"
                                disabled={deletingMessageId === msg.id}
                                onClick={() => handleDeleteMessage(msg.id)}
                                className="h-7 px-2.5 text-xs font-bold bg-destructive/80 hover:bg-destructive"
                                title="Delete from Message History now"
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                {deletingMessageId === msg.id ? "..." : "Delete"}
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Subject and Content */}
                      <div className="space-y-2 bg-card/60 border border-border/80 rounded-2xl p-4">
                        <span className="text-xs font-bold uppercase text-primary tracking-wider block">
                          Topic / Subject:
                        </span>
                        <h5 className="text-sm font-bold text-white">{msg.subject}</h5>
                        <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap pt-1 border-t border-border/50">
                          {msg.content}
                        </p>
                      </div>

                      {/* Existing Admin Reply (Stored in History) */}
                      {msg.adminReply && replyingMessageId !== msg.id && (
                        <div className="rounded-2xl border border-primary/40 bg-primary/20 p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge variant="green" className="text-xs font-black uppercase">
                                YOUR OFFICIAL REPLY (STORED IN HISTORY)
                              </Badge>
                              {msg.repliedAt && (
                                <span className="text-xs font-mono text-primary/70">
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
                              className="h-6 text-xs text-primary hover:text-white"
                            >
                              Edit Reply
                            </Button>
                          </div>
                          <p className="text-xs text-primary leading-relaxed whitespace-pre-wrap">
                            {msg.adminReply}
                          </p>
                        </div>
                      )}

                      {/* Reply Input Form */}
                      {replyingMessageId === msg.id ? (
                        <div className="rounded-2xl border border-primary/40 bg-card p-4 space-y-3">
                          <label className="text-xs font-bold uppercase text-primary block">
                            Write Official Reply to {msg.player?.gamerTag}:
                          </label>
                          <textarea
                            rows={3}
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Type official response from the League Commissioner..."
                            className="w-full rounded-xl bg-background border border-border p-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary resize-none"
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
                              className="bg-primary hover:bg-primary text-white font-bold text-xs"
                            >
                              {submittingReply ? "Sending..." : "Submit Reply & Store in History"}
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
                            className="bg-primary hover:bg-primary text-white font-bold text-xs"
                          >
                            <Send className="h-3.5 w-3.5 mr-1.5" />
                            <span>Reply to Athlete</span>
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB: ALL GENERATED MATCHES */}
      {/* ========================================================================= */}
      {activeTab === "ALL_MATCHES" && (
        <div className="space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 rounded-3xl border border-border bg-background/90 shadow-2xl backdrop-blur-xl">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="yellow">FULL TOURNAMENT SCHEDULE</Badge>
                <Badge variant="secondary">{matches.length} Total Matches</Badge>
              </div>
              <h2 className="text-xl sm:text-2xl font-black uppercase text-white tracking-tight flex items-center gap-2">
                <Calendar className="h-6 w-6 text-primary" />
                <span>All Generated Tournament Matches</span>
              </h2>
              <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
                Browse, search, and manage all scheduled and finished matches across all matchday rounds and divisions. You can extend deadlines to permit late submissions or directly enter verified scores.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <Button
                onClick={() => handleRecalculateStandings("ALL")}
                disabled={recalculatingStandings}
                className="bg-primary hover:bg-primary text-white font-black text-xs uppercase tracking-wider px-4 py-2.5 shadow-lg"
              >
                <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${recalculatingStandings ? "animate-spin" : ""}`} />
                {recalculatingStandings ? "Updating..." : "⚡ Update Standings"}
              </Button>

              <Button
                onClick={() => handleResetTournament("ALL")}
                disabled={resettingTournament}
                variant="destructive"
                className="font-bold text-xs uppercase tracking-wider px-4 py-2.5 gap-1.5 shadow-lg"
              >
                <RotateCcw className={`h-3.5 w-3.5 ${resettingTournament ? "animate-spin" : ""}`} />
                {resettingTournament ? "Resetting..." : "Reset All Matches"}
              </Button>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="rounded-2xl border border-border bg-background/80 p-4 shadow-xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search player or Konami ID..."
                  value={allMatchesSearch}
                  onChange={(e) => setAllMatchesSearch(e.target.value)}
                  className="pl-9 bg-card border-border text-xs text-white"
                />
              </div>

              {/* Round Filter */}
              <div>
                <select
                  value={allMatchesFilterRound}
                  onChange={(e) => setAllMatchesFilterRound(e.target.value)}
                  className="w-full bg-card border border-border rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-primary"
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
                  className="w-full bg-card border border-border rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-primary"
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
                  className="w-full bg-card border border-border rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-primary"
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
                <div className="rounded-3xl border border-border bg-background/60 p-12 text-center space-y-3">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto" />
                  <h4 className="text-base font-bold text-white uppercase">No Matches Found</h4>
                  <p className="text-xs text-muted-foreground">
                    No tournament fixtures match your current filter criteria.
                  </p>
                </div>
              );
            }

            return (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground px-2 font-mono">
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
                        className="rounded-2xl border border-border bg-background/80 p-4 sm:p-5 hover:border-border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="yellow" className="text-xs font-mono">
                              {match.round}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {match.division}
                            </Badge>
                            {isFinished ? (
                              <Badge variant="green" className="text-xs font-black">
                                COMPLETED
                              </Badge>
                            ) : isForfeit ? (
                              <Badge variant="destructive" className="text-xs font-black">
                                FORFEIT
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs border-primary/40 text-primary">
                                SCHEDULED
                              </Badge>
                            )}
                            {isLateAllowed && (
                              <Badge variant="yellow" className="text-xs bg-secondary/20 border-secondary/40 text-secondary">
                                ⏰ LATE UPLOAD ALLOWED
                              </Badge>
                            )}
                          </div>

                          {/* Teams and Scores */}
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 text-right">
                              <div>
                                <span className="font-bold text-sm text-white block">{match.homePlayer?.gamerTag}</span>
                                {match.homePlayer?.realTeam && (
                                  <span className="text-xs text-secondary font-bold block">
                                    {findTeam(match.homePlayer.realTeam)?.shortName || match.homePlayer.realTeam}
                                  </span>
                                )}
                                <span className="text-xs text-muted-foreground block font-mono">{match.homePlayer?.efootballId}</span>
                              </div>
                              <div className="w-6 h-6 rounded-full bg-card border border-border/80 p-0.5 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                                <img
                                  src={resolvePlayerAvatar(match.homePlayer)}
                                  alt={match.homePlayer?.realTeam || match.homePlayer?.gamerTag || "Home"}
                                  className="w-full h-full object-contain"
                                  onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(match.homePlayer?.gamerTag || "player")}`;
                                  }}
                                />
                              </div>
                            </div>

                            <div className="px-3 py-1 rounded-xl bg-card border border-border text-center w-20">
                              {isFinished || isForfeit ? (
                                <span className="font-mono text-base font-black text-primary">
                                  {match.homeScore ?? 0} - {match.awayScore ?? 0}
                                </span>
                              ) : (
                                <span className="text-xs font-black text-muted-foreground">VS</span>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-card border border-border/80 p-0.5 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                                <img
                                  src={resolvePlayerAvatar(match.awayPlayer)}
                                  alt={match.awayPlayer?.realTeam || match.awayPlayer?.gamerTag || "Away"}
                                  className="w-full h-full object-contain"
                                  onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(match.awayPlayer?.gamerTag || "player")}`;
                                  }}
                                />
                              </div>
                              <div>
                                <span className="font-bold text-sm text-white block">{match.awayPlayer?.gamerTag}</span>
                                {match.awayPlayer?.realTeam && (
                                  <span className="text-xs text-secondary font-bold block">
                                    {findTeam(match.awayPlayer.realTeam)?.shortName || match.awayPlayer.realTeam}
                                  </span>
                                )}
                                <span className="text-xs text-muted-foreground block font-mono">{match.awayPlayer?.efootballId}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Match Info & Actions */}
                        <div className="flex flex-wrap items-center gap-2 self-end md:self-auto">
                          <div className="text-right mr-2 hidden lg:block">
                            <span className="text-xs text-muted-foreground block font-mono">Deadline</span>
                            <span className="text-xs text-foreground font-mono">{cleanDeadline}</span>
                          </div>

                          {match.screenshotUrl && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setInspectImage(match.screenshotUrl)}
                              className="text-xs gap-1 h-8"
                            >
                              <Eye className="h-3.5 w-3.5 text-primary" />
                              <span>Screenshot</span>
                            </Button>
                          )}

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleExtendDeadline(match.id, 24)}
                            disabled={extendingMatchId === match.id}
                            className="text-xs gap-1 h-8 border-secondary/40 text-secondary hover:bg-secondary/20"
                            title="Extend deadline and permit player to upload scores"
                          >
                            <Clock className="h-3.5 w-3.5 text-secondary" />
                            <span>{extendingMatchId === match.id ? "Extending..." : "Extend Deadline"}</span>
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReopenSubmissions(match.id, 24)}
                            disabled={reopeningMatchId === match.id}
                            className="text-xs gap-1 h-8 border-primary/40 text-primary hover:bg-primary/20"
                            title="Reopen submission and forfeit buttons for both players"
                          >
                            <Unlock className="h-3.5 w-3.5 text-primary" />
                            <span>{reopeningMatchId === match.id ? "Reopening..." : "Reopen Submissions"}</span>
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl border border-border bg-background/90 shadow-2xl backdrop-blur-xl">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="yellow">COMMUNITY FEEDBACK</Badge>
                <Badge variant="secondary">{reviewsList.length} Total Reviews</Badge>
              </div>
              <h2 className="text-xl sm:text-2xl font-black uppercase text-white tracking-tight flex items-center gap-2">
                <Star className="h-6 w-6 text-secondary" />
                <span>Player Ratings & Feedback Reviews</span>
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
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
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center rounded-3xl border border-border bg-background/80 p-6 shadow-xl">
                <div className="lg:col-span-4 flex flex-col items-center justify-center text-center p-4 border-b lg:border-b-0 lg:border-r border-border">
                  <div className="text-5xl font-black text-white">{avg}</div>
                  <div className="flex items-center gap-1 my-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`h-5 w-5 ${
                          s <= Math.round(Number(avg))
                            ? "text-secondary fill-secondary"
                            : "text-muted-foreground"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">Based on {total} athlete ratings</span>
                </div>

                <div className="lg:col-span-8 space-y-2 px-2">
                  {stars.map((star) => {
                    const count = reviewsList.filter((r: any) => r.rating === star).length;
                    const percent = total > 0 ? Math.round((count / total) * 100) : 0;
                    return (
                      <div key={star} className="flex items-center gap-3 text-xs">
                        <span className="w-12 font-bold text-foreground flex items-center gap-1">
                          <span>{star}</span>
                          <Star className="h-3 w-3 text-secondary fill-secondary" />
                        </span>
                        <div className="flex-1 h-2.5 rounded-full bg-card overflow-hidden border border-border">
                          <div
                            className="h-full bg-secondary rounded-full transition-all"
                            // eslint-disable-next-line shadcn/no-inline-styles -- dynamic 0-100% width has no static token equivalent
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="w-12 text-right font-mono text-muted-foreground">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* Reviews List */}
          {reviewsList.length === 0 ? (
            <div className="rounded-3xl border border-border bg-background/60 p-12 text-center space-y-2">
              <Star className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <h4 className="text-base font-bold text-white uppercase">No Player Reviews Submitted Yet</h4>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                When participating athletes submit ratings and reviews from their dashboard, they will be visible here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reviewsList.map((rev: any) => (
                <div
                  key={rev.id}
                  className="rounded-2xl border border-border bg-background/80 p-5 space-y-3 hover:border-border transition-all shadow-lg"
                >
                  <div className="flex items-start justify-between gap-2 border-b border-border/80 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-secondary to-secondary text-secondary-foreground font-black text-sm flex items-center justify-center shrink-0">
                        {rev.player?.gamerTag?.slice(0, 2).toUpperCase() || "PL"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-white">{rev.player?.gamerTag}</h4>
                          <Badge variant="secondary" className="text-xs">
                            {rev.player?.division}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">{rev.player?.fullName}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`h-3.5 w-3.5 ${
                            s <= rev.rating
                              ? "text-secondary fill-secondary"
                              : "text-muted-foreground"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-xs font-mono font-bold uppercase text-primary tracking-wider">
                      Category: {rev.category || "GENERAL"}
                    </span>
                    <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                      &quot;{rev.comment}&quot;
                    </p>
                  </div>

                  <div className="pt-2 border-t border-border text-right">
                    <span className="text-xs font-mono text-muted-foreground">
                      {new Date(rev.createdAt).toLocaleDateString()} {new Date(rev.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB: PASSWORD RESETS AUTHORIZATION */}
      {/* ========================================================================= */}
      {activeTab === "PASSWORD_RESETS" && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="rounded-3xl border border-border bg-card/80 p-6 sm:p-8 relative overflow-hidden shadow-xl">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-destructive/20 border border-destructive/30 text-destructive text-xs font-bold uppercase tracking-wider">
                  <KeyRound className="h-3.5 w-3.5" />
                  <span>Access Recovery Management</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">
                  Password Reset Approvals
                </h2>
                <p className="text-xs sm:text-sm text-foreground leading-relaxed">
                  When an athlete forgets their password, they submit their email to request authorization. As League Admin, verify the athlete&apos;s request and approve permission so they can configure a new password and immediately log into their account.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  onClick={() => router.refresh()}
                  variant="outline"
                  size="sm"
                  className="gap-2 border-border bg-card/80 hover:bg-muted text-xs text-foreground"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Refresh Queue</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-background p-4 rounded-2xl border border-border">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by gamer tag, email, name, WhatsApp..."
                value={resetSearch}
                onChange={(e) => setResetSearch(e.target.value)}
                className="pl-9 bg-card border-border text-xs text-white"
              />
            </div>

            {/* Status Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {(["ALL", "PENDING", "APPROVED", "COMPLETED"] as const).map((status) => {
                const count =
                  status === "ALL"
                    ? passwordResets.length
                    : passwordResets.filter((r) => r.status === status).length;
                const active = resetStatusFilter === status;
                return (
                  <button
                    key={status}
                    onClick={() => setResetStatusFilter(status)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                      active
                        ? "bg-destructive text-white shadow-lg"
                        : "bg-card text-muted-foreground hover:text-white hover:bg-muted"
                    }`}
                  >
                    <span>{status === "ALL" ? "All Requests" : status.charAt(0) + status.slice(1).toLowerCase()}</span>
                    <span
                      className={`text-xs px-1.5 py-0.2 rounded-full font-mono ${
                        active ? "bg-background/60 text-white" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* List of Requests */}
          {filteredPasswordResets.length === 0 ? (
            <div className="p-12 text-center rounded-3xl border border-border bg-background/60 space-y-3">
              <div className="h-12 w-12 rounded-2xl bg-card border border-border text-muted-foreground flex items-center justify-center mx-auto">
                <KeyRound className="h-6 w-6" />
              </div>
              <h4 className="text-base font-bold text-white uppercase">No Password Reset Requests Found</h4>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                {resetSearch
                  ? "No requests matched your search filter criteria."
                  : "There are currently no password reset requests submitted by users."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPasswordResets.map((req) => {
                const athlete = req.player;
                const isPending = req.status === "PENDING";
                const isApproved = req.status === "APPROVED";
                const isCompleted = req.status === "COMPLETED";
                const isLoading = resetActionLoading === req.id;

                return (
                  <div
                    key={req.id}
                    className={`rounded-2xl border p-5 transition-all space-y-4 ${
                      isPending
                        ? "border-secondary/40 bg-gradient-to-b from-secondary/20 to-background shadow-lg"
                        : isApproved
                        ? "border-primary/40 bg-gradient-to-b from-primary/20 to-background"
                        : "border-border bg-background/80"
                    }`}
                  >
                    {/* Athlete Info & Status Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-card border border-border flex items-center justify-center font-black text-sm text-foreground shrink-0">
                          {athlete?.gamerTag ? athlete.gamerTag.substring(0, 2).toUpperCase() : "USR"}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-black text-sm text-white">
                              {athlete?.gamerTag || "Unknown Player"}
                            </h4>
                            {athlete?.division && (
                              <Badge variant="outline" className="text-xs border-border bg-card/80 text-primary">
                                {athlete.division}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {athlete?.fullName || "Registered Member"}
                          </p>
                        </div>
                      </div>

                      {/* Status Badge */}
                      {isPending && (
                        <Badge variant="yellow" className="text-xs font-black uppercase animate-pulse flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>Pending Approval</span>
                        </Badge>
                      )}
                      {isApproved && (
                        <Badge variant="secondary" className="text-xs font-black uppercase bg-primary/20 text-primary border-primary/40 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Approved (Awaiting Reset)</span>
                        </Badge>
                      )}
                      {isCompleted && (
                        <Badge variant="secondary" className="text-xs font-black uppercase bg-primary/20 text-primary border-primary/40 flex items-center gap-1">
                          <Check className="h-3 w-3" />
                          <span>Completed</span>
                        </Badge>
                      )}
                      {req.status === "REJECTED" && (
                        <Badge variant="destructive" className="text-xs font-black uppercase flex items-center gap-1">
                          <XCircle className="h-3 w-3" />
                          <span>Rejected</span>
                        </Badge>
                      )}
                    </div>

                    {/* Contact & Request Details */}
                    <div className="space-y-2 rounded-xl bg-card/60 p-3 border border-border/80 text-xs">
                      <div className="flex items-center justify-between text-foreground">
                        <span className="text-muted-foreground flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>Email:</span>
                        </span>
                        <div className="flex items-center gap-1 font-mono font-medium text-white">
                          <span>{req.email}</span>
                          <button
                            type="button"
                            onClick={() => handleCopyKonamiId(req.id, req.email)}
                            className="p-1 text-muted-foreground hover:text-white"
                            title="Copy email"
                          >
                            {copiedId === req.id ? (
                              <Check className="h-3 w-3 text-primary" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      </div>

                      {athlete?.whatsapp && (
                        <div className="flex items-center justify-between text-foreground">
                          <span className="text-muted-foreground flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>WhatsApp:</span>
                          </span>
                          <a
                            href={`https://wa.me/${athlete.whatsapp.replace(/[^0-9]/g, "")}`}
                            target="_blank"
                            rel="noreferrer"
                            className="font-mono text-primary hover:underline flex items-center gap-1"
                          >
                            {athlete.whatsapp}
                            <ExternalLink className="h-2.5 w-2.5" />
                          </a>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-muted-foreground text-xs pt-1 border-t border-border">
                        <span>Requested At:</span>
                        <span className="font-mono text-foreground">
                          {new Date(req.createdAt).toLocaleDateString()} {new Date(req.createdAt).toLocaleTimeString()}
                        </span>
                      </div>

                      {req.approvedAt && (
                        <div className="flex items-center justify-between text-primary/80 text-xs">
                          <span>Approved At:</span>
                          <span className="font-mono">
                            {new Date(req.approvedAt).toLocaleDateString()} {new Date(req.approvedAt).toLocaleTimeString()}
                          </span>
                        </div>
                      )}

                      {req.completedAt && (
                        <div className="flex items-center justify-between text-primary/80 text-xs">
                          <span>Password Reset At:</span>
                          <span className="font-mono">
                            {new Date(req.completedAt).toLocaleDateString()} {new Date(req.completedAt).toLocaleTimeString()}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-2 pt-1">
                      {isPending && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeletePasswordReset(req.id, "REJECT")}
                            disabled={isLoading}
                            className="text-xs border-border hover:bg-destructive/40 hover:text-destructive text-muted-foreground"
                          >
                            <XCircle className="h-3.5 w-3.5 mr-1" />
                            Decline
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleApprovePasswordReset(req.id, athlete?.gamerTag)}
                            disabled={isLoading}
                            className="text-xs bg-primary hover:bg-primary text-white font-bold gap-1.5 shadow-md"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            {isLoading ? "Approving..." : "Approve Permission"}
                          </Button>
                        </>
                      )}

                      {isApproved && (
                        <div className="w-full flex items-center justify-between">
                          <span className="text-xs text-primary flex items-center gap-1 font-medium">
                            <Check className="h-3.5 w-3.5" />
                            Ready for user to reset
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeletePasswordReset(req.id, "DELETE")}
                            disabled={isLoading}
                            className="text-xs border-border hover:bg-card text-muted-foreground"
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                            Remove
                          </Button>
                        </div>
                      )}

                      {(isCompleted || req.status === "REJECTED") && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeletePasswordReset(req.id, "DELETE")}
                          disabled={isLoading}
                          className="text-xs border-border hover:bg-card text-muted-foreground"
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                          Delete Log
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* REPLACE ATHLETE MODAL */}
      {replaceTargetPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4">
          <div className="relative max-w-xl w-full max-h-screen overflow-y-auto rounded-3xl border border-primary/40 bg-background p-4 sm:p-6 space-y-5 shadow-2xl no-scrollbar">
            <div className="flex items-start justify-between border-b border-border pb-3">
              <div>
                <div className="flex items-center gap-2 text-primary">
                  <Shuffle className="h-5 w-5" />
                  <h3 className="text-lg font-black uppercase text-white">Replace Active Athlete</h3>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Replacing <strong className="text-white">{replaceTargetPlayer.gamerTag}</strong> ({replaceTargetPlayer.division})
                  {replaceTargetPlayer.consecutiveMissed >= 3 && (
                      <span className="ml-2 px-2 py-0.5 rounded bg-destructive/20 text-destructive border border-destructive/30 text-xs font-bold">
                      {replaceTargetPlayer.consecutiveMissed} Missed Matches
                    </span>
                  )}
                </p>
              </div>
              <button
                onClick={() => setReplaceTargetPlayer(null)}
                className="rounded-full bg-card p-1.5 text-muted-foreground hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* 48-Hour Priority Backlog Protocol Info */}
            <div className="p-3.5 rounded-2xl bg-primary/10 border border-primary/30 space-y-1">
              <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wide">
                <Clock className="h-4 w-4 text-primary shrink-0" />
                <span>48-Hour Priority Backlog Protocol</span>
              </div>
              <p className="text-xs text-foreground leading-relaxed">
                Upon confirmation, any missed fixtures, unplayed auto-draws (0-0), and on-hold matches will be transferred to the replacement athlete with an active <strong>48-hour completion window</strong>. Both the replacement athlete and their opponents will be notified immediately to upload results.
              </p>
            </div>

            <form onSubmit={handleReplaceAthleteSubmit} className="space-y-4">
              {/* Replacement Source Mode Tabs */}
              <div className="grid grid-cols-2 gap-2 bg-card p-1 rounded-xl border border-border">
                <button
                  type="button"
                  onClick={() => setReplaceMode("FROM_RESERVE")}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${
                    replaceMode === "FROM_RESERVE"
                      ? "bg-primary text-white shadow-md"
                      : "text-muted-foreground hover:text-white"
                  }`}
                >
                  From Reserve Pool ({reservePlayers.length})
                </button>
                <button
                  type="button"
                  onClick={() => setReplaceMode("NEW_DETAILS")}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${
                    replaceMode === "NEW_DETAILS"
                      ? "bg-primary text-white shadow-md"
                      : "text-muted-foreground hover:text-white"
                  }`}
                >
                  Register New Athlete
                </button>
              </div>

              {replaceMode === "FROM_RESERVE" ? (
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground">
                    Select Replacement from Reserve Pool *
                  </label>
                  {reservePlayers.length === 0 ? (
                    <div className="p-4 rounded-xl bg-secondary/20 border border-secondary/30 text-xs text-secondary">
                      No athletes currently in the reserve pool. Switch to &quot;Register New Athlete&quot; instead.
                    </div>
                  ) : (
                    <select
                      value={selectedReserveId}
                      onChange={(e) => setSelectedReserveId(e.target.value)}
                      className="w-full bg-card border border-border rounded-xl px-3 py-2.5 text-xs text-white font-medium focus:ring-1 focus:ring-primary"
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
                      <label className="text-xs font-bold uppercase text-muted-foreground">New Gamer Tag *</label>
                      <Input
                        placeholder="e.g. RW_Champion"
                        value={repGamerTag}
                        onChange={(e) => setRepGamerTag(e.target.value)}
                        className="bg-card border-border text-xs"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase text-muted-foreground">Full Name *</label>
                      <Input
                        placeholder="e.g. Jean Paul"
                        value={repFullName}
                        onChange={(e) => setRepFullName(e.target.value)}
                        className="bg-card border-border text-xs"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase text-muted-foreground">WhatsApp Number</label>
                      <Input
                        placeholder="e.g. +250 788 000 000"
                        value={repWhatsapp}
                        onChange={(e) => setRepWhatsapp(e.target.value)}
                        className="bg-card border-border text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase text-muted-foreground">Login Email (Optional)</label>
                      <Input
                        type="email"
                        placeholder="New login email"
                        value={repEmail}
                        onChange={(e) => setRepEmail(e.target.value)}
                        className="bg-card border-border text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-muted-foreground">Login Password (Optional)</label>
                    <Input
                      type="password"
                      placeholder="Minimum 6 characters"
                      value={repPassword}
                      onChange={(e) => setRepPassword(e.target.value)}
                      className="bg-card border-border text-xs"
                    />
                  </div>
                </div>
              )}

              {/* Action on replaced athlete */}
              <div className="space-y-1.5 pt-2 border-t border-border">
                <label className="text-xs font-bold uppercase text-muted-foreground">
                  Outgoing Athlete Disposition:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label
                    className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer text-xs ${
                      outgoingAction === "REMOVE"
                        ? "border-destructive bg-destructive/20 text-white font-bold"
                        : "border-border bg-card text-muted-foreground"
                    }`}
                  >
                    <input
                      type="radio"
                      name="outgoingAction"
                      value="REMOVE"
                      checked={outgoingAction === "REMOVE"}
                      onChange={() => setOutgoingAction("REMOVE")}
                      className="text-destructive"
                    />
                    <span>Delete Account Permanently</span>
                  </label>
                  <label
                    className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer text-xs ${
                      outgoingAction === "MOVE_TO_RESERVE"
                        ? "border-secondary bg-secondary/20 text-white font-bold"
                        : "border-border bg-card text-muted-foreground"
                    }`}
                  >
                    <input
                      type="radio"
                      name="outgoingAction"
                      value="MOVE_TO_RESERVE"
                      checked={outgoingAction === "MOVE_TO_RESERVE"}
                      onChange={() => setOutgoingAction("MOVE_TO_RESERVE")}
                      className="text-secondary"
                    />
                    <span>Move to Reserve Pool</span>
                  </label>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-primary/20 border border-primary/20 text-xs text-primary">
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
                  className="bg-primary hover:bg-primary text-white font-bold text-xs"
                >
                  <Shuffle className="h-4 w-4 mr-1.5" />
                  {replaceLoading ? "Replacing..." : "Confirm Athlete Replacement"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ASSIGN / EDIT REAL CLUB MODAL */}
      {editingClubPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-2xl rounded-3xl border border-border bg-background p-6 space-y-5 shadow-2xl max-h-screen flex flex-col">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-lg font-black uppercase text-white flex items-center gap-2">
                  Assign Official Football Club
                </h3>
                <p className="text-xs text-muted-foreground">
                  Assigning club representation for <strong className="text-white">{editingClubPlayer.gamerTag}</strong> ({editingClubPlayer.division}).
                </p>
              </div>
              <button
                onClick={() => setEditingClubPlayer(null)}
                className="text-muted-foreground hover:text-white text-sm p-1.5 rounded-lg hover:bg-card"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-foreground bg-card/80 p-3 rounded-xl border border-border flex items-center justify-between">
              <span>
                Eligible League:{" "}
                <strong className="text-primary uppercase">
                  {editingClubPlayer.division === "Division 1"
                    ? "Premier League (England)"
                    : editingClubPlayer.division === "Division 2"
                    ? "La Liga (Spain)"
                    : "Serie A (Italy)"}
                </strong>
              </span>
              <Badge variant="secondary" className="text-xs">
                {getTeamsForDivision(editingClubPlayer.division).length} Clubs Available
              </Badge>
            </div>

            {/* Grid of clubs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 overflow-y-auto p-1 max-h-96">
              {getTeamsForDivision(editingClubPlayer.division).map((team) => {
                const isSelected = selectedClubName === team.name;
                const otherPlayer = (playersList || []).find(
                  (p) =>
                    p.id !== editingClubPlayer.id &&
                    p.status !== "REJECTED" &&
                    p.realTeam &&
                    p.realTeam.trim().toLowerCase() === team.name.trim().toLowerCase()
                );
                const isTaken = Boolean(otherPlayer);
                return (
                  <button
                    key={team.name}
                    type="button"
                    disabled={isTaken}
                    onClick={() => setSelectedClubName(team.name)}
                    className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-2 relative ${
                      isSelected
                        ? "border-primary bg-primary/20 shadow-lg ring-2 ring-primary/50"
                        : isTaken
                        ? "border-border/60 bg-background/80 opacity-40 cursor-not-allowed"
                        : "border-border bg-card/60 hover:bg-muted/80 hover:border-border"
                    }`}
                  >
                    <div className="h-12 w-12 rounded-xl bg-background/60 p-1.5 flex items-center justify-center border border-border">
                      <img
                        src={team.logo}
                        alt={team.name}
                        className="h-full w-full object-contain"
                        loading="lazy"
                      />
                    </div>
                    <div className="w-full">
                      <div className="text-xs font-bold text-white truncate" title={team.name}>
                        {team.name}
                      </div>
                      <div className="text-xs font-mono text-muted-foreground">
                        {team.shortName}
                      </div>
                      {isTaken ? (
                        <span className="text-xs font-mono text-destructive font-bold block truncate mt-0.5">
                          TAKEN (@{otherPlayer?.gamerTag})
                        </span>
                      ) : isSelected ? (
                        <span className="text-xs font-mono text-primary font-bold block mt-0.5">
                          SELECTED
                        </span>
                      ) : (
                        <span className="text-xs font-mono text-primary font-semibold block mt-0.5">
                          Available
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectedClubName("")}
                className="text-xs text-destructive border-destructive/30 hover:bg-destructive/30"
              >
                Clear Club
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingClubPlayer(null)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={() => handleUpdatePlayerClub(editingClubPlayer.id, selectedClubName)}
                  disabled={updatingClub}
                  className="bg-primary hover:bg-primary text-white font-bold text-xs"
                >
                  {updatingClub ? "Saving..." : "Save Club Assignment"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CHANGE ATHLETE DIVISION MODAL */}
      {editingDivisionPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg rounded-3xl border border-border bg-background p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-lg font-black uppercase text-white flex items-center gap-2">
                  <Layers className="h-5 w-5 text-secondary" />
                  Change Athlete Division
                </h3>
                <p className="text-xs text-muted-foreground">
                  Transferring <strong className="text-white">@{editingDivisionPlayer.gamerTag}</strong> ({editingDivisionPlayer.fullName})
                </p>
              </div>
              <button
                onClick={() => setEditingDivisionPlayer(null)}
                className="text-muted-foreground hover:text-white text-sm p-1.5 rounded-lg hover:bg-card"
              >
                ✕
              </button>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-card/80 border border-border text-xs">
              <span className="text-muted-foreground">Current Placement:</span>
              <Badge
                variant={
                  editingDivisionPlayer.division === "Division 1"
                    ? "secondary"
                    : editingDivisionPlayer.division === "Division 2"
                    ? "yellow"
                    : editingDivisionPlayer.division === "Division 3"
                    ? "live"
                    : "outline"
                }
                className="font-bold text-xs"
              >
                {editingDivisionPlayer.division}
              </Badge>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Select Destination Division
              </label>
              <div className="grid grid-cols-1 gap-2.5">
                {[
                  {
                    id: "Division 1",
                    name: "Division 1",
                    league: "Premier League (England)",
                    desc: "20 Premier League clubs. Top division with eFootball UCL spots.",
                    color: "border-primary/40 hover:border-primary bg-primary/20 text-primary",
                    activeRing: "ring-2 ring-primary bg-primary/40",
                  },
                  {
                    id: "Division 2",
                    name: "Division 2",
                    league: "La Liga (Spain)",
                    desc: "20 La Liga clubs. Promotion to Div 1 and Europa League spots.",
                    color: "border-secondary/40 hover:border-secondary bg-secondary/20 text-secondary",
                    activeRing: "ring-2 ring-secondary bg-secondary/40",
                  },
                  {
                    id: "Division 3",
                    name: "Division 3",
                    league: "Serie A (Italy)",
                    desc: "20 Serie A clubs. Promotion to Div 2 and Europa League spots.",
                    color: "border-accent hover:border-accent-foreground bg-accent/20 text-accent-foreground",
                    activeRing: "ring-2 ring-accent-foreground bg-accent/40",
                  },
                  {
                    id: "RESERVE",
                    name: "Reserve Standby Pool",
                    league: "Standby Bench",
                    desc: "Move athlete to the reserve waiting list for substitutions.",
                    color: "border-muted hover:border-muted-foreground bg-muted/40 text-muted-foreground",
                    activeRing: "ring-2 ring-muted-foreground bg-muted/60",
                  },
                ].map((divOption) => {
                  const isSelected = selectedTargetDivision === divOption.id;
                  const isCurrent = editingDivisionPlayer.division === divOption.id;

                  return (
                    <button
                      key={divOption.id}
                      type="button"
                      onClick={() => setSelectedTargetDivision(divOption.id)}
                      className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                        isSelected ? divOption.activeRing : divOption.color
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white">{divOption.name}</span>
                          <span className="text-xs font-mono px-2 py-0.5 rounded bg-black/40 text-muted-foreground">
                            {divOption.league}
                          </span>
                          {isCurrent && (
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                              (Current)
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{divOption.desc}</p>
                      </div>
                      <div
                        className={`h-5 w-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                          isSelected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-muted"
                        }`}
                      >
                        {isSelected && <Check className="h-3 w-3 stroke-2" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {editingDivisionPlayer.realTeam && selectedTargetDivision !== editingDivisionPlayer.division && (
              <div className="rounded-xl border border-secondary/30 bg-secondary/30 p-3 text-xs text-secondary flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-secondary mt-0.5" />
                <span>
                  Notice: <strong>@{editingDivisionPlayer.gamerTag}</strong> currently represents <strong>{editingDivisionPlayer.realTeam}</strong>. If moved to {selectedTargetDivision}, any incompatible club will be cleared so they can pick a valid team from the new league.
                </span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingDivisionPlayer(null)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => handleUpdatePlayerDivision(editingDivisionPlayer.id, selectedTargetDivision)}
                disabled={updatingDivision || selectedTargetDivision === editingDivisionPlayer.division}
                className="bg-primary hover:bg-primary/80 text-primary-foreground font-bold text-xs gap-1.5"
              >
                <Layers className={`h-3.5 w-3.5 ${updatingDivision ? "animate-spin" : ""}`} />
                {updatingDivision ? "Transferring..." : "Confirm Division Change"}
              </Button>
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
          <div className="relative max-w-4xl w-full max-h-screen overflow-hidden rounded-2xl border border-border bg-background">
            <button
              onClick={() => setInspectImage(null)}
              className="absolute top-4 right-4 z-10 rounded-full bg-card/80 p-2 text-white hover:bg-muted"
            >
              ✕
            </button>
            <img
              src={inspectImage}
              alt="Screenshot Evidence Inspection"
              className="w-full h-auto max-h-screen object-contain mx-auto"
            />
          </div>
        </div>
      )}

      {/* CONTINENTAL ANIMATED DRAWS MODAL (ADMIN COMMISSIONER ONLY) */}
      {activeDrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-background/90 backdrop-blur-xl overflow-y-auto">
          <div className="relative w-full max-w-5xl my-auto">
            <button
              onClick={() => setActiveDrawModal(null)}
              className="absolute -top-3 -right-3 z-50 p-2 rounded-full bg-muted hover:bg-muted text-white shadow-xl border border-border"
              title="Close Draw Screen"
            >
              <XCircle className="h-6 w-6 text-foreground" />
            </button>
            <ContinentalDrawExperience
              competition={activeDrawModal}
              qualifiedAthletes={activeDrawModal === "UCL" ? uclQualifiedAthletes : europaQualifiedAthletes}
              existingSlots={activeDrawModal === "UCL" ? uclSlots : europaSlots}
              isAdmin={true}
              onCommitDraw={async (slots) => {
                await handleCommitDrawFromModal(activeDrawModal, slots);
              }}
              onClose={() => setActiveDrawModal(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
