import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncMatchOfTheDay } from "@/lib/matchOfTheDay";

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
        divisionalMotd: { "Division 1": null, "Division 2": null, "Division 3": null },
        message: "Match of the Day selection begins from Round 2 based on official league table standings.",
        currentMatchday,
      });
    }

    const roundName = `Matchday ${currentMatchday}`;
    const { searchParams } = new URL(req.url);
    const requestedDivision = searchParams.get("division");

    // Fetch existing MOTD matches for this round
    let motdMatches = await prisma.match.findMany({
      where: {
        round: roundName,
        isMatchOfTheDay: true,
      },
      include: {
        homePlayer: true,
        awayPlayer: true,
      },
    });

    // If none are flagged, run sync
    if (motdMatches.length === 0) {
      await syncMatchOfTheDay(currentMatchday);
      motdMatches = await prisma.match.findMany({
        where: {
          round: roundName,
          isMatchOfTheDay: true,
        },
        include: {
          homePlayer: true,
          awayPlayer: true,
        },
      });
    }

    const div1 = motdMatches.find((m) => m.division === "Division 1") || null;
    const div2 = motdMatches.find((m) => m.division === "Division 2") || null;
    const div3 = motdMatches.find((m) => m.division === "Division 3") || null;

    if (requestedDivision) {
      const match = motdMatches.find((m) => m.division === requestedDivision);
      return NextResponse.json({ matchOfTheDay: match || null, currentMatchday });
    }

    return NextResponse.json({
      matchOfTheDay: div1 || div2 || div3,
      divisionalMotd: {
        "Division 1": div1,
        "Division 2": div2,
        "Division 3": div3,
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

    const motds = await syncMatchOfTheDay(currentMatchday);
    return NextResponse.json({
      success: true,
      message: "Match of the Day evaluated for each division and synchronized with current table standings.",
      divisionalMotd: motds,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
