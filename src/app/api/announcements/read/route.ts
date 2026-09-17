import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const sessionUserId = cookieStore.get("efrl_session")?.value;
    if (!sessionUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { announcementId } = body;

    // Acknowledge read receipt
    return NextResponse.json({
      success: true,
      announcementId,
      readAt: new Date().toISOString(),
      message: "Announcement marked as read immediately upon viewing.",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
