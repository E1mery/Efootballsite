"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  Trophy,
  Calendar,
  Clock,
  RefreshCw,
  Send,
  Eye,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
  Crown,
  Share2,
  Heart,
  MessageCircle,
  Smartphone,
  Monitor,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { resolvePlayerAvatar, findTeam } from "@/lib/teams";

interface FinalCompetitionData {
  competition: "SUPER_CUP" | "UCL" | "EUROPA";
  meta: {
    competition: string;
    title: string;
    badgeLabel: string;
    trophyImage: string;
    stadiumBg: string;
    announcementType: string;
    resultType: string;
  };
  match: {
    id: string;
    round: string;
    stage: string;
    division: string;
    status: string;
    matchDate: string | Date;
    deadlineDate: string | Date;
    formattedDate: string;
    formattedTime: string;
    formattedDateTime: string;
    homeScore: number | null;
    awayScore: number | null;
    aggregateHomeScore?: number | null;
    aggregateAwayScore?: number | null;
    homePlayer: {
      id: string;
      gamerTag: string;
      fullName?: string | null;
      realTeam?: string | null;
      avatar?: string | null;
    } | null;
    awayPlayer: {
      id: string;
      gamerTag: string;
      fullName?: string | null;
      realTeam?: string | null;
      avatar?: string | null;
    } | null;
    winnerPlayer?: {
      id: string;
      gamerTag: string;
      realTeam?: string | null;
    } | null;
  } | null;
  announcement: {
    id: string;
    type: string;
    status: string;
    headline: string;
    caption: string;
    hashtags: string[];
    publishedAt: string | Date;
  } | null;
  result: {
    id: string;
    type: string;
    status: string;
    headline: string;
    caption: string;
    hashtags: string[];
    publishedAt: string | Date;
  } | null;
}

interface AdminFinalsSocialManagerProps {
  onRefresh?: () => void;
}

