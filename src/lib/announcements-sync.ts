export const ANNOUNCEMENTS_READ_EVENT = "efrl:announcements-read";

export function getAnnouncementStorageKey(playerId?: string | null): string {
  return playerId ? `efrl_read_ann_${playerId}` : "efrl_read_ann_guest";
}

export function getStoredReadIds(playerId?: string | null): Set<string> {
  if (typeof window === "undefined") return new Set<string>();
  try {
    const raw = localStorage.getItem(getAnnouncementStorageKey(playerId));
    if (!raw) return new Set<string>();
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return new Set<string>(parsed.filter((id) => typeof id === "string"));
    }
  } catch {
    // fallback empty
  }
  return new Set<string>();
}

export function persistStoredReadIds(
  playerId: string | null | undefined,
  idsToMark: string[] | Set<string>
): Set<string> {
  if (typeof window === "undefined") return new Set<string>();
  const current = getStoredReadIds(playerId);
  const idsArray = Array.isArray(idsToMark) ? idsToMark : Array.from(idsToMark);
  let changed = false;

  for (const id of idsArray) {
    if (id && !current.has(id)) {
      current.add(id);
      changed = true;
    }
  }

  if (changed) {
    try {
      localStorage.setItem(
        getAnnouncementStorageKey(playerId),
        JSON.stringify(Array.from(current))
      );
    } catch {
      // ignore storage error
    }

    try {
      window.dispatchEvent(
        new CustomEvent(ANNOUNCEMENTS_READ_EVENT, {
          detail: { playerId: playerId ?? null, ids: idsArray },
        })
      );
    } catch {
      // ignore event error
    }
  }

  return current;
}

export function onAnnouncementsRead(
  playerId: string | null | undefined,
  callback: (ids: string[]) => void
): () => void {
  if (typeof window === "undefined") return () => {};

  const handleCustomEvent = (e: Event) => {
    const custom = e as CustomEvent<{ playerId?: string | null; ids?: string[] }>;
    if (
      custom.detail?.playerId &&
      playerId &&
      custom.detail.playerId !== playerId
    ) {
      return;
    }
    const ids = custom.detail?.ids;
    if (Array.isArray(ids) && ids.length > 0) {
      callback(ids);
    }
  };

  const handleStorage = (e: StorageEvent) => {
    if (e.key === getAnnouncementStorageKey(playerId) && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        if (Array.isArray(parsed)) {
          callback(parsed);
        }
      } catch {
        // ignore
      }
    }
  };

  window.addEventListener(ANNOUNCEMENTS_READ_EVENT, handleCustomEvent);
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(ANNOUNCEMENTS_READ_EVENT, handleCustomEvent);
    window.removeEventListener("storage", handleStorage);
  };
}

export async function markAnnouncementsAsReadApi(ids: string[]): Promise<boolean> {
  if (!ids || ids.length === 0) return true;
  try {
    const res = await fetch("/api/announcements/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ announcementIds: ids }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
