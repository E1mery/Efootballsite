"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Flame,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Sparkles,
  Share2,
  Tv,
  Calendar,
  Search,
  Filter,
  RefreshCw,
  Trophy,
  Users,
  Shield,
  Clock,
  Swords,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ALL_REAL_TEAMS, findTeam } from "@/lib/teams";
import type { DerbyConfiguration, PlayerDerbyStats, ClubDerbyH2H } from "@/lib/derbyCore";
import HistoricalDerbyModal from "@/components/competitions/HistoricalDerbyModal";

interface DerbyWithMatches extends DerbyConfiguration {
  matchedFixturesCount?: number;
  bothClubsAvailable?: boolean;
}

interface AdminDerbyManagerProps {
  matches?: any[];
  onRefresh?: () => void;
}

export default function AdminDerbyManager({ matches, onRefresh }: AdminDerbyManagerProps) {
  const [derbies, setDerbies] = useState<DerbyWithMatches[]>([]);
  const [fixtures, setFixtures] = useState<any[]>(matches || []);
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<"REGISTRY" | "FIXTURES" | "PLAYER_STATS">("REGISTRY");

  // Filters & Search
  const [search, setSearch] = useState("");
  const [leagueFilter, setLeagueFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Action / Feedback Message
  const [actionMessage, setActionMessage] = useState<{ text: string; error?: boolean } | null>(null);

  // Modal / Form state
  const [showModal, setShowModal] = useState(false);
  const [editingDerby, setEditingDerby] = useState<DerbyWithMatches | null>(null);
  const [formName, setFormName] = useState("");
  const [formShortName, setFormShortName] = useState("");
  const [formClub1Id, setFormClub1Id] = useState("");
  const [formClub2Id, setFormClub2Id] = useState("");
  const [formCompetition, setFormCompetition] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formIsHistoric, setFormIsHistoric] = useState(false);
  const [formPriority, setFormPriority] = useState(10);
  const [formIsActive, setFormIsActive] = useState(true);
  const [formAutoSocial, setFormAutoSocial] = useState(false);
  const [formAutoCarousel, setFormAutoCarousel] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Publishing State
  const [publishingCarouselId, setPublishingCarouselId] = useState<string | null>(null);
  const [publishingSocialId, setPublishingSocialId] = useState<string | null>(null);

  // Historical Derby Modal
  const [h2hModalDerbyId, setH2hModalDerbyId] = useState<string | null>(null);

  // Player Derby Records State
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>("");
  const [selectedPlayerStats, setSelectedPlayerStats] = useState<PlayerDerbyStats | null>(null);
  const [loadingPlayerStats, setLoadingPlayerStats] = useState(false);

  // Sync fixtures when matches prop updates
  useEffect(() => {
    if (matches && matches.length > 0) {
      setFixtures(matches);
    }
  }, [matches]);

  // Fetch Derbies & Data
  const fetchData = useCallback(async () => {
    setLoading(true);
    setActionMessage(null);
    try {
      const [derbiesRes, fixturesRes] = await Promise.all([
        fetch("/api/admin/derbies"),
        fetch("/api/matches"),
      ]);

      if (derbiesRes.ok) {
        const derbiesData = await derbiesRes.json().catch(() => null);
        if (derbiesData?.derbies) {
          setDerbies(derbiesData.derbies);
        } else if (derbiesData?.error) {
          setActionMessage({ text: derbiesData.error, error: true });
        }
      } else {
        const errData = await derbiesRes.json().catch(() => null);
        setActionMessage({
          text: errData?.error || `Failed to load derby records (Status ${derbiesRes.status}).`,
          error: true,
        });
      }

      if (fixturesRes.ok) {
        const fixturesData = await fixturesRes.json().catch(() => null);
        if (fixturesData?.matches) {
          setFixtures(fixturesData.matches);
        }
      }
    } catch (err: any) {
      setActionMessage({ text: err.message || "Failed to load derby records.", error: true });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Load registered players for player derby records tab
  useEffect(() => {
    if (activeSubTab === "PLAYER_STATS" && players.length === 0) {
      if (fixtures.length > 0) {
        const playerMap = new Map<string, { id: string; gamerTag: string; realTeam?: string }>();
        fixtures.forEach((m: any) => {
          if (m.homePlayer) playerMap.set(m.homePlayer.id, m.homePlayer);
          if (m.awayPlayer) playerMap.set(m.awayPlayer.id, m.awayPlayer);
        });
        setPlayers(Array.from(playerMap.values()));
        return;
      }

      fetch("/api/matches")
        .then(async (res) => {
          if (!res.ok) return null;
          return res.json().catch(() => null);
        })
        .then((data) => {
          if (data?.matches) {
            const playerMap = new Map<string, { id: string; gamerTag: string; realTeam?: string }>();
            data.matches.forEach((m: any) => {
              if (m.homePlayer) playerMap.set(m.homePlayer.id, m.homePlayer);
              if (m.awayPlayer) playerMap.set(m.awayPlayer.id, m.awayPlayer);
            });
            setPlayers(Array.from(playerMap.values()));
          }
        })
        .catch(() => {});
    }
  }, [activeSubTab, players.length, fixtures]);

  // Fetch Player Derby Stats (STRICT: NO WIN RATE)
  useEffect(() => {
    if (!selectedPlayerId) {
      setSelectedPlayerStats(null);
      return;
    }

    setLoadingPlayerStats(true);
    fetch(`/api/player/profile?playerId=${selectedPlayerId}`)
      .then(async (res) => {
        if (!res.ok) return null;
        return res.json().catch(() => null);
      })
      .then((data) => {
        if (data?.derbyStats) {
          setSelectedPlayerStats(data.derbyStats);
        } else {
          // Compute on the fly from confirmed matches
          const playerMatches = fixtures.filter(
            (m) =>
              (m.homePlayerId === selectedPlayerId || m.awayPlayerId === selectedPlayerId) &&
              (m.status === "FINISHED" || m.status === "FORFEIT") &&
              (m.isDerby || (m.homePlayer?.realTeam && m.awayPlayer?.realTeam))
          );

          let p = 0, w = 0, d = 0, def = 0;
          for (const m of playerMatches) {
            if (!m.isDerby && !m.derbyName) continue;
            p += 1;
            const isHome = m.homePlayerId === selectedPlayerId;
            const myScore = isHome ? (m.homeScore ?? 0) : (m.awayScore ?? 0);
            const oppScore = isHome ? (m.awayScore ?? 0) : (m.homeScore ?? 0);
            if (myScore > oppScore) w += 1;
            else if (myScore < oppScore) def += 1;
            else d += 1;
          }
          setSelectedPlayerStats({ matchesPlayed: p, wins: w, draws: d, defeats: def });
        }
      })
      .catch(() => {})
      .finally(() => setLoadingPlayerStats(false));
  }, [selectedPlayerId, fixtures]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingDerby(null);
    setFormName("");
    setFormShortName("");
    setFormClub1Id(ALL_REAL_TEAMS[0]?.id || "");
    setFormClub2Id(ALL_REAL_TEAMS[1]?.id || "");
    setFormCompetition("Premier League");
    setFormDescription("");
    setFormImageUrl("/images/motw-stadium-bg.jpg");
    setFormIsHistoric(false);
    setFormPriority(10);
    setFormIsActive(true);
    setFormAutoSocial(false);
    setFormAutoCarousel(false);
    setShowModal(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (derby: DerbyWithMatches) => {
    setEditingDerby(derby);
    setFormName(derby.name);
    setFormShortName(derby.shortName);
    setFormClub1Id(derby.club1Id);
    setFormClub2Id(derby.club2Id);
    setFormCompetition(derby.competition || "");
    setFormDescription(derby.description || "");
    setFormImageUrl(derby.imageUrl || "/images/motw-stadium-bg.jpg");
    setFormIsHistoric(Boolean(derby.isHistoricRivalry));
    setFormPriority(derby.priority);
    setFormIsActive(derby.isActive);
    setFormAutoSocial(Boolean(derby.autoPublishSocial));
    setFormAutoCarousel(Boolean(derby.autoPublishCarousel));
    setShowModal(true);
  };

  // Save / Submit Derby
  const handleSaveDerby = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      alert("Derby name is required.");
      return;
    }
    if (formClub1Id === formClub2Id) {
      alert("Please select two distinct clubs.");
      return;
    }

    setSubmitting(true);
    setActionMessage(null);

    const payload = {
      name: formName.trim(),
      shortName: formShortName.trim() || formName.trim(),
      club1Id: formClub1Id,
      club2Id: formClub2Id,
      competition: formCompetition.trim() || null,
      description: formDescription.trim() || null,
      imageUrl: formImageUrl.trim() || "/images/motw-stadium-bg.jpg",
      isHistoricRivalry: formIsHistoric,
      priority: Number(formPriority),
      isActive: formIsActive,
      autoPublishSocial: formAutoSocial,
      autoPublishCarousel: formAutoCarousel,
    };

    try {
      const url = editingDerby ? `/api/admin/derbies/${editingDerby.id}` : "/api/admin/derbies";
      const method = editingDerby ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || `Failed to save derby (Status ${res.status}).`);

      setActionMessage({ text: data?.message || "Derby configuration saved successfully!" });
      setShowModal(false);
      fetchData();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setActionMessage({ text: err.message || "Error saving derby.", error: true });
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle Active
  const handleToggleActive = async (derby: DerbyWithMatches) => {
    try {
      const res = await fetch(`/api/admin/derbies/${derby.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !derby.isActive }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || `Failed to update derby status (Status ${res.status}).`);

      setDerbies((prev) =>
        prev.map((d) => (d.id === derby.id ? { ...d, isActive: !derby.isActive } : d))
      );
      setActionMessage({
        text: `Derby "${derby.name}" is now ${!derby.isActive ? "ACTIVE" : "INACTIVE"}.`,
      });
    } catch (err: any) {
      setActionMessage({ text: err.message || "Failed to toggle status.", error: true });
    }
  };

  // Delete Derby
  const handleDeleteDerby = async (derby: DerbyWithMatches) => {
    if (!confirm(`Are you sure you want to remove the derby configuration "${derby.name}"? Historical fixtures will be safely preserved.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/derbies/${derby.id}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || `Failed to delete derby (Status ${res.status}).`);

      setActionMessage({ text: data?.message || "Derby configuration deleted." });
      setDerbies((prev) => prev.filter((d) => d.id !== derby.id));
    } catch (err: any) {
      setActionMessage({ text: err.message || "Error deleting derby.", error: true });
    }
  };

  // Publish to Carousel
  const handlePublishCarousel = async (matchId: string) => {
    setPublishingCarouselId(matchId);
    setActionMessage(null);
    try {
      const res = await fetch("/api/admin/derbies/publish-carousel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || `Failed to publish carousel slide (Status ${res.status}).`);

      setActionMessage({ text: data?.message || "Derby published to carousel slide!" });
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setActionMessage({ text: err.message || "Error publishing carousel.", error: true });
    } finally {
      setPublishingCarouselId(null);
    }
  };

  // Publish to Social Feed
  const handlePublishSocial = async (matchId: string) => {
    setPublishingSocialId(matchId);
    setActionMessage(null);
    try {
      const res = await fetch("/api/admin/derbies/publish-social", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || `Failed to publish social announcement (Status ${res.status}).`);

      setActionMessage({ text: data?.message || "Derby announcement posted to social feed!" });
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setActionMessage({ text: err.message || "Error publishing social post.", error: true });
    } finally {
      setPublishingSocialId(null);
    }
  };

  // Filtered derbies
  const filteredDerbies = useMemo(() => {
    return derbies.filter((d) => {
      const matchesSearch =
        !search.trim() ||
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.club1Name.toLowerCase().includes(search.toLowerCase()) ||
        d.club2Name.toLowerCase().includes(search.toLowerCase());

      const matchesLeague =
        leagueFilter === "ALL" ||
        (d.competition && d.competition.toLowerCase().includes(leagueFilter.toLowerCase()));

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && d.isActive) ||
        (statusFilter === "INACTIVE" && !d.isActive);

      return matchesSearch && matchesLeague && matchesStatus;
    });
  }, [derbies, search, leagueFilter, statusFilter]);

  // Recognized fixtures
  const recognizedFixtures = useMemo(() => {
    return fixtures.filter((f) => Boolean(f.isDerby || f.derbyName));
  }, [fixtures]);

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Hub */}
      <div className="rounded-3xl border border-secondary/30 bg-card/80 p-5 sm:p-6 backdrop-blur-xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-12 w-12 rounded-2xl bg-secondary/15 border border-secondary/30 flex items-center justify-center text-secondary shrink-0">
            <Flame className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-xl font-black uppercase text-foreground tracking-tight">
                Official Derby Recognition System
              </h2>
              <Badge variant="yellow" className="text-xs font-black uppercase">
                Central Registry
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 max-w-xl">
              Automatic real-world rivalry recognition across match calendar, carousel, social feed, Match of the Day, and historical head-to-head records.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-start md:self-center">
          <Button
            type="button"
            onClick={fetchData}
            variant="outline"
            size="sm"
            disabled={loading}
            className="rounded-xl border-border text-xs font-bold gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>

          <Button
            type="button"
            onClick={handleOpenCreate}
            size="sm"
            className="rounded-xl font-black text-xs gap-1.5 bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-md"
          >
            <Plus className="h-4 w-4" />
            <span>Add Rivalry</span>
          </Button>
        </div>
      </div>

      {/* Action / Feedback Alert */}
      {actionMessage && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between gap-2 ${
            actionMessage.error
              ? "bg-destructive/10 border-destructive/30 text-destructive"
              : "bg-secondary/15 border-secondary/30 text-secondary"
          }`}
        >
          <span>{actionMessage.text}</span>
          <button
            type="button"
            onClick={() => setActionMessage(null)}
            className="p-1 text-muted-foreground hover:text-foreground"
          >
            <XCircle className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveSubTab("REGISTRY")}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 ${
            activeSubTab === "REGISTRY"
              ? "bg-secondary text-secondary-foreground shadow-md"
              : "text-muted-foreground hover:text-foreground hover:bg-card"
          }`}
        >
          <Flame className="h-3.5 w-3.5" />
          <span>Configured Derbies ({derbies.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("FIXTURES")}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 ${
            activeSubTab === "FIXTURES"
              ? "bg-secondary text-secondary-foreground shadow-md"
              : "text-muted-foreground hover:text-foreground hover:bg-card"
          }`}
        >
          <Calendar className="h-3.5 w-3.5" />
          <span>Recognized Fixtures ({recognizedFixtures.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("PLAYER_STATS")}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 ${
            activeSubTab === "PLAYER_STATS"
              ? "bg-secondary text-secondary-foreground shadow-md"
              : "text-muted-foreground hover:text-foreground hover:bg-card"
          }`}
        >
          <Users className="h-3.5 w-3.5" />
          <span>Player Derby Records</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: CONFIGURED DERBIES REGISTRY */}
      {/* ========================================================================= */}
      {activeSubTab === "REGISTRY" && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-card/60 border border-border">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search derbies or clubs..."
                className="pl-9 h-9 text-xs rounded-xl border-border bg-background"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={leagueFilter}
                onChange={(e) => setLeagueFilter(e.target.value)}
                className="h-9 px-3 rounded-xl border border-border bg-background text-xs font-semibold text-foreground focus:outline-none"
              >
                <option value="ALL">All Competitions</option>
                <option value="Premier League">Premier League</option>
                <option value="La Liga">La Liga</option>
                <option value="Serie A">Serie A</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 px-3 rounded-xl border border-border bg-background text-xs font-semibold text-foreground focus:outline-none"
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active Only</option>
                <option value="INACTIVE">Inactive Only</option>
              </select>
            </div>
          </div>

          {/* Derbies Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDerbies.map((derby) => {
              const team1 = findTeam(derby.club1Id);
              const team2 = findTeam(derby.club2Id);

              return (
                <div
                  key={derby.id}
                  className={`rounded-2xl border p-4 space-y-3.5 transition-all bg-card/70 flex flex-col justify-between ${
                    derby.isActive ? "border-border hover:border-secondary/50 shadow-md" : "border-border/60 opacity-75"
                  }`}
                >
                  <div className="space-y-2.5">
                    {/* Header: Title, Category & Active Status */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-muted-foreground uppercase block font-mono">
                          {derby.competition || "League"} • Priority {derby.priority}
                        </span>
                        <h3 className="text-base font-black text-foreground uppercase tracking-tight truncate mt-0.5">
                          {derby.name}
                        </h3>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {derby.isHistoricRivalry && (
                          <Badge variant="secondary" className="text-xs uppercase font-mono">
                            Historic
                          </Badge>
                        )}
                        <Badge
                          variant={derby.isActive ? "green" : "outline"}
                          className="text-xs uppercase font-mono"
                        >
                          {derby.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>

                    {/* Participating Clubs Matchup Showcase */}
                    <div className="p-3 rounded-xl bg-background/60 border border-border flex items-center justify-between gap-2">
                      {/* Club 1 */}
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="h-9 w-9 rounded-xl bg-card border border-border p-1 flex items-center justify-center shrink-0">
                          <img
                            src={team1?.logo || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(derby.club1Name)}`}
                            alt={derby.club1Name}
                            className="h-full w-full object-contain"
                          />
                        </div>
                        <span className="text-xs font-extrabold text-foreground truncate">
                          {derby.club1Name}
                        </span>
                      </div>

                      <span className="text-xs font-mono font-black text-secondary px-1.5 shrink-0">
                        VS
                      </span>

                      {/* Club 2 */}
                      <div className="flex items-center gap-2 min-w-0 flex-1 justify-end text-right">
                        <span className="text-xs font-extrabold text-foreground truncate">
                          {derby.club2Name}
                        </span>
                        <div className="h-9 w-9 rounded-xl bg-card border border-border p-1 flex items-center justify-center shrink-0">
                          <img
                            src={team2?.logo || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(derby.club2Name)}`}
                            alt={derby.club2Name}
                            className="h-full w-full object-contain"
                          />
                        </div>
                      </div>
                    </div>

                    {derby.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {derby.description}
                      </p>
                    )}

                    {!derby.bothClubsAvailable && (
                      <div className="p-2 rounded-lg bg-secondary/10 border border-secondary/20 text-xs text-secondary">
                        ⚠️ One or both clubs are not currently registered in the league.
                      </div>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-2 border-t border-border/80 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setH2hModalDerbyId(derby.id)}
                        className="h-8 px-2.5 rounded-lg text-xs font-bold gap-1 text-secondary hover:text-secondary-foreground hover:bg-secondary"
                        title="View Historical H2H"
                      >
                        <Trophy className="h-3.5 w-3.5" />
                        <span>H2H</span>
                      </Button>

                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggleActive(derby)}
                        className="h-8 px-2 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground"
                      >
                        {derby.isActive ? "Deactivate" : "Activate"}
                      </Button>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => handleOpenEdit(derby)}
                        className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-foreground"
                        title="Edit Configuration"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>

                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteDerby(derby)}
                        className="h-8 w-8 p-0 rounded-lg text-destructive hover:bg-destructive/10"
                        title="Delete Configuration"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: RECOGNIZED FIXTURES IN MATCH CALENDAR */}
      {/* ========================================================================= */}
      {activeSubTab === "FIXTURES" && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-card/60 border border-border flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black uppercase text-foreground">
                Matches Automatically Identified as Derbies ({recognizedFixtures.length})
              </h3>
              <p className="text-xs text-muted-foreground">
                These league fixtures match an active official derby configuration. Administrators can publish them directly to the carousel or social feed.
              </p>
            </div>
          </div>

          {recognizedFixtures.length === 0 ? (
            <div className="p-8 rounded-2xl border border-dashed border-border text-center space-y-2 bg-card/40">
              <Calendar className="h-8 w-8 text-muted-foreground mx-auto" />
              <h4 className="text-sm font-black uppercase text-foreground">
                No Derby Fixtures Currently Scheduled
              </h4>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                When registered athletes with matching derby clubs meet in any league division, they will be recognized here automatically.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recognizedFixtures.map((fixture) => (
                <div
                  key={fixture.id}
                  className="rounded-2xl border border-border bg-card/70 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-black uppercase text-secondary font-mono flex items-center gap-1">
                        <Flame className="h-3 w-3 text-secondary" />
                        <span>{fixture.derbyName || "Official Derby"}</span>
                      </span>
                      <span className="text-xs font-mono text-muted-foreground">
                        • {fixture.division} • {fixture.round}
                      </span>
                      <Badge variant="outline" className="text-xs font-mono">
                        {fixture.status}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-3 pt-1">
                      <span className="text-sm font-black text-white">
                        @{fixture.homePlayer?.gamerTag} ({fixture.homePlayer?.realTeam})
                      </span>
                      <span className="text-xs font-bold text-muted-foreground font-mono">VS</span>
                      <span className="text-sm font-black text-white">
                        @{fixture.awayPlayer?.gamerTag} ({fixture.awayPlayer?.realTeam})
                      </span>
                    </div>

                    <p className="text-xs font-mono text-muted-foreground">
                      Kickoff: {new Date(fixture.matchDate).toLocaleString()}
                    </p>
                  </div>

                  {/* Quick Publication Actions */}
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={publishingCarouselId === fixture.id}
                      onClick={() => handlePublishCarousel(fixture.id)}
                      className="rounded-xl border-border text-xs font-bold gap-1.5 hover:bg-card"
                    >
                      <Tv className="h-3.5 w-3.5 text-secondary" />
                      <span>{publishingCarouselId === fixture.id ? "Publishing..." : "To Carousel"}</span>
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={publishingSocialId === fixture.id}
                      onClick={() => handlePublishSocial(fixture.id)}
                      className="rounded-xl border-border text-xs font-bold gap-1.5 hover:bg-card"
                    >
                      <Share2 className="h-3.5 w-3.5 text-primary" />
                      <span>{publishingSocialId === fixture.id ? "Posting..." : "To Social Feed"}</span>
                    </Button>

                    <a
                      href={`/fixtures?highlight=${fixture.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-card"
                      title="Open in Match Calendar"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: PLAYER DERBY RECORDS INSPECTION (NO WIN RATE) */}
      {/* ========================================================================= */}
      {activeSubTab === "PLAYER_STATS" && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-card/60 border border-border flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black uppercase text-foreground">
                Player Derby Performance Records (Strict League Counting)
              </h3>
              <p className="text-xs text-muted-foreground">
                Official verified records: Matches Played, Wins, Draws, Defeats. Strictly excludes derby win rates or percentages.
              </p>
            </div>
          </div>

          <div className="max-w-md space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase">
              Select League Athlete
            </label>
            <select
              value={selectedPlayerId}
              onChange={(e) => setSelectedPlayerId(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl border border-border bg-background text-sm font-semibold text-foreground focus:outline-none"
            >
              <option value="">-- Choose Athlete --</option>
              {players.map((p) => (
                <option key={p.id} value={p.id}>
                  @{p.gamerTag} {p.realTeam ? `(${p.realTeam})` : ""}
                </option>
              ))}
            </select>
          </div>

          {loadingPlayerStats ? (
            <div className="py-8 text-center text-xs font-mono text-muted-foreground animate-pulse">
              Calculating verified player derby performance...
            </div>
          ) : selectedPlayerStats ? (
            <div className="p-5 rounded-2xl border border-border bg-card/70 space-y-4 max-w-xl">
              <div className="border-b border-border pb-3">
                <span className="text-xs font-mono text-secondary font-bold uppercase">
                  OFFICIAL DERBY RECORD
                </span>
                <h4 className="text-base font-black text-foreground">
                  @{players.find((p) => p.id === selectedPlayerId)?.gamerTag}
                </h4>
              </div>

              {/* 4 Permitted Statistics (NO WIN RATE) */}
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="p-3 rounded-xl bg-background/60 border border-border">
                  <span className="text-xs text-muted-foreground uppercase font-bold block">Played</span>
                  <span className="text-xl font-black font-mono text-foreground">{selectedPlayerStats.matchesPlayed}</span>
                </div>
                <div className="p-3 rounded-xl bg-background/60 border border-border">
                  <span className="text-xs text-muted-foreground uppercase font-bold block">Wins</span>
                  <span className="text-xl font-black font-mono text-secondary">{selectedPlayerStats.wins}</span>
                </div>
                <div className="p-3 rounded-xl bg-background/60 border border-border">
                  <span className="text-xs text-muted-foreground uppercase font-bold block">Draws</span>
                  <span className="text-xl font-black font-mono text-muted-foreground">{selectedPlayerStats.draws}</span>
                </div>
                <div className="p-3 rounded-xl bg-background/60 border border-border">
                  <span className="text-xs text-muted-foreground uppercase font-bold block">Defeats</span>
                  <span className="text-xl font-black font-mono text-destructive">{selectedPlayerStats.defeats}</span>
                </div>
              </div>

              {selectedPlayerStats.matchesPlayed === 0 && (
                <p className="text-xs text-muted-foreground italic text-center">
                  This athlete has not participated in any confirmed derby matches yet.
                </p>
              )}
            </div>
          ) : (
            <div className="p-8 rounded-2xl border border-dashed border-border text-center text-xs text-muted-foreground">
              Select an athlete from the dropdown above to inspect their verified derby performance.
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE / EDIT DERBY CONFIGURATION */}
      {/* ========================================================================= */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-background/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-xl rounded-3xl border border-border bg-card shadow-2xl p-5 sm:p-6 my-8 space-y-5 max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-black uppercase text-foreground">
                {editingDerby ? "Edit Derby Configuration" : "Create Official Rivalry"}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1 rounded-full text-muted-foreground hover:text-foreground"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDerby} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">
                  Official Derby Name *
                </label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Manchester Derby, El Clásico"
                  required
                  className="rounded-xl border-border bg-background text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">
                  Short Display Name
                </label>
                <Input
                  value={formShortName}
                  onChange={(e) => setFormShortName(e.target.value)}
                  placeholder="e.g. Manchester Derby"
                  className="rounded-xl border-border bg-background text-sm"
                />
              </div>

              {/* Club 1 & Club 2 Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase">
                    Club 1 *
                  </label>
                  <select
                    value={formClub1Id}
                    onChange={(e) => setFormClub1Id(e.target.value)}
                    required
                    className="w-full h-10 px-3 rounded-xl border border-border bg-background text-xs font-semibold text-foreground focus:outline-none"
                  >
                    {ALL_REAL_TEAMS.map((t) => (
                      <option key={`c1-${t.id}`} value={t.id}>
                        {t.name} ({t.league})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase">
                    Club 2 *
                  </label>
                  <select
                    value={formClub2Id}
                    onChange={(e) => setFormClub2Id(e.target.value)}
                    required
                    className="w-full h-10 px-3 rounded-xl border border-border bg-background text-xs font-semibold text-foreground focus:outline-none"
                  >
                    {ALL_REAL_TEAMS.map((t) => (
                      <option key={`c2-${t.id}`} value={t.id}>
                        {t.name} ({t.league})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Competition & Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase">
                    Competition / League
                  </label>
                  <Input
                    value={formCompetition}
                    onChange={(e) => setFormCompetition(e.target.value)}
                    placeholder="e.g. Premier League, La Liga"
                    className="rounded-xl border-border bg-background text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase">
                    Priority Weight (Higher overrides)
                  </label>
                  <Input
                    type="number"
                    value={formPriority}
                    onChange={(e) => setFormPriority(parseInt(e.target.value, 10) || 0)}
                    min={0}
                    max={100}
                    className="rounded-xl border-border bg-background text-xs"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">
                  Rivalry Description
                </label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Historical context, rivalry background, and significance..."
                  rows={2}
                  className="w-full p-3 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none resize-none"
                />
              </div>

              {/* Artwork / Image URL */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">
                  Artwork / Background Image URL
                </label>
                <Input
                  value={formImageUrl}
                  onChange={(e) => setFormImageUrl(e.target.value)}
                  placeholder="/images/motw-stadium-bg.jpg"
                  className="rounded-xl border-border bg-background text-xs"
                />
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <label className="flex items-center gap-2 text-xs font-bold text-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="h-4 w-4 rounded border-border"
                  />
                  <span>Active Recognition</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-bold text-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsHistoric}
                    onChange={(e) => setFormIsHistoric(e.target.checked)}
                    className="h-4 w-4 rounded border-border"
                  />
                  <span>Historic Rivalry (Not Local Derby)</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-bold text-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formAutoSocial}
                    onChange={(e) => setFormAutoSocial(e.target.checked)}
                    className="h-4 w-4 rounded border-border"
                  />
                  <span>Auto-Publish to Social Feed</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-bold text-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formAutoCarousel}
                    onChange={(e) => setFormAutoCarousel(e.target.checked)}
                    className="h-4 w-4 rounded border-border"
                  />
                  <span>Auto-Publish to Carousel</span>
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl text-xs font-bold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-secondary text-secondary-foreground font-black text-xs hover:bg-secondary/90 shadow-md"
                >
                  {submitting ? "Saving..." : editingDerby ? "Update Derby" : "Create Derby"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Historical H2H Modal */}
      {h2hModalDerbyId && (
        <HistoricalDerbyModal
          isOpen={Boolean(h2hModalDerbyId)}
          onClose={() => setH2hModalDerbyId(null)}
          derbyId={h2hModalDerbyId}
        />
      )}
    </div>
  );
}
