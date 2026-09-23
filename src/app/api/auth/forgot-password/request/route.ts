import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensurePasswordResetTable } from "@/lib/passwordReset";

export async function POST(req: Request) {
  try {
    await ensurePasswordResetTable();

    const body = await req.json();
    const { email } = body;

    if (!email || !email.trim()) {
      return NextResponse.json(
        { error: "Please enter your registered email address." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if entered email address exists in the system database
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      include: { player: true },
    });

    if (!user) {
      return NextResponse.json(
        {
          error: "No registered account found with this email address. Please check your spelling or register a new account.",
        },
        { status: 404 }
      );
    }

    // Check if there is already an active APPROVED request
    const existingApproved = await prisma.passwordResetRequest.findFirst({
      where: { email: cleanEmail, status: "APPROVED" },
      orderBy: { createdAt: "desc" },
    });

    if (existingApproved) {
      return NextResponse.json({
        success: true,
        status: "APPROVED",
        message: "Permission granted! The League Commissioner has already approved your password reset request. You can now set your new password.",
        gamerTag: user.player?.gamerTag || "Athlete",
      });
    }

    // Check if there is already a PENDING request
    const existingPending = await prisma.passwordResetRequest.findFirst({
      where: { email: cleanEmail, status: "PENDING" },
      orderBy: { createdAt: "desc" },
    });

    if (existingPending) {
      return NextResponse.json({
        success: true,
        status: "PENDING",
        message: "Your password reset request has already been sent to the Commissioner and is currently pending review. Please wait for approval.",
        gamerTag: user.player?.gamerTag || "Athlete",
      });
    }

    // Create a new password reset request for the admin
    await prisma.passwordResetRequest.create({
      data: {
        email: cleanEmail,
        status: "PENDING",
      },
    });

    return NextResponse.json({
      success: true,
      status: "PENDING",
      message: "Password reset request sent to the League Administrator. Once the Commissioner grants permission, you will be able to enter and confirm your new password.",
      gamerTag: user.player?.gamerTag || "Athlete",
    });
  } catch (err: any) {
    console.error("Forgot password request error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to process password reset request." },
      { status: 500 }
    );
  }
}
