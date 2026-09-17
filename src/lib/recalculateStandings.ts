import { prisma } from "@/lib/prisma";

/**
 * Recalculates standings and rankings for a given tournament and division based on all finished matches.
 * Updates points, wins, draws, losses, goals for, goals against, goal difference, form, and position rank.
 */
export async function recalculateStandings(tournamentId: string, division: string) {
  const finishedMatches = await prisma.match.findMany({
    where: {
      tournamentId,
      division,
      status: { in: ["FINISHED", "FORFEIT"] },
      homeScore: { not: null },
      awayScore: { not: null },
    },
    orderBy: { matchDate: "asc" },
  });

  const standings = await prisma.standing.findMany({
    where: { tournamentId, division },
  });

  const playerStats: Record<
    string,
    {
      played: number;
      won: number;
      drawn: number;
      lost: number;
      goalsFor: number;
      goalsAgainst: number;
      points: number;
      form: string[];
    }
  > = {};

  for (const s of standings) {
    playerStats[s.playerId] = {
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      points: 0,
      form: [],
    };
  }

  for (const m of finishedMatches) {
    const hId = m.homePlayerId;
    const aId = m.awayPlayerId;
    const hS = m.homeScore ?? 0;
    const aS = m.awayScore ?? 0;

    if (!playerStats[hId]) {
      playerStats[hId] = { played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, form: [] };
    }
    if (!playerStats[aId]) {
      playerStats[aId] = { played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, form: [] };
    }

    playerStats[hId].played += 1;
    playerStats[aId].played += 1;
    playerStats[hId].goalsFor += hS;
    playerStats[hId].goalsAgainst += aS;
    playerStats[aId].goalsFor += aS;
    playerStats[aId].goalsAgainst += hS;

    if (hS > aS) {
      playerStats[hId].won += 1;
      playerStats[hId].points += 3;
      playerStats[hId].form.push("W");
      playerStats[aId].lost += 1;
      playerStats[aId].form.push("L");
    } else if (hS < aS) {
      playerStats[aId].won += 1;
      playerStats[aId].points += 3;
      playerStats[aId].form.push("W");
      playerStats[hId].lost += 1;
      playerStats[hId].form.push("L");
    } else {
      playerStats[hId].drawn += 1;
      playerStats[hId].points += 1;
      playerStats[hId].form.push("D");
      playerStats[aId].drawn += 1;
      playerStats[aId].points += 1;
      playerStats[aId].form.push("D");
    }
  }

  const sortedPlayerIds = Object.keys(playerStats).sort((a, b) => {
    const sA = playerStats[a];
    const sB = playerStats[b];
    const gdA = sA.goalsFor - sA.goalsAgainst;
    const gdB = sB.goalsFor - sB.goalsAgainst;
    if (sB.points !== sA.points) return sB.points - sA.points;
    if (gdB !== gdA) return gdB - gdA;
    return sB.goalsFor - sA.goalsFor;
  });

  for (let i = 0; i < sortedPlayerIds.length; i++) {
    const pId = sortedPlayerIds[i];
    const st = playerStats[pId];
    const last5 = st.form.slice(-5).join(",") || "D";

    await prisma.standing.upsert({
      where: {
        tournamentId_playerId: {
          tournamentId,
          playerId: pId,
        },
      },
      update: {
        rank: i + 1,
        played: st.played,
        won: st.won,
        drawn: st.drawn,
        lost: st.lost,
        goalsFor: st.goalsFor,
        goalsAgainst: st.goalsAgainst,
        goalDifference: st.goalsFor - st.goalsAgainst,
        points: st.points,
        form: last5,
      },
      create: {
        tournamentId,
        division,
        playerId: pId,
        rank: i + 1,
        played: st.played,
        won: st.won,
        drawn: st.drawn,
        lost: st.lost,
        goalsFor: st.goalsFor,
        goalsAgainst: st.goalsAgainst,
        goalDifference: st.goalsFor - st.goalsAgainst,
        points: st.points,
        form: last5,
      },
    });

    // Also synchronize player goals and matchesPlayed in Player model
    await prisma.player.update({
      where: { id: pId },
      data: {
        goals: st.goalsFor,
        matchesPlayed: st.played,
      },
    });
  }
}
