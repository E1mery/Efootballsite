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
          type: {
            in: [
              "MOTD_RESULT",
              "MOTW_RESULT",
              "DERBY_RESULT",
              "SUPER_CUP_RESULT",
              "UCL_FINAL_RESULT",
              "EUROPA_FINAL_RESULT",
            ],
          },
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

      // 3. Check if it was an Official Derby
      try {
        const { detectDerby } = await import("@/lib/derbyService");
        const derby = (match as any).isDerby && (match as any).derbyName
          ? { id: (match as any).derbyId, name: (match as any).derbyName, autoPublishSocial: true }
          : detectDerby(match.homePlayer, match.awayPlayer);

        if (derby) {
          const derbyAnnouncement = await prisma.socialPost.findFirst({
            where: {
              matchId: match.id,
              type: "DERBY_ANNOUNCEMENT",
            },
          });

          if (derbyAnnouncement || derby.autoPublishSocial) {
            await syncSocialPostForMatch({
              type: "DERBY_RESULT",
              matchId: match.id,
              division: match.division,
              homePlayerId: match.homePlayerId,
              awayPlayerId: match.awayPlayerId,
              homeScore: match.homeScore,
              awayScore: match.awayScore,
              derbyId: derby.id,
              derbyName: derby.name,
            });
          }
        }
      } catch (derbyErr) {
        console.error("[syncSocialResultForMatch] Error checking derby result:", derbyErr);
      }

      // 4. Check if it was an Official Finals Match (Super Cup, UCL, Europa)
      try {
        const { detectFinalCompetition, syncFinalResultPost } = await import("@/lib/finalsSocialService");
        const finalComp = detectFinalCompetition(match);
        if (finalComp && match.homeScore !== null && match.awayScore !== null) {
          await syncFinalResultPost(match.id);
        }
      } catch (finalErr) {
        console.error("[syncSocialResultForMatch] Error syncing final result:", finalErr);
      }
    }
  } catch (err) {
    console.error("[syncSocialResultForMatch] Error updating social result post:", err);
  }
}
