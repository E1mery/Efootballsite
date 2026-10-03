"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import PlayerSidebar, { PlayerSidebarBody } from "./PlayerSidebar";
import PlayerTopbar from "./PlayerTopbar";
import DashboardClient from "@/app/dashboard/DashboardClient";
import {
  PLAYER_TAB_TITLES,
  type PlayerDashboardTab,
  type PlayerSidebarCounts,
} from "./player-nav";

type DashboardClientProps = React.ComponentProps<typeof DashboardClient>;

type PlayerShellProps = Omit<DashboardClientProps, "activeTab" | "onTabChange">;

export default function PlayerShell(props: PlayerShellProps) {
  const { player, announcements = [], allPlayerMatches = [] } = props as any;
  const router = useRouter();

  const isReserved = player?.status === "RESERVED";

  const [internalTab, setInternalTab] = useState<PlayerDashboardTab>(
    isReserved ? "STANDINGS" : "OVERVIEW"
  );
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  // Keep reserved athletes off match tabs if status changes
  useEffect(() => {
    if (
      isReserved &&
      (internalTab === "OVERVIEW" ||
        internalTab === "CALENDAR" ||
        internalTab === "HISTORY")
    ) {
      setInternalTab("STANDINGS");
    }
  }, [isReserved, internalTab]);

  const bothLeaguesUnlocked = Boolean(
    (props as any).leagueConfig?.uclStarted &&
      (props as any).leagueConfig?.europaStarted
  );

  // Eject from DRAWS if competitions get locked again
  useEffect(() => {
    if (!bothLeaguesUnlocked && internalTab === "DRAWS") {
      setInternalTab(isReserved ? "STANDINGS" : "OVERVIEW");
    }
  }, [bothLeaguesUnlocked, internalTab, isReserved]);

  const unreadCount = useMemo(() => {
    const now = Date.now();
    const cutoff = now - 24 * 60 * 60 * 1000;
    try {
      const storageKey = `efrl_read_ann_${player?.id}`;
      const saved =
        typeof window !== "undefined"
          ? localStorage.getItem(storageKey)
          : null;
      const readSet = new Set<string>(saved ? JSON.parse(saved) : []);
      return (announcements || []).filter(
        (a: any) =>
          a &&
          (a.isPinned || new Date(a.createdAt).getTime() > cutoff) &&
          !readSet.has(a.id)
      ).length;
    } catch {
      return (announcements || []).filter(
        (a: any) =>
          a && (a.isPinned || new Date(a.createdAt).getTime() > cutoff)
      ).length;
    }
  }, [announcements, player?.id, internalTab]);

  const counts: PlayerSidebarCounts = useMemo(
    () => ({
      calendarMatches: (allPlayerMatches || []).length,
      unreadInbox: unreadCount,
      hasLiveMatch: Boolean((props as any).activeMatch),
      drawsLive: bothLeaguesUnlocked,
      isReserve: Boolean(isReserved),
    }),
    [allPlayerMatches, unreadCount, props, bothLeaguesUnlocked, isReserved]
  );

  const handleNavigate = (tab: PlayerDashboardTab) => {
    setInternalTab(tab);
    setMobileOpen(false);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    router.refresh();
    setTimeout(() => setRefreshing(false), 800);
  };

  const handleSignOut = async () => {
    if (!confirm("Sign out of the Player Portal?")) return;
    setSigningOut(true);
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("efrl_user");
      }
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/?loggedOut=player");
      router.refresh();
    } catch {
      router.push("/?loggedOut=player");
    } finally {
      setSigningOut(false);
    }
  };

  // Pending approval gets a clean centered screen without sidebar chrome
  if (player?.status === "PENDING_APPROVAL") {
    return (
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10">
        <DashboardClient {...(props as any)} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <PlayerSidebar
        activeTab={internalTab}
        onNavigate={handleNavigate}
        counts={counts}
        collapsed={collapsed}
        gamerTag={player?.gamerTag}
        division={isReserved ? "Reserve Pool" : player?.division}
        onSignOut={handleSignOut}
        signingOut={signingOut}
      />

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <button
            aria-label="Close player navigation"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-background"
          />
          <div className="absolute left-0 top-0 h-full w-64 max-w-full border-r border-border bg-card">
            <button
              onClick={() => setMobileOpen(false)}
              aria-label="Close navigation"
              className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
            <PlayerSidebarBody
              activeTab={internalTab}
              onNavigate={handleNavigate}
              counts={counts}
              collapsed={false}
              gamerTag={player?.gamerTag}
              division={isReserved ? "Reserve Pool" : player?.division}
              onSignOut={handleSignOut}
              signingOut={signingOut}
            />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <PlayerTopbar
          title={PLAYER_TAB_TITLES[internalTab]}
          unreadCount={unreadCount}
          gamerTag={player?.gamerTag}
          player={player}
          refreshing={refreshing}
          onMenuClick={() => setMobileOpen(true)}
          onToggleCollapse={() => setCollapsed((v) => !v)}
          collapsed={collapsed}
          onRefresh={handleRefresh}
          onSettings={() => handleNavigate("PROFILE")}
          onSignOut={handleSignOut}
          signingOut={signingOut}
        />
        <main className="flex-1 p-4 sm:p-6">
          <div className="mx-auto max-w-6xl">
            <DashboardClient
              {...(props as any)}
              activeTab={internalTab}
              onTabChange={setInternalTab}
              onOpenSidebar={() => setMobileOpen(true)}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
