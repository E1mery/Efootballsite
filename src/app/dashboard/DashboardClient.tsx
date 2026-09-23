"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Smartphone,
  Clock,
  MessageSquare,
  Copy,
  Check,
  Upload,
  ShieldAlert,
  Trophy,
  Bell,
  CheckCircle,
  AlertTriangle,
  LogOut,
  ExternalLink,
  ChevronRight,
  Send,
  X,
  Sparkles,
  Lock,
  CheckCircle2,
  User,
  Save,
  Eye,
  EyeOff,
  Calendar,
  Star,
  Unlock,
  RotateCcw,
  Flame,
  Zap,
  Globe,
  Play,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import MatchOfTheDayCard from "@/components/MatchOfTheDayCard";
import EfootballLoader from "@/components/EfootballLoader";
import HomeDivisionsTabs from "@/components/HomeDivisionsTabs";
import QuickGuideModal from "@/components/QuickGuideModal";
import QuickActionHubModal from "@/components/QuickActionHubModal";
import ContinentalDrawExperience from "@/components/ContinentalDrawExperience";
import { getTeamsForDivision, resolvePlayerAvatar, findTeam } from "@/lib/teams";

interface ContinentalGroupStandingsViewProps {
  competition: "UCL" | "EUROPA";
  standings: any[];
  slots: any[];
  currentPlayerId: string;
  isStarted?: boolean;
  onWatchDraw?: () => void;
}

