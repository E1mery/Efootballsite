import { NextResponse } from "next/server";
import { getClubDerbyHeadToHead } from "@/lib/derbyService";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const derbyId = searchParams.get("derbyId");

    if (!derbyId) {
      return NextResponse.json({ error: "derbyId is required." }, { status: 400 });
    }

    const h2h = await getClubDerbyHeadToHead(derbyId);

    return NextResponse.json({
      success: true,
      h2h,
    });
  } catch (error: any) {
    console.error("[GET /api/derbies/h2h] Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to load club derby head-to-head records." },
      { status: 500 }
    );
  }
}
