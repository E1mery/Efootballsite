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

export async function POST(req: Request) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized: Admin access required." }, { status: 403 });
    }

    await ensurePasswordResetTable();

    const body = await req.json();
    const { requestId, action = "DELETE" } = body; // action can be "DELETE" or "REJECT"

    if (!requestId) {
      return NextResponse.json({ error: "Request ID is required." }, { status: 400 });
    }

    if (action === "REJECT") {
      await prisma.passwordResetRequest.update({
        where: { id: requestId },
        data: { status: "REJECTED" },
      });
      return NextResponse.json({ success: true, message: "Request marked as rejected." });
    } else {
      await prisma.passwordResetRequest.delete({
        where: { id: requestId },
      });
      return NextResponse.json({ success: true, message: "Request deleted successfully." });
    }
  } catch (err: any) {
    console.error("Delete reset request error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to process request." },
      { status: 500 }
    );
  }
}
