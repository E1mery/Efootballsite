"use client";

import { useState } from "react";
import {
  Zap,
  Search,
  Upload,
  ShieldAlert,
  MessageSquare,
  Trophy,
  Calendar,
  Send,
  Bell,
  User,
  Sparkles,
  X,
  ExternalLink,
  ChevronRight,
  HelpCircle,
  Clock,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface QuickActionHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: "OVERVIEW" | "CALENDAR" | "STANDINGS" | "INBOX" | "HISTORY" | "FEEDBACK" | "PROFILE", subTab?: string) => void;
  onOpenSubmitResult?: () => void;
  onOpenForfeitClaim?: () => void;
  onStartTutorial: () => void;
  hasActiveMatch?: boolean;
  opponent?: any;
  isReserved?: boolean;
}

export default function QuickActionHubModal({
  isOpen,
  onClose,
  onNavigateTab,
  onOpenSubmitResult,
  onOpenForfeitClaim,
  onStartTutorial,
  hasActiveMatch = false,
  opponent,
  isReserved = false,
}: QuickActionHubModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<"ALL" | "MATCH" | "TABLES" | "SUPPORT">("ALL");

  if (!isOpen) {
    return null;
  }

  const oppGamerTag = opponent?.gamerTag || "Opponent";
  const oppWhatsApp = typeof opponent?.whatsapp === "string" ? opponent.whatsapp : "";

  const quickActions = [
    {
      id: "submit-score",
      category: "MATCH",
      title: "Submit Match Score & Screenshot",
      description: "Finished your eFootball match? Submit your goals and screenshot proof before midnight.",
      icon: Upload,
      iconColor: "text-sky-400",
      iconBg: "bg-sky-500/20 border-sky-500/30",
      badge: "ACTIVE MATCH",
      disabled: !hasActiveMatch || isReserved,
      actionText: hasActiveMatch ? "Open Score Submission" : "No Active Match Today",
      action: () => {
        onClose();
        if (onOpenSubmitResult) {
          onOpenSubmitResult();
        } else {
          onNavigateTab("OVERVIEW");
        }
      },
    },
    {
      id: "claim-forfeit",
      category: "MATCH",
      title: "Claim Forfeit (Opponent Unresponsive)",
      description: "Opponent not answering on WhatsApp or refusing to play? Upload chat proof to claim a 3-0 win.",
      icon: ShieldAlert,
      iconColor: "text-rose-400",
      iconBg: "bg-rose-500/20 border-rose-500/30",
      badge: "DISPUTE",
      disabled: !hasActiveMatch || isReserved,
      actionText: hasActiveMatch ? "File Forfeit Claim" : "No Active Match",
      action: () => {
        onClose();
        if (onOpenForfeitClaim) {
          onOpenForfeitClaim();
        } else {
          onNavigateTab("OVERVIEW");
        }
      },
    },
    {
      id: "whatsapp-opponent",
      category: "MATCH",
      title: "Contact Opponent on WhatsApp",
      description: oppWhatsApp
        ? `Open direct WhatsApp chat with ${oppGamerTag} to arrange your Room Match.`
        : "Directly open your match opponent's WhatsApp to share room codes.",
      icon: MessageSquare,
      iconColor: "text-emerald-400",
      iconBg: "bg-emerald-500/20 border-emerald-500/30",
      badge: oppWhatsApp ? "READY TO CHAT" : "MATCH",
      disabled: !oppWhatsApp || isReserved,
      actionText: oppWhatsApp ? `Chat with ${oppGamerTag}` : "No Active Opponent",
      action: () => {
        if (oppWhatsApp) {
          const cleanPhone = oppWhatsApp.replace(/[^0-9]/g, "");
          window.open(`https://wa.me/${cleanPhone}`, "_blank");
          onClose();
        }
      },
    },
    {
      id: "check-standings",
      category: "TABLES",
      title: "Check Division Standings & Rankings",
      description: "Inspect points, goal difference, win/draw/loss records, form, and promotion ladders.",
      icon: Trophy,
      iconColor: "text-yellow-400",
      iconBg: "bg-yellow-500/20 border-yellow-500/30",
      badge: "TABLES",
      disabled: false,
      actionText: "View Division Tables",
      action: () => {
        onClose();
        onNavigateTab("STANDINGS");
      },
    },
    {
      id: "view-calendar",
      category: "TABLES",
      title: "View Match Schedule & Calendar",
      description: "Browse all upcoming and past fixtures across the season from Matchday 1 to Finals.",
      icon: Calendar,
      iconColor: "text-indigo-400",
      iconBg: "bg-indigo-500/20 border-indigo-500/30",
      badge: "CALENDAR",
      disabled: false,
      actionText: "Open Calendar",
      action: () => {
        onClose();
        onNavigateTab("CALENDAR");
      },
    },
    {
      id: "contact-admin",
      category: "SUPPORT",
      title: "Send Message to League Commissioners",
      description: "Submit a private inquiry to administrators regarding rules, score corrections, or schedules.",
      icon: Send,
      iconColor: "text-purple-400",
      iconBg: "bg-purple-500/20 border-purple-500/30",
      badge: "SUPPORT DESK",
      disabled: false,
      actionText: "Write Message to Admin",
      action: () => {
        onClose();
        onNavigateTab("INBOX", "DIRECT_MESSAGES");
      },
    },
    {
      id: "read-announcements",
      category: "SUPPORT",
      title: "Read League Announcements",
      description: "Stay informed with official broadcasts and direct commissioner notifications (auto-purged after 24h).",
      icon: Bell,
      iconColor: "text-amber-400",
      iconBg: "bg-amber-500/20 border-amber-500/30",
      badge: "24H NOTICES",
      disabled: false,
      actionText: "Open Announcements",
      action: () => {
        onClose();
        onNavigateTab("INBOX", "ANNOUNCEMENTS");
      },
    },
    {
      id: "edit-profile",
      category: "SUPPORT",
      title: "Update GamerTag, Avatar & WhatsApp",
      description: "Keep your WhatsApp number updated so opponents can always connect with you for fixtures.",
      icon: User,
      iconColor: "text-teal-400",
      iconBg: "bg-teal-500/20 border-teal-500/30",
      badge: "PROFILE",
      disabled: false,
      actionText: "Edit Profile Settings",
      action: () => {
        onClose();
        onNavigateTab("PROFILE");
      },
    },
    {
      id: "start-tutorial",
      category: "SUPPORT",
      title: "Restart Interactive Quick Guide Tour",
      description: "Walk through the full step-by-step visual tutorial on how every feature in the portal works.",
      icon: Sparkles,
      iconColor: "text-yellow-400",
      iconBg: "bg-yellow-500/20 border-yellow-500/30",
      badge: "TUTORIAL",
      disabled: false,
      actionText: "Launch Quick Guide",
      action: () => {
        onClose();
        onStartTutorial();
      },
    },
  ];

  const q = searchQuery.toLowerCase().trim();
  const filteredActions = quickActions.filter((item) => {
    const matchesCategory =
      activeCategory === "ALL" || item.category === activeCategory;
    const matchesQuery =
      !q ||
      item.title.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q);
    return matchesCategory && matchesQuery;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] rounded-3xl border border-slate-800 bg-[#070c18] p-5 sm:p-7 shadow-2xl space-y-5 overflow-hidden ring-1 ring-slate-700/50 flex flex-col">
        {/* Glow Header Accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-sky-500 to-emerald-500" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Zap className="h-5 w-5 fill-current" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                <span>Quick Actions &amp; Help Hub</span>
              </h3>
              <p className="text-xs text-slate-400">
                What would you like to do? Select an action below or search for instant guidance.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Type what you want to do (e.g. submit score, forfeit, WhatsApp, standings, admin)..."
            className="pl-10 bg-slate-900/90 border-slate-800 text-xs sm:text-sm text-white focus:ring-1 focus:ring-amber-500 h-10 rounded-xl"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-3 text-xs text-slate-500 hover:text-slate-300"
            >
              Clear
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {[
            { id: "ALL", label: "All Actions" },
            { id: "MATCH", label: "🎮 Match & Opponent" },
            { id: "TABLES", label: "🏆 Standings & Calendar" },
            { id: "SUPPORT", label: "💬 Support & Guide" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeCategory === cat.id
                  ? "bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20"
                  : "bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Actions Scrollable List */}
        <div className="overflow-y-auto space-y-2.5 pr-1 flex-1 max-h-[460px]">
          {filteredActions.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <HelpCircle className="h-10 w-10 text-slate-600 mx-auto" />
              <h5 className="text-sm font-bold text-white">No actions match your search</h5>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Try searching for something else like &quot;score&quot;, &quot;forfeit&quot;, &quot;standings&quot;, or launch the full Quick Guide tour below.
              </p>
              <Button
                size="sm"
                onClick={() => {
                  onClose();
                  onStartTutorial();
                }}
                className="mt-2 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black text-xs gap-1"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Launch Quick Guide Tour</span>
              </Button>
            </div>
          ) : (
            filteredActions.map((item) => {
              const ActionIcon = item.icon;
              return (
                <div
                  key={item.id}
                  className={`group rounded-2xl border p-3.5 sm:p-4 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    item.disabled
                      ? "border-slate-800/40 bg-slate-950/40 opacity-50 cursor-not-allowed"
                      : "border-slate-800 bg-slate-900/60 hover:bg-slate-900 hover:border-slate-700 hover:shadow-lg"
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`p-2.5 rounded-xl border ${item.iconBg} shrink-0 mt-0.5 sm:mt-0`}>
                      <ActionIcon className={`h-5 w-5 ${item.iconColor}`} />
                    </div>
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-xs sm:text-sm font-black text-white group-hover:text-amber-300 transition-colors">
                          {item.title}
                        </h4>
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700/60">
                          {item.badge}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 self-end sm:self-center pt-2 sm:pt-0">
                    <Button
                      size="sm"
                      disabled={item.disabled}
                      onClick={item.action}
                      className={`text-xs font-bold gap-1 min-w-[130px] justify-between ${
                        item.disabled
                          ? "bg-slate-800 text-slate-500"
                          : "bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-white transition-all shadow-sm"
                      }`}
                    >
                      <span>{item.actionText}</span>
                      <ArrowRight className="h-3.5 w-3.5 shrink-0" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info & Tutorial button */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs text-slate-400">
          <span className="hidden sm:inline">Need step-by-step onboarding walkthrough?</span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              onClose();
              onStartTutorial();
            }}
            className="text-xs font-bold text-amber-400 hover:text-white hover:bg-amber-950/40 gap-1.5 ml-auto"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Open Quick Guide Tutorial</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
