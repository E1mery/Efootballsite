"use client";

import { Bell, Menu, PanelLeftClose, PanelLeftOpen, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import UserAvatarMenu from "@/components/UserAvatarMenu";
import { findTeam } from "@/lib/teams";

type PlayerTopbarPlayer = {
  gamerTag?: string;
  division?: string;
  realTeam?: string | null;
  avatar?: string | null;
};

function resolveTopbarAvatar(player?: PlayerTopbarPlayer | null): string | null {
  if (player?.avatar && player.avatar.startsWith("http")) return player.avatar;
  if (player?.realTeam) {
    const team = findTeam(player.realTeam);
    if (team) return team.logo;
  }
  return null;
}

export default function PlayerTopbar({
  title,
  unreadCount,
  gamerTag,
  player,
  refreshing,
  onMenuClick,
  onToggleCollapse,
  collapsed,
  onRefresh,
  onSettings,
  onSignOut,
  signingOut = false,
}: {
  title: string;
  unreadCount: number;
  gamerTag?: string;
  player?: PlayerTopbarPlayer | null;
  refreshing: boolean;
  onMenuClick: () => void;
  onToggleCollapse: () => void;
  collapsed: boolean;
  onRefresh: () => void;
  onSettings: () => void;
  onSignOut: () => void;
  signingOut?: boolean;
}) {
  const resolvedGamerTag = player?.gamerTag || gamerTag || "Player";
  const initial = resolvedGamerTag.trim().charAt(0).toUpperCase() || "P";
  const avatarImageUrl = resolveTopbarAvatar(player ?? (gamerTag ? { gamerTag } : null));

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

      <UserAvatarMenu
        avatarImageUrl={avatarImageUrl}
        avatarAlt={player?.realTeam || resolvedGamerTag}
        fallbackInitial={initial}
        triggerLabel={resolvedGamerTag}
        displayName={resolvedGamerTag}
        subtitle={player?.division || player?.realTeam || undefined}
        settingsLabel="Profile & Settings"
        onSettings={onSettings}
        onSignOut={onSignOut}
        signingOut={signingOut}
      />
    </header>
  );
}
