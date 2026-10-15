/**
 * Rwanda eFootball League — Intelligent Background Selection Engine
 * Strictly maps event categories and competitions to verified existing project assets.
 * No generic fallback; priority resolution ensures the right atmosphere for every post.
 */

import { SocialEventCategory, ExtendedSocialPostType } from "./socialFeedTypes";

export interface ApprovedBackground {
  id: string;
  name: string;
  imagePath: string;
  theme: "ucl" | "europa" | "supercup" | "motw" | "motd" | "stadium" | "gold" | "dark" | "timeline";
  description: string;
}

/**
 * Registry of approved background assets physically present in /public/images/
 */
export const APPROVED_BACKGROUNDS: Record<string, ApprovedBackground> = {
  UCL_STADIUM: {
    id: "UCL_STADIUM",
    name: "UEFA Champions League Arena",
    imagePath: "/images/ucl-stadium-bg.jpg",
    theme: "ucl",
    description: "Midnight-blue stadium floodlights with silver celestial atmosphere.",
  },
  EUROPA_STADIUM: {
    id: "EUROPA_STADIUM",
    name: "UEFA Europa League Arena",
    imagePath: "/images/europa-stadium-bg.jpg",
    theme: "europa",
    description: "Dark stadium architecture with restrained orange and amber lighting.",
  },
  SUPER_CUP_STADIUM: {
    id: "SUPER_CUP_STADIUM",
    name: "UEFA Super Cup Arena",
    imagePath: "/images/super-cup-bg.jpg",
    theme: "supercup",
    description: "Cinematic dark-blue stadium with refined gold and silver accents.",
  },
  MOTW_STADIUM: {
    id: "MOTW_STADIUM",
    name: "Match of the Week Arena",
    imagePath: "/images/motw-stadium-bg.jpg",
    theme: "motw",
    description: "High-intensity spotlight arena for marquee league showdowns.",
  },
  TODAY_MATCH: {
    id: "TODAY_MATCH",
    name: "Match of the Day Arena",
    imagePath: "/images/today-match-bg.png",
    theme: "motd",
    description: "Dramatic pitch textures with spotlight effects and gold broadcast accents.",
  },
  HOME_STADIUM: {
    id: "HOME_STADIUM",
    name: "Kigali National Esports Stadium",
    imagePath: "/images/home-stadium-bg.jpg",
    theme: "stadium",
    description: "Energetic floodlit arena with illuminated pitch and wide stadium crowds.",
  },
  CAROUSEL_STADIUM: {
    id: "CAROUSEL_STADIUM",
    name: "Championship Broadcast Stage",
    imagePath: "/images/carousel-stadium-bg.jpg",
    theme: "dark",
    description: "High-contrast dark stadium surface optimized for tables and results.",
  },
  TIMELINE_STADIUM: {
    id: "TIMELINE_STADIUM",
    name: "Official League Notices Arena",
    imagePath: "/images/timeline-stadium-bg.jpg",
    theme: "timeline",
    description: "Subtle architectural stadium background for notices and deadline updates.",
  },
  HALL_OF_FAME: {
    id: "HALL_OF_FAME",
    name: "Hall of Fame Sanctuary",
    imagePath: "/images/hall-of-fame-bg.png",
    theme: "gold",
    description: "Prestigious dark background with restrained gold accents and emblems.",
  },
  TROPHY_CABINET: {
    id: "TROPHY_CABINET",
    name: "Champions Trophy Showcase",
    imagePath: "/images/trophy-cabinet-bg.jpg",
    theme: "gold",
    description: "Celebratory stadium background with golden lighting for crowning champions.",
  },
};

export const APPROVED_BACKGROUND_LIST = Object.values(APPROVED_BACKGROUNDS);

export interface ResolveBackgroundOptions {
  category?: SocialEventCategory | string;
  type?: ExtendedSocialPostType | string;
  division?: string | null;
  competition?: string | null;
  round?: string | null;
  isResult?: boolean;
}

/**
 * Intelligent background selection engine.
 * Selects recommended background based on category, competition, and purpose.
 */
