/**
 * Assets Configuration for Rwanda eFootball League
 * Centralizes paths to official logos, branding assets, and competition trophies.
 * If an asset file is not physically present, components should render clean fallback placeholders.
 */

export interface TrophyAsset {
  id: string;
  name: string;
  competition: string;
  imagePath: string;
  fallbackIcon: "trophy" | "award" | "crown" | "shield";
  description: string;
}

export const BRANDING_ASSETS = {
  leagueLogo: "/logo.png",
  efootballOfficialLogo: "/assets/branding/efootball-official-logo.png",
  konamiLogo: "/assets/branding/konami-logo.png",
  rwandaFlag: "/assets/branding/rwanda-flag.svg",
  heroStadiumBg: "/images/home-stadium-bg.jpg",
  carouselStadiumBg: "/images/carousel-stadium-bg.jpg",
  uclStadiumBg: "/images/ucl-stadium-bg.jpg",
  europaStadiumBg: "/images/europa-stadium-bg.jpg",
  hallOfFameBg: "/images/hall-of-fame-bg.png",
  hofCtaStadiumBg: "/images/hof-cta-bg.jpg",
  hofTimelineStadiumBg: "/images/timeline-stadium-bg.jpg",
  trophyCabinetBg: "/images/trophy-cabinet-bg.jpg",
  heroGoldenTrophy: "/images/hall-of-fame-emblem.png",
  hallOfFameEmblem: "/images/hall-of-fame-emblem.png",
};

export const COMPETITION_TROPHIES: Record<string, TrophyAsset> = {
  "Division 1": {
    id: "division-1",
    name: "League Championship Trophy",
    competition: "Division 1",
    imagePath: "/assets/trophies/league.png",
    fallbackIcon: "trophy",
    description: "The pinnacle championship trophy of the Rwandan national top flight league.",
  },
  "UCL": {
    id: "ucl",
    name: "eFootball Champions League Trophy",
    competition: "UCL",
    imagePath: "/assets/trophies/champions-league.png",
    fallbackIcon: "crown",
    description: "The premier elite continental competition trophy.",
  },
  "EUROPA": {
    id: "europa",
    name: "eFootball Europa League Cup",
    competition: "EUROPA",
    imagePath: "/assets/trophies/europa-league.png",
    fallbackIcon: "award",
    description: "The official trophy of the second-tier continental tournament.",
  },
  "Division 2": {
    id: "division-2",
    name: "Division 2 Championship Cup",
    competition: "Division 2",
    imagePath: "/assets/trophies/d2.png",
    fallbackIcon: "shield",
    description: "Honoring the champion of Division 2 and their promotion to the top tier.",
  },
  "Division 3": {
    id: "division-3",
    name: "Division 3 Championship Cup",
    competition: "Division 3",
    imagePath: "/assets/trophies/d3.png",
    fallbackIcon: "shield",
    description: "The grassroots championship trophy celebrating rising talents.",
  },
};

/**
 * Returns trophy metadata for a competition name
 */
export function getTrophyForCompetition(competition: string): TrophyAsset {
  const norm = competition.trim();
  if (COMPETITION_TROPHIES[norm]) {
    return COMPETITION_TROPHIES[norm];
  }
  const upper = norm.toUpperCase();
  if (upper.includes("1") || upper.includes("PREMIER")) return COMPETITION_TROPHIES["Division 1"];
  if (upper.includes("2")) return COMPETITION_TROPHIES["Division 2"];
  if (upper.includes("3")) return COMPETITION_TROPHIES["Division 3"];
  if (upper.includes("UCL") || upper.includes("CHAMPIONS")) return COMPETITION_TROPHIES["UCL"];
  if (upper.includes("EUROPA")) return COMPETITION_TROPHIES["EUROPA"];

  return {
    id: norm.toLowerCase().replace(/\s+/g, "-"),
    name: `${norm} Trophy`,
    competition: norm,
    imagePath: `/assets/trophies/trophy-${norm.toLowerCase().replace(/\s+/g, "-")}.png`,
    fallbackIcon: "trophy",
    description: `Official championship trophy of ${norm}.`,
  };
}
