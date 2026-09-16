import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { evaluateMatchOfTheDay, syncMatchOfTheDay } from "@/lib/matchOfTheDay";

export async function GET(req: Request) {
  try {
    const config = await prisma.leagueConfig.findUnique({
      where: { id: "default" },
    });

    const currentMatchday = config?.currentMatchday || 1;

    // Rule: Except on the first round
    if (currentMatchday <= 1) {
      return NextResponse.json({
        matchOfTheDay: null,
        message: "Match of the Day selection begins from Round 2 based on official league table standings.",
        currentMatchday,
      });
    }

    const roundName = `Matchday ${currentMatchday}`;

    // 1. Check if a match is already flagged as isMatchOfTheDay in DB
    let motd = await prisma.match.findFirst({
      where: {
        round: roundName,
        isMatchOfTheDay: true,
      },
      include: {
        homePlayer: true,
        awayPlayer: true,
      },
    });

    // 2. If not flagged yet, evaluate and sync it
    if (!motd) {
      motd = await syncMatchOfTheDay(currentMatchday);
    }

    if (!motd) {
      return NextResponse.json({
        matchOfTheDay: null,
        message: "No scheduled matches found for the current matchday.",
        currentMatchday,
      });
    }

    // Also fetch standings for both players to attach table rank info
    const [homeStanding, awayStanding] = await Promise.all([
      prisma.standing.findFirst({ where: { playerId: motd.homePlayerId } }),
      prisma.standing.findFirst({ where: { playerId: motd.awayPlayerId } }),
    ]);

    return NextResponse.json({
      matchOfTheDay: {
        ...motd,
        homeStanding,
        awayStanding,
      },
      currentMatchday,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const config = await prisma.leagueConfig.findUnique({ where: { id: "default" } });
    const currentMatchday = config?.currentMatchday || 1;

    if (currentMatchday <= 1) {
      return NextResponse.json(
        { error: "Match of the Day cannot be selected on Round 1. It begins from Round 2 based on table standings." },
        { status: 400 }
      );
    }

    const motd = await syncMatchOfTheDay(currentMatchday);
    return NextResponse.json({
      success: true,
      message: "Match of the Day successfully evaluated and synchronized with current table standings.",
      matchOfTheDay: motd,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
