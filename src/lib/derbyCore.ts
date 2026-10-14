import { ALL_REAL_TEAMS, findTeam, type RealFootballTeam } from "@/lib/teams";

export interface DerbyConfiguration {
  id: string;
  name: string;
  shortName: string;
  club1Id: string;
  club2Id: string;
  club1Name: string;
  club2Name: string;
  competition?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  isHistoricRivalry?: boolean;
  priority: number;
  isActive: boolean;
  autoPublishSocial?: boolean;
  autoPublishCarousel?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PlayerDerbyStats {
  matchesPlayed: number;
  wins: number;
  draws: number;
  defeats: number;
}

export interface ClubDerbyH2H {
  derby: DerbyConfiguration;
  totalMeetings: number;
  club1Wins: number;
  club2Wins: number;
  draws: number;
  latestMeeting: {
    matchId: string;
    date: Date;
    homeTeam: string;
    awayTeam: string;
    homeScore: number;
    awayScore: number;
    homeGamerTag: string;
    awayGamerTag: string;
    season: string;
    division: string;
  } | null;
  historicalMatches: Array<{
    id: string;
    date: Date;
    season: string;
    division: string;
    round: string;
    homeClub: string;
    awayClub: string;
    homeGamerTag: string;
    awayGamerTag: string;
    homeScore: number;
    awayScore: number;
    status: string;
  }>;
  seasonResults: Record<string, { club1Wins: number; club2Wins: number; draws: number; total: number }>;
}

export const INITIAL_OFFICIAL_DERBIES: Omit<DerbyConfiguration, "id" | "createdAt" | "updatedAt">[] = [
  // A. English football
  {
    name: "Manchester Derby",
    shortName: "Manchester Derby",
    club1Id: "manchester-united",
    club2Id: "manchester-city",
    club1Name: "Manchester United",
    club2Name: "Manchester City",
    competition: "Premier League",
    description: "The iconic clash for Manchester supremacy between the Red Devils and the Citizens.",
    imageUrl: "/images/motw-stadium-bg.jpg",
    isHistoricRivalry: false,
    priority: 15,
    isActive: true,
    autoPublishSocial: true,
    autoPublishCarousel: true,
  },
  {
    name: "North London Derby",
    shortName: "North London Derby",
    club1Id: "arsenal",
    club2Id: "tottenham-hotspur",
    club1Name: "Arsenal FC",
    club2Name: "Tottenham Hotspur",
    competition: "Premier League",
    description: "The fierce local North London battle between Arsenal and Tottenham Hotspur.",
    imageUrl: "/images/motw-stadium-bg.jpg",
    isHistoricRivalry: false,
    priority: 14,
    isActive: true,
    autoPublishSocial: true,
    autoPublishCarousel: true,
  },
  {
    name: "Merseyside Derby",
    shortName: "Merseyside Derby",
    club1Id: "liverpool",
    club2Id: "everton",
    club1Name: "Liverpool FC",
    club2Name: "Everton FC",
    competition: "Premier League",
    description: "The historic Merseyside rivalry across Stanley Park between Liverpool and Everton.",
    imageUrl: "/images/motw-stadium-bg.jpg",
    isHistoricRivalry: false,
    priority: 12,
    isActive: true,
    autoPublishSocial: true,
    autoPublishCarousel: true,
  },
  {
    name: "West London Derby",
    shortName: "West London Derby",
    club1Id: "chelsea",
    club2Id: "fulham",
    club1Name: "Chelsea FC",
    club2Name: "Fulham FC",
    competition: "Premier League",
    description: "The neighborhood derby of West London between Chelsea and Fulham.",
    imageUrl: "/images/motw-stadium-bg.jpg",
    isHistoricRivalry: false,
    priority: 10,
    isActive: true,
    autoPublishSocial: true,
    autoPublishCarousel: true,
  },
  {
    name: "Tyne–Wear Derby",
    shortName: "Tyne–Wear Derby",
    club1Id: "newcastle-united",
    club2Id: "sunderland",
    club1Name: "Newcastle United",
    club2Name: "Sunderland AFC",
    competition: "Premier League",
    description: "The northeast passion clash between Newcastle United and Sunderland.",
    imageUrl: "/images/motw-stadium-bg.jpg",
    isHistoricRivalry: false,
    priority: 10,
    isActive: false, // Inactive initially as Sunderland is not currently in the league
    autoPublishSocial: false,
    autoPublishCarousel: false,
  },
  {
    name: "North West Derby",
    shortName: "North West Derby",
    club1Id: "manchester-united",
    club2Id: "liverpool",
    club1Name: "Manchester United",
    club2Name: "Liverpool FC",
    competition: "Premier League",
    description: "The historic battle between England's two most decorated clubs. Classified as a historic rivalry, not a local derby.",
    imageUrl: "/images/motw-stadium-bg.jpg",
    isHistoricRivalry: true, // Classified as a historic rivalry, not a local derby
    priority: 18,
    isActive: true,
    autoPublishSocial: true,
    autoPublishCarousel: true,
  },
  {
    name: "South Coast Rivalry",
    shortName: "South Coast Rivalry",
    club1Id: "brighton",
    club2Id: "crystal-palace",
    club1Name: "Brighton & Hove Albion",
    club2Name: "Crystal Palace FC",
    competition: "Premier League",
    description: "The M23 rivalry contested between Brighton & Hove Albion and Crystal Palace.",
    imageUrl: "/images/motw-stadium-bg.jpg",
    isHistoricRivalry: false,
    priority: 10,
    isActive: true,
    autoPublishSocial: true,
    autoPublishCarousel: true,
  },

  // B. Spanish football
  {
    name: "El Clásico",
    shortName: "El Clásico",
    club1Id: "real-madrid",
    club2Id: "fc-barcelona",
    club1Name: "Real Madrid",
    club2Name: "FC Barcelona",
    competition: "La Liga",
    description: "The pinnacle of football rivalries: Real Madrid vs FC Barcelona in an epic contest of pride, prestige, and glory.",
    imageUrl: "/images/motw-stadium-bg.jpg",
    isHistoricRivalry: false,
    priority: 20,
    isActive: true,
    autoPublishSocial: true,
    autoPublishCarousel: true,
  },
  {
    name: "Madrid Derby — El Derbi Madrileño",
    shortName: "Madrid Derby",
    club1Id: "real-madrid",
    club2Id: "atletico-madrid",
    club1Name: "Real Madrid",
    club2Name: "Atlético Madrid",
    competition: "La Liga",
    description: "The battle for supremacy in the Spanish capital between Real Madrid and Atlético Madrid.",
    imageUrl: "/images/motw-stadium-bg.jpg",
    isHistoricRivalry: false,
    priority: 16,
    isActive: true,
    autoPublishSocial: true,
    autoPublishCarousel: true,
  },
  {
    name: "El Gran Derbi — Seville Derby",
    shortName: "El Gran Derbi",
    club1Id: "sevilla",
    club2Id: "real-betis",
    club1Name: "Sevilla FC",
    club2Name: "Real Betis",
    competition: "La Liga",
    description: "The searing passion of Andalusia as Sevilla FC and Real Betis lock horns in Seville.",
    imageUrl: "/images/motw-stadium-bg.jpg",
    isHistoricRivalry: false,
    priority: 13,
    isActive: true,
    autoPublishSocial: true,
    autoPublishCarousel: true,
  },
  {
    name: "Barcelona Derby — Derbi Barceloní",
    shortName: "Barcelona Derby",
    club1Id: "fc-barcelona",
    club2Id: "espanyol",
    club1Name: "FC Barcelona",
    club2Name: "RCD Espanyol",
    competition: "La Liga",
    description: "The local rivalry of Catalonia between FC Barcelona and RCD Espanyol.",
    imageUrl: "/images/motw-stadium-bg.jpg",
    isHistoricRivalry: false,
    priority: 11,
    isActive: true,
    autoPublishSocial: true,
    autoPublishCarousel: true,
  },
  {
    name: "Basque Derby — Derbi Vasco",
    shortName: "Basque Derby",
    club1Id: "athletic-club",
    club2Id: "real-sociedad",
    club1Name: "Athletic Club",
    club2Name: "Real Sociedad",
    competition: "La Liga",
    description: "The celebrated cultural Basque derby between Athletic Club Bilbao and Real Sociedad.",
    imageUrl: "/images/motw-stadium-bg.jpg",
    isHistoricRivalry: false,
    priority: 12,
    isActive: true,
    autoPublishSocial: true,
    autoPublishCarousel: true,
  },
  {
    name: "Valencian Derby",
    shortName: "Valencian Derby",
    club1Id: "valencia",
    club2Id: "levante",
    club1Name: "Valencia CF",
    club2Name: "Levante UD",
    competition: "La Liga",
    description: "The regional battle of the Valencian Community between Valencia CF and Levante UD.",
    imageUrl: "/images/motw-stadium-bg.jpg",
    isHistoricRivalry: false,
    priority: 9,
    isActive: false, // Inactive initially as Levante is not in current league
    autoPublishSocial: false,
    autoPublishCarousel: false,
  },
  {
    name: "Galician Derby",
    shortName: "Galician Derby",
    club1Id: "celta-vigo",
    club2Id: "deportivo-la-coruna",
    club1Name: "RC Celta de Vigo",
    club2Name: "Deportivo La Coruña",
    competition: "La Liga",
    description: "The proud Galician duel between Celta Vigo and Deportivo La Coruña.",
    imageUrl: "/images/motw-stadium-bg.jpg",
    isHistoricRivalry: false,
    priority: 9,
    isActive: false, // Inactive initially as Deportivo La Coruña is not in current league
    autoPublishSocial: false,
    autoPublishCarousel: false,
  },

  // C. Italian football
  {
    name: "Derby della Madonnina",
    shortName: "Derby della Madonnina",
    club1Id: "inter",
    club2Id: "ac-milan",
    club1Name: "Inter Milan",
    club2Name: "AC Milan",
    competition: "Serie A",
    description: "The world-renowned Milan derby between Inter Milan and AC Milan beneath the golden Madonnina statue.",
    imageUrl: "/images/motw-stadium-bg.jpg",
    isHistoricRivalry: false,
    priority: 18,
    isActive: true,
    autoPublishSocial: true,
    autoPublishCarousel: true,
  },
  {
    name: "Derby della Capitale",
    shortName: "Derby della Capitale",
    club1Id: "as-roma",
    club2Id: "lazio",
    club1Name: "AS Roma",
    club2Name: "SS Lazio",
    competition: "Serie A",
    description: "The fever-pitch battle of Rome between AS Roma and SS Lazio for the Eternal City.",
    imageUrl: "/images/motw-stadium-bg.jpg",
    isHistoricRivalry: false,
    priority: 16,
    isActive: true,
    autoPublishSocial: true,
    autoPublishCarousel: true,
  },
  {
    name: "Derby della Mole",
    shortName: "Derby della Mole",
    club1Id: "juventus",
    club2Id: "torino",
    club1Name: "Juventus FC",
    club2Name: "Torino FC",
    competition: "Serie A",
    description: "The historic Turin city derby between Juventus and Torino FC.",
    imageUrl: "/images/motw-stadium-bg.jpg",
    isHistoricRivalry: false,
    priority: 12,
    isActive: true,
    autoPublishSocial: true,
    autoPublishCarousel: true,
  },
  {
    name: "Derby d'Italia",
    shortName: "Derby d'Italia",
    club1Id: "inter",
    club2Id: "juventus",
    club1Name: "Inter Milan",
    club2Name: "Juventus FC",
    competition: "Serie A",
    description: "The marquee historic rivalry in Italian football between Inter Milan and Juventus.",
    imageUrl: "/images/motw-stadium-bg.jpg",
    isHistoricRivalry: true, // Classified as a historic rivalry, not a local derby
    priority: 16,
    isActive: true,
    autoPublishSocial: true,
    autoPublishCarousel: true,
  },
  {
    name: "Derby della Lanterna",
    shortName: "Derby della Lanterna",
    club1Id: "genoa",
    club2Id: "sampdoria",
    club1Name: "Genoa CFC",
    club2Name: "UC Sampdoria",
    competition: "Serie A",
    description: "The harbor city rivalry of Genoa between Genoa CFC and UC Sampdoria.",
    imageUrl: "/images/motw-stadium-bg.jpg",
    isHistoricRivalry: false,
    priority: 10,
    isActive: true,
    autoPublishSocial: true,
    autoPublishCarousel: true,
  },
  {
    name: "Derby del Sole",
    shortName: "Derby del Sole",
    club1Id: "napoli",
    club2Id: "as-roma",
    club1Name: "SSC Napoli",
    club2Name: "AS Roma",
    competition: "Serie A",
    description: "The Derby of the Sun uniting the grand footballing passion of Naples and Rome.",
    imageUrl: "/images/motw-stadium-bg.jpg",
    isHistoricRivalry: false,
    priority: 12,
    isActive: true,
    autoPublishSocial: true,
    autoPublishCarousel: true,
  },
];

/**
 * Resolves a canonical club identifier (e.g., 'manchester-united') from team ID, team name, or short name.
 */
export function resolveCanonicalClubId(clubOrTeamInput?: string | null): string | null {
  if (!clubOrTeamInput) return null;
  const trimmed = clubOrTeamInput.trim();
  if (!trimmed) return null;

  const lower = trimmed.toLowerCase();

  const ALIAS_MAP: Record<string, string> = {
    "man utd": "manchester-united",
    "man united": "manchester-united",
    "man city": "manchester-city",
    newcastle: "newcastle-united",
    spurs: "tottenham-hotspur",
    tottenham: "tottenham-hotspur",
    barcelona: "fc-barcelona",
    barca: "fc-barcelona",
    barça: "fc-barcelona",
    atletico: "atletico-madrid",
    "atlético": "atletico-madrid",
    "atletico madrid": "atletico-madrid",
    "atlético madrid": "atletico-madrid",
    atleti: "atletico-madrid",
    "real madrid": "real-madrid",
    "athletic bilbao": "athletic-club",
    "athletic club": "athletic-club",
    bilbao: "athletic-club",
    "real sociedad": "real-sociedad",
    sociedad: "real-sociedad",
    betis: "real-betis",
    "real betis": "real-betis",
    celta: "celta-vigo",
    "celta vigo": "celta-vigo",
    palace: "crystal-palace",
    "crystal palace": "crystal-palace",
    brighton: "brighton",
    "inter milan": "inter",
    inter: "inter",
    "ac milan": "ac-milan",
    milan: "ac-milan",
    juve: "juventus",
    juventus: "juventus",
    "as roma": "as-roma",
    roma: "as-roma",
    lazio: "lazio",
    napoli: "napoli",
    torino: "torino",
    genoa: "genoa",
    sampdoria: "sampdoria",
  };

  if (ALIAS_MAP[lower]) {
    return ALIAS_MAP[lower];
  }

  const found = findTeam(trimmed);
  if (found) {
    return found.id.toLowerCase();
  }

  // Fallback: slugify input
  return trimmed
    .toLowerCase()
    .replace(/\s+fc$|\s+cf$|\s+afc$|\s+sc$/gi, "")
    .trim()
    .replace(/[^a-z0-9]+/g, "-");
}

/**
 * Resolves full display team from a club ID or team name.
 */
export function resolveClubTeam(clubIdOrName?: string | null): RealFootballTeam | undefined {
  if (!clubIdOrName) return undefined;
  return findTeam(clubIdOrName);
}

/**
 * Checks if both participating clubs are available/registered in the league.
 */
export function areBothClubsAvailableInLeague(club1Id: string, club2Id: string): boolean {
  const c1 = resolveCanonicalClubId(club1Id);
  const c2 = resolveCanonicalClubId(club2Id);
  if (!c1 || !c2) return false;

  const team1Exists = ALL_REAL_TEAMS.some((t) => t.id.toLowerCase() === c1);
  const team2Exists = ALL_REAL_TEAMS.some((t) => t.id.toLowerCase() === c2);

  return team1Exists && team2Exists;
}

export type DerbyLike = DerbyConfiguration | Omit<DerbyConfiguration, "id" | "createdAt" | "updatedAt">;

/**
 * Core automatic derby detection engine.
 * Matches canonical club identities regardless of home-away arrangement.
 * Selects exact match based on configured priority.
 * Returns null if no match found.
 */
export function detectDerby<T extends DerbyLike = DerbyConfiguration>(
  homeClubOrPlayer: string | { realTeam?: string | null } | null | undefined,
  awayClubOrPlayer: string | { realTeam?: string | null } | null | undefined,
  activeDerbiesList?: T[]
): T | null {
  const homeStr = typeof homeClubOrPlayer === "string" ? homeClubOrPlayer : homeClubOrPlayer?.realTeam;
  const awayStr = typeof awayClubOrPlayer === "string" ? awayClubOrPlayer : awayClubOrPlayer?.realTeam;

  if (!homeStr || !awayStr) return null;

  const homeCanonical = resolveCanonicalClubId(homeStr);
  const awayCanonical = resolveCanonicalClubId(awayStr);

  if (!homeCanonical || !awayCanonical) return null;
  if (homeCanonical === awayCanonical) return null;

  const candidateDerbies: T[] = activeDerbiesList && activeDerbiesList.length > 0
    ? activeDerbiesList
    : (INITIAL_OFFICIAL_DERBIES.map((d, i) => ({
        ...d,
        id: `seed-${i + 1}`,
      })) as unknown as T[]);

  // Find all matching derbies bidirectionally
  const matches = candidateDerbies.filter((derby) => {
    if (!derby.isActive) return false;

    const d1 = resolveCanonicalClubId(derby.club1Id);
    const d2 = resolveCanonicalClubId(derby.club2Id);

    if (!d1 || !d2) return false;

    // Home-Away or Away-Home arrangement
    const isDirectMatch = d1 === homeCanonical && d2 === awayCanonical;
    const isReverseMatch = d1 === awayCanonical && d2 === homeCanonical;

    return isDirectMatch || isReverseMatch;
  });

  if (matches.length === 0) return null;

  // Overlap resolution: Sort by priority desc, then name asc
  matches.sort((a, b) => {
    if (b.priority !== a.priority) {
      return b.priority - a.priority;
    }
    return a.name.localeCompare(b.name);
  });

  return matches[0];
}
