import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  const response = NextResponse.json({ success: true, message: "Logged out successfully" });
  response.cookies.set("efrl_session", "", {
    httpOnly: true,
    path: "/",
    expires: new Date(0),
    maxAge: 0,
  });
  response.cookies.set("efrl_role", "", {
    httpOnly: true,
    path: "/",
    expires: new Date(0),
    maxAge: 0,
  });

  const cookieStore = await cookies();
  cookieStore.delete("efrl_session");
  cookieStore.delete("efrl_role");

  return response;
}

