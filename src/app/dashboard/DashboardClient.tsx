"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Smartphone,
  Clock,
  MessageSquare,
  Copy,
  Check,
  Upload,
  ShieldAlert,
  Trophy,
  Bell,
  CheckCircle,
  AlertTriangle,
  LogOut,
  ExternalLink,
  ChevronRight,
  Send,
  X,
  Sparkles,
  Lock,
  CheckCircle2,
  User,
  Save,
  Eye,
  EyeOff,
  Calendar,
  Star,
  Unlock,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import MatchOfTheDayCard from "@/components/MatchOfTheDayCard";
import EfootballLoader from "@/components/EfootballLoader";
import HomeDivisionsTabs from "@/components/HomeDivisionsTabs";

export default function DashboardClient({
  player,
  user,
  activeMatch,
  allPlayerMatches = [],
  announcements,
  recentMatches,
  standing,
  leagueConfig,
  divisionalMotd = {},
  div1Standings = [],
  div2Standings = [],
  div3Standings = [],
  initialReview = null,
}: {
  player: any;
  user: any;
  activeMatch: any;
  allPlayerMatches?: any[];
  announcements: any[];
  recentMatches: any[];
  standing: any;
  leagueConfig?: any;
  divisionalMotd?: Record<string, any>;
  div1Standings?: any[];
  div2Standings?: any[];
  div3Standings?: any[];
  initialReview?: any;
}) {
  const router = useRouter();

  // Dynamic user and player profile state
  const [currentPlayer, setCurrentPlayer] = useState(player);
  const [currentUser, setCurrentUser] = useState(user);

  // Selected MOTD tab in dashboard
  const [selectedMotdDiv, setSelectedMotdDiv] = useState<string>(
    player.division || "Division 1"
  );

  // Announcement read tracking (interactive from localStorage)
  const [readAnnouncements, setReadAnnouncements] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const storageKey = `efrl_read_ann_${player.id}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setReadAnnouncements(new Set<string>(JSON.parse(saved)));
      }
    } catch (e) {
      console.error("Read receipt load error:", e);
    }
  }, [player.id]);

  const handleMarkAsRead = async (announcementId: string) => {
    try {
      const storageKey = `efrl_read_ann_${player.id}`;
      const updated = new Set(readAnnouncements);
      updated.add(announcementId);
      setReadAnnouncements(updated);
      localStorage.setItem(storageKey, JSON.stringify(Array.from(updated)));

      await fetch("/api/announcements/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ announcementId }),
      });
    } catch (e) {
      console.error("Failed to mark announcement as read:", e);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const storageKey = `efrl_read_ann_${player.id}`;
      const updated = new Set(readAnnouncements);
      announcements.forEach((ann) => updated.add(ann.id));
      setReadAnnouncements(updated);
      localStorage.setItem(storageKey, JSON.stringify(Array.from(updated)));

      await Promise.all(
        announcements.map((ann) =>
          fetch("/api/announcements/read", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ announcementId: ann.id }),
          }).catch(() => {})
        )
      );
    } catch (e) {
      console.error("Failed to mark all announcements as read:", e);
    }
  };

  // Profile Update State
  const [profileGamerTag, setProfileGamerTag] = useState(player.gamerTag || "");
  const [profileFullName, setProfileFullName] = useState(player.fullName || "");
  const [profileWhatsapp, setProfileWhatsapp] = useState(player.whatsapp || "");
  const [profileEmail, setProfileEmail] = useState(user?.email || "");
  const [profilePassword, setProfilePassword] = useState("");
  const [profileConfirmPassword, setProfileConfirmPassword] = useState("");
  const [showProfilePassword, setShowProfilePassword] = useState(false);
  const [profileUpdating, setProfileUpdating] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState("");
  const [profileErrorMsg, setProfileErrorMsg] = useState("");

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileUpdating(true);
    setProfileSuccessMsg("");
    setProfileErrorMsg("");

    if (profilePassword && profilePassword.length < 6) {
      setProfileErrorMsg("New password must be at least 6 characters.");
      setProfileUpdating(false);
      return;
    }

    if (profilePassword && profilePassword !== profileConfirmPassword) {
      setProfileErrorMsg("New password and confirmation do not match.");
      setProfileUpdating(false);
      return;
    }

    try {
      const res = await fetch("/api/player/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: profileEmail,
          gamerTag: profileGamerTag,
          fullName: profileFullName,
          whatsapp: profileWhatsapp,
          password: profilePassword || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update profile");

      setProfileSuccessMsg(data.message || "Profile updated successfully!");
      setProfilePassword("");
      setProfileConfirmPassword("");

      if (data.player) {
        setCurrentPlayer(data.player);
      }
      if (data.user) {
        setCurrentUser(data.user);
        try {
          const stored = localStorage.getItem("efrl_user");
          if (stored) {
            const parsed = JSON.parse(stored);
            localStorage.setItem(
              "efrl_user",
              JSON.stringify({ ...parsed, email: data.user.email, player: data.player || parsed.player })
            );
          }
        } catch (err) {}
      }
      router.refresh();
    } catch (err: any) {
      setProfileErrorMsg(err.message || "Failed to update profile");
    } finally {
      setProfileUpdating(false);
    }
  };

  // 24-hour Countdown Timer State
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
  }>({ hours: 0, minutes: 0, seconds: 0, isExpired: false });

  // WhatsApp Copied state
  const [copied, setCopied] = useState(false);

  // Modals state
  const [showResultModal, setShowResultModal] = useState(false);
  const [showForfeitModal, setShowForfeitModal] = useState(false);

  // Result form state
  const [homeScore, setHomeScore] = useState<number | string>(0);
  const [awayScore, setAwayScore] = useState<number | string>(0);
  const [resultScreenshot, setResultScreenshot] = useState("");
  const [resultNotes, setResultNotes] = useState("");
  const [submittingResult, setSubmittingResult] = useState(false);
  const [resultSuccessMsg, setResultSuccessMsg] = useState("");

  // Forfeit form state
  const [forfeitScreenshot, setForfeitScreenshot] = useState("");
  const [forfeitReason, setForfeitReason] = useState("");
  const [submittingForfeit, setSubmittingForfeit] = useState(false);
  const [forfeitSuccessMsg, setForfeitSuccessMsg] = useState("");

  // Direct messaging to admin state
  const [inboxSubTab, setInboxSubTab] = useState<"ANNOUNCEMENTS" | "DIRECT_MESSAGES">("ANNOUNCEMENTS");
  const [playerMessages, setPlayerMessages] = useState<any[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [msgSubject, setMsgSubject] = useState("");
  const [msgContent, setMsgContent] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [msgSuccess, setMsgSuccess] = useState("");
  const [msgError, setMsgError] = useState("");

  const fetchPlayerMessages = async () => {
    setLoadingMessages(true);
    try {
      const res = await fetch("/api/messages");
      const data = await res.json();
      if (data.messages) {
        setPlayerMessages(data.messages);
      }
    } catch (err) {
      console.error("Failed to load messages", err);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    fetchPlayerMessages();
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgSubject.trim() || !msgContent.trim()) return;
    setSendingMessage(true);
    setMsgSuccess("");
    setMsgError("");
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: msgSubject.trim(), content: msgContent.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send message");
      setMsgSuccess(data.message || "Message sent to league commissioners!");
      setMsgSubject("");
      setMsgContent("");
      if (data.data) {
        setPlayerMessages((prev) => [data.data, ...prev]);
      }
    } catch (err: any) {
      setMsgError(err.message || "Failed to send message");
    } finally {
      setSendingMessage(false);
    }
  };

  // Active tab (if player is reserved, default to STANDINGS)
  const isReserved = currentPlayer.status === "RESERVED";
  type DashboardTab = "OVERVIEW" | "CALENDAR" | "INBOX" | "HISTORY" | "STANDINGS" | "FEEDBACK" | "PROFILE";
  const [activeTab, setActiveTab] = useState<DashboardTab>(
    isReserved ? "STANDINGS" : "OVERVIEW"
  );

  // Rating & Review State
  const [userRating, setUserRating] = useState<number>(initialReview?.rating || 5);
  const [reviewCategory, setReviewCategory] = useState<string>(initialReview?.category || "GENERAL");
  const [reviewComment, setReviewComment] = useState<string>(initialReview?.comment || "");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState("");
  const [reviewErrorMsg, setReviewErrorMsg] = useState("");
  const [activeReview, setActiveReview] = useState<any>(initialReview);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingReview(true);
    setReviewSuccessMsg("");
    setReviewErrorMsg("");
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: userRating,
          category: reviewCategory,
          comment: reviewComment.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit review");
      setReviewSuccessMsg(data.message || "Thank you for your rating & feedback!");
      if (data.review) {
        setActiveReview(data.review);
      }
    } catch (err: any) {
      setReviewErrorMsg(err.message || "Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  };

  // Unread announcements count
  const unreadAnnouncementsCount = announcements.filter((a) => !readAnnouncements.has(a.id)).length;

  // Determine opponent
  const isHomePlayer = activeMatch?.homePlayerId === player.id;
  const opponent = isHomePlayer ? activeMatch?.awayPlayer : activeMatch?.homePlayer;

  // Countdown timer calculation
  useEffect(() => {
    if (!activeMatch?.deadlineDate) return;

    const calculateTime = () => {
      const deadline = new Date(activeMatch.deadlineDate).getTime();
      const now = new Date().getTime();
      const diff = deadline - now;

      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, isExpired: true });
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft({ hours, minutes, seconds, isExpired: false });
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [activeMatch?.deadlineDate]);

  // Check if active match options are locked
  const isMatchLocked = Boolean(
    activeMatch &&
    (timeLeft.isExpired || activeMatch.status === "FORFEIT" || activeMatch.status === "FINISHED") &&
    !activeMatch.notes?.includes("ADMIN_REOPENED") &&
    !activeMatch.allowLateSubmission
  );

  // Linked submission & forfeit status for this match (shared between both athletes)
  const sharedSubmission =
    activeMatch?.submissions?.find((s: any) => s.status !== "REJECTED") ||
    activeMatch?.submissions?.[0] ||
    null;
  const hasSubmittedResult = Boolean(sharedSubmission);
  const isSubmissionPending = sharedSubmission?.status === "PENDING";
  const isSubmissionApproved =
    sharedSubmission?.status === "APPROVED" || activeMatch?.status === "FINISHED";

  const sharedForfeit =
    activeMatch?.forfeitClaims?.find((f: any) => f.status !== "REJECTED") ||
    activeMatch?.forfeitClaims?.[0] ||
    null;
  const hasClaimedForfeit = Boolean(sharedForfeit);

  const submitterGamerTag =
    sharedSubmission?.submittedByPlayer?.gamerTag ||
    (sharedSubmission?.submittedByPlayerId === player.id
      ? player.gamerTag
      : opponent?.gamerTag || "Opponent");
  const isMySubmission = sharedSubmission?.submittedByPlayerId === player.id;

  const claimantGamerTag =
    sharedForfeit?.claimantPlayer?.gamerTag ||
    (sharedForfeit?.claimantPlayerId === player.id
      ? player.gamerTag
      : opponent?.gamerTag || "Opponent");
  const isMyClaim = sharedForfeit?.claimantPlayerId === player.id;

  // Is uploading closed for both players?
  const isUploadClosedForBoth = Boolean(
    isMatchLocked ||
    hasSubmittedResult ||
    hasClaimedForfeit ||
    (timeLeft.isExpired && !activeMatch?.allowLateSubmission)
  );

  const isOneHourWarning = Boolean(
    activeMatch &&
    !isMatchLocked &&
    !timeLeft.isExpired &&
    timeLeft.hours === 0 &&
    !hasSubmittedResult &&
    !hasClaimedForfeit
  );

  // Copy WhatsApp Number helper
  const handleCopyWhatsApp = (num: string) => {
    navigator.clipboard.writeText(num);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Convert File to Base64 Image
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (s: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setter(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Result Submission
  const handleSubmitResult = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingResult(true);
    setResultSuccessMsg("");

    try {
      const res = await fetch("/api/submissions/result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId: activeMatch.id,
          homeScore: Number(homeScore),
          awayScore: Number(awayScore),
          screenshotUrl: resultScreenshot,
          notes: resultNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit result");

      setResultSuccessMsg(data.message);
      setTimeout(() => {
        setShowResultModal(false);
        router.refresh();
      }, 1500);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmittingResult(false);
    }
  };

  // Handle Forfeit Submission
  const handleSubmitForfeit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingForfeit(true);
    setForfeitSuccessMsg("");

    try {
      const res = await fetch("/api/submissions/forfeit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId: activeMatch.id,
          proofScreenshotUrl: forfeitScreenshot,
          reason: forfeitReason,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit forfeit claim");

      setForfeitSuccessMsg(data.message);
      setTimeout(() => {
        setShowForfeitModal(false);
        router.refresh();
      }, 1500);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmittingForfeit(false);
    }
  };

  const handleLogout = async () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("efrl_user");
    }
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/?loggedOut=player");
    router.refresh();
  };

  const cleanWhatsapp = opponent?.whatsapp?.replace(/[^0-9]/g, "") || "";

  if (player.status === "PENDING_APPROVAL") {
    return (
      <div className="mx-auto max-w-4xl space-y-8 py-6">
        <div className="rounded-3xl border border-amber-500/40 bg-gradient-to-br from-amber-950/30 via-slate-950 to-slate-950 p-6 sm:p-10 shadow-2xl backdrop-blur-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 font-black text-2xl shadow-lg">
                {player.gamerTag.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-black text-white">{player.gamerTag}</h1>
                  <Badge variant="yellow" className="text-xs">PENDING APPROVAL</Badge>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Requested Division: <strong className="text-white">{player.division}</strong> • WA: <span className="text-emerald-400 font-mono">{player.whatsapp}</span>
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout} className="text-xs gap-2">
              <LogOut className="h-4 w-4" /> Sign Out
            </Button>
          </div>

          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 space-y-3">
            <div className="flex items-center gap-3 text-amber-400">
              <ShieldAlert className="h-6 w-6 shrink-0" />
              <h3 className="text-lg font-black uppercase">Registration Under League Review</h3>
            </div>
            <p className="text-sm text-slate-200 leading-relaxed">
              Welcome, <strong className="text-white">{player.gamerTag}</strong>! Your athlete profile has been received.
              The League Commissioner will review your account to either approve your placement in <strong>{player.division}</strong> or assign you to the official <strong>Standby Reserve Pool</strong>.
            </p>
            <p className="text-xs text-slate-400">
              Matchday fixtures, scheduling, and table standings will become active once your registration is officially placed by an administrator.
            </p>
          </div>

          {/* External Links */}
          <div className="rounded-2xl border border-slate-800 bg-[#080d1e]/80 p-5 space-y-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Official Community & League Resources (Open Access)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <a
                href="https://discord.gg/rbaFrBB5p"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-xs text-slate-300 font-semibold flex items-center justify-between transition-all hover:text-white"
              >
                <span>Official Discord Community</span>
                <ExternalLink className="h-4 w-4 text-cyan-400" />
              </a>
              <a
                href="https://www.instagram.com/efootball_rwanda1/?utm_source=ig_web_button_share_sheet&stkn=ZDNlZDc0MzIxNw%3D%3D"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-pink-500/40 text-xs text-slate-300 font-semibold flex items-center justify-between transition-all hover:text-white"
              >
                <span>Official Instagram</span>
                <ExternalLink className="h-4 w-4 text-pink-400" />
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Welcome Bar */}
      <div className="rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 p-6 sm:p-8 backdrop-blur-xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-600 text-slate-950 font-black text-2xl shadow-xl shadow-yellow-500/20">
            {currentPlayer.gamerTag.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {currentPlayer.gamerTag}
              </h1>
              <Badge variant={isReserved ? "outline" : "yellow"} className="text-xs">
                {isReserved ? "RESERVE POOL" : currentPlayer.division}
              </Badge>
              <Badge variant="default" className="text-[10px] uppercase font-mono">
                {currentPlayer.platform}
              </Badge>
            </div>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
              <span>{currentPlayer.fullName}</span>
              <span>•</span>
              <span className="font-mono text-slate-500">Konami ID: {currentPlayer.efootballId}</span>
              <span>•</span>
              <span className="text-emerald-400 font-mono">WA: {currentPlayer.whatsapp}</span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">Status / Rank</span>
            <span className="text-xl font-black text-yellow-400">
              {isReserved ? "STANDBY" : standing ? `#${standing.rank}` : "Unranked"}
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2 text-xs">
            <LogOut className="h-4 w-4 text-slate-400" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Reserve Athlete Status Banner */}
      {isReserved && (
        <div className="rounded-2xl border border-cyan-500/30 bg-cyan-950/20 p-5 space-y-2">
          <div className="flex items-center gap-2 text-cyan-400">
            <Sparkles className="h-5 w-5 shrink-0" />
            <h3 className="text-sm font-black uppercase tracking-wider">Official Reserve Athlete (Standby Roster)</h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            You are registered in the official League Reserve Pool. You are not currently scheduled in daily match fixtures, but you remain eligible as an official replacement athlete whenever an active league slot opens. You can explore all division tables and league announcements below.
          </p>
        </div>
      )}

      {/* Navigation Tabs - Mobile Horizontally Scrollable */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto no-scrollbar scroll-smooth -mx-4 px-4 sm:mx-0 sm:px-0">
        {!isReserved && (
          <button
            onClick={() => setActiveTab("OVERVIEW")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 min-h-[40px] ${
              activeTab === "OVERVIEW"
                ? "bg-sky-500 text-white shadow-lg shadow-sky-500/30"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <Smartphone className="h-4 w-4" />
            <span>Today's 24-Hr Match</span>
          </button>
        )}

        {!isReserved && (
          <button
            onClick={() => setActiveTab("CALENDAR")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 min-h-[40px] ${
              activeTab === "CALENDAR"
                ? "bg-cyan-500 text-slate-950 font-black shadow-lg shadow-cyan-500/30"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <Calendar className="h-4 w-4" />
            <span>Match Calendar</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab("STANDINGS")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 min-h-[40px] ${
            activeTab === "STANDINGS"
              ? "bg-sky-500 text-white shadow-lg shadow-sky-500/30"
              : "text-slate-400 hover:text-white hover:bg-slate-900"
          }`}
        >
          <Trophy className="h-4 w-4" />
          <span>All Division Tables</span>
        </button>

        <button
          onClick={() => setActiveTab("INBOX")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 min-h-[40px] ${
            activeTab === "INBOX"
              ? "bg-sky-500 text-white shadow-lg shadow-sky-500/30"
              : "text-slate-400 hover:text-white hover:bg-slate-900"
          }`}
        >
          <Bell className="h-4 w-4" />
          <span>Announcements & Inbox</span>
          {unreadAnnouncementsCount > 0 && (
            <span className="h-4 w-4 rounded-full bg-yellow-400 text-slate-950 text-[10px] font-black flex items-center justify-center animate-pulse">
              {unreadAnnouncementsCount}
            </span>
          )}
        </button>

        {!isReserved && (
          <button
            onClick={() => setActiveTab("HISTORY")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 min-h-[40px] ${
              activeTab === "HISTORY"
                ? "bg-sky-500 text-white shadow-lg shadow-sky-500/30"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <Trophy className="h-4 w-4" />
            <span>Match History & Proof</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab("FEEDBACK")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 min-h-[40px] ${
            activeTab === "FEEDBACK"
              ? "bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/30"
              : "text-slate-400 hover:text-white hover:bg-slate-900"
          }`}
        >
          <Star className="h-4 w-4" />
          <span>Rate & Feedback</span>
        </button>

        <button
          onClick={() => setActiveTab("PROFILE")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 min-h-[40px] ${
            activeTab === "PROFILE"
              ? "bg-sky-500 text-white shadow-lg shadow-sky-500/30"
              : "text-slate-400 hover:text-white hover:bg-slate-900"
          }`}
        >
          <User className="h-4 w-4" />
          <span>Profile & Settings</span>
        </button>
      </div>

      {/* TAB: STANDINGS (AVAILABLE TO BOTH ACTIVE AND RESERVE ATHLETES) */}
      {activeTab === "STANDINGS" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5 space-y-1">
            <h3 className="text-lg font-black uppercase text-white flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-400" />
              <span>Official League Standings</span>
            </h3>
            <p className="text-xs text-slate-400">
              Live standings across Division 1, Division 2, and Division 3.
            </p>
          </div>
          <HomeDivisionsTabs
            div1Standings={div1Standings}
            div2Standings={div2Standings}
            div3Standings={div3Standings}
          />
        </div>
      )}

      {/* TAB 1: OVERVIEW & ACTIVE 24-HOUR MATCH */}
      {activeTab === "OVERVIEW" && (
        <div className="space-y-8">
          {activeMatch ? (
            <div className="rounded-3xl border-2 border-sky-500/40 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
              {/* Background ambient lighting */}
              <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* Match Header with Live 24-Hour Timer */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5 mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="yellow">{activeMatch.round}</Badge>
                    {activeMatch.isMatchOfTheDay && (
                      <Badge variant="yellow" className="text-[10px] font-black uppercase tracking-wider bg-yellow-500/20 border-yellow-500/40 text-yellow-400 animate-pulse">
                        🌟 MATCH OF THE DAY
                      </Badge>
                    )}
                    <Badge variant="live" className="text-[10px] uppercase">
                      24-HR WINDOW ACTIVE
                    </Badge>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white uppercase">
                    Today's Official League Match
                  </h2>
                </div>

                {/* 24-Hour Countdown Clock */}
                <div className="rounded-2xl border border-sky-500/40 bg-slate-950/80 p-3 sm:px-5 text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block flex items-center gap-1.5 justify-end">
                    <Clock className="h-3 w-3 text-yellow-400" />
                    Time Remaining (12:00 AM Reset)
                  </span>
                  {timeLeft.isExpired ? (
                    <span className="text-sm sm:text-base font-black text-red-400 animate-pulse">
                      Window Closed (Expired)
                    </span>
                  ) : (
                    <div className="font-mono text-xl sm:text-2xl font-black text-yellow-400 flex items-center gap-1 justify-end">
                      <span>{String(timeLeft.hours).padStart(2, "0")}h</span>
                      <span>:</span>
                      <span>{String(timeLeft.minutes).padStart(2, "0")}m</span>
                      <span>:</span>
                      <span>{String(timeLeft.seconds).padStart(2, "0")}s</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Opponent & Match Coordination Card */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center py-4">
                {/* Your Profile */}
                <div className="lg:col-span-4 rounded-2xl bg-slate-950/70 border border-slate-800 p-5 text-center sm:text-left">
                  <span className="text-[10px] font-black uppercase tracking-widest text-sky-400 block mb-2">
                    {isHomePlayer ? "HOME ATHLETE (YOU)" : "AWAY ATHLETE (YOU)"}
                  </span>
                  <h3 className="text-xl font-black text-white">{player.gamerTag}</h3>
                  <p className="text-xs text-slate-400">{player.fullName}</p>
                  <span className="font-mono text-xs text-slate-500 block mt-1">
                    Konami ID: {player.efootballId}
                  </span>
                </div>

                {/* VS Badge */}
                <div className="lg:col-span-4 flex flex-col items-center justify-center text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800 border border-slate-700 font-black text-white text-sm shadow-inner mb-2">
                    VS
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {activeMatch.division} • 10 Mins Match
                  </span>
                </div>

                {/* Opponent Card with WhatsApp Connect */}
                <div className="lg:col-span-4 rounded-2xl bg-slate-950/90 border-2 border-emerald-500/40 p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                      YOUR OPPONENT
                    </span>
                    <Badge variant="green" className="text-[10px]">
                      READY TO CHAT
                    </Badge>
                  </div>

                  <div>
                    <h3 className="text-xl font-black text-white">{opponent?.gamerTag}</h3>
                    <p className="text-xs text-slate-400">{opponent?.fullName}</p>
                    <span className="font-mono text-xs text-slate-500 block mt-0.5">
                      Konami ID: {opponent?.efootballId}
                    </span>
                  </div>

                  {/* Opponent WhatsApp Direct Chat */}
                  <div className="pt-2 border-t border-slate-900 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-medium">WhatsApp:</span>
                      <span className="font-mono font-bold text-emerald-400">
                        {opponent?.whatsapp}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <a
                        href={`https://wa.me/${cleanWhatsapp}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        Chat on WA
                      </a>

                      <button
                        type="button"
                        onClick={() => handleCopyWhatsApp(opponent?.whatsapp)}
                        className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-all"
                      >
                        {copied ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            Copy Number
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* AUTOMATED 1-HOUR DEADLINE WARNING BANNER FOR UNPLAYED MATCHES */}
              {isOneHourWarning && (
                <div className="mt-6 p-4 rounded-2xl border border-amber-500/60 bg-gradient-to-r from-amber-950/60 via-slate-900 to-amber-950/40 flex items-start gap-3.5 text-amber-200 shadow-xl shadow-amber-500/10 ring-1 ring-amber-500/30">
                  <div className="h-9 w-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 mt-0.5">
                    <AlertTriangle className="h-5 w-5 animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="destructive" className="text-[9px] font-black uppercase tracking-wider animate-pulse">
                        ⏰ 1-HOUR DEADLINE WARNING
                      </Badge>
                      <span className="text-xs font-mono font-bold text-white">
                        {timeLeft.minutes}m {timeLeft.seconds}s remaining before 12:00 AM cutoff
                      </span>
                    </div>
                    <p className="text-xs text-amber-100/90 leading-relaxed">
                      You have not uploaded a match result screenshot or submitted a forfeit claim. Message <strong className="text-white">@{opponent?.gamerTag}</strong> on WhatsApp right now to play. If your opponent is unreachable, submit your forfeit claim proof before the timer reaches 00:00:00!
                    </p>
                  </div>
                </div>
              )}

              {/* LATE DEADLINE EXTENDED NOTICE */}
              {activeMatch?.allowLateSubmission && (
                <div className="mt-4 p-4 rounded-2xl border border-emerald-500/50 bg-emerald-950/30 flex items-center gap-3 text-emerald-300">
                  <Unlock className="h-5 w-5 text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-black uppercase tracking-wider text-xs block text-emerald-200">
                      ⏰ Deadline Extended by Admin Office
                    </span>
                    <span className="text-[11px] text-slate-300">
                      The League Commissioner has granted a deadline extension for this match. You are permitted to upload your match score and screenshot proof.
                    </span>
                  </div>
                </div>
              )}

              {/* LINKED RESULT SUBMISSION STATUS CARD (CLOSED FOR BOTH) */}
              {hasSubmittedResult && (
                <div
                  className={`mt-6 p-5 sm:p-6 rounded-2xl border ${
                    isSubmissionApproved
                      ? "border-emerald-500/50 bg-emerald-950/30"
                      : "border-amber-500/50 bg-gradient-to-r from-amber-950/40 via-slate-900/90 to-slate-950/90 ring-1 ring-amber-500/30"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3 mb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {isSubmissionApproved ? (
                        <Badge variant="green" className="font-black text-xs uppercase gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          MATCH RESULT APPROVED & SAVED TO HISTORY
                        </Badge>
                      ) : (
                        <Badge variant="yellow" className="font-black text-xs uppercase gap-1 animate-pulse">
                          <Clock className="h-3.5 w-3.5" />
                          RESULT SUBMITTED — STATUS: PENDING ADMIN APPROVAL
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-[10px] text-slate-300 border-slate-700 font-bold">
                        Uploaded by: @{submitterGamerTag} {isMySubmission ? "(You)" : "(Opponent)"}
                      </Badge>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">
                      Submitted: {sharedSubmission?.createdAt ? new Date(sharedSubmission.createdAt).toLocaleString() : "Recently"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-slate-400 block">Submitted Score</span>
                      <span className="text-3xl font-black font-mono text-white">
                        {sharedSubmission?.homeScore} - {sharedSubmission?.awayScore}
                      </span>
                      {sharedSubmission?.notes && (
                        <p className="text-xs text-slate-400 mt-1 italic">&quot;{sharedSubmission.notes}&quot;</p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                      {sharedSubmission?.screenshotUrl && (
                        <a
                          href={sharedSubmission.screenshotUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 py-2 px-3.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-sky-400 font-bold hover:bg-slate-800 transition"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View Screenshot Proof
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/70 flex items-center gap-2.5 text-xs text-amber-300/90">
                    <Lock className="h-4 w-4 text-amber-400 shrink-0" />
                    <span>
                      <strong>Linked Fixture Lock:</strong> Result proof has been registered by @{submitterGamerTag}. The uploading page is closed for both athletes while the Commissioner Office verifies the screenshot.
                    </span>
                  </div>
                </div>
              )}

              {/* LINKED FORFEIT CLAIM STATUS CARD (CLOSED FOR BOTH) */}
              {!hasSubmittedResult && hasClaimedForfeit && (
                <div className="mt-6 p-5 sm:p-6 rounded-2xl border border-red-500/50 bg-gradient-to-r from-red-950/40 via-slate-900/90 to-slate-950/90 ring-1 ring-red-500/30">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3 mb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="destructive" className="font-black text-xs uppercase gap-1 animate-pulse">
                        <ShieldAlert className="h-3.5 w-3.5" />
                        FORFEIT CLAIM — UNDER ADMIN ARBITRATION
                      </Badge>
                      <Badge variant="outline" className="text-[10px] text-slate-300 border-slate-700 font-bold">
                        Lodged by: @{claimantGamerTag} {isMyClaim ? "(You)" : "(Opponent)"}
                      </Badge>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">
                      Lodged: {sharedForfeit?.createdAt ? new Date(sharedForfeit.createdAt).toLocaleString() : "Recently"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-slate-400 block">Claim Reason</span>
                      <p className="text-xs text-slate-200 mt-1 italic">&quot;{sharedForfeit?.reason}&quot;</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                      {sharedForfeit?.proofScreenshotUrl && (
                        <a
                          href={sharedForfeit.proofScreenshotUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 py-2 px-3.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-rose-400 font-bold hover:bg-slate-800 transition"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View WhatsApp Proof
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/70 flex items-center gap-2.5 text-xs text-red-300/90">
                    <Lock className="h-4 w-4 text-red-400 shrink-0" />
                    <span>
                      <strong>Linked Fixture Lock:</strong> A forfeit walkover claim has been filed by @{claimantGamerTag}. The uploading window is closed for both athletes while the Commissioner Office arbitrates the claim.
                    </span>
                  </div>
                </div>
              )}

              {/* Match Action Buttons (Result Upload & Forfeit Proof) */}
              <div className="mt-6 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-xs text-slate-400 max-w-md">
                  Coordinate with your opponent on WhatsApp, complete the match on eFootball Mobile, and upload a screenshot of the post-game score screen before the 24-hour timer expires.
                </p>

                {hasSubmittedResult ? (
                  <div className="w-full sm:w-auto p-3.5 sm:p-4 rounded-2xl bg-amber-950/30 border border-amber-500/40 text-xs text-amber-200 flex items-center gap-3">
                    <Lock className="h-5 w-5 text-amber-400 shrink-0" />
                    <div>
                      <span className="font-black uppercase tracking-wider text-white block">
                        Uploading Closed for Both Athletes
                      </span>
                      <span className="text-[11px] text-slate-300">
                        {isMySubmission
                          ? "You uploaded the match score and proof. Uploading is closed for both you and your opponent."
                          : `@${submitterGamerTag} uploaded the match score and proof. Uploading is closed for both players while awaiting admin approval.`}
                      </span>
                    </div>
                  </div>
                ) : hasClaimedForfeit ? (
                  <div className="w-full sm:w-auto p-3.5 sm:p-4 rounded-2xl bg-red-950/30 border border-red-500/40 text-xs text-red-200 flex items-center gap-3">
                    <Lock className="h-5 w-5 text-red-400 shrink-0" />
                    <div>
                      <span className="font-black uppercase tracking-wider text-white block">
                        Uploading Closed for Both Athletes
                      </span>
                      <span className="text-[11px] text-slate-300">
                        {isMyClaim
                          ? "You filed a forfeit walkover claim. Submissions are closed for both athletes."
                          : `@${claimantGamerTag} filed a forfeit claim against you. Submissions are closed pending arbitration.`}
                      </span>
                    </div>
                  </div>
                ) : isMatchLocked ? (
                  <div className="w-full sm:w-auto p-3.5 rounded-2xl bg-red-950/40 border border-red-500/40 text-xs text-red-300 flex items-center gap-3">
                    <Lock className="h-5 w-5 text-red-400 shrink-0" />
                    <div>
                      <span className="font-black uppercase tracking-wider text-red-200 block">
                        Fixture Expired & Locked
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Previous match options are closed per 24-hr midnight rule unless reopened by the Admin Office.
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                    <Button
                      variant="yellow"
                      size="lg"
                      disabled={timeLeft.isExpired && !activeMatch?.allowLateSubmission}
                      onClick={() => setShowResultModal(true)}
                      className="font-bold text-xs sm:text-sm gap-2 w-full sm:w-auto"
                    >
                      <Upload className="h-4 w-4" />
                      Upload Match Result Screenshot
                    </Button>

                    <Button
                      variant="outline"
                      size="lg"
                      disabled={timeLeft.isExpired && !activeMatch?.allowLateSubmission}
                      onClick={() => setShowForfeitModal(true)}
                      className="font-bold text-xs sm:text-sm gap-2 border-red-500/40 text-red-400 hover:bg-red-950/20 w-full sm:w-auto"
                    >
                      <ShieldAlert className="h-4 w-4" />
                      Claim Opponent Forfeit (Proof)
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-12 text-center space-y-4">
              <Smartphone className="h-12 w-12 text-slate-600 mx-auto" />
              <h3 className="text-xl font-black uppercase text-white">
                No Active Match at this moment
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
                Your next 24-hour matchday fixture will drop automatically at 12:00 AM midnight. Please check back then or view the division standings.
              </p>
              <Link href="/standings">
                <Button variant="yellow" size="sm">
                  View Division Standings
                </Button>
              </Link>
            </div>
          )}

          {/* DIVISION MATCH OF THE DAY SECTION */}
          <div className="space-y-4 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-400" />
                <h3 className="text-lg font-black uppercase text-white tracking-wide">
                  Match of the Day (By Division)
                </h3>
              </div>

              {/* Division Selector Tabs for MOTD */}
              <div className="flex items-center gap-1.5 bg-[#080d1e] p-1 rounded-xl border border-slate-800">
                {(["Division 1", "Division 2", "Division 3"] as const).map((div) => {
                  const isSelected = selectedMotdDiv === div;
                  return (
                    <button
                      key={div}
                      type="button"
                      onClick={() => setSelectedMotdDiv(div)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold uppercase transition-all ${
                        isSelected
                          ? "bg-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-500/20"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {div === player.division ? `${div} (Yours)` : div}
                    </button>
                  );
                })}
              </div>
            </div>

            {divisionalMotd[selectedMotdDiv] ? (
              <MatchOfTheDayCard match={divisionalMotd[selectedMotdDiv]} />
            ) : (
              <div className="rounded-2xl border border-slate-800 bg-[#080d1e]/60 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-2.5 w-2.5 rounded-full bg-amber-400" />
                  <span className="font-bold text-slate-300">
                    {selectedMotdDiv} Match of the Day:
                  </span>
                  <span>Activates from Matchday 2 onwards based on table rankings.</span>
                </div>
                <Badge variant="secondary" className="font-mono text-[10px] w-fit">
                  Matchday {leagueConfig?.currentMatchday || 1}
                </Badge>
              </div>
            )}
          </div>


          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Matches Played</span>
              <span className="text-2xl font-black text-white">{standing?.played ?? 0}</span>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Wins</span>
              <span className="text-2xl font-black text-emerald-400">{standing?.won ?? 0}</span>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Points</span>
              <span className="text-2xl font-black text-yellow-400">{standing?.points ?? 0}</span>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Missed Matches</span>
              <span
                className={`text-2xl font-black ${
                  player.consecutiveMissed > 0 ? "text-red-400" : "text-slate-300"
                }`}
              >
                {player.consecutiveMissed} / 3 Max
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: INBOX & ANNOUNCEMENTS & DIRECT MESSAGING */}
      {activeTab === "INBOX" && (
        <div className="space-y-6">

          {/* Sub Navigation between Announcements & Direct Admin Messaging */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto no-scrollbar scroll-smooth">
            <button
              onClick={() => setInboxSubTab("ANNOUNCEMENTS")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 min-h-[40px] ${
                inboxSubTab === "ANNOUNCEMENTS"
                  ? "bg-yellow-500 text-slate-950 font-black shadow-lg shadow-yellow-500/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              <Bell className="h-4 w-4" />
              <span>Official Announcements</span>
              {unreadAnnouncementsCount > 0 && (
                <Badge variant="destructive" className="text-[10px] px-1.5 py-0 font-black">
                  {unreadAnnouncementsCount}
                </Badge>
              )}
            </button>

            <button
              onClick={() => setInboxSubTab("DIRECT_MESSAGES")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 min-h-[40px] ${
                inboxSubTab === "DIRECT_MESSAGES"
                  ? "bg-sky-500 text-white font-black shadow-lg shadow-sky-500/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              <Send className="h-4 w-4" />
              <span>Direct Messages to Admins</span>
              {playerMessages.length > 0 && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-mono">
                  {playerMessages.length}
                </Badge>
              )}
            </button>
          </div>

          {/* SUB-TAB 1: OFFICIAL ANNOUNCEMENTS */}
          {inboxSubTab === "ANNOUNCEMENTS" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/60 pb-3">
                <div>
                  <h4 className="text-sm font-black uppercase text-white">Broadcasts & Notices</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {unreadAnnouncementsCount > 0
                      ? `${unreadAnnouncementsCount} unread announcement${unreadAnnouncementsCount === 1 ? "" : "s"}`
                      : "All caught up! No unread announcements"}
                  </p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  {unreadAnnouncementsCount > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleMarkAllAsRead}
                      className="h-8 text-xs font-bold border-yellow-500/40 text-yellow-400 hover:bg-yellow-950/40"
                    >
                      <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                      Mark All as Read
                    </Button>
                  )}
                  <span className="text-xs font-mono text-slate-500">{announcements.length} Total</span>
                </div>
              </div>

              {announcements.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-8 text-center">No announcements yet.</p>
              ) : (
                <div className="space-y-4">
                  {announcements.map((ann) => {
                    const isRead = readAnnouncements.has(ann.id);
                    return (
                      <div
                        key={ann.id}
                        className={`rounded-2xl border p-5 space-y-3 backdrop-blur-xl transition-all ${
                          !isRead
                            ? "border-yellow-500/50 bg-gradient-to-r from-yellow-950/20 to-slate-900/90 shadow-lg shadow-yellow-500/5 ring-1 ring-yellow-500/20"
                            : ann.type === "INDIVIDUAL"
                            ? "border-sky-500/30 bg-sky-950/10"
                            : "border-slate-800 bg-slate-900/40 opacity-80 hover:opacity-100"
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            {!isRead && (
                              <Badge variant="yellow" className="text-[10px] font-bold animate-pulse">
                                ● NEW
                              </Badge>
                            )}
                            <Badge
                              variant={ann.type === "INDIVIDUAL" ? "default" : "secondary"}
                              className="text-[10px]"
                            >
                              {ann.type === "INDIVIDUAL" ? "COMMISSIONER DIRECT NOTICE" : "LEAGUE BROADCAST"}
                            </Badge>
                            {ann.isPinned && (
                              <Badge variant="live" className="text-[9px]">
                                PINNED
                              </Badge>
                            )}
                            {isRead && (
                              <span className="flex items-center gap-1 text-[10px] font-medium text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded-full border border-slate-700/50">
                                <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                                Read
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-mono text-slate-500">
                              {new Date(ann.createdAt).toLocaleDateString()}
                            </span>
                            {!isRead && (
                              <Button
                                size="sm"
                                onClick={() => handleMarkAsRead(ann.id)}
                                className="h-7 px-3 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-sm"
                              >
                                <CheckCircle className="h-3.5 w-3.5 mr-1" />
                                Mark as Read
                              </Button>
                            )}
                          </div>
                        </div>

                        <h4 className="text-base font-extrabold text-white">
                          {ann.title.replace(/\[REMINDER-1HR-[^\]]+\]/, "").trim()}
                        </h4>
                        <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                          {ann.content}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* SUB-TAB 2: DIRECT MESSAGES TO ADMINS */}
          {inboxSubTab === "DIRECT_MESSAGES" && (
            <div className="space-y-6">
              {/* Message Composer Card */}
              <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6 sm:p-7 space-y-4 backdrop-blur-xl shadow-xl">
                <div className="border-b border-slate-800 pb-3">
                  <h4 className="text-sm font-black uppercase text-white flex items-center gap-2">
                    <Send className="h-4 w-4 text-sky-400" />
                    <span>Write Direct Message to League Commissioners</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Have an inquiry regarding match scheduling, dispute, division status, or rules? Submit your message directly to the admin desk.
                  </p>
                </div>

                {msgSuccess && (
                  <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400" />
                    <span>{msgSuccess}</span>
                  </div>
                )}

                {msgError && (
                  <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
                    <span>{msgError}</span>
                  </div>
                )}

                <form onSubmit={handleSendMessage} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-slate-300">
                      Subject / Topic *
                    </label>
                    <Input
                      value={msgSubject}
                      onChange={(e) => setMsgSubject(e.target.value)}
                      placeholder="e.g. Inquiry regarding Matchday 3 fixture or division placement"
                      className="bg-slate-900 border-slate-800 text-xs font-semibold text-white focus:ring-1 focus:ring-sky-500"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-slate-300">
                      Message Details *
                    </label>
                    <textarea
                      rows={4}
                      value={msgContent}
                      onChange={(e) => setMsgContent(e.target.value)}
                      placeholder="Type your message, query, or report for the administrators..."
                      className="w-full rounded-xl bg-slate-900 border border-slate-800 p-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-sky-500 resize-none"
                      required
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={sendingMessage || !msgSubject.trim() || !msgContent.trim()}
                      className="font-bold text-xs bg-sky-500 hover:bg-sky-400 text-white shadow-lg shadow-sky-500/30"
                    >
                      {sendingMessage ? (
                        <span>Sending to Admins...</span>
                      ) : (
                        <span className="flex items-center gap-1.5">
                          <Send className="h-3.5 w-3.5" />
                          <span>Send Message to Admins</span>
                        </span>
                      )}
                    </Button>
                  </div>
                </form>
              </div>

              {/* Message History & Replies */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-300">
                    Your Inquiries & Commissioner Replies ({playerMessages.length})
                  </h4>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={fetchPlayerMessages}
                    disabled={loadingMessages}
                    className="h-7 text-[11px] text-slate-400 hover:text-white"
                  >
                    Refresh
                  </Button>
                </div>

                {loadingMessages && playerMessages.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center italic">Loading your inquiries...</p>
                ) : playerMessages.length === 0 ? (
                  <div className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-8 text-center space-y-2">
                    <MessageSquare className="h-8 w-8 text-slate-600 mx-auto" />
                    <p className="text-xs text-slate-400 font-semibold">No direct inquiries sent yet.</p>
                    <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                      Whenever you send a message above, you will see the administrator's reply here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {playerMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 space-y-4 backdrop-blur-xl shadow-md"
                      >
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/60 pb-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-black text-white">{msg.subject}</span>
                            <Badge
                              variant={msg.status === "REPLIED" ? "green" : "yellow"}
                              className="text-[10px] font-bold"
                            >
                              {msg.status === "REPLIED" ? "COMMISSIONER REPLIED" : "PENDING ADMIN REVIEW"}
                            </Badge>
                          </div>
                          <span className="text-[11px] font-mono text-slate-500">
                            Sent: {new Date(msg.createdAt).toLocaleString()}
                          </span>
                        </div>

                        {/* Player Content */}
                        <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap bg-slate-950/50 p-3.5 rounded-xl border border-slate-800/60">
                          <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                            Your Message:
                          </span>
                          {msg.content}
                        </div>

                        {/* Admin Reply Block */}
                        {msg.adminReply ? (
                          <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/20 p-4 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Badge variant="green" className="text-[9px] font-black uppercase tracking-wider">
                                  OFFICIAL COMMISSIONER RESPONSE
                                </Badge>
                              </div>
                              {msg.repliedAt && (
                                <span className="text-[10px] font-mono text-emerald-400/80">
                                  {new Date(msg.repliedAt).toLocaleString()}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-emerald-200 leading-relaxed whitespace-pre-wrap">
                              {msg.adminReply}
                            </p>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-xs text-amber-400/80 bg-amber-950/20 border border-amber-500/20 p-3 rounded-xl">
                            <Clock className="h-4 w-4 shrink-0 text-amber-400" />
                            <span>This message is in the league administrator queue. You will see their reply here once reviewed.</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: MATCH HISTORY & PROOF */}
      {activeTab === "HISTORY" && (
        <div className="space-y-4">
          <h3 className="text-lg font-black uppercase text-white border-b border-slate-800 pb-3">
            Completed Match History
          </h3>

          {recentMatches.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-8 text-center">
              No completed matches yet.
            </p>
          ) : (
            <div className="space-y-3">
              {recentMatches.map((m) => (
                <div
                  key={m.id}
                  className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col sm:flex-row items-center justify-between gap-4"
                >
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">
                      {m.round} • {m.division}
                    </span>
                    <h4 className="text-sm font-extrabold text-white mt-0.5">
                      {m.homePlayer.gamerTag} vs {m.awayPlayer.gamerTag}
                    </h4>
                    {m.notes && <p className="text-xs text-slate-400 italic mt-1">"{m.notes}"</p>}
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="px-4 py-1.5 rounded-xl bg-slate-950 font-mono text-lg font-black text-yellow-400 border border-slate-800">
                      {m.homeScore} : {m.awayScore}
                    </div>
                    <Badge
                      variant={m.status === "FORFEIT" ? "destructive" : "secondary"}
                      className="text-xs"
                    >
                      {m.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB: CALENDAR MODE (ALL SEASON MATCH FIXTURES) */}
      {/* ========================================================================= */}
      {activeTab === "CALENDAR" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl border border-slate-800 bg-slate-950/80 shadow-xl">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="yellow">SEASON CALENDAR</Badge>
                <Badge variant="secondary">{allPlayerMatches.length} Total Matches</Badge>
              </div>
              <h2 className="text-xl sm:text-2xl font-black uppercase text-white tracking-tight flex items-center gap-2">
                <Calendar className="h-6 w-6 text-cyan-400" />
                <span>My Season Match Calendar</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Complete timeline of all your league fixtures across all matchdays. Your active match is highlighted below with full score and screenshot submission controls.
              </p>
            </div>
          </div>

          {allPlayerMatches.length === 0 ? (
            <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-12 text-center space-y-3">
              <Calendar className="h-12 w-12 text-slate-600 mx-auto" />
              <h4 className="text-base font-bold text-white uppercase">No Matches Scheduled Yet</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                The League Commissioner has not yet generated the official round-robin schedule for your division. Please check back once registration closes.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {allPlayerMatches.map((m: any) => {
                const isCurrentActive = m.id === activeMatch?.id;
                const isHome = m.homePlayerId === player.id;
                const matchOpponent = isHome ? m.awayPlayer : m.homePlayer;
                const isFinished = m.status === "FINISHED";
                const isForfeit = m.status === "FORFEIT";
                const sub = m.submissions?.find((s: any) => s.status !== "REJECTED") || m.submissions?.[0];
                const forfeit = m.forfeitClaims?.find((f: any) => f.status !== "REJECTED") || m.forfeitClaims?.[0];
                const hasSubOrForfeit = Boolean(sub || forfeit);
                const isPending = sub?.status === "PENDING";
                const isForfeitPending = forfeit?.status === "PENDING";
                const isApprovedSub = sub?.status === "APPROVED" || isFinished;

                return (
                  <div
                    key={m.id}
                    className={`rounded-3xl border p-5 sm:p-6 transition-all backdrop-blur-xl shadow-xl space-y-4 ${
                      isCurrentActive
                        ? "border-cyan-500/60 bg-gradient-to-r from-cyan-950/30 via-slate-900/90 to-slate-950/90 ring-2 ring-cyan-500/30"
                        : isFinished || isForfeit
                        ? "border-slate-800 bg-slate-950/60"
                        : "border-slate-800/80 bg-slate-950/40"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={isCurrentActive ? "yellow" : "secondary"} className="text-xs font-mono font-bold">
                          {m.round}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {m.division}
                        </Badge>
                        {isCurrentActive && (
                          <Badge variant="live" className="text-[10px] animate-pulse">
                            ⚡ CURRENT MATCHDAY (ACTIVE NOW)
                          </Badge>
                        )}
                        {isFinished && (
                          <Badge variant="green" className="text-[10px] font-black">
                            APPROVED / COMPLETED
                          </Badge>
                        )}
                        {isForfeit && (
                          <Badge variant="destructive" className="text-[10px] font-black">
                            FORFEIT (WALKOVER)
                          </Badge>
                        )}
                        {isPending && (
                          <Badge variant="yellow" className="text-[10px] font-black animate-pulse">
                            RESULT PENDING ADMIN APPROVAL
                          </Badge>
                        )}
                        {isForfeitPending && !isPending && (
                          <Badge variant="destructive" className="text-[10px] font-black animate-pulse">
                            FORFEIT CLAIM UNDER ARBITRATION
                          </Badge>
                        )}
                        {!isFinished && !isForfeit && !isPending && !isForfeitPending && !isCurrentActive && (
                          <Badge variant="secondary" className="text-[10px] text-slate-400">
                            UPCOMING
                          </Badge>
                        )}
                      </div>

                      <span className="text-[11px] font-mono text-slate-400">
                        Scheduled: {new Date(m.matchDate).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Match Pairing Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                      <div className="md:col-span-8 flex flex-col sm:flex-row sm:items-center gap-4">
                        {/* You */}
                        <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 min-w-[140px]">
                          <span className="text-[10px] font-black uppercase tracking-wider text-sky-400 block">
                            {isHome ? "HOME (YOU)" : "AWAY (YOU)"}
                          </span>
                          <span className="font-bold text-sm text-white block">{player.gamerTag}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{player.efootballId}</span>
                        </div>

                        {/* VS Score Box */}
                        <div className="flex flex-col items-center justify-center px-4 py-2 rounded-2xl bg-slate-950 border border-slate-800 text-center min-w-[90px]">
                          {isFinished || isForfeit ? (
                            <span className="text-xl font-black font-mono text-cyan-400">
                              {m.homeScore} : {m.awayScore}
                            </span>
                          ) : sub ? (
                            <div>
                              <span className="text-base font-black font-mono text-amber-400">
                                {sub.homeScore} : {sub.awayScore}
                              </span>
                              <span className="text-[9px] text-amber-400 block uppercase font-mono">Pending</span>
                            </div>
                          ) : (
                            <span className="text-xs font-black text-slate-500">VS</span>
                          )}
                        </div>

                        {/* Opponent */}
                        <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 min-w-[140px]">
                          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 block">
                            {isHome ? "AWAY OPPONENT" : "HOME OPPONENT"}
                          </span>
                          <span className="font-bold text-sm text-white block">{matchOpponent?.gamerTag || "TBD"}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{matchOpponent?.efootballId || ""}</span>
                        </div>
                      </div>

                      {/* Actions & Status Details */}
                      <div className="md:col-span-4 flex flex-wrap items-center justify-end gap-2">
                        {isCurrentActive && !hasSubOrForfeit && !isFinished && !isForfeit && (
                          <Button
                            variant="yellow"
                            size="sm"
                            disabled={timeLeft.isExpired && !activeMatch?.allowLateSubmission}
                            onClick={() => setShowResultModal(true)}
                            className="font-bold text-xs gap-1.5 shadow-md shadow-yellow-500/20"
                          >
                            <Upload className="h-3.5 w-3.5" />
                            Upload Result Screenshot
                          </Button>
                        )}

                        {isCurrentActive && hasSubOrForfeit && !isFinished && !isForfeit && (
                          <span className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-slate-900 border border-amber-500/40 text-amber-300 text-xs font-bold">
                            <Lock className="h-3.5 w-3.5 text-amber-400" />
                            {sub ? "Result Uploaded (Closed)" : "Forfeit Lodged (Closed)"}
                          </span>
                        )}

                        {sub?.screenshotUrl && (
                          <a
                            href={sub.screenshotUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 py-1.5 px-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-sky-400 font-bold hover:bg-slate-800"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Proof
                          </a>
                        )}

                        {forfeit?.proofScreenshotUrl && (
                          <a
                            href={forfeit.proofScreenshotUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 py-1.5 px-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-rose-400 font-bold hover:bg-slate-800"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Forfeit Proof
                          </a>
                        )}

                        {matchOpponent?.whatsapp && isCurrentActive && (
                          <a
                            href={`https://wa.me/${matchOpponent.whatsapp.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm"
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                            WhatsApp
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Pending review notice */}
                    {isPending && (
                      <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 text-xs text-amber-300 flex items-center gap-2">
                        <Clock className="h-4 w-4 shrink-0 text-amber-400 animate-pulse" />
                        <span>
                          Screenshot submitted ({sub.homeScore} - {sub.awayScore}) by @{sub.submittedByPlayer?.gamerTag || "player"}. Awaiting official commissioner review. Uploading is closed for both athletes.
                        </span>
                      </div>
                    )}

                    {isForfeitPending && (
                      <div className="p-3 rounded-xl bg-red-950/30 border border-red-500/30 text-xs text-red-300 flex items-center gap-2">
                        <ShieldAlert className="h-4 w-4 shrink-0 text-red-400 animate-pulse" />
                        <span>
                          Forfeit claim lodged by @{forfeit.claimantPlayer?.gamerTag || "claimant"} ({forfeit.reason}). Awaiting administrator arbitration. Uploading is closed for both athletes.
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: PERSONAL INFORMATION & PROFILE SETTINGS */}
      {/* ========================================================================= */}
      {activeTab === "PROFILE" && (
        <div className="space-y-6">
          <div className="border-b border-slate-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-lg font-black uppercase text-white flex items-center gap-2">
                <User className="h-5 w-5 text-sky-400" />
                Personal Information & Account Settings
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Update your gamer tag, contact phone number, username, and login password.
              </p>
            </div>
            <Badge variant="secondary" className="font-mono text-xs text-slate-400 self-start sm:self-auto">
              ID: {currentPlayer.efootballId}
            </Badge>
          </div>

          {profileSuccessMsg && (
            <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
              <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>{profileSuccessMsg}</span>
            </div>
          )}

          {profileErrorMsg && (
            <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{profileErrorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Athlete Profile Summary Card */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-5 h-fit backdrop-blur-xl">
              <div className="text-center space-y-3 pb-4 border-b border-slate-800">
                <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-sky-400 to-indigo-600 text-white font-black text-3xl flex items-center justify-center mx-auto shadow-xl shadow-sky-500/20">
                  {currentPlayer.gamerTag.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-xl font-black text-white">{currentPlayer.gamerTag}</h4>
                  <p className="text-xs text-slate-400">{currentPlayer.fullName}</p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
                  <Badge variant="yellow" className="text-[10px]">
                    {currentPlayer.division}
                  </Badge>
                  <Badge variant={currentPlayer.status === "ACTIVE" ? "default" : "secondary"} className="text-[10px]">
                    {currentPlayer.status}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">eFootball ID:</span>
                  <span className="font-mono text-slate-200">{currentPlayer.efootballId}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">WhatsApp Phone:</span>
                  <span className="font-mono text-emerald-400 font-semibold">{currentPlayer.whatsapp}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Login Username:</span>
                  <span className="font-mono text-slate-200 truncate max-w-[150px]">{currentUser?.email}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Platform:</span>
                  <span className="font-mono text-slate-300">{currentPlayer.platform}</span>
                </div>
              </div>
            </div>

            {/* Profile Update Form */}
            <div className="lg:col-span-2 rounded-3xl border border-slate-800 bg-slate-950/80 p-6 sm:p-8 space-y-6 backdrop-blur-xl shadow-xl">
              <form onSubmit={handleUpdateProfile} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-slate-300">
                      Gamer Tag *
                    </label>
                    <Input
                      value={profileGamerTag}
                      onChange={(e) => setProfileGamerTag(e.target.value)}
                      placeholder="e.g. RW_Sniper"
                      className="bg-slate-900 border-slate-800 text-xs font-bold text-white focus:ring-1 focus:ring-sky-500"
                      required
                    />
                    <span className="text-[10px] text-slate-500 block">
                      Displayed on fixtures, standings tables, and Match of the Day showdowns.
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-slate-300">
                      Full Real Name *
                    </label>
                    <Input
                      value={profileFullName}
                      onChange={(e) => setProfileFullName(e.target.value)}
                      placeholder="e.g. Jean Paul"
                      className="bg-slate-900 border-slate-800 text-xs text-white focus:ring-1 focus:ring-sky-500"
                      required
                    />
                    <span className="text-[10px] text-slate-500 block">
                      Your legal name for prize payouts and commissioner verification.
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-slate-300">
                      Phone Number / WhatsApp *
                    </label>
                    <Input
                      value={profileWhatsapp}
                      onChange={(e) => setProfileWhatsapp(e.target.value)}
                      placeholder="e.g. +250 788 123 456"
                      className="bg-slate-900 border-slate-800 text-xs font-mono text-emerald-400 focus:ring-1 focus:ring-sky-500"
                      required
                    />
                    <span className="text-[10px] text-slate-500 block">
                      Mandatory. Opponents use this to contact you for 24-hr match scheduling.
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-slate-300">
                      Username / Login Email *
                    </label>
                    <Input
                      type="email"
                      value={profileEmail}
                      onChange={(e) => setProfileEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="bg-slate-900 border-slate-800 text-xs text-white focus:ring-1 focus:ring-sky-500"
                      required
                    />
                    <span className="text-[10px] text-slate-500 block">
                      Used to log into your player account portal.
                    </span>
                  </div>
                </div>

                {/* Password Change Section */}
                <div className="pt-4 border-t border-slate-800/80 space-y-4">
                  <div>
                    <h5 className="text-xs font-black uppercase text-yellow-400 tracking-wider">
                      Security & Password Change
                    </h5>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Leave password fields blank if you do not wish to change your current login password.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase text-slate-300">
                        New Password
                      </label>
                      <div className="relative">
                        <Input
                          type={showProfilePassword ? "text" : "password"}
                          value={profilePassword}
                          onChange={(e) => setProfilePassword(e.target.value)}
                          placeholder="Minimum 6 characters"
                          className="bg-slate-900 border-slate-800 text-xs text-white focus:ring-1 focus:ring-yellow-500 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowProfilePassword(!showProfilePassword)}
                          className="absolute right-3 top-2.5 text-slate-400 hover:text-white transition-colors focus:outline-none"
                          aria-label={showProfilePassword ? "Hide password" : "Show password"}
                          title={showProfilePassword ? "Hide password" : "Show password"}
                        >
                          {showProfilePassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase text-slate-300">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <Input
                          type={showProfilePassword ? "text" : "password"}
                          value={profileConfirmPassword}
                          onChange={(e) => setProfileConfirmPassword(e.target.value)}
                          placeholder="Repeat new password"
                          className="bg-slate-900 border-slate-800 text-xs text-white focus:ring-1 focus:ring-yellow-500 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowProfilePassword(!showProfilePassword)}
                          className="absolute right-3 top-2.5 text-slate-400 hover:text-white transition-colors focus:outline-none"
                          aria-label={showProfilePassword ? "Hide password" : "Show password"}
                          title={showProfilePassword ? "Hide password" : "Show password"}
                        >
                          {showProfilePassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    type="submit"
                    disabled={profileUpdating}
                    className="bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs px-6 py-2.5 shadow-lg shadow-sky-600/20"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {profileUpdating ? "Saving Changes..." : "Save Personal Information"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: RATE & FEEDBACK */}
      {activeTab === "FEEDBACK" && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-800 bg-[#080d1e]/80 p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-6">
            <div className="border-b border-slate-800/80 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                  <Star className="h-6 w-6 fill-amber-400" />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase text-white tracking-wide">
                    Rate & League Feedback
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Your voice shapes the future of eFootball Rwanda League. Share your experience and rating with the administration.
                  </p>
                </div>
              </div>
            </div>

            {reviewSuccessMsg && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-3 animate-in fade-in">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                <span className="font-semibold">{reviewSuccessMsg}</span>
              </div>
            )}

            {reviewErrorMsg && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0" />
                <span className="font-semibold">{reviewErrorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmitReview} className="space-y-6">
              {/* Star Selection */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-slate-300 block">
                  Overall Rating
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setUserRating(star)}
                      className={`p-2 rounded-xl border transition-all ${
                        userRating >= star
                          ? "border-amber-400/60 bg-amber-400/10 text-amber-400 shadow-md shadow-amber-500/20"
                          : "border-slate-800 bg-slate-900/60 text-slate-600 hover:text-slate-400"
                      }`}
                    >
                      <Star
                        className={`h-7 w-7 ${
                          userRating >= star ? "fill-amber-400" : "fill-none"
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-3 text-sm font-black text-amber-400">
                    {userRating === 5 && "5 / 5 - Outstanding ⭐⭐⭐⭐⭐"}
                    {userRating === 4 && "4 / 5 - Very Good ⭐⭐⭐⭐"}
                    {userRating === 3 && "3 / 5 - Satisfactory ⭐⭐⭐"}
                    {userRating === 2 && "2 / 5 - Needs Improvement ⭐⭐"}
                    {userRating === 1 && "1 / 5 - Poor ⭐"}
                  </span>
                </div>
              </div>

              {/* Category Selection */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-slate-300 block">
                  Feedback Category
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { id: "GENERAL", label: "General League" },
                    { id: "TOURNAMENT", label: "Tournament & Rules" },
                    { id: "MATCHMAKING", label: "Schedule & Deadlines" },
                    { id: "PLATFORM", label: "Website & Tech" },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setReviewCategory(cat.id)}
                      className={`px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-all text-center ${
                        reviewCategory === cat.id
                          ? "border-amber-500 bg-amber-500/20 text-white shadow-md shadow-amber-500/10"
                          : "border-slate-800 bg-slate-900/50 text-slate-400 hover:text-white hover:border-slate-700"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Comment Textarea */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-slate-300 block">
                  Detailed Feedback or Suggestions
                </label>
                <textarea
                  rows={4}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share what you enjoy, issues you experienced, or suggestions to make the eFootball Rwanda League even better..."
                  className="w-full rounded-2xl border border-slate-800 bg-slate-900/90 p-4 text-xs text-white placeholder:text-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  disabled={submittingReview}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-6 py-2.5 shadow-lg shadow-amber-500/20"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {submittingReview ? "Submitting..." : activeReview ? "Update Review" : "Submit Rating & Review"}
                </Button>
              </div>
            </form>

            {/* Current Active Review Display */}
            {activeReview && (
              <div className="mt-8 pt-6 border-t border-slate-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                    Your Registered League Feedback
                  </h4>
                  <span className="text-[11px] text-slate-500">
                    Last updated: {new Date(activeReview.updatedAt || activeReview.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center text-amber-400">
                      {[...Array(activeReview.rating || 5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-amber-400" />
                      ))}
                    </div>
                    <Badge variant="outline" className="text-[10px] text-slate-300 border-slate-700">
                      {activeReview.category || "GENERAL"}
                    </Badge>
                  </div>
                  {activeReview.comment && (
                    <p className="text-xs text-slate-200 leading-relaxed italic">
                      "{activeReview.comment}"
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: UPLOAD MATCH RESULT SCREENSHOT */}
      {showResultModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-800 bg-slate-950 p-5 sm:p-8 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-black uppercase text-white flex items-center gap-2">
                <Upload className="h-5 w-5 text-yellow-400" />
                Upload Match Result
              </h3>
              <button
                onClick={() => setShowResultModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {resultSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold">
                {resultSuccessMsg}
              </div>
            )}

            {hasSubmittedResult ? (
              <div className="p-6 rounded-2xl bg-amber-950/30 border border-amber-500/40 text-center space-y-4">
                <Lock className="h-10 w-10 text-amber-400 mx-auto" />
                <div>
                  <h4 className="text-sm font-black text-white uppercase tracking-wider">Uploading Closed for Both Athletes</h4>
                  <p className="text-xs text-slate-300 mt-1">
                    Match score and proof screenshot have already been uploaded by <strong>@{submitterGamerTag}</strong>.
                    The uploading window is closed for both athletes while awaiting Commissioner approval.
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setShowResultModal(false)} className="text-xs">
                  Close Window
                </Button>
              </div>
            ) : hasClaimedForfeit ? (
              <div className="p-6 rounded-2xl bg-red-950/30 border border-red-500/40 text-center space-y-4">
                <Lock className="h-10 w-10 text-red-400 mx-auto" />
                <div>
                  <h4 className="text-sm font-black text-white uppercase tracking-wider">Uploading Closed for Both Athletes</h4>
                  <p className="text-xs text-slate-300 mt-1">
                    A forfeit walkover claim has already been filed by <strong>@{claimantGamerTag}</strong>.
                    Result uploads are closed for both athletes while under league arbitration.
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setShowResultModal(false)} className="text-xs">
                  Close Window
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmitResult} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                      {activeMatch?.homePlayer?.gamerTag} Score
                    </label>
                    <Input
                      type="number"
                      min="0"
                      required
                      value={homeScore}
                      onChange={(e) => setHomeScore(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                      {activeMatch?.awayPlayer?.gamerTag} Score
                    </label>
                    <Input
                      type="number"
                      min="0"
                      required
                      value={awayScore}
                      onChange={(e) => setAwayScore(e.target.value)}
                    />
                  </div>
                </div>

                {/* Upload Screenshot File */}
                <div>
                  <label className="block text-xs font-bold text-yellow-400 uppercase mb-1">
                    Upload eFootball Mobile Result Screenshot *
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    required={!resultScreenshot}
                    onChange={(e) => handleFileChange(e, setResultScreenshot)}
                    className="block w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-yellow-500 file:text-slate-950 hover:file:bg-yellow-400 cursor-pointer"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Attach in-game full-time screen showing final score and gamer tags.
                  </span>
                </div>

                {/* Screenshot Preview */}
                {resultScreenshot && (
                  <div className="rounded-xl overflow-hidden border border-slate-800 max-h-48">
                    <img
                      src={resultScreenshot}
                      alt="Result Screenshot Preview"
                      className="w-full h-auto object-cover"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Match Comments (Optional)
                  </label>
                  <Input
                    placeholder="e.g. Great game, win in extra time"
                    value={resultNotes}
                    onChange={(e) => setResultNotes(e.target.value)}
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowResultModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="yellow"
                    disabled={submittingResult}
                    className="font-bold"
                  >
                    {submittingResult ? "Submitting..." : "Send Screenshot to Admin"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: CLAIM OPPONENT NO-SHOW / FORFEIT */}
      {showForfeitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl border border-red-500/40 bg-slate-950 p-5 sm:p-8 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-black uppercase text-red-400 flex items-center gap-2">
                <ShieldAlert className="h-5 w-5" />
                Claim Opponent No-Show / Forfeit
              </h3>
              <button
                onClick={() => setShowForfeitModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {forfeitSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold">
                {forfeitSuccessMsg}
              </div>
            )}

            {hasSubmittedResult ? (
              <div className="p-6 rounded-2xl bg-amber-950/30 border border-amber-500/40 text-center space-y-4">
                <Lock className="h-10 w-10 text-amber-400 mx-auto" />
                <div>
                  <h4 className="text-sm font-black text-white uppercase tracking-wider">Uploading Closed for Both Athletes</h4>
                  <p className="text-xs text-slate-300 mt-1">
                    Match score and proof screenshot have already been uploaded by <strong>@{submitterGamerTag}</strong>.
                    Forfeit claims cannot be submitted while the match result is awaiting admin verification.
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setShowForfeitModal(false)} className="text-xs">
                  Close Window
                </Button>
              </div>
            ) : hasClaimedForfeit ? (
              <div className="p-6 rounded-2xl bg-red-950/30 border border-red-500/40 text-center space-y-4">
                <Lock className="h-10 w-10 text-red-400 mx-auto" />
                <div>
                  <h4 className="text-sm font-black text-white uppercase tracking-wider">Uploading Closed for Both Athletes</h4>
                  <p className="text-xs text-slate-300 mt-1">
                    A forfeit walkover claim has already been filed by <strong>@{claimantGamerTag}</strong>.
                    The uploading window is closed for both athletes while under league arbitration.
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setShowForfeitModal(false)} className="text-xs">
                  Close Window
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmitForfeit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Upload Proof Screenshot *
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    required={!forfeitScreenshot}
                    onChange={(e) => handleFileChange(e, setForfeitScreenshot)}
                    className="block w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-red-500 file:text-white hover:file:bg-red-400 cursor-pointer"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Attach WhatsApp chat screenshot or eFootball mobile room invite showing opponent did not respond.
                  </span>
                </div>

                {forfeitScreenshot && (
                  <div className="rounded-xl overflow-hidden border border-slate-800 max-h-48">
                    <img
                      src={forfeitScreenshot}
                      alt="Proof Screenshot Preview"
                      className="w-full h-auto object-cover"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Explanation / Reason *
                  </label>
                  <Input
                    required
                    placeholder="e.g. Opponent didn't answer WhatsApp for 6 hours before cutoff."
                    value={forfeitReason}
                    onChange={(e) => setForfeitReason(e.target.value)}
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowForfeitModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="destructive"
                    disabled={submittingForfeit}
                    className="font-bold"
                  >
                    {submittingForfeit ? "Submitting Claim..." : "Submit Forfeit Proof"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
