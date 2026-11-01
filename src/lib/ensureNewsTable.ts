import { prisma } from "@/lib/prisma";

let tableEnsured = true;

/**
 * Ensures the News table and indexes exist in the database.
 * Since News, DismissedSystemNews, and EditedSystemNews are fully defined in Prisma schema,
 * runtime DDL execution is avoided during request processing to prevent Worker CPU exhaustion.
 */
export async function ensureNewsTable() {
  return;
}
