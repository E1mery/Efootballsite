import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ensureNewsTable } from "@/lib/ensureNewsTable";
import { syncSystemNewsToCarousel } from "@/lib/systemNewsService";
import AdminNewsManager from "@/components/AdminNewsManager";
import { ArrowLeft, Shield, Sliders } from "lucide-react";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function AdminNewsPage() {
  const cookieStore = await cookies();
  const sessionUserId = cookieStore.get("efrl_session")?.value;

  if (!sessionUserId) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: sessionUserId },
  });

  if (!user || user.role !== "ADMIN") {
    redirect("/login");
  }

  await ensureNewsTable();
  await syncSystemNewsToCarousel();
  const news = await prisma.news.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      {/* Navigation Header Back to Admin Portal */}
      <div className="flex items-center justify-between gap-4 pb-2 border-b border-border/60">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-xs font-mono font-bold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Main Admin Control Center</span>
        </Link>

        <div className="flex items-center gap-2">
          <Link href="/admin">
            <Button variant="outline" size="sm" className="rounded-xl text-xs font-semibold gap-1.5">
              <Sliders className="h-3.5 w-3.5 text-primary" />
              <span>Admin Portal</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Real Admin News Management Hub */}
      <AdminNewsManager initialNews={news as any} />
    </div>
  );
}
