"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Trophy, CheckCircle, Sparkles, BarChart2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface SuperCupPredictionPollProps {
  className?: string;
}

export default function SuperCupPredictionPoll({ className = "" }: SuperCupPredictionPollProps) {
  const [pollData, setPollData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [voterId, setVoterId] = useState<string>("");

  // Initialize voter id from local storage or session
  useEffect(() => {
    let vid = "";
    try {
      const stored = localStorage.getItem("efrl_user");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.id) vid = parsed.id;
      }
    } catch {}

    if (!vid) {
      let guestId = localStorage.getItem("efrl_supercup_voter_id");
      if (!guestId) {
        guestId = "voter_" + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
        localStorage.setItem("efrl_supercup_voter_id", guestId);
      }
      vid = guestId;
    }
    setVoterId(vid);
  }, []);

  const loadPoll = async (currentVoterId: string) => {
    try {
      const query = currentVoterId
        ? `?competition=SUPER_CUP&voterId=${encodeURIComponent(currentVoterId)}`
        : "?competition=SUPER_CUP";
      const res = await fetch(`/api/continental/trophy-poll${query}`);
      const data = await res.json();
      if (data.active) {
        setPollData(data);
      } else {
        setPollData(null);
      }
    } catch (err) {
      console.error("Super Cup poll load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (voterId) {
      loadPoll(voterId);
    }
  }, [voterId]);

  const handleVote = async (predictedWinnerPlayerId: string) => {
    if (!voterId || voting) return;
    setVoting(true);
    setMsg(null);
    try {
      const res = await fetch("/api/continental/trophy-poll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          competition: "SUPER_CUP",
          predictedWinnerPlayerId,
          voterId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit prediction");
      setMsg(data.message || "Your prediction has been recorded!");
      await loadPoll(voterId);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setVoting(false);
    }
  };

  if (loading || !pollData) return null;

  const f1 = pollData.finalist1;
  const f2 = pollData.finalist2;
  const isFinished = pollData.matchStatus === "FINISHED" || pollData.matchStatus === "FORFEIT";

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border border-secondary/40 bg-gradient-to-br from-background via-card to-secondary/15 p-5 sm:p-7 shadow-2xl space-y-6 ${className}`}
    >
      {/* Background glow flair */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground font-black shadow-lg">
            <Trophy className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-widest text-secondary">
                Official UEFA Super Cup
              </span>
              <Badge variant="outline" className="text-xs font-mono border-secondary/50 text-secondary">
                COMMUNITY PREDICTION POLL
              </Badge>
            </div>
            <h3 className="text-base sm:text-lg font-black uppercase text-foreground mt-0.5">
              Who Will Lift the Super Cup Trophy?
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto text-xs text-muted-foreground font-mono">
          <span className="flex items-center gap-1">
            <BarChart2 className="h-3.5 w-3.5 text-secondary" />
            <strong className="text-foreground">{pollData.totalVotes}</strong> votes cast
          </span>
        </div>
      </div>

      {msg && (
        <div className="p-3 rounded-xl bg-primary/20 border border-primary/30 text-primary text-xs flex items-center gap-2">
          <CheckCircle className="h-4 w-4 shrink-0 text-primary" />
          <span>{msg}</span>
        </div>
      )}

      {/* Comparative Progress Bar */}
      {pollData.totalVotes > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="font-bold text-foreground">
              @{f1.gamerTag}: <strong className="text-primary">{f1.percentage}%</strong>
            </span>
            <span className="font-bold text-foreground">
              @{f2.gamerTag}: <strong className="text-secondary">{f2.percentage}%</strong>
            </span>
          </div>
          <div className="h-2.5 w-full bg-muted/60 rounded-full overflow-hidden flex">
            <div
              className="bg-primary h-full transition-all duration-500"
              // eslint-disable-next-line shadcn/no-inline-styles -- dynamic 0-100% width has no static token equivalent
              style={{ width: `${f1.percentage}%` }}
            />
            <div
              className="bg-secondary h-full transition-all duration-500"
              // eslint-disable-next-line shadcn/no-inline-styles -- dynamic 0-100% width has no static token equivalent
              style={{ width: `${f2.percentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Two Finalists Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Finalist 1 (UCL Champion) */}
        <div
          className={`relative rounded-2xl border p-4 sm:p-5 flex flex-col justify-between gap-4 transition-all ${
            pollData.userVotedWinnerId === f1.id
              ? "border-primary bg-primary/10 shadow-lg"
              : "border-border bg-card/60 hover:border-border/80"
          }`}
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase text-primary">
                UCL Champion
              </span>
              <span className="text-xs font-mono text-muted-foreground">{f1.votes} votes</span>
            </div>

            <div className="flex items-center gap-3">
              {f1.avatar ? (
                <div className="relative h-11 w-11 shrink-0 rounded-xl overflow-hidden bg-muted border border-border p-1">
                  <Image src={f1.avatar} alt={f1.gamerTag} fill className="object-contain" sizes="44px" />
                </div>
              ) : null}
              <div>
                <h4 className="text-base font-black text-foreground">@{f1.gamerTag}</h4>
                <p className="text-xs text-muted-foreground">{f1.realTeam || f1.fullName}</p>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-border/60">
            <div className="flex items-baseline justify-between font-mono">
              <span className="text-2xl font-black text-primary">{f1.percentage}%</span>
              <span className="text-xs text-muted-foreground">Community Confidence</span>
            </div>
            <Button
              onClick={() => handleVote(f1.id)}
              disabled={voting || isFinished}
              variant={pollData.userVotedWinnerId === f1.id ? "default" : "outline"}
              className={`w-full text-xs font-bold uppercase tracking-wider ${
                pollData.userVotedWinnerId === f1.id
                  ? "bg-primary text-primary-foreground font-black"
                  : "border-primary/40 text-foreground hover:bg-primary/20"
              }`}
            >
              {pollData.userVotedWinnerId === f1.id
                ? "✓ Your Predicted Champion"
                : `Predict @${f1.gamerTag} to Win`}
            </Button>
          </div>
        </div>

        {/* Finalist 2 (Europa League Champion) */}
        <div
          className={`relative rounded-2xl border p-4 sm:p-5 flex flex-col justify-between gap-4 transition-all ${
            pollData.userVotedWinnerId === f2.id
              ? "border-secondary bg-secondary/10 shadow-lg"
              : "border-border bg-card/60 hover:border-border/80"
          }`}
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase text-secondary">
                Europa League Champion
              </span>
              <span className="text-xs font-mono text-muted-foreground">{f2.votes} votes</span>
            </div>

            <div className="flex items-center gap-3">
              {f2.avatar ? (
                <div className="relative h-11 w-11 shrink-0 rounded-xl overflow-hidden bg-muted border border-border p-1">
                  <Image src={f2.avatar} alt={f2.gamerTag} fill className="object-contain" sizes="44px" />
                </div>
              ) : null}
              <div>
                <h4 className="text-base font-black text-foreground">@{f2.gamerTag}</h4>
                <p className="text-xs text-muted-foreground">{f2.realTeam || f2.fullName}</p>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-border/60">
            <div className="flex items-baseline justify-between font-mono">
              <span className="text-2xl font-black text-secondary">{f2.percentage}%</span>
              <span className="text-xs text-muted-foreground">Community Confidence</span>
            </div>
            <Button
              onClick={() => handleVote(f2.id)}
              disabled={voting || isFinished}
              variant={pollData.userVotedWinnerId === f2.id ? "default" : "outline"}
              className={`w-full text-xs font-bold uppercase tracking-wider ${
                pollData.userVotedWinnerId === f2.id
                  ? "bg-secondary text-secondary-foreground font-black"
                  : "border-secondary/40 text-foreground hover:bg-secondary/20"
              }`}
            >
              {pollData.userVotedWinnerId === f2.id
                ? "✓ Your Predicted Champion"
                : `Predict @${f2.gamerTag} to Win`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
