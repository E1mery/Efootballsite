import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { ensurePasswordResetTable } from "@/lib/passwordReset";

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

export async function GET() {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await ensurePasswordResetTable();

    const requests = await prisma.passwordResetRequest.findMany({
      orderBy: { createdAt: "desc" },
    });

    // Enrich requests with player info
    const emails = Array.from(new Set(requests.map((r) => r.email)));
    const users = await prisma.user.findMany({
      where: { email: { in: emails } },
      include: { player: true },
    });

    const userMap = new Map<string, any>();
    for (const u of users) {
      userMap.set(u.email, u);
    }

    const enriched = requests.map((r) => {
      const u = userMap.get(r.email);
      return {
        ...r,
        user: u ? { id: u.id, email: u.email, role: u.role } : null,
        player: u?.player || null,
      };
    });

    return NextResponse.json({ requests: enriched });
  } catch (err: any) {
    console.error("Fetch password resets error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch password reset requests." },
      { status: 500 }
    );
  }
}
