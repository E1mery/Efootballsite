import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { identifier, password } = body; // identifier can be email or gamerTag

    if (!identifier || !password) {
      return NextResponse.json(
        { error: "Email/GamerTag and Password are required." },
        { status: 400 }
      );
    }

    // Try finding user by email first
    let user = await prisma.user.findUnique({
      where: { email: identifier.trim().toLowerCase() },
      include: { player: true },
    });

    // If not found by email, try finding by gamerTag
    if (!user) {
      const player = await prisma.player.findUnique({
        where: { gamerTag: identifier.trim() },
        include: { user: true },
      });

      if (player && player.user) {
        user = {
          ...player.user,
          player,
        };
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: "No account found with this email or gamer tag." },
        { status: 401 }
      );
    }

    // Verify password
    const isValid = verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: "Incorrect password. Please try again." },
        { status: 401 }
      );
    }

    // Set cookie session
    const cookieStore = await cookies();
    cookieStore.set("efrl_session", user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      player: user.player,
    });
  } catch (err: any) {
    console.error("Login error:", err);
    return NextResponse.json(
      { error: "Authentication failed. Please try again." },
      { status: 500 }
    );
  }
}
