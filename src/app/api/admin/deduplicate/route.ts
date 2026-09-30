import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyAndCleanDuplicates } from "@/lib/deduplicate";

async function verifyAdmin() {
  const cookieStore = await cookies();
  const sessionUserId = cookieStore.get("efrl_session")?.value;
  if (!sessionUserId) return null;

  const user = await prisma.user.findUnique({
    where: { id: sessionUserId },
  });

  if (!user || user.role !== "ADMIN") return null;
  return user;
}

// GET: Run duplicate inspection (dry-run)
export async function GET() {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 403 });
    }

    const report = await verifyAndCleanDuplicates(true);
    return NextResponse.json({ success: true, dryRun: true, report });
  } catch (error: any) {
    console.error("Deduplicate inspect error:", error);
    return NextResponse.json({ error: error.message || "Failed to inspect duplicates" }, { status: 500 });
  }
}

// POST: Run duplicate inspection and delete duplicates
export async function POST() {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 403 });
    }

    const report = await verifyAndCleanDuplicates(false);
    return NextResponse.json({ success: true, dryRun: false, report });
  } catch (error: any) {
    console.error("Deduplicate execution error:", error);
    return NextResponse.json({ error: error.message || "Failed to clean duplicates" }, { status: 500 });
  }
}
