import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { ensureNewsTable } from "@/lib/ensureNewsTable";

const VALID_DIVISIONS = ["Division 1", "Division 2", "Division 3", "UCL", "EUROPA"] as const;

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

export async function GET() {
  try {
    const auth = await verifyAdmin();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    await ensureNewsTable();

    const activeNews = await prisma.news.findMany({
      where: {
        OR: [
          { id: { startsWith: "sys-league-table-" } },
          { category: "League Table" },
        ],
      },
    });

    const newsByDiv = new Map<string, any>();
    for (const item of activeNews) {
      const match = item.id.replace("sys-league-table-", "").toLowerCase();
      newsByDiv.set(match, item);
    }

    const tables = VALID_DIVISIONS.map((div) => {
      const slug = div.toLowerCase().replace(/\s+/g, "-");
      const newsItem = newsByDiv.get(slug);
      const isPublished = Boolean(
        newsItem && newsItem.status === "PUBLISHED" && newsItem.showOnCarousel
      );
      return {
        division: div,
        slug,
        isPublished,
        newsItem: newsItem || null,
      };
    });

    return NextResponse.json({ success: true, tables });
  } catch (error: any) {
    console.error("[GET /api/admin/league-table/publish] Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to load league table publication status." },
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
    const { division, showOnCarousel = true } = body;

    if (!division || typeof division !== "string") {
      return NextResponse.json({ error: "Division name is required." }, { status: 400 });
    }

    const matchedDiv = VALID_DIVISIONS.find(
      (d) => d.toLowerCase() === division.trim().toLowerCase()
    );

    if (!matchedDiv) {
      return NextResponse.json(
        { error: `Invalid division. Allowed divisions: ${VALID_DIVISIONS.join(", ")}` },
        { status: 400 }
      );
    }

    const slug = matchedDiv.toLowerCase().replace(/\s+/g, "-");
    const newsId = `sys-league-table-${slug}`;

    if (showOnCarousel) {
      const isEuropa = matchedDiv === "EUROPA";
      const isUcl = matchedDiv === "UCL";
      const featuredImage = isEuropa
        ? "/images/europa-stadium-bg.jpg"
        : isUcl
        ? "/images/ucl-stadium-bg.jpg"
        : "/images/carousel-stadium-bg.jpg";

      const newsItem = await prisma.news.upsert({
        where: { id: newsId },
        create: {
          id: newsId,
          title: `${matchedDiv} Official Standings & Table`,
          category: "League Table",
          description: `Live official table standings for ${matchedDiv}. Real-time rankings, match form, goal difference, and championship race.`,
          featuredImage,
          buttonText: "View Full Standings",
          buttonUrl: `/standings?division=${encodeURIComponent(matchedDiv)}`,
          status: "PUBLISHED",
          publishDate: new Date(),
          expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          showOnCarousel: true,
        },
        update: {
          title: `${matchedDiv} Official Standings & Table`,
          category: "League Table",
          description: `Live official table standings for ${matchedDiv}. Real-time rankings, match form, goal difference, and championship race.`,
          featuredImage,
          buttonText: "View Full Standings",
          buttonUrl: `/standings?division=${encodeURIComponent(matchedDiv)}`,
          status: "PUBLISHED",
          publishDate: new Date(),
          expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
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
        message: `${matchedDiv} table successfully published to the homepage carousel.`,
        news: newsItem,
        division: matchedDiv,
        showOnCarousel: true,
      });
    } else {
      await prisma.news.updateMany({
        where: { id: newsId },
        data: { showOnCarousel: false },
      });

      return NextResponse.json({
        success: true,
        message: `${matchedDiv} table removed from the homepage carousel.`,
        division: matchedDiv,
        showOnCarousel: false,
      });
    }
  } catch (error: any) {
    console.error("[POST /api/admin/league-table/publish] Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update league table carousel status." },
      { status: 500 }
    );
  }
}
