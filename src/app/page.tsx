import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  Trophy,
  Calendar,
  Flame,
  ArrowRight,
  Gamepad2,
  Shield,
  ShieldAlert,
  Globe,
  LogIn,
  UserPlus,
  ExternalLink,
  Clock,
  Sparkles,
  CheckCircle2,
  Crown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import EfootballGamingLogo from "@/components/EfootballGamingLogo";
import AnimatedEfootballBackground from "@/components/AnimatedEfootballBackground";
import HomeDivisionsTabs from "@/components/HomeDivisionsTabs";
import MatchCard from "@/components/MatchCard";
import { checkAndAutoAdvanceDailyCycle } from "@/lib/autoDailyCycle";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams?: Promise<{ loggedOut?: string }>;
}) {
  const params = searchParams ? await searchParams : {};
  const loggedOutType = params.loggedOut;

  // Run autonomous midnight daily cycle check without requiring admin permission
  await checkAndAutoAdvanceDailyCycle();

  let liveMatches: any[] = [];
  let recentMatches: any[] = [];
  let div1Standings: any[] = [];
  let div2Standings: any[] = [];
  let div3Standings: any[] = [];
  let hallOfFame: any[] = [];
  let leagueConfig: any = { registrationOpen: true, currentMatchday: 1 };

  try {
    const results = await Promise.all([
      prisma.match.findMany({
        where: { status: "LIVE" },
        include: { homePlayer: true, awayPlayer: true },
        take: 1,
      }),
      prisma.match.findMany({
        where: { status: { in: ["FINISHED", "FORFEIT"] } },
        include: { homePlayer: true, awayPlayer: true },
        orderBy: { matchDate: "desc" },
        take: 3,
      }),
      prisma.standing.findMany({
        where: { division: "Division 1" },
        include: { player: true },
        orderBy: [{ points: "desc" }, { goalDifference: "desc" }, { goalsFor: "desc" }],
        take: 20,
      }),
      prisma.standing.findMany({
        where: { division: "Division 2" },
        include: { player: true },
        orderBy: [{ points: "desc" }, { goalDifference: "desc" }, { goalsFor: "desc" }],
        take: 20,
      }),
      prisma.standing.findMany({
        where: { division: "Division 3" },
        include: { player: true },
        orderBy: [{ points: "desc" }, { goalDifference: "desc" }, { goalsFor: "desc" }],
        take: 20,
      }),
      prisma.leagueConfig.upsert({
        where: { id: "default" },
        update: {},
        create: { id: "default", registrationOpen: true, currentMatchday: 1 },
      }),
      prisma.hallOfFame.findMany({
        orderBy: { createdAt: "desc" },
        take: 12,
      }),
    ]);

    liveMatches = results[0];
    recentMatches = results[1];
    div1Standings = results[2];
    div2Standings = results[3];
    div3Standings = results[4];
    leagueConfig = results[5];
    hallOfFame = results[6] || [];
  } catch (error) {
    console.error("HomePage data query error:", error);
  }

  const featuredLiveMatch = liveMatches[0];

  return (
    <div className="relative space-y-16 pb-20 overflow-hidden">
      {/* Animated eFootball Background */}
      <AnimatedEfootballBackground />

      {/* Post-Logout Notification Banner */}
      {loggedOutType && (
        <div className="relative z-20 mx-auto max-w-5xl px-4 pt-6">
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-cyan-500/40 bg-[#081226]/90 p-4 backdrop-blur-xl shadow-xl">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                  {loggedOutType === "admin" ? "Admin Office Logged Out" : "Player Account Logged Out"}
                </h4>
                <p className="text-xs text-slate-300">
                  You now have open access to all external resources, standings, match results, and community links below.
                </p>
              </div>
            </div>
            <Link href={loggedOutType === "admin" ? "/admin/login" : "/login"}>
              <Button variant="outline" size="sm" className="border-cyan-500/40 text-cyan-300 text-xs font-bold">
                Sign In Again
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* HERO SECTION */}
      <section className="relative z-10 pt-12 sm:pt-20 text-center px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-8">
        {/* System Gaming Logo and League Badge */}
        <div className="flex flex-col items-center justify-center gap-4">
          <EfootballGamingLogo size="xl" showText={false} />

          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-xs font-bold text-cyan-300 shadow-lg shadow-cyan-500/10">
            <Gamepad2 className="h-4 w-4 text-amber-400" />
            <span>RWANDA EFOOTBALL ESPORTS LEAGUE • 3 DIVISIONS</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black uppercase tracking-tight text-white leading-none">
            Competitive <br />
            <span className="efootball-gradient-text">eFootball Rwanda</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            The official national digital football championship. Athletes compete across <strong>Division 1, 2, and 3</strong> in daily <strong>24-hour matchday cycles</strong>, coordinated via WhatsApp with automated season-end promotions.
          </p>
        </div>

        {/* MAIN USER ACTIONS HUB (What users can do) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 text-left">
          {/* Action 1: Player Login */}
          <Link
            href="/login"
            className="group p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-900 transition-all shadow-xl backdrop-blur-md flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 group-hover:scale-105 transition-transform">
                <LogIn className="h-5 w-5" />
              </div>
              <h3 className="font-black text-sm uppercase text-white tracking-wide">Player Portal</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Sign in to view your 24-hr match, submit scores, and check division MOTD.
              </p>
            </div>
            <span className="mt-4 text-xs font-bold text-cyan-400 group-hover:underline flex items-center gap-1">
              Enter Portal →
            </span>
          </Link>

          {/* Action 2: Registration */}
          <Link
            href="/register"
            className="group p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-900 transition-all shadow-xl backdrop-blur-md flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:scale-105 transition-transform">
                <UserPlus className="h-5 w-5" />
              </div>
              <h3 className="font-black text-sm uppercase text-white tracking-wide">Join Season</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Register as an athlete in 3 divisions with WhatsApp match scheduling.
              </p>
            </div>
            <span className="mt-4 text-xs font-bold text-amber-400 group-hover:underline flex items-center gap-1">
              Register Athlete →
            </span>
          </Link>

          {/* Action 3: Admin Office */}
          <Link
            href="/admin"
            className="group p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-red-500/50 hover:bg-slate-900 transition-all shadow-xl backdrop-blur-md flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 group-hover:scale-105 transition-transform">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <h3 className="font-black text-sm uppercase text-white tracking-wide">Admin Office</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Commissioner desk: inspect score screenshots, input verified goals, manage league.
              </p>
            </div>
            <span className="mt-4 text-xs font-bold text-red-400 group-hover:underline flex items-center gap-1">
              Admin Office Access →
            </span>
          </Link>

          {/* Action 4: Continental Cups */}
          <Link
            href="/continental"
            className="group p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-900 transition-all shadow-xl backdrop-blur-md flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:scale-105 transition-transform">
                <Globe className="h-5 w-5" />
              </div>
              <h3 className="font-black text-sm uppercase text-white tracking-wide">UCL & Europa</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Post-season continental championship with two-legged home and away fixtures.
              </p>
            </div>
            <span className="mt-4 text-xs font-bold text-emerald-400 group-hover:underline flex items-center gap-1">
              View Continental →
            </span>
          </Link>
        </div>
      </section>

      {/* SOCIAL MEDIA & EXTERNAL RESOURCES SECTION */}
      <section className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-800 bg-[#080d1e]/80 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-400" />
                <h2 className="text-lg sm:text-xl font-black uppercase text-white tracking-wide">
                  Official Community & Social Channels
                </h2>
              </div>
              <p className="text-xs text-slate-400 max-w-xl">
                Connect with Rwandan esports athletes, find match opponents on Discord, and view match highlights on our official Instagram channel.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Discord Link */}
              <a
                href="https://discord.gg/rbaFrBB5p"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-5 py-3 rounded-xl bg-[#5865F2]/15 border border-[#5865F2]/40 hover:bg-[#5865F2]/25 text-white transition-all shadow-lg hover:scale-105"
              >
                <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-bold tracking-wider">Join Official Discord</span>
                <ExternalLink className="h-3.5 w-3.5 text-slate-300" />
              </a>

              {/* Instagram Link */}
              <a
                href="https://www.instagram.com/efootball_rwanda1/?utm_source=ig_web_button_share_sheet&stkn=ZDNlZDc0MzIxNw%3D%3D"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-5 py-3 rounded-xl bg-gradient-to-r from-pink-600/20 to-purple-600/20 border border-pink-500/40 hover:from-pink-600/30 hover:to-purple-600/30 text-white transition-all shadow-lg hover:scale-105"
              >
                <span className="flex h-2.5 w-2.5 rounded-full bg-pink-500" />
                <span className="text-xs font-bold tracking-wider">Follow on Instagram</span>
                <ExternalLink className="h-3.5 w-3.5 text-slate-300" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* LIVE BROADCAST MATCH (IF ANY) */}
      {featuredLiveMatch && (
        <section className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-red-500/40 bg-gradient-to-r from-red-950/40 via-slate-900/90 to-slate-950/80 p-6 backdrop-blur-xl shadow-2xl">
            <div className="flex items-center gap-3 mb-4 border-b border-red-500/20 pb-3">
              <Badge variant="destructive" className="text-xs px-2.5 py-1 uppercase font-bold">
                🔴 CURRENTLY LIVE ON STREAM
              </Badge>
              <span className="text-xs font-semibold text-slate-300">
                {featuredLiveMatch.round} • {featuredLiveMatch.division}
              </span>
            </div>
            <MatchCard match={featuredLiveMatch} />
          </div>
        </section>
      )}

      {/* ALL 3 DIVISIONS STANDINGS TABLES */}
      <section className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Trophy className="h-6 w-6 text-amber-400" />
              <h2 className="text-2xl font-black uppercase text-white tracking-tight">
                All Divisions Official Standings
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Live tournament rankings across Division 1, Division 2, and Division 3.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-cyan-500/30 text-cyan-400 font-mono text-[10px]">
              MATCHDAY {leagueConfig.currentMatchday}
            </Badge>
            <Badge variant="outline" className="border-amber-500/30 text-amber-400 font-mono text-[10px]">
              24-HR CYCLE
            </Badge>
          </div>
        </div>

        {/* Home Divisions Tabs displaying all 3 division tables */}
        <HomeDivisionsTabs
          div1Standings={div1Standings}
          div2Standings={div2Standings}
          div3Standings={div3Standings}
        />
      </section>

      {/* ========================================================================= */}
      {/* HALL OF FAME: IMMORTALIZED CHAMPIONS */}
      {/* ========================================================================= */}
      <section className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-yellow-500/20 pb-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-400">
                <Crown className="h-5 w-5" />
              </div>
              <h2 className="text-2xl font-black uppercase text-white tracking-tight">
                EFRL Hall of Fame
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Honoring the legendary esports champions who conquered Rwanda&apos;s most competitive eFootball tournaments.
            </p>
          </div>

          <Badge variant="yellow" className="self-start sm:self-auto font-mono text-[10px] tracking-wider uppercase">
            🏆 Championship Heritage
          </Badge>
        </div>

        {hallOfFame.length === 0 ? (
          <div className="rounded-3xl border border-slate-800/80 bg-slate-950/60 p-10 text-center backdrop-blur-md">
            <Crown className="h-10 w-10 text-yellow-500/40 mx-auto mb-2.5" />
            <h4 className="text-sm font-bold text-white uppercase">Inaugural Season in Progress</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              Championship winners across Division 1, Division 2, Division 3, UCL, and Europa League will be immortalized here upon tournament conclusion.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {hallOfFame.map((entry) => (
              <div
                key={entry.id}
                className="relative group overflow-hidden rounded-3xl border border-yellow-500/20 bg-gradient-to-b from-[#0e1628]/90 to-[#070b16]/90 p-6 space-y-4 shadow-xl hover:border-yellow-500/40 transition-all duration-300 backdrop-blur-md flex flex-col justify-between"
              >
                {/* Gold Glow decoration */}
                <div className="absolute -top-10 -right-10 w-28 h-28 bg-yellow-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-yellow-500/20 transition-all" />

                <div className="space-y-3 relative z-10">
                  <div className="flex items-start justify-between gap-2">
                    <Badge
                      variant="yellow"
                      className="text-[10px] uppercase font-bold tracking-wider"
                    >
                      {entry.season}
                    </Badge>
                    <div className="h-8 w-8 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center shrink-0">
                      <Trophy className="h-4 w-4 text-yellow-400" />
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] font-mono text-slate-400 block uppercase tracking-wider">
                      Tournament Title
                    </span>
                    <h3 className="text-sm font-bold text-slate-200 line-clamp-1">{entry.tournamentName}</h3>
                  </div>

                  <div className="p-4 rounded-2xl bg-yellow-950/20 border border-yellow-500/20 space-y-1">
                    <span className="text-[10px] font-mono uppercase text-yellow-400 font-extrabold tracking-wider block">
                      👑 Champion
                    </span>
                    <div className="text-xl font-black text-white tracking-wide">
                      {entry.championName}
                    </div>
                    {entry.championRealName && (
                      <div className="text-xs text-slate-300 font-medium">
                        {entry.championRealName}
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span>Honored</span>
                  <span>{new Date(entry.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* MAIN SYSTEM FEATURES & RULES */}
      <section className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-cyan-500/20 bg-[#080d1e]/70 p-6 space-y-3 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <Badge variant="default" className="text-[10px] bg-cyan-500/20 text-cyan-300 border-cyan-500/30">
                1 MATCH PER PAIRING
              </Badge>
              <Clock className="h-4 w-4 text-cyan-400" />
            </div>
            <h3 className="text-base font-black uppercase text-white">One-Way 24-Hr Matchdays</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every matchday runs on a strict 24-hour window expiring at 12:00 AM midnight. All division fixtures are single round robin (1 match only).
            </p>
          </div>

          <div className="rounded-2xl border border-amber-500/20 bg-[#080d1e]/70 p-6 space-y-3 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <Badge variant="yellow" className="text-[10px] bg-amber-500/20 text-amber-300 border-amber-500/30">
                AUTOMATIC PROMOTION
              </Badge>
              <Trophy className="h-4 w-4 text-amber-400" />
            </div>
            <h3 className="text-base font-black uppercase text-white">Division 2 & 3 Top 3 Promoted</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              At the end of the season, the top 3 ranked players in Division 2 earn automatic promotion to Division 1, and the top 3 in Division 3 promote to Division 2.
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-500/20 bg-[#080d1e]/70 p-6 space-y-3 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-[10px] bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                POST-SEASON
              </Badge>
              <Globe className="h-4 w-4 text-emerald-400" />
            </div>
            <h3 className="text-base font-black uppercase text-white">eFootball UCL & Europa</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Continental cup showdowns featuring 16 top performers from all divisions in group stages followed by two-legged home & away knockouts.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
