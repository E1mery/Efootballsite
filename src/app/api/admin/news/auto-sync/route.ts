import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { syncSystemNewsToCarousel } from "@/lib/systemNewsService";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const sessionUserId = cookieStore.get("efrl_session")?.value;
    if (!sessionUserId) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: sessionUserId },
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden. Admin access required." }, { status: 403 });
    }

    const synced = await syncSystemNewsToCarousel();
    const allNews = await prisma.news.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      syncedCount: synced.length,
      news: allNews,
    });
  } catch (error: any) {
    console.error("[POST /api/admin/news/auto-sync] Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to auto-sync system news." },
      { status: 500 }
    );
  }
}
