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
import {
  getStoredReadIds,
  onAnnouncementsRead,
  persistStoredReadIds,
} from "@/lib/announcements-sync";

type DashboardClientProps = React.ComponentProps<typeof DashboardClient>;

type PlayerShellProps = Omit<DashboardClientProps, "activeTab" | "onTabChange"> & {
  initialTab?: PlayerDashboardTab;
};

export default function PlayerShell(props: PlayerShellProps) {
  const { player, announcements = [], allPlayerMatches = [] } = props as any;
  const router = useRouter();

  const isReserved = player?.status === "RESERVED";
  const initialActiveTab = (props as any).initialTab as PlayerDashboardTab | undefined;

  const [internalTab, setInternalTab] = useState<PlayerDashboardTab>(
    initialActiveTab && !isReserved
      ? initialActiveTab
      : isReserved
      ? "STANDINGS"
      : "OVERVIEW"
  );
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  // Sync internalTab when initialTab prop updates
  useEffect(() => {
    if (initialActiveTab && !isReserved) {
      setInternalTab(initialActiveTab);
    }
  }, [initialActiveTab, isReserved]);

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

  const { initialReadAnnouncementIds } = props as any;
  const [readIds, setReadIds] = useState<Set<string>>(() => {
    const stored = getStoredReadIds(player?.id);
    if (Array.isArray(initialReadAnnouncementIds)) {
      initialReadAnnouncementIds.forEach((id: string) => stored.add(id));
    }
    return stored;
  });

  useEffect(() => {
    const stored = getStoredReadIds(player?.id);
    if (Array.isArray(initialReadAnnouncementIds)) {
      initialReadAnnouncementIds.forEach((id: string) => stored.add(id));
    }
    setReadIds(stored);
  }, [player?.id, initialReadAnnouncementIds]);

  useEffect(() => {
    return onAnnouncementsRead(player?.id, (ids) => {
      setReadIds((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.add(id));
        return next;
      });
    });
  }, [player?.id]);

  const handleMarkAsRead = (id: string) => {
    persistStoredReadIds(player?.id, [id]);
    setReadIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  const handleMarkAllAsRead = () => {
    const allIds = (announcements || []).map((a: any) => a?.id).filter(Boolean);
    persistStoredReadIds(player?.id, allIds);
    setReadIds((prev) => {
      const next = new Set(prev);
      allIds.forEach((id: string) => next.add(id));
      return next;
    });
  };

  const unreadCount = useMemo(() => {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    return (announcements || []).filter(
      (a: any) =>
        a &&
        (a.isPinned || new Date(a.createdAt).getTime() > cutoff) &&
        !readIds.has(a.id)
    ).length;
  }, [announcements, readIds]);

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
    if (tab === "INTERDIVISION_CUPS") {
      router.replace("/dashboard?tab=INTERDIVISION_CUPS", { scroll: false });
    } else if (tab === "UCL" || tab === "EUROPA" || tab === "SUPER_CUP") {
      router.replace(`/dashboard?tab=INTERDIVISION_CUPS&cup=${tab}`, { scroll: false });
    } else if (tab === "DRAWS") {
      router.replace("/dashboard?tab=DRAWS", { scroll: false });
    } else {
      router.replace("/dashboard", { scroll: false });
    }
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
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          />
          <div className="absolute left-0 top-0 h-full w-72 drawer-responsive-width max-w-full border-r border-border bg-card">
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
          announcements={announcements}
          refreshing={refreshing}
          onMenuClick={() => setMobileOpen(true)}
          onToggleCollapse={() => setCollapsed((v) => !v)}
          collapsed={collapsed}
          onRefresh={handleRefresh}
          onViewAllNotifications={() => handleNavigate("INBOX")}
          onMarkAsRead={handleMarkAsRead}
          onMarkAllAsRead={handleMarkAllAsRead}
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
              initialReadAnnouncementIds={initialReadAnnouncementIds}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
