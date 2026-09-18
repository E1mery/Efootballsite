import { prisma } from "@/lib/prisma";
import FixturesClient from "./FixturesClient";
import { redirectAdminToPortal } from "@/lib/adminGuard";

export const dynamic = "force-dynamic";

export default async function FixturesPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; division?: string; round?: string }>;
}) {
  await redirectAdminToPortal();
  const params = await searchParams;
  const initialFilter = params.filter || "ALL";
  const initialDivision = params.division || "ALL";
  const initialRound = params.round || "ALL";

  let matches: any[] = [];
  let leagueConfig: any = { currentMatchday: 1 };
  let storedMotd: any = null;
  let allStandings: any[] = [];

  try {
    const results = await Promise.all([
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
    ]);

    const rawMatches = results[0];
    leagueConfig = results[1];
    storedMotd = results[2];
    allStandings = results[3];

    // Natural sort: Matchday 1, Matchday 2, ... Matchday 19
    matches = [...rawMatches].sort((a, b) => {
      const getRoundNum = (s: string) => {
        const match = s?.match(/\d+/);
        return match ? parseInt(match[0], 10) : 999;
      };
      const numA = getRoundNum(a.round || "");
      const numB = getRoundNum(b.round || "");
      if (numA !== numB) return numA - numB;
      return new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime();
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
    <FixturesClient
      initialMatches={matches}
      leagueConfig={leagueConfig}
      matchOfTheDay={matchOfTheDay}
      initialFilter={initialFilter}
      initialDivision={initialDivision}
      initialRound={initialRound}
    />
  );
}
