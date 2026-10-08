import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { calculateHallOfFameStats, invalidateHallOfFameCache } from "@/lib/hallOfFameStatsService";

export async function POST(req: Request) {
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

    const body = await req.json().catch(() => ({}));
    const confirmed = body.confirmed;
    if (!confirmed) {
      return NextResponse.json(
        { error: "Confirmation is required before rebuilding historical statistics." },
        { status: 400 }
      );
    }

    // Invalidate existing cache
    await invalidateHallOfFameCache();

    // Recompute all statistics
    const stats = await calculateHallOfFameStats();

    return NextResponse.json({
      success: true,
      message: "Historical statistics engine rebuilt successfully. All records and player histories refreshed.",
      stats,
    });
  } catch (error: any) {
    console.error("Rebuild Hall of Fame error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to rebuild historical statistics" },
      { status: 500 }
    );
  }
}
