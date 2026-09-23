import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { cookies } from "next/headers";
import { findTeam } from "@/lib/teams";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      fullName,
      gamerTag,
      efootballId,
      email,
      password,
      whatsapp,
      preferredDivision = "Division 1",
      realTeam,
    } = body;

    if (!fullName || !gamerTag || !email || !password || !whatsapp) {
      return NextResponse.json(
        { error: "Full Name, Gamer Tag, WhatsApp, Email, and Password are required." },
        { status: 400 }
      );
    }

    const cleanGamerTag = gamerTag.trim();
    const cleanEmail = email.trim().toLowerCase();

    // Check uniqueness
    const existingUser = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists. Please log in." },
        { status: 400 }
      );
    }

    const existingGamerTag = await prisma.player.findUnique({ where: { gamerTag: cleanGamerTag } });
    if (existingGamerTag) {
      return NextResponse.json(
        { error: "Gamer Tag is already taken. Please choose another one." },
        { status: 400 }
      );
    }

    // Auto-generate or sanitize eFootball ID if not provided
    const sanitizedKonami = efootballId?.trim()
      ? efootballId.trim()
      : `EF-${cleanGamerTag.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10)}-${Date.now().toString().slice(-4)}`;

    const existingKonami = await prisma.player.findUnique({ where: { efootballId: sanitizedKonami } });
    if (existingKonami) {
      return NextResponse.json(
        { error: "Konami eFootball Mobile ID is already registered." },
        { status: 400 }
      );
    }

    // Check real football team uniqueness
    const selectedClub = realTeam ? findTeam(realTeam) : undefined;
    if (selectedClub || realTeam) {
      const teamNameToMatch = selectedClub ? selectedClub.name : realTeam.trim();
      const existingTeamClaim = await prisma.player.findFirst({
        where: {
          OR: [
            { realTeam: { equals: teamNameToMatch, mode: "insensitive" as const } },
            ...(selectedClub
              ? [
                  { realTeam: { equals: selectedClub.shortName, mode: "insensitive" as const } },
                  { realTeam: { equals: selectedClub.id, mode: "insensitive" as const } },
                ]
              : []),
          ],
          status: { not: "REJECTED" },
        },
        select: { gamerTag: true },
      });
      if (existingTeamClaim) {
        return NextResponse.json(
          {
            error: `The football club "${teamNameToMatch}" has already been chosen by another athlete (@${existingTeamClaim.gamerTag}). Please choose another club.`,
          },
          { status: 400 }
        );
      }
    }

    // Check League Configuration (is division entry closed?)
    const config = await prisma.leagueConfig.findUnique({ where: { id: "default" } });
    const isDivisionEntryClosed = config ? !config.registrationOpen : false;

    // Create User and Player in PENDING_APPROVAL status
    // If division registration is closed, player goes directly to the Reserve Pool
    const assignedDivision = isDivisionEntryClosed ? "RESERVE" : preferredDivision;

    const passwordHash = hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email: cleanEmail,
        passwordHash,
        role: "PLAYER",
      },
    });

    const player = await prisma.player.create({
      data: {
        userId: user.id,
        gamerTag: cleanGamerTag,
        fullName: fullName.trim(),
        efootballId: sanitizedKonami,
        whatsapp: whatsapp.trim(),
        division: assignedDivision,
        realTeam: selectedClub ? selectedClub.name : (realTeam || null),
        avatar: selectedClub ? selectedClub.logo : null,
        status: isDivisionEntryClosed ? "RESERVED" : "PENDING_APPROVAL",
        platform: "eFootball Mobile",
        overallRating: 85,
      },
    });

    // NOTE: Standings record is NOT created yet for unadmitted players.
    // If placed on reserve, the player can immediately explore standings and vote on MOTD.

    // Robust session cookie creation (dual-write to headers and cookieStore)
    const host = req.headers.get("host") || "";
    const isLocalhost = host.includes("localhost") || host.includes("127.0.0.1");
    const isSecure = process.env.NODE_ENV === "production" && !isLocalhost;

    const response = NextResponse.json(
      {
        success: true,
        pendingApproval: true,
        user: { id: user.id, email: user.email, role: user.role },
        player,
      },
      { status: 201 }
    );

    response.cookies.set("efrl_session", user.id, {
      httpOnly: true,
      secure: isSecure,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    const cookieStore = await cookies();
    cookieStore.set("efrl_session", user.id, {
      httpOnly: true,
      secure: isSecure,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (err: any) {
    console.error("Registration error:", err);
    return NextResponse.json(
      { error: "Failed to create player account. Please check your data." },
      { status: 500 }
    );
  }
}

