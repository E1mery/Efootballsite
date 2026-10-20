import { prisma } from "@/lib/prisma";

interface NotifyStandingsUpdateParams {
  tournamentType: string; // "UCL" | "EUROPA" | "DIVISION" | "Division 1" etc.
  competitionName: string; // "UCL", "EUROPA", "Division 1", etc.
  groupName?: string | null; // "Group A", "Group B", etc.
  matchSummary?: string;
}

/**
 * Notifies participating players ONLY according to their division or group stage competition.
 * Division 1 updates notify Division 1 players only.
 * Division 2 updates notify Division 2 players only.
 * Division 3 updates notify Division 3 players only.
 * UCL and Europa group stage updates notify players participating in that group/competition only.
 * No broadcast announcements are sent for table updates so non-participating players are never notified.
 */
export async function notifyStandingsUpdate({
  tournamentType,
  competitionName,
  groupName,
  matchSummary,
}: NotifyStandingsUpdateParams) {
  try {
    const rawType = (tournamentType || "").toUpperCase();
    const rawComp = (competitionName || "").toUpperCase();

    const isUcl = rawType.includes("UCL") || rawComp.includes("UCL");
    const isEuropa = rawType.includes("EUROPA") || rawComp.includes("EUROPA");
    const isContinental = isUcl || isEuropa;

    // Purge any legacy broadcast table update announcements so non-participants no longer see them
    await prisma.announcement.deleteMany({
      where: {
        type: "BROADCAST",
        OR: [
          { title: { contains: "Standings Updated" } },
          { title: { contains: "Table Updated" } },
        ],
      },
    }).catch(() => {});

    if (isContinental) {
      const comp = isEuropa ? "EUROPA" : "UCL";
      const effectiveGroupName =
        groupName ||
        competitionName.match(/Group [A-D]/i)?.[0] ||
        (tournamentType ? tournamentType.match(/Group [A-D]/i)?.[0] : null) ||
        null;
      const grpLabel = effectiveGroupName ? ` - ${effectiveGroupName}` : "";

      // Fetch players participating in this competition and group
      const targetPlayerIds = new Set<string>();

      if (effectiveGroupName) {
        // Query slot registrations for this group
        const groupSlots = await prisma.uclGroupSlot.findMany({
          where: {
            competition: comp,
            groupName: effectiveGroupName,
          },
          select: { playerId: true },
        });
        for (const slot of groupSlots) {
          targetPlayerIds.add(slot.playerId);
        }

        // Also query active standings for this group
        const standingsInGroup = await prisma.standing.findMany({
          where: {
            division: `${comp} ${effectiveGroupName}`,
          },
          select: { playerId: true },
        });
        for (const s of standingsInGroup) {
          targetPlayerIds.add(s.playerId);
        }
      }

      // If group slots/standings were not found, fallback to all group-stage participants of this competition
      if (targetPlayerIds.size === 0) {
        const allCompSlots = await prisma.uclGroupSlot.findMany({
          where: { competition: comp },
          select: { playerId: true },
        });
        for (const slot of allCompSlots) {
          targetPlayerIds.add(slot.playerId);
        }

        const compStandings = await prisma.standing.findMany({
          where: {
            division: { contains: comp },
          },
          select: { playerId: true },
        });
        for (const s of compStandings) {
          targetPlayerIds.add(s.playerId);
        }
      }

      if (targetPlayerIds.size === 0) {
        return;
      }

      // Only notify non-reserved, non-disqualified players
      const validPlayers = await prisma.player.findMany({
        where: {
          id: { in: Array.from(targetPlayerIds) },
          status: { in: ["ACTIVE", "WARNING"] },
          isDisqualified: false,
        },
        select: { id: true },
      });

      const recipientIds =
        validPlayers.length > 0
          ? validPlayers.map((p) => p.id)
          : Array.from(targetPlayerIds);

      const title = `📊 ${comp}${grpLabel} Standings Updated!`;
      const content = `Official match results have been verified and approved${
        matchSummary ? ` (${matchSummary})` : ""
      }. The standings table for ${comp}${grpLabel} has been updated. Open your Standings tab to check your current points, goal difference, and qualification status!`;

      for (const pId of recipientIds) {
        await prisma.announcement.create({
          data: {
            title,
            content,
            type: "INDIVIDUAL",
            targetPlayerId: pId,
            isPinned: false,
          },
        });
      }
    } else {
      // Domestic Division standings notification (Division 1, Division 2, Division 3)
      const combined = `${rawType} ${rawComp}`;
      let targetDivision = "Division 1";
      if (combined.includes("DIVISION 1")) {
        targetDivision = "Division 1";
      } else if (combined.includes("DIVISION 2")) {
        targetDivision = "Division 2";
      } else if (combined.includes("DIVISION 3")) {
        targetDivision = "Division 3";
      } else if (competitionName.startsWith("Division")) {
        targetDivision = competitionName;
      }

      // Find all players actively participating in this division
      const targetPlayerIds = new Set<string>();

      const activeDivisionPlayers = await prisma.player.findMany({
        where: {
          division: targetDivision,
          status: { in: ["ACTIVE", "WARNING"] },
          isDisqualified: false,
        },
        select: { id: true },
      });
      for (const p of activeDivisionPlayers) {
        targetPlayerIds.add(p.id);
      }

      const activeDivisionStandings = await prisma.standing.findMany({
        where: {
          division: targetDivision,
          isDisqualified: false,
          player: {
            division: targetDivision,
            status: { in: ["ACTIVE", "WARNING"] },
          },
        },
        select: { playerId: true },
      });
      for (const s of activeDivisionStandings) {
        targetPlayerIds.add(s.playerId);
      }

      if (targetPlayerIds.size === 0) {
        return;
      }

      const title = `📢 ${targetDivision} Standings Updated!`;
      const content = `Official match results have been verified and processed${
        matchSummary ? ` (${matchSummary})` : ""
      }. The ${targetDivision} table has been updated. Head over to the Standings tab to inspect your ranking!`;

      // Send individual notifications ONLY to the players participating in this division
      for (const pId of targetPlayerIds) {
        await prisma.announcement.create({
          data: {
            title,
            content,
            type: "INDIVIDUAL",
            targetPlayerId: pId,
            isPinned: false,
          },
        });
      }
    }
  } catch (err) {
    console.error("notifyStandingsUpdate error:", err);
  }
}

