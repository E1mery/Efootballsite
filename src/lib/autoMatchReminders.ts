import { prisma } from "@/lib/prisma";

export interface ReminderResult {
  checkedCount: number;
  remindersSent: number;
  details: string[];
}

/**
 * Checks all active matches expiring within 1 hour.
 * For each match without an uploaded result screenshot or forfeit claim proof,
 * sends an automated individual warning announcement to the unsubmitted players.
 */
export async function checkAndSendOneHourMatchReminders(): Promise<ReminderResult> {
  const result: ReminderResult = {
    checkedCount: 0,
    remindersSent: 0,
    details: [],
  };

  try {
    const now = new Date();
    // Matches whose deadline is within the next 60 minutes
    const oneHourAhead = new Date(now.getTime() + 60 * 60 * 1000);
    // Include grace window of past 5 minutes in case exact rollover is pending
    const graceWindowPast = new Date(now.getTime() - 5 * 60 * 1000);

    const upcomingMatches = await prisma.match.findMany({
      where: {
        status: { in: ["SCHEDULED", "LIVE"] },
        deadlineDate: {
          gte: graceWindowPast,
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
      // 1. If this match already has an accepted or pending submission, results have been submitted!
      const hasValidSubmission = match.submissions.some(
        (s) => s.status === "PENDING" || s.status === "APPROVED"
      );
      const hasValidForfeit = match.forfeitClaims.some(
        (f) => f.status === "PENDING" || f.status === "APPROVED"
      );

      if (hasValidSubmission || hasValidForfeit) {
        // Result or forfeit claim already submitted, no reminder needed
        continue;
      }

      const deadlineStr = new Date(match.deadlineDate).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });

      const uniqueMarker = `[REMINDER-1HR-${match.id}]`;

      // 2. Notify Home Player if not yet reminded
      const homeAlreadySent = await prisma.announcement.findFirst({
        where: {
          targetPlayerId: match.homePlayerId,
          title: { contains: uniqueMarker },
        },
      });

      if (!homeAlreadySent) {
        await prisma.announcement.create({
          data: {
            title: `⏰ 1-Hour Match Deadline Reminder vs ${match.awayPlayer.gamerTag} ${uniqueMarker}`,
            content: `URGENT AUTOMATED MATCHDAY DEADLINE WARNING:
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
          `Sent automated 1-hr reminder to ${match.homePlayer.gamerTag} for match vs ${match.awayPlayer.gamerTag}`
        );
      }

      // 3. Notify Away Player if not yet reminded
      const awayAlreadySent = await prisma.announcement.findFirst({
        where: {
          targetPlayerId: match.awayPlayerId,
          title: { contains: uniqueMarker },
        },
      });

      if (!awayAlreadySent) {
        await prisma.announcement.create({
          data: {
            title: `⏰ 1-Hour Match Deadline Reminder vs ${match.homePlayer.gamerTag} ${uniqueMarker}`,
            content: `URGENT AUTOMATED MATCHDAY DEADLINE WARNING:
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
          `Sent automated 1-hr reminder to ${match.awayPlayer.gamerTag} for match vs ${match.homePlayer.gamerTag}`
        );
      }
    }
  } catch (error: any) {
    console.error("checkAndSendOneHourMatchReminders error:", error);
    result.details.push(`Error: ${error.message}`);
  }

  return result;
}

// In-memory timestamp to prevent excessive DB queries
let lastAutoReminderCheckTime = 0;
const AUTO_REMINDER_THROTTLE_MS = 45 * 1000; // Run at most once every 45s

/**
 * Throttled execution helper that automatically triggers the 1-hour reminder check.
 * Safe to invoke on any server route or background request.
 */
export async function runAutoRemindersIfDue(): Promise<ReminderResult | null> {
  const now = Date.now();
  if (now - lastAutoReminderCheckTime < AUTO_REMINDER_THROTTLE_MS) {
    return null;
  }
  lastAutoReminderCheckTime = now;
  return checkAndSendOneHourMatchReminders();
}

// Register global in-process interval daemon for long-running Node server environments (disabled during build)
const isBuilding =
  process.env.NEXT_PHASE === "phase-production-build" ||
  process.env.npm_lifecycle_event === "build";

if (!isBuilding && typeof globalThis !== "undefined") {
  const g = globalThis as any;
  if (!g.__efootball_reminder_daemon) {
    g.__efootball_reminder_daemon = setInterval(() => {
      checkAndSendOneHourMatchReminders().catch((err) => {
        console.error("Autonomous reminder daemon error:", err);
      });
    }, 60 * 1000); // Pulse every 60 seconds
  }
}
