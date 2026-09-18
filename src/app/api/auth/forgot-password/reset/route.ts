import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { ensurePasswordResetTable } from "@/lib/passwordReset";

export async function POST(req: Request) {
  try {
    await ensurePasswordResetTable();

    const body = await req.json();
    const { email, newPassword, confirmPassword } = body;

    if (!email || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: "Email, new password, and password confirmation are required." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: "New passwords do not match. Please verify and retype." },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      include: { player: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User account not found." },
        { status: 404 }
      );
    }

    // Verify that the user has an APPROVED password reset request
    const approvedRequest = await prisma.passwordResetRequest.findFirst({
      where: {
        email: cleanEmail,
        status: "APPROVED",
      },
      orderBy: { createdAt: "desc" },
    });

    if (!approvedRequest) {
      return NextResponse.json(
        {
          error:
            "Permission not granted yet. Your password reset request must be approved by the Commissioner first.",
        },
        { status: 403 }
      );
    }

    // Hash the new password and update user record
    const newPasswordHash = hashPassword(newPassword.trim());

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash },
    });

    // Mark the reset request as COMPLETED
    await prisma.passwordResetRequest.update({
      where: { id: approvedRequest.id },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });

    // Automatically authenticate the user and issue session cookies
    const host = req.headers.get("host") || "";
    const isLocalhost = host.includes("localhost") || host.includes("127.0.0.1");
    const isSecure = process.env.NODE_ENV === "production" && !isLocalhost;

    const response = NextResponse.json({
      success: true,
      message: "Password successfully updated! Logging you in...",
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      player: user.player,
      redirectUrl: user.role === "ADMIN" ? "/admin" : "/dashboard",
    });

    // Dual-write cookies
    response.cookies.set("efrl_session", user.id, {
      httpOnly: true,
      secure: isSecure,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    response.cookies.set("efrl_role", user.role, {
      httpOnly: true,
      secure: isSecure,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    const cookieStore = await cookies();
    cookieStore.set("efrl_session", user.id, {
      httpOnly: true,
      secure: isSecure,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    cookieStore.set("efrl_role", user.role, {
      httpOnly: true,
      secure: isSecure,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (err: any) {
    console.error("Password reset error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to reset password. Please try again." },
      { status: 500 }
    );
  }
}
