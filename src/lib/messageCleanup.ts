import { prisma } from "@/lib/prisma";

/**
 * Automatically deletes replied player inquiries 24 hours after the commissioner replied.
 * Also handles legacy replied records where repliedAt was unset by checking updatedAt.
 */
export async function cleanupExpiredRepliedMessages(): Promise<number> {
  try {
    const cutoff24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const deleted = await (prisma as any).playerMessage.deleteMany({
      where: {
        OR: [
          {
            status: "REPLIED",
            repliedAt: { lt: cutoff24h },
          },
          {
            status: "REPLIED",
            repliedAt: null,
            updatedAt: { lt: cutoff24h },
          },
          {
            adminReply: { not: null },
            repliedAt: { lt: cutoff24h },
          },
          {
            adminReply: { not: null },
            repliedAt: null,
            updatedAt: { lt: cutoff24h },
          },
        ],
      },
    });

    if (deleted.count > 0) {
      console.log(`[cleanupExpiredRepliedMessages] Automatically deleted ${deleted.count} expired chats (older than 24h).`);
    }

    return deleted.count;
  } catch (err) {
    console.error("[cleanupExpiredRepliedMessages] Error:", err);
    return 0;
  }
}
