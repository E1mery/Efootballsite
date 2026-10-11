import { Metadata } from "next";
import Image from "next/image";
import { redirectAdminToPortal } from "@/lib/adminGuard";
import { getArchivedSeasonsList, getArchivedSeasonDetails } from "@/lib/seasonArchiveService";
import { BRANDING_ASSETS } from "@/lib/assets.config";
import SeasonArchiveClient from "./SeasonArchiveClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Season Archive | Rwanda eFootball League",
  description:
    "Official sealed historical records, final standings, champions, fixtures, and statistics of concluded Rwanda eFootball League seasons.",
};

export default async function SeasonArchivePage({
  searchParams,
}: {
  searchParams: Promise<{ season?: string }>;
}) {
  await redirectAdminToPortal();
  const params = await searchParams;
  const selectedSeason = params.season ? decodeURIComponent(params.season) : null;

  const [archivedSeasons, selectedSeasonData] = await Promise.all([
    getArchivedSeasonsList(),
    selectedSeason ? getArchivedSeasonDetails(selectedSeason) : Promise.resolve(null),
  ]);

  return (
    <div className="relative min-h-screen bg-background text-foreground pb-20 selection:bg-secondary/30 selection:text-secondary overflow-hidden">
      {/* Background Esports Arena and Glow */}
      <div
        className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
        aria-hidden="true"
      >
        <Image
          src={BRANDING_ASSETS.hallOfFameBg}
          alt="Rwanda eFootball League Arena Background"
          fill
          priority
          sizes="100vw"
          className="object-cover object-top sm:object-center opacity-30 sm:opacity-40 scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/40 to-background/95" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-background/80" />
        <div className="absolute inset-0 bg-hero-glow opacity-50" />
      </div>

      <div className="relative z-10 pt-6">
        <SeasonArchiveClient
          archivedSeasons={archivedSeasons}
          selectedSeasonData={selectedSeasonData}
          selectedSeasonName={selectedSeason}
        />
      </div>
    </div>
  );
}
