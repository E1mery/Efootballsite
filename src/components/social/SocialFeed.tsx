"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Flame,
  Sparkles,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  SlidersHorizontal,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import SocialPostCard, { SocialPostData } from "./SocialPostCard";

interface SocialFeedProps {
  currentUserId?: string;
  isAdmin?: boolean;
}

const ROTATION_INTERVAL_MS = 8000;

export default function SocialFeed({ currentUserId, isAdmin }: SocialFeedProps) {
  const [posts, setPosts] = useState<SocialPostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);

  // Carousel State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1); // 1 = next, -1 = prev
  const [autoPlay, setAutoPlay] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [viewMode, setViewMode] = useState<"carousel" | "list">("carousel");

  const shouldReduceMotion = useReducedMotion();

  const fetchPosts = useCallback(async (pageNum: number, append = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const params = new URLSearchParams({
        page: String(pageNum),
        limit: "6",
      });

      const res = await fetch(`/api/social/posts?${params.toString()}`);
      const data = await res.json();

      if (res.ok) {
        if (append) {
          setPosts((prev) => [...prev, ...(data.posts || [])]);
        } else {
          setPosts(data.posts || []);
        }
        setHasMore(data.pagination?.hasMore || false);
        setPage(pageNum);
      }
    } catch (err) {
      console.error("Failed to load social feed:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts(1, false);
  }, [fetchPosts]);

  // Keep currentIndex bounded if posts list changes
  useEffect(() => {
    if (posts.length > 0 && currentIndex >= posts.length) {
      setCurrentIndex(0);
    }
  }, [posts.length, currentIndex]);

  const handleLoadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    fetchPosts(page + 1, true);
  }, [loadingMore, hasMore, page, fetchPosts]);

  const handleNext = useCallback(() => {
    if (posts.length <= 1) return;
    setDirection(1);
    setCurrentIndex((prev) => {
      const nextIdx = (prev + 1) % posts.length;
      // Proactively fetch next page when user nears end of loaded posts
      if (nextIdx >= posts.length - 2 && hasMore && !loadingMore) {
        handleLoadMore();
      }
      return nextIdx;
    });
  }, [posts.length, hasMore, loadingMore, handleLoadMore]);

  const handlePrev = useCallback(() => {
    if (posts.length <= 1) return;
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + posts.length) % posts.length);
  }, [posts.length]);

  const goToSlide = (targetIndex: number) => {
    if (targetIndex >= 0 && targetIndex < posts.length && targetIndex !== currentIndex) {
      setDirection(targetIndex > currentIndex ? 1 : -1);
      setCurrentIndex(targetIndex);
    }
  };

  // Auto-play interval
  useEffect(() => {
    if (posts.length <= 1 || !autoPlay || isHovered || viewMode !== "carousel") return;

    const timer = setInterval(() => {
      handleNext();
    }, ROTATION_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [posts.length, autoPlay, isHovered, viewMode, handleNext]);

  // Keyboard navigation for carousel
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (viewMode !== "carousel") return;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      handlePrev();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      handleNext();
    }
  };

  const slideVariants = {
    enter: (dir: number) => ({
      x: shouldReduceMotion ? 0 : dir > 0 ? 90 : -90,
      opacity: 0,
      scale: 0.98,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        x: { type: "spring" as const, stiffness: 280, damping: 28 },
        opacity: { duration: 0.3 },
        scale: { duration: 0.3 },
      },
    },
    exit: (dir: number) => ({
      x: shouldReduceMotion ? 0 : dir > 0 ? -90 : 90,
      opacity: 0,
      scale: 0.98,
      transition: {
        x: { type: "spring" as const, stiffness: 280, damping: 28 },
        opacity: { duration: 0.2 },
      },
    }),
  };

  const currentPost = posts[currentIndex] || posts[0];

  return (
    <section className="space-y-6 pt-4 max-w-2xl mx-auto w-full">
      {/* 1. Feed Section Header */}
      <div className="border-b border-border/80 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-primary/20 text-primary border border-primary/30 shrink-0">
              <Flame className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-foreground tracking-tight uppercase">
                  League Social Feed
                </h2>
                <Badge variant="live" className="text-xs font-black uppercase px-2 py-0.5">
                  LIVE
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Breaking match stories, confirmed results, and pre-match banter from the Rwanda eFootball League.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            {/* View Mode Toggle */}
            {posts.length > 0 && (
              <div className="flex items-center bg-card/60 p-0.5 rounded-xl border border-border">
                <button
                  type="button"
                  onClick={() => setViewMode("carousel")}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                    viewMode === "carousel"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  title="Carousel Mode"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Carousel</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                    viewMode === "list"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  title="Feed List Mode"
                >
                  <Layers className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Feed</span>
                </button>
              </div>
            )}

            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => fetchPosts(1, false)}
              className="h-8 w-8 rounded-xl text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
              title="Refresh Feed"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Loading State */}
      {loading ? (
        <div className="flex flex-col space-y-6">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="rounded-3xl border border-border bg-card/40 p-6 space-y-4 animate-pulse max-w-xl mx-auto w-full"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-border/60" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3.5 w-28 bg-border/60 rounded" />
                  <div className="h-2.5 w-16 bg-border/40 rounded" />
                </div>
              </div>
              <div className="w-full aspect-square bg-border/40 rounded-2xl" />
              <div className="h-4 w-3/4 bg-border/60 rounded" />
              <div className="h-3 w-full bg-border/40 rounded" />
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        /* Empty State */
        <div className="rounded-3xl border border-dashed border-border p-10 sm:p-12 text-center space-y-4 bg-card/30 max-w-xl mx-auto w-full">
          <div className="h-12 w-12 rounded-2xl bg-muted/60 border border-border flex items-center justify-center mx-auto text-muted-foreground">
            <Sparkles className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-black text-foreground uppercase tracking-wide">
              No Stories Yet
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
              Official announcements, verified match scores, and rivalry banter will appear here automatically as league matchdays unfold.
            </p>
          </div>
        </div>
      ) : viewMode === "carousel" ? (
        /* 3. CAROUSEL MODE */
        <div
          role="region"
          aria-label="League Social Feed Carousel"
          tabIndex={0}
          onKeyDown={handleKeyDown}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="relative w-full space-y-3 focus:outline-none select-none"
        >
          {/* Carousel Top Meta Bar */}
          <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold uppercase tracking-wider text-foreground">
                Story {currentIndex + 1} of {posts.length}
              </span>
              {hasMore && (
                <span className="text-muted-foreground">({posts.length}+ loaded)</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAutoPlay((prev) => !prev)}
                className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer py-0.5 px-1.5 rounded-lg hover:bg-card border border-transparent hover:border-border text-xs font-medium"
                title={autoPlay ? "Pause auto-advance" : "Resume auto-advance"}
              >
                {autoPlay && !isHovered ? (
                  <>
                    <Pause className="h-3 w-3 text-secondary" />
                    <span>Auto</span>
                  </>
                ) : (
                  <>
                    <Play className="h-3 w-3" />
                    <span>Paused</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Animated Auto-Advance Progress Bar */}
          <div className="h-1 w-full bg-border/40 rounded-full overflow-hidden">
            {autoPlay && !isHovered && posts.length > 1 && (
              <motion.div
                key={`progress-${currentIndex}`}
                className="h-full bg-secondary"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: ROTATION_INTERVAL_MS / 1000, ease: "linear" }}
              />
            )}
          </div>

          {/* Main Card Carousel Stage */}
          <div className="relative">
            {/* Desktop Floating Navigation Arrows */}
            {posts.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handlePrev();
                  }}
                  aria-label="Previous story"
                  className="carousel-nav-btn absolute -left-5 lg:-left-6 top-1/2 -translate-y-1/2 z-20 group cursor-pointer"
                >
                  <ChevronLeft className="h-5 w-5 text-foreground group-hover:-translate-x-0.5 transition-transform" />
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleNext();
                  }}
                  aria-label="Next story"
                  className="carousel-nav-btn absolute -right-5 lg:-right-6 top-1/2 -translate-y-1/2 z-20 group cursor-pointer"
                >
                  <ChevronRight className="h-5 w-5 text-foreground group-hover:translate-x-0.5 transition-transform" />
                </button>
              </>
            )}

            {/* Slide Transition Container with Drag Support */}
            <div className="relative overflow-hidden w-full">
              <AnimatePresence mode="wait" custom={direction} initial={false}>
                {currentPost && (
                  <motion.div
                    key={currentPost.id}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.2}
                    onDragEnd={(_e, { offset, velocity }) => {
                      if (offset.x < -40 || velocity.x < -300) {
                        handleNext();
                      } else if (offset.x > 40 || velocity.x > 300) {
                        handlePrev();
                      }
                    }}
                    className="w-full flex justify-center touch-pan-y"
                  >
                    <SocialPostCard
                      post={currentPost}
                      currentUserId={currentUserId}
                      isAdmin={isAdmin}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Carousel Footer Controls */}
          {posts.length > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handlePrev}
                className="rounded-xl font-bold text-xs gap-1 border-border bg-card/60 hover:bg-card cursor-pointer w-full sm:w-auto"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Previous Story</span>
              </Button>

              {/* Pagination Dots */}
              <div className="flex items-center gap-1.5 overflow-x-auto max-w-60 py-1 px-2">
                {posts.map((post, idx) => (
                  <button
                    key={`dot-${post.id}`}
                    type="button"
                    onClick={() => goToSlide(idx)}
                    aria-label={`Go to story ${idx + 1}`}
                    className={cn(
                      "carousel-dot cursor-pointer",
                      idx === currentIndex
                        ? "carousel-dot-active"
                        : "carousel-dot-inactive"
                    )}
                  />
                ))}
              </div>

              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleNext}
                className="rounded-xl font-bold text-xs gap-1 border-border bg-card/60 hover:bg-card cursor-pointer w-full sm:w-auto"
              >
                <span>Next Story</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Load More Trigger in Carousel Mode */}
          {hasMore && (
            <div className="pt-2 text-center">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="text-xs text-muted-foreground hover:text-foreground gap-1.5 cursor-pointer"
              >
                <RefreshCw className={cn("h-3 w-3", loadingMore && "animate-spin")} />
                <span>{loadingMore ? "Loading more stories..." : "Load more stories to carousel"}</span>
              </Button>
            </div>
          )}
        </div>
      ) : (
        /* 4. VERTICAL FEED LIST MODE */
        <div className="space-y-8">
          <div className="flex flex-col space-y-8">
            {posts.map((post) => (
              <SocialPostCard
                key={post.id}
                post={post}
                currentUserId={currentUserId}
                isAdmin={isAdmin}
              />
            ))}
          </div>

          {hasMore && (
            <div className="pt-4 text-center">
              <Button
                type="button"
                variant="outline"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="rounded-2xl font-black text-xs px-6 py-2 border-border hover:bg-card cursor-pointer"
              >
                {loadingMore ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Loading Stories...</span>
                  </span>
                ) : (
                  <span>Load More Stories & Banter</span>
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

