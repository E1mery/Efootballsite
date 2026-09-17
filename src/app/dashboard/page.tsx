import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import DashboardClient from "./DashboardClient";
import { checkAndAutoAdvanceDailyCycle } from "@/lib/autoDailyCycle";
import { evaluateAllDivisionsMatchOfTheDay } from "@/lib/matchOfTheDay";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const sessionUserId = cookieStore.get("efrl_session")?.value;

  if (!sessionUserId) {
    redirect("/login");
  }

  // Automatic midnight cycle check
  await checkAndAutoAdvanceDailyCycle();

  const user = await prisma.user.findUnique({
    where: { id: sessionUserId },
    include: {
      player: {
        include: {
          standings: true,
        },
      },
    },
  });

  if (!user || !user.player) {
    redirect("/login");
  }

  const player = user.player;

  // League configuration for current matchday
  const leagueConfig = await prisma.leagueConfig.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default", currentMatchday: 1 },
  });

  const currentRoundName = `Matchday ${leagueConfig.currentMatchday}`;

  // Find active match for this player for current matchday
  const activeMatch = await prisma.match.findFirst({
    where: {
      OR: [{ homePlayerId: player.id }, { awayPlayerId: player.id }],
      round: currentRoundName,
      status: { in: ["SCHEDULED", "LIVE"] },
    },
    include: {
      homePlayer: true,
      awayPlayer: true,
      submissions: {
        where: { submittedByPlayerId: player.id },
      },
      forfeitClaims: {
        where: { claimantPlayerId: player.id },
      },
    },
    orderBy: { matchDate: "desc" },
  });

  // Fetch announcements for this player (Broadcasts + Direct messages to this player)
  const announcements = await prisma.announcement.findMany({
    where: {
      OR: [{ type: "BROADCAST" }, { targetPlayerId: player.id }],
    },
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    take: 15,
  });

  // Fetch recent finished matches of this player
  const recentMatches = await prisma.match.findMany({
    where: {
      OR: [{ homePlayerId: player.id }, { awayPlayerId: player.id }],
      status: { in: ["FINISHED", "FORFEIT"] },
    },
    include: {
      homePlayer: true,
      awayPlayer: true,
    },
    orderBy: { matchDate: "desc" },
    take: 5,
  });

  // Fetch division standing
  const currentStanding = await prisma.standing.findFirst({
    where: {
      division: player.division,
      playerId: player.id,
    },
  });

  // Compute Match of the Day for each division
  let divisionalMotd: Record<string, any> = {
    "Division 1": null,
    "Division 2": null,
    "Division 3": null,
  };

  if (leagueConfig.currentMatchday > 1) {
    const roundMatches = await prisma.match.findMany({
      where: { round: currentRoundName },
      include: { homePlayer: true, awayPlayer: true },
    });
    const allStandings = await prisma.standing.findMany({
      orderBy: [{ points: "desc" }, { goalDifference: "desc" }],
    });
    divisionalMotd = evaluateAllDivisionsMatchOfTheDay(roundMatches, allStandings, leagueConfig.currentMatchday);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <DashboardClient
        player={player}
        user={user}
        activeMatch={activeMatch}
        announcements={announcements}
        recentMatches={recentMatches}
        standing={currentStanding}
        leagueConfig={leagueConfig}
        divisionalMotd={divisionalMotd}
      />
    </div>
  );
}
