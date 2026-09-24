import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

async function verifyAdmin() {
  const cookieStore = await cookies();
  const sessionUserId = cookieStore.get("efrl_session")?.value;
  if (!sessionUserId) return null;

  const user = await prisma.user.findUnique({ where: { id: sessionUserId } });
  if (!user || user.role !== "ADMIN") return null;
  return user;
}

export async function POST(req: Request) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json(
        { error: "Unauthorized: Administrator access required." },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { division } = body;

    const whereClause: any = {};
    if (division && division !== "ALL") {
      whereClause.division = division;
    }

    // Reset realTeam and avatar for targeted players
    const result = await prisma.player.updateMany({
      where: whereClause,
      data: {
        realTeam: null,
        avatar: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully reset real team choice and avatar for ${result.count} player(s). Athletes can now select their clubs afresh.`,
      count: result.count,
    });
  } catch (error: any) {
    console.error("Reset teams error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to reset real football teams" },
      { status: 500 }
    );
  }
}
