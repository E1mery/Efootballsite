"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Unlock, RefreshCw, X, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ReopenMatchdayModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRound?: string;
  availableRounds?: string[];
  matches?: any[];
  onSuccess?: (data: { reopenedCount: number; round: string; message: string }) => void;
}

export default function ReopenMatchdayModal({
  isOpen,
  onClose,
  initialRound,
  availableRounds = [],
  matches = [],
  onSuccess,
}: ReopenMatchdayModalProps) {
  const router = useRouter();

  // Round selection
  const roundsList = useMemo(() => {
    if (availableRounds.length > 0) return availableRounds;
    const extracted = Array.from(new Set(matches.map((m: any) => m.round))).filter(Boolean) as string[];
    return extracted.sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, "") || "0", 10);
      const numB = parseInt(b.replace(/\D/g, "") || "0", 10);
      return numA - numB;
    });
  }, [availableRounds, matches]);

  const defaultRound = initialRound || roundsList[0] || "Matchday 1";
  const [selectedRound, setSelectedRound] = useState<string>(defaultRound);
  const [selectedDivision, setSelectedDivision] = useState<string>("ALL");
  const [scope, setScope] = useState<"ALL" | "UNPLAYED_ONLY">("ALL");
  const [extensionHours, setExtensionHours] = useState<number>(24);
  const [reason, setReason] = useState<string>("Commissioner reopened matchday result submission window");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Synchronize when initialRound changes upon opening
  useMemo(() => {
    if (initialRound) {
      setSelectedRound(initialRound);
    }
  }, [initialRound]);

  // Compute how many matches will be affected by this operation
  const matchingMatches = useMemo(() => {
    const targetRound = selectedRound.trim().toLowerCase();
    return matches.filter((m: any) => {
      const matchRound = (m.round || "").trim().toLowerCase();
      if (matchRound !== targetRound) return false;
      if (selectedDivision !== "ALL" && m.division !== selectedDivision) return false;
      return true;
    });
  }, [matches, selectedRound, selectedDivision]);

  const affectedMatchesCount = useMemo(() => {
    if (scope === "ALL") return matchingMatches.length;
    return matchingMatches.filter((m: any) => {
      if (m.status === "SCHEDULED") return true;
      if (m.status === "FORFEIT") return true;
      if (
        m.notes?.includes("Automatic 0-0 Draw") ||
        m.notes?.includes("24-hour midnight window elapsed")
      ) {
        return true;
      }
      if (m.homeScore === null || m.awayScore === null) return true;
      return false;
    }).length;
  }, [matchingMatches, scope]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/reopen-matchday", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          round: selectedRound,
          division: selectedDivision,
          scope,
          extensionHours,
          reason,
          clearSubmissions: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to reopen matchday submissions.");
      }

      setSuccessMessage(data.message);
      if (onSuccess) {
        onSuccess({
          reopenedCount: data.reopenedCount,
          round: data.round,
          message: data.message,
        });
      }
      setTimeout(() => {
        router.refresh();
        onClose();
      }, 1400);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-xl rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-5 max-h-full overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/20 text-primary border border-primary/30">
              <Unlock className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-black uppercase text-foreground tracking-tight">
                Reopen Matchday Submissions
              </h2>
              <p className="text-xs text-muted-foreground">
                Unlock result uploads & forfeit claim buttons for a whole matchday round
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="text-muted-foreground hover:text-foreground p-1 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl border border-destructive/40 bg-destructive/15 text-xs text-destructive flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 rounded-xl border border-primary/40 bg-primary/20 text-xs text-primary flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Target Round and Division Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-mono font-bold text-muted-foreground uppercase block mb-1.5">
                Matchday Round
              </label>
              <select
                value={selectedRound}
                onChange={(e) => setSelectedRound(e.target.value)}
                disabled={loading}
                className="w-full bg-background border border-border text-foreground rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-primary"
              >
                {roundsList.map((rnd) => (
                  <option key={rnd} value={rnd}>
                    {rnd}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-mono font-bold text-muted-foreground uppercase block mb-1.5">
                Competition Division
              </label>
              <select
                value={selectedDivision}
                onChange={(e) => setSelectedDivision(e.target.value)}
                disabled={loading}
                className="w-full bg-background border border-border text-foreground rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-primary"
              >
                <option value="ALL">All Divisions Combined</option>
                <option value="Division 1">Division 1 (Premiership)</option>
                <option value="Division 2">Division 2 (Championship)</option>
                <option value="Division 3">Division 3 (Academy)</option>
                <option value="UCL">UEFA Champions League</option>
                <option value="EUROPA">UEFA Europa League</option>
              </select>
            </div>
          </div>

          {/* Scope Selector */}
          <div>
            <label className="text-xs font-mono font-bold text-muted-foreground uppercase block mb-1.5">
              Reopen Scope
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setScope("ALL")}
                disabled={loading}
                className={`p-3 rounded-xl border text-left transition-all ${
                  scope === "ALL"
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <span className="text-xs font-black block text-foreground">All Fixtures</span>
                <span className="text-xs text-muted-foreground block mt-0.5">
                  Reset and unlock submission buttons for every fixture in this round
                </span>
              </button>

              <button
                type="button"
                onClick={() => setScope("UNPLAYED_ONLY")}
                disabled={loading}
                className={`p-3 rounded-xl border text-left transition-all ${
                  scope === "UNPLAYED_ONLY"
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <span className="text-xs font-black block text-foreground">Unplayed / Expired Only</span>
                <span className="text-xs text-muted-foreground block mt-0.5">
                  Keep finished games intact, only unlock overdue and 0-0 fixtures
                </span>
              </button>
            </div>
          </div>

          {/* Extension Window */}
          <div>
            <label className="text-xs font-mono font-bold text-muted-foreground uppercase block mb-1.5 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-secondary" />
              <span>Extension Window Duration</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "12 Hours", hours: 12 },
                { label: "24 Hours (Standard)", hours: 24 },
                { label: "48 Hours (Weekend)", hours: 48 },
              ].map((opt) => (
                <button
                  key={opt.hours}
                  type="button"
                  onClick={() => setExtensionHours(opt.hours)}
                  disabled={loading}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                    extensionHours === opt.hours
                      ? "border-secondary bg-secondary/15 text-foreground"
                      : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Admin Note / Reason */}
          <div>
            <label className="text-xs font-mono font-bold text-muted-foreground uppercase block mb-1.5">
              Reason / Public Notification Note
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={loading}
              placeholder="e.g., Commissioner reopened matchday result submission window"
              className="w-full bg-background border border-border text-foreground rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary"
            />
          </div>

          {/* Summary Preview Box */}
          <div className="p-3.5 rounded-2xl border border-border bg-muted/20 space-y-1.5 text-xs">
            <div className="flex items-center justify-between font-bold text-foreground">
              <span>Selected Target:</span>
              <span className="font-mono text-primary">
                {selectedRound} {selectedDivision !== "ALL" ? `(${selectedDivision})` : "(All Divisions)"}
              </span>
            </div>
            {matches.length > 0 && (
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Fixtures to Reopen:</span>
                <span className="font-mono font-bold text-foreground">
                  {affectedMatchesCount} fixture{affectedMatchesCount === 1 ? "" : "s"}
                </span>
              </div>
            )}
            <p className="text-xs text-muted-foreground pt-1 border-t border-border/60">
              Both athletes in each fixture will receive individual notification announcements, and their result submission & forfeit claim buttons on &quot;Today&apos;s Match&quot; will activate immediately.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={loading}
              className="text-xs font-bold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading || (matches.length > 0 && affectedMatchesCount === 0)}
              className="bg-primary hover:bg-primary text-primary-foreground text-xs font-bold gap-1.5 shadow-md"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Reopening Submissions...</span>
                </>
              ) : (
                <>
                  <Unlock className="h-3.5 w-3.5" />
                  <span>Reopen {selectedRound} Submissions</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
