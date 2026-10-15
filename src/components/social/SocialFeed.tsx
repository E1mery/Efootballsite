"use client";

import { useState, useEffect, useCallback } from "react";
import { Flame, Sparkles, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import SocialPostCard, { SocialPostData } from "./SocialPostCard";

interface SocialFeedProps {
  currentUserId?: string;
  isAdmin?: boolean;
}

export default function SocialFeed({ currentUserId, isAdmin }: SocialFeedProps) {
  const [posts, setPosts] = useState<SocialPostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
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

  const handleLoadMore = () => {
    if (loadingMore || !hasMore) return;
    fetchPosts(page + 1, true);
  };

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

          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={() => fetchPosts(1, false)}
            className="h-8 w-8 rounded-xl text-muted-foreground hover:text-foreground shrink-0 self-end sm:self-center"
            title="Refresh Feed"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* 2. Vertically Scrolling Social Media Timeline (Single-Column, Instagram Experience) */}
      {loading ? (
        <div className="flex flex-col space-y-6">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="rounded-3xl border border-border bg-card/40 p-6 space-y-4 animate-pulse"
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
        <div className="rounded-3xl border border-dashed border-border p-10 sm:p-12 text-center space-y-4 bg-card/30">
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
      ) : (
        <div className="flex flex-col space-y-8">
          {posts.map((post) => (
            <SocialPostCard
              key={post.id}
              post={post}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              onPostUpdated={() => fetchPosts(1, false)}
            />
          ))}
        </div>
      )}

      {/* 3. Load More Action */}
      {hasMore && !loading && (
        <div className="pt-4 text-center">
          <Button
            type="button"
            variant="outline"
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="rounded-2xl font-black text-xs px-6 py-2 border-border hover:bg-card"
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
    </section>
  );
}
