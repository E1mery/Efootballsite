import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Trophy, Calendar, Flame, ArrowRight, Smartphone, Award, Clock, ChevronRight, Globe, AlertTriangle, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import MatchCard from "@/components/MatchCard";
import StandingsTable from "@/components/StandingsTable";
import PlayerCard from "@/components/PlayerCard";
import MatchOfTheDayCard from "@/components/MatchOfTheDayCard";
import { evaluateMatchOfTheDay } from "@/lib/matchOfTheDay";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [
    liveMatches,
    recentMatches,
    upcomingMatches,
    div1Standings,
    allStandings,
    topPlayers,
    announcements,
    leagueConfig,
    storedMotd,
  ] = await Promise.all([
    prisma.match.findMany({
      where: { status: "LIVE" },
      include: {
        homePlayer: true,
        awayPlayer: true,
      },
      take: 1,
    }),
      prisma.match.findMany({
        where: { status: { in: ["FINISHED", "FORFEIT"] } },
        include: {
          homePlayer: true,
          awayPlayer: true,
        },
        orderBy: { matchDate: "desc" },
        take: 3,
      }),
      prisma.match.findMany({
        where: { status: "SCHEDULED" },
        include: {
          homePlayer: true,
          awayPlayer: true,
        },
        orderBy: { matchDate: "asc" },
        take: 3,
      }),
      prisma.standing.findMany({
        where: { division: "Division 1" },
        include: {
          player: true,
        },
        orderBy: [{ points: "desc" }, { goalDifference: "desc" }],
        take: 6,
      }),
      prisma.standing.findMany({
        orderBy: [{ points: "desc" }, { goalDifference: "desc" }],
      }),
      prisma.player.findMany({
        orderBy: { goals: "desc" },
        take: 4,
      }),
      prisma.announcement.findMany({
        where: { type: "BROADCAST" },
        orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
        take: 1,
      }),
      prisma.leagueConfig.upsert({
        where: { id: "default" },
        update: {},
        create: { id: "default", registrationOpen: true, currentMatchday: 1 },
      }),
      prisma.match.findFirst({
        where: { isMatchOfTheDay: true },
        include: { homePlayer: true, awayPlayer: true },
      }),
    ]);

  const currentRoundNum = leagueConfig?.currentMatchday || 1;
  let matchOfTheDay = storedMotd;

  // Rule: Match of the Day based on table standings except on the first round
  if (!matchOfTheDay && currentRoundNum > 1) {
    const roundMatches = await prisma.match.findMany({
      where: { round: `Matchday ${currentRoundNum}` },
      include: { homePlayer: true, awayPlayer: true },
    });
    matchOfTheDay = evaluateMatchOfTheDay(roundMatches, allStandings, currentRoundNum);
  }

  const featuredLiveMatch = liveMatches[0];
  const latestAnnouncement = announcements[0];

  return (
    <div className="space-y-12 pb-16">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden border-b border-slate-800/80 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-16 sm:py-24">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-sky-500/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-20 right-10 w-[300px] h-[200px] bg-yellow-500/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          {/* Tagline Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-4 py-1.5 text-xs sm:text-sm font-bold text-sky-400 mb-6 shadow-lg shadow-sky-500/10">
            <Smartphone className="h-4 w-4 text-yellow-400" />
            <span>RWANDA EFOOTBALL MOBILE LEAGUE • 3 DIVISIONS • SEASON 2026</span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white uppercase max-w-4xl mx-auto leading-none">
            Competitive <br />
            <span className="rwanda-gradient-text">eFootball Mobile</span> League
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Rwanda's official mobile gaming championship. Athletes compete across <strong>Division 1, 2, and 3</strong> (max 20 players each) in daily <strong>24-hour matchday cycles</strong>, coordinate matches on WhatsApp, and qualify for the post-season <strong>eFootball UCL</strong>!
          </p>

          {/* CTA Action Buttons */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link href="/dashboard">
              <Button variant="yellow" size="lg" className="gap-2 shadow-xl font-black">
                <Smartphone className="h-5 w-5 text-slate-950" />
                Player Match Dashboard
              </Button>
            </Link>
            <Link href="/standings">
              <Button variant="default" size="lg" className="gap-2 font-bold">
                <Trophy className="h-5 w-5" />
                View 3 Divisions Standings
              </Button>
            </Link>
            <Link href="/register">
              <Button variant="outline" size="lg" className="gap-2">
                <Flame className="h-5 w-5 text-yellow-400" />
                Join Season (Register)
              </Button>
            </Link>
          </div>

          {/* Metrics */}
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto border-t border-slate-800/80 pt-8 text-center">
            <div>
              <span className="text-2xl sm:text-3xl font-black text-white">3 Tiers</span>
              <span className="block text-xs uppercase tracking-wider text-slate-400 mt-1 font-semibold">
                Div 1, Div 2, Div 3
              </span>
            </div>
            <div>
              <span className="text-2xl sm:text-3xl font-black text-yellow-400">20 Max</span>
              <span className="block text-xs uppercase tracking-wider text-slate-400 mt-1 font-semibold">
                Players / Division
              </span>
            </div>
            <div>
              <span className="text-2xl sm:text-3xl font-black text-emerald-400">24 Hours</span>
              <span className="block text-xs uppercase tracking-wider text-slate-400 mt-1 font-semibold">
                Matchday Window
              </span>
            </div>
            <div>
              <span className="text-2xl sm:text-3xl font-black text-red-400">Bottom 3</span>
              <span className="block text-xs uppercase tracking-wider text-slate-400 mt-1 font-semibold">
                Relegation Drop
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* LATEST LEAGUE ANNOUNCEMENT BANNER */}
      {latestAnnouncement && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-yellow-500/40 bg-yellow-500/10 p-4 sm:p-5 flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-yellow-500 text-slate-950 font-black">
              📢
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="yellow" className="text-[10px]">
                  LEAGUE ANNOUNCEMENT
                </Badge>
                <span className="text-xs font-bold text-white">{latestAnnouncement.title}</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {latestAnnouncement.content}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* FEATURED LIVE MATCH */}
      {featuredLiveMatch && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-2xl border border-red-500/40 bg-gradient-to-r from-red-950/40 via-slate-900/90 to-slate-950/80 p-6 backdrop-blur-xl shadow-2xl">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4 border-b border-red-500/20 pb-4">
              <div className="flex items-center gap-3">
                <Badge variant="live" className="text-xs px-2.5 py-1">
                  🔴 CURRENTLY LIVE ON STREAM
                </Badge>
                <span className="text-sm font-semibold text-slate-300">
                  {featuredLiveMatch.round} • eFootball Mobile
                </span>
              </div>
            </div>
            <MatchCard match={featuredLiveMatch} />
          </div>
        </section>
      )}

      {/* OFFICIAL MATCH OF THE DAY SECTION */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {matchOfTheDay ? (
          <MatchOfTheDayCard match={matchOfTheDay} />
        ) : (
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-2.5">
              <span className="flex h-2.5 w-2.5 rounded-full bg-yellow-400" />
              <span className="font-bold text-slate-300 uppercase tracking-wider">
                Match of the Day Engine:
              </span>
              <span>
                Based on current table standings. Selection activates from <strong>Matchday 2 onwards</strong>.
              </span>
            </div>
            <Badge variant="secondary" className="font-mono text-[10px] w-fit">
              Round 1 Excluded by Official Rule
            </Badge>
          </div>
        )}
      </section>

      {/* TWO-COLUMN CONTENT: MATCHES vs STANDINGS */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Recent & Upcoming Matches */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-sky-400" />
                <h2 className="text-xl font-black uppercase text-white tracking-wide">
                  Daily 24-Hr Matchday Fixtures
                </h2>
              </div>
              <Link
                href="/fixtures"
                className="text-xs font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1"
              >
                All Fixtures <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Latest Verified Results
              </h3>
              {recentMatches.length === 0 ? (
                <p className="text-xs text-slate-500 italic p-4 border border-slate-800 rounded-xl bg-slate-900/40">
                  No verified results yet. Submit results with screenshots on your player dashboard!
                </p>
              ) : (
                recentMatches.map((match) => <MatchCard key={match.id} match={match} />)
              )}
            </div>

            <div className="space-y-4 pt-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-yellow-400" />
                Active 24-Hour Schedule (Expiring 12:00 AM)
              </h3>
              {upcomingMatches.length === 0 ? (
                <p className="text-xs text-slate-500 italic p-4 border border-slate-800 rounded-xl bg-slate-900/40">
                  New daily fixtures will drop automatically at 12:00 AM midnight.
                </p>
              ) : (
                upcomingMatches.map((match) => <MatchCard key={match.id} match={match} />)
              )}
            </div>
          </div>

          {/* Right Column: Standings & Golden Boot */}
          <div className="lg:col-span-5 space-y-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-400" />
                  <h2 className="text-xl font-black uppercase text-white tracking-wide">
                    Division 1 Standings
                  </h2>
                </div>
                <Link
                  href="/standings"
                  className="text-xs font-bold text-yellow-400 hover:text-yellow-300 flex items-center gap-1"
                >
                  All 3 Divisions <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-1">
                <StandingsTable
                  standings={div1Standings}
                  divisionName="Division 1"
                  compact={true}
                />
              </div>
            </div>

            {/* Top Scorers */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-emerald-400" />
                  <h2 className="text-xl font-black uppercase text-white tracking-wide">
                    Top Goalscorers
                  </h2>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {topPlayers.map((player, idx) => (
                  <PlayerCard key={player.id} player={player} rank={idx + 1} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3 DIVISIONS TILES */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-sky-500/30 bg-slate-900/70 p-6 space-y-3">
            <Badge variant="default">1ST DIVISION</Badge>
            <h3 className="text-lg font-black uppercase text-white">Premiership (Mobile)</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Max 20 mobile players. Top 8 advance to UCL, 9th–12th to Europa League. Bottom 3 relegated to 2nd Division.
            </p>
            <Link href="/standings?division=Division%201" className="inline-block text-xs font-bold text-sky-400 hover:underline">
              View Division 1 Table →
            </Link>
          </div>

          <div className="rounded-2xl border border-yellow-500/30 bg-slate-900/70 p-6 space-y-3">
            <Badge variant="yellow">2ND DIVISION</Badge>
            <h3 className="text-lg font-black uppercase text-white">Championship (Mobile)</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Max 20 mobile players. Top 3 promoted to Div 1. Top 4 qualify for UCL. Bottom 3 relegated to 3rd Division.
            </p>
            <Link href="/standings?division=Division%202" className="inline-block text-xs font-bold text-yellow-400 hover:underline">
              View Division 2 Table →
            </Link>
          </div>

          <div className="rounded-2xl border border-emerald-500/30 bg-slate-900/70 p-6 space-y-3">
            <Badge variant="green">3RD DIVISION</Badge>
            <h3 className="text-lg font-black uppercase text-white">National Academy (Mobile)</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Max 20 mobile players. Top 3 promoted to Div 2. Top 4 qualify for UCL. Bottom 3 relegated to Open Qualifiers.
            </p>
            <Link href="/standings?division=Division%203" className="inline-block text-xs font-bold text-emerald-400 hover:underline">
              View Division 3 Table →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
