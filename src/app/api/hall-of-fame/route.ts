import { NextResponse } from "next/server";
import { getHallOfFameStats } from "@/lib/hallOfFameStatsService";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const forceFresh = searchParams.get("fresh") === "true";
    const data = await getHallOfFameStats(forceFresh);

    return NextResponse.json({
      success: true,
      ...data,
    });
  } catch (error: any) {
    console.error("Hall of Fame public API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to retrieve Hall of Fame statistics" },
      { status: 500 }
    );
  }
}
