import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const sessionUserId = cookieStore.get("efrl_session")?.value;

    if (!sessionUserId) {
      return NextResponse.json({ success: true, guest: true });
    }

    const body = await req.json().catch(() => ({}));
    const { division, updateKey } = body;

    if (!division || !updateKey) {
      return NextResponse.json({ error: "Division and updateKey required" }, { status: 400 });
    }

    await prisma.userStandingsView.upsert({
      where: {
        userId_division: {
          userId: sessionUserId,
          division,
        },
      },
      update: {
        updateKey,
        viewedAt: new Date(),
      },
      create: {
        userId: sessionUserId,
        division,
        updateKey,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Record standings view error:", error);
    return NextResponse.json({ error: "Failed to record standings view" }, { status: 500 });
  }
}