export function resolveSocialBackground(options: ResolveBackgroundOptions): ApprovedBackground {
  const { category, type = "", division = "", competition = "", round = "" } = options;
  const upperType = (type || "").toUpperCase();
  const upperDiv = (division || "").toUpperCase();
  const upperComp = (competition || "").toUpperCase();
  const upperRound = (round || "").toUpperCase();

  // 1. UEFA Champions League (Draws, Fixtures, Finals, Standings)
  if (
    upperType.includes("UCL") ||
    upperDiv.includes("UCL") ||
    upperComp.includes("UCL") ||
    upperType.includes("CHAMPIONS_LEAGUE")
  ) {
    return APPROVED_BACKGROUNDS.UCL_STADIUM;
  }

  // 2. UEFA Europa League (Draws, Fixtures, Finals, Standings)
  if (
    upperType.includes("EUROPA") ||
    upperDiv.includes("EUROPA") ||
    upperComp.includes("EUROPA")
  ) {
    return APPROVED_BACKGROUNDS.EUROPA_STADIUM;
  }

  // 3. UEFA Super Cup
  if (
    upperType.includes("SUPER_CUP") ||
    upperDiv.includes("SUPER_CUP") ||
    upperComp.includes("SUPER_CUP") ||
    upperRound.includes("SUPER CUP")
  ) {
    return APPROVED_BACKGROUNDS.SUPER_CUP_STADIUM;
  }

  // 4. Match of the Week & Rivalries
  if (upperType.startsWith("MOTW") || upperType.includes("RIVALRY")) {
    return APPROVED_BACKGROUNDS.MOTW_STADIUM;
  }

  // 5. Match of the Day
  if (upperType.startsWith("MOTD")) {
    return APPROVED_BACKGROUNDS.TODAY_MATCH;
  }

  // 6. Champions Announcements & Season Completion
  if (
    upperType.includes("CHAMPION") ||
    upperType.includes("SEASON_COMPLETION") ||
    upperRound.includes("FINAL_RESULT")
  ) {
    return APPROVED_BACKGROUNDS.TROPHY_CABINET;
  }

  // 7. Hall of Fame & Season Archive
  if (
    upperType.includes("HALL_OF_FAME") ||
    upperType.includes("SEASON_ARCHIVE")
  ) {
    return APPROVED_BACKGROUNDS.HALL_OF_FAME;
  }

  // 8. Standings Tables
  if (
    category === "STANDINGS_STATS" ||
    upperType.startsWith("STANDINGS") ||
    upperType.includes("TABLE")
  ) {
    return APPROVED_BACKGROUNDS.CAROUSEL_STADIUM;
  }

  // 9. Official Notices, Deadline Changes, Format Updates
  if (
    category === "ADMIN_ANNOUNCEMENTS" ||
    upperType.includes("NOTICE") ||
    upperType.includes("DEADLINE") ||
    upperType.includes("MAINTENANCE")
  ) {
    return APPROVED_BACKGROUNDS.TIMELINE_STADIUM;
  }

  // 10. Season Kickoff & Registration
  if (
    upperType.includes("KICKOFF") ||
    upperType.includes("REGISTRATION") ||
    upperType.includes("FIXTURE_RELEASE")
  ) {
    return APPROVED_BACKGROUNDS.HOME_STADIUM;
  }

  // 11. Playoff draws & brackets
  if (upperType.includes("PLAYOFF") || upperType.includes("KNOCKOUT")) {
    return APPROVED_BACKGROUNDS.CAROUSEL_STADIUM;
  }

  // Default fallback to Kigali National Esports Stadium
  return APPROVED_BACKGROUNDS.HOME_STADIUM;
}

/**
 * Returns background asset by ID or path, or resolves default
 */
export function getBackgroundByKeyOrPath(keyOrPath?: string | null): ApprovedBackground {
  if (!keyOrPath) return APPROVED_BACKGROUNDS.HOME_STADIUM;

  const foundById = APPROVED_BACKGROUNDS[keyOrPath];
  if (foundById) return foundById;

  const foundByPath = Object.values(APPROVED_BACKGROUNDS).find(
    (b) => b.imagePath === keyOrPath
  );
  if (foundByPath) return foundByPath;

  return APPROVED_BACKGROUNDS.HOME_STADIUM;
}
