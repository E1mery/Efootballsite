import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { ensureNewsTable } from "@/lib/ensureNewsTable";
import { ensureDerbyTable, detectDerby, getActiveDerbies } from "@/lib/derbyService";
import { formatRwandanDateTime } from "@/lib/rwandanTime";

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

    await ensureNewsTable();
    await ensureDerbyTable();

    const body = await req.json();
    const { matchId, buttonText } = body;

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
      ? { id: (match as any).derbyId, name: (match as any).derbyName, imageUrl: "/images/motw-stadium-bg.jpg" }
      : detectDerby(match.homePlayer, match.awayPlayer, activeDerbies);

    if (!derby) {
      return NextResponse.json(
        { error: "This fixture does not correspond to an active official derby configuration." },
        { status: 400 }
      );
    }

    const newsId = `sys-derby-${match.id}`;
    const kickoffFormatted = formatRwandanDateTime(match.matchDate);
    const homeName = match.homePlayer?.gamerTag || "Home Contender";
    const awayName = match.awayPlayer?.gamerTag || "Away Contender";
    const homeTeam = match.homePlayer?.realTeam || "Club";
    const awayTeam = match.awayPlayer?.realTeam || "Club";

    const title = `THE ${derby.name.toUpperCase()}`;
    const description = `Official Derby Showdown in ${match.division} (${match.round}): ${derby.name}! ${homeName} (${homeTeam}) faces off against ${awayName} (${awayTeam}). Scheduled Kickoff: ${kickoffFormatted} (CAT).`;
    const featuredImage = derby.imageUrl || "/images/motw-stadium-bg.jpg";

    const newsItem = await prisma.news.upsert({
      where: { id: newsId },
      create: {
        id: newsId,
        title,
        category: "Derby",
        description,
        featuredImage,
        buttonText: buttonText?.trim() || "VIEW DERBY",
        buttonUrl: `/fixtures?highlight=${match.id}`,
        status: "PUBLISHED",
        publishDate: new Date(),
        expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        showOnCarousel: true,
      },
      update: {
        title,
        category: "Derby",
        description,
        featuredImage,
        buttonText: buttonText?.trim() || "VIEW DERBY",
        buttonUrl: `/fixtures?highlight=${match.id}`,
        status: "PUBLISHED",
        publishDate: new Date(),
        expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        showOnCarousel: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Official Derby slide "${title}" published to homepage carousel.`,
      news: newsItem,
    });
  } catch (error: any) {
    console.error("[POST /api/admin/derbies/publish-carousel] Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to publish derby carousel slide." },
      { status: 500 }
    );
  }
}
