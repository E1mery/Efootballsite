"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Flame,
  Sparkles,
  Trophy,
  Swords,
  RefreshCw,
  PlusCircle,
  Radio,
  SlidersHorizontal,
} from "lucide-react";
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
  const [activeFilter, setActiveFilter] = useState<"ALL" | "MOTD" | "MOTW" | "RIVALRY">("ALL");

  const fetchPosts = useCallback(
    async (pageNum: number, filter: string, append = false) => {
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
        if (filter !== "ALL") {
          params.set("type", filter);
        }

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
    },
    []
  );

  useEffect(() => {
    fetchPosts(1, activeFilter, false);
  }, [activeFilter, fetchPosts]);

  const handleFilterChange = (filter: "ALL" | "MOTD" | "MOTW" | "RIVALRY") => {
    if (activeFilter === filter) return;
    setActiveFilter(filter);
  };

  const handleLoadMore = () => {
    if (loadingMore || !hasMore) return;
    fetchPosts(page + 1, activeFilter, true);
  };

  return (
    <section className="space-y-6 pt-4">
      {/* 1. Feed Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary/20 text-primary border border-primary/30">
              <Flame className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase">
                  League Social Feed
                </h2>
                <Badge variant="live" className="text-[10px] font-black uppercase px-2 py-0.5">
                  LIVE
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Breaking match stories, confirmed results, and pre-match banter from the Rwanda eFootball League.
              </p>
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <Button
            type="button"
            size="sm"
            variant={activeFilter === "ALL" ? "default" : "outline"}
            onClick={() => handleFilterChange("ALL")}
            className="rounded-xl text-xs font-black h-8 px-3"
          >
            All Stories
          </Button>

          <Button
            type="button"
            size="sm"
            variant={activeFilter === "MOTD" ? "default" : "outline"}
            onClick={() => handleFilterChange("MOTD")}
            className="rounded-xl text-xs font-black h-8 px-3 gap-1.5"
          >
            <Flame className="h-3.5 w-3.5" />
            <span>Match of Day</span>
          </Button>

          <Button
            type="button"
            size="sm"
            variant={activeFilter === "MOTW" ? "default" : "outline"}
            onClick={() => handleFilterChange("MOTW")}
            className="rounded-xl text-xs font-black h-8 px-3 gap-1.5"
          >
            <Trophy className="h-3.5 w-3.5" />
            <span>Match of Week</span>
          </Button>

          <Button
            type="button"
            size="sm"
            variant={activeFilter === "RIVALRY" ? "default" : "outline"}
            onClick={() => handleFilterChange("RIVALRY")}
            className="rounded-xl text-xs font-black h-8 px-3 gap-1.5"
          >
            <Swords className="h-3.5 w-3.5" />
            <span>Rivalry Banter</span>
          </Button>

          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={() => fetchPosts(1, activeFilter, false)}
            className="h-8 w-8 rounded-xl text-muted-foreground hover:text-white"
            title="Refresh Feed"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* 2. Posts Grid / Timeline */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="rounded-3xl border border-border bg-card/40 p-6 space-y-4 animate-pulse h-96"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-border/60" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3.5 w-28 bg-border/60 rounded" />
                  <div className="h-2.5 w-16 bg-border/40 rounded" />
                </div>
              </div>
              <div className="h-44 bg-border/40 rounded-2xl" />
              <div className="h-4 w-3/4 bg-border/60 rounded" />
              <div className="h-3 w-full bg-border/40 rounded" />
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border p-12 text-center space-y-3 bg-card/30">
          <Sparkles className="h-10 w-10 text-muted-foreground mx-auto opacity-40" />
          <h3 className="text-base font-black text-white">No Stories In This Category Yet</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Official announcements, Match of the Day results, and Match of the Week rivalry banter will appear here automatically as fixtures are scheduled and confirmed.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {posts.map((post) => (
            <SocialPostCard
              key={post.id}
              post={post}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              onPostUpdated={() => fetchPosts(1, activeFilter, false)}
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
