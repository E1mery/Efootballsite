import { NextResponse } from "next/server";
import { processOverdueUnplayedMatches } from "@/lib/autoDailyCycle";

export async function POST() {
  try {
    const result = await processOverdueUnplayedMatches();
    return NextResponse.json({
      success: true,
      message: `Processed ${result.processedMatchesCount} overdue unsubmitted matches.`,
      ...result,
    });
  } catch (err: any) {
    console.error("Resolve overdue error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
