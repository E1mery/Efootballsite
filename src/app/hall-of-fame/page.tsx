import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { redirectAdminToPortal } from "@/lib/adminGuard";
import AnimatedEfootballBackground from "@/components/AnimatedEfootballBackground";
import HallOfFameClient from "./HallOfFameClient";
import { Crown } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Hall of Fame | eFootball Rwanda League",
  description:
    "Honoring the immortalized champions and legendary esports athletes of eFootball Rwanda League.",
};

export default async function HallOfFamePage() {
  await redirectAdminToPortal();

  let hallOfFameEntries: any[] = [];

  try {
    hallOfFameEntries = await prisma.hallOfFame.findMany({
      orderBy: [{ season: "desc" }, { createdAt: "desc" }],
    });
  } catch (error) {
    console.error("HallOfFame fetch error:", error);
  }

  return (
    <div className="relative min-h-screen pb-20 overflow-hidden">
      {/* Animated Background */}
      <AnimatedEfootballBackground />

      <main className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10 space-y-8">
        {/* Page Header */}
        <div className="border-b border-border pb-6 space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/15 border border-secondary/30">
              <Crown className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black uppercase text-foreground tracking-tight">
                EFRL Hall of Fame
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Honoring the legendary esports champions who conquered Rwanda&apos;s most competitive eFootball tournaments.
              </p>
            </div>
          </div>
        </div>

        {/* Client Interactive View */}
        <HallOfFameClient entries={hallOfFameEntries} />
      </main>
    </div>
  );
}
