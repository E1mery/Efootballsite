"use client";

import { Bell, Menu, PanelLeftClose, PanelLeftOpen, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function PlayerTopbar({
  title,
  unreadCount,
  gamerTag,
  refreshing,
  onMenuClick,
  onToggleCollapse,
  collapsed,
  onRefresh,
}: {
  title: string;
  unreadCount: number;
  gamerTag?: string;
  refreshing: boolean;
  onMenuClick: () => void;
  onToggleCollapse: () => void;
  collapsed: boolean;
  onRefresh: () => void;
}) {
  const initial = (gamerTag || "P").trim().charAt(0).toUpperCase();

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border bg-card px-4">
      <button
        onClick={onMenuClick}
        aria-label="Open player navigation"
        className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>
      <button
        onClick={onToggleCollapse}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="hidden h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground lg:flex"
      >
        {collapsed ? (
          <PanelLeftOpen className="h-5 w-5" />
        ) : (
          <PanelLeftClose className="h-5 w-5" />
        )}
      </button>
      <div className="min-w-0 flex-1">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          Player Portal
        </p>
        <h1 className="truncate text-base font-bold text-foreground">{title}</h1>
      </div>

      <button
        onClick={onRefresh}
        aria-label="Refresh player portal"
        title="Refresh player portal"
        className="relative flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <RefreshCw className={refreshing ? "h-5 w-5 animate-spin" : "h-5 w-5"} />
      </button>

      <button
        aria-label="Announcements"
        title="Unread announcements"
        className="relative flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
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

      <div className="flex items-center gap-2 rounded-lg border border-border bg-muted px-2 py-1">
        <span
          aria-hidden="true"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-black text-primary-foreground"
        >
          {initial}
        </span>
        {gamerTag && (
          <span className="hidden max-w-28 truncate text-sm font-semibold text-foreground sm:block">
            {gamerTag}
          </span>
        )}
      </div>
    </header>
  );
}
