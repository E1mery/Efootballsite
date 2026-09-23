import { prisma } from "@/lib/prisma";
import PlayerCard from "@/components/PlayerCard";
import { Award, Zap, Smartphone, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { redirectAdminToPortal } from "@/lib/adminGuard";

export const dynamic = "force-dynamic";

export default async function PlayersPage() {
  await redirectAdminToPortal();
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
      <div className="border-b border-border pb-6">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="yellow">EFRL MOBILE STATS</Badge>
          <span className="text-xs font-bold text-primary uppercase tracking-widest">
            eFootball Mobile Leaderboards 2026
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black uppercase text-white tracking-tight">
          Player Leaderboards & Stats
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Tracking the top mobile goalscorers, playmaker assist leaders, and elite mobile athletes across Rwanda.
        </p>
      </div>

      {/* Golden Boot Showcase */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/20 text-secondary border border-secondary/30">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold uppercase text-white tracking-wide">
              Golden Boot Leaderboard
            </h2>
            <p className="text-xs text-muted-foreground">Most goals scored in eFootball Mobile Season 2026</p>
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
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary border border-primary/30">
            <Zap className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold uppercase text-white tracking-wide">
              Playmaker of the Season
            </h2>
            <p className="text-xs text-muted-foreground">Most assists recorded on eFootball Mobile</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {topAssists.map((player, idx) => (
            <div
              key={player.id}
              className="esports-card rounded-xl border border-border bg-card/60 p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-primary">#{idx + 1} Playmaker</span>
                <span className="text-sm font-black text-white">{player.assists} Ast</span>
              </div>
              <h4 className="text-sm font-extrabold text-white">{player.gamerTag}</h4>
              <p className="text-xs text-muted-foreground">{player.division}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Full Player Roster Table */}
      <section className="space-y-4 pt-4 border-t border-border">
        <h2 className="text-lg font-bold uppercase text-white tracking-wide">
          All Registered eFootball Mobile Athletes ({allPlayers.length})
        </h2>

        <div className="overflow-x-auto no-scrollbar scroll-smooth rounded-xl border border-border bg-card/50">
          <table className="w-full text-left text-xs text-foreground">
            <thead className="bg-background/80 uppercase font-bold text-xs text-muted-foreground border-b border-border">
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
            <tbody className="divide-y divide-border/60">
              {allPlayers.map((p) => (
                <tr key={p.id} className="hover:bg-muted/40 transition-colors whitespace-nowrap">
                  <td className="p-3.5 font-bold text-white">{p.gamerTag}</td>
                  <td className="p-3.5 text-muted-foreground">{p.fullName}</td>
                  <td className="p-3.5 font-mono text-muted-foreground">{p.efootballId}</td>
                  <td className="p-3.5 font-semibold text-secondary">{p.division}</td>
                  <td className="p-3.5 font-mono text-primary">{p.whatsapp}</td>
                  <td className="p-3.5 text-center">
                    <span className="inline-block px-2 py-0.5 rounded bg-secondary/20 text-secondary font-bold">
                      {p.overallRating}
                    </span>
                  </td>
                  <td className="p-3.5 text-center font-bold text-secondary">{p.goals}</td>
                  <td className="p-3.5 text-center font-bold text-primary">{p.assists}</td>
                  <td className="p-3.5 text-center font-bold text-primary">{p.mvpAwards}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
