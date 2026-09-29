import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export default async function AdminLoginPage() {
  const cookieStore = await cookies();
  const sessionUserId = cookieStore.get("efrl_session")?.value;

  if (sessionUserId) {
    const user = await prisma.user.findUnique({
      where: { id: sessionUserId },
    });
    if (user?.role === "ADMIN") {
      redirect("/admin");
    }
  }

  redirect("/login");
}
