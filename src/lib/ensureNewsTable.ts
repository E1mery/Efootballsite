import { prisma } from "@/lib/prisma";

let tableEnsured = false;

/**
 * Ensures the News table and indexes exist in PostgreSQL.
 * This runs natively via SQL so it requires no external migration lock steps.
 */
export async function ensureNewsTable() {
  if (tableEnsured) return;
  try {
    // 1. Create table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "News" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "title" TEXT NOT NULL,
        "category" TEXT NOT NULL,
        "featuredImage" TEXT NOT NULL,
        "description" TEXT NOT NULL,
        "buttonText" TEXT,
        "buttonUrl" TEXT,
        "status" TEXT NOT NULL DEFAULT 'DRAFT',
        "publishDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "expirationDate" TIMESTAMP(3) NOT NULL,
        "showOnCarousel" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 1b. Create DismissedSystemNews table to prevent resurrecting deleted system items
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "DismissedSystemNews" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "dismissedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 1c. Create EditedSystemNews table to preserve admin edits on auto-sync items
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "EditedSystemNews" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "editedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Create indexes
    const indexes = [
      { name: "News_status_idx", col: "status" },
      { name: "News_publishDate_idx", col: "publishDate" },
      { name: "News_expirationDate_idx", col: "expirationDate" },
      { name: "News_showOnCarousel_idx", col: "showOnCarousel" },
    ];

    for (const idx of indexes) {
      try {
        await prisma.$executeRawUnsafe(`
          CREATE INDEX IF NOT EXISTS "${idx.name}" ON "News"("${idx.col}")
        `);
      } catch (idxErr) {
        console.warn(`Index ${idx.name} warning:`, idxErr);
      }
    }

    tableEnsured = true;
  } catch (err) {
    console.error("ensureNewsTable error:", err);
  }
}
