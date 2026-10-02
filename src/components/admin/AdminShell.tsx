"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import AdminSidebar, { AdminSidebarBody } from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";
import AdminClient from "@/app/admin/AdminClient";
import {
  ADMIN_TAB_TITLES,
  type AdminSidebarCounts,
  type AdminTab,
} from "./admin-nav";

export default function AdminShell({
  matches,
  pendingSubmissions,
  pendingForfeits,
  allPlayers,
  announcements,
  flaggedPlayers,
  leagueConfig,
  div1Standings,
  div2Standings,
  div3Standings,
  uclSlots,
  europaSlots,
  adminEmail,
  initialPendingPlayers = [],
  initialReservePlayers = [],
  initialHallOfFame = [],
  initialPlayerMessages = [],
  initialReviews = [],
  initialPasswordResets = [],
  initialNews = [],
}: {
  matches: any[];
  pendingSubmissions: any[];
  pendingForfeits: any[];
  allPlayers: any[];
  announcements: any[];
  flaggedPlayers: any[];
  leagueConfig: any;
  div1Standings: any[];
  div2Standings: any[];
  div3Standings: any[];
  uclSlots: any[];
  europaSlots: any[];
  adminEmail?: string;
  initialPendingPlayers?: any[];
  initialReservePlayers?: any[];
  initialHallOfFame?: any[];
  initialPlayerMessages?: any[];
  initialReviews?: any[];
  initialPasswordResets?: any[];
  initialNews?: any[];
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AdminTab>("DASHBOARD");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const tabParam = new URLSearchParams(window.location.search)
        .get("tab")
        ?.toUpperCase();
      if (tabParam === "NEWS") setActiveTab("NEWS");
    }
  }, []);

  const counts: AdminSidebarCounts = useMemo(
    () => ({
      pendingPlayers: initialPendingPlayers.length,
      reservePlayers: initialReservePlayers.length,
      matches: matches.length,
      players: allPlayers.length,
      hallOfFame: initialHallOfFame.length,
      news: initialNews.length,
      pendingSubmissions: pendingSubmissions.length,
      pendingForfeits: pendingForfeits.length,
      activeMessages: initialPlayerMessages.length,
      pendingMessages: initialPlayerMessages.filter(
        (m: any) => m.status === "PENDING" && !m.adminReply
      ).length,
      reviews: initialReviews.length,
      passwordResets: initialPasswordResets.length,
      pendingResets: initialPasswordResets.filter(
        (r: any) => r.status === "PENDING"
      ).length,
    }),
    [
      initialPendingPlayers,
      initialReservePlayers,
      matches,
      allPlayers,
      initialHallOfFame,
      initialNews,
      pendingSubmissions,
      pendingForfeits,
      initialPlayerMessages,
      initialReviews,
      initialPasswordResets,
    ]
  );

  const totalAlerts =
    counts.pendingPlayers +
    counts.pendingSubmissions +
    counts.pendingForfeits +
    counts.pendingMessages +
    counts.pendingResets;

  const handleNavigate = (tab: AdminTab) => {
    setActiveTab(tab);
    setMobileOpen(false);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    router.refresh();
    setTimeout(() => setRefreshing(false), 800);
  };

  const handleSignOut = async () => {
    if (!confirm("Sign out of the League Admin Office?")) return;
    setSigningOut(true);
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("efrl_user");
      }
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/?loggedOut=admin");
      router.refresh();
    } catch {
      router.push("/?loggedOut=admin");
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar
        activeTab={activeTab}
        onNavigate={handleNavigate}
        counts={counts}
        collapsed={collapsed}
        adminEmail={adminEmail}
        onSignOut={handleSignOut}
        signingOut={signingOut}
      />

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <button
            aria-label="Close admin navigation"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-background"
          />
          <div className="absolute left-0 top-0 h-full w-72 max-w-full border-r border-border bg-card">
            <button
              onClick={() => setMobileOpen(false)}
              aria-label="Close navigation"
              className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
            <AdminSidebarBody
              activeTab={activeTab}
              onNavigate={handleNavigate}
              counts={counts}
              collapsed={false}
              adminEmail={adminEmail}
              onSignOut={handleSignOut}
              signingOut={signingOut}
            />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar
          title={ADMIN_TAB_TITLES[activeTab]}
          totalAlerts={totalAlerts}
          adminEmail={adminEmail}
          refreshing={refreshing}
          onMenuClick={() => setMobileOpen(true)}
          onToggleCollapse={() => setCollapsed((v) => !v)}
          collapsed={collapsed}
          onRefresh={handleRefresh}
        />
        <main className="flex-1 p-4 sm:p-6">
          <div className="mx-auto max-w-6xl">
            <AdminClient
              matches={matches}
              pendingSubmissions={pendingSubmissions}
              pendingForfeits={pendingForfeits}
              allPlayers={allPlayers}
              announcements={announcements}
              flaggedPlayers={flaggedPlayers}
              leagueConfig={leagueConfig}
              div1Standings={div1Standings}
              div2Standings={div2Standings}
              div3Standings={div3Standings}
              uclSlots={uclSlots}
              europaSlots={europaSlots}
              adminEmail={adminEmail}
              initialPendingPlayers={initialPendingPlayers}
              initialReservePlayers={initialReservePlayers}
              initialHallOfFame={initialHallOfFame}
              initialPlayerMessages={initialPlayerMessages}
              initialReviews={initialReviews}
              initialPasswordResets={initialPasswordResets}
              initialNews={initialNews}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
