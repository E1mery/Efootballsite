"use client";

import { Bell, Menu, PanelLeftClose, PanelLeftOpen, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AdminTopbar({
  title,
  totalAlerts,
  adminEmail,
  refreshing,
  onMenuClick,
  onToggleCollapse,
  collapsed,
  onRefresh,
}: {
  title: string;
  totalAlerts: number;
  adminEmail?: string;
  refreshing: boolean;
  onMenuClick: () => void;
  onToggleCollapse: () => void;
  collapsed: boolean;
  onRefresh: () => void;
}) {
  const initial = (adminEmail || "A").trim().charAt(0).toUpperCase();
  const shortName = (adminEmail || "admin").split("@")[0];

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border bg-card px-4">
      <button
        onClick={onMenuClick}
        aria-label="Open admin navigation"
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
          Administration
        </p>
        <h1 className="truncate text-base font-bold text-foreground">{title}</h1>
      </div>

      <button
        onClick={onRefresh}
        aria-label="Refresh admin data"
        title="Refresh admin data"
        className="relative flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <RefreshCw className={refreshing ? "h-5 w-5 animate-spin" : "h-5 w-5"} />
      </button>

      <button
        aria-label="Notifications"
        title="Items needing review"
        className="relative flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <Bell className="h-5 w-5" />
        {totalAlerts > 0 && (
          <Badge
            variant="destructive"
            className="absolute right-1 top-1 px-1 py-0 text-xs font-bold"
          >
            {totalAlerts}
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
        <span className="hidden max-w-28 truncate text-sm font-semibold text-foreground sm:block">
          {shortName}
        </span>
      </div>
    </header>
  );
}
