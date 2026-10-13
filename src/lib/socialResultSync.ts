import { prisma } from "@/lib/prisma";
import { syncSocialPostForMatch, getSocialAutomationSettings } from "@/lib/socialFeedService";

/**
 * Checks if a finished match is a Match of the Day or Match of the Week,
 * and if so, publishes or updates its official FULL TIME result post.
 * If the match was reverted back to SCHEDULED, archives/hides any premature result posts.
 */
export async function syncSocialResultForMatch(matchId: string, status: "FINISHED" | "SCHEDULED") {
  try {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        homePlayer: true,
        awayPlayer: true,
      },
    });

    if (!match) return;

    if (status === "SCHEDULED") {
      // Revert/archive any existing result posts so no contradictory information remains
      await prisma.socialPost.updateMany({
        where: {
          matchId,
          type: { in: ["MOTD_RESULT", "MOTW_RESULT"] },
        },
        data: {
          status: "ARCHIVED",
        },
      });
      return;
    }

    if (status === "FINISHED") {
      const settings = await getSocialAutomationSettings();

      // 1. Check if it was Match of the Day
      if (match.isMatchOfTheDay && settings.autoPublishMotdRes) {
        await syncSocialPostForMatch({
          type: "MOTD_RESULT",
          matchId: match.id,
          division: match.division,
          homePlayerId: match.homePlayerId,
          awayPlayerId: match.awayPlayerId,
          homeScore: match.homeScore,
          awayScore: match.awayScore,
        });
      }

      // 2. Check if it was Match of the Week
      // Look for existing MOTW announcement or active carousel MOTW
      const motwAnnouncement = await prisma.socialPost.findFirst({
        where: {
          matchId: match.id,
          type: "MOTW_ANNOUNCEMENT",
        },
      });

      const motwNews = await prisma.news.findFirst({
        where: {
          OR: [
            { id: "sys-motw-active" },
            { id: `sys-motw-${match.id}` },
          ],
          showOnCarousel: true,
        },
      });

      if ((motwAnnouncement || motwNews) && settings.autoPublishMotwRes) {
        await syncSocialPostForMatch({
          type: "MOTW_RESULT",
          matchId: match.id,
          division: match.division,
          homePlayerId: match.homePlayerId,
          awayPlayerId: match.awayPlayerId,
          homeScore: match.homeScore,
          awayScore: match.awayScore,
        });
      }
    }
  } catch (err) {
    console.error("[syncSocialResultForMatch] Error updating social result post:", err);
  }
}
