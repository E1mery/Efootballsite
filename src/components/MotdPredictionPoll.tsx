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
    <div className="mt-6 rounded-2xl border border-yellow-500/30 bg-slate-950/80 p-5 space-y-4 shadow-xl backdrop-blur-md">
      {/* Poll Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-yellow-500/20 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
            <BarChart2 className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase text-white tracking-wider flex items-center gap-1.5">
              <span>MOTD Match Prediction Poll</span>
              <span className="text-[10px] text-yellow-400 font-mono">⚡ LIVE</span>
            </h4>
            <p className="text-[11px] text-slate-400">
              Predict who will win this Marquee Match of the Day showdown.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isFinished ? (
            <Badge variant="secondary" className="text-[10px] font-mono flex items-center gap-1">
              <Lock className="h-3 w-3" /> POLL CLOSED
            </Badge>
          ) : userPrediction ? (
            <Badge variant="yellow" className="text-[10px] font-mono flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> PREDICTION CAST
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[10px] border-yellow-500/30 text-yellow-300 font-mono">
              VOTE TO PREDICT
            </Badge>
          )}
          <span className="text-[11px] font-mono text-slate-400">
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
              ? "border-sky-400 bg-sky-950/40 ring-1 ring-sky-400/50 shadow-lg shadow-sky-500/10"
              : "border-slate-800 bg-slate-900/60 hover:border-sky-500/40 hover:bg-slate-900"
          } ${isFinished ? "cursor-default" : "cursor-pointer active:scale-[0.98]"}`}
        >
          {/* Progress Bar background fill */}
          <div
            className="absolute inset-y-0 left-0 bg-sky-500/15 transition-all duration-500"
            style={{ width: `${homePercent}%` }}
          />

          <div className="relative z-10 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase text-sky-400 font-bold">
                HOME WIN
              </span>
              <span className="text-xs font-black font-mono text-white">
                {homePercent}%
              </span>
            </div>

            <div className="text-sm font-black text-white truncate group-hover:text-sky-300 transition-colors">
              {homeGamerTag}
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] font-mono text-slate-500">
                {homeVotes} {homeVotes === 1 ? "vote" : "votes"}
              </span>
              {userPrediction === "HOME" && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-400">
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
              ? "border-amber-400 bg-amber-950/40 ring-1 ring-amber-400/50 shadow-lg shadow-amber-500/10"
              : "border-slate-800 bg-slate-900/60 hover:border-amber-500/40 hover:bg-slate-900"
          } ${isFinished ? "cursor-default" : "cursor-pointer active:scale-[0.98]"}`}
        >
          {/* Progress Bar background fill */}
          <div
            className="absolute inset-y-0 left-0 bg-amber-500/15 transition-all duration-500"
            style={{ width: `${drawPercent}%` }}
          />

          <div className="relative z-10 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase text-amber-400 font-bold">
                DRAW
              </span>
              <span className="text-xs font-black font-mono text-white">
                {drawPercent}%
              </span>
            </div>

            <div className="text-sm font-black text-white truncate group-hover:text-amber-300 transition-colors">
              Draw / Stalemate
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] font-mono text-slate-500">
                {drawVotes} {drawVotes === 1 ? "vote" : "votes"}
              </span>
              {userPrediction === "DRAW" && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400">
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
              ? "border-emerald-400 bg-emerald-950/40 ring-1 ring-emerald-400/50 shadow-lg shadow-emerald-500/10"
              : "border-slate-800 bg-slate-900/60 hover:border-emerald-500/40 hover:bg-slate-900"
          } ${isFinished ? "cursor-default" : "cursor-pointer active:scale-[0.98]"}`}
        >
          {/* Progress Bar background fill */}
          <div
            className="absolute inset-y-0 left-0 bg-emerald-500/15 transition-all duration-500"
            style={{ width: `${awayPercent}%` }}
          />

          <div className="relative z-10 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold">
                AWAY WIN
              </span>
              <span className="text-xs font-black font-mono text-white">
                {awayPercent}%
              </span>
            </div>

            <div className="text-sm font-black text-white truncate group-hover:text-emerald-300 transition-colors">
              {awayGamerTag}
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] font-mono text-slate-500">
                {awayVotes} {awayVotes === 1 ? "vote" : "votes"}
              </span>
              {userPrediction === "AWAY" && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400">
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
