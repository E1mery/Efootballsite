import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { calculateHallOfFameStats, invalidateHallOfFameCache } from "@/lib/hallOfFameStatsService";

export async function GET() {
  try {
    const settings = await prisma.hallOfFameSettings.findUnique({
      where: { id: "default" },
    });
    return NextResponse.json({ success: true, settings });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const cookieStore = await cookies();
    const sessionUserId = cookieStore.get("efrl_session")?.value;
    if (!sessionUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: sessionUserId } });
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Administrator access required" }, { status: 403 });
    }

    const body = await req.json();
    const { minMatchesForRecords, minMatchesForInduction, minSeasonsForInduction } = body;

    const data: any = {};
    if (typeof minMatchesForRecords === "number" && minMatchesForRecords >= 1) {
      data.minMatchesForRecords = minMatchesForRecords;
    }
    if (typeof minMatchesForInduction === "number" && minMatchesForInduction >= 1) {
      data.minMatchesForInduction = minMatchesForInduction;
    }
    if (typeof minSeasonsForInduction === "number" && minSeasonsForInduction >= 1) {
      data.minSeasonsForInduction = minSeasonsForInduction;
    }

    const settings = await prisma.hallOfFameSettings.upsert({
      where: { id: "default" },
      update: data,
      create: {
        id: "default",
        minMatchesForRecords: data.minMatchesForRecords ?? 10,
        minMatchesForInduction: data.minMatchesForInduction ?? 10,
        minSeasonsForInduction: data.minSeasonsForInduction ?? 1,
      },
    });

    await invalidateHallOfFameCache();
    const updatedStats = await calculateHallOfFameStats();

    return NextResponse.json({
      success: true,
      message: "Hall of Fame eligibility criteria updated successfully.",
      settings,
      stats: updatedStats,
    });
  } catch (err: any) {
    console.error("Hall of Fame settings update error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
