import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { calculateHallOfFameStats } from "@/lib/hallOfFameStatsService";

export async function POST() {
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

    const stats = await calculateHallOfFameStats();

    return NextResponse.json({
      success: true,
      message: "Hall of Fame statistics recalculated successfully from official league data.",
      stats,
    });
  } catch (error: any) {
    console.error("Recalculate Hall of Fame error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to recalculate statistics" },
      { status: 500 }
    );
  }
}
