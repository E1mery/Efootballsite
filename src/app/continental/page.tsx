import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import ContinentalClient from "./ContinentalClient";
import { redirectAdminToPortal } from "@/lib/adminGuard";

export const dynamic = "force-dynamic";

export default async function ContinentalCupsPage() {
  await redirectAdminToPortal();
  const cookieStore = await cookies();
  const sessionUserId = cookieStore.get("efrl_session")?.value;

  let currentPlayer = null;
  let leagueConfig: any = { registrationOpen: true, currentMatchday: 1, uclStarted: false, europaStarted: false };
  let div1Standings: any[] = [];
  let div2Standings: any[] = [];
  let div3Standings: any[] = [];
  let div1Europa: any[] = [];
  let div2Europa: any[] = [];
  let div3Europa: any[] = [];
  let uclSlots: any[] = [];
  let europaSlots: any[] = [];
  let uclMatches: any[] = [];
  let europaMatches: any[] = [];
  let uclGroupStandings: any[] = [];
  let europaGroupStandings: any[] = [];
  let ongoingDivisionMatches: number = 0;

  try {
    if (sessionUserId) {
      const user = await prisma.user.findUnique({
        where: { id: sessionUserId },
        include: { player: true },
      });
      if (user?.player) {
        currentPlayer = user.player;
      }
    }

    // Fetch LeagueConfig
    leagueConfig = await prisma.leagueConfig.upsert({
      where: { id: "default" },
      update: {},
      create: {
        id: "default",
        registrationOpen: true,
        currentMatchday: 1,
        uclStarted: false,
        europaStarted: false,
      },
    });

    const resultsUcl = await Promise.all([
      prisma.standing.findMany({
        where: { division: "Division 1" },
        include: { player: true },
        orderBy: [{ points: "desc" }, { goalDifference: "desc" }],
        take: 8,
      }),
      prisma.standing.findMany({
        where: { division: "Division 2" },
        include: { player: true },
        orderBy: [{ points: "desc" }, { goalDifference: "desc" }],
        take: 4,
      }),
      prisma.standing.findMany({
        where: { division: "Division 3" },
        include: { player: true },
        orderBy: [{ points: "desc" }, { goalDifference: "desc" }],
        take: 4,
      }),
    ]);
    div1Standings = resultsUcl[0];
    div2Standings = resultsUcl[1];
    div3Standings = resultsUcl[2];

    const resultsEuropa = await Promise.all([
      prisma.standing.findMany({
        where: { division: "Division 1" },
        include: { player: true },
        orderBy: [{ points: "desc" }, { goalDifference: "desc" }],
        skip: 8,
        take: 4,
      }),
      prisma.standing.findMany({
        where: { division: "Division 2" },
        include: { player: true },
        orderBy: [{ points: "desc" }, { goalDifference: "desc" }],
        skip: 4,
        take: 6,
      }),
      prisma.standing.findMany({
        where: { division: "Division 3" },
        include: { player: true },
        orderBy: [{ points: "desc" }, { goalDifference: "desc" }],
        skip: 4,
        take: 6,
      }),
    ]);
    div1Europa = resultsEuropa[0];
    div2Europa = resultsEuropa[1];
    div3Europa = resultsEuropa[2];

    const [resultsSlots, uclTournament, europaTournament, divMatchCount] = await Promise.all([
      Promise.all([
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
      ]),
      prisma.tournament.findFirst({ where: { type: "UCL" } }),
      prisma.tournament.findFirst({ where: { type: "EUROPA" } }),
      prisma.match.count({
        where: {
          tournament: { type: "DIVISION" },
          status: { in: ["SCHEDULED", "LIVE"] },
        },
      }),
    ]);
    uclSlots = resultsSlots[0];
    europaSlots = resultsSlots[1];
    ongoingDivisionMatches = divMatchCount;

    if (uclTournament) {
      const [m, s] = await Promise.all([
        prisma.match.findMany({
          where: { tournamentId: uclTournament.id },
          include: { homePlayer: true, awayPlayer: true, submissions: true },
          orderBy: [{ stage: "asc" }, { matchDate: "asc" }],
        }),
        prisma.standing.findMany({
          where: { tournamentId: uclTournament.id },
          include: { player: true },
          orderBy: [{ points: "desc" }, { goalDifference: "desc" }, { goalsFor: "desc" }],
        }),
      ]);
      uclMatches = m;
      uclGroupStandings = s;
    }

    if (europaTournament) {
      const [m, s] = await Promise.all([
        prisma.match.findMany({
          where: { tournamentId: europaTournament.id },
          include: { homePlayer: true, awayPlayer: true, submissions: true },
          orderBy: [{ stage: "asc" }, { matchDate: "asc" }],
        }),
        prisma.standing.findMany({
          where: { tournamentId: europaTournament.id },
          include: { player: true },
          orderBy: [{ points: "desc" }, { goalDifference: "desc" }, { goalsFor: "desc" }],
        }),
      ]);
      europaMatches = m;
      europaGroupStandings = s;
    }
  } catch (error) {
    console.error("Continental page fetch error:", error);
  }

  const isDivisionSeasonFinished = ongoingDivisionMatches === 0;

  const uclQualified = [
    ...div1Standings.map((s, idx) => ({ ...s, seedLabel: `Div 1 #${idx + 1}` })),
    ...div2Standings.map((s, idx) => ({ ...s, seedLabel: `Div 2 #${idx + 1}` })),
    ...div3Standings.map((s, idx) => ({ ...s, seedLabel: `Div 3 #${idx + 1}` })),
  ];

  const europaQualified = [
    ...div1Europa.map((s, idx) => ({ ...s, seedLabel: `Div 1 #${idx + 9}` })),
    ...div2Europa.map((s, idx) => ({ ...s, seedLabel: `Div 2 #${idx + 5}` })),
    ...div3Europa.map((s, idx) => ({ ...s, seedLabel: `Div 3 #${idx + 5}` })),
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="border-b border-slate-800 pb-6">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="yellow">POST-SEASON ESPORTS TOURNAMENTS</Badge>
          <span className="text-xs font-bold text-sky-400 uppercase tracking-widest">
            Continental Video Game Cups
          </span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black uppercase text-white tracking-tight">
          eFootball UCL & Europa Leagues
        </h1>
        <p className="mt-2 text-sm sm:text-base text-slate-300 max-w-3xl">
          The ultimate competitive climax of the Rwandan eFootball season. Played exclusively after the conclusion of Division 1, 2, and 3 league stages.
        </p>
      </div>

      <ContinentalClient
        leagueConfig={leagueConfig}
        uclQualified={uclQualified}
        europaQualified={europaQualified}
        uclSlots={uclSlots}
        europaSlots={europaSlots}
        uclMatches={uclMatches}
        europaMatches={europaMatches}
        uclGroupStandings={uclGroupStandings}
        europaGroupStandings={europaGroupStandings}
        isDivisionSeasonFinished={isDivisionSeasonFinished}
        currentPlayer={currentPlayer}
      />
    </div>
  );
}
