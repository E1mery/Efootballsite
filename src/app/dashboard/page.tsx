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

  if (!user) {
    redirect("/login");
  }

  // If user is Admin, direct to the Commissioner Admin Office
  if (user.role === "ADMIN") {
    redirect("/admin");
  }

  if (!user.player) {
    redirect("/register");
  }

  const player = user.player;

  // League configuration for current matchday
  const leagueConfig = await prisma.leagueConfig.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default", currentMatchday: 1 },
  });

  const currentRoundName = `Matchday ${leagueConfig.currentMatchday}`;

  // Find active match for this player for current matchday (only applicable if active)
  let activeMatch = null;
  if (player.status === "ACTIVE") {
    activeMatch = await prisma.match.findFirst({
      where: {
        OR: [{ homePlayerId: player.id }, { awayPlayerId: player.id }],
        round: currentRoundName,
        status: { in: ["SCHEDULED", "LIVE"] },
      },
      include: {
        homePlayer: true,
        awayPlayer: true,
        submissions: {
          include: { submittedByPlayer: true },
          orderBy: { createdAt: "desc" },
        },
        forfeitClaims: {
          include: { claimantPlayer: true, accusedPlayer: true },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { matchDate: "desc" },
    });
  }

  // Fetch all matches of this player across the entire season for Calendar Mode
  const allPlayerMatches = await prisma.match.findMany({
    where: {
      OR: [{ homePlayerId: player.id }, { awayPlayerId: player.id }],
    },
    include: {
      homePlayer: true,
      awayPlayer: true,
      submissions: {
        include: { submittedByPlayer: true },
        orderBy: { createdAt: "desc" },
      },
      forfeitClaims: {
        include: { claimantPlayer: true, accusedPlayer: true },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: [{ round: "asc" }, { matchDate: "asc" }],
  });

  // Fetch announcements for this player
  let announcements = await prisma.announcement.findMany({
    where: {
      OR: [{ type: "BROADCAST" }, { targetPlayerId: player.id }],
    },
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    take: 30,
  });

  // Remove announcements that were marked as read > 24 hours ago to create space
  const expiredCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const expiredReads = await prisma.announcementRead.findMany({
    where: {
      playerId: player.id,
      readAt: { lt: expiredCutoff },
    },
    select: { announcementId: true },
  });
  const expiredReadIds = new Set(expiredReads.map((r) => r.announcementId));
  announcements = announcements.filter((ann) => !expiredReadIds.has(ann.id));

  // Filter out fixture-specific announcements for reserved or pending players
  if (player.status === "RESERVED" || player.status === "PENDING_APPROVAL") {
    announcements = announcements.filter(
      (ann) =>
        !ann.title.includes("Matchday") &&
        !ann.title.includes("Fixtures") &&
        !ann.title.includes("Deadline") &&
        !ann.title.includes("Countdown")
    );
  }

  // Fetch player's existing feedback review if any
  const myReview = await prisma.feedbackReview.findFirst({
    where: { playerId: player.id },
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
    take: 10,
  });

  // Fetch division standing for player
  const currentStanding = await prisma.standing.findFirst({
    where: {
      division: player.division,
      playerId: player.id,
    },
  });

  // Fetch all 3 division standings so reserve and active athletes can view all tables
  const [div1Standings, div2Standings, div3Standings, uclTournament, europaTournament, uclSlots, europaSlots] = await Promise.all([
    prisma.standing.findMany({
      where: { division: "Division 1" },
      include: { player: true },
      orderBy: [{ points: "desc" }, { goalDifference: "desc" }, { goalsFor: "desc" }],
    }),
    prisma.standing.findMany({
      where: { division: "Division 2" },
      include: { player: true },
      orderBy: [{ points: "desc" }, { goalDifference: "desc" }, { goalsFor: "desc" }],
    }),
    prisma.standing.findMany({
      where: { division: "Division 3" },
      include: { player: true },
      orderBy: [{ points: "desc" }, { goalDifference: "desc" }, { goalsFor: "desc" }],
    }),
    prisma.tournament.findFirst({ where: { type: "UCL" } }),
    prisma.tournament.findFirst({ where: { type: "EUROPA" } }),
    prisma.uclGroupSlot.findMany({
      where: { competition: "UCL" },
      include: { player: true },
      orderBy: [{ groupName: "asc" }, { slotIndex: "asc" }],
    }),
    prisma.uclGroupSlot.findMany({
      where: { competition: "EUROPA" },
      include: { player: true },
      orderBy: [{ groupName: "asc" }, { slotIndex: "asc" }],
    }),
  ]);

  let uclGroupStandings: any[] = [];
  if (uclTournament) {
    uclGroupStandings = await prisma.standing.findMany({
      where: { tournamentId: uclTournament.id },
      include: { player: true },
      orderBy: [{ points: "desc" }, { goalDifference: "desc" }, { goalsFor: "desc" }],
    });
  }

  let europaGroupStandings: any[] = [];
  if (europaTournament) {
    europaGroupStandings = await prisma.standing.findMany({
      where: { tournamentId: europaTournament.id },
      include: { player: true },
      orderBy: [{ points: "desc" }, { goalDifference: "desc" }, { goalsFor: "desc" }],
    });
  }

  // Compute Match of the Day for each division (all athletes including reserve can view & vote)
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
        allPlayerMatches={allPlayerMatches}
        announcements={announcements}
        recentMatches={recentMatches}
        standing={currentStanding}
        leagueConfig={leagueConfig}
        divisionalMotd={divisionalMotd}
        div1Standings={div1Standings}
        div2Standings={div2Standings}
        div3Standings={div3Standings}
        uclGroupStandings={uclGroupStandings}
        europaGroupStandings={europaGroupStandings}
        uclSlots={uclSlots}
        europaSlots={europaSlots}
        initialReview={myReview}
      />
    </div>
  );
}
