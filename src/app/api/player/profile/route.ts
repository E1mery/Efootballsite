import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { findTeam } from "@/lib/teams";

export async function PUT(req: Request) {
  try {
    const cookieStore = await cookies();
    const sessionUserId = cookieStore.get("efrl_session")?.value;

    if (!sessionUserId) {
      return NextResponse.json({ error: "Unauthorized: Please log in." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: sessionUserId },
      include: { player: true },
    });

    if (!user || !user.player) {
      return NextResponse.json({ error: "Player profile not found." }, { status: 404 });
    }

    const body = await req.json();
    const { email, gamerTag, fullName, whatsapp, password, realTeam } = body;

    if (!gamerTag || !gamerTag.trim()) {
      return NextResponse.json({ error: "Gamer Tag cannot be empty." }, { status: 400 });
    }

    if (!fullName || !fullName.trim()) {
      return NextResponse.json({ error: "Full Name cannot be empty." }, { status: 400 });
    }

    if (!whatsapp || !whatsapp.trim()) {
      return NextResponse.json({ error: "Phone number / WhatsApp cannot be empty." }, { status: 400 });
    }

    if (!email || !email.trim()) {
      return NextResponse.json({ error: "Username / Email cannot be empty." }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanGamerTag = gamerTag.trim();
    const cleanFullName = fullName.trim();
    const cleanWhatsapp = whatsapp.trim();

    // Check email uniqueness if modified
    if (cleanEmail !== user.email.toLowerCase()) {
      const existingEmail = await prisma.user.findFirst({
        where: {
          email: cleanEmail,
          id: { not: user.id },
        },
      });
      if (existingEmail) {
        return NextResponse.json(
          { error: "This email address / username is already in use by another account." },
          { status: 400 }
        );
      }
    }

    // Check gamerTag uniqueness if modified
    if (cleanGamerTag.toLowerCase() !== user.player.gamerTag.toLowerCase()) {
      const existingTag = await prisma.player.findFirst({
        where: {
          gamerTag: { equals: cleanGamerTag, mode: "insensitive" },
          id: { not: user.player.id },
        },
      });
      if (existingTag) {
        return NextResponse.json(
          { error: "This Gamer Tag is already taken. Please choose another one." },
          { status: 400 }
        );
      }
    }

    // Prepare password update if provided
    const userUpdateData: any = { email: cleanEmail };
    if (password && password.trim().length > 0) {
      if (password.trim().length < 6) {
        return NextResponse.json(
          { error: "New password must be at least 6 characters long." },
          { status: 400 }
        );
      }
      userUpdateData.passwordHash = hashPassword(password.trim());
    }

    // Update user record
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: userUpdateData,
    });

    // Prepare player update data
    const playerUpdateData: any = {
      gamerTag: cleanGamerTag,
      fullName: cleanFullName,
      whatsapp: cleanWhatsapp,
    };

    if (realTeam !== undefined) {
      const team = findTeam(realTeam);
      if (team) {
        playerUpdateData.realTeam = team.name;
        playerUpdateData.avatar = team.logo;
      } else if (realTeam === "" || realTeam === null) {
        playerUpdateData.realTeam = null;
      }
    }

    // Update player record
    const updatedPlayer = await prisma.player.update({
      where: { id: user.player.id },
      data: playerUpdateData,
    });

    return NextResponse.json({
      success: true,
      message: "Personal information updated successfully!",
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
      },
      player: updatedPlayer,
    });
  } catch (err: any) {
    console.error("Profile update error:", err);
    return NextResponse.json({ error: err.message || "Failed to update profile." }, { status: 500 });
  }
}
