"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Heart,
  MessageCircle,
  Share2,
  Calendar,
  Flame,
  Trophy,
  Swords,
  Check,
  Send,
  Trash2,
  ShieldCheck,
  Clock,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { resolvePlayerAvatar, findTeam } from "@/lib/teams";
import { formatRwandanDate, formatRwandanTime } from "@/lib/rwandanTime";

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

export default function SocialPostCard({
  post,
  currentUserId,
  isAdmin,
  onPostUpdated,
}: SocialPostCardProps) {
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [hasLiked, setHasLiked] = useState(post.hasLiked);
  const [isLiking, setIsLiking] = useState(false);

  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState(post.recentComments || []);
  const [commentsCount, setCommentsCount] = useState(post.commentsCount);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  const [copied, setCopied] = useState(false);

  // Toggle Like with Optimistic UI
  const handleToggleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);

    const prevLiked = hasLiked;
    const prevCount = likesCount;

    // Optimistic
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
    } catch (err) {
      // Rollback
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
    } catch (err: any) {
      alert(err.message || "Failed to post comment.");
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

  const isMotw = post.type.startsWith("MOTW");
  const isResult = post.type.endsWith("_RESULT");
  const isRivalry = post.type === "MOTW_RIVALRY";

  const homePlayer = post.match?.homePlayer;
  const awayPlayer = post.match?.awayPlayer;

  const homeTeam = homePlayer ? findTeam(homePlayer.realTeam || "") : null;
  const awayTeam = awayPlayer ? findTeam(awayPlayer.realTeam || "") : null;

  return (
    <article className="rounded-3xl border border-border bg-card/70 backdrop-blur-xl overflow-hidden shadow-2xl transition-all hover:border-primary/40 flex flex-col">
      {/* 1. Header (Instagram Profile Style) */}
      <div className="p-4 sm:p-5 flex items-center justify-between border-b border-border/60 bg-background/40">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative h-10 w-10 sm:h-11 sm:w-11 rounded-full p-0.5 bg-gradient-to-tr from-primary via-secondary to-primary/40 shrink-0">
            <div className="h-full w-full rounded-full bg-card overflow-hidden flex items-center justify-center border border-border">
              <Image
                src="/images/logo.png"
                alt="eFootball.rw"
                width={36}
                height={36}
                className="object-contain"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = "/favicon.ico";
                }}
              />
            </div>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-black text-sm sm:text-base text-white tracking-tight truncate">
                efootball.rw
              </span>
              <ShieldCheck className="h-4 w-4 text-primary fill-primary/20 shrink-0" />
              <span className="text-xs text-muted-foreground font-medium">
                • {new Date(post.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge
                variant={isMotw ? "yellow" : "default"}
                className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full"
              >
                {isRivalry ? "Rivalry Room" : isMotw ? "Match of the Week" : "Match of the Day"}
              </Badge>
              {post.division && (
                <span className="text-[11px] font-bold text-muted-foreground">
                  {post.division}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action link to match */}
        {post.match && (
          <Link
            href={`/fixtures?highlight=${post.match.id}`}
            className="text-xs font-bold text-primary hover:underline flex items-center gap-1 shrink-0"
          >
            <span>Fixture</span>
            <span aria-hidden="true">&rarr;</span>
          </Link>
        )}
      </div>

      {/* 2. Visual Graphic Card (Cinematic Football Display) */}
      <div className="relative w-full aspect-[16/9] sm:aspect-[21/9] bg-gradient-to-br from-card via-background to-card overflow-hidden border-b border-border/80 flex items-center justify-center p-4">
        {/* Background glow & subtle stadium lighting */}
        <div className="absolute inset-0 bg-hero-glow opacity-30 pointer-events-none" />
        <div className="absolute top-0 right-1/4 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-48 h-48 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />

        {/* Match Graphic Content */}
        {post.match && homePlayer && awayPlayer ? (
          <div className="relative z-10 w-full max-w-lg mx-auto flex items-center justify-between gap-3 sm:gap-6">
            {/* Home Player & Club */}
            <div className="flex-1 flex flex-col items-center text-center space-y-1.5 min-w-0">
              <div className="relative h-14 w-14 sm:h-20 sm:w-20 rounded-2xl bg-background/80 border border-border p-2 shadow-xl flex items-center justify-center">
                <img
                  src={homePlayer.avatar || resolvePlayerAvatar(homePlayer) || (homeTeam?.logo || "")}
                  alt={homePlayer.gamerTag}
                  className="h-full w-full object-contain"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(homePlayer.gamerTag)}`;
                  }}
                />
              </div>
              <p className="font-black text-xs sm:text-sm text-white truncate max-w-full">
                {homePlayer.gamerTag}
              </p>
              {homePlayer.realTeam && (
                <span className="text-[10px] sm:text-xs text-muted-foreground truncate max-w-full font-medium">
                  {homePlayer.realTeam}
                </span>
              )}
            </div>

            {/* Middle Badge / Score */}
            <div className="flex flex-col items-center justify-center shrink-0 px-2">
              {isResult ? (
                <div className="flex flex-col items-center space-y-1">
                  <Badge variant="destructive" className="font-mono text-[10px] uppercase font-black px-2 py-0.5">
                    FULL TIME
                  </Badge>
                  <div className="flex items-center gap-2 bg-background/90 px-4 py-1.5 rounded-2xl border border-border shadow-2xl">
                    <span className="text-xl sm:text-3xl font-black text-white font-mono">
                      {post.homeScore ?? post.match.homeScore ?? 0}
                    </span>
                    <span className="text-muted-foreground font-black text-sm">-</span>
                    <span className="text-xl sm:text-3xl font-black text-white font-mono">
                      {post.awayScore ?? post.match.awayScore ?? 0}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center space-y-1">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center shadow-lg">
                    <span className="font-black text-xs sm:text-sm text-primary tracking-wider">
                      VS
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase">
                    {post.match.round}
                  </span>
                </div>
              )}
            </div>

            {/* Away Player & Club */}
            <div className="flex-1 flex flex-col items-center text-center space-y-1.5 min-w-0">
              <div className="relative h-14 w-14 sm:h-20 sm:w-20 rounded-2xl bg-background/80 border border-border p-2 shadow-xl flex items-center justify-center">
                <img
                  src={awayPlayer.avatar || resolvePlayerAvatar(awayPlayer) || (awayTeam?.logo || "")}
                  alt={awayPlayer.gamerTag}
                  className="h-full w-full object-contain"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(awayPlayer.gamerTag)}`;
                  }}
                />
              </div>
              <p className="font-black text-xs sm:text-sm text-white truncate max-w-full">
                {awayPlayer.gamerTag}
              </p>
              {awayPlayer.realTeam && (
                <span className="text-[10px] sm:text-xs text-muted-foreground truncate max-w-full font-medium">
                  {awayPlayer.realTeam}
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="relative z-10 text-center space-y-2 max-w-md">
            <Trophy className="h-10 w-10 text-secondary mx-auto" />
            <h4 className="text-base font-black text-white">{post.headline}</h4>
          </div>
        )}
      </div>

      {/* 3. Action Toolbar (Like, Comment, Share) */}
      <div className="p-4 flex items-center justify-between border-b border-border/40">
        <div className="flex items-center gap-4">
          {/* Like Button */}
          <button
            type="button"
            onClick={handleToggleLike}
            disabled={!currentUserId || isLiking}
            className={`flex items-center gap-1.5 text-xs sm:text-sm font-bold transition-all ${
              hasLiked
                ? "text-red-500 fill-red-500"
                : "text-muted-foreground hover:text-white"
            } ${!currentUserId ? "opacity-60 cursor-not-allowed" : ""}`}
            title={currentUserId ? "Like post" : "Log in to like"}
          >
            <Heart className={`h-5 w-5 ${hasLiked ? "fill-red-500" : ""}`} />
            <span>{likesCount}</span>
          </button>

          {/* Comment Button */}
          <button
            type="button"
            onClick={handleToggleComments}
            className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-muted-foreground hover:text-white transition-all"
          >
            <MessageCircle className="h-5 w-5" />
            <span>{commentsCount}</span>
          </button>

          {/* Share Button */}
          <button
            type="button"
            onClick={handleCopyShare}
            className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-muted-foreground hover:text-white transition-all"
            title="Copy post link"
          >
            {copied ? (
              <>
                <Check className="h-5 w-5 text-green-400" />
                <span className="text-green-400">Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="h-5 w-5" />
                <span>Share</span>
              </>
            )}
          </button>
        </div>

        {isRivalry && (
          <Badge variant="yellow" className="text-[10px] font-black uppercase flex items-center gap-1">
            <Swords className="h-3 w-3" />
            <span>Pre-Match Banter</span>
          </Badge>
        )}
      </div>

      {/* 4. Caption & Storyline (Fabrizio Romano Reporting Tone) */}
      <div className="p-4 sm:p-5 space-y-3 flex-1">
        <h3 className="text-base sm:text-lg font-black text-white tracking-tight leading-snug">
          {post.headline}
        </h3>

        <p className="text-xs sm:text-sm text-foreground/90 whitespace-pre-line leading-relaxed font-normal">
          {post.caption}
        </p>

        {post.hashtags && post.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {post.hashtags.map((tag, idx) => (
              <span key={idx} className="text-xs font-bold text-primary hover:underline cursor-pointer">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 5. Comments Section (Expandable Accordion) */}
      {showComments && (
        <div className="border-t border-border/60 bg-background/50 p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
              Comments & Banter ({commentsCount})
            </h4>
          </div>

          {/* Comments List */}
          <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
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
                        <Badge variant="live" className="text-[9px] uppercase font-black px-1.5 py-0">
                          Opponent
                        </Badge>
                      )}
                      {comment.user.role === "ADMIN" && (
                        <Badge variant="default" className="text-[9px] uppercase font-bold px-1.5 py-0">
                          Admin
                        </Badge>
                      )}
                      <span className="text-[10px] text-muted-foreground font-mono">
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
                        <Trash2 className="h-3 w-3" />
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

          {/* New Comment Input */}
          {currentUserId ? (
            <form onSubmit={handleSubmitComment} className="flex gap-2 pt-2">
              <Input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={isRivalry ? "Drop your pre-match prediction or banter..." : "Add a comment..."}
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
            <p className="text-[11px] text-muted-foreground text-center pt-1">
              Please log in to join the discussion and post comments.
            </p>
          )}
        </div>
      )}
    </article>
  );
}
