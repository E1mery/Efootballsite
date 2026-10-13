import {
  Bell,
  CalendarDays,
  Crown,
  Flame,
  History,
  Shield,
  Trophy,
  User,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type PlayerDashboardTab =
  | "OVERVIEW"
  | "CALENDAR"
  | "STANDINGS"
  | "INTERDIVISION_CUPS"
  | "UCL"
  | "EUROPA"
  | "SUPER_CUP"
  | "DRAWS"
  | "INBOX"
  | "HISTORY"
  | "PROFILE";

export type PlayerSidebarCounts = {
  calendarMatches: number;
  unreadInbox: number;
  hasLiveMatch: boolean;
  drawsLive: boolean;
  isReserve: boolean;
};

export type PlayerNavItem = {
  id: PlayerDashboardTab;
  title: string;
  icon: LucideIcon;
  trophyImage?: string;
  count?: number;
  alert?: number;
  badgeVariant?: "yellow" | "destructive" | "live" | "secondary";
  dot?: boolean;
  hidden?: boolean;
};

export type PlayerNavGroup = {
  label: string;
  items: PlayerNavItem[];
};

export const PLAYER_TAB_TITLES: Record<PlayerDashboardTab, string> = {
  OVERVIEW: "Overview",
  CALENDAR: "Match Calendar",
  STANDINGS: "All Division Tables",
  INTERDIVISION_CUPS: "Interdivision Cups",
  UCL: "Interdivision Cups",
  EUROPA: "Interdivision Cups",
  SUPER_CUP: "Interdivision Cups",
  DRAWS: "UCL & Europa Draws",
  INBOX: "Announcements & Inbox",
  HISTORY: "Match History & Proof",
  PROFILE: "Profile & Settings",
};

export function buildPlayerNav(counts: PlayerSidebarCounts): PlayerNavGroup[] {
  const matchItems: PlayerNavItem[] = [];
  if (!counts.isReserve) {
    matchItems.push({
      id: "OVERVIEW",
      title: "Overview",
      icon: Zap,
      dot: counts.hasLiveMatch,
    });
    matchItems.push({
      id: "CALENDAR",
      title: "Match Calendar",
      icon: CalendarDays,
      count: counts.calendarMatches > 0 ? counts.calendarMatches : undefined,
    });
  }

  const competitionItems: PlayerNavItem[] = [
    {
      id: "STANDINGS",
      title: "All Division Tables",
      icon: Trophy,
      trophyImage: "/assets/trophies/league.png",
    },
    {
      id: "INTERDIVISION_CUPS",
      title: "Interdivision Cups",
      icon: Trophy,
      trophyImage: "/assets/trophies/champions-league.png",
    },
  ];
  if (counts.drawsLive) {
    competitionItems.push({
      id: "DRAWS",
      title: "UCL & Europa Draws",
      icon: Trophy,
      badgeVariant: "live",
      dot: true,
    });
  }

  const inboxItems: PlayerNavItem[] = [
    {
      id: "INBOX",
      title: "Announcements & Inbox",
      icon: Bell,
      alert: counts.unreadInbox > 0 ? counts.unreadInbox : undefined,
    },
  ];
  if (!counts.isReserve) {
    inboxItems.push({
      id: "HISTORY",
      title: "Match History & Proof",
      icon: History,
    });
  }

  return [
    ...(matchItems.length > 0 ? [{ label: "Matchday", items: matchItems }] : []),
    { label: "Competition", items: competitionItems },
    { label: "Inbox", items: inboxItems },
    {
      label: "Account",
      items: [{ id: "PROFILE", title: "Profile & Settings", icon: User }],
    },
  ];
}
