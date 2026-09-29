import { NextResponse } from "next/server";
import { checkAndAutoAdvanceDailyCycle } from "@/lib/autoDailyCycle";

export async function POST(req: Request) {
  try {
    const result = await checkAndAutoAdvanceDailyCycle({ force: true });
    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (err: any) {
    console.error("Daily cycle admin error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
