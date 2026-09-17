import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionUserId = cookieStore.get("efrl_session")?.value;

    if (!sessionUserId) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    const user = await prisma.user.findUnique({
      where: { id: sessionUserId },
      include: {
        player: {
          include: {
            standings: true,
          },
        },
      },
    });

    if (!user) {
      const resp = NextResponse.json({ authenticated: false, user: null });
      resp.cookies.delete("efrl_role");
      return resp;
    }

    const response = NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      player: user.player,
    });

    response.cookies.set("efrl_role", user.role, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (err) {
    const resp = NextResponse.json({ authenticated: false, user: null });
    resp.cookies.delete("efrl_role");
    return resp;
  }
}
