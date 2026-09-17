import { NextResponse } from "next/server";
import { checkAndSendOneHourMatchReminders } from "@/lib/autoMatchReminders";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await checkAndSendOneHourMatchReminders();
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...result,
    });
  } catch (error: any) {
    console.error("Cron reminders GET error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST() {
  try {
    const result = await checkAndSendOneHourMatchReminders();
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...result,
    });
  } catch (error: any) {
    console.error("Cron reminders POST error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
