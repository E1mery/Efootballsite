"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, RefreshCw, RotateCcw, Home, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [isChunkError, setIsChunkError] = useState(false);

  useEffect(() => {
    console.error("Admin Portal Exception Caught:", error);

    const errorMessage = error?.message?.toLowerCase() || "";
    const isChunk =
      error?.name === "ChunkLoadError" ||
      errorMessage.includes("loading chunk") ||
      errorMessage.includes("failed to fetch dynamically imported module") ||
      errorMessage.includes("error loading dynamic script");

    const isConn =
      errorMessage.includes("connection closed") ||
      errorMessage.includes("network connection lost") ||
      errorMessage.includes("d1_error") ||
      errorMessage.includes("failed to fetch") ||
      errorMessage.includes("database is locked");

    if (isChunk) {
      setIsChunkError(true);
      if (typeof window !== "undefined") {
        const reloadKey = "efrl_admin_chunk_error_ts";
        const lastReload = sessionStorage.getItem(reloadKey);
        const now = Date.now();
        // Automatically attempt a fresh reload once to fetch the newly deployed admin bundle
        if (!lastReload || now - parseInt(lastReload, 10) > 15000) {
          sessionStorage.setItem(reloadKey, String(now));
          window.location.reload();
        }
      }
    } else if (isConn) {
      if (typeof window !== "undefined") {
        const reloadKey = "efrl_admin_conn_error_ts";
        const lastReload = sessionStorage.getItem(reloadKey);
        const now = Date.now();
        // Automatically attempt a fresh reload once on transient edge connection drop
        if (!lastReload || now - parseInt(lastReload, 10) > 15000) {
          sessionStorage.setItem(reloadKey, String(now));
          window.location.reload();
        }
      }
    }
  }, [error]);

  const handleRetry = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
      return;
    }
    reset();
  };

  const handleClearCacheAndReload = () => {
    if (typeof window !== "undefined") {
      try {
        sessionStorage.clear();
      } catch {
        // ignore storage errors
      }
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-xl w-full rounded-3xl border border-destructive/40 bg-gradient-to-b from-background via-card to-background p-6 sm:p-10 text-center space-y-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-destructive/10 rounded-full blur-3xl pointer-events-none" />

        <div className="inline-flex p-4 rounded-3xl bg-destructive/10 text-destructive border border-destructive/30">
          {isChunkError ? (
            <RefreshCw className="h-10 w-10 sm:h-12 sm:w-12 animate-spin text-primary" />
          ) : (
            <ShieldAlert className="h-10 w-10 sm:h-12 sm:w-12 animate-pulse text-destructive" />
          )}
        </div>

        <div className="space-y-2">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground block">
            Admin Office
          </span>
          <h2 className="text-xl sm:text-2xl font-black uppercase text-foreground tracking-tight">
            {isChunkError
              ? "New Version Deployed"
              : "Admin Portal Exception"}
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
            {isChunkError
              ? "A fresh build was deployed to the server. Please reload the admin portal to synchronize with the latest updates."
              : "A temporary error was encountered in the admin portal. Click below to recover your session."}
          </p>
        </div>

        {error?.message && (
          <div className="p-3.5 rounded-2xl bg-background/80 border border-border text-left font-mono text-xs text-destructive overflow-x-auto max-h-28">
            <span className="text-muted-foreground block text-xs uppercase font-bold mb-1">
              Diagnostic:
            </span>
            {error.message}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Button
            type="button"
            onClick={handleRetry}
            className="font-bold text-xs gap-2 py-2.5 px-5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/30 transition-all"
          >
            <RefreshCw className="h-4 w-4" />
            <span>{isChunkError ? "Reload Admin" : "Try Again"}</span>
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
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground bg-card border border-border transition-all"
          >
            <Home className="h-4 w-4" />
            <span>Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
