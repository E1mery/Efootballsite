import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

/**
 * Server-side guard to ensure that an active administrator
 * cannot access the public player portal.
 * If an admin session is detected, immediately redirects to /admin.
 */
export async function redirectAdminToPortal() {
  try {
    const cookieStore = await cookies();
    const roleCookie = cookieStore.get("efrl_role")?.value;
    const sessionUserId = cookieStore.get("efrl_session")?.value;

    // Fast path: role cookie already declares ADMIN
    if (roleCookie === "ADMIN") {
      redirect("/admin");
    }

    // Secondary path: verify against DB session
    if (sessionUserId) {
      const user = await prisma.user.findUnique({
        where: { id: sessionUserId },
        select: { role: true },
      });
      if (user && user.role === "ADMIN") {
        redirect("/admin");
      }
    }
  } catch (err: any) {
    // If it's a Next.js redirect exception (NEXT_REDIRECT), rethrow it
    if (err?.digest?.startsWith("NEXT_REDIRECT")) {
      throw err;
    }
    // Otherwise don't block normal visitors on transient error
  }
}
