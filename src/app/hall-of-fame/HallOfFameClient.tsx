"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Crown,
  Trophy,
  Award,
  Search,
  Calendar,
  User,
  Medal,
  Sparkles,
  ArrowRight,
  Shield,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import HallOfFameCarousel, { HallOfFameEntry } from "@/components/HallOfFameCarousel";

interface HallOfFameClientProps {
  entries: HallOfFameEntry[];
}

export default function HallOfFameClient({ entries = [] }: HallOfFameClientProps) {
  const [selectedSeason, setSelectedSeason] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Extract distinct seasons
  const seasons = useMemo(() => {
    const list = Array.from(new Set(entries.map((e) => e.season).filter(Boolean)));
    return ["ALL", ...list];
  }, [entries]);

  // Filtered entries
  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const matchSeason = selectedSeason === "ALL" || entry.season === selectedSeason;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        entry.championName.toLowerCase().includes(q) ||
        (entry.championRealName && entry.championRealName.toLowerCase().includes(q)) ||
        entry.tournamentName.toLowerCase().includes(q) ||
        entry.season.toLowerCase().includes(q);

      return matchSeason && matchQuery;
    });
  }, [entries, selectedSeason, searchQuery]);

  return (
    <div className="space-y-12">
      {/* Hero Showcase / Carousel */}
      <section className="space-y-4">
        <HallOfFameCarousel entries={entries} />
      </section>

      {/* Immortalized Champions Roster Archive */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-secondary" />
              <h2 className="text-xl font-black uppercase text-foreground tracking-tight">
                All-Time Champions Registry
              </h2>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Browse all inducted titleholders, champions, and tournament winners across seasons.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-muted-foreground">
              Total Inductees:
            </span>
            <Badge variant="yellow" className="text-xs font-mono font-black">
              {entries.length}
            </Badge>
          </div>
        </div>

        {/* Filters and Search Bar */}
        {entries.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            {/* Season Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {seasons.map((season) => (
                <button
                  key={season}
                  type="button"
                  onClick={() => setSelectedSeason(season)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    selectedSeason === season
                      ? "bg-secondary text-secondary-foreground shadow-sm"
                      : "bg-card/80 border border-border text-foreground hover:bg-card hover:border-secondary/30"
                  }`}
                >
                  {season === "ALL" ? "All Seasons" : season}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative min-w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search athlete, title..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs bg-card/80 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-secondary/50 transition-colors"
              />
            </div>
          </div>
        )}

        {/* Champions Grid */}
        {filteredEntries.length === 0 ? (
          <div className="rounded-2xl border border-border/80 bg-card/50 p-8 text-center backdrop-blur-sm">
            <Crown className="h-8 w-8 text-secondary/40 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">
              {entries.length === 0 ? "No Champions Inducted Yet" : "No Matching Champions"}
            </h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              {entries.length === 0
                ? "Championship athletes across Division 1, Division 2, Division 3, UCL, and Europa League will be immortalized here."
                : "Try adjusting your search query or season filter to find inducted champions."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredEntries.map((entry) => (
              <div
                key={entry.id}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card/80 hover:border-secondary/40 p-5 backdrop-blur-md transition-all shadow-lg flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Top Bar: Season and Trophy Type */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono font-bold text-secondary uppercase tracking-wider">
                      {entry.season}
                    </span>
                    <span className="text-xs font-mono font-bold text-muted-foreground uppercase flex items-center gap-1">
                      <Trophy className="h-3 w-3 text-secondary" />
                      {entry.trophyType === "UCL"
                        ? "UCL Champion"
                        : entry.trophyType === "EUROPA"
                        ? "Europa Champion"
                        : "League Title"}
                    </span>
                  </div>

                  {/* Player Image and Main Profile */}
                  <div className="flex items-center gap-3.5">
                    <div className="relative h-16 w-16 sm:h-20 sm:w-20 rounded-2xl overflow-hidden bg-muted/60 border border-secondary/30 shrink-0 flex items-center justify-center">
                      {entry.playerImage ? (
                        <img
                          src={entry.playerImage}
                          alt={entry.championName}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <User className="h-8 w-8 text-secondary/60" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <Crown className="h-4 w-4 text-secondary shrink-0" />
                        <h3 className="text-base sm:text-lg font-black text-foreground truncate">
                          {entry.championName}
                        </h3>
                      </div>
                      {entry.championRealName && (
                        <p className="text-xs font-medium text-muted-foreground truncate mt-0.5">
                          {entry.championRealName}
                        </p>
                      )}
                      <p className="text-xs font-semibold text-secondary truncate mt-1">
                        {entry.tournamentName}
                      </p>
                    </div>
                  </div>

                  {/* Details box */}
                  <div className="p-3 rounded-xl bg-muted/40 border border-border/80 space-y-1.5 text-xs font-mono">
                    {entry.prizeWon && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Prize:</span>
                        <span className="font-bold text-foreground truncate max-w-48 text-right">
                          {entry.prizeWon}
                        </span>
                      </div>
                    )}
                    {entry.runnerUp && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Runner-up:</span>
                        <span className="font-bold text-muted-foreground truncate max-w-48 text-right">
                          {entry.runnerUp}
                        </span>
                      </div>
                    )}
                    {entry.notes && (
                      <div className="pt-1 border-t border-border/60 text-xs text-muted-foreground italic font-sans line-clamp-2">
                        &quot;{entry.notes}&quot;
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer date */}
                <div className="pt-3 mt-3 border-t border-border flex items-center justify-between text-xs font-mono text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-secondary" />
                    {new Date(entry.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      year: "numeric",
                      timeZone: "Africa/Kigali",
                    })}
                  </span>
                  <span className="text-secondary font-bold text-xs uppercase">
                    Hall of Fame
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Community Call to Action */}
      <section className="rounded-2xl border border-secondary/25 bg-gradient-to-r from-card via-card/90 to-card p-6 sm:p-8 backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-center sm:text-left">
          <h3 className="text-lg font-black text-foreground uppercase tracking-tight flex items-center justify-center sm:justify-start gap-2">
            <Sparkles className="h-4 w-4 text-secondary" />
            Cement Your Esports Legacy
          </h3>
          <p className="text-xs text-muted-foreground max-w-xl">
            Compete in official Rwandan eFootball divisions, advance to continental UCL and Europa tournaments, and earn your place among immortalized champions.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/standings"
            className="px-4 py-2 rounded-xl text-xs font-bold bg-card border border-border text-foreground hover:bg-muted transition-colors flex items-center gap-1.5"
          >
            <Shield className="h-3.5 w-3.5 text-primary" />
            <span>View Standings</span>
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 rounded-xl text-xs font-bold bg-secondary text-secondary-foreground hover:opacity-90 transition-opacity flex items-center gap-1.5"
          >
            <span>Join Season</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
