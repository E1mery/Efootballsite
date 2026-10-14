import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { ensureDerbyTable, detectDerby, getActiveDerbies } from "@/lib/derbyService";
import { syncSocialPostForMatch } from "@/lib/socialFeedService";

async function verifyAdmin() {
  const cookieStore = await cookies();
  const sessionUserId = cookieStore.get("efrl_session")?.value;
  if (!sessionUserId) {
    return { error: "Unauthorized. Please log in.", status: 401 };
  }

  const user = await prisma.user.findUnique({
    where: { id: sessionUserId },
  });

  if (!user || user.role !== "ADMIN") {
    return { error: "Forbidden. Admin access required.", status: 403 };
  }

  return { user };
}

export async function POST(req: Request) {
  try {
    const auth = await verifyAdmin();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    await ensureDerbyTable();
    const body = await req.json();
    const { matchId } = body;

    if (!matchId) {
      return NextResponse.json({ error: "matchId is required." }, { status: 400 });
    }

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        homePlayer: true,
        awayPlayer: true,
      },
    });

    if (!match) {
      return NextResponse.json({ error: "Match fixture not found." }, { status: 404 });
    }

    const activeDerbies = await getActiveDerbies();
    const derby = (match as any).isDerby && (match as any).derbyName
      ? { id: (match as any).derbyId, name: (match as any).derbyName }
      : detectDerby(match.homePlayer, match.awayPlayer, activeDerbies);

    if (!derby) {
      return NextResponse.json(
        { error: "This fixture does not correspond to an active official derby configuration." },
        { status: 400 }
      );
    }

    // Prevents duplicate post via unique([type, matchId]) in socialPost
    const post = await syncSocialPostForMatch({
      type: "DERBY_ANNOUNCEMENT",
      matchId: match.id,
      division: match.division,
      homePlayerId: match.homePlayerId,
      awayPlayerId: match.awayPlayerId,
      derbyId: derby.id,
      derbyName: derby.name,
    });

    return NextResponse.json({
      success: true,
      message: `Official Derby announcement for "${derby.name}" published to Social Feed!`,
      post,
    });
  } catch (error: any) {
    console.error("[POST /api/admin/derbies/publish-social] Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to publish derby social announcement." },
      { status: 500 }
    );
  }
}
