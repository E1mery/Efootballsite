"use client";

import { Menu, PanelLeftClose, PanelLeftOpen, RefreshCw } from "lucide-react";
import AdminAlerts, { type AdminAlertItem } from "@/components/admin-alerts";
import UserAvatarMenu from "@/components/UserAvatarMenu";
import type { AdminTab } from "@/components/admin/admin-nav";

export default function AdminTopbar({
  title,
  totalAlerts,
  alerts = [],
  adminEmail,
  refreshing,
  onMenuClick,
  onToggleCollapse,
  collapsed,
  onRefresh,
  onNavigateAlerts,
  onViewAllAlerts,
  onSettings,
  onSignOut,
  signingOut = false,
}: {
  title: string;
  totalAlerts: number;
  alerts?: AdminAlertItem[];
  adminEmail?: string;
  refreshing: boolean;
  onMenuClick: () => void;
  onToggleCollapse: () => void;
  collapsed: boolean;
  onRefresh: () => void;
  onNavigateAlerts?: (tab: AdminTab) => void;
  onViewAllAlerts?: () => void;
  onSettings: () => void;
  onSignOut: () => void;
  signingOut?: boolean;
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

      <AdminAlerts
        totalAlerts={totalAlerts}
        alerts={alerts}
        onNavigate={onNavigateAlerts}
        onViewAll={onViewAllAlerts}
      />

      <UserAvatarMenu
        fallbackInitial={initial}
        triggerLabel={shortName}
        displayName={shortName}
        subtitle={adminEmail}
        settingsLabel="Settings"
        onSettings={onSettings}
        onSignOut={onSignOut}
        signingOut={signingOut}
      />
    </header>
  );
}
