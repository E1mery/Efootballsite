import {
  Bell,
  Calendar,
  Crown,
  Globe,
  KeyRound,
  MessageSquare,
  Newspaper,
  ShieldAlert,
  Sliders,
  Sparkles,
  Star,
  Trophy,
  Upload,
  UserCheck,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type AdminTab =
  | "DASHBOARD"
  | "NEWS"
  | "PENDING_REGISTRATIONS"
  | "RESERVE_POOL"
  | "TABLES"
  | "ALL_MATCHES"
  | "CONTINENTAL"
  | "RESULTS_QUEUE"
  | "FORFEITS_QUEUE"
  | "ANNOUNCEMENTS"
  | "PLAYERS"
  | "HALL_OF_FAME"
  | "MESSAGES"
  | "REVIEWS"
  | "PASSWORD_RESETS";

export type AdminSidebarCounts = {
  pendingPlayers: number;
  reservePlayers: number;
  matches: number;
  players: number;
  hallOfFame: number;
  news: number;
  pendingSubmissions: number;
  pendingForfeits: number;
  activeMessages: number;
  pendingMessages: number;
  reviews: number;
  passwordResets: number;
  pendingResets: number;
};

export type AdminNavItem = {
  id: AdminTab;
  title: string;
  icon: LucideIcon;
  count?: number;
  alert?: number;
  badgeVariant?: "yellow" | "destructive" | "live" | "secondary";
};

export type AdminNavGroup = {
  label: string;
  items: AdminNavItem[];
};

export const ADMIN_TAB_TITLES: Record<AdminTab, string> = {
  DASHBOARD: "Dashboard",
  PENDING_REGISTRATIONS: "Pending Approvals",
  RESERVE_POOL: "Reserve Pool",
  PLAYERS: "Athletes Directory",
  TABLES: "All League Tables",
  ALL_MATCHES: "All Generated Matches",
  CONTINENTAL: "UCL & Europa Hub",
  RESULTS_QUEUE: "Score Verification",
  FORFEITS_QUEUE: "Forfeit Claims",
  ANNOUNCEMENTS: "Announcements",
  NEWS: "News",
  MESSAGES: "Player Inquiries",
  REVIEWS: "Ratings & Reviews",
  HALL_OF_FAME: "Hall of Fame",
  PASSWORD_RESETS: "Password Resets",
};

export function buildAdminNav(counts: AdminSidebarCounts): AdminNavGroup[] {
  return [
    {
      label: "Main",
      items: [{ id: "DASHBOARD", title: "Dashboard", icon: Sliders }],
    },
    {
      label: "Registration",
      items: [
        {
          id: "PENDING_REGISTRATIONS",
          title: "Pending Approvals",
          icon: UserCheck,
          count: counts.pendingPlayers,
          badgeVariant: "yellow",
        },
        {
          id: "RESERVE_POOL",
          title: "Reserve Pool",
          icon: Sparkles,
          count: counts.reservePlayers,
        },
        {
          id: "PLAYERS",
          title: "Athletes Directory",
          icon: Users,
          count: counts.players,
        },
      ],
    },
    {
      label: "Competition",
      items: [
        { id: "TABLES", title: "All League Tables", icon: Trophy },
        {
          id: "ALL_MATCHES",
          title: "All Generated Matches",
          icon: Calendar,
          count: counts.matches,
        },
        { id: "CONTINENTAL", title: "UCL & Europa Hub", icon: Globe },
        {
          id: "RESULTS_QUEUE",
          title: "Score Verification",
          icon: Upload,
          count: counts.pendingSubmissions,
          badgeVariant: "live",
        },
        {
          id: "FORFEITS_QUEUE",
          title: "Forfeit Claims",
          icon: ShieldAlert,
          count: counts.pendingForfeits,
          badgeVariant: "destructive",
        },
      ],
    },
    {
      label: "Engagement",
      items: [
        { id: "ANNOUNCEMENTS", title: "Announcements", icon: Bell },
        {
          id: "NEWS",
          title: "News",
          icon: Newspaper,
          count: counts.news,
          badgeVariant: "yellow",
        },
        {
          id: "MESSAGES",
          title: "Player Inquiries",
          icon: MessageSquare,
          count: counts.activeMessages,
          alert: counts.pendingMessages,
        },
        {
          id: "REVIEWS",
          title: "Ratings & Reviews",
          icon: Star,
          count: counts.reviews,
        },
        {
          id: "HALL_OF_FAME",
          title: "Hall of Fame",
          icon: Crown,
          count: counts.hallOfFame,
        },
      ],
    },
    {
      label: "System",
      items: [
        {
          id: "PASSWORD_RESETS",
          title: "Password Resets",
          icon: KeyRound,
          count: counts.passwordResets,
          alert: counts.pendingResets,
        },
      ],
    },
  ];
}
