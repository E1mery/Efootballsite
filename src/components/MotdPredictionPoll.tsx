"use client";

import { useState, useEffect } from "react";
import { Sparkles, CheckCircle2, Flame, BarChart2, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface MotdPredictionPollProps {
  matchId: string;
  homeGamerTag: string;
  awayGamerTag: string;
  isFinished?: boolean;
}

export default function MotdPredictionPoll({
  matchId,
  homeGamerTag,
  awayGamerTag,
  isFinished = false,
}: MotdPredictionPollProps) {
  const [totalVotes, setTotalVotes] = useState(0);
  const [homePercent, setHomePercent] = useState(0);
  const [drawPercent, setDrawPercent] = useState(0);
  const [awayPercent, setAwayPercent] = useState(0);
  const [homeVotes, setHomeVotes] = useState(0);
  const [drawVotes, setDrawVotes] = useState(0);
  const [awayVotes, setAwayVotes] = useState(0);
  const [userPrediction, setUserPrediction] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [voterId, setVoterId] = useState<string>("");

  // Initialize voter identity (from session or persistent local guest ID)
  useEffect(() => {
    let vid = "";
    try {
      const storedUser = localStorage.getItem("efrl_user");
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        if (parsed?.id) vid = parsed.id;
      }
    } catch (e) {
      // ignore
    }

    if (!vid) {
      let guestId = localStorage.getItem("efrl_voter_id");
      if (!guestId) {
        guestId = "voter_" + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
        localStorage.setItem("efrl_voter_id", guestId);
      }
      vid = guestId;
    }

    setVoterId(vid);
  }, []);

  // Fetch initial poll stats
  useEffect(() => {
    if (!matchId) return;

    const fetchPoll = async () => {
      try {
        const query = voterId ? `?matchId=${matchId}&voterId=${voterId}` : `?matchId=${matchId}`;
        const res = await fetch(`/api/matches/motd/poll${query}`);
        const data = await res.json();
        if (data.success) {
          setTotalVotes(data.totalVotes || 0);
          setHomePercent(data.homePercent || 0);
          setDrawPercent(data.drawPercent || 0);
          setAwayPercent(data.awayPercent || 0);
          setHomeVotes(data.homeVotes || 0);
          setDrawVotes(data.drawVotes || 0);
          setAwayVotes(data.awayVotes || 0);
          if (data.userPrediction) {
            setUserPrediction(data.userPrediction);
          }
        }
      } catch (err) {
        // silent fail
      }
    };

    fetchPoll();
  }, [matchId, voterId]);

  // Cast prediction vote
  const handleVote = async (prediction: "HOME" | "DRAW" | "AWAY") => {
    if (isFinished || loading || !voterId) return;

    setLoading(true);
    try {
      const res = await fetch("/api/matches/motd/poll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId,
          voterId,
          prediction,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setTotalVotes(data.totalVotes);
        setHomePercent(data.homePercent);
        setDrawPercent(data.drawPercent);
        setAwayPercent(data.awayPercent);
        setHomeVotes(data.homeVotes);
        setDrawVotes(data.drawVotes);
        setAwayVotes(data.awayVotes);
        setUserPrediction(prediction);
      }
    } catch (err) {
      console.error("Failed to cast prediction:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-6 rounded-2xl border border-secondary/30 bg-background/80 p-5 space-y-4 shadow-xl backdrop-blur-md">
      {/* Poll Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-secondary/20 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary/20 text-secondary border border-secondary/30">
            <BarChart2 className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase text-white tracking-wider flex items-center gap-1.5">
              <span>MOTD Match Prediction Poll</span>
              <span className="text-xs text-secondary font-mono">⚡ LIVE</span>
            </h4>
            <p className="text-xs text-muted-foreground">
              Predict who will win this Marquee Match of the Day showdown.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isFinished ? (
            <Badge variant="secondary" className="text-xs font-mono flex items-center gap-1">
              <Lock className="h-3 w-3" /> POLL CLOSED
            </Badge>
          ) : userPrediction ? (
            <Badge variant="yellow" className="text-xs font-mono flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> PREDICTION CAST
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs border-secondary/30 text-secondary font-mono">
              VOTE TO PREDICT
            </Badge>
          )}
          <span className="text-xs font-mono text-muted-foreground">
            {totalVotes} {totalVotes === 1 ? "prediction" : "predictions"}
          </span>
        </div>
      </div>

      {/* 3 Voting Buttons / Progress Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Option 1: Home Win */}
        <button
          type="button"
          disabled={isFinished || loading}
          onClick={() => handleVote("HOME")}
          className={`relative overflow-hidden rounded-xl border p-3.5 text-left transition-all group ${
            userPrediction === "HOME"
              ? "border-primary bg-primary/40 ring-1 ring-primary/50 shadow-lg"
              : "border-border bg-card/60 hover:border-primary/40 hover:bg-card"
          } ${isFinished ? "cursor-default" : "cursor-pointer active:scale-95"}`}
        >
          {/* Progress Bar background fill */}
          <div
            className="absolute inset-y-0 left-0 bg-primary/15 transition-all duration-500"
            // eslint-disable-next-line shadcn/no-inline-styles -- dynamic 0-100% width has no static token equivalent
            style={{ width: `${homePercent}%` }}
          />

          <div className="relative z-10 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase text-primary font-bold">
                HOME WIN
              </span>
              <span className="text-xs font-black font-mono text-white">
                {homePercent}%
              </span>
            </div>

            <div className="text-sm font-black text-white truncate group-hover:text-primary transition-colors">
              {homeGamerTag}
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-mono text-muted-foreground">
                {homeVotes} {homeVotes === 1 ? "vote" : "votes"}
              </span>
              {userPrediction === "HOME" && (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-primary">
                  <CheckCircle2 className="h-3 w-3" /> Your Pick
                </span>
              )}
            </div>
          </div>
        </button>

        {/* Option 2: Draw */}
        <button
          type="button"
          disabled={isFinished || loading}
          onClick={() => handleVote("DRAW")}
          className={`relative overflow-hidden rounded-xl border p-3.5 text-left transition-all group ${
            userPrediction === "DRAW"
              ? "border-secondary bg-secondary/40 ring-1 ring-secondary/50 shadow-lg"
              : "border-border bg-card/60 hover:border-secondary/40 hover:bg-card"
          } ${isFinished ? "cursor-default" : "cursor-pointer active:scale-95"}`}
        >
          {/* Progress Bar background fill */}
          <div
            className="absolute inset-y-0 left-0 bg-secondary/15 transition-all duration-500"
            // eslint-disable-next-line shadcn/no-inline-styles -- dynamic 0-100% width has no static token equivalent
            style={{ width: `${drawPercent}%` }}
          />

          <div className="relative z-10 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase text-secondary font-bold">
                DRAW
              </span>
              <span className="text-xs font-black font-mono text-white">
                {drawPercent}%
              </span>
            </div>

            <div className="text-sm font-black text-white truncate group-hover:text-secondary transition-colors">
              Draw / Stalemate
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-mono text-muted-foreground">
                {drawVotes} {drawVotes === 1 ? "vote" : "votes"}
              </span>
              {userPrediction === "DRAW" && (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-secondary">
                  <CheckCircle2 className="h-3 w-3" /> Your Pick
                </span>
              )}
            </div>
          </div>
        </button>

        {/* Option 3: Away Win */}
        <button
          type="button"
          disabled={isFinished || loading}
          onClick={() => handleVote("AWAY")}
          className={`relative overflow-hidden rounded-xl border p-3.5 text-left transition-all group ${
            userPrediction === "AWAY"
              ? "border-primary bg-primary/40 ring-1 ring-primary/50 shadow-lg"
              : "border-border bg-card/60 hover:border-primary/40 hover:bg-card"
          } ${isFinished ? "cursor-default" : "cursor-pointer active:scale-95"}`}
        >
          {/* Progress Bar background fill */}
          <div
            className="absolute inset-y-0 left-0 bg-primary/15 transition-all duration-500"
            // eslint-disable-next-line shadcn/no-inline-styles -- dynamic 0-100% width has no static token equivalent
            style={{ width: `${awayPercent}%` }}
          />

          <div className="relative z-10 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase text-primary font-bold">
                AWAY WIN
              </span>
              <span className="text-xs font-black font-mono text-white">
                {awayPercent}%
              </span>
            </div>

            <div className="text-sm font-black text-white truncate group-hover:text-primary transition-colors">
              {awayGamerTag}
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-mono text-muted-foreground">
                {awayVotes} {awayVotes === 1 ? "vote" : "votes"}
              </span>
              {userPrediction === "AWAY" && (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-primary">
                  <CheckCircle2 className="h-3 w-3" /> Your Pick
                </span>
              )}
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
