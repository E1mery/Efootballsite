import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { recalculateStandings } from "@/lib/recalculateStandings";
import { findTeam } from "@/lib/teams";

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
    let activeReplacementPlayerId = targetPlayer.id;

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
      activeReplacementPlayerId = reservePlayer.id;

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

      // Reassign all unplayed matches (SCHEDULED and LIVE) from outgoing player to the newly activated player
      await prisma.match.updateMany({
        where: { homePlayerId: targetPlayer.id, status: { in: ["SCHEDULED", "LIVE"] } },
        data: { homePlayerId: reservePlayer.id },
      });
      await prisma.match.updateMany({
        where: { awayPlayerId: targetPlayer.id, status: { in: ["SCHEDULED", "LIVE"] } },
        data: { awayPlayerId: reservePlayer.id },
      });

      // Verify if reserve player's club matches the division
      let reserveTeamUpdate: { realTeam?: string | null; avatar?: string | null } = {};
      if (reservePlayer.realTeam) {
        const teamObj = findTeam(reservePlayer.realTeam);
        if (!teamObj || teamObj.division !== division) {
          reserveTeamUpdate = { realTeam: null, avatar: null };
        }
      }

      // 3. Activate reserve player in this division
      await prisma.player.update({
        where: { id: reservePlayer.id },
        data: {
          division: division,
          status: "ACTIVE",
          isDisqualified: false,
          consecutiveMissed: 0,
          ...reserveTeamUpdate,
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
      activeReplacementPlayerId = targetPlayer.id;

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

    // 5. REOPEN MISSED MATCHES (FORFEITS & AUTOMATIC DRAWS) FOR REPLACEMENT ATHLETE
    // The replacement athlete must begin with those backlog matches, with 48 hours to complete them!
    const playerIdsToCheck = [targetPlayer.id, activeReplacementPlayerId];
    const candidateMatches = await prisma.match.findMany({
      where: {
        OR: [
          { homePlayerId: { in: playerIdsToCheck } },
          { awayPlayerId: { in: playerIdsToCheck } },
        ],
      },
      include: { homePlayer: true, awayPlayer: true },
    });

    const now = new Date();
    const deadline48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    let reopenedCount = 0;

    for (const m of candidateMatches) {
      const isForfeit = m.status === "FORFEIT";
      const isDrawFromMiss =
        m.status === "FINISHED" &&
        (m.notes?.includes("Automatic 0-0 Draw") ||
          m.notes?.includes("0-0 Draw") ||
          m.notes?.includes("missed match") ||
          m.notes?.includes("elapsed without submitted score"));
      const isWaitingSub = m.notes?.includes("WAITING_FOR_SUB");
      const isUnplayedScheduled = m.status === "SCHEDULED";

      if (isForfeit || isDrawFromMiss || isWaitingSub || isUnplayedScheduled) {
        // Re-link to the active replacement player if needed
        let newHomeId = m.homePlayerId;
        let newAwayId = m.awayPlayerId;
        if (m.homePlayerId === targetPlayer.id) newHomeId = activeReplacementPlayerId;
        if (m.awayPlayerId === targetPlayer.id) newAwayId = activeReplacementPlayerId;

        // Reopen match for 48 hours
        await prisma.match.update({
          where: { id: m.id },
          data: {
            homePlayerId: newHomeId,
            awayPlayerId: newAwayId,
            status: "SCHEDULED",
            homeScore: null,
            awayScore: null,
            leg2HomeScore: null,
            leg2AwayScore: null,
            aggregateHomeScore: null,
            aggregateAwayScore: null,
            screenshotUrl: null,
            leg2ScreenshotUrl: null,
            allowLateSubmission: true,
            notes: `REPLACEMENT_BACKLOG: Reopened for replacement athlete @${replacementGamerTag}. 48-hour completion window.`,
            matchDate: now,
            deadlineDate: deadline48h,
            extendedDeadlineDate: deadline48h,
          },
        });

        // Clear any old submissions or forfeit claims for this match
        await prisma.matchSubmission.deleteMany({ where: { matchId: m.id } }).catch(() => {});
        await prisma.forfeitClaim.deleteMany({ where: { matchId: m.id } }).catch(() => {});

        // Identify the opponent
        const opponentId = newHomeId === activeReplacementPlayerId ? newAwayId : newHomeId;

        // Notify the opponent that the substitute has arrived and the match has a 48-hour window
        if (opponentId) {
          await prisma.announcement.create({
            data: {
              title: `⚡ Replacement Match Ready: 48 Hours (${m.round})`,
              content: `Athlete @${replacementGamerTag} has officially arrived as the substitute. Your match for ${m.round} is now active! Both you and your opponent have a 48-hour window to play and upload your result screenshots.`,
              type: "INDIVIDUAL",
              targetPlayerId: opponentId,
              isPinned: true,
            },
          });
        }

        // Notify the replacement athlete that they must begin with this backlog match
        await prisma.announcement.create({
          data: {
            title: `⚡ Priority Backlog Match: 48 Hours (${m.round})`,
            content: `Welcome @${replacementGamerTag}! You must begin with this fixture (${m.round}). You and your opponent have 48 hours to complete this match and upload your result screenshots before it closes.`,
            type: "INDIVIDUAL",
            targetPlayerId: activeReplacementPlayerId,
            isPinned: true,
          },
        });

        reopenedCount++;
      }
    }

    // 6. Recalculate standings so old 0-0/forfeit points are reset and reflected accurately
    const targetStanding = await prisma.standing.findFirst({
      where: { playerId: activeReplacementPlayerId, division },
    });
    if (targetStanding?.tournamentId) {
      await recalculateStandings(targetStanding.tournamentId, division);
    }

    // 7. Broadcast official league roster replacement notice
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
      message: `Successfully replaced ${oldGamerTag} with ${replacementGamerTag}. Reopened ${reopenedCount} backlog match(es) with a 48-hour window!`,
    });
  } catch (err: any) {
    console.error("replace-player error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
