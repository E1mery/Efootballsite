"use client";

import { useState, useEffect } from "react";
import { X, Flame, Swords, Calendar, Trophy, ChevronRight, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { resolvePlayerAvatar, findTeam } from "@/lib/teams";
import type { ClubDerbyH2H, DerbyConfiguration, PlayerDerbyStats } from "@/lib/derbyCore";

interface HistoricalDerbyModalProps {
  isOpen: boolean;
  onClose: () => void;
  derbyId?: string;
  initialDerbyId?: string;
  playerId?: string;
  currentPlayerId?: string;
  currentPlayerGamerTag?: string;
  opponentPlayerId?: string;
}

export default function HistoricalDerbyModal({
  isOpen,
  onClose,
  derbyId,
  initialDerbyId,
  playerId,
  currentPlayerId,
  currentPlayerGamerTag,
  opponentPlayerId,
}: HistoricalDerbyModalProps) {
  const activeInitialDerbyId = initialDerbyId || derbyId;
  const activePlayerId = currentPlayerId || playerId;
  const [derbies, setDerbies] = useState<DerbyConfiguration[]>([]);
  const [selectedDerbyId, setSelectedDerbyId] = useState<string>(activeInitialDerbyId || "");
  const [h2hData, setH2hData] = useState<ClubDerbyH2H | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Player Opponent H2H State
  const [selectedOpponentId, setSelectedOpponentId] = useState<string>(opponentPlayerId || "");
  const [opponentH2H, setOpponentH2H] = useState<PlayerDerbyStats | null>(null);
  const [loadingOpponentH2H, setLoadingOpponentH2H] = useState(false);

  // Fetch all active derbies for dropdown
  useEffect(() => {
    if (!isOpen) return;

    fetch("/api/derbies")
      .then((res) => res.json())
      .then((data) => {
        const list: DerbyConfiguration[] = data.derbies || [];
        setDerbies(list);
        if (!selectedDerbyId && list.length > 0) {
          const matchInitial = activeInitialDerbyId ? list.find((d) => d.id === activeInitialDerbyId) : null;
          setSelectedDerbyId(matchInitial ? matchInitial.id : list[0].id);
        }
      })
      .catch((err) => console.error(err));
  }, [isOpen, activeInitialDerbyId]);

  // Fetch H2H for selected derby
  useEffect(() => {
    if (!isOpen || !selectedDerbyId) return;

    setLoading(true);
    setError(null);
    setOpponentH2H(null);
    if (!opponentPlayerId) {
      setSelectedOpponentId("");
    }

    fetch(`/api/derbies/h2h?derbyId=${selectedDerbyId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
          setH2hData(null);
        } else {
          setH2hData(data.h2h || null);
        }
      })
      .catch(() => setError("Failed to load historical derby records."))
      .finally(() => setLoading(false));
  }, [isOpen, selectedDerbyId, opponentPlayerId]);

  // Fetch player opponent H2H if opponent selected
  useEffect(() => {
    if (!activePlayerId || !selectedOpponentId || !selectedDerbyId) {
      setOpponentH2H(null);
      return;
    }

    setLoadingOpponentH2H(true);
    fetch(
      `/api/derbies/player-h2h?playerId=${activePlayerId}&opponentId=${selectedOpponentId}&derbyId=${selectedDerbyId}`
    )
      .then((res) => res.json())
      .then((data) => {
        setOpponentH2H(data.stats || null);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoadingOpponentH2H(false));
  }, [activePlayerId, selectedOpponentId, selectedDerbyId]);

  if (!isOpen) return null;

  const activeDerby = derbies.find((d) => d.id === selectedDerbyId) || h2hData?.derby;
  const club1Team = activeDerby ? findTeam(activeDerby.club1Id) : null;
  const club2Team = activeDerby ? findTeam(activeDerby.club2Id) : null;

  // Extract unique opponents from historical matches for player H2H inspection
  const opponentList = h2hData?.historicalMatches
    ? Array.from(
        new Map(
          h2hData.historicalMatches.flatMap((m) => [
            { gamerTag: m.homeGamerTag },
            { gamerTag: m.awayGamerTag },
          ])
          .filter((p) => p.gamerTag !== currentPlayerGamerTag)
          .map((p) => [p.gamerTag, p])
        ).values()
      )
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-background/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-3xl border border-border bg-card shadow-2xl p-4 sm:p-6 my-8 space-y-6 max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-4 gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary/15 text-secondary border border-secondary/30 shrink-0">
              <Flame className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-black uppercase text-foreground tracking-tight truncate">
                Historical Derby Records
              </h2>
              <p className="text-xs text-muted-foreground truncate">
                Official Rwanda eFootball League Club-Level Head-to-Head
              </p>
            </div>
          </div>

          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={onClose}
            className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Rivalry Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-muted-foreground uppercase">
            Select Official Rivalry
          </label>
          <select
            value={selectedDerbyId}
            onChange={(e) => setSelectedDerbyId(e.target.value)}
            className="w-full h-11 px-3.5 rounded-xl border border-border bg-background text-sm font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {derbies.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.club1Name} vs {d.club2Name})
              </option>
            ))}
          </select>
        </div>

        {/* Derby Showcase Banner */}
        {activeDerby && (
          <div className="rounded-2xl border border-secondary/30 bg-gradient-to-r from-card via-background to-card p-4 sm:p-5 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Club 1 */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-background border border-border p-2 flex items-center justify-center shrink-0">
                  <img
                    src={club1Team?.logo || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(activeDerby.club1Name)}`}
                    alt={activeDerby.club1Name}
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="min-w-0 text-left">
                  <h4 className="text-sm sm:text-base font-black text-foreground truncate">
                    {activeDerby.club1Name}
                  </h4>
                  <span className="text-xs font-mono text-muted-foreground">
                    {club1Team?.shortName || "Club 1"}
                  </span>
                </div>
              </div>

              {/* Center Rivalry Tag */}
              <div className="flex flex-col items-center gap-1 text-center shrink-0 px-2">
                <span className="text-xs font-mono font-bold text-secondary uppercase tracking-widest">
                  {activeDerby.isHistoricRivalry ? "HISTORIC RIVALRY" : "LOCAL DERBY"}
                </span>
                <span className="text-base sm:text-lg font-black text-foreground tracking-tight">
                  VS
                </span>
                <span className="text-xs font-mono text-muted-foreground">
                  {activeDerby.competition || "League"}
                </span>
              </div>

              {/* Club 2 */}
              <div className="flex items-center gap-3 min-w-0 sm:flex-row-reverse text-left sm:text-right">
                <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-background border border-border p-2 flex items-center justify-center shrink-0">
                  <img
                    src={club2Team?.logo || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(activeDerby.club2Name)}`}
                    alt={activeDerby.club2Name}
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm sm:text-base font-black text-foreground truncate">
                    {activeDerby.club2Name}
                  </h4>
                  <span className="text-xs font-mono text-muted-foreground">
                    {club2Team?.shortName || "Club 2"}
                  </span>
                </div>
              </div>
            </div>

            {activeDerby.description && (
              <p className="text-xs text-muted-foreground text-center mt-3 pt-3 border-t border-border/60">
                {activeDerby.description}
              </p>
            )}
          </div>
        )}

        {/* Loading / Error States */}
        {loading ? (
          <div className="py-12 text-center text-xs font-mono text-muted-foreground animate-pulse">
            Loading verified historical derby records...
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-xs text-destructive text-center">
            {error}
          </div>
        ) : !h2hData || h2hData.totalMeetings === 0 ? (
          <div className="p-8 sm:p-10 rounded-2xl border border-dashed border-border text-center space-y-2 bg-card/40">
            <Trophy className="h-8 w-8 text-muted-foreground mx-auto" />
            <h4 className="text-sm font-black uppercase text-foreground">
              No Confirmed Derby Matches Yet
            </h4>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              These two clubs have not met in a confirmed Rwanda eFootball League match. Historical records will track here automatically as fixtures are completed.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Club-Level All-Time Head-to-Head Record */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                All-Time Head-to-Head Record
              </span>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="p-3 rounded-xl bg-background/60 border border-border">
                  <span className="text-xs text-muted-foreground block uppercase font-bold">Meetings</span>
                  <span className="text-xl font-black font-mono text-foreground">{h2hData.totalMeetings}</span>
                </div>
                <div className="p-3 rounded-xl bg-background/60 border border-border">
                  <span className="text-xs text-muted-foreground block uppercase font-bold truncate">
                    {activeDerby?.club1Name.split(" ")[0] || "Club 1"} Wins
                  </span>
                  <span className="text-xl font-black font-mono text-secondary">{h2hData.club1Wins}</span>
                </div>
                <div className="p-3 rounded-xl bg-background/60 border border-border">
                  <span className="text-xs text-muted-foreground block uppercase font-bold">Draws</span>
                  <span className="text-xl font-black font-mono text-muted-foreground">{h2hData.draws}</span>
                </div>
                <div className="p-3 rounded-xl bg-background/60 border border-border">
                  <span className="text-xs text-muted-foreground block uppercase font-bold truncate">
                    {activeDerby?.club2Name.split(" ")[0] || "Club 2"} Wins
                  </span>
                  <span className="text-xl font-black font-mono text-primary">{h2hData.club2Wins}</span>
                </div>
              </div>
            </div>

            {/* Latest Confirmed Meeting */}
            {h2hData.latestMeeting && (
              <div className="p-4 rounded-xl bg-background/70 border border-border space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-bold uppercase text-secondary">Latest Confirmed Meeting</span>
                  <span className="font-mono">{new Date(h2hData.latestMeeting.date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center justify-between gap-2 pt-1">
                  <div className="text-left min-w-0">
                    <span className="text-sm font-extrabold text-foreground truncate block">
                      @{h2hData.latestMeeting.homeGamerTag} ({h2hData.latestMeeting.homeTeam})
                    </span>
                  </div>
                  <div className="px-3 py-1 rounded-lg bg-card border border-border font-mono text-base font-black text-secondary">
                    {h2hData.latestMeeting.homeScore} : {h2hData.latestMeeting.awayScore}
                  </div>
                  <div className="text-right min-w-0">
                    <span className="text-sm font-extrabold text-foreground truncate block">
                      @{h2hData.latestMeeting.awayGamerTag} ({h2hData.latestMeeting.awayTeam})
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Individual Player Opponent Derby Inspection (STRICT: NO WIN RATE) */}
            {currentPlayerId && opponentList.length > 0 && (
              <div className="space-y-3 p-4 rounded-2xl bg-card/60 border border-border/80">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-black uppercase text-foreground tracking-wider">
                      Your Derby Performance vs Specific Opponents
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Inspect your personal derby record against another league athlete.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={selectedOpponentId}
                    onChange={(e) => setSelectedOpponentId(e.target.value)}
                    className="h-10 px-3 rounded-xl border border-border bg-background text-xs font-bold text-foreground w-full"
                  >
                    <option value="">-- Choose Opponent --</option>
                    {opponentList.map((opp) => (
                      <option key={opp.gamerTag} value={opp.gamerTag}>
                        @{opp.gamerTag}
                      </option>
                    ))}
                  </select>
                </div>

                {loadingOpponentH2H ? (
                  <p className="text-xs text-muted-foreground italic">Loading personal record...</p>
                ) : opponentH2H ? (
                  <div className="grid grid-cols-4 gap-2 text-center pt-1">
                    <div className="p-2 rounded-lg bg-background border border-border">
                      <span className="text-xs text-muted-foreground block font-bold uppercase">Played</span>
                      <span className="text-base font-mono font-black text-foreground">{opponentH2H.matchesPlayed}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-background border border-border">
                      <span className="text-xs text-muted-foreground block font-bold uppercase">Wins</span>
                      <span className="text-base font-mono font-black text-secondary">{opponentH2H.wins}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-background border border-border">
                      <span className="text-xs text-muted-foreground block font-bold uppercase">Draws</span>
                      <span className="text-base font-mono font-black text-muted-foreground">{opponentH2H.draws}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-background border border-border">
                      <span className="text-xs text-muted-foreground block font-bold uppercase">Defeats</span>
                      <span className="text-base font-mono font-black text-destructive">{opponentH2H.defeats}</span>
                    </div>
                  </div>
                ) : null}
              </div>
            )}

            {/* Historical Matches List */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                Match History ({h2hData.historicalMatches.length})
              </span>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {h2hData.historicalMatches.map((m) => (
                  <div
                    key={m.id}
                    className="p-3 rounded-xl bg-background/50 border border-border flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <span className="font-mono text-muted-foreground text-xs block">
                        {m.season} • {m.round}
                      </span>
                      <div className="flex items-center gap-1.5 font-bold text-foreground mt-0.5 truncate">
                        <span>@{m.homeGamerTag} ({m.homeClub})</span>
                        <span className="text-muted-foreground">vs</span>
                        <span>@{m.awayGamerTag} ({m.awayClub})</span>
                      </div>
                    </div>
                    <div className="px-3 py-1 rounded-lg bg-card border border-border font-mono text-sm font-black text-secondary shrink-0">
                      {m.homeScore} : {m.awayScore}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="rounded-xl text-xs font-bold"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
