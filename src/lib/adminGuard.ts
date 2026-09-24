import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

/**
 * Server-side guard helper.
 * Public pages (standings, fixtures, players, home) are freely viewable
 * by both guests, athletes, and administrators.
 */
export async function redirectAdminToPortal() {
  // Public pages remain accessible so admins can verify live standings and fixtures
  return;
}
