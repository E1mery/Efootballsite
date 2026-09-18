import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensurePasswordResetTable } from "@/lib/passwordReset";

export async function POST(req: Request) {
  try {
    await ensurePasswordResetTable();

    const body = await req.json();
    const { email } = body;

    if (!email || !email.trim()) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      include: { player: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "No account found with this email address." },
        { status: 404 }
      );
    }

    // Look for latest request for this email
    const request = await prisma.passwordResetRequest.findFirst({
      where: { email: cleanEmail },
      orderBy: { createdAt: "desc" },
    });

    if (!request) {
      return NextResponse.json({
        status: "NOT_FOUND",
        message: "No password reset request found for this email. Please request permission first.",
        gamerTag: user.player?.gamerTag || "Athlete",
      });
    }

    return NextResponse.json({
      status: request.status,
      requestedAt: request.requestedAt,
      approvedAt: request.approvedAt,
      gamerTag: user.player?.gamerTag || "Athlete",
      message:
        request.status === "APPROVED"
          ? "Permission granted! The Commissioner has approved your request. You can now set your new password."
          : request.status === "PENDING"
          ? "Your request is currently awaiting Commissioner approval. Please check back shortly."
          : request.status === "COMPLETED"
          ? "Your password was already reset. If you forgot it again, please submit a new request."
          : "Your request was declined. Please contact the administrator.",
    });
  } catch (err: any) {
    console.error("Check reset status error:", err);
    return NextResponse.json(
      { error: "Failed to check reset status." },
      { status: 500 }
    );
  }
}
