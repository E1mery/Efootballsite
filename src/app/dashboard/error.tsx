"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, RotateCcw, Home } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard Client-Side Exception Caught:", error);
  }, [error]);

  const handleClearCacheAndReload = () => {
    try {
      if (typeof window !== "undefined") {
        // Clear cached keys that could cause corrupted state
        localStorage.removeItem("efrl_draw_sound_muted");
        sessionStorage.clear();
        window.location.reload();
      }
    } catch (e) {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-xl w-full rounded-3xl border border-destructive/40 bg-gradient-to-b from-background via-card to-background p-6 sm:p-10 text-center space-y-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-destructive/10 rounded-full blur-3xl pointer-events-none" />

        <div className="inline-flex p-4 rounded-3xl bg-destructive/10 text-destructive border border-destructive/30">
          <AlertTriangle className="h-10 w-10 sm:h-12 sm:w-12 animate-pulse" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-destructive/20 text-destructive border border-destructive/40">
            Player Dashboard Sync
          </span>
          <h2 className="text-xl sm:text-2xl font-black uppercase text-white tracking-tight">
            Dashboard Interface Refresh Needed
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
            A temporary client state issue was encountered. Click below to recover your dashboard session.
          </p>
        </div>

        {error?.message && (
          <div className="p-3.5 rounded-2xl bg-background/80 border border-border text-left font-mono text-xs text-destructive overflow-x-auto max-h-28">
            <span className="text-muted-foreground block text-xs uppercase font-bold mb-1">Error Diagnostic:</span>
            {error.message}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Button
            type="button"
            onClick={() => reset()}
            className="font-bold text-xs gap-2 py-2.5 px-5 rounded-xl bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/30 transition-all"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Try Again</span>
          </Button>

          <Button
            type="button"
            onClick={handleClearCacheAndReload}
            className="font-bold text-xs gap-2 py-2.5 px-5 rounded-xl bg-muted hover:bg-accent text-foreground border border-border shadow-md transition-all"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Clear Cache & Reload</span>
          </Button>

          <Link
            href="/"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-muted-foreground hover:text-white bg-card border border-border transition-all"
          >
            <Home className="h-4 w-4" />
            <span>Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