function ContinentalGroupStandingsView({
  competition,
  standings,
  slots,
  currentPlayerId,
  isStarted = false,
  onWatchDraw,
}: ContinentalGroupStandingsViewProps) {
  const isUcl = competition === "UCL";
  const compTitle = isUcl
    ? "eFootball Champions League (UCL)"
    : "eFootball Europa League";

  const groups = ["Group A", "Group B", "Group C", "Group D"];
  const hasAnyData = standings.length > 0 || slots.length > 0;

  if (!isStarted) {
    return (
      <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-10 text-center space-y-4">
        <div className={`inline-flex p-4 rounded-2xl ${isUcl ? "bg-indigo-500/10 text-indigo-400" : "bg-amber-500/10 text-amber-400"}`}>
          <Lock className="h-8 w-8" />
        </div>
        <div className="space-y-1">
          <Badge variant="destructive" className="font-mono text-xs uppercase">
            COMPETITION LOCKED PENDING COMMISSIONER LAUNCH
          </Badge>
          <h4 className="text-lg font-black uppercase text-white">
            {compTitle} Draws & Standings Locked
          </h4>
        </div>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          The official {compTitle} draws and group stages will be unlocked by the League Commissioner after the domestic division regular season fixtures conclude.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Button
            type="button"
            disabled
            className="font-black text-xs gap-2 py-2 px-4 rounded-xl opacity-50 cursor-not-allowed bg-slate-900 border border-slate-800 text-slate-400"
          >
            <Lock className="h-3.5 w-3.5" />
            <span>Draw Locked (Awaiting Launch)</span>
          </Button>
          <Link
            href="/continental"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-sky-400 hover:text-white bg-slate-900 border border-slate-800 transition-all"
          >
            <span>View Continental Qualification Slots</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  if (!hasAnyData) {
    return (
      <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-10 text-center space-y-4">
        <div className={`inline-flex p-4 rounded-2xl ${isUcl ? "bg-indigo-500/10 text-indigo-400" : "bg-amber-500/10 text-amber-400"}`}>
          {isUcl ? <Star className="h-8 w-8" /> : <Flame className="h-8 w-8" />}
        </div>
        <h4 className="text-lg font-black uppercase text-white">
          {compTitle} Group Stage Standings
        </h4>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Group draws have not been finalized yet. Once qualified athletes are drawn into Groups A, B, C, and D, the live standings and qualification ladders will update automatically here.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {onWatchDraw && isStarted && (
            <Button
              type="button"
              onClick={onWatchDraw}
              className={`font-black text-xs gap-2 py-2 px-4 rounded-xl shadow-lg ${
                isUcl ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30" : "bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30"
              }`}
            >
              <Play className="h-3.5 w-3.5" />
              <span>Watch Animated Draw Event</span>
            </Button>
          )}
          <Link
            href="/continental"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-sky-400 hover:text-white bg-slate-900 border border-slate-800 transition-all"
          >
            <span>Check Continental Center & Qualified Slots</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Informative Header Banner */}
      <div className={`rounded-2xl border p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
        isUcl
          ? "border-indigo-500/30 bg-indigo-950/20"
          : "border-amber-500/30 bg-amber-950/20"
      }`}>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-mono font-black uppercase px-2.5 py-0.5 rounded-full border ${
              isUcl
                ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-300"
                : "bg-amber-500/20 border-amber-500/40 text-amber-300"
            }`}>
              {isUcl ? "TIER 1 CONTINENTAL" : "TIER 2 CONTINENTAL"}
            </span>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              4 Groups • 16 Athletes
            </span>
          </div>
          <h4 className="text-base sm:text-lg font-black uppercase text-white flex items-center gap-2">
            {isUcl ? <Star className="h-5 w-5 text-indigo-400" /> : <Flame className="h-5 w-5 text-amber-400" />}
            <span>{compTitle} Official Group Standings</span>
          </h4>
          <p className="text-xs text-slate-300">
            Top 2 players from each group advance to the 2-legged Quarter-Finals. Points are earned from simultaneous 2-leg matches.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onWatchDraw && isStarted && (
            <Button
              type="button"
              onClick={onWatchDraw}
              className={`font-black text-xs gap-1.5 py-2.5 px-3.5 rounded-xl text-white shadow-lg ${
                isUcl ? "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30" : "bg-amber-600 hover:bg-amber-500 shadow-amber-600/30"
              }`}
            >
              <Play className="h-3.5 w-3.5" />
              <span>Watch Draw Event</span>
            </Button>
          )}
          <Link
            href="/continental"
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-white shadow-lg transition-all ${
              isUcl
                ? "bg-slate-800 hover:bg-slate-700 border border-indigo-500/30"
                : "bg-slate-800 hover:bg-slate-700 border border-amber-500/30"
            }`}
          >
            <span>Hub & Matches</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Grid of 4 Groups */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {groups.map((grp) => {
          let grpStandings = standings.filter(
            (s) => s.division?.includes(grp) || s.division?.includes(grp.toLowerCase())
          );

          const grpSlots = slots.filter((s) => s.groupName === grp);

          if (grpStandings.length === 0 && grpSlots.length > 0) {
            grpStandings = grpSlots.map((sl, idx) => ({
              id: sl.id,
              playerId: sl.playerId,
              player: sl.player,
              rank: idx + 1,
              played: 0,
              won: 0,
              drawn: 0,
              lost: 0,
              goalsFor: 0,
              goalsAgainst: 0,
              goalDifference: 0,
              points: 0,
              form: "-",
            }));
          }

          return (
            <div
              key={grp}
              className="rounded-2xl border border-slate-800 bg-[#080d1c]/90 overflow-hidden shadow-xl backdrop-blur-md flex flex-col"
            >
              {/* Group Header */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-900/50">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${isUcl ? "bg-indigo-400" : "bg-amber-400"}`} />
                  <h5 className="text-sm font-black uppercase tracking-wide text-white">{grp}</h5>
                </div>
                <Badge variant="outline" className="text-[10px] font-bold text-emerald-400 border-emerald-500/40 bg-emerald-950/20">
                  Top 2 → Quarter-Finals
                </Badge>
              </div>

              {/* Table */}
              <div className="overflow-x-auto p-2">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800/80 text-[10px] uppercase font-bold text-slate-400">
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Athlete</th>
                      <th className="py-2.5 px-2 text-center">P</th>
                      <th className="py-2.5 px-2 text-center">W</th>
                      <th className="py-2.5 px-2 text-center">D</th>
                      <th className="py-2.5 px-2 text-center">L</th>
                      <th className="py-2.5 px-2 text-center">GD</th>
                      <th className="py-2.5 px-3 text-right">Pts</th>
                      <th className="py-2.5 px-3 text-center">Form</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {grpStandings.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-8 text-center text-xs text-slate-500">
                          Group slots not yet drawn
                        </td>
                      </tr>
                    ) : (
                      grpStandings.map((s, idx) => {
                        const isTop2 = idx < 2;
                        const isMe = s.playerId === currentPlayerId;

                        return (
                          <tr
                            key={s.id || s.playerId}
                            className={`transition-colors ${
                              isMe
                                ? "bg-sky-500/10 font-bold"
                                : isTop2
                                ? "bg-emerald-950/15"
                                : "hover:bg-slate-900/40"
                            }`}
                          >
                            <td className="py-2.5 px-3 font-mono">
                              <span
                                className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-black ${
                                  isTop2
                                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                                    : "text-slate-500"
                                }`}
                              >
                                {idx + 1}
                              </span>
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-slate-950 border border-slate-700/80 p-0.5 flex items-center justify-center shrink-0 aspect-square overflow-hidden shadow-inner">
                                  <img
                                    src={resolvePlayerAvatar(s.player)}
                                    alt={s.player?.realTeam || s.player?.gamerTag || "Team Crest"}
                                    className="w-full h-full object-contain"
                                    loading="lazy"
                                    onError={(e) => {
                                      (e.currentTarget as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(s.player?.gamerTag || "player")}`;
                                    }}
                                  />
                                </div>
                                <div className="truncate max-w-[130px] sm:max-w-[160px]">
                                  <span className="font-bold text-white truncate block text-xs">
                                    {s.player?.gamerTag || "Unknown Player"}
                                  </span>
                                  <div className="flex items-center gap-1.5">
                                    {s.player?.realTeam && (
                                      <span className="text-[9px] text-amber-400 font-bold truncate block">
                                        {findTeam(s.player.realTeam)?.shortName || s.player.realTeam}
                                      </span>
                                    )}
                                    {s.player?.division && (
                                      <span className="text-[9px] text-slate-400 font-mono block">
                                        • {s.player.division}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                {isMe && (
                                  <Badge variant="yellow" className="text-[8px] px-1 py-0 font-black shrink-0">
                                    YOU
                                  </Badge>
                                )}
                              </div>
                            </td>
                            <td className="py-2.5 px-2 text-center font-mono text-slate-300">{s.played ?? 0}</td>
                            <td className="py-2.5 px-2 text-center font-mono text-slate-300">{s.won ?? 0}</td>
                            <td className="py-2.5 px-2 text-center font-mono text-slate-300">{s.drawn ?? 0}</td>
                            <td className="py-2.5 px-2 text-center font-mono text-slate-300">{s.lost ?? 0}</td>
                            <td className="py-2.5 px-2 text-center font-mono">
                              <span
                                className={
                                  (s.goalDifference ?? 0) > 0
                                    ? "text-emerald-400 font-bold"
                                    : (s.goalDifference ?? 0) < 0
                                    ? "text-red-400"
                                    : "text-slate-400"
                                }
                              >
                                {(s.goalDifference ?? 0) > 0 ? `+${s.goalDifference}` : s.goalDifference ?? 0}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-black text-yellow-400 text-sm">
                              {s.points ?? 0}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              {s.form && s.form !== "-" ? (
                                <div className="flex items-center justify-center gap-1">
                                  {s.form.split(",").slice(-3).map((res: string, fIdx: number) => (
                                    <span
                                      key={fIdx}
                                      className={`inline-block w-4 h-4 rounded text-[9px] font-black leading-4 text-center ${
                                        res === "W"
                                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                                          : res === "L"
                                          ? "bg-red-500/20 text-red-400 border border-red-500/40"
                                          : "bg-slate-800 text-slate-400 border border-slate-700"
                                      }`}
                                    >
                                      {res}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-[10px] text-slate-600">-</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function DashboardClient({
  player,
  user,
  activeMatch: initialActiveMatch,
  allPlayerMatches = [],
  announcements,
  recentMatches,
  standing,
  leagueConfig: initialLeagueConfig,
  divisionalMotd = {},
  div1Standings = [],
  div2Standings = [],
  div3Standings = [],
  uclGroupStandings = [],
  europaGroupStandings = [],
  uclSlots = [],
  europaSlots = [],
  uclQualified = [],
  europaQualified = [],
  initialReview = null,
  isRestDayToday = false,
  currentRoundName,
  opponentStanding = null,
  opponentPreviousMatches = [],
  uclGroupMotds = {},
  europaGroupMotds = {},
}: {
  player: any;
  user: any;
  activeMatch: any;
  allPlayerMatches?: any[];
  announcements: any[];
  recentMatches: any[];
  standing: any;
  leagueConfig?: any;
  divisionalMotd?: Record<string, any>;
  uclGroupMotds?: Record<string, any>;
  europaGroupMotds?: Record<string, any>;
  div1Standings?: any[];
  div2Standings?: any[];
  div3Standings?: any[];
  uclGroupStandings?: any[];
  europaGroupStandings?: any[];
  uclSlots?: any[];
  europaSlots?: any[];
  uclQualified?: any[];
  europaQualified?: any[];
  initialReview?: any;
  isRestDayToday?: boolean;
  currentRoundName?: string;
  opponentStanding?: any;
  opponentPreviousMatches?: any[];
}) {
  const router = useRouter();

  const [leagueConfig, setLeagueConfig] = useState(initialLeagueConfig);

  useEffect(() => {
    if (initialLeagueConfig) {
      setLeagueConfig(initialLeagueConfig);
    }
  }, [initialLeagueConfig]);

  const hasAutoOpenedUclRef = useRef(false);
  const hasAutoOpenedEuropaRef = useRef(false);

  // Live polling for draw broadcast triggers and leagueConfig changes
  useEffect(() => {
    let isMounted = true;
    const poll = async () => {
      try {
        const res = await fetch("/api/league/config", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (data.config && isMounted) {
          setLeagueConfig((prev: any) => {
            // Auto launch modal if UCL just started and draw incomplete
            if (data.config.uclStarted && !prev?.uclStarted && !data.config.uclDrawCompleted && !hasAutoOpenedUclRef.current) {
              hasAutoOpenedUclRef.current = true;
              setViewDrawModal("UCL");
            }
            // Auto launch modal if Europa just started and draw incomplete
            if (data.config.europaStarted && !prev?.europaStarted && !data.config.europaDrawCompleted && !hasAutoOpenedEuropaRef.current) {
              hasAutoOpenedEuropaRef.current = true;
              setViewDrawModal("EUROPA");
            }
            return { ...prev, ...data.config };
          });
        }
      } catch (e) {}
    };
    const interval = setInterval(poll, 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Targeted match state for result/forfeit modal (can be opened from Overview or directly from Calendar cards)
  const [actionMatch, setActionMatch] = useState<any>(null);

  // Check if player is on standby in reserve pool
  const isReserved = player.status === "RESERVED" || player?.status === "RESERVED";

  // Compute robust active match (strictly for participating players, NEVER for reserve pool or rest day players):
  // 1. If reserved or on rest day today, activeMatch is strictly null
  // 2. Initial server-provided active match
  // 3. Current matchday scheduled or live match from allPlayerMatches
  // 4. Earliest unplayed scheduled or live match
  // 5. Any match from current matchday (even if pending/finished so user sees score & proof)
  // 6. Most recent fixture
  const activeMatch = useMemo(() => {
    if (isReserved || isRestDayToday) return null;
    if (initialActiveMatch) return initialActiveMatch;
    if (!allPlayerMatches || allPlayerMatches.length === 0) return null;

    const currentRound = `Matchday ${leagueConfig?.currentMatchday || 1}`;
    const currentRoundMatch = allPlayerMatches.find(
      (m: any) => m.round === currentRound && (m.status === "SCHEDULED" || m.status === "LIVE")
    );
    if (currentRoundMatch) return currentRoundMatch;

    const nextUnplayed = allPlayerMatches.find(
      (m: any) => m.status === "SCHEDULED" || m.status === "LIVE"
    );
    if (nextUnplayed) return nextUnplayed;

    const anyCurrentRound = allPlayerMatches.find((m: any) => m.round === currentRound);
    if (anyCurrentRound) return anyCurrentRound;

    return allPlayerMatches[0] || null;
  }, [isReserved, initialActiveMatch, allPlayerMatches, leagueConfig?.currentMatchday]);

  // Dynamic user and player profile state
  const [currentPlayer, setCurrentPlayer] = useState(player);
  const [currentUser, setCurrentUser] = useState(user);

  // Player's active division MOTD
  const myDivMotd = divisionalMotd[player.division];

  // Dynamic current time ticker to ensure 24h auto-deletion updates live on page
  const [announcementNow, setAnnouncementNow] = useState<number>(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setAnnouncementNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  // Announcements strictly within 24 hours of publication
  const activeAnnouncements = useMemo(() => {
    const cutoff24h = announcementNow - 24 * 60 * 60 * 1000;
    return announcements.filter((a) => new Date(a.createdAt).getTime() > cutoff24h);
  }, [announcements, announcementNow]);

  // Announcement read tracking (interactive from localStorage)
  const [readAnnouncements, setReadAnnouncements] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const storageKey = `efrl_read_ann_${player.id}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setReadAnnouncements(new Set<string>(JSON.parse(saved)));
      }
    } catch (e) {
      console.error("Read receipt load error:", e);
    }
  }, [player.id]);

  const handleMarkAsRead = async (announcementId: string) => {
    try {
      const storageKey = `efrl_read_ann_${player.id}`;
      const updated = new Set(readAnnouncements);
      updated.add(announcementId);
      setReadAnnouncements(updated);
      localStorage.setItem(storageKey, JSON.stringify(Array.from(updated)));

      await fetch("/api/announcements/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ announcementId }),
      });
    } catch (e) {
      console.error("Failed to mark announcement as read:", e);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const storageKey = `efrl_read_ann_${player.id}`;
      const updated = new Set(readAnnouncements);
      activeAnnouncements.forEach((ann) => updated.add(ann.id));
      setReadAnnouncements(updated);
      localStorage.setItem(storageKey, JSON.stringify(Array.from(updated)));

      await Promise.all(
        activeAnnouncements.map((ann) =>
          fetch("/api/announcements/read", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ announcementId: ann.id }),
          }).catch(() => {})
        )
      );
    } catch (e) {
      console.error("Failed to mark all announcements as read:", e);
    }
  };

  // Profile Update State
  const [profileGamerTag, setProfileGamerTag] = useState(player.gamerTag || "");
  const [profileFullName, setProfileFullName] = useState(player.fullName || "");
  const [profileWhatsapp, setProfileWhatsapp] = useState(player.whatsapp || "");
  const [profileRealTeam, setProfileRealTeam] = useState(player.realTeam || "");
  const [profileEmail, setProfileEmail] = useState(user?.email || "");
  const [profilePassword, setProfilePassword] = useState("");
  const [profileConfirmPassword, setProfileConfirmPassword] = useState("");
  const [showProfilePassword, setShowProfilePassword] = useState(false);
  const [profileUpdating, setProfileUpdating] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState("");
  const [profileErrorMsg, setProfileErrorMsg] = useState("");

  // Claimed real teams tracking
  const [takenTeamsMap, setTakenTeamsMap] = useState<
    Record<string, { gamerTag: string; division: string; playerId: string }>
  >({});

  useEffect(() => {
    fetch("/api/teams/taken")
      .then((res) => res.json())
      .then((data) => {
        if (data.takenTeams) {
          setTakenTeamsMap(data.takenTeams);
        }
      })
      .catch((e) => console.error("Failed to load taken teams", e));
  }, []);

  const isTeamClaimedByOther = (teamName: string) => {
    const norm = teamName.trim().toLowerCase();
    const fromApi = takenTeamsMap[norm];
    if (fromApi && fromApi.playerId !== currentPlayer.id) {
      return fromApi.gamerTag;
    }
    const foundClub = findTeam(teamName);
    if (foundClub) {
      const fromShort = takenTeamsMap[foundClub.shortName.toLowerCase()];
      if (fromShort && fromShort.playerId !== currentPlayer.id) {
        return fromShort.gamerTag;
      }
      const fromId = takenTeamsMap[foundClub.id.toLowerCase()];
      if (fromId && fromId.playerId !== currentPlayer.id) {
        return fromId.gamerTag;
      }
      const fromName = takenTeamsMap[foundClub.name.toLowerCase()];
      if (fromName && fromName.playerId !== currentPlayer.id) {
        return fromName.gamerTag;
      }
    }
    const allStandings = [
      ...(div1Standings || []),
      ...(div2Standings || []),
      ...(div3Standings || []),
    ];
    const match = allStandings.find(
      (s: any) =>
        s.player?.id !== currentPlayer.id &&
        s.player?.realTeam &&
        (s.player.realTeam.trim().toLowerCase() === norm ||
         (foundClub && findTeam(s.player.realTeam)?.name.toLowerCase() === foundClub.name.toLowerCase()))
    );
    if (match) {
      return match.player.gamerTag;
    }
    return null;
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileUpdating(true);
    setProfileSuccessMsg("");
    setProfileErrorMsg("");

    if (profilePassword && profilePassword.length < 6) {
      setProfileErrorMsg("New password must be at least 6 characters.");
      setProfileUpdating(false);
      return;
    }

    if (profilePassword && profilePassword !== profileConfirmPassword) {
      setProfileErrorMsg("New password and confirmation do not match.");
      setProfileUpdating(false);
      return;
    }

    try {
      const res = await fetch("/api/player/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: profileEmail,
          gamerTag: profileGamerTag,
          fullName: profileFullName,
          whatsapp: profileWhatsapp,
          realTeam: profileRealTeam,
          password: profilePassword || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update profile");

      setProfileSuccessMsg(data.message || "Profile updated successfully!");
      setProfilePassword("");
      setProfileConfirmPassword("");

      if (data.player) {
        setCurrentPlayer(data.player);
      }
      if (data.user) {
        setCurrentUser(data.user);
        try {
          const stored = localStorage.getItem("efrl_user");
          if (stored) {
            const parsed = JSON.parse(stored);
            localStorage.setItem(
              "efrl_user",
              JSON.stringify({ ...parsed, email: data.user.email, player: data.player || parsed.player })
            );
          }
        } catch (err) {}
      }
      router.refresh();
    } catch (err: any) {
      setProfileErrorMsg(err.message || "Failed to update profile");
    } finally {
      setProfileUpdating(false);
    }
  };

  // 24-hour Countdown Timer State
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
  }>({ hours: 0, minutes: 0, seconds: 0, isExpired: false });

  // WhatsApp Copied state
  const [copied, setCopied] = useState(false);

  // Modals state
  const [showResultModal, setShowResultModal] = useState(false);
  const [showForfeitModal, setShowForfeitModal] = useState(false);
  const [showQuickGuide, setShowQuickGuide] = useState(false);
  const [showActionHub, setShowActionHub] = useState(false);
  const [viewDrawModal, setViewDrawModal] = useState<"UCL" | "EUROPA" | null>(null);

  // Continental Qualified Athletes memo
  const uclQualifiedAthletes = useMemo(() => {
    return (uclQualified || []).map((s: any) => ({
      id: s.player?.id || s.playerId,
      gamerTag: s.player?.gamerTag || "Unknown",
      fullName: s.player?.fullName || "",
      division: s.division || s.player?.division || "Division 1",
      realTeam: s.player?.realTeam,
      avatar: s.player?.avatar,
      overallRating: s.player?.overallRating || 85,
    }));
  }, [uclQualified]);

  const europaQualifiedAthletes = useMemo(() => {
    return (europaQualified || []).map((s: any) => ({
      id: s.player?.id || s.playerId,
      gamerTag: s.player?.gamerTag || "Unknown",
      fullName: s.player?.fullName || "",
      division: s.division || s.player?.division || "Division 2",
      realTeam: s.player?.realTeam,
      avatar: s.player?.avatar,
      overallRating: s.player?.overallRating || 82,
    }));
  }, [europaQualified]);

  // Scheduled Continental Draws Countdowns
  const [uclDrawCountdown, setUclDrawCountdown] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isDue: boolean;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, isDue: false });

  const [europaDrawCountdown, setEuropaDrawCountdown] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isDue: boolean;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, isDue: false });

  useEffect(() => {
    if (!leagueConfig?.uclDrawTime) return;
    const calc = () => {
      const target = new Date(leagueConfig.uclDrawTime).getTime();
      const diff = target - Date.now();
      if (diff <= 0) {
        setUclDrawCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0, isDue: true });
        if (!leagueConfig?.uclDrawCompleted && !hasAutoOpenedUclRef.current) {
          hasAutoOpenedUclRef.current = true;
          setViewDrawModal("UCL");
        }
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setUclDrawCountdown({ days, hours, minutes, seconds, isDue: false });
      }
    };
    calc();
    const interval = setInterval(calc, 1000);
    return () => clearInterval(interval);
  }, [leagueConfig?.uclDrawTime, leagueConfig?.uclDrawCompleted]);

  useEffect(() => {
    if (!leagueConfig?.europaDrawTime) return;
    const calc = () => {
      const target = new Date(leagueConfig.europaDrawTime).getTime();
      const diff = target - Date.now();
      if (diff <= 0) {
        setEuropaDrawCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0, isDue: true });
        if (!leagueConfig?.europaDrawCompleted && !hasAutoOpenedEuropaRef.current) {
          hasAutoOpenedEuropaRef.current = true;
          setViewDrawModal("EUROPA");
        }
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setEuropaDrawCountdown({ days, hours, minutes, seconds, isDue: false });
      }
    };
    calc();
    const interval = setInterval(calc, 1000);
    return () => clearInterval(interval);
  }, [leagueConfig?.europaDrawTime, leagueConfig?.europaDrawCompleted]);

  // Auto-launch Quick Guide Tutorial on registration or first visit
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const urlParams = new URLSearchParams(window.location.search);
        const isWelcome = urlParams.get("welcome") === "true";
        const pendingTutorial = localStorage.getItem("efrl_show_tutorial") === "true";

        if (isWelcome || pendingTutorial) {
          setShowQuickGuide(true);
          localStorage.removeItem("efrl_show_tutorial");
        }
      }
    } catch (e) {
      console.warn("Could not check tutorial status:", e);
    }
  }, []);

  // Result form state
  const [homeScore, setHomeScore] = useState<number | string>(0);
  const [awayScore, setAwayScore] = useState<number | string>(0);
  const [leg2HomeScore, setLeg2HomeScore] = useState<number | string>(0);
  const [leg2AwayScore, setLeg2AwayScore] = useState<number | string>(0);
  const [resultScreenshot, setResultScreenshot] = useState("");
  const [leg2ResultScreenshot, setLeg2ResultScreenshot] = useState("");
  const [resultNotes, setResultNotes] = useState("");
  const [uploadingLeg1, setUploadingLeg1] = useState(false);
  const [uploadingLeg2, setUploadingLeg2] = useState(false);
  const [submittingResult, setSubmittingResult] = useState(false);
  const [resultSuccessMsg, setResultSuccessMsg] = useState("");

  // Forfeit form state
  const [forfeitScreenshot, setForfeitScreenshot] = useState("");
  const [forfeitReason, setForfeitReason] = useState("");
  const [uploadingForfeit, setUploadingForfeit] = useState(false);
  const [submittingForfeit, setSubmittingForfeit] = useState(false);
  const [forfeitSuccessMsg, setForfeitSuccessMsg] = useState("");

  // Direct messaging to admin state
  const [inboxSubTab, setInboxSubTab] = useState<"ANNOUNCEMENTS" | "DIRECT_MESSAGES">("ANNOUNCEMENTS");
  const [playerMessages, setPlayerMessages] = useState<any[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [msgSubject, setMsgSubject] = useState("");
  const [msgContent, setMsgContent] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [msgSuccess, setMsgSuccess] = useState("");
  const [msgError, setMsgError] = useState("");

  const fetchPlayerMessages = async () => {
    setLoadingMessages(true);
    try {
      const res = await fetch("/api/messages");
      const data = await res.json();
      if (data.messages) {
        setPlayerMessages(data.messages);
      }
    } catch (err) {
      console.error("Failed to load messages", err);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    fetchPlayerMessages();
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgSubject.trim() || !msgContent.trim()) return;
    setSendingMessage(true);
    setMsgSuccess("");
    setMsgError("");
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: msgSubject.trim(), content: msgContent.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send message");
      setMsgSuccess(data.message || "Message sent to league commissioners!");
      setMsgSubject("");
      setMsgContent("");
      if (data.data) {
        setPlayerMessages((prev) => [data.data, ...prev]);
      }
    } catch (err: any) {
      setMsgError(err.message || "Failed to send message");
    } finally {
      setSendingMessage(false);
    }
  };

  // Active tab: Reserve athletes are on STANDINGS by default and do not participate in match tabs
  type DashboardTab = "OVERVIEW" | "CALENDAR" | "INBOX" | "HISTORY" | "STANDINGS" | "PROFILE";
  const [activeTab, setActiveTab] = useState<DashboardTab>(
    isReserved ? "STANDINGS" : "OVERVIEW"
  );

  useEffect(() => {
    if (isReserved && (activeTab === "OVERVIEW" || activeTab === "CALENDAR" || activeTab === "HISTORY")) {
      setActiveTab("STANDINGS");
    }
  }, [isReserved, activeTab]);

  // Standings sub-category state: Domestic Divisions, UCL, Europa
  const [standingsCategory, setStandingsCategory] = useState<"DIVISIONS" | "UCL" | "EUROPA">("DIVISIONS");

  // Rating & Review State
  const [userRating, setUserRating] = useState<number>(initialReview?.rating || 5);
  const [reviewCategory, setReviewCategory] = useState<string>(initialReview?.category || "GENERAL");
  const [reviewComment, setReviewComment] = useState<string>(initialReview?.comment || "");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState("");
  const [reviewErrorMsg, setReviewErrorMsg] = useState("");
  const [activeReview, setActiveReview] = useState<any>(initialReview);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingReview(true);
    setReviewSuccessMsg("");
    setReviewErrorMsg("");
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: userRating,
          category: reviewCategory,
          comment: reviewComment.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit review");
      setReviewSuccessMsg(data.message || "Thank you for your rating & feedback!");
      if (data.review) {
        setActiveReview(data.review);
      }
    } catch (err: any) {
      setReviewErrorMsg(err.message || "Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  };

  // Unread announcements count (based on active 24h announcements)
  const unreadAnnouncementsCount = activeAnnouncements.filter((a) => !readAnnouncements.has(a.id)).length;

  // Determine opponent
  const isHomePlayer = activeMatch?.homePlayerId === player.id;
  const opponent = isHomePlayer ? activeMatch?.awayPlayer : activeMatch?.homePlayer;

  // Countdown timer calculation
  useEffect(() => {
    if (!activeMatch?.deadlineDate) return;

    const calculateTime = () => {
      const deadline = new Date(activeMatch.deadlineDate).getTime();
      const now = new Date().getTime();
      const diff = deadline - now;

      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, isExpired: true });
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft({ hours, minutes, seconds, isExpired: false });
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [activeMatch?.deadlineDate]);

  // Check if admin granted late submission or reopened submission permission
  const isAdminPermissionGranted = Boolean(
    activeMatch &&
    (activeMatch.allowLateSubmission ||
     activeMatch.notes?.includes("ADMIN_REOPENED") ||
     activeMatch.notes?.includes("REOPEN"))
  );

  // Check if active match options are locked
  const isMatchLocked = Boolean(
    activeMatch &&
    (timeLeft.isExpired || activeMatch.status === "FORFEIT" || activeMatch.status === "FINISHED") &&
    !isAdminPermissionGranted
  );

  // Linked submission & forfeit status for this match (shared between both athletes)
  const sharedSubmission =
    activeMatch?.submissions?.find((s: any) => s.status !== "REJECTED" && s.status !== "REPLACED") ||
    activeMatch?.submissions?.[0] ||
    null;
  const hasSubmittedResult = Boolean(sharedSubmission && sharedSubmission.status !== "REPLACED");
  const isSubmissionPending = sharedSubmission?.status === "PENDING";
  const isSubmissionApproved =
    sharedSubmission?.status === "APPROVED" || activeMatch?.status === "FINISHED";

  const sharedForfeit =
    activeMatch?.forfeitClaims?.find((f: any) => f.status !== "REJECTED") ||
    activeMatch?.forfeitClaims?.[0] ||
    null;
  const hasClaimedForfeit = Boolean(sharedForfeit);

  const submitterGamerTag =
    sharedSubmission?.submittedByPlayer?.gamerTag ||
    (sharedSubmission?.submittedByPlayerId === player.id
      ? player.gamerTag
      : opponent?.gamerTag || "Opponent");
  const isMySubmission = sharedSubmission?.submittedByPlayerId === player.id;

  const claimantGamerTag =
    sharedForfeit?.claimantPlayer?.gamerTag ||
    (sharedForfeit?.claimantPlayerId === player.id
      ? player.gamerTag
      : opponent?.gamerTag || "Opponent");
  const isMyClaim = sharedForfeit?.claimantPlayerId === player.id;

  // Is uploading closed for both players?
  const isUploadClosedForBoth = Boolean(
    !isAdminPermissionGranted && (isMatchLocked || hasSubmittedResult || hasClaimedForfeit || timeLeft.isExpired)
  );

  const isOneHourWarning = Boolean(
    activeMatch &&
    !isMatchLocked &&
    !timeLeft.isExpired &&
    timeLeft.hours === 0 &&
    !hasSubmittedResult &&
    !hasClaimedForfeit
  );

  // Autonomous 1-Hour Reminder Pulse:
  // When active match has < 1 hr remaining and neither player has submitted,
  // automatically trigger system endpoint so both athletes receive individual reminder notifications.
  useEffect(() => {
    if (isOneHourWarning) {
      fetch("/api/cron/reminders", { method: "POST" }).catch(() => {});
    }
  }, [isOneHourWarning, timeLeft.minutes]);

  // Periodic system reminder pulse (every 2 minutes while active in portal)
  useEffect(() => {
    const pulseTimer = setInterval(() => {
      fetch("/api/cron/reminders", { method: "POST" }).catch(() => {});
    }, 2 * 60 * 1000);
    return () => clearInterval(pulseTimer);
  }, []);

  // Copy WhatsApp Number helper
  const handleCopyWhatsApp = (num: string) => {
    navigator.clipboard.writeText(num);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Upload Screenshot directly to Cloudflare R2
  const handleR2ScreenshotUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (s: string) => void,
    setLoading?: (b: boolean) => void,
    folder: string = "results"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show immediate local preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setter(reader.result as string);
    };
    reader.readAsDataURL(file);

    if (setLoading) setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to upload file to Cloudflare R2 storage");
      }

      if (data.url) {
        setter(data.url);
      }
    } catch (err: any) {
      console.warn("R2 upload fallback notice:", err);
    } finally {
      if (setLoading) setLoading(false);
    }
  };

  // Convert File to Base64 Image (Fallback)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (s: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setter(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Result Submission
  const handleSubmitResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadingLeg1 || uploadingLeg2) {
      alert("Screenshot is currently uploading to Cloudflare R2 storage. Please wait a few seconds.");
      return;
    }

    setSubmittingResult(true);
    setResultSuccessMsg("");

    const targetMatch = actionMatch || activeMatch;
    if (!targetMatch) {
      alert("No match selected for result submission.");
      setSubmittingResult(false);
      return;
    }

    const isTwoLegged =
      targetMatch?.stage === "GROUP" ||
      targetMatch?.stage === "QUARTER_FINAL" ||
      targetMatch?.stage === "SEMI_FINAL";

    try {
      const payload: any = {
        matchId: targetMatch.id,
        homeScore: Number(homeScore),
        awayScore: Number(awayScore),
        screenshotUrl: resultScreenshot,
        notes: resultNotes,
      };

      if (isTwoLegged) {
        payload.leg2HomeScore = Number(leg2HomeScore);
        payload.leg2AwayScore = Number(leg2AwayScore);
        payload.leg2ScreenshotUrl = leg2ResultScreenshot;
        payload.aggregateHomeScore = Number(homeScore) + Number(leg2HomeScore);
        payload.aggregateAwayScore = Number(awayScore) + Number(leg2AwayScore);
      }

      const res = await fetch("/api/submissions/result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit result");

      setResultSuccessMsg(data.message);
      setTimeout(() => {
        setShowResultModal(false);
        setActionMatch(null);
        router.refresh();
      }, 1500);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmittingResult(false);
    }
  };

  // Handle Forfeit Submission
  const handleSubmitForfeit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadingForfeit) {
      alert("Proof screenshot is currently uploading to Cloudflare R2 storage. Please wait a few seconds.");
      return;
    }

    setSubmittingForfeit(true);
    setForfeitSuccessMsg("");

    const targetMatch = actionMatch || activeMatch;
    if (!targetMatch) {
      alert("No match selected for forfeit claim.");
      setSubmittingForfeit(false);
      return;
    }

    try {
      const res = await fetch("/api/submissions/forfeit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId: targetMatch.id,
          proofScreenshotUrl: forfeitScreenshot,
          reason: forfeitReason,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit forfeit claim");

      setForfeitSuccessMsg(data.message);
      setTimeout(() => {
        setShowForfeitModal(false);
        setActionMatch(null);
        router.refresh();
      }, 1500);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmittingForfeit(false);
    }
  };

  const handleLogout = async () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("efrl_user");
    }
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/?loggedOut=player");
    router.refresh();
  };

  const cleanWhatsapp = opponent?.whatsapp?.replace(/[^0-9]/g, "") || "";

  if (player.status === "PENDING_APPROVAL") {
    return (
      <div className="mx-auto max-w-4xl space-y-8 py-6">
        <div className="rounded-3xl border border-amber-500/40 bg-gradient-to-br from-amber-950/30 via-slate-950 to-slate-950 p-6 sm:p-10 shadow-2xl backdrop-blur-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <div className="flex h-13 w-13 sm:h-16 sm:w-16 shrink-0 items-center justify-center rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 font-black text-xl sm:text-2xl shadow-lg">
                {player.gamerTag.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white truncate max-w-full">{player.gamerTag}</h1>
                  <Badge variant="yellow" className="text-[10px] sm:text-xs">PENDING APPROVAL</Badge>
                </div>
                <p className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <span>Requested Division: <strong className="text-white">{player.division}</strong></span>
                  <span className="hidden xs:inline">•</span>
                  <span>WA: <span className="text-emerald-400 font-mono">{player.whatsapp}</span></span>
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout} className="text-xs gap-2 shrink-0 self-start sm:self-auto">
              <LogOut className="h-4 w-4" /> Sign Out
            </Button>
          </div>

          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 space-y-3">
            <div className="flex items-center gap-3 text-amber-400">
              <ShieldAlert className="h-6 w-6 shrink-0" />
              <h3 className="text-lg font-black uppercase">Registration Under League Review</h3>
            </div>
            <p className="text-sm text-slate-200 leading-relaxed">
              Welcome, <strong className="text-white">{player.gamerTag}</strong>! Your athlete profile has been received.
              The League Commissioner will review your account to either approve your placement in <strong>{player.division}</strong> or assign you to the official <strong>Standby Reserve Pool</strong>.
            </p>
            <p className="text-xs text-slate-400">
              Matchday fixtures, scheduling, and table standings will become active once your registration is officially placed by an administrator.
            </p>
          </div>

          {/* External Links */}
          <div className="rounded-2xl border border-slate-800 bg-[#080d1e]/80 p-5 space-y-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Official Community & League Resources (Open Access)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <a
                href="https://discord.gg/rbaFrBB5p"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-xs text-slate-300 font-semibold flex items-center justify-between transition-all hover:text-white"
              >
                <span>Official Discord Community</span>
                <ExternalLink className="h-4 w-4 text-cyan-400" />
              </a>
              <a
                href="https://www.instagram.com/efootball_rwanda1/?utm_source=ig_web_button_share_sheet&stkn=ZDNlZDc0MzIxNw%3D%3D"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-pink-500/40 text-xs text-slate-300 font-semibold flex items-center justify-between transition-all hover:text-white"
              >
                <span>Official Instagram</span>
                <ExternalLink className="h-4 w-4 text-pink-400" />
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Welcome Bar */}
      <div className="rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 p-4 sm:p-6 md:p-8 backdrop-blur-xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-5 sm:gap-6">
        <div className="flex items-center gap-3 sm:gap-5 min-w-0">
          <div className="flex h-14 w-14 sm:h-16 sm:w-16 md:h-20 md:w-20 shrink-0 aspect-square items-center justify-center rounded-2xl sm:rounded-3xl bg-gradient-to-br from-slate-900 to-slate-950 border-2 border-slate-700/80 p-1.5 sm:p-2 shadow-2xl overflow-hidden">
            {currentPlayer.avatar || resolvePlayerAvatar(currentPlayer) ? (
              <img
                src={currentPlayer.avatar || resolvePlayerAvatar(currentPlayer)}
                alt={currentPlayer.realTeam || currentPlayer.gamerTag}
                className="h-full w-full object-contain"
                loading="lazy"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(currentPlayer.gamerTag || "player")}`;
                }}
              />
            ) : (
              <span className="font-black text-xl sm:text-2xl md:text-3xl text-yellow-400">
                {currentPlayer.gamerTag.slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight truncate max-w-full">
                {currentPlayer.gamerTag}
              </h1>
              {currentPlayer.realTeam && (
                <Badge variant="outline" className="text-[10px] sm:text-xs border-sky-500/40 text-sky-400 bg-sky-950/20">
                  {currentPlayer.realTeam}
                </Badge>
              )}
              <Badge variant={isReserved ? "outline" : "yellow"} className="text-[10px] sm:text-xs">
                {isReserved ? "RESERVE POOL" : currentPlayer.division}
              </Badge>
              <Badge variant="default" className="text-[9px] sm:text-[10px] uppercase font-mono">
                {currentPlayer.platform}
              </Badge>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span className="truncate max-w-[160px] sm:max-w-none">{currentPlayer.fullName}</span>
              <span className="hidden xs:inline">•</span>
              <span className="font-mono text-slate-500">ID: {currentPlayer.efootballId}</span>
              <span className="hidden xs:inline">•</span>
              <span className="text-emerald-400 font-mono">WA: {currentPlayer.whatsapp}</span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between md:justify-end gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-800/80">
          <div className="text-left md:text-right">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">Status / Rank</span>
            <span className="text-lg sm:text-xl font-black text-yellow-400">
              {isReserved ? "STANDBY" : standing ? `#${standing.rank}` : "Unranked"}
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2 text-xs">
            <LogOut className="h-4 w-4 text-slate-400" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Reserve Athlete Status Banner */}
      {isReserved && (
        <div className="rounded-2xl border border-cyan-500/30 bg-cyan-950/20 p-5 space-y-2">
          <div className="flex items-center gap-2 text-cyan-400">
            <Sparkles className="h-5 w-5 shrink-0" />
            <h3 className="text-sm font-black uppercase tracking-wider">Official Reserve Athlete (Standby Roster)</h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            You are registered in the official League Reserve Pool on standby. Generated match fixtures and daily 24-hr schedules are available exclusively to active athletes participating in Division 1, 2, and 3. As soon as an active roster slot opens and the League Commissioner promotes you into a division, your season match calendar and live 24-hr match controls will become active. You can explore all division tables, continental standings, and league announcements below.
          </p>
        </div>
      )}

      {/* Navigation Tabs - Mobile Horizontally Scrollable */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto no-scrollbar scroll-smooth -mx-4 px-4 sm:mx-0 sm:px-0">
        {!isReserved && (
          <>
            <button
              onClick={() => setActiveTab("OVERVIEW")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 min-h-[40px] ${
                activeTab === "OVERVIEW"
                  ? "bg-sky-500 text-white shadow-lg shadow-sky-500/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              <Smartphone className="h-4 w-4" />
              <span>Today's 24-Hr Match</span>
              {isRestDayToday ? (
                <span className="px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-[10px] font-bold text-cyan-300 border border-cyan-500/40">
                  Rest Day
                </span>
              ) : activeMatch ? (
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              ) : null}
            </button>

            <button
              onClick={() => setActiveTab("CALENDAR")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 min-h-[40px] ${
                activeTab === "CALENDAR"
                  ? "bg-cyan-500 text-slate-950 font-black shadow-lg shadow-cyan-500/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              <Calendar className="h-4 w-4" />
              <span>Match Calendar</span>
              {allPlayerMatches.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-slate-800 text-[10px] font-mono text-cyan-300">
                  {allPlayerMatches.length}
                </span>
              )}
            </button>
          </>
        )}

        <button
          onClick={() => setActiveTab("STANDINGS")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 min-h-[40px] ${
            activeTab === "STANDINGS"
              ? "bg-sky-500 text-white shadow-lg shadow-sky-500/30"
              : "text-slate-400 hover:text-white hover:bg-slate-900"
          }`}
        >
          <Trophy className="h-4 w-4" />
          <span>All Division Tables</span>
        </button>

        <button
          onClick={() => setActiveTab("INBOX")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 min-h-[40px] ${
            activeTab === "INBOX"
              ? "bg-sky-500 text-white shadow-lg shadow-sky-500/30"
              : "text-slate-400 hover:text-white hover:bg-slate-900"
          }`}
        >
          <Bell className="h-4 w-4" />
          <span>Announcements & Inbox</span>
          {unreadAnnouncementsCount > 0 && (
            <span className="h-4 w-4 rounded-full bg-yellow-400 text-slate-950 text-[10px] font-black flex items-center justify-center animate-pulse">
              {unreadAnnouncementsCount}
            </span>
          )}
        </button>

        {!isReserved && (
          <button
            onClick={() => setActiveTab("HISTORY")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 min-h-[40px] ${
              activeTab === "HISTORY"
                ? "bg-sky-500 text-white shadow-lg shadow-sky-500/30"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <Trophy className="h-4 w-4" />
            <span>Match History & Proof</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab("PROFILE")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 min-h-[40px] ${
            activeTab === "PROFILE"
              ? "bg-sky-500 text-white shadow-lg shadow-sky-500/30"
              : "text-slate-400 hover:text-white hover:bg-slate-900"
          }`}
        >
          <User className="h-4 w-4" />
          <span>Profile & Settings</span>
        </button>
      </div>

      {/* TAB: STANDINGS (AVAILABLE TO BOTH ACTIVE AND RESERVE ATHLETES) */}
      {activeTab === "STANDINGS" && (
        <div className="space-y-6">
          {/* Header Card with Continental Switcher */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="yellow">OFFICIAL TOURNAMENT TABLES</Badge>
                <span className="text-xs font-bold text-sky-400 uppercase tracking-widest">
                  Live Esports Rankings
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black uppercase text-white flex items-center gap-2">
                <Trophy className="h-6 w-6 text-yellow-400" />
                <span>eFootball League & Continental Standings</span>
              </h3>
              <p className="text-xs text-slate-400">
                Live rankings across 3 Domestic Divisions, eFootball UCL, and Europa League groups.
              </p>
            </div>

            {/* Direct Tournament Center Link */}
            <Link
              href="/continental"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all shrink-0"
            >
              <Trophy className="h-4 w-4" />
              <span>Continental Cup Center</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Category Switcher Tabs: Divisions, UCL, Europa */}
          <div className="flex items-center gap-2 bg-[#080d1a] p-1.5 rounded-2xl border border-slate-800 w-full sm:w-fit overflow-x-auto no-scrollbar scroll-smooth">
            <button
              type="button"
              onClick={() => setStandingsCategory("DIVISIONS")}
              className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider transition-all shrink-0 whitespace-nowrap ${
                standingsCategory === "DIVISIONS"
                  ? "bg-cyan-500 text-slate-950 font-black shadow-lg shadow-cyan-500/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <Trophy className="h-4 w-4" />
              <span>3 Domestic Divisions</span>
            </button>

            <button
              type="button"
              onClick={() => setStandingsCategory("UCL")}
              className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider transition-all shrink-0 whitespace-nowrap ${
                standingsCategory === "UCL"
                  ? "bg-indigo-600 text-white font-black shadow-lg shadow-indigo-600/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <Star className="h-4 w-4 text-indigo-300" />
              <span>eFootball UCL Groups</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-slate-900 text-indigo-300 border border-indigo-500/30">
                16 Players
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStandingsCategory("EUROPA")}
              className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider transition-all shrink-0 whitespace-nowrap ${
                standingsCategory === "EUROPA"
                  ? "bg-amber-600 text-white font-black shadow-lg shadow-amber-600/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <Flame className="h-4 w-4 text-amber-300" />
              <span>eFootball Europa Groups</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-slate-900 text-amber-300 border border-amber-500/30">
                16 Players
              </span>
            </button>
          </div>

          {/* VIEW 1: DOMESTIC 3 DIVISIONS */}
          {standingsCategory === "DIVISIONS" && (
            <HomeDivisionsTabs
              div1Standings={div1Standings}
              div2Standings={div2Standings}
              div3Standings={div3Standings}
              defaultDivision={
                currentPlayer.division === "Division 2" || currentPlayer.division === "Division 3"
                  ? (currentPlayer.division as "Division 2" | "Division 3")
                  : "Division 1"
              }
            />
          )}

          {/* VIEW 2 & 3: CONTINENTAL GROUP STANDINGS (UCL & EUROPA) */}
          {(standingsCategory === "UCL" || standingsCategory === "EUROPA") && (
            <ContinentalGroupStandingsView
              competition={standingsCategory}
              standings={standingsCategory === "UCL" ? uclGroupStandings : europaGroupStandings}
              slots={standingsCategory === "UCL" ? uclSlots : europaSlots}
              currentPlayerId={currentPlayer.id}
              isStarted={
                standingsCategory === "UCL"
                  ? Boolean(leagueConfig?.uclStarted)
                  : Boolean(leagueConfig?.europaStarted)
              }
              onWatchDraw={() => setViewDrawModal(standingsCategory)}
            />
          )}
        </div>
      )}

      {/* TAB 1: OVERVIEW & ACTIVE 24-HOUR MATCH */}
      {!isReserved && activeTab === "OVERVIEW" && (
        <div className="space-y-8">
          {/* CONTINENTAL DRAWS BROADCAST & SCHEDULE BANNER */}
          {Boolean(leagueConfig?.uclDrawTime || leagueConfig?.uclStarted || leagueConfig?.europaDrawTime || leagueConfig?.europaStarted) && (
            <div className={`grid grid-cols-1 ${
              (leagueConfig?.uclDrawTime || leagueConfig?.uclStarted) && (leagueConfig?.europaDrawTime || leagueConfig?.europaStarted)
                ? "md:grid-cols-2"
                : ""
            } gap-4`}>
              {/* UCL DRAW BANNER */}
              {(leagueConfig?.uclDrawTime || leagueConfig?.uclStarted) && (
                <div className="rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/40 via-slate-950 to-slate-900 p-5 relative overflow-hidden shadow-xl">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                        <Star className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-300">
                          Tier 1 Continental
                        </span>
                        <h3 className="text-sm font-black text-white uppercase">
                          UCL Group Stage Draw
                        </h3>
                      </div>
                    </div>
                    {leagueConfig?.uclDrawCompleted ? (
                      <Badge variant="green" className="text-[9px] font-black uppercase">
                        DRAW COMPLETED
                      </Badge>
                    ) : (leagueConfig?.uclStarted || uclDrawCountdown.isDue) ? (
                      <Badge variant="live" className="text-[9px] font-black uppercase animate-pulse">
                        🔴 LIVE DRAW IN PROGRESS
                      </Badge>
                    ) : leagueConfig?.uclDrawTime ? (
                      <Badge variant="yellow" className="text-[9px] font-black uppercase">
                        🗓️ SCHEDULED
                      </Badge>
                    ) : (
                      <Badge variant="default" className="text-[9px] font-black uppercase">
                        UPCOMING
                      </Badge>
                    )}
                  </div>

                  {/* Schedule time & countdown */}
                  <div className="rounded-2xl bg-slate-950/70 border border-indigo-500/20 p-3 mb-4 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-medium flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-indigo-400" />
                        <span>Scheduled Time:</span>
                      </span>
                      <span className="font-bold text-white font-mono text-[11px]">
                        {leagueConfig?.uclDrawTime
                          ? `${new Date(leagueConfig.uclDrawTime).toLocaleDateString()} at ${new Date(leagueConfig.uclDrawTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                          : "Awaiting Schedule"}
                      </span>
                    </div>

                    {leagueConfig?.uclDrawTime && !leagueConfig?.uclDrawCompleted && (
                      <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-xs">
                        <span className="text-slate-400 font-medium">Draw Countdown:</span>
                        {uclDrawCountdown.isDue ? (
                          <span className="text-xs font-black text-emerald-400 animate-pulse">
                            Event Time Arrived!
                          </span>
                        ) : (
                          <span className="font-mono font-black text-indigo-400 text-xs">
                            {uclDrawCountdown.days > 0 && `${uclDrawCountdown.days}d `}
                            {String(uclDrawCountdown.hours).padStart(2, "0")}h : {String(uclDrawCountdown.minutes).padStart(2, "0")}m : {String(uclDrawCountdown.seconds).padStart(2, "0")}s
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[11px] text-slate-400">
                      16 Qualified Athletes • Groups A-D
                    </span>
                    {(() => {
                      const isUclLive = Boolean(leagueConfig?.uclStarted || uclDrawCountdown.isDue);
                      return (
                        <Button
                          type="button"
                          onClick={() => isUclLive && setViewDrawModal("UCL")}
                          disabled={!isUclLive}
                          className={`font-black text-xs gap-1.5 py-2 px-3.5 rounded-xl shadow-lg transition-all ${
                            !isUclLive
                              ? "opacity-50 cursor-not-allowed bg-slate-900 border border-slate-800 text-slate-400"
                              : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30"
                          }`}
                        >
                          {!isUclLive ? (
                            <>
                              <Lock className="h-3.5 w-3.5" />
                              <span>Draw Locked (Awaiting Launch)</span>
                            </>
                          ) : (
                            <>
                              <Play className="h-3.5 w-3.5 fill-current" />
                              <span>
                                {leagueConfig?.uclDrawCompleted ? "Watch Draw Event" : "Watch Live Draw"}
                              </span>
                            </>
                          )}
                        </Button>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* EUROPA DRAW BANNER */}
              {(leagueConfig?.europaDrawTime || leagueConfig?.europaStarted) && (
                <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-950/40 via-slate-950 to-slate-900 p-5 relative overflow-hidden shadow-xl">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        <Flame className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-300">
                          Tier 2 Continental
                        </span>
                        <h3 className="text-sm font-black text-white uppercase">
                          Europa League Draw
                        </h3>
                      </div>
                    </div>
                    {leagueConfig?.europaDrawCompleted ? (
                      <Badge variant="green" className="text-[9px] font-black uppercase">
                        DRAW COMPLETED
                      </Badge>
                    ) : (leagueConfig?.europaStarted || europaDrawCountdown.isDue) ? (
                      <Badge variant="live" className="text-[9px] font-black uppercase animate-pulse">
                        🔴 LIVE DRAW IN PROGRESS
                      </Badge>
                    ) : leagueConfig?.europaDrawTime ? (
                      <Badge variant="yellow" className="text-[9px] font-black uppercase">
                        🗓️ SCHEDULED
                      </Badge>
                    ) : (
                      <Badge variant="default" className="text-[9px] font-black uppercase">
                        UPCOMING
                      </Badge>
                    )}
                  </div>

                  {/* Schedule time & countdown */}
                  <div className="rounded-2xl bg-slate-950/70 border border-amber-500/20 p-3 mb-4 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-medium flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-amber-400" />
                        <span>Scheduled Time:</span>
                      </span>
                      <span className="font-bold text-white font-mono text-[11px]">
                        {leagueConfig?.europaDrawTime
                          ? `${new Date(leagueConfig.europaDrawTime).toLocaleDateString()} at ${new Date(leagueConfig.europaDrawTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                          : "Awaiting Schedule"}
                      </span>
                    </div>

                    {leagueConfig?.europaDrawTime && !leagueConfig?.europaDrawCompleted && (
                      <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-xs">
                        <span className="text-slate-400 font-medium">Draw Countdown:</span>
                        {europaDrawCountdown.isDue ? (
                          <span className="text-xs font-black text-emerald-400 animate-pulse">
                            Event Time Arrived!
                          </span>
                        ) : (
                          <span className="font-mono font-black text-amber-400 text-xs">
                            {europaDrawCountdown.days > 0 && `${europaDrawCountdown.days}d `}
                            {String(europaDrawCountdown.hours).padStart(2, "0")}h : {String(europaDrawCountdown.minutes).padStart(2, "0")}m : {String(europaDrawCountdown.seconds).padStart(2, "0")}s
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[11px] text-slate-400">
                      16 Qualified Athletes • Groups A-D
                    </span>
                    {(() => {
                      const isEuropaLive = Boolean(leagueConfig?.europaStarted || europaDrawCountdown.isDue);
                      return (
                        <Button
                          type="button"
                          onClick={() => isEuropaLive && setViewDrawModal("EUROPA")}
                          disabled={!isEuropaLive}
                          className={`font-black text-xs gap-1.5 py-2 px-3.5 rounded-xl shadow-lg transition-all ${
                            !isEuropaLive
                              ? "opacity-50 cursor-not-allowed bg-slate-900 border border-slate-800 text-slate-400"
                              : "bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30"
                          }`}
                        >
                          {!isEuropaLive ? (
                            <>
                              <Lock className="h-3.5 w-3.5" />
                              <span>Draw Locked (Awaiting Launch)</span>
                            </>
                          ) : (
                            <>
                              <Play className="h-3.5 w-3.5 fill-current" />
                              <span>
                                {leagueConfig?.europaDrawCompleted ? "Watch Draw Event" : "Watch Live Draw"}
                              </span>
                            </>
                          )}
                        </Button>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeMatch ? (
            <div className="rounded-3xl border-2 border-sky-500/40 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
              {/* Background ambient lighting */}
              <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* Match Header with Live 24-Hour Timer */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5 mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="yellow">{activeMatch.round}</Badge>
                    {activeMatch.isMatchOfTheDay && (
                      <Badge variant="yellow" className="text-[10px] font-black uppercase tracking-wider bg-yellow-500/20 border-yellow-500/40 text-yellow-400 animate-pulse">
                        🌟 MATCH OF THE DAY
                      </Badge>
                    )}
                    <Badge variant="live" className="text-[10px] uppercase">
                      24-HR WINDOW ACTIVE
                    </Badge>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white uppercase">
                    Today's Official League Match
                  </h2>
                </div>

                {/* 24-Hour Countdown Clock */}
                <div className="rounded-2xl border border-sky-500/40 bg-slate-950/80 p-3 sm:px-5 text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block flex items-center gap-1.5 justify-end">
                    <Clock className="h-3 w-3 text-yellow-400" />
                    Time Remaining (12:00 AM Reset)
                  </span>
                  {timeLeft.isExpired ? (
                    <span className="text-sm sm:text-base font-black text-red-400 animate-pulse">
                      Window Closed (Expired)
                    </span>
                  ) : (
                    <div className="font-mono text-xl sm:text-2xl font-black text-yellow-400 flex items-center gap-1 justify-end">
                      <span>{String(timeLeft.hours).padStart(2, "0")}h</span>
                      <span>:</span>
                      <span>{String(timeLeft.minutes).padStart(2, "0")}m</span>
                      <span>:</span>
                      <span>{String(timeLeft.seconds).padStart(2, "0")}s</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Opponent & Match Coordination Card */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center py-4">
                {/* Your Profile */}
                <div className="lg:col-span-4 rounded-2xl bg-slate-950/70 border border-slate-800 p-4 sm:p-5 text-center sm:text-left">
                  <span className="text-[10px] font-black uppercase tracking-widest text-sky-400 block mb-2">
                    {isHomePlayer ? "HOME ATHLETE (YOU)" : "AWAY ATHLETE (YOU)"}
                  </span>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-2xl bg-slate-900 border border-slate-700/80 p-1 flex items-center justify-center shrink-0 aspect-square overflow-hidden shadow-inner">
                      <img
                        src={resolvePlayerAvatar(player)}
                        alt={player.realTeam || player.gamerTag || "Team Crest"}
                        className="w-full h-full object-contain"
                        loading="lazy"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(player.gamerTag || "player")}`;
                        }}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg sm:text-xl font-black text-white truncate">{player.gamerTag}</h3>
                      {player.realTeam && (
                        <div className="inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold truncate max-w-full">
                          <span className="truncate">{findTeam(player.realTeam)?.name || player.realTeam}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 mt-2 truncate">{player.fullName}</p>
                  <span className="font-mono text-xs text-slate-500 block mt-1 truncate">
                    Konami ID: {player.efootballId}
                  </span>
                </div>

                {/* VS Badge */}
                <div className="lg:col-span-4 flex flex-col items-center justify-center text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800 border border-slate-700 font-black text-white text-sm shadow-inner mb-2">
                    VS
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {activeMatch.division} • 10 Mins Match
                  </span>
                </div>

                {/* Opponent Card with WhatsApp Connect */}
                <div className="lg:col-span-4 rounded-2xl bg-slate-950/90 border-2 border-emerald-500/40 p-4 sm:p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                      YOUR OPPONENT
                    </span>
                    <Badge variant="green" className="text-[10px]">
                      READY TO CHAT
                    </Badge>
                  </div>

                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-2xl bg-slate-900 border border-slate-700/80 p-1 flex items-center justify-center shrink-0 aspect-square overflow-hidden shadow-inner">
                      <img
                        src={resolvePlayerAvatar(opponent)}
                        alt={opponent?.realTeam || opponent?.gamerTag || "Opponent Crest"}
                        className="w-full h-full object-contain"
                        loading="lazy"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(opponent?.gamerTag || "opponent")}`;
                        }}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg sm:text-xl font-black text-white truncate">{opponent?.gamerTag || "Unknown Opponent"}</h3>
                      {opponent?.realTeam && (
                        <div className="inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold truncate max-w-full">
                          <span className="truncate">{findTeam(opponent.realTeam)?.name || opponent.realTeam}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 mt-2 truncate">{opponent?.fullName}</p>
                  <span className="font-mono text-xs text-slate-500 block mt-0.5 truncate">
                    Konami ID: {opponent?.efootballId}
                  </span>

                  {/* Opponent Group / Division Table Position */}
                  {opponentStanding && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[10px] font-bold text-slate-400">Position:</span>
                      <Badge variant="outline" className="text-[10px] font-mono font-bold text-sky-400 border-sky-500/30">
                        #{opponentStanding.rank || opponentStanding.position || 1} in {opponentStanding.division}
                      </Badge>
                    </div>
                  )}

                  {/* Opponent Last 3 Match Results Form */}
                  {opponentPreviousMatches && opponentPreviousMatches.length > 0 && (
                    <div className="pt-2 border-t border-slate-900 space-y-1">
                      <span className="text-[9px] font-mono uppercase text-slate-400 block font-bold">
                        Opponent Recent Form (Last {opponentPreviousMatches.length} Matches):
                      </span>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {opponentPreviousMatches.map((prevM: any) => {
                          const isOppHome = prevM.homePlayerId === opponent?.id;
                          const oppScore = isOppHome ? (prevM.homeScore ?? 0) : (prevM.awayScore ?? 0);
                          const rivalScore = isOppHome ? (prevM.awayScore ?? 0) : (prevM.homeScore ?? 0);
                          const rivalTag = isOppHome ? prevM.awayPlayer?.gamerTag : prevM.homePlayer?.gamerTag;
                          const won = oppScore > rivalScore;
                          const drew = oppScore === rivalScore;
                          return (
                            <span
                              key={prevM.id}
                              title={`vs @${rivalTag || "rival"} (${oppScore}-${rivalScore})`}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border ${
                                won
                                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                                  : drew
                                  ? "bg-slate-800 text-slate-300 border-slate-700"
                                  : "bg-red-500/20 text-red-400 border-red-500/40"
                              }`}
                            >
                              <span>{won ? "W" : drew ? "D" : "L"}</span>
                              <span className="text-[9px] opacity-80">{oppScore}-{rivalScore}</span>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Opponent WhatsApp Direct Chat */}
                  <div className="pt-2 border-t border-slate-900 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-medium">WhatsApp:</span>
                      <span className="font-mono font-bold text-emerald-400">
                        {opponent?.whatsapp}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <a
                        href={`https://wa.me/${cleanWhatsapp}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        Chat on WA
                      </a>

                      <button
                        type="button"
                        onClick={() => handleCopyWhatsApp(opponent?.whatsapp)}
                        className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-all"
                      >
                        {copied ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            Copy Number
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* AUTOMATED 1-HOUR DEADLINE WARNING BANNER FOR UNPLAYED MATCHES */}
              {isOneHourWarning && (
                <div className="mt-6 p-4 rounded-2xl border border-amber-500/60 bg-gradient-to-r from-amber-950/60 via-slate-900 to-amber-950/40 flex items-start gap-3.5 text-amber-200 shadow-xl shadow-amber-500/10 ring-1 ring-amber-500/30">
                  <div className="h-9 w-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 mt-0.5">
                    <AlertTriangle className="h-5 w-5 animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="destructive" className="text-[9px] font-black uppercase tracking-wider animate-pulse">
                        ⏰ 1-HOUR DEADLINE WARNING
                      </Badge>
                      <span className="text-xs font-mono font-bold text-white">
                        {timeLeft.minutes}m {timeLeft.seconds}s remaining before 12:00 AM cutoff
                      </span>
                    </div>
                    <p className="text-xs text-amber-100/90 leading-relaxed">
                      You have not uploaded a match result screenshot or submitted a forfeit claim. Message <strong className="text-white">@{opponent?.gamerTag}</strong> on WhatsApp right now to play. If your opponent is unreachable, submit your forfeit claim proof before the timer reaches 00:00:00!
                    </p>
                  </div>
                </div>
              )}

              {/* LATE DEADLINE EXTENDED NOTICE */}
              {activeMatch?.allowLateSubmission && (
                <div className="mt-4 p-4 rounded-2xl border border-emerald-500/50 bg-emerald-950/30 flex items-center gap-3 text-emerald-300">
                  <Unlock className="h-5 w-5 text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-black uppercase tracking-wider text-xs block text-emerald-200">
                      ⏰ Deadline Extended by Admin Office
                    </span>
                    <span className="text-[11px] text-slate-300">
                      The League Commissioner has granted a deadline extension for this match. You are permitted to upload your match score and screenshot proof.
                    </span>
                  </div>
                </div>
              )}

              {/* LINKED RESULT SUBMISSION STATUS CARD (CLOSED FOR BOTH) */}
              {hasSubmittedResult && (
                <div
                  className={`mt-6 p-5 sm:p-6 rounded-2xl border ${
                    isSubmissionApproved
                      ? "border-emerald-500/50 bg-emerald-950/30"
                      : "border-amber-500/50 bg-gradient-to-r from-amber-950/40 via-slate-900/90 to-slate-950/90 ring-1 ring-amber-500/30"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3 mb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {isSubmissionApproved ? (
                        <Badge variant="green" className="font-black text-xs uppercase gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          MATCH RESULT APPROVED & SAVED TO HISTORY
                        </Badge>
                      ) : (
                        <Badge variant="yellow" className="font-black text-xs uppercase gap-1 animate-pulse">
                          <Clock className="h-3.5 w-3.5" />
                          RESULT SUBMITTED — STATUS: PENDING ADMIN APPROVAL
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-[10px] text-slate-300 border-slate-700 font-bold">
                        Uploaded by: @{submitterGamerTag} {isMySubmission ? "(You)" : "(Opponent)"}
                      </Badge>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">
                      Submitted: {sharedSubmission?.createdAt ? new Date(sharedSubmission.createdAt).toLocaleString() : "Recently"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-slate-400 block">Submitted Score</span>
                      <span className="text-3xl font-black font-mono text-white">
                        {sharedSubmission?.homeScore} - {sharedSubmission?.awayScore}
                      </span>
                      {sharedSubmission?.notes && (
                        <p className="text-xs text-slate-400 mt-1 italic">&quot;{sharedSubmission.notes}&quot;</p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                      {sharedSubmission?.screenshotUrl && (
                        <a
                          href={sharedSubmission.screenshotUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 py-2 px-3.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-sky-400 font-bold hover:bg-slate-800 transition"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View Screenshot Proof
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/70 flex items-center gap-2.5 text-xs text-amber-300/90">
                    <Lock className="h-4 w-4 text-amber-400 shrink-0" />
                    <span>
                      <strong>Linked Fixture Lock:</strong> Result proof has been registered by @{submitterGamerTag}. The uploading page is closed for both athletes while the Commissioner Office verifies the screenshot.
                    </span>
                  </div>
                </div>
              )}

              {/* LINKED FORFEIT CLAIM STATUS CARD (CLOSED FOR BOTH) */}
              {!hasSubmittedResult && hasClaimedForfeit && (
                <div className="mt-6 p-5 sm:p-6 rounded-2xl border border-red-500/50 bg-gradient-to-r from-red-950/40 via-slate-900/90 to-slate-950/90 ring-1 ring-red-500/30">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3 mb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="destructive" className="font-black text-xs uppercase gap-1 animate-pulse">
                        <ShieldAlert className="h-3.5 w-3.5" />
                        FORFEIT CLAIM — UNDER ADMIN ARBITRATION
                      </Badge>
                      <Badge variant="outline" className="text-[10px] text-slate-300 border-slate-700 font-bold">
                        Lodged by: @{claimantGamerTag} {isMyClaim ? "(You)" : "(Opponent)"}
                      </Badge>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">
                      Lodged: {sharedForfeit?.createdAt ? new Date(sharedForfeit.createdAt).toLocaleString() : "Recently"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-slate-400 block">Claim Reason</span>
                      <p className="text-xs text-slate-200 mt-1 italic">&quot;{sharedForfeit?.reason}&quot;</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                      {sharedForfeit?.proofScreenshotUrl && (
                        <a
                          href={sharedForfeit.proofScreenshotUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 py-2 px-3.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-rose-400 font-bold hover:bg-slate-800 transition"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View WhatsApp Proof
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/70 flex items-center gap-2.5 text-xs text-red-300/90">
                    <Lock className="h-4 w-4 text-red-400 shrink-0" />
                    <span>
                      <strong>Linked Fixture Lock:</strong> A forfeit walkover claim has been filed by @{claimantGamerTag}. The uploading window is closed for both athletes while the Commissioner Office arbitrates the claim.
                    </span>
                  </div>
                </div>
              )}

              {/* Match Action Buttons (Result Upload & Forfeit Proof) */}
              <div className="mt-6 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-xs text-slate-400 max-w-md">
                  Coordinate with your opponent on WhatsApp, complete the match on eFootball Mobile, and upload a screenshot of the post-game score screen before the 24-hour timer expires.
                </p>

                {isAdminPermissionGranted && activeMatch?.status !== "FINISHED" ? (
                  <div className="w-full sm:w-auto space-y-3">
                    <div className="p-3 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 text-xs text-emerald-200 flex items-center gap-2.5">
                      <Unlock className="h-5 w-5 text-emerald-400 shrink-0" />
                      <div>
                        <span className="font-bold text-white block">
                          Commissioner Submission Permission Active
                        </span>
                        <span className="text-[11px] text-emerald-300">
                          The League Commissioner has granted permission to upload/re-upload scores and screenshot proof for this match.
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <Button
                        variant="yellow"
                        size="lg"
                        onClick={() => {
                          setActionMatch(activeMatch);
                          setShowResultModal(true);
                        }}
                        className="font-bold text-xs sm:text-sm gap-2 w-full sm:w-auto"
                      >
                        <Upload className="h-4 w-4" />
                        {hasSubmittedResult ? "Re-upload Match Result Screenshot" : "Upload Match Result Screenshot"}
                      </Button>

                      <Button
                        variant="outline"
                        size="lg"
                        onClick={() => {
                          setActionMatch(activeMatch);
                          setShowForfeitModal(true);
                        }}
                        className="font-bold text-xs sm:text-sm gap-2 border-red-500/40 text-red-400 hover:bg-red-950/20 w-full sm:w-auto"
                      >
                        <ShieldAlert className="h-4 w-4" />
                        Claim Opponent Forfeit (Proof)
                      </Button>
                    </div>
                  </div>
                ) : hasSubmittedResult ? (
                  <div className="w-full sm:w-auto p-3.5 sm:p-4 rounded-2xl bg-amber-950/30 border border-amber-500/40 text-xs text-amber-200 flex items-center gap-3">
                    <Lock className="h-5 w-5 text-amber-400 shrink-0" />
                    <div>
                      <span className="font-black uppercase tracking-wider text-white block">
                        Uploading Closed for Both Athletes
                      </span>
                      <span className="text-[11px] text-slate-300">
                        {isMySubmission
                          ? "You uploaded the match score and proof. Uploading is closed for both you and your opponent."
                          : `@${submitterGamerTag} uploaded the match score and proof. Uploading is closed for both players while awaiting admin approval.`}
                      </span>
                    </div>
                  </div>
                ) : hasClaimedForfeit ? (
                  <div className="w-full sm:w-auto p-3.5 sm:p-4 rounded-2xl bg-red-950/30 border border-red-500/40 text-xs text-red-200 flex items-center gap-3">
                    <Lock className="h-5 w-5 text-red-400 shrink-0" />
                    <div>
                      <span className="font-black uppercase tracking-wider text-white block">
                        Uploading Closed for Both Athletes
                      </span>
                      <span className="text-[11px] text-slate-300">
                        {isMyClaim
                          ? "You filed a forfeit walkover claim. Submissions are closed for both athletes."
                          : `@${claimantGamerTag} filed a forfeit claim against you. Submissions are closed pending arbitration.`}
                      </span>
                    </div>
                  </div>
                ) : isMatchLocked ? (
                  <div className="w-full sm:w-auto p-3.5 rounded-2xl bg-red-950/40 border border-red-500/40 text-xs text-red-300 flex items-center gap-3">
                    <Lock className="h-5 w-5 text-red-400 shrink-0" />
                    <div>
                      <span className="font-black uppercase tracking-wider text-red-200 block">
                        Fixture Expired & Locked
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Previous match options are closed per 24-hr midnight rule unless reopened by the Admin Office.
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                    <Button
                      variant="yellow"
                      size="lg"
                      disabled={timeLeft.isExpired && !activeMatch?.allowLateSubmission}
                      onClick={() => {
                        setActionMatch(activeMatch);
                        setShowResultModal(true);
                      }}
                      className="font-bold text-xs sm:text-sm gap-2 w-full sm:w-auto"
                    >
                      <Upload className="h-4 w-4" />
                      Upload Match Result Screenshot
                    </Button>

                    <Button
                      variant="outline"
                      size="lg"
                      disabled={timeLeft.isExpired && !activeMatch?.allowLateSubmission}
                      onClick={() => {
                        setActionMatch(activeMatch);
                        setShowForfeitModal(true);
                      }}
                      className="font-bold text-xs sm:text-sm gap-2 border-red-500/40 text-red-400 hover:bg-red-950/20 w-full sm:w-auto"
                    >
                      <ShieldAlert className="h-4 w-4" />
                      Claim Opponent Forfeit (Proof)
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ) : isRestDayToday ? (
            <div className="rounded-3xl border-2 border-cyan-500/50 bg-gradient-to-b from-cyan-950/40 via-slate-950 to-slate-900 p-8 sm:p-12 text-center space-y-6 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="inline-flex p-4 rounded-3xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                <Calendar className="h-10 w-10 sm:h-12 sm:w-12 animate-pulse" />
              </div>
              <div className="space-y-2">
                <Badge variant="yellow" className="text-xs font-mono font-bold uppercase tracking-wider px-3 py-1">
                  {currentRoundName || `Matchday ${leagueConfig?.currentMatchday || 1}`} • OFFICIAL REST DAY
                </Badge>
                <h3 className="text-2xl sm:text-3xl font-black uppercase text-white tracking-tight">
                  You Have No Match To Play Today
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
                Because your division (<span className="text-cyan-400 font-bold">{currentPlayer.division}</span>) has an odd number of competitors, each matchday one athlete has an official scheduled bye/rest day while other fixtures are played. Today is your scheduled rest day!
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto text-left pt-2">
                <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-xs text-slate-300 font-medium">
                    No forfeit penalty: Your table position, rank, and points are completely safe.
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-start gap-2.5">
                  <Clock className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                  <span className="text-xs text-slate-300 font-medium">
                    Your next league fixture will unlock automatically on the next matchday.
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setActiveTab("CALENDAR")}
                  className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs gap-2 min-h-[44px]"
                >
                  <Calendar className="h-4 w-4" />
                  View Season Calendar ({allPlayerMatches.length} Matches)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab("STANDINGS")}
                  className="text-xs font-bold min-h-[44px]"
                >
                  <Trophy className="h-4 w-4 mr-1.5" />
                  View Division Tables
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-12 text-center space-y-4">
              <Smartphone className="h-12 w-12 text-slate-600 mx-auto" />
              <h3 className="text-xl font-black uppercase text-white">
                No Active Match at this moment
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
                {allPlayerMatches.length > 0
                  ? `You have ${allPlayerMatches.length} fixture${allPlayerMatches.length === 1 ? "" : "s"} scheduled in your season timeline. You can explore all your upcoming and past matches in the Match Calendar.`
                  : "Your next 24-hour matchday fixture will drop automatically when generated by the Commissioner. Please check back then or explore the division standings."}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                {allPlayerMatches.length > 0 && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setActiveTab("CALENDAR")}
                    className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs gap-2"
                  >
                    <Calendar className="h-4 w-4" />
                    Open Match Calendar ({allPlayerMatches.length} Fixtures)
                  </Button>
                )}
                <Link href="/standings">
                  <Button variant="yellow" size="sm">
                    View Division Standings
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* DIVISION MATCH OF THE DAY SECTION (ISOLATED TO PLAYER'S DIVISION ONLY) */}
          <div className="space-y-4 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-400" />
                <h3 className="text-lg font-black uppercase text-white tracking-wide">
                  Match of the Day ({player.division})
                </h3>
              </div>
              <Badge variant="yellow" className="text-xs font-mono font-bold w-fit">
                {player.division} Exclusive
              </Badge>
            </div>

            {myDivMotd ? (
              <MatchOfTheDayCard match={myDivMotd} />
            ) : (
              <div className="rounded-2xl border border-slate-800 bg-[#080d1e]/60 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-2.5 w-2.5 rounded-full bg-amber-400" />
                  <span className="font-bold text-slate-300">
                    {player.division} Match of the Day:
                  </span>
                  <span>Evaluated and selected dynamically based on standings & performance.</span>
                </div>
                <Badge variant="secondary" className="font-mono text-[10px] w-fit">
                  Matchday {leagueConfig?.currentMatchday || 1}
                </Badge>
              </div>
            )}

            {/* CONTINENTAL GROUP MATCHES OF THE DAY (VISIBLE TO ALL PARTICIPANTS & SPECTATORS) */}
            {(() => {
              const uclList = Object.values(uclGroupMotds || {});
              const europaList = Object.values(europaGroupMotds || {});
              if (uclList.length === 0 && europaList.length === 0) return null;

              return (
                <div className="pt-4 border-t border-slate-800/80 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-cyan-400" />
                      <h4 className="text-sm font-black uppercase tracking-wider text-slate-200">
                        Continental Group Stage Matches of the Day
                      </h4>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono uppercase">
                      Visible to All Athletes
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {uclList.map((m: any) => (
                      <div key={m.id} className="relative">
                        <div className="absolute top-2 right-2 z-10">
                          <Badge variant="secondary" className="text-[9px] font-mono border-indigo-500/40 text-indigo-300 bg-indigo-950/40">
                            {m.groupName || "UCL Group Stage"}
                          </Badge>
                        </div>
                        <MatchOfTheDayCard match={m} />
                      </div>
                    ))}
                    {europaList.map((m: any) => (
                      <div key={m.id} className="relative">
                        <div className="absolute top-2 right-2 z-10">
                          <Badge variant="secondary" className="text-[9px] font-mono border-amber-500/40 text-amber-300 bg-amber-950/40">
                            {m.groupName || "Europa Group Stage"}
                          </Badge>
                        </div>
                        <MatchOfTheDayCard match={m} />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>


          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Matches Played</span>
              <span className="text-2xl font-black text-white">{standing?.played ?? 0}</span>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Wins</span>
              <span className="text-2xl font-black text-emerald-400">{standing?.won ?? 0}</span>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Points</span>
              <span className="text-2xl font-black text-yellow-400">{standing?.points ?? 0}</span>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Missed Matches</span>
              <span
                className={`text-2xl font-black ${
                  player.consecutiveMissed > 0 ? "text-red-400" : "text-slate-300"
                }`}
              >
                {player.consecutiveMissed} / 3 Max
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: INBOX & ANNOUNCEMENTS & DIRECT MESSAGING */}
      {activeTab === "INBOX" && (
        <div className="space-y-6">

          {/* Sub Navigation between Announcements & Direct Admin Messaging */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto no-scrollbar scroll-smooth">
            <button
              onClick={() => setInboxSubTab("ANNOUNCEMENTS")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 min-h-[40px] ${
                inboxSubTab === "ANNOUNCEMENTS"
                  ? "bg-yellow-500 text-slate-950 font-black shadow-lg shadow-yellow-500/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              <Bell className="h-4 w-4" />
              <span>Official Announcements</span>
              {unreadAnnouncementsCount > 0 && (
                <Badge variant="destructive" className="text-[10px] px-1.5 py-0 font-black">
                  {unreadAnnouncementsCount}
                </Badge>
              )}
            </button>

            <button
              onClick={() => setInboxSubTab("DIRECT_MESSAGES")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 min-h-[40px] ${
                inboxSubTab === "DIRECT_MESSAGES"
                  ? "bg-sky-500 text-white font-black shadow-lg shadow-sky-500/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              <Send className="h-4 w-4" />
              <span>Direct Messages to Admins</span>
              {playerMessages.length > 0 && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-mono">
                  {playerMessages.length}
                </Badge>
              )}
            </button>
          </div>

          {/* SUB-TAB 1: OFFICIAL ANNOUNCEMENTS */}
          {inboxSubTab === "ANNOUNCEMENTS" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/60 pb-3">
                <div>
                  <h4 className="text-sm font-black uppercase text-white">Broadcasts & Notices</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {unreadAnnouncementsCount > 0
                      ? `${unreadAnnouncementsCount} unread announcement${unreadAnnouncementsCount === 1 ? "" : "s"}`
                      : "All caught up! No unread announcements"}{" "}
                    • <span className="text-slate-500">Auto-deleted after 24h</span>
                  </p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  {unreadAnnouncementsCount > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleMarkAllAsRead}
                      className="h-8 text-xs font-bold border-yellow-500/40 text-yellow-400 hover:bg-yellow-950/40"
                    >
                      <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                      Mark All as Read
                    </Button>
                  )}
                  <span className="text-xs font-mono text-slate-500">{activeAnnouncements.length} Total</span>
                </div>
              </div>

              {activeAnnouncements.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-8 text-center">No active announcements within the last 24 hours.</p>
              ) : (
                <div className="space-y-4">
                  {activeAnnouncements.map((ann) => {
                    const isRead = readAnnouncements.has(ann.id);
                    return (
                      <div
                        key={ann.id}
                        className={`rounded-2xl border p-5 space-y-3 backdrop-blur-xl transition-all ${
                          !isRead
                            ? "border-yellow-500/50 bg-gradient-to-r from-yellow-950/20 to-slate-900/90 shadow-lg shadow-yellow-500/5 ring-1 ring-yellow-500/20"
                            : ann.type === "INDIVIDUAL"
                            ? "border-sky-500/30 bg-sky-950/10"
                            : "border-slate-800 bg-slate-900/40 opacity-80 hover:opacity-100"
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            {!isRead && (
                              <Badge variant="yellow" className="text-[10px] font-bold animate-pulse">
                                ● NEW
                              </Badge>
                            )}
                            <Badge
                              variant={ann.type === "INDIVIDUAL" ? "default" : "secondary"}
                              className="text-[10px]"
                            >
                              {ann.type === "INDIVIDUAL" ? "COMMISSIONER DIRECT NOTICE" : "LEAGUE BROADCAST"}
                            </Badge>
                            {ann.isPinned && (
                              <Badge variant="live" className="text-[9px]">
                                PINNED
                              </Badge>
                            )}
                            {isRead && (
                              <span className="flex items-center gap-1 text-[10px] font-medium text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded-full border border-slate-700/50">
                                <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                                Read
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-mono text-slate-500">
                              {new Date(ann.createdAt).toLocaleDateString()}
                            </span>
                            {!isRead && (
                              <Button
                                size="sm"
                                onClick={() => handleMarkAsRead(ann.id)}
                                className="h-7 px-3 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-sm"
                              >
                                <CheckCircle className="h-3.5 w-3.5 mr-1" />
                                Mark as Read
                              </Button>
                            )}
                          </div>
                        </div>

                        <h4 className="text-base font-extrabold text-white">
                          {ann.title.replace(/\[REMINDER-1HR-[^\]]+\]/, "").trim()}
                        </h4>
                        <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                          {ann.content}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* SUB-TAB 2: DIRECT MESSAGES TO ADMINS */}
          {inboxSubTab === "DIRECT_MESSAGES" && (
            <div className="space-y-6">
              {/* Message Composer Card */}
              <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6 sm:p-7 space-y-4 backdrop-blur-xl shadow-xl">
                <div className="border-b border-slate-800 pb-3">
                  <h4 className="text-sm font-black uppercase text-white flex items-center gap-2">
                    <Send className="h-4 w-4 text-sky-400" />
                    <span>Write Direct Message to League Commissioners</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Have an inquiry regarding match scheduling, dispute, division status, or rules? Submit your message directly to the admin desk.
                  </p>
                </div>

                {msgSuccess && (
                  <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400" />
                    <span>{msgSuccess}</span>
                  </div>
                )}

                {msgError && (
                  <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
                    <span>{msgError}</span>
                  </div>
                )}

                <form onSubmit={handleSendMessage} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-slate-300">
                      Subject / Topic *
                    </label>
                    <Input
                      value={msgSubject}
                      onChange={(e) => setMsgSubject(e.target.value)}
                      placeholder="e.g. Inquiry regarding Matchday 3 fixture or division placement"
                      className="bg-slate-900 border-slate-800 text-xs font-semibold text-white focus:ring-1 focus:ring-sky-500"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-slate-300">
                      Message Details *
                    </label>
                    <textarea
                      rows={4}
                      value={msgContent}
                      onChange={(e) => setMsgContent(e.target.value)}
                      placeholder="Type your message, query, or report for the administrators..."
                      className="w-full rounded-xl bg-slate-900 border border-slate-800 p-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-sky-500 resize-none"
                      required
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={sendingMessage || !msgSubject.trim() || !msgContent.trim()}
                      className="font-bold text-xs bg-sky-500 hover:bg-sky-400 text-white shadow-lg shadow-sky-500/30"
                    >
                      {sendingMessage ? (
                        <span>Sending to Admins...</span>
                      ) : (
                        <span className="flex items-center gap-1.5">
                          <Send className="h-3.5 w-3.5" />
                          <span>Send Message to Admins</span>
                        </span>
                      )}
                    </Button>
                  </div>
                </form>
              </div>

              {/* Message History & Replies */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-300">
                    Your Inquiries & Commissioner Replies ({playerMessages.length})
                  </h4>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={fetchPlayerMessages}
                    disabled={loadingMessages}
                    className="h-7 text-[11px] text-slate-400 hover:text-white"
                  >
                    Refresh
                  </Button>
                </div>

                {loadingMessages && playerMessages.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center italic">Loading your inquiries...</p>
                ) : playerMessages.length === 0 ? (
                  <div className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-8 text-center space-y-2">
                    <MessageSquare className="h-8 w-8 text-slate-600 mx-auto" />
                    <p className="text-xs text-slate-400 font-semibold">No direct inquiries sent yet.</p>
                    <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                      Whenever you send a message above, you will see the administrator's reply here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {playerMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 space-y-4 backdrop-blur-xl shadow-md"
                      >
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/60 pb-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-black text-white">{msg.subject}</span>
                            <Badge
                              variant={msg.status === "REPLIED" ? "green" : "yellow"}
                              className="text-[10px] font-bold"
                            >
                              {msg.status === "REPLIED" ? "COMMISSIONER REPLIED" : "PENDING ADMIN REVIEW"}
                            </Badge>
                          </div>
                          <span className="text-[11px] font-mono text-slate-500">
                            Sent: {new Date(msg.createdAt).toLocaleString()}
                          </span>
                        </div>

                        {/* Player Content */}
                        <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap bg-slate-950/50 p-3.5 rounded-xl border border-slate-800/60">
                          <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                            Your Message:
                          </span>
                          {msg.content}
                        </div>

                        {/* Admin Reply Block */}
                        {msg.adminReply ? (
                          <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/20 p-4 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Badge variant="green" className="text-[9px] font-black uppercase tracking-wider">
                                  OFFICIAL COMMISSIONER RESPONSE
                                </Badge>
                              </div>
                              {msg.repliedAt && (
                                <span className="text-[10px] font-mono text-emerald-400/80">
                                  {new Date(msg.repliedAt).toLocaleString()}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-emerald-200 leading-relaxed whitespace-pre-wrap">
                              {msg.adminReply}
                            </p>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-xs text-amber-400/80 bg-amber-950/20 border border-amber-500/20 p-3 rounded-xl">
                            <Clock className="h-4 w-4 shrink-0 text-amber-400" />
                            <span>This message is in the league administrator queue. You will see their reply here once reviewed.</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: MATCH HISTORY & PROOF */}
      {!isReserved && activeTab === "HISTORY" && (
        <div className="space-y-4">
          <h3 className="text-lg font-black uppercase text-white border-b border-slate-800 pb-3">
            Completed Match History
          </h3>

          {recentMatches.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-8 text-center">
              No completed matches yet.
            </p>
          ) : (
            <div className="space-y-3">
              {recentMatches.map((m) => (
                <div
                  key={m.id}
                  className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col sm:flex-row items-center justify-between gap-4"
                >
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">
                      {m.round} • {m.division}
                    </span>
                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 mt-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-slate-950 border border-slate-700/80 p-0.5 flex items-center justify-center shrink-0 aspect-square overflow-hidden shadow-inner">
                          <img
                            src={resolvePlayerAvatar(m.homePlayer)}
                            alt={m.homePlayer?.realTeam || m.homePlayer?.gamerTag || "Home"}
                            className="w-full h-full object-contain"
                            loading="lazy"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(m.homePlayer?.gamerTag || "player")}`;
                            }}
                          />
                        </div>
                        <span className="text-xs sm:text-sm font-extrabold text-white truncate">{m.homePlayer.gamerTag}</span>
                        {m.homePlayer.realTeam && (
                          <span className="text-[10px] text-amber-400 font-bold truncate">
                            ({findTeam(m.homePlayer.realTeam)?.shortName || m.homePlayer.realTeam})
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-500 font-bold shrink-0">vs</span>
                      <div className="flex items-center gap-1.5 min-w-0">
                        <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-slate-950 border border-slate-700/80 p-0.5 flex items-center justify-center shrink-0 aspect-square overflow-hidden shadow-inner">
                          <img
                            src={resolvePlayerAvatar(m.awayPlayer)}
                            alt={m.awayPlayer?.realTeam || m.awayPlayer?.gamerTag || "Away"}
                            className="w-full h-full object-contain"
                            loading="lazy"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(m.awayPlayer?.gamerTag || "player")}`;
                            }}
                          />
                        </div>
                        <span className="text-xs sm:text-sm font-extrabold text-white truncate">{m.awayPlayer.gamerTag}</span>
                        {m.awayPlayer.realTeam && (
                          <span className="text-[10px] text-amber-400 font-bold truncate">
                            ({findTeam(m.awayPlayer.realTeam)?.shortName || m.awayPlayer.realTeam})
                          </span>
                        )}
                      </div>
                    </div>
                    {m.notes && <p className="text-xs text-slate-400 italic mt-1">"{m.notes}"</p>}
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="px-4 py-1.5 rounded-xl bg-slate-950 font-mono text-lg font-black text-yellow-400 border border-slate-800">
                      {m.homeScore} : {m.awayScore}
                    </div>
                    <Badge
                      variant={m.status === "FORFEIT" ? "destructive" : "secondary"}
                      className="text-xs"
                    >
                      {m.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB: CALENDAR MODE (ALL SEASON MATCH FIXTURES) */}
      {/* ========================================================================= */}
      {!isReserved && activeTab === "CALENDAR" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl border border-slate-800 bg-slate-950/80 shadow-xl">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="yellow">SEASON CALENDAR</Badge>
                <Badge variant="secondary">{allPlayerMatches.length} Total Matches</Badge>
              </div>
              <h2 className="text-xl sm:text-2xl font-black uppercase text-white tracking-tight flex items-center gap-2">
                <Calendar className="h-6 w-6 text-cyan-400" />
                <span>My Season Match Calendar</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Complete timeline of all your league fixtures across all matchdays. Your active match is highlighted below with full score and screenshot submission controls.
              </p>
            </div>
          </div>

          {isRestDayToday && (
            <div className="rounded-2xl border border-cyan-500/40 bg-cyan-950/20 p-4 flex items-center gap-3 shadow-lg">
              <Sparkles className="h-5 w-5 text-cyan-400 shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-cyan-300 uppercase mr-1.5">
                  {currentRoundName || "Current Matchday"} Notice:
                </span>
                <span className="text-slate-300">
                  Today is your official scheduled rest day in {currentPlayer.division} (odd number of competitors). You have no match to play today, and your next fixture will unlock on the following matchday.
                </span>
              </div>
            </div>
          )}

          {allPlayerMatches.length === 0 ? (
            <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-12 text-center space-y-3">
              <Calendar className="h-12 w-12 text-slate-600 mx-auto" />
              <h4 className="text-base font-bold text-white uppercase">No Matches Scheduled Yet</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                The League Commissioner has not yet generated the official round-robin schedule for your division. Please check back once registration closes.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {allPlayerMatches.map((m: any) => {
                const isCurrentActive = m.id === activeMatch?.id;
                const isHome = m.homePlayerId === player.id;
                const matchOpponent = isHome ? m.awayPlayer : m.homePlayer;
                const isFinished = m.status === "FINISHED";
                const isForfeit = m.status === "FORFEIT";
                const sub = m.submissions?.find((s: any) => s.status !== "REJECTED") || m.submissions?.[0];
                const forfeit = m.forfeitClaims?.find((f: any) => f.status !== "REJECTED") || m.forfeitClaims?.[0];
                const hasSubOrForfeit = Boolean(sub || forfeit);
                const isPending = sub?.status === "PENDING";
                const isForfeitPending = forfeit?.status === "PENDING";

                return (
                  <div
                    key={m.id}
                    className={`rounded-3xl border p-5 flex flex-col justify-between transition-all backdrop-blur-xl shadow-xl space-y-4 ${
                      isCurrentActive
                        ? "border-cyan-500/60 bg-gradient-to-b from-cyan-950/40 via-slate-900/90 to-slate-950/90 ring-2 ring-cyan-500/40 shadow-cyan-500/10"
                        : isFinished || isForfeit
                        ? "border-slate-800 bg-slate-950/70"
                        : "border-slate-800/80 bg-slate-950/50 hover:border-slate-700"
                    }`}
                  >
                    {/* Card Header */}
                    <div className="space-y-2 border-b border-slate-800/80 pb-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Badge variant={isCurrentActive ? "yellow" : "secondary"} className="text-[10px] font-mono font-bold">
                            {m.round}
                          </Badge>
                          <Badge variant="outline" className="text-[10px]">
                            {m.division}
                          </Badge>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">
                          {new Date(m.matchDate).toLocaleDateString([], { month: "short", day: "numeric" })}
                        </span>
                      </div>

                      {/* Status Badges */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        {isCurrentActive && (
                          <Badge variant="live" className="text-[9px] animate-pulse">
                            ⚡ ACTIVE 24-HR FIXTURE
                          </Badge>
                        )}
                        {isFinished && (
                          <Badge variant="green" className="text-[9px] font-black">
                            COMPLETED
                          </Badge>
                        )}
                        {isForfeit && (
                          <Badge variant="destructive" className="text-[9px] font-black">
                            FORFEIT (0-3)
                          </Badge>
                        )}
                        {isPending && (
                          <Badge variant="yellow" className="text-[9px] font-black animate-pulse">
                            PENDING APPROVAL
                          </Badge>
                        )}
                        {isForfeitPending && !isPending && (
                          <Badge variant="destructive" className="text-[9px] font-black animate-pulse">
                            FORFEIT ARBITRATION
                          </Badge>
                        )}
                        {!isFinished && !isForfeit && !isPending && !isForfeitPending && !isCurrentActive && (
                          <Badge variant="secondary" className="text-[9px] text-slate-400">
                            UPCOMING
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Team Pairings & Score Grid */}
                    <div className="space-y-2.5 py-1">
                      {/* You */}
                      <div className="p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-white/95 border border-slate-700/80 p-0.5 flex items-center justify-center shrink-0 aspect-square overflow-hidden shadow-inner">
                            <img
                              src={resolvePlayerAvatar(player)}
                              alt={player.realTeam || player.gamerTag || "Team"}
                              className="w-full h-full object-contain filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]"
                              loading="lazy"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(player.gamerTag || "player")}`;
                              }}
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-xs text-white truncate">{player.gamerTag}</span>
                              <span className="text-[8px] px-1 py-0 rounded bg-sky-500/20 text-sky-300 font-bold border border-sky-500/30">
                                {isHome ? "H" : "A"}
                              </span>
                            </div>
                            {player.realTeam && (
                              <span className="text-[9px] text-amber-400 font-bold block truncate">
                                {findTeam(player.realTeam)?.shortName || player.realTeam}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="shrink-0 text-right">
                          {isFinished || isForfeit ? (
                            <span className="font-mono text-base font-black text-cyan-400">
                              {isHome ? m.homeScore : m.awayScore}
                            </span>
                          ) : sub ? (
                            <span className="font-mono text-sm font-black text-amber-400">
                              {isHome ? sub.homeScore : sub.awayScore}
                            </span>
                          ) : (
                            <span className="text-xs font-mono text-slate-500">-</span>
                          )}
                        </div>
                      </div>

                      {/* Opponent */}
                      <div className="p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-white/95 border border-slate-700/80 p-0.5 flex items-center justify-center shrink-0 aspect-square overflow-hidden shadow-inner">
                            <img
                              src={resolvePlayerAvatar(matchOpponent)}
                              alt={matchOpponent?.realTeam || matchOpponent?.gamerTag || "Opponent"}
                              className="w-full h-full object-contain filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]"
                              loading="lazy"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(matchOpponent?.gamerTag || "opponent")}`;
                              }}
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-xs text-white truncate">{matchOpponent?.gamerTag || "TBD"}</span>
                              <span className="text-[8px] px-1 py-0 rounded bg-slate-800 text-slate-400 font-bold border border-slate-700">
                                {isHome ? "A" : "H"}
                              </span>
                            </div>
                            {matchOpponent?.realTeam && (
                              <span className="text-[9px] text-amber-400 font-bold block truncate">
                                {findTeam(matchOpponent.realTeam)?.shortName || matchOpponent.realTeam}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="shrink-0 text-right">
                          {isFinished || isForfeit ? (
                            <span className="font-mono text-base font-black text-cyan-400">
                              {isHome ? m.awayScore : m.homeScore}
                            </span>
                          ) : sub ? (
                            <span className="font-mono text-sm font-black text-amber-400">
                              {isHome ? sub.awayScore : sub.homeScore}
                            </span>
                          ) : (
                            <span className="text-xs font-mono text-slate-500">-</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Card Footer Actions */}
                    <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {matchOpponent?.whatsapp && (
                          <a
                            href={`https://wa.me/${matchOpponent.whatsapp.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 py-1 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold shadow-sm"
                          >
                            <MessageSquare className="h-3 w-3" />
                            WhatsApp
                          </a>
                        )}

                        {sub?.screenshotUrl && (
                          <a
                            href={sub.screenshotUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 py-1 px-2.5 rounded-lg bg-slate-900 border border-slate-700 text-[11px] text-sky-400 font-bold hover:bg-slate-800"
                          >
                            <Eye className="h-3 w-3" />
                            Proof
                          </a>
                        )}

                        {forfeit?.proofScreenshotUrl && (
                          <a
                            href={forfeit.proofScreenshotUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 py-1 px-2.5 rounded-lg bg-slate-900 border border-slate-700 text-[11px] text-rose-400 font-bold hover:bg-slate-800"
                          >
                            <Eye className="h-3 w-3" />
                            Forfeit
                          </a>
                        )}
                      </div>

                      {isCurrentActive && !isFinished && !isForfeit && (
                        <Button
                          variant="yellow"
                          size="sm"
                          onClick={() => setActiveTab("OVERVIEW")}
                          className="font-bold text-[11px] py-1 px-2.5 h-auto gap-1 shadow-md shadow-yellow-500/20"
                        >
                          <Clock className="h-3 w-3" />
                          <span>Play Now</span>
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: PERSONAL INFORMATION & PROFILE SETTINGS */}
      {/* ========================================================================= */}
      {activeTab === "PROFILE" && (
        <div className="space-y-6">
          <div className="border-b border-slate-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-lg font-black uppercase text-white flex items-center gap-2">
                <User className="h-5 w-5 text-sky-400" />
                Personal Information & Account Settings
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Update your gamer tag, contact phone number, username, and login password.
              </p>
            </div>
            <Badge variant="secondary" className="font-mono text-xs text-slate-400 self-start sm:self-auto">
              ID: {currentPlayer.efootballId}
            </Badge>
          </div>

          {profileSuccessMsg && (
            <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
              <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>{profileSuccessMsg}</span>
            </div>
          )}

          {profileErrorMsg && (
            <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{profileErrorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Athlete Profile Summary Card */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-5 h-fit backdrop-blur-xl">
              <div className="text-center space-y-3 pb-4 border-b border-slate-800">
                <div className="h-20 w-20 sm:h-24 sm:w-24 shrink-0 aspect-square rounded-2xl sm:rounded-3xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-700/80 p-2 text-white font-black text-2xl sm:text-3xl flex items-center justify-center mx-auto shadow-xl shadow-sky-500/10 overflow-hidden">
                  {currentPlayer.avatar || resolvePlayerAvatar(currentPlayer) ? (
                    <img
                      src={currentPlayer.avatar || resolvePlayerAvatar(currentPlayer)}
                      alt={currentPlayer.realTeam || currentPlayer.gamerTag}
                      className="h-full w-full object-contain"
                      loading="lazy"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(currentPlayer.gamerTag || "player")}`;
                      }}
                    />
                  ) : (
                    <div className="h-full w-full rounded-xl bg-gradient-to-br from-sky-400 to-indigo-600 flex items-center justify-center font-black text-xl sm:text-2xl text-white">
                      {currentPlayer.gamerTag.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="text-xl font-black text-white">{currentPlayer.gamerTag}</h4>
                  <p className="text-xs text-slate-400">{currentPlayer.fullName}</p>
                  {currentPlayer.realTeam && (
                    <div className="mt-1 flex items-center justify-center gap-1.5">
                      <span className="text-xs font-bold text-sky-400">{currentPlayer.realTeam}</span>
                      {(() => {
                        const t = findTeam(currentPlayer.realTeam);
                        return t ? (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                            {t.shortName}
                          </span>
                        ) : null;
                      })()}
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
                  <Badge variant="yellow" className="text-[10px]">
                    {currentPlayer.division}
                  </Badge>
                  <Badge variant={currentPlayer.status === "ACTIVE" ? "default" : "secondary"} className="text-[10px]">
                    {currentPlayer.status}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">eFootball ID:</span>
                  <span className="font-mono text-slate-200">{currentPlayer.efootballId}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">WhatsApp Phone:</span>
                  <span className="font-mono text-emerald-400 font-semibold">{currentPlayer.whatsapp}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Login Username:</span>
                  <span className="font-mono text-slate-200 truncate max-w-[150px]">{currentUser?.email}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Platform:</span>
                  <span className="font-mono text-slate-300">{currentPlayer.platform}</span>
                </div>
              </div>
            </div>

            {/* Profile Update Form */}
            <div className="lg:col-span-2 rounded-3xl border border-slate-800 bg-slate-950/80 p-6 sm:p-8 space-y-6 backdrop-blur-xl shadow-xl">
              <form onSubmit={handleUpdateProfile} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-slate-300">
                      Gamer Tag *
                    </label>
                    <Input
                      value={profileGamerTag}
                      onChange={(e) => setProfileGamerTag(e.target.value)}
                      placeholder="e.g. RW_Sniper"
                      className="bg-slate-900 border-slate-800 text-xs font-bold text-white focus:ring-1 focus:ring-sky-500"
                      required
                    />
                    <span className="text-[10px] text-slate-500 block">
                      Displayed on fixtures, standings tables, and Match of the Day showdowns.
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-slate-300">
                      Full Real Name *
                    </label>
                    <Input
                      value={profileFullName}
                      onChange={(e) => setProfileFullName(e.target.value)}
                      placeholder="e.g. Jean Paul"
                      className="bg-slate-900 border-slate-800 text-xs text-white focus:ring-1 focus:ring-sky-500"
                      required
                    />
                    <span className="text-[10px] text-slate-500 block">
                      Your legal name for prize payouts and commissioner verification.
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-slate-300">
                      Phone Number / WhatsApp *
                    </label>
                    <Input
                      value={profileWhatsapp}
                      onChange={(e) => setProfileWhatsapp(e.target.value)}
                      placeholder="e.g. +250 788 123 456"
                      className="bg-slate-900 border-slate-800 text-xs font-mono text-emerald-400 focus:ring-1 focus:ring-sky-500"
                      required
                    />
                    <span className="text-[10px] text-slate-500 block">
                      Mandatory. Opponents use this to contact you for 24-hr match scheduling.
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-slate-300">
                      Username / Login Email *
                    </label>
                    <Input
                      type="email"
                      value={profileEmail}
                      onChange={(e) => setProfileEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="bg-slate-900 border-slate-800 text-xs text-white focus:ring-1 focus:ring-sky-500"
                      required
                    />
                    <span className="text-[10px] text-slate-500 block">
                      Used to log into your player account portal.
                    </span>
                  </div>
                </div>

                {/* Real Football Club Representation & Crest Selection */}
                <div className="pt-4 border-t border-slate-800/80 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h5 className="text-xs font-black uppercase text-sky-400 tracking-wider flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5" />
                        Official Football Club Representation & Avatar
                      </h5>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Choose the official club that represents you. Its crest becomes your official athlete avatar across all tables, fixtures, and draws.
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-[10px] uppercase font-mono self-start sm:self-auto">
                      {currentPlayer.division === "Division 1"
                        ? "Premier League"
                        : currentPlayer.division === "Division 2"
                        ? "La Liga"
                        : "Serie A"}
                    </Badge>
                  </div>

                  {/* Selected Club Preview */}
                  {profileRealTeam ? (
                    <div className="p-3.5 rounded-2xl bg-sky-950/30 border border-sky-500/30 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-xl bg-slate-900 border border-slate-700/80 p-1 flex items-center justify-center shrink-0">
                          {(() => {
                            const t = findTeam(profileRealTeam);
                            return t ? (
                              <img src={t.logo} alt={t.name} className="h-full w-full object-contain" />
                            ) : null;
                          })()}
                        </div>
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-sky-400 block">
                            Selected Club
                          </span>
                          <span className="text-sm font-bold text-white">{profileRealTeam}</span>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setProfileRealTeam("")}
                        className="text-[11px] h-7 text-rose-400 border-rose-500/30 hover:bg-rose-950/40"
                      >
                        Change / Clear
                      </Button>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-slate-900/60 border border-dashed border-slate-700 text-xs text-slate-400 text-center">
                      No club selected yet. Select a club below to represent you in the tournament.
                    </div>
                  )}

                  {/* Club Selection Grid */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-300 block">
                      Select your club from {currentPlayer.division} (
                      {currentPlayer.division === "Division 1"
                        ? "Premier League"
                        : currentPlayer.division === "Division 2"
                        ? "La Liga"
                        : "Serie A"}
                      ):
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-[260px] overflow-y-auto p-1 border border-slate-800 rounded-2xl bg-slate-900/30">
                      {getTeamsForDivision(currentPlayer.division).map((team) => {
                        const isSelected = profileRealTeam === team.name;
                        const claimedBy = isTeamClaimedByOther(team.name);
                        const isTaken = Boolean(claimedBy);
                        return (
                          <button
                            key={team.name}
                            type="button"
                            disabled={isTaken}
                            onClick={() => setProfileRealTeam(team.name)}
                            className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 relative ${
                              isSelected
                                ? "border-sky-400 bg-sky-500/20 shadow-md shadow-sky-500/20 ring-2 ring-sky-400/50"
                                : isTaken
                                ? "border-slate-800/60 bg-slate-950/80 opacity-40 cursor-not-allowed"
                                : "border-slate-800 bg-slate-900/60 hover:bg-slate-850 hover:border-slate-700"
                            }`}
                          >
                            <div className="h-10 w-10 rounded-lg bg-slate-950/60 p-1 flex items-center justify-center border border-slate-800">
                              <img
                                src={team.logo}
                                alt={team.name}
                                className="h-full w-full object-contain"
                                loading="lazy"
                              />
                            </div>
                            <div className="w-full">
                              <div className="text-[11px] font-bold text-white truncate" title={team.name}>
                                {team.name}
                              </div>
                              <div className="text-[9px] font-mono text-slate-400">
                                {team.shortName}
                              </div>
                              {isTaken ? (
                                <span className="text-[8px] font-mono text-rose-400 font-bold block truncate mt-0.5">
                                  TAKEN (@{claimedBy})
                                </span>
                              ) : isSelected ? (
                                <span className="text-[8px] font-mono text-sky-400 font-bold block mt-0.5">
                                  SELECTED
                                </span>
                              ) : (
                                <span className="text-[8px] font-mono text-emerald-400 font-semibold block mt-0.5">
                                  Available
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Password Change Section */}
                <div className="pt-4 border-t border-slate-800/80 space-y-4">
                  <div>
                    <h5 className="text-xs font-black uppercase text-yellow-400 tracking-wider">
                      Security & Password Change
                    </h5>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Leave password fields blank if you do not wish to change your current login password.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase text-slate-300">
                        New Password
                      </label>
                      <div className="relative">
                        <Input
                          type={showProfilePassword ? "text" : "password"}
                          value={profilePassword}
                          onChange={(e) => setProfilePassword(e.target.value)}
                          placeholder="Minimum 6 characters"
                          className="bg-slate-900 border-slate-800 text-xs text-white focus:ring-1 focus:ring-yellow-500 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowProfilePassword(!showProfilePassword)}
                          className="absolute right-3 top-2.5 text-slate-400 hover:text-white transition-colors focus:outline-none"
                          aria-label={showProfilePassword ? "Hide password" : "Show password"}
                          title={showProfilePassword ? "Hide password" : "Show password"}
                        >
                          {showProfilePassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase text-slate-300">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <Input
                          type={showProfilePassword ? "text" : "password"}
                          value={profileConfirmPassword}
                          onChange={(e) => setProfileConfirmPassword(e.target.value)}
                          placeholder="Repeat new password"
                          className="bg-slate-900 border-slate-800 text-xs text-white focus:ring-1 focus:ring-yellow-500 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowProfilePassword(!showProfilePassword)}
                          className="absolute right-3 top-2.5 text-slate-400 hover:text-white transition-colors focus:outline-none"
                          aria-label={showProfilePassword ? "Hide password" : "Show password"}
                          title={showProfilePassword ? "Hide password" : "Show password"}
                        >
                          {showProfilePassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    type="submit"
                    disabled={profileUpdating}
                    className="bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs px-6 py-2.5 shadow-lg shadow-sky-600/20"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {profileUpdating ? "Saving Changes..." : "Save Personal Information"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}



      {/* MODAL 1: UPLOAD MATCH RESULT SCREENSHOT */}
      {showResultModal && (() => {
        const modalMatch = actionMatch || activeMatch;
        const modalSub =
          modalMatch?.submissions?.find((s: any) => s.status !== "REJECTED") ||
          modalMatch?.submissions?.[0] ||
          null;
        const modalHasSubmittedResult = Boolean(modalSub);
        const modalSubmitterGamerTag =
          modalSub?.submittedByPlayer?.gamerTag ||
          (modalSub?.submittedByPlayerId === player.id
            ? player.gamerTag
            : modalMatch?.homePlayerId === player.id
            ? modalMatch?.awayPlayer?.gamerTag
            : modalMatch?.homePlayer?.gamerTag || "Opponent");

        const modalForfeit =
          modalMatch?.forfeitClaims?.find((f: any) => f.status !== "REJECTED") ||
          modalMatch?.forfeitClaims?.[0] ||
          null;
        const modalHasClaimedForfeit = Boolean(modalForfeit);
        const modalClaimantGamerTag =
          modalForfeit?.claimantPlayer?.gamerTag ||
          (modalForfeit?.claimantPlayerId === player.id
            ? player.gamerTag
            : modalMatch?.homePlayerId === player.id
            ? modalMatch?.awayPlayer?.gamerTag
            : modalMatch?.homePlayer?.gamerTag || "Opponent");

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-800 bg-slate-950 p-5 sm:p-8 shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="yellow" className="text-[10px] font-bold">
                      {modalMatch?.round || "Official Fixture"}
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      {modalMatch?.division || "League"}
                    </Badge>
                  </div>
                  <h3 className="text-lg font-black uppercase text-white flex items-center gap-2">
                    <Upload className="h-5 w-5 text-yellow-400" />
                    Upload Match Result
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setShowResultModal(false);
                    setActionMatch(null);
                  }}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {resultSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold">
                  {resultSuccessMsg}
                </div>
              )}

              {modalHasSubmittedResult ? (
                <div className="p-6 rounded-2xl bg-amber-950/30 border border-amber-500/40 text-center space-y-4">
                  <Lock className="h-10 w-10 text-amber-400 mx-auto" />
                  <div>
                    <h4 className="text-sm font-black text-white uppercase tracking-wider">Uploading Closed for Both Athletes</h4>
                    <p className="text-xs text-slate-300 mt-1">
                      Match score and proof screenshot have already been uploaded by <strong>@{modalSubmitterGamerTag}</strong>.
                      The uploading window is closed for both athletes while awaiting Commissioner approval.
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => { setShowResultModal(false); setActionMatch(null); }} className="text-xs">
                    Close Window
                  </Button>
                </div>
              ) : modalHasClaimedForfeit ? (
                <div className="p-6 rounded-2xl bg-red-950/30 border border-red-500/40 text-center space-y-4">
                  <Lock className="h-10 w-10 text-red-400 mx-auto" />
                  <div>
                    <h4 className="text-sm font-black text-white uppercase tracking-wider">Uploading Closed for Both Athletes</h4>
                    <p className="text-xs text-slate-300 mt-1">
                      A forfeit walkover claim has already been filed by <strong>@{modalClaimantGamerTag}</strong>.
                      Result uploads are closed for both athletes while under league arbitration.
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => { setShowResultModal(false); setActionMatch(null); }} className="text-xs">
                    Close Window
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmitResult} className="space-y-4">
                  {modalMatch?.stage === "GROUP" || modalMatch?.stage === "QUARTER_FINAL" || modalMatch?.stage === "SEMI_FINAL" ? (
                    <div className="space-y-4">
                      <div className="rounded-xl bg-indigo-950/40 border border-indigo-500/30 p-3 text-xs text-indigo-300">
                        <span className="font-bold block">2-Legged Match (Played Simultaneously):</span>
                        <span>Enter scores and upload full-time result screenshots for BOTH Leg 1 and Leg 2. Aggregate goals are calculated automatically.</span>
                      </div>

                      {/* Leg 1 Section */}
                      <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                        <span className="text-xs font-black uppercase text-yellow-400 block">Leg 1 Match Details</span>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                              {modalMatch?.homePlayer?.gamerTag} (Leg 1)
                            </label>
                            <Input
                              type="number"
                              min="0"
                              required
                              value={homeScore}
                              onChange={(e) => setHomeScore(e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                              {modalMatch?.awayPlayer?.gamerTag} (Leg 1)
                            </label>
                            <Input
                              type="number"
                              min="0"
                              required
                              value={awayScore}
                              onChange={(e) => setAwayScore(e.target.value)}
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-[11px] font-bold text-slate-300 uppercase">
                              Leg 1 Result Screenshot *
                            </label>
                            {uploadingLeg1 && (
                              <span className="text-[10px] text-amber-400 animate-pulse font-medium">
                                Uploading to R2...
                              </span>
                            )}
                            {!uploadingLeg1 && resultScreenshot && !resultScreenshot.startsWith("data:") && (
                              <span className="text-[10px] text-emerald-400 font-bold">
                                Stored in R2 ✓
                              </span>
                            )}
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            required={!resultScreenshot}
                            onChange={(e) => handleR2ScreenshotUpload(e, setResultScreenshot, setUploadingLeg1, "results")}
                            className="block w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-yellow-500 file:text-slate-950 hover:file:bg-yellow-400 cursor-pointer"
                          />
                        </div>
                        {resultScreenshot && (
                          <div className="rounded-lg overflow-hidden border border-slate-800 max-h-32">
                            <img src={resultScreenshot} alt="Leg 1 Preview" className="w-full h-auto object-cover" />
                          </div>
                        )}
                      </div>

                      {/* Leg 2 Section */}
                      <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                        <span className="text-xs font-black uppercase text-amber-400 block">Leg 2 Match Details</span>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                              {modalMatch?.homePlayer?.gamerTag} (Leg 2)
                            </label>
                            <Input
                              type="number"
                              min="0"
                              required
                              value={leg2HomeScore}
                              onChange={(e) => setLeg2HomeScore(e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                              {modalMatch?.awayPlayer?.gamerTag} (Leg 2)
                            </label>
                            <Input
                              type="number"
                              min="0"
                              required
                              value={leg2AwayScore}
                              onChange={(e) => setLeg2AwayScore(e.target.value)}
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-[11px] font-bold text-slate-300 uppercase">
                              Leg 2 Result Screenshot *
                            </label>
                            {uploadingLeg2 && (
                              <span className="text-[10px] text-amber-400 animate-pulse font-medium">
                                Uploading to R2...
                              </span>
                            )}
                            {!uploadingLeg2 && leg2ResultScreenshot && !leg2ResultScreenshot.startsWith("data:") && (
                              <span className="text-[10px] text-emerald-400 font-bold">
                                Stored in R2 ✓
                              </span>
                            )}
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            required={!leg2ResultScreenshot}
                            onChange={(e) => handleR2ScreenshotUpload(e, setLeg2ResultScreenshot, setUploadingLeg2, "results")}
                            className="block w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-amber-500 file:text-slate-950 hover:file:bg-amber-400 cursor-pointer"
                          />
                        </div>
                        {leg2ResultScreenshot && (
                          <div className="rounded-lg overflow-hidden border border-slate-800 max-h-32">
                            <img src={leg2ResultScreenshot} alt="Leg 2 Preview" className="w-full h-auto object-cover" />
                          </div>
                        )}
                      </div>

                      {/* Aggregate Score Display */}
                      <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-center">
                        <span className="text-[10px] uppercase font-bold text-emerald-400 block">Calculated Aggregate Goals</span>
                        <span className="text-lg font-black text-white font-mono">
                          {modalMatch?.homePlayer?.gamerTag} {Number(homeScore) + Number(leg2HomeScore)} - {Number(awayScore) + Number(leg2AwayScore)} {modalMatch?.awayPlayer?.gamerTag}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                            {modalMatch?.homePlayer?.gamerTag} Score
                          </label>
                          <Input
                            type="number"
                            min="0"
                            required
                            value={homeScore}
                            onChange={(e) => setHomeScore(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                            {modalMatch?.awayPlayer?.gamerTag} Score
                          </label>
                          <Input
                            type="number"
                            min="0"
                            required
                            value={awayScore}
                            onChange={(e) => setAwayScore(e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Upload Screenshot File */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-bold text-yellow-400 uppercase">
                            Upload eFootball Mobile Result Screenshot *
                          </label>
                          {uploadingLeg1 && (
                            <span className="text-[10px] text-amber-400 animate-pulse font-medium">
                              Uploading to Cloudflare R2...
                            </span>
                          )}
                          {!uploadingLeg1 && resultScreenshot && !resultScreenshot.startsWith("data:") && (
                            <span className="text-[10px] text-emerald-400 font-bold">
                              Stored in Cloudflare R2 ✓
                            </span>
                          )}
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          required={!resultScreenshot}
                          onChange={(e) => handleR2ScreenshotUpload(e, setResultScreenshot, setUploadingLeg1, "results")}
                          className="block w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-yellow-500 file:text-slate-950 hover:file:bg-yellow-400 cursor-pointer"
                        />
                        <span className="text-[10px] text-slate-500 mt-1 block">
                          Attach in-game full-time screen showing final score and gamer tags.
                        </span>
                      </div>

                      {/* Screenshot Preview */}
                      {resultScreenshot && (
                        <div className="rounded-xl overflow-hidden border border-slate-800 max-h-48">
                          <img
                            src={resultScreenshot}
                            alt="Result Screenshot Preview"
                            className="w-full h-auto object-cover"
                          />
                        </div>
                      )}
                    </>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                      Match Comments (Optional)
                    </label>
                    <Input
                      placeholder="e.g. Great game, win in extra time"
                      value={resultNotes}
                      onChange={(e) => setResultNotes(e.target.value)}
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-3">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setShowResultModal(false);
                        setActionMatch(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="yellow"
                      disabled={submittingResult}
                      className="font-bold"
                    >
                      {submittingResult ? "Submitting..." : "Send Screenshot to Admin"}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        );
      })()}

      {/* MODAL 2: CLAIM OPPONENT NO-SHOW / FORFEIT */}
      {showForfeitModal && (() => {
        const modalMatch = actionMatch || activeMatch;
        const modalSub =
          modalMatch?.submissions?.find((s: any) => s.status !== "REJECTED") ||
          modalMatch?.submissions?.[0] ||
          null;
        const modalHasSubmittedResult = Boolean(modalSub);
        const modalSubmitterGamerTag =
          modalSub?.submittedByPlayer?.gamerTag ||
          (modalSub?.submittedByPlayerId === player.id
            ? player.gamerTag
            : modalMatch?.homePlayerId === player.id
            ? modalMatch?.awayPlayer?.gamerTag
            : modalMatch?.homePlayer?.gamerTag || "Opponent");

        const modalForfeit =
          modalMatch?.forfeitClaims?.find((f: any) => f.status !== "REJECTED") ||
          modalMatch?.forfeitClaims?.[0] ||
          null;
        const modalHasClaimedForfeit = Boolean(modalForfeit);
        const modalClaimantGamerTag =
          modalForfeit?.claimantPlayer?.gamerTag ||
          (modalForfeit?.claimantPlayerId === player.id
            ? player.gamerTag
            : modalMatch?.homePlayerId === player.id
            ? modalMatch?.awayPlayer?.gamerTag
            : modalMatch?.homePlayer?.gamerTag || "Opponent");

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl border border-red-500/40 bg-slate-950 p-5 sm:p-8 shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="destructive" className="text-[10px] font-bold">
                      {modalMatch?.round || "Official Fixture"}
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      {modalMatch?.division || "League"}
                    </Badge>
                  </div>
                  <h3 className="text-lg font-black uppercase text-red-400 flex items-center gap-2">
                    <ShieldAlert className="h-5 w-5" />
                    Claim Opponent No-Show / Forfeit
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setShowForfeitModal(false);
                    setActionMatch(null);
                  }}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {forfeitSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold">
                  {forfeitSuccessMsg}
                </div>
              )}

              {modalHasSubmittedResult ? (
                <div className="p-6 rounded-2xl bg-amber-950/30 border border-amber-500/40 text-center space-y-4">
                  <Lock className="h-10 w-10 text-amber-400 mx-auto" />
                  <div>
                    <h4 className="text-sm font-black text-white uppercase tracking-wider">Uploading Closed for Both Athletes</h4>
                    <p className="text-xs text-slate-300 mt-1">
                      Match score and proof screenshot have already been uploaded by <strong>@{modalSubmitterGamerTag}</strong>.
                      Forfeit claims cannot be submitted while the match result is awaiting admin verification.
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => { setShowForfeitModal(false); setActionMatch(null); }} className="text-xs">
                    Close Window
                  </Button>
                </div>
              ) : modalHasClaimedForfeit ? (
                <div className="p-6 rounded-2xl bg-red-950/30 border border-red-500/40 text-center space-y-4">
                  <Lock className="h-10 w-10 text-red-400 mx-auto" />
                  <div>
                    <h4 className="text-sm font-black text-white uppercase tracking-wider">Uploading Closed for Both Athletes</h4>
                    <p className="text-xs text-slate-300 mt-1">
                      A forfeit walkover claim has already been filed by <strong>@{modalClaimantGamerTag}</strong>.
                      The uploading window is closed for both athletes while under league arbitration.
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => { setShowForfeitModal(false); setActionMatch(null); }} className="text-xs">
                    Close Window
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmitForfeit} className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-300 uppercase">
                        Upload Proof Screenshot *
                      </label>
                      {uploadingForfeit && (
                        <span className="text-[10px] text-red-400 animate-pulse font-medium">
                          Uploading to Cloudflare R2...
                        </span>
                      )}
                      {!uploadingForfeit && forfeitScreenshot && !forfeitScreenshot.startsWith("data:") && (
                        <span className="text-[10px] text-emerald-400 font-bold">
                          Stored in Cloudflare R2 ✓
                        </span>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      required={!forfeitScreenshot}
                      onChange={(e) => handleR2ScreenshotUpload(e, setForfeitScreenshot, setUploadingForfeit, "forfeits")}
                      className="block w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-red-500 file:text-white hover:file:bg-red-400 cursor-pointer"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      Attach WhatsApp chat screenshot or eFootball mobile room invite showing opponent did not respond.
                    </span>
                  </div>

                  {forfeitScreenshot && (
                    <div className="rounded-xl overflow-hidden border border-slate-800 max-h-48">
                      <img
                        src={forfeitScreenshot}
                        alt="Proof Screenshot Preview"
                        className="w-full h-auto object-cover"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                      Explanation / Reason *
                    </label>
                    <Input
                      required
                      placeholder="e.g. Opponent didn't answer WhatsApp for 6 hours before cutoff."
                      value={forfeitReason}
                      onChange={(e) => setForfeitReason(e.target.value)}
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-3">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setShowForfeitModal(false);
                        setActionMatch(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="destructive"
                      disabled={submittingForfeit}
                      className="font-bold"
                    >
                      {submittingForfeit ? "Submitting Claim..." : "Submit Forfeit Proof"}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* COMPACT FOOTER: RATE & LEAGUE FEEDBACK WIDGET */}
      {/* ========================================================================= */}
      <footer className="pt-8 border-t border-slate-800/80 mt-12 pb-6">
        <div className="rounded-2xl border border-slate-800 bg-[#080d1e]/90 p-4 sm:p-5 backdrop-blur-xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1 max-w-sm">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span className="text-xs font-black uppercase tracking-wider text-white">Rate League Experience</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Share your 1-5 ⭐ rating and feedback directly with League Administration.
            </p>
          </div>

          <form onSubmit={handleSubmitReview} className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* 5-Star Selection */}
            <div className="flex items-center gap-1 shrink-0 bg-slate-900/80 border border-slate-800 p-1.5 rounded-xl self-start sm:self-auto">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setUserRating(star)}
                  className="p-1 rounded hover:scale-110 transition-transform"
                >
                  <Star
                    className={`h-4 w-4 ${
                      userRating >= star ? "fill-amber-400 text-amber-400" : "fill-none text-slate-600"
                    }`}
                  />
                </button>
              ))}
              <span className="text-[10px] font-bold text-amber-400 px-1 font-mono">{userRating}/5</span>
            </div>

            {/* Quick Comment Input */}
            <Input
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Short comment or suggestion..."
              className="h-9 text-xs bg-slate-900/90 border-slate-800 text-white placeholder:text-slate-500 focus:border-amber-500"
            />

            {/* Submit Button */}
            <Button
              type="submit"
              size="sm"
              disabled={submittingReview}
              className="h-9 font-black text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 shrink-0 shadow-md shadow-amber-500/20"
            >
              <Send className="h-3 w-3 mr-1.5" />
              {submittingReview ? "..." : activeReview ? "Update" : "Send"}
            </Button>
          </form>
        </div>
        {reviewSuccessMsg && (
          <div className="mt-2 text-center text-xs text-emerald-400 font-bold animate-in fade-in">
            ✓ {reviewSuccessMsg}
          </div>
        )}
      </footer>

      {/* ========================================================================= */}
      {/* FLOATING QUICK ACTIONS BUTTON (Compact Circle Shape) */}
      {/* ========================================================================= */}
      <div className="fixed bottom-5 right-5 z-40 sm:bottom-6 sm:right-6">
        <button
          onClick={() => setShowActionHub(true)}
          className="relative flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-500 text-slate-950 shadow-lg shadow-amber-500/30 hover:scale-110 active:scale-95 transition-all group ring-2 ring-amber-400/80 focus:outline-none"
          title="Quick Actions & Help"
          aria-label="Quick Actions & Help"
        >
          <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-slate-950 fill-current group-hover:scale-110 transition-transform duration-150" />
          <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500 border border-slate-950"></span>
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* QUICK GUIDE TUTORIAL MODAL */}
      {/* ========================================================================= */}
      {showQuickGuide && (
        <QuickGuideModal
          isOpen={showQuickGuide}
          onClose={() => setShowQuickGuide(false)}
          onOpenActionHub={() => {
            setShowQuickGuide(false);
            setShowActionHub(true);
          }}
          player={currentPlayer}
          isReserved={isReserved}
        />
      )}

      {/* ========================================================================= */}
      {/* QUICK ACTIONS & HELP HUB MODAL */}
      {/* ========================================================================= */}
      {showActionHub && (
        <QuickActionHubModal
          isOpen={showActionHub}
          onClose={() => setShowActionHub(false)}
          onNavigateTab={(tab, subTab) => {
            if (tab === "FEEDBACK") {
              window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
            } else {
              setActiveTab(tab as any);
            }
            if (subTab) {
              setInboxSubTab(subTab as any);
            }
          }}
          onOpenSubmitResult={() => {
            setActionMatch(activeMatch);
            setShowResultModal(true);
          }}
          onOpenForfeitClaim={() => {
            setActionMatch(activeMatch);
            setShowForfeitModal(true);
          }}
          onStartTutorial={() => {
            setShowQuickGuide(true);
          }}
          hasActiveMatch={Boolean(activeMatch)}
          opponent={opponent}
          isReserved={isReserved}
        />
      )}
      {/* ========================================================================= */}
      {/* CONTINENTAL ANIMATED DRAWS VIEWER MODAL (PLAYER BROADCAST) */}
      {/* ========================================================================= */}
      {viewDrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/90 backdrop-blur-xl overflow-y-auto">
          <div className="relative w-full max-w-5xl my-auto">
            <button
              onClick={() => setViewDrawModal(null)}
              className="absolute -top-3 -right-3 z-50 p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-white shadow-xl border border-slate-600"
              title="Close Draw Screen"
            >
              <XCircle className="h-6 w-6 text-slate-300" />
            </button>
            <ContinentalDrawExperience
              competition={viewDrawModal}
              qualifiedAthletes={viewDrawModal === "UCL" ? uclQualifiedAthletes : europaQualifiedAthletes}
              existingSlots={viewDrawModal === "UCL" ? uclSlots : europaSlots}
              isAdmin={false}
              onClose={() => {
                const comp = viewDrawModal;
                setViewDrawModal(null);
                setActiveTab("STANDINGS");
                setStandingsCategory(comp === "UCL" ? "UCL" : "EUROPA");
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
