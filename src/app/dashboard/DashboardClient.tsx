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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function DashboardClient({
  player,
  user,
  activeMatch,
  announcements,
  recentMatches,
  standing,
}: {
  player: any;
  user: any;
  activeMatch: any;
  announcements: any[];
  recentMatches: any[];
  standing: any;
}) {
  const router = useRouter();

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

  // Active tab
  const [activeTab, setActiveTab] = useState<"OVERVIEW" | "INBOX" | "HISTORY">("OVERVIEW");

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
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const cleanWhatsapp = opponent?.whatsapp?.replace(/[^0-9]/g, "") || "";

  return (
    <div className="space-y-8">
      {/* Top Welcome Bar */}
      <div className="rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 p-6 sm:p-8 backdrop-blur-xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-600 text-slate-950 font-black text-2xl shadow-xl shadow-yellow-500/20">
            {player.gamerTag.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {player.gamerTag}
              </h1>
              <Badge variant="yellow" className="text-xs">
                {player.division}
              </Badge>
              <Badge variant="default" className="text-[10px] uppercase font-mono">
                {player.platform}
              </Badge>
            </div>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
              <span>{player.fullName}</span>
              <span>•</span>
              <span className="font-mono text-slate-500">Konami ID: {player.efootballId}</span>
              <span>•</span>
              <span className="text-emerald-400 font-mono">WA: {player.whatsapp}</span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">Division Rank</span>
            <span className="text-xl font-black text-yellow-400">
              {standing ? `#${standing.rank}` : "Unranked"}
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2 text-xs">
            <LogOut className="h-4 w-4 text-slate-400" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab("OVERVIEW")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === "OVERVIEW"
              ? "bg-sky-500 text-white shadow-lg shadow-sky-500/30"
              : "text-slate-400 hover:text-white hover:bg-slate-900"
          }`}
        >
          <Smartphone className="h-4 w-4" />
          <span>Today's 24-Hr Match</span>
        </button>

        <button
          onClick={() => setActiveTab("INBOX")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === "INBOX"
              ? "bg-sky-500 text-white shadow-lg shadow-sky-500/30"
              : "text-slate-400 hover:text-white hover:bg-slate-900"
          }`}
        >
          <Bell className="h-4 w-4" />
          <span>Announcements & Inbox</span>
          {announcements.length > 0 && (
            <span className="h-4 w-4 rounded-full bg-yellow-400 text-slate-950 text-[10px] font-black flex items-center justify-center">
              {announcements.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("HISTORY")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === "HISTORY"
              ? "bg-sky-500 text-white shadow-lg shadow-sky-500/30"
              : "text-slate-400 hover:text-white hover:bg-slate-900"
          }`}
        >
          <Trophy className="h-4 w-4" />
          <span>Match History & Proof</span>
        </button>
      </div>

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

              {/* Match Action Buttons (Result Upload & Forfeit Proof) */}
              <div className="mt-6 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-xs text-slate-400 max-w-md">
                  Coordinate with your opponent on WhatsApp, complete the match on eFootball Mobile, and upload a screenshot of the post-game score screen before the 24-hour timer expires.
                </p>

                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                  <Button
                    variant="yellow"
                    size="lg"
                    disabled={timeLeft.isExpired}
                    onClick={() => setShowResultModal(true)}
                    className="font-bold text-xs sm:text-sm gap-2 w-full sm:w-auto"
                  >
                    <Upload className="h-4 w-4" />
                    {timeLeft.isExpired ? "Window Closed" : "Upload Match Result Screenshot"}
                  </Button>

                  <Button
                    variant="outline"
                    size="lg"
                    disabled={timeLeft.isExpired}
                    onClick={() => setShowForfeitModal(true)}
                    className="font-bold text-xs sm:text-sm gap-2 border-red-500/40 text-red-400 hover:bg-red-950/20 w-full sm:w-auto"
                  >
                    <ShieldAlert className="h-4 w-4" />
                    Claim Opponent Forfeit (Proof)
                  </Button>
                </div>
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

      {/* TAB 2: INBOX & ANNOUNCEMENTS */}
      {activeTab === "INBOX" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-lg font-black uppercase text-white flex items-center gap-2">
              <Bell className="h-5 w-5 text-yellow-400" />
              League Announcements & Direct Messages
            </h3>
            <span className="text-xs text-slate-500">{announcements.length} Messages</span>
          </div>

          {announcements.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-8 text-center">No announcements yet.</p>
          ) : (
            <div className="space-y-4">
              {announcements.map((ann) => (
                <div
                  key={ann.id}
                  className={`rounded-2xl border p-5 space-y-2 backdrop-blur-xl ${
                    ann.type === "INDIVIDUAL"
                      ? "border-sky-500/50 bg-sky-950/20"
                      : "border-slate-800 bg-slate-900/60"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={ann.type === "INDIVIDUAL" ? "default" : "yellow"}
                        className="text-[10px]"
                      >
                        {ann.type === "INDIVIDUAL" ? "PRIVATE DIRECT MESSAGE" : "LEAGUE BROADCAST"}
                      </Badge>
                      {ann.isPinned && (
                        <Badge variant="live" className="text-[9px]">
                          PINNED
                        </Badge>
                      )}
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">
                      {new Date(ann.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h4 className="text-base font-extrabold text-white">{ann.title}</h4>
                  <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {ann.content}
                  </p>
                </div>
              ))}
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

      {/* MODAL 1: UPLOAD MATCH RESULT SCREENSHOT */}
      {showResultModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-950 p-6 sm:p-8 shadow-2xl space-y-5">
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

            <form onSubmit={handleSubmitResult} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    {activeMatch.homePlayer.gamerTag} Score
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
                    {activeMatch.awayPlayer.gamerTag} Score
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
          </div>
        </div>
      )}

      {/* MODAL 2: CLAIM OPPONENT NO-SHOW / FORFEIT */}
      {showForfeitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg rounded-3xl border border-red-500/40 bg-slate-950 p-6 sm:p-8 shadow-2xl space-y-5">
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
          </div>
        </div>
      )}
    </div>
  );
}
