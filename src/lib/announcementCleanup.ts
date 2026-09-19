import { prisma } from "@/lib/prisma";

/**
 * Automatically deletes announcements older than 24 hours from creation.
 * Cascades deletion automatically to AnnouncementRead records.
 */
export async function cleanupExpiredAnnouncements(): Promise<number> {
  try {
    const cutoff24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const deleted = await prisma.announcement.deleteMany({
      where: {
        createdAt: { lt: cutoff24h },
      },
    });

    if (deleted.count > 0) {
      console.log(`[cleanupExpiredAnnouncements] Automatically deleted ${deleted.count} expired announcements (older than 24h).`);
    }

    return deleted.count;
  } catch (err) {
    console.error("[cleanupExpiredAnnouncements] Error:", err);
    return 0;
  }
}
