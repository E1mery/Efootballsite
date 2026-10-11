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
  OVERVIEW: "Today's Match",
  CALENDAR: "Match Calendar",
  STANDINGS: "All Division Tables",
  UCL: "UEFA Champions League",
  EUROPA: "UEFA Europa League",
  SUPER_CUP: "UEFA Super Cup",
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
      title: "Today's Match",
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
      id: "UCL",
      title: "Champions League",
      icon: Shield,
      trophyImage: "/assets/trophies/champions-league.png",
    },
    {
      id: "EUROPA",
      title: "Europa League",
      icon: Flame,
      trophyImage: "/assets/trophies/europa-league.png",
    },
    {
      id: "SUPER_CUP",
      title: "Super Cup",
      icon: Crown,
      trophyImage: "/assets/trophies/super-cup.png",
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
