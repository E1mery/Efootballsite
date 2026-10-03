import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  Trophy,
  Globe,
  LogIn,
  UserPlus,
  Crown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cookies } from "next/headers";
import { getCarouselSlides } from "@/lib/carouselData";
import NewsTrendingCarousel from "@/components/NewsTrendingCarousel";
import AnimatedEfootballBackground from "@/components/AnimatedEfootballBackground";
import MatchCard from "@/components/MatchCard";
import HallOfFameCarousel from "@/components/HallOfFameCarousel";
import { redirectAdminToPortal } from "@/lib/adminGuard";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams?: Promise<{ loggedOut?: string }>;
}) {
  const params = searchParams ? await searchParams : {};
  const loggedOutType = params.loggedOut;

  if (!loggedOutType) {
    await redirectAdminToPortal();
  }

  let liveMatches: any[] = [];
  let recentMatches: any[] = [];
  let hallOfFame: any[] = [];
  let leagueConfig: any = { registrationOpen: true, currentMatchday: 1 };
  let carouselSlides: any[] = [];
  let userSession: any = null;

  try {
    const cookieStore = await cookies();
    const sessionUserId = cookieStore.get("efrl_session")?.value;

    const [
      liveResults,
      recentResults,
      cfgResult,
      hofResults,
      slidesResult,
      userResult,
    ] = await Promise.all([
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
      prisma.leagueConfig.upsert({
        where: { id: "default" },
        update: {},
        create: { id: "default", registrationOpen: true, currentMatchday: 1 },
      }),
      prisma.hallOfFame.findMany({
        orderBy: { createdAt: "desc" },
        take: 12,
      }),
      getCarouselSlides(),
      sessionUserId
        ? prisma.user.findUnique({
            where: { id: sessionUserId },
            include: { player: true },
          })
        : null,
    ]);

    liveMatches = liveResults;
    recentMatches = recentResults;
    leagueConfig = cfgResult;
    hallOfFame = hofResults || [];
    carouselSlides = slidesResult;
    if (userResult) {
      userSession = {
        authenticated: true,
        user: { id: userResult.id, email: userResult.email, role: userResult.role },
        player: userResult.player,
      };
    }
  } catch (error) {
    console.error("HomePage data query error:", error);
  }

  const featuredLiveMatch = liveMatches[0];

  return (
    <div className="relative space-y-16 pb-20 overflow-hidden">
      {/* Animated eFootball Background */}
      <AnimatedEfootballBackground />



      {/* ========================================================================= */}
      {/* TOP SPORTS RADAR / TRENDING SLIDER */}
      {/* ========================================================================= */}
      <div className="pt-2 sm:pt-4">
        <NewsTrendingCarousel slides={carouselSlides} userSession={userSession} />
      </div>


      {/* MAIN USER ACTIONS HUB (What users can do) */}
      <section className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-left">
          {/* Action 1: Player Login */}
          <Link
            href="/login"
            className="group p-5 rounded-2xl bg-card/80 border border-border hover:border-primary/50 hover:bg-card transition-all shadow-xl backdrop-blur-md flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 group-hover:scale-105 transition-transform">
                <LogIn className="h-5 w-5" />
              </div>
              <h3 className="font-black text-sm uppercase text-white tracking-wide">Player Portal</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Sign in to view your 24-hr match, submit scores, and check division MOTD.
              </p>
            </div>
            <span className="mt-4 text-xs font-bold text-primary group-hover:underline flex items-center gap-1">
              Enter Portal →
            </span>
          </Link>

          {/* Action 2: Registration */}
          <Link
            href="/register"
            className="group p-5 rounded-2xl bg-card/80 border border-border hover:border-secondary/50 hover:bg-card transition-all shadow-xl backdrop-blur-md flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10 text-secondary border border-secondary/20 group-hover:scale-105 transition-transform">
                <UserPlus className="h-5 w-5" />
              </div>
              <h3 className="font-black text-sm uppercase text-white tracking-wide">Join Season</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Register as an athlete in 3 divisions with WhatsApp match scheduling.
              </p>
            </div>
            <span className="mt-4 text-xs font-bold text-secondary group-hover:underline flex items-center gap-1">
              Register Athlete →
            </span>
          </Link>

          {/* Action 4: Continental Cups */}
          <Link
            href="/continental"
            className="group p-5 rounded-2xl bg-card/80 border border-border hover:border-primary/50 hover:bg-card transition-all shadow-xl backdrop-blur-md flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 group-hover:scale-105 transition-transform">
                <Globe className="h-5 w-5" />
              </div>
              <h3 className="font-black text-sm uppercase text-white tracking-wide">UCL & Europa</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Post-season continental championship with two-legged home and away fixtures.
              </p>
            </div>
            <span className="mt-4 text-xs font-bold text-primary group-hover:underline flex items-center gap-1">
              View Continental →
            </span>
          </Link>
        </div>
      </section>

      {/* LIVE BROADCAST MATCH (IF ANY) */}
      {featuredLiveMatch && (
        <section className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-destructive/30 bg-card/90 p-6 backdrop-blur-xl shadow-2xl">
            <div className="flex items-center gap-3 mb-4 border-b border-border pb-3">
              <Badge variant="destructive" className="text-xs px-2.5 py-1 uppercase font-bold">
                🔴 CURRENTLY LIVE ON STREAM
              </Badge>
              <span className="text-xs font-semibold text-foreground">
                {featuredLiveMatch.round} • {featuredLiveMatch.division}
              </span>
            </div>
            <MatchCard match={featuredLiveMatch} />
          </div>
        </section>
      )}


      {/* ========================================================================= */}
      {/* HALL OF FAME: IMMORTALIZED CHAMPIONS */}
      {/* ========================================================================= */}
      <section id="hall-of-fame" className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-secondary/20 pb-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary/10 border border-secondary/30">
                <Crown className="h-5 w-5" />
              </div>
              <h2 className="text-2xl font-black uppercase text-white tracking-tight">
                EFRL Hall of Fame
              </h2>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Honoring the legendary esports champions who conquered Rwanda&apos;s most competitive eFootball tournaments.
            </p>
          </div>
        </div>

        <HallOfFameCarousel entries={hallOfFame} />
      </section>


    </div>
  );
}
