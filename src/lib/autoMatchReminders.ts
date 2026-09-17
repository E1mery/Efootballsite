import { prisma } from "@/lib/prisma";

export interface ReminderResult {
  checkedCount: number;
  remindersSent: number;
  details: string[];
}

/**
 * Checks all active matches expiring within 1 hour.
 * For each match, if a player has neither uploaded a result screenshot
 * nor claimed an opponent forfeit, sends an automated individual warning announcement.
 */
export async function checkAndSendOneHourMatchReminders(): Promise<ReminderResult> {
  const result: ReminderResult = {
    checkedCount: 0,
    remindersSent: 0,
    details: [],
  };

  try {
    const now = new Date();
    // Eligible window: matches whose deadline is within 60 minutes from now (now <= deadlineDate <= now + 60 mins)
    const oneHourAhead = new Date(now.getTime() + 60 * 60 * 1000);

    const upcomingMatches = await prisma.match.findMany({
      where: {
        status: { in: ["SCHEDULED", "LIVE"] },
        deadlineDate: {
          gte: now,
          lte: oneHourAhead,
        },
      },
      include: {
        homePlayer: true,
        awayPlayer: true,
        submissions: true,
        forfeitClaims: true,
      },
    });

    result.checkedCount = upcomingMatches.length;

    for (const match of upcomingMatches) {
      const deadlineStr = new Date(match.deadlineDate).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });

      const uniqueMarker = `[REMINDER-1HR-${match.id}]`;

      // 1. Check Home Player
      const homeHasSubmitted = match.submissions.some(
        (s) => s.submittedByPlayerId === match.homePlayerId
      );
      const homeHasClaimedForfeit = match.forfeitClaims.some(
        (f) => f.claimantPlayerId === match.homePlayerId
      );

      if (!homeHasSubmitted && !homeHasClaimedForfeit) {
        // Player has neither played (uploaded result) nor claimed forfeit
        const alreadySent = await prisma.announcement.findFirst({
          where: {
            targetPlayerId: match.homePlayerId,
            title: { contains: uniqueMarker },
          },
        });

        if (!alreadySent) {
          await prisma.announcement.create({
            data: {
              title: `⏰ 1-Hour Match Deadline Reminder vs ${match.awayPlayer.gamerTag} ${uniqueMarker}`,
              content: `URGENT MATCHDAY DEADLINE WARNING:
Your scheduled ${match.division} match vs ${match.awayPlayer.gamerTag} (${match.round}) expires in less than 1 hour (Cutoff: ${deadlineStr})!

Our system records confirm you have NOT:
• Uploaded a match result screenshot, OR
• Submitted an opponent forfeit claim proof.

REQUIRED ACTION NOW:
1. Message ${match.awayPlayer.gamerTag} immediately on WhatsApp at ${match.awayPlayer.whatsapp} to play your eFootball Mobile match.
2. Once finished, upload the post-game score screenshot in your Dashboard before the cutoff.
3. If your opponent does not respond or cannot be reached, submit "Claim Opponent Forfeit" with your chat proof BEFORE the 1-hour window expires.

⚠️ IMPORTANT: If the deadline passes without an uploaded score or forfeit claim, this fixture is registered as an unplayed forfeit, counting toward your 3-match disqualification limit.`,
              type: "INDIVIDUAL",
              targetPlayerId: match.homePlayerId,
              isPinned: true,
            },
          });

          result.remindersSent++;
          result.details.push(
            `Sent 1-hr reminder to ${match.homePlayer.gamerTag} for match vs ${match.awayPlayer.gamerTag}`
          );
        }
      }

      // 2. Check Away Player
      const awayHasSubmitted = match.submissions.some(
        (s) => s.submittedByPlayerId === match.awayPlayerId
      );
      const awayHasClaimedForfeit = match.forfeitClaims.some(
        (f) => f.claimantPlayerId === match.awayPlayerId
      );

      if (!awayHasSubmitted && !awayHasClaimedForfeit) {
        // Player has neither played (uploaded result) nor claimed forfeit
        const alreadySent = await prisma.announcement.findFirst({
          where: {
            targetPlayerId: match.awayPlayerId,
            title: { contains: uniqueMarker },
          },
        });

        if (!alreadySent) {
          await prisma.announcement.create({
            data: {
              title: `⏰ 1-Hour Match Deadline Reminder vs ${match.homePlayer.gamerTag} ${uniqueMarker}`,
              content: `URGENT MATCHDAY DEADLINE WARNING:
Your scheduled ${match.division} match vs ${match.homePlayer.gamerTag} (${match.round}) expires in less than 1 hour (Cutoff: ${deadlineStr})!

Our system records confirm you have NOT:
• Uploaded a match result screenshot, OR
• Submitted an opponent forfeit claim proof.

REQUIRED ACTION NOW:
1. Message ${match.homePlayer.gamerTag} immediately on WhatsApp at ${match.homePlayer.whatsapp} to play your eFootball Mobile match.
2. Once finished, upload the post-game score screenshot in your Dashboard before the cutoff.
3. If your opponent does not respond or cannot be reached, submit "Claim Opponent Forfeit" with your chat proof BEFORE the 1-hour window expires.

⚠️ IMPORTANT: If the deadline passes without an uploaded score or forfeit claim, this fixture is registered as an unplayed forfeit, counting toward your 3-match disqualification limit.`,
              type: "INDIVIDUAL",
              targetPlayerId: match.awayPlayerId,
              isPinned: true,
            },
          });

          result.remindersSent++;
          result.details.push(
            `Sent 1-hr reminder to ${match.awayPlayer.gamerTag} for match vs ${match.homePlayer.gamerTag}`
          );
        }
      }
    }
  } catch (error: any) {
    console.error("checkAndSendOneHourMatchReminders error:", error);
    result.details.push(`Error: ${error.message}`);
  }

  return result;
}