function toLocalDatetimeInput(dateInput?: string | Date | null): string {
  if (!dateInput) return "";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AdminFinalsSocialManager({ onRefresh }: AdminFinalsSocialManagerProps) {
  const [finals, setFinals] = useState<FinalCompetitionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingAll, setSyncingAll] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Kickoff date inputs state per competition
  const [dateInputs, setDateInputs] = useState<Record<string, string>>({});

  // Preview Modal state
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState<{
    competitionData: FinalCompetitionData;
    postType: "ANNOUNCEMENT" | "RESULT";
  } | null>(null);
  const [previewDevice, setPreviewDevice] = useState<"MOBILE" | "DESKTOP">("MOBILE");

  const fetchFinalsData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/finals-social");
      const data = await res.json();
      if (res.ok && data.finals) {
        setFinals(data.finals);
        const inputs: Record<string, string> = {};
        for (const item of data.finals as FinalCompetitionData[]) {
          if (item.match?.matchDate) {
            inputs[item.competition] = toLocalDatetimeInput(item.match.matchDate);
          }
        }
        setDateInputs(inputs);
      }
    } catch (err) {
      console.error("[AdminFinalsSocialManager] Failed to load finals social data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFinalsData();
  }, [fetchFinalsData]);

  const handleSyncAll = async () => {
    setSyncingAll(true);
    try {
      const res = await fetch("/api/admin/finals-social", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "SYNC_ALL" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to sync all finals posts.");
      alert(data.message || "All finals social posts synced successfully!");
      if (data.finals) setFinals(data.finals);
      onRefresh?.();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSyncingAll(false);
    }
  };

  const handlePublishPost = async (matchId: string, actionType: "PUBLISH_ANNOUNCEMENT" | "PUBLISH_RESULT") => {
    setActionLoading(`${actionType}_${matchId}`);
    try {
      const res = await fetch("/api/admin/finals-social", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: actionType, matchId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed.");
      alert(data.message);
      await fetchFinalsData();
      onRefresh?.();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateSchedule = async (competitionKey: string, matchId: string) => {
    const scheduledDate = dateInputs[competitionKey];
    if (!scheduledDate) {
      alert("Please choose a valid kickoff date and time.");
      return;
    }

    setActionLoading(`UPDATE_${matchId}`);
    try {
      const res = await fetch("/api/admin/finals-social", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_SCHEDULE",
          matchId,
          scheduledDate,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update schedule.");
      alert(data.message || "Schedule updated and announcement post synchronized!");
      await fetchFinalsData();
      onRefresh?.();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRetryPublication = async (matchId: string) => {
    setActionLoading(`RETRY_${matchId}`);
    try {
      const res = await fetch("/api/admin/finals-social", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "RETRY", matchId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Retry failed.");
      alert(data.message || "Publication retried successfully.");
      await fetchFinalsData();
      onRefresh?.();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const openPreview = (competitionData: FinalCompetitionData, postType: "ANNOUNCEMENT" | "RESULT") => {
    setPreviewItem({ competitionData, postType });
    setPreviewModalOpen(true);
  };

  return (
    <section className="space-y-6">
      {/* 1. Header with sync status and master trigger */}
      <div className="rounded-3xl border border-border bg-card/70 p-6 sm:p-8 backdrop-blur-xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary/20 text-primary border border-primary/30 shrink-0">
              <Trophy className="h-5 w-5" />
            </div>
            <h3 className="text-lg sm:text-xl font-black uppercase text-foreground tracking-tight">
              Automatic Finals Social Feed & Broadcast Publisher
            </h3>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
            Automatically generates and publishes official Instagram-style 1:1 square broadcast posts for the
            <strong> Super Cup Final</strong>, <strong>UEFA Champions League Final</strong>, and <strong>UEFA Europa League Final</strong>.
            Dates and kickoff times sync directly from the admin schedule with zero duplicates.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={fetchFinalsData}
            disabled={loading}
            className="text-xs font-bold rounded-xl border-border hover:bg-card"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>

          <Button
            type="button"
            onClick={handleSyncAll}
            disabled={syncingAll}
            className="text-xs font-black rounded-xl bg-primary hover:bg-primary text-primary-foreground shadow-md"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${syncingAll ? "animate-spin" : ""}`} />
            <span>{syncingAll ? "Syncing Feed..." : "Sync All Finals Posts"}</span>
          </Button>
        </div>
      </div>

      {/* 2. Grid of 3 Final Competitions */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-3xl border border-border bg-card/40 p-6 space-y-4 animate-pulse">
              <div className="h-6 w-36 bg-border/60 rounded" />
              <div className="h-28 bg-border/30 rounded-2xl" />
              <div className="h-10 bg-border/40 rounded-xl" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {finals.map((item) => {
            const match = item.match;
            const hasMatch = Boolean(match);
            const isFinished = match?.status === "FINISHED";
            const homeScore = match?.homeScore ?? 0;
            const awayScore = match?.awayScore ?? 0;
            const homeIsWinner = homeScore > awayScore;
            const awayIsWinner = awayScore > homeScore;
            const winner = homeIsWinner ? match?.homePlayer : awayIsWinner ? match?.awayPlayer : null;

            return (
              <div
                key={item.competition}
                className="relative overflow-hidden rounded-3xl border border-border bg-card/80 p-5 sm:p-6 shadow-xl flex flex-col justify-between space-y-5 backdrop-blur-xl"
              >
                {/* Competition Background Glow Accent */}
                <div className="absolute top-0 right-0 w-36 h-36 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

                {/* Card Top: Competition Logo, Trophy & Status */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-xl bg-card border border-border p-1 flex items-center justify-center shrink-0 shadow-sm">
                        <img
                          src={item.meta.trophyImage}
                          alt={item.meta.title}
                          className="h-full w-full object-contain"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = "/logo.png";
                          }}
                        />
                      </div>
                      <div>
                        <h4 className="font-black text-sm uppercase text-foreground tracking-tight">
                          {item.meta.title}
                        </h4>
                        <p className="text-xs font-mono text-muted-foreground">
                          {item.meta.badgeLabel}
                        </p>
                      </div>
                    </div>

                    <Badge
                      variant={
                        isFinished
                          ? "destructive"
                          : hasMatch
                          ? "default"
                          : "secondary"
                      }
                      className="text-xs font-black uppercase px-2 py-0.5"
                    >
                      {isFinished ? "FINISHED" : hasMatch ? "SCHEDULED" : "AWAITING FINALISTS"}
                    </Badge>
                  </div>

                  {/* Finalists Box */}
                  {hasMatch && match ? (
                    <div className="p-3.5 rounded-2xl bg-background/60 border border-border/80 space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        {/* Home Finalist */}
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="h-8 w-8 rounded-lg bg-card border border-border p-1 flex items-center justify-center shrink-0">
                            <img
                              src={match.homePlayer?.avatar || resolvePlayerAvatar(match.homePlayer || undefined)}
                              alt={match.homePlayer?.gamerTag || "Home"}
                              className="h-full w-full object-contain"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = "/favicon.ico";
                              }}
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="font-black text-foreground text-xs truncate">
                              @{match.homePlayer?.gamerTag}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {match.homePlayer?.realTeam || "eFootball"}
                            </p>
                          </div>
                        </div>

                        {/* Center Score or VS */}
                        <div className="px-2 shrink-0 font-mono text-center">
                          {isFinished ? (
                            <span className="text-sm font-black text-foreground bg-card/80 px-2 py-0.5 rounded-lg border border-border">
                              {homeScore} - {awayScore}
                            </span>
                          ) : (
                            <span className="text-xs font-black text-muted-foreground">VS</span>
                          )}
                        </div>

                        {/* Away Finalist */}
                        <div className="flex items-center gap-2 flex-1 min-w-0 justify-end text-right">
                          <div className="min-w-0">
                            <p className="font-black text-foreground text-xs truncate">
                              @{match.awayPlayer?.gamerTag}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {match.awayPlayer?.realTeam || "eFootball"}
                            </p>
                          </div>
                          <div className="h-8 w-8 rounded-lg bg-card border border-border p-1 flex items-center justify-center shrink-0">
                            <img
                              src={match.awayPlayer?.avatar || resolvePlayerAvatar(match.awayPlayer || undefined)}
                              alt={match.awayPlayer?.gamerTag || "Away"}
                              className="h-full w-full object-contain"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = "/favicon.ico";
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Winner highlight if finished */}
                      {isFinished && winner && (
                        <div className="pt-2 border-t border-border/40 flex items-center justify-center gap-1.5 text-xs">
                          <Crown className="h-3.5 w-3.5 text-secondary shrink-0" />
                          <span className="font-black text-white">
                            Confirmed Champion: @{winner.gamerTag} ({winner.realTeam || "eFootball"})
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-6 rounded-2xl border border-dashed border-border text-center space-y-1 bg-background/30">
                      <p className="text-xs font-bold text-muted-foreground">
                        No official final fixture scheduled yet.
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Generate the final bracket or Super Cup showdown to activate automatic social feeds.
                      </p>
                    </div>
                  )}

                  {/* Scheduled Kickoff Editor (Single Source of Truth) */}
                  {hasMatch && match && (
                    <div className="p-3.5 rounded-2xl bg-background/60 border border-border space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-primary" />
                          <span>Kickoff Time (CAT)</span>
                        </span>
                        <span className="font-mono text-xs font-bold text-foreground">
                          {match.formattedDateTime} CAT
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Input
                          type="datetime-local"
                          value={dateInputs[item.competition] || ""}
                          onChange={(e) =>
                            setDateInputs((prev) => ({
                              ...prev,
                              [item.competition]: e.target.value,
                            }))
                          }
                          className="h-8 text-xs bg-card border-border font-mono flex-1"
                        />
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleUpdateSchedule(item.competition, match.id)}
                          disabled={actionLoading === `UPDATE_${match.id}`}
                          className="h-8 text-xs font-bold px-3 shrink-0 bg-primary hover:bg-primary text-primary-foreground"
                        >
                          {actionLoading === `UPDATE_${match.id}` ? "Updating..." : "Update"}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Publication Status Indicators */}
                  <div className="space-y-2 pt-1">
                    {/* Announcement Status */}
                    <div className="p-3 rounded-2xl bg-background/40 border border-border/80 flex items-center justify-between gap-2 text-xs">
                      <div>
                        <span className="font-bold text-foreground block">
                          Match Announcement Post
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {item.announcement?.status === "PUBLISHED"
                            ? `Published on Social Feed • ${new Date(item.announcement.publishedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                            : "Not published yet"}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {item.announcement ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => openPreview(item, "ANNOUNCEMENT")}
                            className="h-7 px-2 text-xs font-bold text-primary hover:text-white"
                            title="Preview Instagram Graphic"
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            <span>Preview</span>
                          </Button>
                        ) : null}

                        {hasMatch && match && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => handlePublishPost(match.id, "PUBLISH_ANNOUNCEMENT")}
                            disabled={actionLoading === `PUBLISH_ANNOUNCEMENT_${match.id}`}
                            className="h-7 px-2.5 text-xs font-bold border-border hover:bg-card"
                          >
                            <Send className="h-3 w-3 mr-1" />
                            <span>{item.announcement ? "Resync" : "Publish"}</span>
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Results Status */}
                    <div className="p-3 rounded-2xl bg-background/40 border border-border/80 flex items-center justify-between gap-2 text-xs">
                      <div>
                        <span className="font-bold text-foreground block">
                          Full Time Results Post
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {item.result?.status === "PUBLISHED"
                            ? `Published • Verified Result: ${match?.homeScore}-${match?.awayScore}`
                            : isFinished
                            ? "Result confirmed • Ready to publish"
                            : "Awaiting match completion"}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {item.result ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => openPreview(item, "RESULT")}
                            className="h-7 px-2 text-xs font-bold text-primary hover:text-white"
                            title="Preview Instagram Graphic"
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            <span>Preview</span>
                          </Button>
                        ) : null}

                        {isFinished && match && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => handlePublishPost(match.id, "PUBLISH_RESULT")}
                            disabled={actionLoading === `PUBLISH_RESULT_${match.id}`}
                            className="h-7 px-2.5 text-xs font-bold border-secondary/50 text-secondary hover:bg-secondary/10"
                          >
                            <Send className="h-3 w-3 mr-1" />
                            <span>{item.result ? "Resync" : "Publish"}</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Bottom: Retry / Sync Actions */}
                {hasMatch && match && (
                  <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs">
                    <span className="text-xs text-muted-foreground font-mono">
                      ID: {match.id.slice(0, 8)}...
                    </span>

                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRetryPublication(match.id)}
                      disabled={actionLoading === `RETRY_${match.id}`}
                      className="h-7 text-xs font-bold text-muted-foreground hover:text-foreground"
                    >
                      <RefreshCw className={`h-3 w-3 mr-1 ${actionLoading === `RETRY_${match.id}` ? "animate-spin" : ""}`} />
                      <span>Retry Sync</span>
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. INSTAGRAM POST PREVIEW MODAL */}
      {/* ========================================================================= */}
      {previewModalOpen && previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
          <div className="relative w-full max-w-xl max-h-screen overflow-y-auto rounded-3xl border border-border bg-card shadow-2xl p-4 sm:p-6 space-y-4">
            {/* Modal Top Bar */}
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-secondary" />
                <h4 className="text-sm font-black uppercase text-foreground">
                  Instagram Graphic Preview ({previewItem.postType})
                </h4>
              </div>

              <div className="flex items-center gap-2">
                {/* Device width toggle */}
                <div className="flex items-center bg-background rounded-xl p-0.5 border border-border">
                  <button
                    type="button"
                    onClick={() => setPreviewDevice("MOBILE")}
                    className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                      previewDevice === "MOBILE"
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    title="Mobile 1:1 view"
                  >
                    <Smartphone className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDevice("DESKTOP")}
                    className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                      previewDevice === "DESKTOP"
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    title="Desktop card view"
                  >
                    <Monitor className="h-3.5 w-3.5" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setPreviewModalOpen(false)}
                  className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Graphic Display Area */}
            {(() => {
              const comp = previewItem.competitionData;
              const match = comp.match;
              const isResult = previewItem.postType === "RESULT";
              const homeScore = match?.homeScore ?? 0;
              const awayScore = match?.awayScore ?? 0;
              const homeIsWinner = homeScore > awayScore;
              const awayIsWinner = awayScore > homeScore;

              return (
                <div
                  className={`mx-auto rounded-2xl border border-border bg-card/90 overflow-hidden shadow-2xl transition-all ${
                    previewDevice === "MOBILE" ? "max-w-sm" : "max-w-md"
                  }`}
                >
                  {/* Instagram Post Header */}
                  <div className="p-3 flex items-center justify-between border-b border-border/60 bg-background/60">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-full bg-card border border-border p-0.5 flex items-center justify-center shrink-0">
                        <Image src="/logo.png" alt="Rwanda eFootball" width={26} height={26} className="object-contain" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1">
                          <span className="font-black text-xs text-white">rwanda_efootball_league</span>
                          <ShieldCheck className="h-3.5 w-3.5 text-primary fill-primary/20" />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {comp.meta.badgeLabel} • Official Broadcast
                        </span>
                      </div>
                    </div>
                    <Badge variant={isResult ? "destructive" : "default"} className="text-xs uppercase font-bold">
                      {isResult ? "Full Time" : "Final Match"}
                    </Badge>
                  </div>

                  {/* 1:1 SQUARE GRAPHIC CENTERPIECE */}
                  <div className="relative w-full aspect-square ig-stadium-card flex flex-col justify-between p-4 select-none overflow-hidden">
                    {/* Stadium Background */}
                    <img
                      src={comp.meta.stadiumBg}
                      alt={comp.meta.title}
                      className="absolute inset-0 w-full h-full object-cover opacity-30 pointer-events-none"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = "/images/home-stadium-bg.jpg";
                      }}
                    />

                    {/* Glow overlays */}
                    <div className="absolute inset-0 ig-stadium-overlay pointer-events-none" />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent pointer-events-none" />
                    <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary/20 rounded-full blur-3xl pointer-events-none" />

                    {/* Top Broadcast Bar */}
                    <div className="relative z-10 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-lg bg-card/90 border border-border flex items-center justify-center p-1">
                          <Image src="/logo.png" alt="Rwanda eFootball" width={18} height={18} className="object-contain" />
                        </div>
                        <span className="font-black text-xs uppercase tracking-wider text-white">
                          {comp.meta.title}
                        </span>
                      </div>
                      <span className="text-xs font-mono font-bold text-foreground px-2 py-0.5 rounded-full bg-card/90 border border-border">
                        {isResult ? "OFFICIAL RESULT" : "FINAL MATCH"}
                      </span>
                    </div>

                    {/* Center Showcase */}
                    <div className="relative z-10 my-auto w-full py-2 flex flex-col items-center text-center">
                      {/* Trophy */}
                      <div className="relative mb-1 flex items-center justify-center">
                        <div className="absolute inset-0 bg-secondary/25 blur-lg rounded-full scale-125 pointer-events-none" />
                        <img
                          src={comp.meta.trophyImage}
                          alt={comp.meta.title}
                          className="relative z-10 h-16 w-16 object-contain drop-shadow-xl"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = "none";
                          }}
                        />
                      </div>

                      <span className="inline-block px-3 py-0.5 rounded-full text-xs font-black uppercase tracking-widest bg-gradient-to-r from-primary via-secondary to-primary text-black shadow-md">
                        {isResult ? "FULL TIME • CHAMPIONS" : "GRAND FINAL"}
                      </span>

                      {/* Teams & Score */}
                      {match ? (
                        <div className="w-full flex items-center justify-between gap-2 pt-3 px-1">
                          {/* Home */}
                          <div className="flex-1 flex flex-col items-center space-y-1 min-w-0">
                            <div className={`h-16 w-16 rounded-2xl bg-card/90 border p-2 flex items-center justify-center shadow-lg ${
                              isResult && homeIsWinner ? "border-secondary ring-2 ring-secondary/50" : "border-border"
                            }`}>
                              <img
                                src={match.homePlayer?.avatar || resolvePlayerAvatar(match.homePlayer || undefined)}
                                alt={match.homePlayer?.gamerTag || "Home"}
                                className="h-full w-full object-contain"
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).src = "/favicon.ico";
                                }}
                              />
                            </div>
                            <p className="font-black text-xs text-white truncate max-w-full">
                              @{match.homePlayer?.gamerTag}
                            </p>
                            <p className="text-xs text-muted-foreground truncate max-w-full">
                              {match.homePlayer?.realTeam || "eFootball"}
                            </p>
                          </div>

                          {/* Center Score / VS */}
                          <div className="shrink-0 flex flex-col items-center px-1">
                            {isResult ? (
                              <div className="flex items-center gap-2 bg-card/95 px-3 py-1.5 rounded-xl border border-border shadow-lg font-mono">
                                <span className={`text-2xl font-black ${homeIsWinner ? "text-secondary" : "text-white"}`}>
                                  {homeScore}
                                </span>
                                <span className="text-muted-foreground font-black">-</span>
                                <span className={`text-2xl font-black ${awayIsWinner ? "text-secondary" : "text-white"}`}>
                                  {awayScore}
                                </span>
                              </div>
                            ) : (
                              <div className="h-10 w-10 rounded-xl bg-card border border-border flex items-center justify-center font-black text-xs text-white shadow-md">
                                VS
                              </div>
                            )}
                          </div>

                          {/* Away */}
                          <div className="flex-1 flex flex-col items-center space-y-1 min-w-0">
                            <div className={`h-16 w-16 rounded-2xl bg-card/90 border p-2 flex items-center justify-center shadow-lg ${
                              isResult && awayIsWinner ? "border-secondary ring-2 ring-secondary/50" : "border-border"
                            }`}>
                              <img
                                src={match.awayPlayer?.avatar || resolvePlayerAvatar(match.awayPlayer || undefined)}
                                alt={match.awayPlayer?.gamerTag || "Away"}
                                className="h-full w-full object-contain"
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).src = "/favicon.ico";
                                }}
                              />
                            </div>
                            <p className="font-black text-xs text-white truncate max-w-full">
                              @{match.awayPlayer?.gamerTag}
                            </p>
                            <p className="text-xs text-muted-foreground truncate max-w-full">
                              {match.awayPlayer?.realTeam || "eFootball"}
                            </p>
                          </div>
                        </div>
                      ) : null}

                      {/* Announcement: Date & Kickoff Time in CAT */}
                      {!isResult && match && (
                        <div className="mt-3 px-3 py-0.5 rounded-full bg-card/90 border border-border text-xs font-mono font-bold text-white flex items-center gap-1.5 shadow-sm">
                          <Calendar className="h-3 w-3 text-secondary shrink-0" />
                          <span>{match.formattedDate} • {match.formattedTime} CAT</span>
                        </div>
                      )}

                      {/* Result: Champion Banner */}
                      {isResult && match && (
                        <div className="mt-3 px-3 py-1 rounded-full bg-secondary/20 border border-secondary/40 text-xs font-black uppercase text-white flex items-center gap-1.5 shadow-sm">
                          <Trophy className="h-3.5 w-3.5 text-secondary shrink-0" />
                          <span>
                            CHAMPION: @{(homeIsWinner ? match.homePlayer?.gamerTag : match.awayPlayer?.gamerTag) || "CONFIRMED"}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Bottom Strip */}
                    <div className="relative z-10 flex items-center justify-between text-xs font-mono font-bold text-muted-foreground pt-1.5 border-t border-border/40">
                      <span className="flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-ping" />
                        <span>RWANDA eFOOTBALL LEAGUE</span>
                      </span>
                      <span>OFFICIAL FINALS BROADCAST</span>
                    </div>
                  </div>

                  {/* Action Bar (Heart, Comment, Share) */}
                  <div className="p-3 border-b border-border/40 flex items-center justify-between text-muted-foreground">
                    <div className="flex items-center gap-3">
                      <Heart className="h-5 w-5" />
                      <MessageCircle className="h-5 w-5" />
                      <Share2 className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-mono">1:1 Square Format</span>
                  </div>

                  {/* Caption Preview */}
                  <div className="p-3.5 space-y-2 text-xs">
                    <p className="text-foreground leading-relaxed">
                      <strong className="text-white mr-1.5">rwanda_efootball_league</strong>
                      <span className="whitespace-pre-line">
                        {isResult
                          ? comp.result?.caption || "Full time official results post caption..."
                          : comp.announcement?.caption || "Grand final match announcement post caption..."}
                      </span>
                    </p>
                    <div className="flex flex-wrap gap-1 pt-1 text-xs text-primary font-bold">
                      {(isResult ? comp.result?.hashtags : comp.announcement?.hashtags)?.map((tag, idx) => (
                        <span key={idx}>{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </section>
  );
}
