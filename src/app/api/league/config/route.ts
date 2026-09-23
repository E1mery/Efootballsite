import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const config = await prisma.leagueConfig.findUnique({
      where: { id: "default" },
    });

    return NextResponse.json({
      success: true,
      config: config || {
        season: "Season 1 (2026)",
        registrationOpen: true,
        currentMatchday: 1,
        uclStarted: false,
        europaStarted: false,
        uclDrawCompleted: false,
        europaDrawCompleted: false,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch league configuration" },
      { status: 500 }
    );
  }
}
