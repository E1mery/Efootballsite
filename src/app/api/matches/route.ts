import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { matchId, homeScore, awayScore, status, notes } = body;

    if (!matchId) {
      return NextResponse.json({ error: "Missing matchId" }, { status: 400 });
    }

    // 1. Update Match
    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: {
        homeScore: homeScore !== undefined ? Number(homeScore) : null,
        awayScore: awayScore !== undefined ? Number(awayScore) : null,
        status: status || "FINISHED",
        notes: notes !== undefined ? notes : undefined,
      },
    });

    // 2. If finished or forfeit, recalculate standings for this tournament/division
    if (
      (status === "FINISHED" || status === "FORFEIT") &&
      homeScore !== null &&
      awayScore !== null
    ) {
      const tournamentId = updatedMatch.tournamentId;
      const division = updatedMatch.division;

      // Get all finished/forfeit matches in tournament and division
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

      // Get all standings in this tournament/division
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

      // Calculate stats based on all finished matches
      for (const m of finishedMatches) {
        const hId = m.homePlayerId;
        const aId = m.awayPlayerId;
        const hS = m.homeScore!;
        const aS = m.awayScore!;

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

      // Sort players by points, goal diff, goals for
      const sortedPlayers = Object.keys(playerStats).sort((a, b) => {
        const statsA = playerStats[a];
        const statsB = playerStats[b];
        const gdA = statsA.goalsFor - statsA.goalsAgainst;
        const gdB = statsB.goalsFor - statsB.goalsAgainst;

        if (statsB.points !== statsA.points) return statsB.points - statsA.points;
        if (gdB !== gdA) return gdB - gdA;
        return statsB.goalsFor - statsA.goalsFor;
      });

      // Update in database with ranks
      for (let i = 0; i < sortedPlayers.length; i++) {
        const playerId = sortedPlayers[i];
        const stats = playerStats[playerId];
        const last5Form = stats.form.slice(-5).join(",") || "D";

        await prisma.standing.upsert({
          where: {
            tournamentId_playerId: {
              tournamentId,
              playerId,
            },
          },
          update: {
            rank: i + 1,
            played: stats.played,
            won: stats.won,
            drawn: stats.drawn,
            lost: stats.lost,
            goalsFor: stats.goalsFor,
            goalsAgainst: stats.goalsAgainst,
            goalDifference: stats.goalsFor - stats.goalsAgainst,
            points: stats.points,
            form: last5Form,
          },
          create: {
            tournamentId,
            division,
            playerId,
            rank: i + 1,
            played: stats.played,
            won: stats.won,
            drawn: stats.drawn,
            lost: stats.lost,
            goalsFor: stats.goalsFor,
            goalsAgainst: stats.goalsAgainst,
            goalDifference: stats.goalsFor - stats.goalsAgainst,
            points: stats.points,
            form: last5Form,
          },
        });
      }
    }

    return NextResponse.json({ success: true, match: updatedMatch });
  } catch (err: any) {
    console.error("Match update error:", err);
    return NextResponse.json({ error: "Failed to update match" }, { status: 500 });
  }
}
