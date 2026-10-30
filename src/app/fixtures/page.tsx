import { prisma } from "@/lib/prisma";
import FixturesClient from "./FixturesClient";
import { redirectAdminToPortal } from "@/lib/adminGuard";
import AnimatedEfootballBackground from "@/components/AnimatedEfootballBackground";

export const dynamic = "force-dynamic";

export default async function FixturesPage({
  searchParams,
}: {
  searchParams: Promise<{
    filter?: string;
    division?: string;
    round?: string;
    q?: string;
    search?: string;
    highlight?: string;
  }>;
}) {
  await redirectAdminToPortal();
  const params = await searchParams;
  const initialFilter = params.filter || "ALL";
  const initialDivision = params.division || "ALL";
  const initialRound = params.round || "ALL";
  const initialSearch = params.q || params.search || "";
  const highlightId = params.highlight || "";

  let matches: any[] = [];
  let leagueConfig: any = { currentMatchday: 1 };
  let storedMotd: any = null;
  let allStandings: any[] = [];
  let isSeasonAwaitingKickoff = false;
  let seasonKickoffDate: string | null = null;

  try {
    const [rawMatches, cfg, motdMatch, standings, hasFinishedDivisionMatches, firstDivisionMatch] =
      await Promise.all([
        prisma.match.findMany({
          include: {
            homePlayer: true,
            awayPlayer: true,
            submissions: {
              where: { status: { in: ["APPROVED", "PENDING"] } },
              orderBy: { createdAt: "desc" },
              take: 1,
            },
            forfeitClaims: {
              where: { status: { in: ["APPROVED", "PENDING"] } },
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
          orderBy: [{ matchDate: "asc" }, { createdAt: "asc" }],
        }),
        prisma.leagueConfig.upsert({
          where: { id: "default" },
          update: {},
          create: { id: "default", currentMatchday: 1 },
        }),
        prisma.match.findFirst({
          where: { isMatchOfTheDay: true },
          include: { homePlayer: true, awayPlayer: true },
        }),
        prisma.standing.findMany({
          orderBy: [{ points: "desc" }, { goalDifference: "desc" }],
        }),
        prisma.match.findFirst({
          where: {
            division: { in: ["Division 1", "Division 2", "Division 3"] },
            status: { in: ["FINISHED", "FORFEIT"] },
          },
          select: { id: true },
        }),
        prisma.match.findFirst({
          where: {
            division: { in: ["Division 1", "Division 2", "Division 3"] },
          },
          orderBy: { matchDate: "asc" },
          select: { matchDate: true },
        }),
      ]);

    leagueConfig = cfg;
    storedMotd = motdMatch;
    allStandings = standings;

    const nowMs = Date.now();
    isSeasonAwaitingKickoff = Boolean(
      !hasFinishedDivisionMatches &&
      firstDivisionMatch &&
      nowMs < new Date(firstDivisionMatch.matchDate).getTime()
    );
    seasonKickoffDate = firstDivisionMatch?.matchDate
      ? new Date(firstDivisionMatch.matchDate).toISOString()
      : null;

    const visibleRawMatches = rawMatches.filter((m) => {
      if (m.division === "UCL" || m.division === "EUROPA") return true;
      // Before season kickoff, division matches remain sealed
      if (isSeasonAwaitingKickoff) {
        return false;
      }
      return true;
    });

    // Natural sort: Matchday 1, Matchday 2, ... Matchday 19
    matches = [...visibleRawMatches].sort((a, b) => {
      const getRoundNum = (s: string) => {
        const match = s?.match(/\d+/);
        return match ? parseInt(match[0], 10) : 999;
      };
      const numA = getRoundNum(a.round || "");
      const numB = getRoundNum(b.round || "");
      if (numA !== numB) return numA - numB;
      const timeA = new Date(a.matchDate).getTime() || 0;
      const timeB = new Date(b.matchDate).getTime() || 0;
      return timeA - timeB;
    });

    const roundNum = leagueConfig?.currentMatchday || 1;
    if (!storedMotd && roundNum > 1) {
      const { evaluateMatchOfTheDay } = await import("@/lib/matchOfTheDay");
      const roundMatches = await prisma.match.findMany({
        where: { round: `Matchday ${roundNum}` },
        include: { homePlayer: true, awayPlayer: true },
      });
      storedMotd = evaluateMatchOfTheDay(roundMatches, allStandings, roundNum);
    }
  } catch (error) {
    console.error("Fixtures fetch error:", error);
  }

  const currentRoundNum = leagueConfig?.currentMatchday || 1;
  const matchOfTheDay = currentRoundNum > 1 ? storedMotd : null;

  return (
    <div className="relative min-h-screen overflow-hidden pb-16">
      <AnimatedEfootballBackground />
      <div className="relative z-10">
        <FixturesClient
          initialMatches={matches}
          leagueConfig={leagueConfig}
          matchOfTheDay={matchOfTheDay}
          initialFilter={initialFilter}
          initialDivision={initialDivision}
          initialRound={initialRound}
          initialSearch={initialSearch}
          highlightId={highlightId}
          isSeasonAwaitingKickoff={isSeasonAwaitingKickoff}
          seasonKickoffDate={seasonKickoffDate}
        />
      </div>
    </div>
  );
}
