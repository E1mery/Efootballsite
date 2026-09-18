import { prisma } from "@/lib/prisma";

let tableEnsured = false;

/**
 * Ensures the PasswordResetRequest table and indexes exist in PostgreSQL.
 * This runs natively via SQL so it requires no external migration steps.
 */
export async function ensurePasswordResetTable() {
  if (tableEnsured) return;
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "PasswordResetRequest" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "email" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'PENDING',
        "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "approvedAt" TIMESTAMP(3),
        "completedAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS "PasswordResetRequest_email_idx" ON "PasswordResetRequest"("email");
      CREATE INDEX IF NOT EXISTS "PasswordResetRequest_status_idx" ON "PasswordResetRequest"("status");
    `);
    tableEnsured = true;
  } catch (err) {
    console.error("ensurePasswordResetTable error:", err);
  }
}
