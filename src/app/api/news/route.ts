import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureNewsTable } from "@/lib/ensureNewsTable";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureNewsTable();
    const now = new Date();

    const [leagueConfig, news] = await Promise.all([
      prisma.leagueConfig.upsert({
        where: { id: "default" },
        update: {},
        create: { id: "default", registrationOpen: true, currentMatchday: 1 },
      }),
      prisma.news.findMany({
        where: {
          status: "PUBLISHED",
          showOnCarousel: true,
          publishDate: { lte: now },
          expirationDate: { gt: now },
        },
        orderBy: { publishDate: "desc" },
      }),
    ]);

    const filteredNews = news.filter((item) => {
      const titleLower = item.title.toLowerCase();
      const descLower = item.description.toLowerCase();
      const isUcl = titleLower.includes("champions league") || titleLower.includes("ucl") || descLower.includes("champions league");
      const isEuropa = titleLower.includes("europa league") || titleLower.includes("europa") || descLower.includes("europa league");
      const isReg = titleLower.includes("registration") || titleLower.includes("enrollment") || descLower.includes("enrollment");

      if (!leagueConfig.uclStarted && isUcl) return false;
      if (!leagueConfig.europaStarted && isEuropa) return false;
      if (!leagueConfig.registrationOpen && isReg) return false;

      return true;
    });

    return NextResponse.json({ success: true, news: filteredNews });
  } catch (error: any) {
    console.error("[GET /api/news] Error:", error);
    return NextResponse.json({ success: false, news: [] }, { status: 500 });
  }
}
