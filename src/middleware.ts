import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const role = request.cookies.get("efrl_role")?.value;

  // If user has an active ADMIN role session
  if (role === "ADMIN") {
    // Prevent accessing /admin/login when already authenticated
    if (pathname === "/admin/login") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }

    const isApi = pathname.startsWith("/api");
    const isNext = pathname.startsWith("/_next");
    const isStatic = pathname.includes(".");
    const isAdmin = pathname.startsWith("/admin");

    // Strict boundary: Admin cannot leave the admin portal to access the public portal
    if (!isAdmin && !isApi && !isNext && !isStatic) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
