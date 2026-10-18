import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { checkAndAutoAdvanceDailyCycle } from "@/lib/autoDailyCycle";
import MatchdayOverviewManager from "@/components/admin/MatchdayOverviewManager";

export const dynamic = "force-dynamic";

export default async function AdminMatchdayOverviewPage() {
  const cookieStore = await cookies();
  const sessionUserId = cookieStore.get("efrl_session")?.value;

  if (!sessionUserId) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: sessionUserId },
  });

  if (!user || user.role !== "ADMIN") {
    redirect("/login");
  }

  // Ensure league cycle has automatically rolled over if the active matchday deadline has passed
  try {
    await checkAndAutoAdvanceDailyCycle({ force: false });
  } catch (cycleErr) {
    console.error("Matchday overview auto-advance check error:", cycleErr);
  }

  // Fetch league configuration, standings, matches, and continental slots in parallel
  const [leagueConfig, standings, matches, uclGroupSlots] = await Promise.all([
    prisma.leagueConfig.upsert({
      where: { id: "default" },
      update: {},
      create: {
        id: "default",
        registrationOpen: true,
        currentMatchday: 1,
        uclStarted: false,
        europaStarted: false,
      },
    }),
    prisma.standing.findMany({
      where: {
        division: { in: ["Division 1", "Division 2", "Division 3"] },
        player: { status: { in: ["ACTIVE", "WARNING"] } },
      },
      include: {
        player: {
          select: {
            id: true,
            gamerTag: true,
            fullName: true,
            realTeam: true,
            avatar: true,
            whatsapp: true,
            division: true,
            status: true,
          },
        },
      },
      orderBy: [{ points: "desc" }, { goalDifference: "desc" }, { goalsFor: "desc" }],
    }),
    prisma.match.findMany({
      include: {
        homePlayer: {
          select: {
            id: true,
            gamerTag: true,
            fullName: true,
            realTeam: true,
            avatar: true,
            division: true,
            whatsapp: true,
          },
        },
        awayPlayer: {
          select: {
            id: true,
            gamerTag: true,
            fullName: true,
            realTeam: true,
            avatar: true,
            division: true,
            whatsapp: true,
          },
        },
      },
      orderBy: [{ matchDate: "asc" }],
    }),
    prisma.uclGroupSlot.findMany({
      where: { competition: { in: ["UCL", "EUROPA"] } },
      include: { player: true },
      orderBy: [{ groupName: "asc" }, { slotIndex: "asc" }],
    }),
  ]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-6 sm:py-10">
        <MatchdayOverviewManager
          leagueConfig={leagueConfig}
          allStandings={standings}
          allMatches={matches}
          uclGroupSlots={uclGroupSlots}
        />
      </main>
    </div>
  );
}
