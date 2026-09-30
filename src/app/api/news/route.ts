import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureNewsTable } from "@/lib/ensureNewsTable";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureNewsTable();
    const now = new Date();

    const news = await prisma.news.findMany({
      where: {
        status: "PUBLISHED",
        showOnCarousel: true,
        publishDate: { lte: now },
        expirationDate: { gt: now },
      },
      orderBy: { publishDate: "desc" },
    });

    return NextResponse.json({ success: true, news });
  } catch (error: any) {
    console.error("[GET /api/news] Error:", error);
    return NextResponse.json({ success: false, news: [] }, { status: 500 });
  }
}
