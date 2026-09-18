import { prisma } from "@/lib/prisma";

export interface RelegationResult {
  relegatedToDiv2: { id: string; gamerTag: string; rank: number; points: number }[];
  relegatedToDiv3: { id: string; gamerTag: string; rank: number; points: number }[];
  success: boolean;
  message: string;
}

export interface PromotionResult {
  promotedToDiv1: { id: string; gamerTag: string; rank: number; points: number }[];
  promotedToDiv2: { id: string; gamerTag: string; rank: number; points: number }[];
  success: boolean;
  message: string;
}

export interface SeasonTransitionResult {
  relegations: RelegationResult;
  promotions: PromotionResult;
  success: boolean;
  message: string;
}

/**
 * Relegates the bottom 3 players from Division 1 to Division 2,
 * and the bottom 3 players from Division 2 to Division 3 at the end of the season.
 * Updates both Player.division and Standing.division so all division queries
 * and player dashboard tabs immediately point to their new division.
 */
export async function relegateBottomPlayersAtSeasonEnd(): Promise<RelegationResult> {
  try {
    // 1. Fetch Division 1 Standings sorted officially
    const div1Standings = await prisma.standing.findMany({
      where: { division: "Division 1" },
      include: { player: true },
      orderBy: [{ points: "desc" }, { goalDifference: "desc" }, { goalsFor: "desc" }],
    });

    // 2. Fetch Division 2 Standings sorted officially
    const div2Standings = await prisma.standing.findMany({
      where: { division: "Division 2" },
      include: { player: true },
      orderBy: [{ points: "desc" }, { goalDifference: "desc" }, { goalsFor: "desc" }],
    });

    const relegatedToDiv2: { id: string; gamerTag: string; rank: number; points: number }[] = [];
    const relegatedToDiv3: { id: string; gamerTag: string; rank: number; points: number }[] = [];

    // 3. Relegate Bottom 3 from Division 1 to Division 2 (requires at least 4 registered athletes)
    if (div1Standings.length >= 4) {
      const bottom3Div1 = div1Standings.slice(-3);
      for (const s of bottom3Div1) {
        if (s.player) {
          const rank = div1Standings.findIndex((x) => x.id === s.id) + 1;

          // Update Player and Standing division
          await prisma.player.update({
            where: { id: s.player.id },
            data: { division: "Division 2" },
          });

          await prisma.standing.updateMany({
            where: { playerId: s.player.id },
            data: { division: "Division 2" },
          });

          relegatedToDiv2.push({
            id: s.player.id,
            gamerTag: s.player.gamerTag,
            rank,
            points: s.points,
          });

          // Send individual inbox alert to player
          await prisma.announcement.create({
            data: {
              title: "📉 Official Notice: Relegated to Division 2",
              content: `Hello ${s.player.gamerTag}, you finished in the bottom 3 of Division 1 (Rank #${rank} with ${s.points} pts). You have been officially relegated to Division 2 for the upcoming season. Your dashboard, fixtures, and standings access are now updated to Division 2. Prepare your squad to fight for promotion!`,
              type: "DIRECT",
              targetPlayerId: s.player.id,
              isPinned: true,
            },
          });
        }
      }
    }

    // 4. Relegate Bottom 3 from Division 2 to Division 3 (requires at least 4 registered athletes)
    if (div2Standings.length >= 4) {
      const bottom3Div2 = div2Standings.slice(-3);
      for (const s of bottom3Div2) {
        if (s.player) {
          const rank = div2Standings.findIndex((x) => x.id === s.id) + 1;

          // Update Player and Standing division
          await prisma.player.update({
            where: { id: s.player.id },
            data: { division: "Division 3" },
          });

          await prisma.standing.updateMany({
            where: { playerId: s.player.id },
            data: { division: "Division 3" },
          });

          relegatedToDiv3.push({
            id: s.player.id,
            gamerTag: s.player.gamerTag,
            rank,
            points: s.points,
          });

          // Send individual inbox alert to player
          await prisma.announcement.create({
            data: {
              title: "📉 Official Notice: Relegated to Division 3",
              content: `Hello ${s.player.gamerTag}, you finished in the bottom 3 of Division 2 (Rank #${rank} with ${s.points} pts). You have been officially relegated to Division 3 for the upcoming season. Your dashboard, fixtures, and standings access are now updated to Division 3.`,
              type: "DIRECT",
              targetPlayerId: s.player.id,
              isPinned: true,
            },
          });
        }
      }
    }

    const div1Tags = relegatedToDiv2.map((p) => p.gamerTag).join(", ");
    const div2Tags = relegatedToDiv3.map((p) => p.gamerTag).join(", ");

    // 5. Broadcast announcement
    if (relegatedToDiv2.length > 0 || relegatedToDiv3.length > 0) {
      await prisma.announcement.create({
        data: {
          title: "📉 OFFICIAL DIVISION RELEGATIONS COMPLETED",
          content: `Official League Notice: The Commissioner has confirmed official season relegations:\n\n• RELEGATED FROM DIVISION 1 TO DIVISION 2: ${
            div1Tags || "None"
          }\n• RELEGATED FROM DIVISION 2 TO DIVISION 3: ${
            div2Tags || "None"
          }\n\nRelegated players will now access and compete within their new division fixture calendars and tables.`,
          type: "BROADCAST",
          isPinned: true,
        },
      });
    }

    return {
      success: true,
      relegatedToDiv2,
      relegatedToDiv3,
      message: `Relegated ${relegatedToDiv2.length} players from Div 1 to Div 2, and ${relegatedToDiv3.length} players from Div 2 to Div 3.`,
    };
  } catch (error: any) {
    console.error("Season relegation error:", error);
    return {
      success: false,
      relegatedToDiv2: [],
      relegatedToDiv3: [],
      message: error.message || "Failed to execute season relegations.",
    };
  }
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

        await prisma.standing.updateMany({
          where: { playerId: s.player.id },
          data: { division: "Division 1" },
        });

        promotedToDiv1.push({
          id: s.player.id,
          gamerTag: s.player.gamerTag,
          rank: i + 1,
          points: s.points,
        });

        await prisma.announcement.create({
          data: {
            title: "🏆 Official Notice: Promoted to Division 1 (Premiership)",
            content: `Congratulations ${s.player.gamerTag}! You finished in the top 3 of Division 2 (Rank #${i + 1} with ${s.points} pts) and earned promotion to Division 1! Your dashboard and standings are now set to Division 1.`,
            type: "DIRECT",
            targetPlayerId: s.player.id,
            isPinned: true,
          },
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

        await prisma.standing.updateMany({
          where: { playerId: s.player.id },
          data: { division: "Division 2" },
        });

        promotedToDiv2.push({
          id: s.player.id,
          gamerTag: s.player.gamerTag,
          rank: i + 1,
          points: s.points,
        });

        await prisma.announcement.create({
          data: {
            title: "🏆 Official Notice: Promoted to Division 2 (Championship)",
            content: `Congratulations ${s.player.gamerTag}! You finished in the top 3 of Division 3 (Rank #${i + 1} with ${s.points} pts) and earned promotion to Division 2! Your dashboard and standings are now set to Division 2.`,
            type: "DIRECT",
            targetPlayerId: s.player.id,
            isPinned: true,
          },
        });
      }
    }

    const div2Tags = promotedToDiv1.map((p) => p.gamerTag).join(", ");
    const div3Tags = promotedToDiv2.map((p) => p.gamerTag).join(", ");

    // 5. Create Official Broadcast Announcement
    if (promotedToDiv1.length > 0 || promotedToDiv2.length > 0) {
      await prisma.announcement.create({
        data: {
          title: "🏆 END OF SEASON OFFICIAL PROMOTIONS COMPLETED",
          content: `Official League Notice: The system has finalized season standings and executed automatic promotions:\n\n• PROMOTED TO DIVISION 1: ${
            div2Tags || "None"
          }\n• PROMOTED TO DIVISION 2: ${
            div3Tags || "None"
          }\n\nCongratulations to the promoted athletes for outstanding performance!`,
          type: "BROADCAST",
          isPinned: true,
        },
      });
    }

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

/**
 * Master function that can execute Relegations, Promotions, or both simultaneously.
 */
export async function executeSeasonTransition(
  action: "ALL" | "RELEGATE_ONLY" | "PROMOTE_ONLY" = "ALL"
): Promise<SeasonTransitionResult> {
  let relegations: RelegationResult = {
    relegatedToDiv2: [],
    relegatedToDiv3: [],
    success: true,
    message: "Skipped",
  };

  let promotions: PromotionResult = {
    promotedToDiv1: [],
    promotedToDiv2: [],
    success: true,
    message: "Skipped",
  };

  if (action === "ALL" || action === "RELEGATE_ONLY") {
    relegations = await relegateBottomPlayersAtSeasonEnd();
  }

  if (action === "ALL" || action === "PROMOTE_ONLY") {
    promotions = await promoteTopPlayersAtSeasonEnd();
  }

  const success = relegations.success && promotions.success;
  const message = [
    relegations.message !== "Skipped" ? relegations.message : null,
    promotions.message !== "Skipped" ? promotions.message : null,
  ]
    .filter(Boolean)
    .join(" | ");

  return {
    relegations,
    promotions,
    success,
    message: message || "Season transition completed.",
  };
}
