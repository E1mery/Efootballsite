"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
  Flame,
  Trophy,
  Swords,
  Check,
  Send,
  Trash2,
  ShieldCheck,
  Flag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { resolvePlayerAvatar, findTeam } from "@/lib/teams";
import { decodePostCaption, SocialGraphicData } from "@/lib/socialFeedTypes";
import SocialGraphicRenderer from "./SocialGraphicRenderer";

export interface SocialPostData {
  id: string;
  type: string;
  headline: string;
  caption: string;
  hashtags: string[];
  division?: string | null;
  season?: string | null;
  publishedAt: string | Date;
  homeScore?: number | null;
  awayScore?: number | null;
  derbyId?: string | null;
  derbyName?: string | null;
  likesCount: number;
  commentsCount: number;
  hasLiked: boolean;
  match?: {
    id: string;
    round: string;
    division: string;
    status: string;
    homeScore?: number | null;
    awayScore?: number | null;
    matchDate: string | Date;
    deadlineDate: string | Date;
    homePlayer: {
      id: string;
      gamerTag: string;
      realTeam?: string | null;
      avatar?: string | null;
    };
    awayPlayer: {
      id: string;
      gamerTag: string;
      realTeam?: string | null;
      avatar?: string | null;
    };
  } | null;
  recentComments?: Array<{
    id: string;
    content: string;
    isOpponentBanter?: boolean;
    createdAt: string | Date;
    user: {
      id: string;
      role: string;
      gamerTag: string;
      avatar?: string | null;
      realTeam?: string | null;
    };
  }>;
}

interface SocialPostCardProps {
  post: SocialPostData;
  currentUserId?: string;
  isAdmin?: boolean;
  onPostUpdated?: () => void;
}

