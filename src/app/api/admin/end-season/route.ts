import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { executeSeasonTransition } from "@/lib/seasonPromotion";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const sessionUserId = cookieStore.get("efrl_session")?.value;
    if (!sessionUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: sessionUserId },
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const action = body.action || "ALL"; // "ALL" | "RELEGATE_ONLY" | "PROMOTE_ONLY"

    const result = await executeSeasonTransition(action);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
