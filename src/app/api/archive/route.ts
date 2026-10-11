import { NextResponse } from "next/server";
import { getArchivedSeasonsList, getArchivedSeasonDetails } from "@/lib/seasonArchiveService";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const season = searchParams.get("season");

    if (season) {
      const details = await getArchivedSeasonDetails(season);
      if (!details) {
        return NextResponse.json(
          { error: "Archived season not found or not finalized." },
          { status: 404 }
        );
      }
      return NextResponse.json(details);
    }

    const seasons = await getArchivedSeasonsList();
    return NextResponse.json({ seasons });
  } catch (err: any) {
    console.error("Archive API error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to load archive data." },
      { status: 500 }
    );
  }
}
