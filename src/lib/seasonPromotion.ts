import { prisma } from "@/lib/prisma";

export interface PromotionResult {
  promotedToDiv1: { id: string; gamerTag: string; rank: number; points: number }[];
  promotedToDiv2: { id: string; gamerTag: string; rank: number; points: number }[];
  success: boolean;
  message: string;
}

/**
 * Automatically promotes the top 3 players from Division 2 to Division 1,
 * and top 3 players from Division 3 to Division 2 at the end of the season.
 */
export async function promoteTopPlayersAtSeasonEnd(): Promise<PromotionResult> {
  try {
    // 1. Fetch Division 2 Standings sorted officially
    const div2Standings = await prisma.standing.findMany({
      where: { division: "Division 2" },
      include: { player: true },
      orderBy: [{ points: "desc" }, { goalDifference: "desc" }, { goalsFor: "desc" }],
      take: 3,
    });

    // 2. Fetch Division 3 Standings sorted officially
    const div3Standings = await prisma.standing.findMany({
      where: { division: "Division 3" },
      include: { player: true },
      orderBy: [{ points: "desc" }, { goalDifference: "desc" }, { goalsFor: "desc" }],
      take: 3,
    });

    const promotedToDiv1: { id: string; gamerTag: string; rank: number; points: number }[] = [];
    const promotedToDiv2: { id: string; gamerTag: string; rank: number; points: number }[] = [];

    // 3. Promote Top 3 from Division 2 to Division 1
    for (let i = 0; i < div2Standings.length; i++) {
      const s = div2Standings[i];
      if (s.player) {
        await prisma.player.update({
          where: { id: s.player.id },
          data: { division: "Division 1" },
        });
        promotedToDiv1.push({
          id: s.player.id,
          gamerTag: s.player.gamerTag,
          rank: i + 1,
          points: s.points,
        });
      }
    }

    // 4. Promote Top 3 from Division 3 to Division 2
    for (let i = 0; i < div3Standings.length; i++) {
      const s = div3Standings[i];
      if (s.player) {
        await prisma.player.update({
          where: { id: s.player.id },
          data: { division: "Division 2" },
        });
        promotedToDiv2.push({
          id: s.player.id,
          gamerTag: s.player.gamerTag,
          rank: i + 1,
          points: s.points,
        });
      }
    }

    const div2Tags = promotedToDiv1.map((p) => p.gamerTag).join(", ");
    const div3Tags = promotedToDiv2.map((p) => p.gamerTag).join(", ");

    // 5. Create Official Broadcast Announcement
    await prisma.announcement.create({
      data: {
        title: "🏆 END OF SEASON OFFICIAL PROMOTIONS COMPLETED",
        content: `Official League Notice: The system has finalized season standings and executed automatic promotions:\n\n• PROMOTED TO DIVISION 1: ${div2Tags || "None"}\n• PROMOTED TO DIVISION 2: ${div3Tags || "None"}\n\nCongratulations to the promoted athletes for outstanding performance!`,
        type: "BROADCAST",
        isPinned: true,
      },
    });

    return {
      success: true,
      promotedToDiv1,
      promotedToDiv2,
      message: `Promoted ${promotedToDiv1.length} players to Division 1 and ${promotedToDiv2.length} players to Division 2.`,
    };
  } catch (error: any) {
    console.error("Season promotion error:", error);
    return {
      success: false,
      promotedToDiv1: [],
      promotedToDiv2: [],
      message: error.message || "Failed to execute season promotions.",
    };
  }
}
