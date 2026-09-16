import { NextResponse } from "next/server";

// Forwarding /api/register to /api/auth/register
export async function POST(req: Request) {
  return NextResponse.redirect(new URL("/api/auth/register", req.url));
}
