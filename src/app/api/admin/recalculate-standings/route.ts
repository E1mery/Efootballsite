import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { recalculateStandings } from "@/lib/recalculateStandings";

async function verifyAdmin() {
  const cookieStore = await cookies();
  const sessionUserId = cookieStore.get("efrl_session")?.value;
  if (!sessionUserId) return null;

  const user = await prisma.user.findUnique({
    where: { id: sessionUserId },
  });

  if (!user || user.role !== "ADMIN") return null;
  return user;
}

export async function POST(req: Request) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized: Administrator access required." }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { division = "ALL" } = body;

    const divisions =
      division === "ALL"
        ? ["Division 1", "Division 2", "Division 3"]
        : [division];

    const results: any = {};

    for (const divName of divisions) {
      const tournament = await prisma.tournament.findFirst({
        where: {
          name: { contains: divName },
          type: "DIVISION",
        },
      });

      if (!tournament) {
        results[divName] = "Tournament not found in database";
        continue;
      }

      await recalculateStandings(tournament.id, divName);
      results[divName] = "Standings table recalculated successfully";
    }

    return NextResponse.json({
      success: true,
      message: `Successfully recalculated standings table for ${division === "ALL" ? "all divisions" : division}.`,
      results,
    });
  } catch (err: any) {
    console.error("Standings recalculation error:", err);
    return NextResponse.json({ error: err.message || "Failed to recalculate standings." }, { status: 500 });
  }
}
