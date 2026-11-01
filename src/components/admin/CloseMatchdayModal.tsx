"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Lock, RefreshCw, X, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface CloseMatchdayModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRound?: string;
  availableRounds?: string[];
  matches?: any[];
  onSuccess?: (data: { closedCount: number; round: string; message: string }) => void;
}

export default function CloseMatchdayModal({
  isOpen,
  onClose,
  initialRound,
  availableRounds = [],
  matches = [],
  onSuccess,
}: CloseMatchdayModalProps) {
  const router = useRouter();

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
  const [reason, setReason] = useState<string>("Admin manually closed reopened submissions");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useMemo(() => {
    if (initialRound) {
      setSelectedRound(initialRound);
    }
  }, [initialRound]);

  const matchingMatches = useMemo(() => {
    const targetRound = selectedRound.trim().toLowerCase();
    return matches.filter((m: any) => {
      const matchRound = (m.round || "").trim().toLowerCase();
      if (matchRound !== targetRound) return false;
      if (selectedDivision !== "ALL" && m.division !== selectedDivision) return false;
      return true;
    });
  }, [matches, selectedRound, selectedDivision]);

  const reopenedMatchesCount = useMemo(() => {
    return matchingMatches.filter(
      (m: any) => m.allowLateSubmission || m.notes?.includes("ADMIN_REOPENED")
    ).length;
  }, [matchingMatches]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/close-matchday", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          round: selectedRound,
          division: selectedDivision,
          reason,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to close matchday submissions.");
      }

      setSuccessMessage(data.message);
      if (onSuccess) {
        onSuccess({
          closedCount: data.closedCount,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-xl rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-5 max-h-full overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-destructive/20 text-destructive border border-destructive/30">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-black uppercase text-foreground tracking-tight">
                Close Matchday Submissions
              </h2>
              <p className="text-xs text-muted-foreground">
                Lock late result uploads and revert reopened status for this round
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

          {/* Reason / Admin Note */}
          <div>
            <label className="text-xs font-mono font-bold text-muted-foreground uppercase block mb-1.5">
              Reason / Public Closure Note
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={loading}
              placeholder="e.g., Extended submission deadline concluded"
              className="w-full bg-background border border-border text-foreground rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary"
            />
          </div>

          {/* Summary Preview Box */}
          <div className="p-3.5 rounded-2xl border border-border bg-muted/20 space-y-1.5 text-xs">
            <div className="flex items-center justify-between font-bold text-foreground">
              <span>Selected Target:</span>
              <span className="font-mono text-destructive">
                {selectedRound} {selectedDivision !== "ALL" ? `(${selectedDivision})` : "(All Divisions)"}
              </span>
            </div>
            {matches.length > 0 && (
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Fixtures Currently Reopened:</span>
                <span className="font-mono font-bold text-foreground">
                  {reopenedMatchesCount} of {matchingMatches.length} fixture{matchingMatches.length === 1 ? "" : "s"}
                </span>
              </div>
            )}
            <p className="text-xs text-muted-foreground pt-1 border-t border-border/60">
              Closing submissions resets extended deadlines and revokes late upload permissions on &quot;Today&apos;s Match&quot; for players in this round.
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
              disabled={loading}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground text-xs font-bold gap-1.5 shadow-md"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Closing Submissions...</span>
                </>
              ) : (
                <>
                  <Lock className="h-3.5 w-3.5" />
                  <span>Close {selectedRound} Submissions</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
