import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

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
      return NextResponse.json({ error: "Unauthorized: Administrator access required." }, { status: 403 });
    }

    const body = await req.json();
    const {
      playerId,
      replacementMode = "NEW_DETAILS", // "FROM_RESERVE" or "NEW_DETAILS"
      reservePlayerId,
      newGamerTag,
      newFullName,
      newWhatsapp,
      newEmail,
      newPassword,
      outgoingAction = "REMOVE", // "REMOVE" or "MOVE_TO_RESERVE"
    } = body;

    if (!playerId) {
      return NextResponse.json({ error: "Target player ID is required." }, { status: 400 });
    }

    const targetPlayer = await prisma.player.findUnique({
      where: { id: playerId },
      include: { user: true },
    });

    if (!targetPlayer) {
      return NextResponse.json({ error: "Athlete not found." }, { status: 404 });
    }

    const division = targetPlayer.division;
    const oldGamerTag = targetPlayer.gamerTag;
    let replacementGamerTag = "";

    if (replacementMode === "FROM_RESERVE") {
      if (!reservePlayerId) {
        return NextResponse.json({ error: "Please select a reserve athlete to promote." }, { status: 400 });
      }

      const reservePlayer = await prisma.player.findUnique({
        where: { id: reservePlayerId },
      });

      if (!reservePlayer) {
        return NextResponse.json({ error: "Selected reserve athlete not found." }, { status: 404 });
      }

      replacementGamerTag = reservePlayer.gamerTag;

      // 1. Re-link scheduled & unplayed matches from targetPlayer to reservePlayer
      await prisma.match.updateMany({
        where: { homePlayerId: targetPlayer.id },
        data: { homePlayerId: reservePlayer.id },
      });

      await prisma.match.updateMany({
        where: { awayPlayerId: targetPlayer.id },
        data: { awayPlayerId: reservePlayer.id },
      });

      // 2. Transfer or create Standing
      const targetStanding = await prisma.standing.findFirst({
        where: { playerId: targetPlayer.id, division: division },
      });

      if (targetStanding) {
        // Delete any existing standing for reserve player in this division to avoid unique constraint
        await prisma.standing.deleteMany({
          where: { playerId: reservePlayer.id, division: division },
        });

        // Update targetStanding to point to reservePlayer
        await prisma.standing.update({
          where: { id: targetStanding.id },
          data: { playerId: reservePlayer.id },
        });
      }

      // 3. Activate reserve player in this division
      await prisma.player.update({
        where: { id: reservePlayer.id },
        data: {
          division: division,
          status: "ACTIVE",
          isDisqualified: false,
          consecutiveMissed: 0,
        },
      });

      // 4. Handle outgoing player
      if (outgoingAction === "MOVE_TO_RESERVE") {
        await prisma.player.update({
          where: { id: targetPlayer.id },
          data: {
            status: "RESERVED",
            isDisqualified: false,
            consecutiveMissed: 0,
          },
        });
      } else {
        // Delete outgoing player
        await prisma.player.delete({ where: { id: targetPlayer.id } }).catch(() => {});
        if (targetPlayer.userId) {
          await prisma.user.delete({ where: { id: targetPlayer.userId } }).catch(() => {});
        }
      }
    } else {
      // Manual new athlete details
      if (!newGamerTag || !newFullName || !newWhatsapp) {
        return NextResponse.json(
          { error: "New Gamer Tag, Full Name, and WhatsApp Number are required." },
          { status: 400 }
        );
      }

      const cleanGamerTag = newGamerTag.trim();
      replacementGamerTag = cleanGamerTag;

      // Check gamerTag uniqueness
      const existingTag = await prisma.player.findFirst({
        where: { gamerTag: cleanGamerTag, id: { not: targetPlayer.id } },
      });
      if (existingTag) {
        return NextResponse.json({ error: "Gamer Tag is already in use by another athlete." }, { status: 400 });
      }

      // Update Player record
      await prisma.player.update({
        where: { id: targetPlayer.id },
        data: {
          gamerTag: cleanGamerTag,
          fullName: newFullName.trim(),
          whatsapp: newWhatsapp.trim(),
          isDisqualified: false,
          consecutiveMissed: 0,
          status: "ACTIVE",
          disqualificationReason: null,
        },
      });

      // Update User credentials if provided
      if (targetPlayer.userId) {
        const updateData: any = {};
        if (newEmail?.trim()) {
          const cleanEmail = newEmail.trim().toLowerCase();
          const existingUser = await prisma.user.findFirst({
            where: { email: cleanEmail, id: { not: targetPlayer.userId } },
          });
          if (existingUser) {
            return NextResponse.json({ error: "Email address is already taken." }, { status: 400 });
          }
          updateData.email = cleanEmail;
        }

        if (newPassword?.trim()) {
          updateData.passwordHash = hashPassword(newPassword.trim());
        }

        if (Object.keys(updateData).length > 0) {
          await prisma.user.update({
            where: { id: targetPlayer.userId },
            data: updateData,
          });
        }
      }
    }

    // 5. Broadcast official league roster replacement notice
    await prisma.announcement.create({
      data: {
        title: `📢 OFFICIAL ROSTER REPLACEMENT: ${replacementGamerTag} Enters ${division}`,
        content: `League roster update: Athlete ${replacementGamerTag} has officially replaced ${oldGamerTag} in ${division}. All upcoming matches, fixtures, and standings tables have been synchronized to reflect ${replacementGamerTag}.`,
        type: "BROADCAST",
        isPinned: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully replaced ${oldGamerTag} with ${replacementGamerTag}. Standings and matches updated!`,
    });
  } catch (err: any) {
    console.error("replace-player error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
