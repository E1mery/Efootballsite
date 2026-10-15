"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  Flame,
  Sparkles,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  PlusCircle,
  Eye,
  Send,
  Trash2,
  X,
  Sliders,
  FileText,
  Share2,
  Shield,
  Layers,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import SocialGraphicRenderer from "@/components/social/SocialGraphicRenderer";
import {
  SocialEventCategory,
  ExtendedSocialPostType,
  SocialPostStatus,
  SocialGraphicData,
  DetectedSystemEvent,
} from "@/lib/socialFeedTypes";
import { ApprovedBackground, APPROVED_BACKGROUND_LIST } from "@/lib/socialBackgroundEngine";

export default function AdminSocialFeedManager() {
  const [activeTab, setActiveTab] = useState<"DETECTED" | "MANAGE" | "COMPOSE" | "SETTINGS">("DETECTED");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState<{ text: string; error?: boolean } | null>(null);

  // Data from API
  const [detectedEvents, setDetectedEvents] = useState<DetectedSystemEvent[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({
    autoPublishMotd: true,
    autoPublishMotdRes: true,
    autoPublishMotw: true,
    autoPublishMotwRes: true,
    autoRivalryThread: true,
  });
  const [approvedBackgrounds, setApprovedBackgrounds] = useState<ApprovedBackground[]>(APPROVED_BACKGROUND_LIST);

  // Filtering
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Preview & Edit Modal
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<DetectedSystemEvent | null>(null);
  const [selectedPost, setSelectedPost] = useState<any | null>(null);

  // Form State for Editing / Creating
  const [formHeadline, setFormHeadline] = useState("");
  const [formCaption, setFormCaption] = useState("");
  const [formBackgroundKey, setFormBackgroundKey] = useState("/images/home-stadium-bg.jpg");
  const [formScheduleDate, setFormScheduleDate] = useState("");
  const [formGraphicData, setFormGraphicData] = useState<SocialGraphicData | null>(null);

  // Manual Notice Composer State
  const [noticeTitle, setNoticeTitle] = useState("");
  const [noticeCategory, setNoticeCategory] = useState<ExtendedSocialPostType>("OFFICIAL_LEAGUE_NOTICE");
  const [noticeDivision, setNoticeDivision] = useState("ALL");
  const [noticeContent, setNoticeContent] = useState("");
  const [noticeBg, setNoticeBg] = useState("/images/timeline-stadium-bg.jpg");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/social${statusFilter !== "ALL" ? `?status=${statusFilter}` : ""}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load social feed data.");

      setDetectedEvents(data.detectedEvents || []);
      setPosts(data.posts || []);
      if (data.settings) setSettings(data.settings);
      if (data.approvedBackgrounds) setApprovedBackgrounds(data.approvedBackgrounds);
    } catch (err: any) {
      setNotification({ text: err.message || "Failed to load data.", error: true });
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Open Preview for a Detected Event
  const handleOpenDetectedEvent = (event: DetectedSystemEvent) => {
    setSelectedEvent(event);
    setSelectedPost(null);
    setFormHeadline(event.title);
    setFormCaption("");
    setFormBackgroundKey(event.metadata.backgroundKey || "/images/home-stadium-bg.jpg");
    setFormGraphicData(event.metadata);
    setFormScheduleDate("");
    setPreviewModalOpen(true);
  };

  // Open Preview/Edit for an Existing Post
  const handleOpenExistingPost = (post: any) => {
    setSelectedPost(post);
    setSelectedEvent(null);
    setFormHeadline(post.headline);
    setFormCaption(post.caption);
    setFormBackgroundKey(post.graphicData?.backgroundKey || post.background?.imagePath || "/images/home-stadium-bg.jpg");
    setFormGraphicData(post.graphicData);
    setFormScheduleDate(post.graphicData?.scheduledFor ? post.graphicData.scheduledFor.substring(0, 16) : "");
    setPreviewModalOpen(true);
  };

  // Publish or Schedule from Modal
  const handleSavePost = async (targetStatus: SocialPostStatus) => {
    setActionLoading(true);
    setNotification(null);

    try {
      if (selectedPost) {
        // Update existing post
        const res = await fetch("/api/admin/social", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            postId: selectedPost.id,
            headline: formHeadline,
            caption: formCaption,
            backgroundKey: formBackgroundKey,
            status: targetStatus,
            scheduledFor: formScheduleDate || null,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to update post.");

        setNotification({ text: `Post ${targetStatus === "SCHEDULED" ? "scheduled" : "updated"} successfully!` });
      } else if (selectedEvent) {
        // Create new post from detected event
        const res = await fetch("/api/admin/social", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: selectedEvent.type,
            category: selectedEvent.category,
            headline: formHeadline,
            caption: formCaption,
            division: selectedEvent.division,
            season: selectedEvent.season,
            matchId: selectedEvent.matchId,
            status: targetStatus,
            scheduledFor: formScheduleDate || null,
            backgroundKey: formBackgroundKey,
            graphicData: {
              ...formGraphicData,
              backgroundKey: formBackgroundKey,
            },
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to create post.");

        setNotification({ text: `Post ${targetStatus === "SCHEDULED" ? "scheduled" : "published"} successfully!` });
      }

      setPreviewModalOpen(false);
      fetchData();
    } catch (err: any) {
      setNotification({ text: err.message || "An error occurred.", error: true });
    } finally {
      setActionLoading(false);
    }
  };

  // Quick Action: Publish Immediately from list
  const handleQuickPublish = async (post: any) => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/social", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: post.id,
          status: "PUBLISHED",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setNotification({ text: "Post is now LIVE on the social feed!" });
      fetchData();
    } catch (err: any) {
      setNotification({ text: err.message, error: true });
    } finally {
      setActionLoading(false);
    }
  };

  // Cancel Scheduled Post
  const handleCancelScheduled = async (post: any) => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/social", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: post.id,
          status: "CANCELLED",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setNotification({ text: "Scheduled post has been cancelled." });
      fetchData();
    } catch (err: any) {
      setNotification({ text: err.message, error: true });
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Post
  const handleDeletePost = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this social feed post?")) return;
    try {
      const res = await fetch(`/api/admin/social?postId=${postId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setNotification({ text: "Post deleted successfully." });
        setPosts((prev) => prev.filter((p) => p.id !== postId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Create Manual Notice
  const handleCreateManualNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeTitle.trim() || !noticeContent.trim() || actionLoading) return;

    setActionLoading(true);
    setNotification(null);

    try {
      const res = await fetch("/api/admin/social", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: noticeCategory,
          category: "ADMIN_ANNOUNCEMENTS",
          headline: `📢 ${noticeTitle.toUpperCase()}`,
          caption: noticeContent,
          division: noticeDivision === "ALL" ? null : noticeDivision,
          status: "PUBLISHED",
          backgroundKey: noticeBg,
          graphicData: {
            category: "ADMIN_ANNOUNCEMENTS",
            backgroundKey: noticeBg,
            bannerTitle: "OFFICIAL LEAGUE NOTICE",
            subtitle: noticeTitle.toUpperCase(),
            badgeLabel: "Official Notice",
            badgeVariant: "default",
            noticeTitle: noticeTitle,
            eventKey: `NOTICE_${Date.now()}`,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to publish notice.");

      setNotification({ text: "Official Notice published to Social Feed!" });
      setNoticeTitle("");
      setNoticeContent("");
      setActiveTab("MANAGE");
      fetchData();
    } catch (err: any) {
      setNotification({ text: err.message, error: true });
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle Automation Setting
  const handleToggleSetting = async (key: string, val: boolean) => {
    try {
      const res = await fetch("/api/admin/social", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_SETTINGS",
          [key]: val,
        }),
      });
      const data = await res.json();
      if (res.ok && data.settings) {
        setSettings(data.settings);
        setNotification({ text: "Automation setting updated." });
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Quick Status */}
      <div className="rounded-3xl border border-border bg-card/80 p-5 sm:p-6 backdrop-blur-xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-secondary flex items-center gap-1.5">
              <Flame className="h-4 w-4 text-secondary" />
              <span>Professional Media Suite</span>
            </span>
            <Badge variant="live" className="text-xs font-black uppercase px-2 py-0">
              EA SPORTS FC & UEFA
            </Badge>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase">
            Social Feed & Event Publishing
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-xl">
            Automated event detection, intelligent background selection, and administrative preview workflow for draws, fixtures, results, standings, and official league activities.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={loading}
            className="rounded-xl border-border text-xs font-bold gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Scan Events</span>
          </Button>
        </div>
      </div>

      {/* Notifications */}
      {notification && (
        <div
          className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-between gap-2 ${
            notification.error
              ? "bg-destructive/10 border-destructive/30 text-destructive"
              : "bg-primary/10 border-primary/30 text-primary"
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.error ? <AlertTriangle className="h-4 w-4 shrink-0" /> : <CheckCircle2 className="h-4 w-4 shrink-0" />}
            <span>{notification.text}</span>
          </div>
          <button type="button" onClick={() => setNotification(null)} className="p-1">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* 2. Top Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-border/80 pb-2 overflow-x-auto">
        {[
          { id: "DETECTED", label: `Detected Events (${detectedEvents.length})`, icon: Sparkles },
          { id: "MANAGE", label: `Published & Scheduled (${posts.length})`, icon: Layers },
          { id: "COMPOSE", label: "Compose Notice", icon: PlusCircle },
          { id: "SETTINGS", label: "Automation Rules", icon: Sliders },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-card/70 hover:bg-card border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: DETECTED SYSTEM EVENTS (AWAITING PUBLICATION) */}
      {/* ========================================================================= */}
      {activeTab === "DETECTED" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
            <span>
              Real verified events detected from database transactions and competition schedules.
            </span>
            <span className="font-mono font-bold text-white">
              {detectedEvents.length} events eligible
            </span>
          </div>

          {detectedEvents.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border p-12 text-center space-y-3 bg-card/30">
              <CheckCircle2 className="h-10 w-10 text-primary mx-auto" />
              <h4 className="text-base font-black text-white uppercase">All Caught Up!</h4>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                No new unposted competition draws, fixtures, or results detected. As league matchdays and tournaments proceed, events will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {detectedEvents.map((event) => (
                <div
                  key={event.id}
                  className="rounded-2xl border border-border bg-card/90 p-4 shadow-xl backdrop-blur-md flex flex-col justify-between space-y-3 hover:border-primary/40 transition-colors"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="yellow" className="text-xs font-black uppercase px-2 py-0">
                        {event.category.replace("_", " ")}
                      </Badge>
                      {event.division && (
                        <span className="text-xs font-bold text-muted-foreground font-mono">
                          {event.division}
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-black text-white leading-snug">
                      {event.title}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {event.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-border/60 flex items-center justify-between gap-2">
                    <span className="text-xs font-mono text-muted-foreground truncate">
                      Bg: {event.defaultBackgroundKey}
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleOpenDetectedEvent(event)}
                      className="bg-primary hover:bg-primary/90 text-white font-bold text-xs rounded-xl px-3 py-1.5 gap-1.5"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>Review & Publish</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: MANAGE POSTS (DRAFTS, SCHEDULED, PUBLISHED, HISTORY) */}
      {/* ========================================================================= */}
      {activeTab === "MANAGE" && (
        <div className="space-y-4">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {["ALL", "PUBLISHED", "SCHEDULED", "DRAFT", "CANCELLED"].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  statusFilter === status
                    ? "bg-secondary text-secondary-foreground shadow-sm font-black"
                    : "bg-card/70 hover:bg-card border border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          {posts.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border p-12 text-center space-y-3 bg-card/30">
              <FileText className="h-10 w-10 text-muted-foreground mx-auto" />
              <h4 className="text-base font-black text-white uppercase">No Posts Found</h4>
              <p className="text-xs text-muted-foreground">
                No social feed posts match the selected status filter.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="rounded-2xl border border-border bg-card/90 p-4 shadow-xl backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono font-bold text-muted-foreground">
                        {post.type}
                      </span>
                      <Badge
                        variant={
                          post.status === "PUBLISHED"
                            ? "live"
                            : post.status === "SCHEDULED"
                            ? "yellow"
                            : "default"
                        }
                        className="text-xs uppercase font-black px-2 py-0"
                      >
                        {post.status}
                      </Badge>
                      {post.division && (
                        <span className="text-xs font-bold text-muted-foreground">
                          • {post.division}
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-black text-white truncate">
                      {post.headline}
                    </h4>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {post.caption}
                    </p>
                    <span className="text-xs font-mono text-muted-foreground block pt-0.5">
                      {new Date(post.publishedAt).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenExistingPost(post)}
                      className="rounded-xl border-border text-xs font-bold gap-1"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>Preview / Edit</span>
                    </Button>

                    {post.status === "SCHEDULED" && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancelScheduled(post)}
                        className="rounded-xl border-destructive/40 text-destructive text-xs font-bold"
                      >
                        Cancel
                      </Button>
                    )}

                    {post.status !== "PUBLISHED" && (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleQuickPublish(post)}
                        disabled={actionLoading}
                        className="bg-primary hover:bg-primary/90 text-white font-bold text-xs rounded-xl"
                      >
                        Publish Now
                      </Button>
                    )}

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeletePost(post.id)}
                      className="h-8 w-8 rounded-xl text-muted-foreground hover:text-destructive"
                      title="Delete post"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: COMPOSE MANUAL OFFICIAL NOTICE */}
      {/* ========================================================================= */}
      {activeTab === "COMPOSE" && (
        <form onSubmit={handleCreateManualNotice} className="rounded-3xl border border-border bg-card/90 p-5 sm:p-6 backdrop-blur-xl shadow-xl space-y-4 max-w-2xl">
          <div className="border-b border-border/60 pb-3">
            <h3 className="text-base font-black text-white uppercase tracking-tight">
              Create Official League Announcement
            </h3>
            <p className="text-xs text-muted-foreground">
              Publish an authoritative administrative notice with custom background and official branding.
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-muted-foreground block mb-1">
                Notice Category
              </label>
              <select
                value={noticeCategory}
                onChange={(e) => setNoticeCategory(e.target.value as any)}
                className="w-full bg-background border border-border rounded-xl text-xs px-3 py-2 text-foreground focus:ring-1 focus:ring-primary"
              >
                <option value="OFFICIAL_LEAGUE_NOTICE">Official League Notice</option>
                <option value="MATCH_DEADLINE_CHANGE">Match Deadline Adjustment</option>
                <option value="SCHEDULE_CHANGE">Schedule / Fixture Update</option>
                <option value="COMPETITION_FORMAT_ANNOUNCEMENT">Competition Format Update</option>
                <option value="WEBSITE_FEATURE_ANNOUNCEMENT">Website Feature Announcement</option>
                <option value="SYSTEM_MAINTENANCE_NOTICE">Scheduled System Maintenance</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-muted-foreground block mb-1">
                Target Competition / Division
              </label>
              <select
                value={noticeDivision}
                onChange={(e) => setNoticeDivision(e.target.value)}
                className="w-full bg-background border border-border rounded-xl text-xs px-3 py-2 text-foreground focus:ring-1 focus:ring-primary"
              >
                <option value="ALL">All Divisions & League Members</option>
                <option value="Division 1">Division 1 (Premiership)</option>
                <option value="Division 2">Division 2 (La Liga)</option>
                <option value="Division 3">Division 3 (Serie A)</option>
                <option value="UCL">UEFA Champions League</option>
                <option value="EUROPA">UEFA Europa League</option>
                <option value="SUPER_CUP">UEFA Super Cup</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-muted-foreground block mb-1">
                Notice Title / Headline
              </label>
              <Input
                value={noticeTitle}
                onChange={(e) => setNoticeTitle(e.target.value)}
                placeholder="e.g. Matchday 5 Deadline Extension Notice"
                className="text-xs bg-background rounded-xl border-border"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-muted-foreground block mb-1">
                Notice Content / Official Directive
              </label>
              <textarea
                value={noticeContent}
                onChange={(e) => setNoticeContent(e.target.value)}
                rows={4}
                placeholder="Write official directive text here..."
                className="w-full bg-background border border-border rounded-xl text-xs p-3 text-foreground focus:ring-1 focus:ring-primary"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-muted-foreground block mb-1">
                Select Approved Background Asset
              </label>
              <select
                value={noticeBg}
                onChange={(e) => setNoticeBg(e.target.value)}
                className="w-full bg-background border border-border rounded-xl text-xs px-3 py-2 text-foreground focus:ring-1 focus:ring-primary"
              >
                {approvedBackgrounds.map((bg) => (
                  <option key={bg.id} value={bg.imagePath}>
                    {bg.name} ({bg.theme})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-3 border-t border-border/60 flex items-center justify-end gap-2">
            <Button
              type="submit"
              disabled={actionLoading}
              className="bg-primary hover:bg-primary/90 text-white font-bold text-xs rounded-xl px-5"
            >
              {actionLoading ? "Publishing..." : "Publish Official Notice"}
            </Button>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: AUTOMATION SETTINGS */}
      {/* ========================================================================= */}
      {activeTab === "SETTINGS" && (
        <div className="rounded-3xl border border-border bg-card/90 p-5 sm:p-6 backdrop-blur-xl shadow-xl space-y-5 max-w-2xl">
          <div className="border-b border-border/60 pb-3">
            <h3 className="text-base font-black text-white uppercase tracking-tight">
              Publishing Automation Settings
            </h3>
            <p className="text-xs text-muted-foreground">
              Control automatic background generation and instant feed publishing for real-time matches and results.
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                key: "autoPublishMotd",
                title: "Auto-Publish Match of the Day Announcements",
                desc: "Immediately creates official MOTD story card when chosen by algorithm or admin.",
              },
              {
                key: "autoPublishMotdRes",
                title: "Auto-Publish Match of the Day Full-Time Results",
                desc: "Automatically publishes verified scores when the Match of the Day concludes.",
              },
              {
                key: "autoPublishMotw",
                title: "Auto-Publish Match of the Week Announcements",
                desc: "Instantly posts marquee Match of the Week showdowns on the social feed.",
              },
              {
                key: "autoPublishMotwRes",
                title: "Auto-Publish Match of the Week Results",
                desc: "Posts verified full-time bragging rights when Match of the Week finishes.",
              },
              {
                key: "autoRivalryThread",
                title: "Auto-Launch Match of the Week Rivalry Banter Room",
                desc: "Opens dedicated pre-match opponent discussion room for athletes.",
              },
            ].map((setting) => (
              <div
                key={setting.key}
                className="flex items-center justify-between gap-4 p-3.5 rounded-2xl bg-background/50 border border-border/60"
              >
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-white">{setting.title}</h4>
                  <p className="text-xs text-muted-foreground">{setting.desc}</p>
                </div>

                <input
                  type="checkbox"
                  checked={Boolean(settings[setting.key])}
                  onChange={(e) => handleToggleSetting(setting.key, e.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary shrink-0"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. LIVE GRAPHIC PREVIEW & EDIT MODAL (INSTAGRAM 4:5 PORTRAIT FORMAT) */}
      {/* ========================================================================= */}
      {previewModalOpen && formGraphicData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-background/80 backdrop-blur-md overflow-y-auto">
          <div className="rounded-3xl border border-border bg-card w-full max-w-4xl modal-responsive-height overflow-y-auto p-4 sm:p-6 shadow-2xl space-y-5 animate-fade-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div>
                <span className="text-xs font-mono font-bold uppercase text-secondary">
                  Instagram 4:5 Portrait Preview
                </span>
                <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-tight">
                  {selectedPost ? "Edit & Schedule Post" : "Review Detected Event Post"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Split Layout: Graphic Preview on Left, Form Controls on Right */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: 1080 × 1350 Portrait Graphic */}
              <div className="lg:col-span-6 w-full max-w-sm mx-auto">
                <div className="rounded-3xl overflow-hidden border border-border shadow-2xl">
                  <SocialGraphicRenderer
                    data={{
                      ...formGraphicData,
                      backgroundKey: formBackgroundKey,
                    }}
                    headline={formHeadline}
                    season={selectedEvent?.season || selectedPost?.season}
                    division={selectedEvent?.division || selectedPost?.division}
                    postType={selectedEvent?.type || selectedPost?.type}
                  />
                </div>
              </div>

              {/* Right Column: Customization & Scheduling Controls */}
              <div className="lg:col-span-6 space-y-4">
                <div>
                  <label className="text-xs font-bold text-muted-foreground block mb-1">
                    Select Approved Background
                  </label>
                  <select
                    value={formBackgroundKey}
                    onChange={(e) => setFormBackgroundKey(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl text-xs px-3 py-2 text-foreground focus:ring-1 focus:ring-primary"
                  >
                    {approvedBackgrounds.map((bg) => (
                      <option key={bg.id} value={bg.imagePath}>
                        {bg.name} ({bg.theme})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-muted-foreground block mb-1">
                    Headline
                  </label>
                  <Input
                    value={formHeadline}
                    onChange={(e) => setFormHeadline(e.target.value)}
                    className="text-xs bg-background rounded-xl border-border"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-muted-foreground block mb-1">
                    Caption (Editorial Copy)
                  </label>
                  <textarea
                    value={formCaption}
                    onChange={(e) => setFormCaption(e.target.value)}
                    rows={5}
                    placeholder="Auto-generated editorial copy will be used if left blank..."
                    className="w-full bg-background border border-border rounded-xl text-xs p-3 text-foreground focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-muted-foreground block mb-1">
                    Schedule Publication (Rwandan Time / CAT)
                  </label>
                  <Input
                    type="datetime-local"
                    value={formScheduleDate}
                    onChange={(e) => setFormScheduleDate(e.target.value)}
                    className="text-xs bg-background rounded-xl border-border"
                  />
                  <span className="text-xs text-muted-foreground block mt-1">
                    Leave blank to publish immediately or save as draft.
                  </span>
                </div>

                {/* Modal Action Buttons */}
                <div className="pt-4 border-t border-border/60 flex flex-wrap items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleSavePost("DRAFT")}
                    disabled={actionLoading}
                    className="rounded-xl border-border text-xs font-bold"
                  >
                    Save Draft
                  </Button>

                  {formScheduleDate ? (
                    <Button
                      type="button"
                      onClick={() => handleSavePost("SCHEDULED")}
                      disabled={actionLoading}
                      className="bg-secondary hover:bg-secondary/90 text-black font-bold text-xs rounded-xl px-4 gap-1.5"
                    >
                      <Clock className="h-3.5 w-3.5" />
                      <span>Schedule Post</span>
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={() => handleSavePost("PUBLISHED")}
                      disabled={actionLoading}
                      className="bg-primary hover:bg-primary/90 text-white font-bold text-xs rounded-xl px-5 gap-1.5"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>Approve & Publish Now</span>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
