import { prisma } from "@/lib/prisma";

interface NotifyStandingsUpdateParams {
  tournamentType: string; // "UCL" | "EUROPA" | "DIVISION"
  competitionName: string; // "UCL", "EUROPA", "Division 1", etc.
  groupName?: string | null; // "Group A", "Group B", etc.
  matchSummary?: string;
}

/**
 * Notifies participating players and broadcasts to all users that standings have been updated.
 */
export async function notifyStandingsUpdate({
  tournamentType,
  competitionName,
  groupName,
  matchSummary,
}: NotifyStandingsUpdateParams) {
  try {
    const isUcl = tournamentType === "UCL" || competitionName.toUpperCase().includes("UCL");
    const isEuropa = tournamentType === "EUROPA" || competitionName.toUpperCase().includes("EUROPA");
    const isContinental = isUcl || isEuropa;

    if (isContinental) {
      const comp = isEuropa ? "EUROPA" : "UCL";
      const grpLabel = groupName ? ` - ${groupName}` : "";

      // 1. Fetch participating players for this competition (and this specific group if available)
      const groupSlots = await prisma.uclGroupSlot.findMany({
        where: {
          competition: comp,
          ...(groupName ? { groupName } : {}),
        },
        select: { playerId: true },
      });

      const allCompSlots = await prisma.uclGroupSlot.findMany({
        where: { competition: comp },
        select: { playerId: true },
      });

      // Targeted notification to players in this group
      const targetPlayerIds = new Set<string>();
      for (const slot of groupSlots) {
        targetPlayerIds.add(slot.playerId);
      }
      // If group slots was empty, fallback to all competition participants
      if (targetPlayerIds.size === 0) {
        for (const slot of allCompSlots) {
          targetPlayerIds.add(slot.playerId);
        }
      }

      const individualTitle = `📊 ${comp}${grpLabel} Standings Updated!`;
      const individualContent = `Official match results have been verified and approved${
        matchSummary ? ` (${matchSummary})` : ""
      }. The standings table for ${comp}${grpLabel} has been updated. Open your Standings tab to check your current points, goal difference, and qualification status!`;

      // Create individual notifications for each participating player
      for (const pId of targetPlayerIds) {
        await prisma.announcement.create({
          data: {
            title: individualTitle,
            content: individualContent,
            type: "INDIVIDUAL",
            targetPlayerId: pId,
            isPinned: false,
          },
        });
      }

      // 2. Broadcast notification for all platform users (including reserve athletes)
      await prisma.announcement.create({
        data: {
          title: `🏆 ${comp}${grpLabel} Table Updated!`,
          content: `Match verification completed${
            matchSummary ? ` (${matchSummary})` : ""
          }! The official standings for ${comp}${grpLabel} have been updated. All players can view the latest standings in their portal.`,
          type: "BROADCAST",
          isPinned: true,
        },
      });
    } else {
      // Domestic Division standings notification
      await prisma.announcement.create({
        data: {
          title: `📢 ${competitionName} Standings Updated!`,
          content: `Official match results have been verified and processed${
            matchSummary ? ` (${matchSummary})` : ""
          }. The ${competitionName} table has been updated. Head over to the Standings tab to inspect your ranking!`,
          type: "BROADCAST",
          isPinned: true,
        },
      });
    }
  } catch (err) {
    console.error("notifyStandingsUpdate error:", err);
  }
}
