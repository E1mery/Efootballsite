import { prisma } from "@/lib/prisma";

let tableEnsured = true;

/**
 * Ensures the PasswordResetRequest table and indexes exist in the database.
 * Since PasswordResetRequest is fully defined in Prisma schema,
 * runtime DDL execution is avoided during request processing.
 */
export async function ensurePasswordResetTable() {
  return;
}
