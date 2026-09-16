import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { cookies } from "next/headers";

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
    } = body;

    if (!fullName || !gamerTag || !efootballId || !email || !password || !whatsapp) {
      return NextResponse.json(
        { error: "All fields including WhatsApp number and Password are required." },
        { status: 400 }
      );
    }

    // Check if registration is officially open
    const config = await prisma.leagueConfig.findUnique({ where: { id: "default" } });
    if (config && !config.registrationOpen) {
      return NextResponse.json(
        { error: "League registration has been closed by the League Administrator. Matches have commenced." },
        { status: 403 }
      );
    }

    // Check uniqueness
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists. Please log in." },
        { status: 400 }
      );
    }

    const existingGamerTag = await prisma.player.findUnique({ where: { gamerTag } });
    if (existingGamerTag) {
      return NextResponse.json(
        { error: "Gamer Tag is already taken. Please choose another one." },
        { status: 400 }
      );
    }

    const existingKonami = await prisma.player.findUnique({ where: { efootballId } });
    if (existingKonami) {
      return NextResponse.json(
        { error: "Konami eFootball Mobile ID is already registered." },
        { status: 400 }
      );
    }

    // Check 20 players cap in division
    const divisionCount = await prisma.player.count({
      where: { division: preferredDivision, isDisqualified: false },
    });

    if (divisionCount >= 20) {
      return NextResponse.json(
        {
          error: `${preferredDivision} has reached its maximum cap of 20 players. Please register for another division or join the standby pool.`,
        },
        { status: 400 }
      );
    }

    // Create User and Player
    const passwordHash = hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: "PLAYER",
      },
    });

    const player = await prisma.player.create({
      data: {
        userId: user.id,
        gamerTag,
        fullName,
        efootballId,
        whatsapp,
        division: preferredDivision,
        platform: "eFootball Mobile",
        overallRating: 85,
      },
    });

    // Find active tournament for this division
    const tournament = await prisma.tournament.findFirst({
      where: {
        name: { contains: preferredDivision },
        type: "DIVISION",
      },
    });

    if (tournament) {
      const currentStandingsCount = await prisma.standing.count({
        where: { tournamentId: tournament.id, division: preferredDivision },
      });

      await prisma.standing.create({
        data: {
          tournamentId: tournament.id,
          division: preferredDivision,
          playerId: player.id,
          rank: currentStandingsCount + 1,
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          goalDifference: 0,
          points: 0,
          form: "D",
        },
      });
    }

    // Set auth cookie
    const cookieStore = await cookies();
    cookieStore.set("efrl_session", user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return NextResponse.json(
      {
        success: true,
        user: { id: user.id, email: user.email, role: user.role },
        player,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("Registration error:", err);
    return NextResponse.json(
      { error: "Failed to create player account. Please check your data." },
      { status: 500 }
    );
  }
}
