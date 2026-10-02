"use client";

import { useState } from "react";
import { ChevronDown, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import EfootballGamingLogo from "@/components/EfootballGamingLogo";
import {
  buildAdminNav,
  type AdminNavItem,
  type AdminSidebarCounts,
  type AdminTab,
} from "./admin-nav";

export type { AdminTab, AdminSidebarCounts };

function NavButton({
  item,
  isActive,
  collapsed,
  onNavigate,
}: {
  item: AdminNavItem;
  isActive: boolean;
  collapsed: boolean;
  onNavigate: (tab: AdminTab) => void;
}) {
  const Icon = item.icon;
  return (
    <button
      onClick={() => onNavigate(item.id)}
      title={collapsed ? item.title : undefined}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
        collapsed && "justify-center px-2",
        isActive
          ? "bg-primary text-primary-foreground shadow-md"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      {isActive && !collapsed && (
        <span
          aria-hidden="true"
          className="absolute left-0 h-6 w-1 rounded-full bg-secondary"
        />
      )}
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed && <span className="flex-1 truncate text-left">{item.title}</span>}
      {!collapsed && typeof item.count === "number" && item.count > 0 && (
        <Badge
          variant={item.badgeVariant ?? "secondary"}
          className="px-1.5 py-0 text-xs font-bold"
        >
          {item.count}
        </Badge>
      )}
      {!collapsed && typeof item.alert === "number" && item.alert > 0 && (
        <Badge variant="destructive" className="px-1.5 py-0 text-xs font-bold">
          {item.alert}
        </Badge>
      )}
      {collapsed && (typeof item.alert === "number" && item.alert > 0) && (
        <span
          aria-hidden="true"
          className="absolute right-1 top-1 h-2 w-2 rounded-full bg-destructive"
        />
      )}
    </button>
  );
}

export function AdminSidebarBody({
  activeTab,
  onNavigate,
  counts,
  collapsed,
  adminEmail,
  onSignOut,
  signingOut,
}: {
  activeTab: AdminTab;
  onNavigate: (tab: AdminTab) => void;
  counts: AdminSidebarCounts;
  collapsed: boolean;
  adminEmail?: string;
  onSignOut: () => void;
  signingOut: boolean;
}) {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    Main: true,
    Registration: true,
    Competition: true,
    Engagement: true,
    System: true,
  });
  const groups = buildAdminNav(counts);

  return (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="flex items-center gap-2 border-b border-border p-4">
        <EfootballGamingLogo size="sm" showText={false} />
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-black uppercase tracking-wide text-foreground">
              eFootball Rwanda
            </p>
            <p className="text-xs text-muted-foreground">Administration</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav aria-label="Admin sections" className="flex-1 space-y-4 overflow-y-auto p-3">
        {groups.map((group) => (
          <div key={group.label} className="space-y-1">
            {collapsed ? (
              <div className="mx-2 border-t border-border" role="separator" />
            ) : (
              <button
                onClick={() =>
                  setOpenGroups((prev) => ({ ...prev, [group.label]: !prev[group.label] }))
                }
                aria-expanded={!!openGroups[group.label]}
                className="flex w-full items-center justify-between px-3 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground"
              >
                <span>{group.label}</span>
                <ChevronDown
                  className={cn(
                    "h-3 w-3 transition-transform",
                    openGroups[group.label] ? "" : "-rotate-90"
                  )}
                />
              </button>
            )}
            {(collapsed || openGroups[group.label]) && (
              <div className="space-y-1">
                {group.items.map((item) => (
                  <NavButton
                    key={item.id}
                    item={item}
                    isActive={activeTab === item.id}
                    collapsed={collapsed}
                    onNavigate={onNavigate}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-3">
        {!collapsed && adminEmail && (
          <p className="mb-2 truncate px-2 text-xs text-muted-foreground">{adminEmail}</p>
        )}
        <button
          onClick={onSignOut}
          disabled={signingOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>{signingOut ? "Signing out..." : "Sign out"}</span>}
        </button>
      </div>
    </div>
  );
}

export default function AdminSidebar({
  activeTab,
  onNavigate,
  counts,
  collapsed,
  adminEmail,
  onSignOut,
  signingOut,
}: {
  activeTab: AdminTab;
  onNavigate: (tab: AdminTab) => void;
  counts: AdminSidebarCounts;
  collapsed: boolean;
  adminEmail?: string;
  onSignOut: () => void;
  signingOut: boolean;
}) {
  return (
    <aside
      aria-label="Admin dashboard sidebar"
      className={cn(
        "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-border bg-card lg:flex",
        collapsed ? "w-16" : "w-72"
      )}
    >
      <AdminSidebarBody
        activeTab={activeTab}
        onNavigate={onNavigate}
        counts={counts}
        collapsed={collapsed}
        adminEmail={adminEmail}
        onSignOut={onSignOut}
        signingOut={signingOut}
      />
    </aside>
  );
}
