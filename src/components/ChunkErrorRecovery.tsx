"use client";

import { useEffect } from "react";

export default function ChunkErrorRecovery() {
  useEffect(() => {
    const handleChunkError = (message: string) => {
      if (!message) return;
      const lower = message.toLowerCase();
      if (
        lower.includes("loading chunk") ||
        lower.includes("chunkloaderror") ||
        lower.includes("failed to fetch dynamically imported module") ||
        lower.includes("error loading dynamic script")
      ) {
        if (typeof window !== "undefined") {
          const reloadKey = "efrl_chunk_reload_ts";
          const lastReload = sessionStorage.getItem(reloadKey);
          const now = Date.now();
          // Reload if no reload has been attempted in the last 15 seconds
          if (!lastReload || now - parseInt(lastReload, 10) > 15000) {
            sessionStorage.setItem(reloadKey, String(now));
            window.location.reload();
          }
        }
      }
    };

    const onError = (event: ErrorEvent) => {
      if (event.message) {
        handleChunkError(event.message);
      } else if (event.error?.message) {
        handleChunkError(event.error.message);
      }
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      if (typeof reason === "string") {
        handleChunkError(reason);
      } else if (reason?.message) {
        handleChunkError(reason.message);
      }
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);

    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, []);

  return null;
}
