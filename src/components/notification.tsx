"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight, Bell, CheckCheck, CheckCircle2, Megaphone, Pin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import {
  getStoredReadIds,
  markAnnouncementsAsReadApi,
  onAnnouncementsRead,
  persistStoredReadIds,
} from "@/lib/announcements-sync";

export type NotificationItem = {
  id: string;
  title: string;
  content: string;
  type: string;
  isPinned?: boolean;
  createdAt: string | Date;
  targetPlayerId?: string | null;
};

type NotificationProps = {
  playerId?: string;
  initialAnnouncements?: NotificationItem[];
  limit?: number;
  unreadCount?: number;
  onViewAll?: () => void;
  onMarkAsRead?: (announcementId: string) => void;
  onMarkAllAsRead?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  triggerClassName?: string;
};

function formatRelativeTime(value: string | Date) {
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleDateString("en-US", {
    timeZone: "Africa/Kigali",
    month: "short",
    day: "numeric",
  });
}

export default function Notification({
  playerId,
  initialAnnouncements,
  limit = 5,
  unreadCount: controlledUnread,
  onViewAll,
  onMarkAsRead: onMarkAsReadProp,
  onMarkAllAsRead: onMarkAllAsReadProp,
  open: controlledOpen,
  onOpenChange,
  triggerClassName,
}: NotificationProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  const [fetched, setFetched] = useState<NotificationItem[]>(
    initialAnnouncements ?? []
  );
  const [loading, setLoading] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(() =>
    getStoredReadIds(playerId)
  );
  const [hydrated, setHydrated] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(min-width: 640px)");
    const update = () => setIsDesktop(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (initialAnnouncements) {
      setFetched(initialAnnouncements);
    }
  }, [initialAnnouncements]);

  useEffect(() => {
    setReadIds(getStoredReadIds(playerId));
    setHydrated(true);
  }, [playerId]);

  useEffect(() => {
    return onAnnouncementsRead(playerId, (ids) => {
      setReadIds((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.add(id));
        return next;
      });
    });
  }, [playerId]);

  const loadAnnouncements = useCallback(async () => {
    if (initialAnnouncements) return;
    setLoading(true);
    try {
      const params = playerId ? `?playerId=${playerId}` : "";
      const res = await fetch(`/api/announcements${params}`, {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.announcements)) {
        setFetched(data.announcements);
      }
      if (Array.isArray(data.readIds) && data.readIds.length > 0) {
        persistStoredReadIds(playerId, data.readIds);
        setReadIds((prev) => {
          const next = new Set(prev);
          data.readIds.forEach((id: string) => next.add(id));
          return next;
        });
      }
    } catch {
      // keep previous list on network hiccup
    } finally {
      setLoading(false);
    }
  }, [initialAnnouncements, playerId]);

  useEffect(() => {
    loadAnnouncements();
    const interval = setInterval(loadAnnouncements, 30000);
    return () => clearInterval(interval);
  }, [loadAnnouncements]);

  const sorted = useMemo(() => {
    const cutoff24h = Date.now() - 24 * 60 * 60 * 1000;
    return [...fetched]
      .filter((a) => a && (a.isPinned || new Date(a.createdAt).getTime() > cutoff24h))
      .sort((a, b) => {
        if (Boolean(a.isPinned) !== Boolean(b.isPinned)) {
          return a.isPinned ? -1 : 1;
        }
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });
  }, [fetched]);

  const latest = useMemo(() => sorted.slice(0, limit), [sorted, limit]);

  const computedUnread = useMemo(
    () => sorted.filter((a) => !readIds.has(a.id)).length,
    [sorted, readIds]
  );

  // Live count based on hydrated read status. Fallback to controlled count before hydration.
  const unreadCount = hydrated ? computedUnread : (controlledUnread ?? computedUnread);

  const handleMarkAsRead = useCallback(
    async (announcementId: string) => {
      persistStoredReadIds(playerId, [announcementId]);
      setReadIds((prev) => {
        const next = new Set(prev);
        next.add(announcementId);
        return next;
      });
      onMarkAsReadProp?.(announcementId);
      await markAnnouncementsAsReadApi([announcementId]);
    },
    [playerId, onMarkAsReadProp]
  );

  const handleMarkAllAsRead = useCallback(async () => {
    const unreadIds = sorted.filter((a) => !readIds.has(a.id)).map((a) => a.id);
    if (unreadIds.length === 0) return;
    persistStoredReadIds(playerId, unreadIds);
    setReadIds((prev) => {
      const next = new Set(prev);
      unreadIds.forEach((id) => next.add(id));
      return next;
    });
    onMarkAllAsReadProp?.();
    await markAnnouncementsAsReadApi(unreadIds);
  }, [playerId, sorted, readIds, onMarkAllAsReadProp]);

  return (
    <Drawer
      open={open}
      onOpenChange={setOpen}
      direction={isDesktop ? "right" : "bottom"}
    >
      <DrawerTrigger asChild>
        <button
          type="button"
          aria-label="Notifications"
          title="Unread announcements"
          className={cn(
            "relative flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground",
            triggerClassName
          )}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute right-1 top-1 px-1 py-0 text-xs font-bold"
            >
              {unreadCount}
            </Badge>
          )}
        </button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 border border-primary/30">
                <Megaphone className="h-4 w-4 text-primary" />
              </span>
              <DrawerTitle>Latest Notifications</DrawerTitle>
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 ? (
                <>
                  <Badge variant="yellow" className="text-xs font-bold">
                    {unreadCount} New
                  </Badge>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleMarkAllAsRead}
                    className="h-7 px-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
                    title="Mark all notifications as read"
                  >
                    <CheckCheck className="mr-1 h-3.5 w-3.5 text-primary" />
                    Mark all read
                  </Button>
                </>
              ) : (
                <Badge variant="secondary" className="text-xs">
                  All caught up
                </Badge>
              )}
            </div>
          </div>
          <DrawerDescription>
            Official broadcasts and direct notices
          </DrawerDescription>
        </DrawerHeader>

        <div className="max-h-96 overflow-y-auto px-4 pb-2 sm:max-h-none sm:flex-1">
          {loading && latest.length === 0 ? (
            <div className="space-y-2 py-4">
              <div className="h-16 rounded-xl border border-border bg-muted/40" />
              <div className="h-16 rounded-xl border border-border bg-muted/40" />
              <div className="h-16 rounded-xl border border-border bg-muted/40" />
            </div>
          ) : latest.length === 0 ? (
            <p className="py-8 text-center text-xs italic text-muted-foreground">
              No active announcements within the last 24 hours.
            </p>
          ) : (
            <div className="space-y-2">
              {latest.map((ann) => {
                const isRead = readIds.has(ann.id);
                return (
                  <button
                    key={ann.id}
                    type="button"
                    onClick={() => {
                      if (!isRead) handleMarkAsRead(ann.id);
                    }}
                    className={cn(
                      "w-full rounded-xl border p-3 text-left transition-all",
                      !isRead
                        ? "border-secondary/50 bg-secondary/10 ring-1 ring-secondary/20"
                        : "border-border bg-card opacity-80 hover:opacity-100"
                    )}
                  >
                    <div className="flex flex-wrap items-center gap-1.5">
                      {!isRead && (
                        <Badge
                          variant="yellow"
                          className="text-xs font-bold"
                        >
                          NEW
                        </Badge>
                      )}
                      <Badge
                        variant={
                          ann.type === "INDIVIDUAL" ? "default" : "secondary"
                        }
                        className="text-xs"
                      >
                        {ann.type === "INDIVIDUAL"
                          ? "Direct notice"
                          : "Broadcast"}
                      </Badge>
                      {ann.isPinned && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-destructive/30 bg-destructive/10 px-2 py-0.5 text-xs font-semibold text-destructive">
                          <Pin className="h-3 w-3" />
                          Pinned
                        </span>
                      )}
                      <span className="ml-auto text-xs text-muted-foreground">
                        {formatRelativeTime(ann.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1.5 truncate text-sm font-bold text-foreground">
                      {ann.title.replace(/\[REMINDER-1HR-[^\]]+\]/, "").trim()}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                      {ann.content}
                    </p>
                    {isRead ? (
                      <span className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
                        <CheckCircle2 className="h-3 w-3 text-primary" />
                        Read
                      </span>
                    ) : (
                      <span className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-secondary">
                        <CheckCheck className="h-3 w-3" />
                        Mark as read
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <DrawerFooter>
          <Button
            onClick={() => {
              setOpen(false);
              onViewAll?.();
            }}
            className="w-full font-bold"
          >
            View All
            <ArrowRight className="h-4 w-4" />
          </Button>
          <DrawerClose asChild>
            <Button variant="outline" className="w-full">
              Close
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
