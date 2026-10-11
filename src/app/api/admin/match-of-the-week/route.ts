import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { ensureNewsTable } from "@/lib/ensureNewsTable";
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

export async function GET(req: Request) {
  try {
    const auth = await verifyAdmin();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    await ensureNewsTable();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const division = searchParams.get("division") || "ALL";
    const round = searchParams.get("round") || "ALL";
    const status = searchParams.get("status") || "ALL";

    // 1. Find currently active Match of the Week published to carousel
    const currentMotwNews = await prisma.news.findFirst({
      where: {
        OR: [
          { id: "sys-motw-active" },
          { id: { startsWith: "sys-motw-" } },
        ],
        showOnCarousel: true,
        status: "PUBLISHED",
      },
      orderBy: { publishDate: "desc" },
    });

    let currentMotwMatch = null;
    if (currentMotwNews) {
      const matchId = currentMotwNews.buttonUrl?.includes("highlight=")
        ? currentMotwNews.buttonUrl.split("highlight=")[1]?.split("&")[0]
        : currentMotwNews.id.replace("sys-motw-", "");

      if (matchId) {
        currentMotwMatch = await prisma.match.findUnique({
          where: { id: matchId },
          include: {
            homePlayer: true,
            awayPlayer: true,
          },
        });
      }
    }

    // 2. Query match fixtures from calendar based on filters
    const whereClause: any = {};
    if (division !== "ALL") {
      whereClause.division = division;
    }
    if (round !== "ALL") {
      whereClause.round = round;
    }
    if (status !== "ALL") {
      whereClause.status = status;
    }
    if (search.trim()) {
      whereClause.OR = [
        { homePlayer: { gamerTag: { contains: search.trim(), mode: "insensitive" } } },
        { awayPlayer: { gamerTag: { contains: search.trim(), mode: "insensitive" } } },
        { homePlayer: { realTeam: { contains: search.trim(), mode: "insensitive" } } },
        { awayPlayer: { realTeam: { contains: search.trim(), mode: "insensitive" } } },
      ];
    }

    const fixtures = await prisma.match.findMany({
      where: whereClause,
      include: {
        homePlayer: true,
        awayPlayer: true,
      },
      orderBy: [
        { matchDate: "asc" },
        { createdAt: "asc" },
      ],
      take: 60,
    });

    return NextResponse.json({
      success: true,
      currentMotw: currentMotwMatch,
      currentNews: currentMotwNews,
      fixtures,
    });
  } catch (error: any) {
    console.error("[GET /api/admin/match-of-the-week] Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to load Match of the Week fixtures." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const auth = await verifyAdmin();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    await ensureNewsTable();
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

    // Deactivate / hide any existing MOTW news items on the carousel
    await prisma.news.updateMany({
      where: {
        OR: [
          { id: "sys-motw-active" },
          { id: { startsWith: "sys-motw-" } },
        ],
      },
      data: {
        showOnCarousel: false,
      },
    });

    const newsId = `sys-motw-${match.id}`;
    const kickoffFormatted = formatRwandanDateTime(match.matchDate);
    const homeName = match.homePlayer?.gamerTag || "Home Athlete";
    const awayName = match.awayPlayer?.gamerTag || "Away Athlete";
    const homeTeam = match.homePlayer?.realTeam || "Club";
    const awayTeam = match.awayPlayer?.realTeam || "Club";

    const title = `Match of the Week: ${homeName} vs ${awayName}`;
    const description = `Official Match of the Week showdown in ${match.division} (${match.round}). ${homeName} (${homeTeam}) goes head-to-head against ${awayName} (${awayTeam}). Kickoff: ${kickoffFormatted} (CAT).`;
    const featuredImage = "/images/motw-stadium-bg.jpg";

    const newsItem = await prisma.news.upsert({
      where: { id: newsId },
      create: {
        id: newsId,
        title,
        category: "Match",
        description,
        featuredImage,
        buttonText: buttonText?.trim() || "Predict Winner",
        buttonUrl: `/fixtures?highlight=${match.id}`,
        status: "PUBLISHED",
        publishDate: new Date(),
        expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        showOnCarousel: true,
      },
      update: {
        title,
        category: "Match",
        description,
        featuredImage,
        buttonText: buttonText?.trim() || "Predict Winner",
        buttonUrl: `/fixtures?highlight=${match.id}`,
        status: "PUBLISHED",
        publishDate: new Date(),
        expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        showOnCarousel: true,
      },
    });

    // Remove from DismissedSystemNews in case it was previously deleted
    await prisma.$executeRawUnsafe(
      `DELETE FROM "DismissedSystemNews" WHERE id = $1`,
      newsId
    ).catch(() => {});

    return NextResponse.json({
      success: true,
      message: `Match of the Week published to carousel: ${homeName} vs ${awayName}`,
      match,
      news: newsItem,
    });
  } catch (error: any) {
    console.error("[POST /api/admin/match-of-the-week] Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to publish Match of the Week." },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const auth = await verifyAdmin();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    await ensureNewsTable();

    // Turn off showOnCarousel for all MOTW news items
    await prisma.news.updateMany({
      where: {
        OR: [
          { id: "sys-motw-active" },
          { id: { startsWith: "sys-motw-" } },
        ],
      },
      data: {
        showOnCarousel: false,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Match of the Week removed from homepage carousel.",
    });
  } catch (error: any) {
    console.error("[DELETE /api/admin/match-of-the-week] Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to remove Match of the Week." },
      { status: 500 }
    );
  }
}
