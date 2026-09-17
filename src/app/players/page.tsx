import { prisma } from "@/lib/prisma";
import PlayerCard from "@/components/PlayerCard";
import { Award, Zap, Smartphone, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function PlayersPage() {
  let topScorers: any[] = [];
  let topAssists: any[] = [];
  let allPlayers: any[] = [];

  try {
    const results = await Promise.all([
      prisma.player.findMany({
        orderBy: { goals: "desc" },
        take: 6,
      }),
      prisma.player.findMany({
        orderBy: { assists: "desc" },
        take: 4,
      }),
      prisma.player.findMany({
        orderBy: { overallRating: "desc" },
      }),
    ]);
    topScorers = results[0];
    topAssists = results[1];
    allPlayers = results[2];
  } catch (error) {
    console.error("Players fetch error:", error);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Header */}
      <div className="border-b border-slate-800 pb-6">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="yellow">EFRL MOBILE STATS</Badge>
          <span className="text-xs font-bold text-sky-400 uppercase tracking-widest">
            eFootball Mobile Leaderboards 2026
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black uppercase text-white tracking-tight">
          Player Leaderboards & Stats
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Tracking the top mobile goalscorers, playmaker assist leaders, and elite mobile athletes across Rwanda.
        </p>
      </div>

      {/* Golden Boot Showcase */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold uppercase text-white tracking-wide">
              Golden Boot Leaderboard
            </h2>
            <p className="text-xs text-slate-400">Most goals scored in eFootball Mobile Season 2026</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {topScorers.map((player, idx) => (
            <PlayerCard key={player.id} player={player} rank={idx + 1} />
          ))}
        </div>
      </section>

      {/* Playmaker Assist Leaders */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
            <Zap className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold uppercase text-white tracking-wide">
              Playmaker of the Season
            </h2>
            <p className="text-xs text-slate-400">Most assists recorded on eFootball Mobile</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {topAssists.map((player, idx) => (
            <div
              key={player.id}
              className="esports-card rounded-xl border border-slate-800 bg-slate-900/60 p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-sky-400">#{idx + 1} Playmaker</span>
                <span className="text-sm font-black text-white">{player.assists} Ast</span>
              </div>
              <h4 className="text-sm font-extrabold text-white">{player.gamerTag}</h4>
              <p className="text-xs text-slate-400">{player.division}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Full Player Roster Table */}
      <section className="space-y-4 pt-4 border-t border-slate-800">
        <h2 className="text-lg font-bold uppercase text-white tracking-wide">
          All Registered eFootball Mobile Athletes ({allPlayers.length})
        </h2>

        <div className="overflow-x-auto no-scrollbar scroll-smooth rounded-xl border border-slate-800 bg-slate-900/50">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 uppercase font-bold text-[11px] text-slate-400 border-b border-slate-800">
              <tr className="whitespace-nowrap">
                <th className="p-3.5">Gamer Tag</th>
                <th className="p-3.5">Full Name</th>
                <th className="p-3.5">Konami Mobile ID</th>
                <th className="p-3.5">Division</th>
                <th className="p-3.5">WhatsApp</th>
                <th className="p-3.5 text-center">OVR</th>
                <th className="p-3.5 text-center">Goals</th>
                <th className="p-3.5 text-center">Assists</th>
                <th className="p-3.5 text-center">MVP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {allPlayers.map((p) => (
                <tr key={p.id} className="hover:bg-slate-800/40 transition-colors whitespace-nowrap">
                  <td className="p-3.5 font-bold text-white">{p.gamerTag}</td>
                  <td className="p-3.5 text-slate-400">{p.fullName}</td>
                  <td className="p-3.5 font-mono text-slate-500">{p.efootballId}</td>
                  <td className="p-3.5 font-semibold text-yellow-400">{p.division}</td>
                  <td className="p-3.5 font-mono text-emerald-400">{p.whatsapp}</td>
                  <td className="p-3.5 text-center">
                    <span className="inline-block px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400 font-bold">
                      {p.overallRating}
                    </span>
                  </td>
                  <td className="p-3.5 text-center font-bold text-yellow-400">{p.goals}</td>
                  <td className="p-3.5 text-center font-bold text-sky-400">{p.assists}</td>
                  <td className="p-3.5 text-center font-bold text-emerald-400">{p.mvpAwards}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
