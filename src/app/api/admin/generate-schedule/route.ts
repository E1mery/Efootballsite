import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

async function verifyAdmin() {
  const cookieStore = await cookies();
  const sessionUserId = cookieStore.get("efrl_session")?.value;
  if (!sessionUserId) return null;

  const user = await prisma.user.findUnique({
    where: { id: sessionUserId },
  });

  if (!user || user.role !== "ADMIN") return null;
  return user;
}

// Berger Tables / Round Robin Pairing Algorithm
// For Divisions: One-way round trip (1 match only per pairing). UCL & Europa retain two-leg home & away.
function generateRoundRobin(players: { id: string; gamerTag: string }[], isSingleLeg: boolean = true) {
  const n = players.length;
  const isOdd = n % 2 !== 0;
  const playerList = [...players];
  
  // If odd, add a BYE dummy player
  if (isOdd) {
    playerList.push({ id: "BYE", gamerTag: "BYE" });
  }

  const numPlayers = playerList.length;
  const roundsCount = numPlayers - 1;
  const matchesPerRound = numPlayers / 2;

  const firstLegRounds: { roundNumber: number; pairings: [string, string][]; byePlayerId?: string }[] = [];

  const teamIndices = playerList.map((_, i) => i);

  for (let round = 0; round < roundsCount; round++) {
    const pairings: [string, string][] = [];
    let byePlayerId: string | undefined;

    for (let match = 0; match < matchesPerRound; match++) {
      const homeIdx = teamIndices[match];
      const awayIdx = teamIndices[numPlayers - 1 - match];

      const homePlayer = playerList[homeIdx];
      const awayPlayer = playerList[awayIdx];

      // Exclude BYE matches and identify the remaining player on rest day
      if (homePlayer.id === "BYE") {
        byePlayerId = awayPlayer.id;
      } else if (awayPlayer.id === "BYE") {
        byePlayerId = homePlayer.id;
      } else {
        // Alternate home/away based on round to balance home advantage
        if (round % 2 === 1 && match === 0) {
          pairings.push([awayPlayer.id, homePlayer.id]);
        } else {
          pairings.push([homePlayer.id, awayPlayer.id]);
        }
      }
    }

    firstLegRounds.push({ roundNumber: round + 1, pairings, byePlayerId });

    // Rotate indices clockwise keeping index 0 fixed
    const last = teamIndices.pop()!;
    teamIndices.splice(1, 0, last);
  }

  // If single leg (One-way round trip, 1 match only per pairing for Divisions)
  if (isSingleLeg) {
    return firstLegRounds;
  }

  // Second Leg (Round Trip / Reverse Fixtures for UCL & Europa)
  const secondLegRounds = firstLegRounds.map((r) => ({
    roundNumber: r.roundNumber + roundsCount,
    pairings: r.pairings.map(([home, away]) => [away, home] as [string, string]),
    byePlayerId: r.byePlayerId,
  }));

  return [...firstLegRounds, ...secondLegRounds];
}

