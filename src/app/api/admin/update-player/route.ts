import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { findTeam } from "@/lib/teams";
import { recalculateStandings } from "@/lib/recalculateStandings";
import { normalizePhoneNumber, isSamePhoneNumber } from "@/lib/phone";

async function verifyAdmin() {
  const cookieStore = await cookies();
  const sessionUserId = cookieStore.get("efrl_session")?.value;
  if (!sessionUserId) return null;

  const user = await prisma.user.findUnique({ where: { id: sessionUserId } });
  if (!user || user.role !== "ADMIN") return null;
  return user;
}

export async function POST(req: Request) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json(
        { error: "Unauthorized: Administrator privileges required." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { playerId, realTeam, gamerTag, fullName, whatsapp, division, overallRating, status, avatar } = body;

    if (!playerId) {
      return NextResponse.json({ error: "Player ID is required." }, { status: 400 });
    }

    const player = await prisma.player.findUnique({
      where: { id: playerId },
      include: { user: true },
    });

    if (!player) {
      return NextResponse.json({ error: "Player not found." }, { status: 404 });
    }

    const updateData: any = {};

    if (gamerTag && gamerTag.trim()) {
      updateData.gamerTag = gamerTag.trim();
    }
    if (fullName && fullName.trim()) {
      updateData.fullName = fullName.trim();
    }
    if (whatsapp && whatsapp.trim()) {
      const phoneCheck = normalizePhoneNumber(whatsapp);
      if (!phoneCheck.isValid) {
        return NextResponse.json(
          { error: phoneCheck.error || "Please enter a valid WhatsApp phone number." },
          { status: 400 }
        );
      }

      if (!isSamePhoneNumber(player.whatsapp, phoneCheck.formatted)) {
        const otherPlayers = await prisma.player.findMany({
          where: { id: { not: playerId } },
          select: { id: true, gamerTag: true, whatsapp: true },
        });
        const duplicatePhone = otherPlayers.find((p) =>
          isSamePhoneNumber(p.whatsapp, phoneCheck.formatted)
        );
        if (duplicatePhone) {
          return NextResponse.json(
            { error: `This WhatsApp phone number (${phoneCheck.formatted}) is already assigned to @${duplicatePhone.gamerTag}.` },
            { status: 400 }
          );
        }
      }
      updateData.whatsapp = phoneCheck.formatted;
    }
    if (division) {
      updateData.division = division;
    }
    if (overallRating !== undefined) {
      updateData.overallRating = Number(overallRating);
    }
    if (status) {
      updateData.status = status;
    }

    const effectiveDivision = division || player.division;

    if (realTeam !== undefined) {
      const team = findTeam(realTeam);
      if (team) {
        // Strict Division-to-League Verification:
        // Division 1 = Premier League, Division 2 = La Liga, Division 3 = Serie A & Serie B (when competitors exceed 20)
        if (effectiveDivision && effectiveDivision !== "RESERVE" && team.division !== effectiveDivision) {
          return NextResponse.json(
            {
              error: `Invalid Club: "${team.name}" belongs to ${team.division} (${team.league}), but this athlete is in ${effectiveDivision}. Division 1 = Premier League, Division 2 = La Liga, Division 3 = Serie A / Serie B.`,
            },
            { status: 400 }
          );
        }

        // Serie B teams: strictly for Division 3 when competitors exceed 20
        if (team.league === "Serie B") {
          if (effectiveDivision !== "Division 3") {
            return NextResponse.json(
              {
                error: `Invalid Club: Serie B clubs can only be assigned in Division 3.`,
              },
              { status: 400 }
            );
          }
          const div3Count = await prisma.player.count({
            where: { division: "Division 3", status: { not: "REJECTED" } },
          });
          if (div3Count <= 20) {
            return NextResponse.json(
              {
                error: `Invalid Club: Serie B clubs are only available when Division 3 exceeds 20 competitors (currently ${div3Count}).`,
              },
              { status: 400 }
            );
          }
        }

        const existingClaim = await prisma.player.findFirst({
          where: {
            id: { not: playerId },
            OR: [
              { realTeam: { equals: team.name, mode: "insensitive" as const } },
              { realTeam: { equals: team.shortName, mode: "insensitive" as const } },
              { realTeam: { equals: team.id, mode: "insensitive" as const } },
            ],
            status: { not: "REJECTED" },
          },
          select: { gamerTag: true },
        });
        if (existingClaim) {
          return NextResponse.json(
            { error: `The football club "${team.name}" is already assigned to @${existingClaim.gamerTag}.` },
            { status: 400 }
          );
        }

        updateData.realTeam = team.name;
        updateData.avatar = team.logo;
      } else if (realTeam === "" || realTeam === null) {
        updateData.realTeam = null;
        updateData.avatar = null;
      }
    } else if (division && division !== player.division) {
      // If division was changed without supplying a new club, clear club if it belonged to the old division
      if (player.realTeam) {
        const currentTeam = findTeam(player.realTeam);
        if (currentTeam && (division === "RESERVE" || currentTeam.division !== division)) {
          updateData.realTeam = null;
          updateData.avatar = null;
        }
      }

      // Handle standings and status transitions
      if (division === "RESERVE") {
        updateData.status = "RESERVED";
        await prisma.standing.deleteMany({ where: { playerId } }).catch(() => {});
        const oldTournament = await prisma.tournament.findFirst({
          where: {
            OR: [
              { name: { contains: player.division, mode: "insensitive" } },
              { slug: { contains: player.division.toLowerCase().replace(/\s+/g, "-"), mode: "insensitive" } },
            ],
            type: "DIVISION",
          },
        });
        if (oldTournament) {
          await recalculateStandings(oldTournament.id, player.division).catch(() => {});
        }
      } else {
        if (player.status === "RESERVED") {
          updateData.status = "ACTIVE";
        }
        
        // Find old division tournament
        const oldTournament = await prisma.tournament.findFirst({
          where: {
            OR: [
              { name: { contains: player.division, mode: "insensitive" } },
              { slug: { contains: player.division.toLowerCase().replace(/\s+/g, "-"), mode: "insensitive" } },
            ],
            type: "DIVISION",
          },
        });

        // Find target division tournament
        const targetTournament = await prisma.tournament.findFirst({
          where: {
            OR: [
              { name: { contains: division, mode: "insensitive" } },
              { slug: { contains: division.toLowerCase().replace(/\s+/g, "-"), mode: "insensitive" } },
            ],
            type: "DIVISION",
          },
        });

        // Clean up any standing in any other division tournament to prevent cross-division duplication
        await prisma.standing.deleteMany({
          where: {
            playerId: player.id,
            tournament: { type: "DIVISION" },
            ...(targetTournament ? { tournamentId: { not: targetTournament.id } } : {}),
          },
        }).catch(() => {});

        if (targetTournament) {
          const existingStanding = await prisma.standing.findFirst({
            where: { playerId: player.id, tournamentId: targetTournament.id },
          });
          if (existingStanding) {
            await prisma.standing.update({
              where: { id: existingStanding.id },
              data: { division: division },
            });
          } else {
            await prisma.standing.create({
              data: {
                tournamentId: targetTournament.id,
                division: division,
                playerId: player.id,
              },
            }).catch(() => {});
          }
          await recalculateStandings(targetTournament.id, division).catch(() => {});
        }

        if (oldTournament && oldTournament.id !== targetTournament?.id) {
          await recalculateStandings(oldTournament.id, player.division).catch(() => {});
        }
      }
    } else if (avatar !== undefined) {
      updateData.avatar = avatar;
    }

    const updated = await prisma.player.update({
      where: { id: playerId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: `Updated player ${updated.gamerTag} successfully!`,
      player: updated,
    });
  } catch (err: any) {
    console.error("Admin update player error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to update player." },
      { status: 500 }
    );
  }
}

export const PUT = POST;

