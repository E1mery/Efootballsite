import { NextResponse } from "next/server";
import { getAllDerbies, getActiveDerbies, ensureDerbyTable } from "@/lib/derbyService";

export async function GET(req: Request) {
  try {
    await ensureDerbyTable();
    const { searchParams } = new URL(req.url);
    const includeInactive = searchParams.get("includeInactive") === "true";

    const derbies = includeInactive ? await getAllDerbies() : await getActiveDerbies();

    return NextResponse.json({
      success: true,
      derbies,
    });
  } catch (error: any) {
    console.error("[GET /api/derbies] Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to load derbies." },
      { status: 500 }
    );
  }
}