function formatRelativeTime(dateInput: string | Date): string {
  const published = new Date(dateInput).getTime();
  const diffSec = Math.max(0, Math.floor((Date.now() - published) / 1000));

  if (diffSec < 60) return "JUST NOW";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}M AGO`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}H AGO`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}D AGO`;
  return new Date(dateInput).toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase();
}

export default function SocialPostCard({
  post,
  currentUserId,
  isAdmin,
  onPostUpdated,
}: SocialPostCardProps) {
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [hasLiked, setHasLiked] = useState(post.hasLiked);
  const [isLiking, setIsLiking] = useState(false);

  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState(post.recentComments || []);
  const [commentsCount, setCommentsCount] = useState(post.commentsCount);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  const [copied, setCopied] = useState(false);

  // Decode clean caption and structured graphic data
  const { cleanCaption, data: extractedData } = decodePostCaption(post.caption);

  // Synthesize graphicData fallback if older post without envelope
  const homePlayer = post.match?.homePlayer;
  const awayPlayer = post.match?.awayPlayer;
  const homeTeam = homePlayer ? findTeam(homePlayer.realTeam || "") : null;
  const awayTeam = awayPlayer ? findTeam(awayPlayer.realTeam || "") : null;

  const graphicData: SocialGraphicData = extractedData || {
    category: "MATCHES_RESULTS",
    backgroundKey: "/images/home-stadium-bg.jpg",
    bannerTitle: post.headline,
    homeGamerTag: homePlayer?.gamerTag,
    awayGamerTag: awayPlayer?.gamerTag,
    homeTeamName: homePlayer?.realTeam || undefined,
    awayTeamName: awayPlayer?.realTeam || undefined,
    homeLogo: homePlayer ? (homePlayer.avatar || resolvePlayerAvatar(homePlayer) || (homeTeam?.logo || "")) : undefined,
    awayLogo: awayPlayer ? (awayPlayer.avatar || resolvePlayerAvatar(awayPlayer) || (awayTeam?.logo || "")) : undefined,
    homeScore: post.homeScore ?? post.match?.homeScore,
    awayScore: post.awayScore ?? post.match?.awayScore,
    isConfirmedResult: post.type.endsWith("_RESULT"),
  };

  // Toggle Like with Optimistic UI
  const handleToggleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);

    const prevLiked = hasLiked;
    const prevCount = likesCount;

    setHasLiked(!prevLiked);
    setLikesCount(prevLiked ? Math.max(0, prevCount - 1) : prevCount + 1);

    try {
      const res = await fetch("/api/social/react", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: post.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setHasLiked(data.liked);
      setLikesCount(data.likesCount);
    } catch {
      setHasLiked(prevLiked);
      setLikesCount(prevCount);
    } finally {
      setIsLiking(false);
    }
  };

  // Load All Comments
  const handleToggleComments = async () => {
    const nextState = !showComments;
    setShowComments(nextState);

    if (nextState && comments.length < commentsCount) {
      setLoadingComments(true);
      try {
        const res = await fetch(`/api/social/comments?postId=${post.id}`);
        const data = await res.json();
        if (res.ok && data.comments) {
          setComments(data.comments);
        }
      } catch (err) {
        console.error("Failed to load comments:", err);
      } finally {
        setLoadingComments(false);
      }
    }
  };

  // Submit Comment
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || submittingComment) return;

    setSubmittingComment(true);
    try {
      const res = await fetch("/api/social/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: post.id,
          content: commentText.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setComments((prev) => [...prev, data.comment]);
      setCommentsCount(data.commentsCount);
      setCommentText("");
      setShowComments(true);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to post comment.";
      alert(errorMsg);
    } finally {
      setSubmittingComment(false);
    }
  };

  // Delete Comment (Admin Only)
  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Are you sure you want to remove this comment?")) return;
    try {
      const res = await fetch(`/api/admin/social?commentId=${commentId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
        setCommentsCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Copy Share Link
  const handleCopyShare = () => {
    const shareUrl = `${window.location.origin}/dashboard?highlightPost=${post.id}`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isSuperCup = post.type.startsWith("SUPER_CUP") || post.division === "SUPER_CUP";
  const isUcl = post.type.startsWith("UCL") || post.division === "UCL";
  const isEuropa = post.type.startsWith("EUROPA") || post.division === "EUROPA";
  const isRivalry = post.type === "MOTW_RIVALRY";

  const competitionHref = isSuperCup
    ? "/dashboard/super-cup"
    : isUcl
    ? "/dashboard/ucl"
    : isEuropa
    ? "/dashboard/europa"
    : post.match
    ? `/fixtures?highlight=${post.match.id}`
    : "/standings";

  const competitionLabel = isSuperCup
    ? "Super Cup"
    : isUcl
    ? "UCL"
    : isEuropa
    ? "Europa"
    : post.match
    ? "Fixture"
    : "Standings";

  return (
    <article className="rounded-3xl border border-border bg-card/80 backdrop-blur-xl overflow-hidden shadow-2xl transition-all flex flex-col w-full max-w-xl mx-auto">
      {/* ========================================================================= */}
      {/* 1. INSTAGRAM POST HEADER */}
      {/* ========================================================================= */}
      <div className="p-3 sm:p-4 flex items-center justify-between border-b border-border/60 bg-background/60">
        <div className="flex items-center gap-3 min-w-0">
          {/* Circular Rwanda eFootball League Profile Logo */}
          <div className="relative h-10 w-10 sm:h-11 sm:w-11 rounded-full p-0.5 bg-gradient-to-tr from-primary via-secondary to-primary/40 shrink-0">
            <div className="h-full w-full rounded-full bg-card overflow-hidden flex items-center justify-center border border-border">
              <Image
                src="/logo.png"
                alt="rwanda_efootball_league"
                width={36}
                height={36}
                className="object-contain"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = "/favicon.ico";
                }}
              />
            </div>
          </div>

          {/* Account Identity and Official Indicator */}
          <div className="min-w-0 flex flex-col">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-black text-xs sm:text-sm text-white tracking-tight truncate hover:underline cursor-pointer">
                rwanda_efootball_league
              </span>
              <span title="Official League Account" className="inline-flex items-center">
                <ShieldCheck className="h-4 w-4 text-primary fill-primary/20 shrink-0" />
              </span>
              <span className="text-xs text-muted-foreground font-medium">
                • {formatRelativeTime(post.publishedAt)}
              </span>
            </div>

            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-xs text-muted-foreground font-medium truncate">
                Rwanda eFootball League Official
              </span>
              {post.division && (
                <span className="text-xs font-bold text-muted-foreground">
                  • {post.division}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Options Menu & Contextual Navigation Link */}
        <div className="flex items-center gap-1 shrink-0 relative">
          <Link
            href={competitionHref}
            className="text-xs font-bold text-primary hover:underline px-2 py-1 rounded-lg hover:bg-muted/40 transition-colors"
          >
            {competitionLabel} &rarr;
          </Link>

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMenu((prev) => !prev)}
              className="p-1.5 rounded-full text-muted-foreground hover:text-white hover:bg-muted/60 transition-colors"
              title="Post options"
            >
              <MoreHorizontal className="h-5 w-5" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-8 z-30 w-44 rounded-2xl border border-border bg-card p-1 shadow-2xl space-y-0.5">
                <button
                  type="button"
                  onClick={() => {
                    handleCopyShare();
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-bold text-foreground hover:bg-muted rounded-xl flex items-center justify-between"
                >
                  <span>Share Post</span>
                  <Share2 className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    alert("This match story has been flagged for league administration review.");
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-bold text-destructive hover:bg-destructive/10 rounded-xl flex items-center justify-between"
                >
                  <span>Report Post</span>
                  <Flag className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MAIN POST GRAPHIC (1080 × 1350 / 4:5 INSTAGRAM PORTRAIT RENDERER) */}
      {/* ========================================================================= */}
      <SocialGraphicRenderer
        data={graphicData}
        headline={post.headline}
        season={post.season}
        division={post.division}
        postType={post.type}
      />

      {/* ========================================================================= */}
      {/* 3. ENGAGEMENT SECTION (INSTAGRAM ACTION BAR) */}
      {/* ========================================================================= */}
      <div className="p-3 sm:p-4 flex items-center justify-between border-b border-border/40">
        <div className="flex items-center gap-4">
          {/* Like Button & Real Count */}
          <button
            type="button"
            onClick={handleToggleLike}
            disabled={!currentUserId || isLiking}
            className={`flex items-center gap-1.5 text-xs font-bold transition-all ${
              hasLiked
                ? "text-destructive fill-destructive"
                : "text-muted-foreground hover:text-white"
            } ${!currentUserId ? "opacity-60 cursor-not-allowed" : ""}`}
            title={currentUserId ? "Like post" : "Log in to like"}
          >
            <Heart className={`h-6 w-6 ${hasLiked ? "fill-destructive" : ""}`} />
            <span>{likesCount}</span>
          </button>

          {/* Comment Button & Real Count */}
          <button
            type="button"
            onClick={handleToggleComments}
            className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-white transition-all"
            title="View or add comments"
          >
            <MessageCircle className="h-6 w-6" />
            <span>{commentsCount}</span>
          </button>

          {/* Share Action */}
          <button
            type="button"
            onClick={handleCopyShare}
            className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-white transition-all"
            title="Share post"
          >
            {copied ? (
              <>
                <Check className="h-6 w-6 text-primary" />
                <span className="text-primary font-bold">Copied!</span>
              </>
            ) : (
              <Share2 className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Bookmark Action */}
        <div className="flex items-center gap-2">
          {isRivalry && (
            <Badge variant="yellow" className="text-xs font-black uppercase flex items-center gap-1">
              <Swords className="h-3 w-3" />
              <span>Banter Room</span>
            </Badge>
          )}

          <button
            type="button"
            onClick={() => setIsBookmarked((prev) => !prev)}
            className={`p-1 text-muted-foreground hover:text-white transition-colors ${
              isBookmarked ? "text-secondary fill-secondary" : ""
            }`}
            title={isBookmarked ? "Saved" : "Save post"}
          >
            <Bookmark className={`h-6 w-6 ${isBookmarked ? "fill-secondary text-secondary" : ""}`} />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. CAPTION, HASHTAGS & RELATIVE PUBLICATION TIME */}
      {/* ========================================================================= */}
      <div className="p-4 sm:p-5 space-y-2.5 flex-1">
        {/* Likes Count Summary */}
        <p className="text-xs font-black text-white">
          {likesCount === 1 ? "1 like" : `${likesCount.toLocaleString()} likes`}
        </p>

        {/* Official Account Username followed by Caption */}
        <div className="text-xs sm:text-sm text-foreground/90 leading-relaxed font-normal">
          <span className="font-black text-white mr-2">
            rwanda_efootball_league
          </span>
          <span className="whitespace-pre-line">{cleanCaption}</span>
        </div>

        {/* Hashtags */}
        {post.hashtags && post.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {post.hashtags.map((tag, idx) => (
              <span key={idx} className="text-xs font-bold text-primary hover:underline cursor-pointer">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Relative Publication Time */}
        <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider pt-1">
          {formatRelativeTime(post.publishedAt)}
        </p>

        {/* Comment Preview Accordion Trigger */}
        {commentsCount > 0 && !showComments && (
          <button
            type="button"
            onClick={handleToggleComments}
            className="text-xs text-muted-foreground hover:text-white font-medium block pt-1 text-left"
          >
            View all {commentsCount} comments
          </button>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 5. COMMENTS & BANTER THREAD (ACCORDION & ADD COMMENT FIELD) */}
      {/* ========================================================================= */}
      {showComments && (
        <div className="border-t border-border/60 bg-background/50 p-4 space-y-3">
          <div className="flex items-center justify-between pb-1">
            <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
              Comments & Banter ({commentsCount})
            </h4>
          </div>

          {/* Comments List */}
          <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
            {loadingComments ? (
              <p className="text-xs text-muted-foreground py-2 text-center">Loading comments...</p>
            ) : comments.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2 text-center">
                No comments yet. Be the first to drop your prediction or banter!
              </p>
            ) : (
              comments.map((comment) => (
                <div
                  key={comment.id}
                  className={`p-3 rounded-2xl border text-xs space-y-1 ${
                    comment.isOpponentBanter
                      ? "border-primary/40 bg-primary/10"
                      : "border-border/60 bg-card/60"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-black text-white truncate">
                        {comment.user.gamerTag}
                      </span>
                      {comment.isOpponentBanter && (
                        <Badge variant="live" className="text-xs uppercase font-black px-1.5 py-0">
                          Opponent
                        </Badge>
                      )}
                      {comment.user.role === "ADMIN" && (
                        <Badge variant="default" className="text-xs uppercase font-bold px-1.5 py-0">
                          Admin
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground font-mono">
                        {new Date(comment.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>

                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => handleDeleteComment(comment.id)}
                        className="text-muted-foreground hover:text-destructive p-1"
                        title="Delete comment (Admin)"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <p className="text-foreground leading-relaxed break-words">
                    {comment.content}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Add a Comment Field (Always available directly beneath post) */}
      <div className="border-t border-border/40 p-3 sm:p-4 bg-background/40">
        {currentUserId ? (
          <form onSubmit={handleSubmitComment} className="flex gap-2">
            <Input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder={isRivalry ? "Drop your pre-match banter..." : "Add a comment..."}
              maxLength={500}
              className="text-xs bg-background rounded-xl border-border focus-visible:ring-primary h-10"
            />
            <Button
              type="submit"
              disabled={submittingComment || !commentText.trim()}
              className="bg-primary hover:bg-primary text-white font-bold text-xs rounded-xl px-4 h-10 shrink-0"
            >
              {submittingComment ? (
                <span className="animate-spin text-xs">...</span>
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-1">
            Please log in to join the discussion and post comments.
          </p>
        )}
      </div>
    </article>
  );
}
