import { NextResponse } from "next/server";
import { checkAndSendOneHourMatchReminders } from "@/lib/autoMatchReminders";

export const dynamic = "force-dynamic";

function isAuthorized(req: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return true; // If not configured yet, allow execution
  const authHeader = req.headers.get("authorization");
  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

export async function POST(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
