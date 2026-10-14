"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Sparkles,
  Calendar,
  Search,
  Filter,
  CheckCircle2,
  Trash2,
  ArrowRight,
  RefreshCw,
  Radio,
  Clock,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { resolvePlayerAvatar, findTeam } from "@/lib/teams";
import { formatRwandanDate, formatRwandanTime } from "@/lib/rwandanTime";

interface MatchFixture {
  id: string;
  division: string;
  round: string;
  status: string;
  matchDate: string | Date;
  homePlayer: {
    id: string;
    gamerTag: string;
    realTeam?: string | null;
    avatar?: string | null;
  };
  awayPlayer: {
    id: string;
    gamerTag: string;
    realTeam?: string | null;
    avatar?: string | null;
  };
}

interface AdminMotwManagerProps {
  onRefreshNews?: () => void;
}

export default function AdminMotwManager({ onRefreshNews }: AdminMotwManagerProps) {
  const [fixtures, setFixtures] = useState<MatchFixture[]>([]);
  const [currentMotw, setCurrentMotw] = useState<MatchFixture | null>(null);
  const [currentNews, setCurrentNews] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [unpublishing, setUnpublishing] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [divisionFilter, setDivisionFilter] = useState("ALL");
  const [roundFilter, setRoundFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("SCHEDULED");
  const [actionMessage, setActionMessage] = useState<{ text: string; error?: boolean } | null>(null);

  // Fetch fixtures and current MOTW
  const fetchMotwData = useCallback(async () => {
    setLoading(true);
    setActionMessage(null);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (divisionFilter !== "ALL") params.set("division", divisionFilter);
      if (roundFilter !== "ALL") params.set("round", roundFilter);
      if (statusFilter !== "ALL") params.set("status", statusFilter);

      const res = await fetch(`/api/admin/match-of-the-week?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to load Match of the Week fixtures.");
      }

      setFixtures(data.fixtures || []);
      setCurrentMotw(data.currentMotw || null);
      setCurrentNews(data.currentNews || null);
    } catch (err: any) {
      setActionMessage({ text: err.message || "Failed to load fixtures.", error: true });
    } finally {
      setLoading(false);
    }
  }, [search, divisionFilter, roundFilter, statusFilter]);

  useEffect(() => {
    fetchMotwData();
  }, [fetchMotwData]);

  // Handle Publish fixture as MOTW
  const handlePublishMotw = async (matchId: string) => {
    setPublishingId(matchId);
    setActionMessage(null);
    try {
      const res = await fetch("/api/admin/match-of-the-week", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to publish Match of the Week.");
      }

      setActionMessage({ text: data.message || "Match of the Week published to carousel!" });
      setCurrentMotw(data.match);
      setCurrentNews(data.news);
      if (onRefreshNews) onRefreshNews();
    } catch (err: any) {
      setActionMessage({ text: err.message || "Error publishing fixture.", error: true });
    } finally {
      setPublishingId(null);
    }
  };

  // Handle Unpublish MOTW from carousel
  const handleUnpublishMotw = async () => {
    setUnpublishing(true);
    setActionMessage(null);
    try {
      const res = await fetch("/api/admin/match-of-the-week", {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to remove Match of the Week.");
      }

      setActionMessage({ text: data.message || "Match of the Week removed from carousel." });
      setCurrentMotw(null);
      setCurrentNews(null);
      if (onRefreshNews) onRefreshNews();
    } catch (err: any) {
      setActionMessage({ text: err.message || "Error unpublishing.", error: true });
    } finally {
      setUnpublishing(false);
    }
  };

  // Extract unique rounds from fixtures list for the round dropdown
  const uniqueRounds = useMemo(() => {
    const rounds = new Set<string>();
    fixtures.forEach((f) => {
      if (f.round) rounds.add(f.round);
    });
    return Array.from(rounds);
  }, [fixtures]);

  return (
    <div className="space-y-5 rounded-3xl border border-border bg-card/80 p-5 sm:p-6 backdrop-blur-xl shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-secondary flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-secondary" />
              <span>Official Curated Showcase</span>
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-foreground tracking-tight">
            Match of the Week (MOTW) Calendar Selector
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
            Select any fixture from the match calendar across divisions and matchdays to designate it as Rwanda&apos;s official Match of the Week. One click publishes it directly to the homepage carousel with head-to-head presentation.
          </p>
        </div>

        <Button
          onClick={fetchMotwData}
          disabled={loading}
          variant="outline"
          size="sm"
          className="w-full sm:w-auto rounded-xl text-xs font-bold gap-1.5 border-border cursor-pointer shrink-0"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          <span>Refresh Calendar</span>
        </Button>
      </div>

      {/* Action Notification */}
      {actionMessage && (
        <div
          className={cn(
            "p-3 rounded-2xl text-xs font-medium flex items-center justify-between border",
            actionMessage.error
              ? "bg-destructive/15 text-destructive border-destructive/30"
              : "bg-primary/15 text-primary border-primary/30"
          )}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{actionMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionMessage(null)}
            className="text-muted-foreground hover:text-foreground text-xs font-bold cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* CURRENTLY PUBLISHED MOTW CARD */}
      <div className="relative rounded-2xl border border-secondary/40 bg-secondary/5 p-4 sm:p-5 space-y-3 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <img
            src="/images/motw-stadium-bg.jpg"
            alt=""
            aria-hidden="true"
            className="h-full w-full object-cover object-center"
          />
        </div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-secondary/20 pb-3">
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-secondary animate-pulse" />
            <span className="text-xs font-mono font-bold text-secondary uppercase tracking-wider">
              Currently Live on Carousel
            </span>
          </div>

          {currentMotw && (
            <Button
              onClick={handleUnpublishMotw}
              disabled={unpublishing}
              variant="outline"
              size="sm"
              className="h-8 text-xs font-mono font-bold text-destructive hover:bg-destructive/15 hover:text-destructive border-destructive/40 rounded-xl cursor-pointer w-full sm:w-auto"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              <span>{unpublishing ? "Removing..." : "Unpublish MOTW from Carousel"}</span>
            </Button>
          )}
        </div>

        {currentMotw ? (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
            <div className="space-y-1.5 min-w-0">
              <span className="text-xs font-mono text-muted-foreground font-semibold">
                {currentMotw.division} • {currentMotw.round} • Status: {currentMotw.status}
              </span>
              <h4 className="text-base sm:text-lg font-black text-foreground">
                {currentMotw.homePlayer?.gamerTag}{" "}
                <span className="text-secondary">vs</span>{" "}
                {currentMotw.awayPlayer?.gamerTag}
              </h4>
              <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
                <Calendar className="h-3.5 w-3.5 text-secondary shrink-0" />
                <span>
                  Kickoff: {formatRwandanDate(currentMotw.matchDate, { weekday: "short", month: "short", day: "numeric" })} at {formatRwandanTime(currentMotw.matchDate)} (CAT)
                </span>
              </div>
            </div>

            {/* Head-to-Head Mini Preview */}
            <div className="flex items-center justify-between sm:justify-center gap-2 sm:gap-3 p-3 rounded-xl bg-card border border-border shadow-sm w-full md:w-auto shrink-0">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-lg bg-background border border-border overflow-hidden flex items-center justify-center shrink-0">
                  <img
                    src={resolvePlayerAvatar(currentMotw.homePlayer)}
                    alt=""
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="text-left text-xs min-w-0 sm:min-w-16">
                  <span className="font-black text-foreground block truncate max-w-20">
                    {currentMotw.homePlayer?.gamerTag}
                  </span>
                  <span className="text-muted-foreground text-xs truncate block max-w-20">
                    {findTeam(currentMotw.homePlayer?.realTeam)?.shortName || currentMotw.homePlayer?.realTeam || "HOME"}
                  </span>
                </div>
              </div>

              <span className="px-2 py-0.5 rounded bg-secondary/20 text-secondary font-mono text-xs font-black shrink-0">
                VS
              </span>

              <div className="flex items-center gap-2">
                <div className="text-right text-xs min-w-0 sm:min-w-16">
                  <span className="font-black text-foreground block truncate max-w-20">
                    {currentMotw.awayPlayer?.gamerTag}
                  </span>
                  <span className="text-muted-foreground text-xs truncate block max-w-20">
                    {findTeam(currentMotw.awayPlayer?.realTeam)?.shortName || currentMotw.awayPlayer?.realTeam || "AWAY"}
                  </span>
                </div>
                <div className="h-9 w-9 rounded-lg bg-background border border-border overflow-hidden flex items-center justify-center shrink-0">
                  <img
                    src={resolvePlayerAvatar(currentMotw.awayPlayer)}
                    alt=""
                    className="h-full w-full object-contain"
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-4 text-center space-y-1">
            <span className="text-xs text-muted-foreground font-mono block">
              No Match of the Week is currently active on the carousel.
            </span>
            <span className="text-xs text-foreground font-semibold block">
              Browse the calendar below and click &quot;Publish as Match of the Week&quot; on any upcoming fixture.
            </span>
          </div>
        )}
      </div>

      {/* FILTER BAR FOR CALENDAR FIXTURES */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3.5 rounded-2xl border border-border bg-card/60">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search fixtures by player tag or club name..."
            className="pl-9 h-9 text-xs rounded-xl bg-background/80 w-full"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full md:w-auto">
          {/* Division Filter */}
          <select
            value={divisionFilter}
            onChange={(e) => setDivisionFilter(e.target.value)}
            className="h-9 px-3 text-xs rounded-xl bg-background/80 border border-border text-foreground font-medium focus:outline-none focus:border-primary w-full"
          >
            <option value="ALL">All Divisions</option>
            <option value="Division 1">Division 1</option>
            <option value="Division 2">Division 2</option>
            <option value="Division 3">Division 3</option>
            <option value="SUPER_CUP">UEFA Super Cup</option>
            <option value="UCL">UCL (Champions League)</option>
            <option value="EUROPA">Europa League</option>
          </select>

          {/* Round Filter */}
          <select
            value={roundFilter}
            onChange={(e) => setRoundFilter(e.target.value)}
            className="h-9 px-3 text-xs rounded-xl bg-background/80 border border-border text-foreground font-medium focus:outline-none focus:border-primary w-full"
          >
            <option value="ALL">All Rounds</option>
            {uniqueRounds.map((rnd) => (
              <option key={rnd} value={rnd}>
                {rnd}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 px-3 text-xs rounded-xl bg-background/80 border border-border text-foreground font-medium focus:outline-none focus:border-primary w-full"
          >
            <option value="ALL">All Statuses</option>
            <option value="SCHEDULED">Scheduled Only</option>
            <option value="LIVE">Live</option>
            <option value="FINISHED">Finished</option>
          </select>
        </div>
      </div>

      {/* CALENDAR FIXTURES LIST */}
      <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
        {fixtures.length === 0 ? (
          <div className="py-12 text-center space-y-2 border border-dashed border-border/80 rounded-2xl p-6">
            <Calendar className="h-8 w-8 mx-auto text-muted-foreground opacity-50" />
            <p className="text-xs text-muted-foreground font-mono">
              No match fixtures match the active search or filters.
            </p>
          </div>
        ) : (
          fixtures.map((fixture) => {
            const isSelected = currentMotw?.id === fixture.id;
            const isProcessing = publishingId === fixture.id;

            const homeTag = fixture.homePlayer?.gamerTag || "Home";
            const awayTag = fixture.awayPlayer?.gamerTag || "Away";
            const homeClub = findTeam(fixture.homePlayer?.realTeam)?.shortName || fixture.homePlayer?.realTeam || "Club";
            const awayClub = findTeam(fixture.awayPlayer?.realTeam)?.shortName || fixture.awayPlayer?.realTeam || "Club";

            const kickoffFormatted = `${formatRwandanDate(fixture.matchDate, {
              weekday: "short",
              month: "short",
              day: "numeric",
            })} at ${formatRwandanTime(fixture.matchDate)} (CAT)`;

            return (
              <div
                key={fixture.id}
                className={cn(
                  "flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-4 rounded-2xl border transition-all duration-150",
                  isSelected
                    ? "border-secondary/60 bg-secondary/10 shadow-sm"
                    : "border-border/70 bg-card/60 hover:bg-card hover:border-border"
                )}
              >
                {/* Left: Fixture Details */}
                <div className="space-y-1 min-w-0 lg:w-1/4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-bold text-primary">
                      {fixture.division}
                    </span>
                    <span className="text-xs font-mono text-muted-foreground">
                      • {fixture.round}
                    </span>
                    {isSelected && (
                      <span className="inline-flex items-center gap-1 text-xs font-mono font-bold text-secondary px-1.5 py-0.5 rounded bg-secondary/20">
                        <Sparkles className="h-2.5 w-2.5" />
                        <span>Active MOTW</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="truncate">{kickoffFormatted}</span>
                  </div>
                </div>

                {/* Center: Head-to-Head Clash */}
                <div className="flex items-center justify-between sm:justify-center gap-2 sm:gap-4 py-2 lg:py-0 flex-1 min-w-0">
                  {/* Home Athlete */}
                  <div className="flex items-center gap-2 text-right min-w-0 flex-1 sm:flex-initial sm:min-w-32 justify-end">
                    <div className="min-w-0 truncate">
                      <span className="text-xs sm:text-sm font-black text-foreground block truncate">
                        {homeTag}
                      </span>
                      <span className="text-xs text-muted-foreground block truncate">
                        {homeClub}
                      </span>
                    </div>
                    <div className="h-9 w-9 rounded-lg bg-background border border-border overflow-hidden flex items-center justify-center shrink-0">
                      <img
                        src={resolvePlayerAvatar(fixture.homePlayer)}
                        alt=""
                        className="h-full w-full object-contain"
                      />
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded bg-muted/60 text-muted-foreground font-mono text-xs font-bold shrink-0">
                    VS
                  </span>

                  {/* Away Athlete */}
                  <div className="flex items-center gap-2 text-left min-w-0 flex-1 sm:flex-initial sm:min-w-32 justify-start">
                    <div className="h-9 w-9 rounded-lg bg-background border border-border overflow-hidden flex items-center justify-center shrink-0">
                      <img
                        src={resolvePlayerAvatar(fixture.awayPlayer)}
                        alt=""
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <div className="min-w-0 truncate">
                      <span className="text-xs sm:text-sm font-black text-foreground block truncate">
                        {awayTag}
                      </span>
                      <span className="text-muted-foreground text-xs block truncate">
                        {awayClub}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: One-Click Action */}
                <div className="shrink-0 flex items-center justify-end w-full lg:w-auto pt-2 lg:pt-0 border-t border-border/50 lg:border-t-0">
                  {isSelected ? (
                    <Button
                      onClick={handleUnpublishMotw}
                      disabled={unpublishing}
                      variant="outline"
                      size="sm"
                      className="w-full lg:w-auto rounded-xl text-xs font-mono font-bold text-destructive hover:bg-destructive/15 border-destructive/40 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      <span>Remove</span>
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handlePublishMotw(fixture.id)}
                      disabled={isProcessing}
                      variant="yellow"
                      size="sm"
                      className="w-full lg:w-auto rounded-xl text-xs font-bold gap-1.5 shadow-sm cursor-pointer justify-center"
                    >
                      <Sparkles className="h-3 w-3 shrink-0" />
                      <span>{isProcessing ? "Publishing..." : "Publish MOTW"}</span>
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