export async function POST(req: Request) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized: Admin access required." }, { status: 403 });
    }

    const body = await req.json();
    const { division = "ALL", startDate } = body; // "Division 1", "Division 2", "Division 3", or "ALL"

    // Check if registration is officially closed
    const config = await prisma.leagueConfig.findUnique({ where: { id: "default" } });
    if (config?.registrationOpen) {
      return NextResponse.json(
        {
          error:
            "Registration is still open! Please End/Close Registration first before generating official tournament schedules.",
        },
        { status: 400 }
      );
    }

    // Anchor League Starting Date strictly to 12:00 AM (00:00:00 midnight)
    let baseKickoffDate: Date;
    if (startDate) {
      const parts = String(startDate).split("T")[0].split("-").map(Number);
      if (parts.length === 3) {
        baseKickoffDate = new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0);
      } else {
        baseKickoffDate = new Date(startDate);
        baseKickoffDate.setHours(0, 0, 0, 0);
      }
    } else {
      baseKickoffDate = new Date();
      baseKickoffDate.setHours(0, 0, 0, 0);
    }

    const divisionsToProcess =
      division === "ALL"
        ? ["Division 1", "Division 2", "Division 3"]
        : [division];

    let totalMatchesGenerated = 0;
    const summary: any = {};

    for (const divName of divisionsToProcess) {
      // Find tournament
      const tournament = await prisma.tournament.findFirst({
        where: {
          name: { contains: divName },
          type: "DIVISION",
        },
      });

      if (!tournament) {
        summary[divName] = "Tournament not found in DB";
        continue;
      }

      // Update tournament start date to baseKickoffDate
      await prisma.tournament.update({
        where: { id: tournament.id },
        data: { startDate: baseKickoffDate },
      });

      // Fetch active registered players in this division (strictly league participants, never RESERVED or PENDING_APPROVAL)
      const players = await prisma.player.findMany({
        where: {
          division: divName,
          isDisqualified: false,
          status: { in: ["ACTIVE", "WARNING"], not: "RESERVED" },
        },
        select: { id: true, gamerTag: true },
        orderBy: { createdAt: "asc" },
      });

      if (players.length < 2) {
        const msg = `Need at least 2 players to generate round-robin schedule (currently ${players.length}).`;
        if (division !== "ALL") {
          return NextResponse.json({ error: msg }, { status: 400 });
        }
        summary[divName] = msg;
        continue;
      }

      // Ensure standings records exist for all players
      for (const p of players) {
        await prisma.standing.upsert({
          where: {
            tournamentId_playerId: {
              tournamentId: tournament.id,
              playerId: p.id,
            },
          },
          update: {},
          create: {
            tournamentId: tournament.id,
            division: divName,
            playerId: p.id,
            rank: 1,
            played: 0,
            won: 0,
            drawn: 0,
            lost: 0,
            goalsFor: 0,
            goalsAgainst: 0,
            goalDifference: 0,
            points: 0,
            form: "D",
          },
        });
      }

      // Delete old scheduled unplayed matches to prevent duplicates if re-generating
      await prisma.match.deleteMany({
        where: {
          tournamentId: tournament.id,
          status: "SCHEDULED",
        },
      });

      // Generate single-leg round-robin schedule (1 match only per pairing, 1 leg only, no second leg)
      const allRounds = generateRoundRobin(players, true);
      let divMatchesCount = 0;

      for (const roundData of allRounds) {
        const roundName = `Matchday ${roundData.roundNumber}`;
        const isMatchday1 = roundData.roundNumber === 1;

        // Schedule dates: strictly 12:00 AM (00:00:00) with 24 hours duration expiring at 12:00 AM next day
        const matchDate = new Date(baseKickoffDate.getTime() + (roundData.roundNumber - 1) * 24 * 60 * 60 * 1000);
        const deadlineDate = new Date(matchDate.getTime() + 24 * 60 * 60 * 1000);

        for (const [homeId, awayId] of roundData.pairings) {
          await prisma.match.create({
            data: {
              tournamentId: tournament.id,
              division: divName,
              homePlayerId: homeId,
              awayPlayerId: awayId,
              round: roundName,
              platform: "eFootball Mobile",
              status: "SCHEDULED",
              matchDate,
              deadlineDate,
            },
          });
          divMatchesCount++;
        }

        // If division has an odd number of players, the remaining one gets a message telling him that the current day has no match to play
        if (roundData.byePlayerId) {
          const byePlayer = players.find((p) => p.id === roundData.byePlayerId);
          if (byePlayer) {
            await prisma.announcement.create({
              data: {
                title: `🗓️ ${roundName}: No Match Scheduled (Official Rest Day)`,
                content: `Hello ${byePlayer.gamerTag}! You do not have a match to play for ${roundName}. Because ${divName} has an odd number of active players (${players.length} competitors), this round is your scheduled bye/rest day while other fixtures are played. Enjoy your rest day!`,
                type: "INDIVIDUAL",
                targetPlayerId: byePlayer.id,
                isPinned: isMatchday1,
              },
            });
          }
        }
      }

      totalMatchesGenerated += divMatchesCount;
      summary[divName] = `Generated ${divMatchesCount} matches across ${allRounds.length} matchdays for ${players.length} players.`;
    }

    // Set current matchday in config to 1
    await prisma.leagueConfig.upsert({
      where: { id: "default" },
      update: { currentMatchday: 1 },
      create: { id: "default", currentMatchday: 1, registrationOpen: false },
    });

    // Create league broadcast announcement ONLY if matches were generated
    if (totalMatchesGenerated > 0) {
      const formattedStartDate = baseKickoffDate.toLocaleDateString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      });
      await prisma.announcement.create({
        data: {
          title: `📅 Official Season Schedule Confirmed (First Fixtures Drop on ${formattedStartDate} at 12:00 AM)`,
          content: `The official round-robin schedule has been confirmed by the Commissioner. The first fixtures will drop on ${formattedStartDate} at 12:00 AM (Midnight). Each matchday drops strictly at 12:00 AM and lasts for 24 hours. Check your season match calendar now!`,
          type: "BROADCAST",
          isPinned: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully set and confirmed schedule for ${totalMatchesGenerated} division matches starting on ${baseKickoffDate.toLocaleDateString()} at 12:00 AM. The first round fixtures will drop on ${baseKickoffDate.toLocaleDateString()} at 12:00 AM midnight.`,
      summary,
    });
  } catch (err: any) {
    console.error("Schedule generation error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
