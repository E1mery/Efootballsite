"use client";

import { useState } from "react";
import {
  Crown,
  Trophy,
  Sparkles,
  TrendingUp,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Edit3,
  Trash2,
  Upload,
  Calendar,
  User,
  Sliders,
  Shield,
  Search,
  Eye,
  Star,
  Layers,
  History as HistoryIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatRwandanDate } from "@/lib/rwandanTime";

interface AdminHallOfFameHubProps {
  initialHallOfFame: any[];
  allPlayers?: any[];
}

export default function AdminHallOfFameHub({
  initialHallOfFame = [],
  allPlayers = [],
}: AdminHallOfFameHubProps) {
  const [activeSubTab, setActiveSubTab] = useState<
    "STATISTICS" | "INDUCTEES" | "MANUAL_RECORDS" | "ELIGIBILITY"
  >("STATISTICS");

  const [hallOfFame, setHallOfFame] = useState<any[]>(initialHallOfFame);
  const [statsData, setStatsData] = useState<any>(null);
  const [manualRecords, setManualRecords] = useState<any[]>([]);
  const [loadingStats, setLoadingStats] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [rebuilding, setRebuilding] = useState(false);
  const [showRebuildModal, setShowRebuildModal] = useState(false);

  // Settings state
  const [minMatchesForRecords, setMinMatchesForRecords] = useState<number>(10);
  const [minMatchesForInduction, setMinMatchesForInduction] = useState<number>(10);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSuccessMsg, setSettingsSuccessMsg] = useState<string | null>(null);

  // Crown champion form
  const [hofTournament, setHofTournament] = useState("EFRL Division 1 (Premiership)");
  const [hofSeason, setHofSeason] = useState("Season 2026");
  const [hofChampion, setHofChampion] = useState("");
  const [hofRealName, setHofRealName] = useState("");
  const [hofPlayerImage, setHofPlayerImage] = useState("");
  const [hofTrophyType, setHofTrophyType] = useState("GOLD");
  const [isUploadingHofImage, setIsUploadingHofImage] = useState(false);
  const [submittingHof, setSubmittingHof] = useState(false);

  // Manual record form
  const [manualRecordName, setManualRecordName] = useState("");
  const [manualPlayerName, setManualPlayerName] = useState("");
  const [manualValue, setManualValue] = useState("");
  const [manualSeason, setManualSeason] = useState("");
  const [manualComp, setManualComp] = useState("");
  const [manualDesc, setManualDesc] = useState("");
  const [submittingManual, setSubmittingManual] = useState(false);

  // Search filter
  const [playerSearchQuery, setPlayerSearchQuery] = useState("");

  // Load stats and manual records on mount or refresh
  const loadData = async () => {
    setLoadingStats(true);
    try {
      const [hofRes, recordsRes] = await Promise.all([
        fetch("/api/admin/hall-of-fame"),
        fetch("/api/admin/hall-of-fame/manual-records"),
      ]);

      if (hofRes.ok) {
        const data = await hofRes.json();
        if (data.entries) setHallOfFame(data.entries);
        if (data.stats) {
          setStatsData(data.stats);
          if (data.stats.settings) {
            setMinMatchesForRecords(data.stats.settings.minMatchesForRecords ?? 10);
            setMinMatchesForInduction(data.stats.settings.minMatchesForInduction ?? 10);
          }
        }
      }

      if (recordsRes.ok) {
        const data = await recordsRes.json();
        if (data.records) setManualRecords(data.records);
      }
    } catch (err) {
      console.error("Failed to load Hall of Fame stats:", err);
    } finally {
      setLoadingStats(false);
    }
  };

  // Run initial fetch
  useState(() => {
    loadData();
  });

  // Handle image upload for crown champion
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingHofImage(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "hall-of-fame");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setHofPlayerImage(data.url);
    } catch (err) {
      alert("Failed to upload image. Please try again.");
    } finally {
      setIsUploadingHofImage(false);
    }
  };

  // Crown new champion handler
  const handleCrownChampion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hofChampion.trim()) return;
    setSubmittingHof(true);

    try {
      const res = await fetch("/api/admin/hall-of-fame", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tournamentName: hofTournament,
          season: hofSeason,
          championName: hofChampion.trim(),
          championRealName: hofRealName.trim() || null,
          playerImage: hofPlayerImage || null,
          trophyType: hofTrophyType,
          sourceType: "MANUAL",
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to crown champion");
      }

      const data = await res.json();
      setHallOfFame((prev) => [data.entry, ...prev]);
      setHofChampion("");
      setHofRealName("");
      setHofPlayerImage("");
      alert(data.message || "Champion crowned successfully!");
      loadData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmittingHof(false);
    }
  };

  // Toggle inductee feature status
  const handleToggleFeature = async (id: string, currentFeatured: boolean) => {
    try {
      const res = await fetch("/api/admin/hall-of-fame", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          isFeatured: !currentFeatured,
        }),
      });

      if (res.ok) {
        setHallOfFame((prev) =>
          prev.map((e) => (e.id === id ? { ...e, isFeatured: !currentFeatured } : e))
        );
        loadData();
      }
    } catch (err) {
      console.error("Feature toggle error:", err);
    }
  };

  // Delete inductee
  const handleDeleteHallOfFame = async (id: string, championName: string) => {
    if (!confirm(`Are you sure you want to remove ${championName} from the Hall of Fame?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/hall-of-fame?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setHallOfFame((prev) => prev.filter((e) => e.id !== id));
        loadData();
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  // Recalculate statistics
  const handleRecalculate = async () => {
    setRecalculating(true);
    try {
      const res = await fetch("/api/admin/hall-of-fame/recalculate", {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        setStatsData(data.stats);
        alert("Hall of Fame statistics recalculated successfully from official league data!");
      } else {
        alert(data.error || "Failed to recalculate");
      }
    } catch (err: any) {
      alert(err.message || "Failed to recalculate statistics");
    } finally {
      setRecalculating(false);
    }
  };

  // Rebuild historical statistics (Requirement 13)
  const handleRebuild = async () => {
    setRebuilding(true);
    try {
      const res = await fetch("/api/admin/hall-of-fame/rebuild", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmed: true }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatsData(data.stats);
        setShowRebuildModal(false);
        alert("Historical statistics engine rebuilt successfully! All historical records refreshed.");
      } else {
        alert(data.error || "Failed to rebuild");
      }
    } catch (err: any) {
      alert(err.message || "Failed to rebuild historical statistics");
    } finally {
      setRebuilding(false);
    }
  };

  // Save settings (Requirement 09 & 13)
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsSuccessMsg(null);

    try {
      const res = await fetch("/api/admin/hall-of-fame/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          minMatchesForRecords,
          minMatchesForInduction,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSettingsSuccessMsg("Eligibility criteria updated and statistics refreshed!");
        if (data.stats) setStatsData(data.stats);
      } else {
        alert(data.error || "Failed to save settings");
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingSettings(false);
    }
  };

  // Create manual historical record (Requirement 11)
  const handleCreateManualRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualRecordName.trim() || !manualPlayerName.trim() || !manualValue.trim()) return;
    setSubmittingManual(true);

    try {
      const res = await fetch("/api/admin/hall-of-fame/manual-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recordName: manualRecordName.trim(),
          playerName: manualPlayerName.trim(),
          value: manualValue.trim(),
          season: manualSeason.trim() || null,
          competition: manualComp.trim() || null,
          description: manualDesc.trim() || null,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setManualRecords((prev) => [data.record, ...prev]);
        setManualRecordName("");
        setManualPlayerName("");
        setManualValue("");
        setManualSeason("");
        setManualComp("");
        setManualDesc("");
        alert("Manual historical record saved (marked as MANUAL).");
        loadData();
      } else {
        alert(data.error || "Failed to save record");
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmittingManual(false);
    }
  };

  // Delete manual record
  const handleDeleteManualRecord = async (id: string, name: string) => {
    if (!confirm(`Delete manual record "${name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/hall-of-fame/manual-records?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setManualRecords((prev) => prev.filter((r) => r.id !== id));
        loadData();
      }
    } catch (err) {
      console.error("Delete manual record error:", err);
    }
  };

  const metrics = statsData?.metrics;
  const analyzedPlayers = statsData?.players || [];

  const filteredAnalyzedPlayers = analyzedPlayers.filter((p: any) => {
    const q = playerSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      p.gamerTag.toLowerCase().includes(q) ||
      (p.fullName && p.fullName.toLowerCase().includes(q)) ||
      (p.currentDivision && p.currentDivision.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="rounded-3xl border border-secondary/30 bg-gradient-to-r from-secondary/15 via-background to-background p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-secondary">
            <Crown className="h-6 w-6" />
            <h3 className="text-xl font-black uppercase text-foreground tracking-wide">
              EFRL Hall of Fame & Statistical Engine
            </h3>
          </div>
          <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
            Historical records, intelligent statistics calculation engine, immortalized champions, and eligibility management for Rwanda&apos;s eFootball League.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="yellow" className="text-xs px-3 py-1 font-mono">
            {hallOfFame.length} Inducted Champions
          </Badge>
          <Badge variant="secondary" className="text-xs px-3 py-1 font-mono">
            {manualRecords.length} Manual Records
          </Badge>
        </div>
      </div>

      {/* Subtab Navigation */}
      <div className="flex items-center gap-2 border-b border-border pb-3 overflow-x-auto scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveSubTab("STATISTICS")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeSubTab === "STATISTICS"
              ? "bg-secondary text-secondary-foreground font-black shadow-md"
              : "bg-card border border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          <Sliders className="h-3.5 w-3.5" />
          <span>Statistics Engine & Health</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("INDUCTEES")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeSubTab === "INDUCTEES"
              ? "bg-secondary text-secondary-foreground font-black shadow-md"
              : "bg-card border border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          <Crown className="h-3.5 w-3.5" />
          <span>Inducted Champions ({hallOfFame.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("MANUAL_RECORDS")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeSubTab === "MANUAL_RECORDS"
              ? "bg-secondary text-secondary-foreground font-black shadow-md"
              : "bg-card border border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          <Edit3 className="h-3.5 w-3.5" />
          <span>Manual Historical Records ({manualRecords.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("ELIGIBILITY")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeSubTab === "ELIGIBILITY"
              ? "bg-secondary text-secondary-foreground font-black shadow-md"
              : "bg-card border border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          <TrendingUp className="h-3.5 w-3.5" />
          <span>Player Eligibility Roster ({analyzedPlayers.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SUBTAB 1: STATISTICS ENGINE & DASHBOARD (Requirement 13) */}
      {/* ========================================================================= */}
      {activeSubTab === "STATISTICS" && (
        <div className="space-y-6">
          {/* Metrics KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="rounded-2xl border border-border bg-card p-4">
              <span className="text-xs font-mono uppercase text-muted-foreground block">
                Official Matches
              </span>
              <div className="text-xl font-black text-foreground mt-1 font-mono">
                {metrics?.totalOfficialMatchesProcessed ?? 0}
              </div>
              <span className="text-xs text-muted-foreground mt-0.5 block">
                Verified results
              </span>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4">
              <span className="text-xs font-mono uppercase text-muted-foreground block">
                Goals Processed
              </span>
              <div className="text-xl font-black text-secondary mt-1 font-mono">
                {metrics?.totalGoalsProcessed ?? 0}
              </div>
              <span className="text-xs text-muted-foreground mt-0.5 block">
                Total scored
              </span>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4">
              <span className="text-xs font-mono uppercase text-muted-foreground block">
                Athletes Analyzed
              </span>
              <div className="text-xl font-black text-foreground mt-1 font-mono">
                {metrics?.totalPlayersAnalyzed ?? 0}
              </div>
              <span className="text-xs text-muted-foreground mt-0.5 block">
                Tracked in engine
              </span>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4">
              <span className="text-xs font-mono uppercase text-muted-foreground block">
                Seasons Analyzed
              </span>
              <div className="text-xl font-black text-foreground mt-1 font-mono">
                {metrics?.totalSeasonsAnalyzed ?? 0}
              </div>
              <span className="text-xs text-muted-foreground mt-0.5 block">
                Archived campaigns
              </span>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4">
              <span className="text-xs font-mono uppercase text-muted-foreground block">
                Competitions
              </span>
              <div className="text-xl font-black text-foreground mt-1 font-mono">
                {metrics?.totalCompetitionsAnalyzed ?? 0}
              </div>
              <span className="text-xs text-muted-foreground mt-0.5 block">
                Tiers & Cups
              </span>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4">
              <span className="text-xs font-mono uppercase text-muted-foreground block">
                Engine Status
              </span>
              <div className="flex items-center gap-1.5 mt-1 font-mono font-bold text-xs text-primary">
                <CheckCircle2 className="h-4 w-4" />
                <span>{statsData?.settings?.calculationStatus || "ONLINE"}</span>
              </div>
              <span className="text-xs text-muted-foreground mt-0.5 block truncate">
                {statsData?.lastUpdated
                  ? formatRwandanDate(statsData.lastUpdated)
                  : "Never"}
              </span>
            </div>
          </div>

          {/* Engine Controls and Actions */}
          <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border pb-3">
              <div>
                <h4 className="text-sm font-black uppercase text-foreground flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-secondary" />
                  Engine Management & Recalculation
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  The Hall of Fame recalculates automatically whenever an official match score is verified. You can also trigger a manual refresh or a complete rebuild.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={handleRecalculate}
                  disabled={recalculating}
                  className="bg-secondary text-secondary-foreground font-bold text-xs shadow-md"
                >
                  <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${recalculating ? "animate-spin" : ""}`} />
                  {recalculating ? "Recalculating..." : "Recalculate Statistics"}
                </Button>

                <Button
                  variant="destructive"
                  onClick={() => setShowRebuildModal(true)}
                  className="text-xs font-bold"
                >
                  <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />
                  Rebuild Historical Statistics
                </Button>
              </div>
            </div>

            {/* Data Integrity Notice (Requirement 15 & 17) */}
            <div className="p-4 rounded-xl bg-background/80 border border-border flex items-start gap-3">
              <Lock className="h-5 w-5 text-secondary shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <span className="font-bold text-foreground block">
                  Data Integrity & Transparency Rules (Automated vs Manual)
                </span>
                <p className="text-muted-foreground">
                  The relationship is strictly: <strong>Official Match Results &rarr; Statistics Engine &rarr; Hall of Fame</strong>.
                  The Hall of Fame is a consumer of verified league fixtures and never modifies match outcomes.
                  Automatically calculated statistics are marked as <strong>🔒 Automatically managed</strong> and cannot be accidentally overridden with manual text.
                  Historical accomplishments prior to database inception are stored separately as <strong>✎ Admin managed</strong>.
                </p>
              </div>
            </div>
          </div>

          {/* Configurable Eligibility Requirements (Requirement 02 & 09) */}
          <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h4 className="text-sm font-black uppercase text-foreground flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-secondary" />
                  Configurable Hall of Fame Eligibility Rules
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Set thresholds for statistical records (such as Best Win Rate) so athletes with only 1 match cannot skew records.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-muted-foreground">
                    Minimum Matches for All-Time Record Eligibility *
                  </label>
                  <Input
                    type="number"
                    min={1}
                    value={minMatchesForRecords}
                    onChange={(e) => setMinMatchesForRecords(Number(e.target.value))}
                    className="bg-background border-border text-xs font-mono"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    E.g. 10 matches required before an athlete can appear on the &quot;Highest Win Percentage&quot; leaderboard.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-muted-foreground">
                    Minimum Matches for Statistical Inductee Eligibility *
                  </label>
                  <Input
                    type="number"
                    min={1}
                    value={minMatchesForInduction}
                    onChange={(e) => setMinMatchesForInduction(Number(e.target.value))}
                    className="bg-background border-border text-xs font-mono"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Minimum official fixtures required for consideration in statistical inductions.
                  </p>
                </div>
              </div>

              {settingsSuccessMsg && (
                <div className="p-3 rounded-xl bg-primary/10 border border-primary/25 text-xs text-primary font-bold flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{settingsSuccessMsg}</span>
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={savingSettings}
                  className="bg-secondary text-secondary-foreground font-black text-xs px-6"
                >
                  {savingSettings ? "Saving..." : "Save Eligibility Criteria"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 2: INDUCTED CHAMPIONS (Requirement 09 & 17) */}
      {/* ========================================================================= */}
      {activeSubTab === "INDUCTEES" && (
        <div className="space-y-6">
          {/* Crown Champion Form */}
          <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
            <div className="flex items-center gap-2 text-secondary border-b border-border pb-3">
              <Sparkles className="h-5 w-5" />
              <h4 className="text-sm font-black uppercase text-foreground">Crown New Official Champion</h4>
            </div>

            <form onSubmit={handleCrownChampion} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Tournament Title *</label>
                  <select
                    value={hofTournament}
                    onChange={(e) => setHofTournament(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:ring-1 focus:ring-secondary"
                    required
                  >
                    <option value="EFRL Division 1 (Premiership)">EFRL Division 1 (Premiership)</option>
                    <option value="EFRL Division 2 (Championship)">EFRL Division 2 (Championship)</option>
                    <option value="EFRL Division 3 (Conference)">EFRL Division 3 (Conference)</option>
                    <option value="eFootball Rwanda Champions League (UCL)">eFootball Rwanda Champions League (UCL)</option>
                    <option value="EFRL Europa League">EFRL Europa League</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Season / Year *</label>
                  <Input
                    placeholder="e.g. Season 2026 or Season 1"
                    value={hofSeason}
                    onChange={(e) => setHofSeason(e.target.value)}
                    className="bg-background border-border text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Trophy Tier</label>
                  <select
                    value={hofTrophyType}
                    onChange={(e) => setHofTrophyType(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:ring-1 focus:ring-secondary"
                  >
                    <option value="GOLD">Gold Cup / League 1st Place</option>
                    <option value="UCL">Champions League (UCL) Cup</option>
                    <option value="EUROPA">Europa League Cup</option>
                    <option value="SILVER">Silver Cup / Runner-up</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-secondary">Champion Gamer Tag *</label>
                  <Input
                    placeholder="e.g. RW_Sniper99"
                    value={hofChampion}
                    onChange={(e) => setHofChampion(e.target.value)}
                    className="bg-background border-secondary/30 text-xs font-bold text-foreground"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Champion Real Name</label>
                  <Input
                    placeholder="e.g. Jean-Claude Mugisha"
                    value={hofRealName}
                    onChange={(e) => setHofRealName(e.target.value)}
                    className="bg-background border-border text-xs"
                  />
                </div>
              </div>

              {/* Photo Upload */}
              <div className="space-y-2 pt-2 border-t border-border">
                <label className="text-xs font-bold uppercase text-muted-foreground block">
                  Champion Player Picture (Auto Ratio)
                </label>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <div className="relative">
                    <input
                      type="file"
                      id="adminHofImageInput"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="sr-only"
                      disabled={isUploadingHofImage}
                    />
                    <label
                      htmlFor="adminHofImageInput"
                      className="cursor-pointer text-xs font-bold px-3 py-2 rounded-xl bg-card border border-border hover:bg-muted text-foreground inline-flex items-center gap-2"
                    >
                      <Upload className="h-3.5 w-3.5 text-secondary" />
                      <span>{isUploadingHofImage ? "Uploading..." : "Upload Picture"}</span>
                    </label>
                  </div>

                  <div className="flex-1 w-full">
                    <Input
                      placeholder="Or paste image URL"
                      value={hofPlayerImage}
                      onChange={(e) => setHofPlayerImage(e.target.value)}
                      className="bg-background border-border text-xs"
                    />
                  </div>
                </div>

                {hofPlayerImage && (
                  <div className="mt-2 p-2 rounded-xl border border-secondary/20 bg-background max-w-xs">
                    <img
                      src={hofPlayerImage}
                      alt="Preview"
                      className="max-h-36 rounded-lg object-contain mx-auto"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  disabled={submittingHof || !hofChampion.trim() || isUploadingHofImage}
                  className="bg-secondary text-secondary-foreground font-black text-xs px-6"
                >
                  <Crown className="h-4 w-4 mr-1.5" />
                  {submittingHof ? "Immortalizing..." : "Crown Champion & Induct"}
                </Button>
              </div>
            </form>
          </div>

          {/* Inductees List */}
          <div className="space-y-4">
            <h4 className="text-sm font-black uppercase text-foreground flex items-center gap-2">
              <Trophy className="h-4 w-4 text-secondary" />
              All-Time Inducted Champions ({hallOfFame.length})
            </h4>

            {hallOfFame.length === 0 ? (
              <div className="p-8 rounded-2xl border border-border bg-card text-center text-xs text-muted-foreground">
                No champions inducted yet. Use the form above to immortalize your first champion!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {hallOfFame.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-2xl border border-border bg-card p-4 space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <Badge variant="yellow" className="text-xs uppercase font-mono">
                            {entry.season}
                          </Badge>
                          <div className="text-xs font-bold text-foreground mt-1 truncate">
                            {entry.tournamentName}
                          </div>
                        </div>

                        <Badge
                          variant={entry.sourceType === "AUTOMATIC" ? "yellow" : "outline"}
                          className="text-xs font-mono"
                        >
                          {entry.sourceType === "AUTOMATIC" ? "🔒 Auto" : "✎ Manual"}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-3 pt-1">
                        <div className="h-12 w-12 rounded-xl overflow-hidden bg-muted border border-border shrink-0 flex items-center justify-center">
                          {entry.playerImage ? (
                            <img
                              src={entry.playerImage}
                              alt={entry.championName}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <User className="h-6 w-6 text-muted-foreground" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="text-sm font-black text-foreground truncate">
                            {entry.championName}
                          </div>
                          {entry.championRealName && (
                            <div className="text-xs text-muted-foreground truncate">
                              {entry.championRealName}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
                      <button
                        type="button"
                        onClick={() => handleToggleFeature(entry.id, Boolean(entry.isFeatured))}
                        className={`px-2 py-1 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1 ${
                          entry.isFeatured
                            ? "bg-secondary text-secondary-foreground"
                            : "bg-muted text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <Star className="h-3 w-3" />
                        <span>{entry.isFeatured ? "Featured" : "Feature"}</span>
                      </button>

                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteHallOfFame(entry.id, entry.championName)}
                        className="h-7 px-2 text-xs"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 3: MANUAL HISTORICAL RECORDS (Requirement 11 & 17) */}
      {/* ========================================================================= */}
      {activeSubTab === "MANUAL_RECORDS" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h4 className="text-sm font-black uppercase text-foreground flex items-center gap-2">
                  <Edit3 className="h-4 w-4 text-secondary" />
                  Create Manual Historical Record (Pre-System Milestones)
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  For milestones that predate the automated system. These are clearly marked as <strong>✎ Admin managed</strong>.
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateManualRecord} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Record Title *</label>
                  <Input
                    placeholder="e.g. Inaugural Kigali Open 2024"
                    value={manualRecordName}
                    onChange={(e) => setManualRecordName(e.target.value)}
                    className="bg-background border-border text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Athlete / Holder *</label>
                  <Input
                    placeholder="e.g. RW_Sniper99"
                    value={manualPlayerName}
                    onChange={(e) => setManualPlayerName(e.target.value)}
                    className="bg-background border-border text-xs font-bold"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Record Value *</label>
                  <Input
                    placeholder="e.g. 42 Goals or 12 Matches"
                    value={manualValue}
                    onChange={(e) => setManualValue(e.target.value)}
                    className="bg-background border-border text-xs font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Season / Year</label>
                  <Input
                    placeholder="e.g. Pre-Season 2024"
                    value={manualSeason}
                    onChange={(e) => setManualSeason(e.target.value)}
                    className="bg-background border-border text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Competition</label>
                  <Input
                    placeholder="e.g. Kigali Invitational Cup"
                    value={manualComp}
                    onChange={(e) => setManualComp(e.target.value)}
                    className="bg-background border-border text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-muted-foreground">Historical Context / Description</label>
                <Input
                  placeholder="e.g. First verified offline tournament held prior to the digital platform launch."
                  value={manualDesc}
                  onChange={(e) => setManualDesc(e.target.value)}
                  className="bg-background border-border text-xs"
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  disabled={submittingManual}
                  className="bg-secondary text-secondary-foreground font-black text-xs px-6"
                >
                  {submittingManual ? "Saving Record..." : "Add Manual Historical Record"}
                </Button>
              </div>
            </form>
          </div>

          {/* List of Manual Historical Records */}
          <div className="space-y-4">
            <h4 className="text-sm font-black uppercase text-foreground flex items-center gap-2">
              <HistoryIcon className="h-4 w-4 text-secondary" />
              Manual Historical Records Directory ({manualRecords.length})
            </h4>

            {manualRecords.length === 0 ? (
              <div className="p-8 rounded-2xl border border-border bg-card text-center text-xs text-muted-foreground">
                No manual historical records created. The system is relying 100% on automatically calculated official league data.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {manualRecords.map((rec) => (
                  <div
                    key={rec.id}
                    className="rounded-2xl border border-border bg-card p-4 space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-bold text-foreground truncate">
                          {rec.recordName}
                        </span>
                        <Badge variant="outline" className="text-xs font-mono">
                          ✎ Admin Managed
                        </Badge>
                      </div>

                      <div className="p-3 rounded-xl bg-background border border-border">
                        <span className="text-xs font-mono text-muted-foreground block uppercase">
                          Value
                        </span>
                        <div className="text-lg font-black text-secondary font-mono">
                          {rec.value}
                        </div>
                        <div className="text-xs font-bold text-foreground mt-1">
                          Athlete: {rec.playerName}
                        </div>
                      </div>

                      {rec.description && (
                        <p className="text-xs text-muted-foreground italic">
                          &quot;{rec.description}&quot;
                        </p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
                      <span className="text-muted-foreground font-mono">
                        {rec.season || "Historical"}
                      </span>

                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteManualRecord(rec.id, rec.recordName)}
                        className="h-7 px-2 text-xs"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 4: PLAYER ELIGIBILITY ROSTER (Requirement 09) */}
      {/* ========================================================================= */}
      {activeSubTab === "ELIGIBILITY" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-black uppercase text-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-secondary" />
                Player Statistical Eligibility & Historical Audit
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Inspect player records calculated across official league fixtures. Threshold: {minMatchesForRecords} matches.
              </p>
            </div>

            <div className="relative min-w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search athlete tag..."
                value={playerSearchQuery}
                onChange={(e) => setPlayerSearchQuery(e.target.value)}
                className="pl-9 bg-card border-border text-xs"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-border bg-card">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-muted/40 text-muted-foreground uppercase text-xs border-b border-border">
                <tr>
                  <th className="py-3 px-4">Athlete</th>
                  <th className="py-3 px-3 text-center">Division</th>
                  <th className="py-3 px-3 text-center">Matches</th>
                  <th className="py-3 px-3 text-center">W - D - L</th>
                  <th className="py-3 px-3 text-center">Goals</th>
                  <th className="py-3 px-3 text-center">Win %</th>
                  <th className="py-3 px-3 text-center">Trophies</th>
                  <th className="py-3 px-3 text-center">Eligibility</th>
                  <th className="py-3 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredAnalyzedPlayers.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-muted-foreground">
                      No athletes found matching search query.
                    </td>
                  </tr>
                ) : (
                  filteredAnalyzedPlayers.map((player: any) => (
                    <tr key={player.gamerTag} className="hover:bg-muted/20">
                      <td className="py-3 px-4">
                        <div className="font-bold text-foreground">{player.gamerTag}</div>
                        {player.fullName && (
                          <div className="text-xs text-muted-foreground">{player.fullName}</div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center text-muted-foreground">
                        {player.currentDivision || "Division 1"}
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-foreground">
                        {player.matchesPlayed}
                      </td>
                      <td className="py-3 px-3 text-center text-muted-foreground">
                        {player.wins}W - {player.draws}D - {player.losses}L
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-secondary">
                        {player.goalsScored}
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-foreground">
                        {player.winPercentage.toFixed(1)}%
                      </td>
                      <td className="py-3 px-3 text-center">
                        {player.totalTrophies > 0 ? (
                          <Badge variant="yellow" className="text-xs font-mono font-bold">
                            🏆 {player.totalTrophies}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {player.matchesPlayed >= minMatchesForRecords ? (
                          <span className="text-primary font-bold">✓ Record Eligible</span>
                        ) : (
                          <span className="text-muted-foreground">
                            {player.matchesPlayed}/{minMatchesForRecords}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {player.isInducted ? (
                          <Badge variant="yellow" className="text-xs font-mono">
                            👑 Inducted
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">Active</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Rebuild Historical Statistics (Requirement 13) */}
      {showRebuildModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-4 animate-fade-in"
        >
          <div className="w-full max-w-md rounded-3xl border border-destructive/40 bg-card p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-6 w-6" />
              <h3 className="text-lg font-black uppercase text-foreground">
                Confirm Historical Rebuild
              </h3>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to rebuild historical statistics? This operation will purge the statistics cache and re-process all official matches, historical season snapshots, and all-time records from scratch.
            </p>

            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/25 text-xs text-destructive font-mono">
              Official match fixture scores will NEVER be altered. Only statistical aggregations are recalculated.
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowRebuildModal(false)}
                disabled={rebuilding}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleRebuild}
                disabled={rebuilding}
                className="text-xs font-bold"
              >
                {rebuilding ? "Rebuilding..." : "Confirm & Rebuild Now"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
