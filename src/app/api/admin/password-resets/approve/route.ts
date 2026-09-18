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
    const { requestId } = body;

    if (!requestId) {
      return NextResponse.json({ error: "Request ID is required." }, { status: 400 });
    }

    const resetRequest = await prisma.passwordResetRequest.findUnique({
      where: { id: requestId },
    });

    if (!resetRequest) {
      return NextResponse.json({ error: "Password reset request not found." }, { status: 404 });
    }

    // Update status to APPROVED
    const updated = await prisma.passwordResetRequest.update({
      where: { id: requestId },
      data: {
        status: "APPROVED",
        approvedAt: new Date(),
      },
    });

    // Find user to notify them if possible
    const targetUser = await prisma.user.findUnique({
      where: { email: resetRequest.email },
      include: { player: true },
    });

    if (targetUser?.player) {
      await prisma.announcement.create({
        data: {
          title: `✅ Password Reset Permission Granted!`,
          content: `Hello ${targetUser.player.gamerTag}! The League Commissioner has approved your password reset request. You can now visit the sign-in page to enter your new password and regain access to your account.`,
          type: "INDIVIDUAL",
          targetPlayerId: targetUser.player.id,
          isPinned: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Password reset permission approved for ${resetRequest.email}. The user can now set their new password.`,
      request: updated,
    });
  } catch (err: any) {
    console.error("Approve reset error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to approve password reset request." },
      { status: 500 }
    );
  }
}
