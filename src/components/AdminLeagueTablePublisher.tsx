"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Trophy,
  Sparkles,
  Radio,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  Shield,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DivisionTableStatus {
  division: string;
  slug: string;
  isPublished: boolean;
  newsItem: any | null;
}

interface AdminLeagueTablePublisherProps {
  onRefreshNews?: () => void;
  selectedDivisionDefault?: string;
}

export default function AdminLeagueTablePublisher({
  onRefreshNews,
  selectedDivisionDefault,
}: AdminLeagueTablePublisherProps) {
  const [tables, setTables] = useState<DivisionTableStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [updatingDivision, setUpdatingDivision] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ text: string; error?: boolean } | null>(null);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/league-table/publish");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load table status.");
      setTables(data.tables || []);
    } catch (err: any) {
      setNotification({ text: err.message || "Failed to load table status.", error: true });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleToggleTable = async (division: string, currentPublished: boolean) => {
    setUpdatingDivision(division);
    setNotification(null);
    const targetStatus = !currentPublished;

    try {
      const res = await fetch("/api/admin/league-table/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ division, showOnCarousel: targetStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update carousel status.");

      setTables((prev) =>
        prev.map((t) =>
          t.division === division
            ? { ...t, isPublished: targetStatus, newsItem: data.news || t.newsItem }
            : t
        )
      );

      setNotification({
        text: targetStatus
          ? `${division} standings table is now LIVE on the homepage carousel!`
          : `${division} standings table removed from the homepage carousel.`,
      });

      if (onRefreshNews) onRefreshNews();
    } catch (err: any) {
      setNotification({ text: err.message || "An error occurred.", error: true });
    } finally {
      setUpdatingDivision(null);
    }
  };

  return (
    <div className="rounded-3xl border border-border bg-card/80 p-5 sm:p-6 backdrop-blur-xl shadow-xl space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-secondary flex items-center gap-1.5">
              <Trophy className="h-4 w-4 text-secondary" />
              <span>Standings Carousel Controls</span>
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-foreground tracking-tight">
            Publish Any League Table to the Homepage Carousel
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
            Select any domestic division (Division 1, Division 2, Division 3) or continental tournament (UCL, Europa) table to publish directly onto the homepage Coverflow carousel with rank movement indicators and top-form player highlight.
          </p>
        </div>

        <Button
          onClick={fetchStatus}
          disabled={loading}
          variant="outline"
          size="sm"
          className="rounded-xl text-xs font-bold gap-1.5 border-border self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          <span>Refresh Status</span>
        </Button>
      </div>

      {/* Notification banner */}
      {notification && (
        <div
          className={cn(
            "p-3 rounded-2xl text-xs font-medium flex items-center justify-between border",
            notification.error
              ? "bg-destructive/15 text-destructive border-destructive/30"
              : "bg-primary/15 text-primary border-primary/30"
          )}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{notification.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-muted-foreground hover:text-foreground text-xs font-bold cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Tables Publication Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 pt-1">
        {tables.map((t) => {
          const isProcessing = updatingDivision === t.division;
          const isPublished = t.isPublished;

          return (
            <div
              key={t.slug}
              className={cn(
                "rounded-2xl border p-4 flex flex-col justify-between gap-3 transition-all duration-150 backdrop-blur-md",
                isPublished
                  ? "border-secondary/60 bg-secondary/10 shadow-sm"
                  : "border-border/70 bg-card/60 hover:border-border"
              )}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      "text-xs font-mono font-bold uppercase",
                      t.division === "UCL"
                        ? "text-primary"
                        : t.division === "EUROPA"
                        ? "text-secondary"
                        : "text-foreground"
                    )}
                  >
                    {t.division}
                  </span>

                  <span
                    className={cn(
                      "inline-flex items-center gap-1 text-xs font-mono font-bold px-2 py-0.5 rounded-lg border",
                      isPublished
                        ? "bg-secondary/20 text-secondary border-secondary/40"
                        : "bg-muted/40 text-muted-foreground border-border"
                    )}
                  >
                    <Radio className={cn("h-3 w-3", isPublished && "animate-pulse")} />
                    <span>{isPublished ? "Live" : "Offline"}</span>
                  </span>
                </div>

                <p className="text-xs text-muted-foreground line-clamp-2">
                  {t.division} standings with rank movement and top form leader.
                </p>
              </div>

              <div className="pt-2 border-t border-border/40 flex items-center justify-between gap-2">
                <Button
                  onClick={() => handleToggleTable(t.division, isPublished)}
                  disabled={isProcessing}
                  variant={isPublished ? "outline" : "yellow"}
                  size="sm"
                  className={cn(
                    "w-full rounded-xl text-xs font-bold shadow-sm cursor-pointer",
                    isPublished && "border-border text-foreground hover:bg-muted"
                  )}
                >
                  {isProcessing
                    ? "Updating..."
                    : isPublished
                    ? "Remove from Carousel"
                    : "Publish to Carousel"}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
