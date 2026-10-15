/**
 * Rwanda eFootball League — Social Media & Event Publishing Types
 * Strict system adherence: no fake stats, no goalscorers, actual verified records.
 */

export type SocialEventCategory =
  | "COMPETITION_DRAWS"
  | "SEASON_ACTIVITIES"
  | "MATCHES_RESULTS"
  | "STANDINGS_STATS"
  | "ADMIN_ANNOUNCEMENTS";

export type ExtendedSocialPostType =
  // Competition Draws
  | "UCL_DRAW_ANNOUNCEMENT"
  | "EUROPA_DRAW_ANNOUNCEMENT"
  | "GROUP_STAGE_DRAW_ANNOUNCEMENT"
  | "CONFIRMED_GROUP_DRAW_RESULTS"
  | "PLAYOFF_DRAW_ANNOUNCEMENT"
  | "CONFIRMED_PLAYOFF_MATCHUPS"
  | "KNOCKOUT_DRAW_RESULTS"
  // Season Activities
  | "SEASON_ANNOUNCEMENT"
  | "REGISTRATION_OPEN"
  | "REGISTRATION_CLOSING"
  | "REGISTRATION_DEADLINE_REMINDER"
  | "SEASON_KICKOFF_ANNOUNCEMENT"
  | "DIVISION_ASSIGNMENTS"
  | "TEAM_SELECTION_REMINDER"
  | "PLAYER_CONFIRMATION_NOTICE"
  | "OFFICIAL_FIXTURE_RELEASE"
  | "SEASON_COMPLETION_ANNOUNCEMENT"
  | "CONFIRMED_CHAMPIONS"
  // Matches & Results
  | "MOTD_ANNOUNCEMENT"
  | "MOTD_RESULT"
  | "MOTW_ANNOUNCEMENT"
  | "MOTW_RESULT"
  | "MOTW_RIVALRY"
  | "DERBY_ANNOUNCEMENT"
  | "DERBY_RESULT"
  | "REGULAR_FIXTURE_RELEASE"
  | "MATCH_PREVIEW"
  | "CONFIRMED_FULL_TIME_RESULT"
  | "PLAYOFF_PREVIEW"
  | "PLAYOFF_RESULT"
  | "SUPER_CUP_ANNOUNCEMENT"
  | "SUPER_CUP_RESULT"
  | "UCL_FINAL_ANNOUNCEMENT"
  | "UCL_FINAL_RESULT"
  | "EUROPA_FINAL_ANNOUNCEMENT"
  | "EUROPA_FINAL_RESULT"
  | "TITLE_DECIDER_PREVIEW"
  | "TITLE_DECIDER_RESULT"
  // Standings & Statistics
  | "STANDINGS_UPDATE_D1"
  | "STANDINGS_UPDATE_D2"
  | "STANDINGS_UPDATE_D3"
  | "STANDINGS_UPDATE_UCL"
  | "STANDINGS_UPDATE_EUROPA"
  | "QUALIFICATION_TABLE_UPDATE"
  // Administrative Notices
  | "OFFICIAL_LEAGUE_NOTICE"
  | "MATCH_DEADLINE_CHANGE"
  | "SCHEDULE_CHANGE"
  | "COMPETITION_FORMAT_ANNOUNCEMENT"
  | "WEBSITE_FEATURE_ANNOUNCEMENT"
  | "HALL_OF_FAME_ANNOUNCEMENT"
  | "SEASON_ARCHIVE_ANNOUNCEMENT"
  | "SYSTEM_MAINTENANCE_NOTICE";

export type SocialPostStatus =
  | "DRAFT"
  | "PENDING_REVIEW"
  | "SCHEDULED"
  | "PUBLISHED"
  | "CANCELLED"
  | "FAILED"
  | "ARCHIVED";

export interface SocialGraphicData {
  category: SocialEventCategory;
  backgroundKey: string;
  badgeLabel?: string;
  badgeVariant?: "default" | "yellow" | "destructive" | "live" | "secondary";
  bannerTitle?: string;
  subtitle?: string;
  kickoffDate?: string;
  kickoffTime?: string;
  trophyAsset?: string;
  competitionLogo?: string;
  eventKey?: string;

  // Match & Final fields (NO goal scorers!)
  homeTeamName?: string;
  awayTeamName?: string;
  homeGamerTag?: string;
  awayGamerTag?: string;
  homeLogo?: string;
  awayLogo?: string;
  homeScore?: number | null;
  awayScore?: number | null;
  winnerGamerTag?: string;
  winnerTeamName?: string;
  isConfirmedResult?: boolean;

  // Group Draw Results (Real UclGroupSlot records)
  groups?: Array<{
    groupName: string;
    slots: Array<{
      gamerTag: string;
      realTeam?: string | null;
      avatar?: string | null;
      division?: string;
    }>;
  }>;

  // Standings Table (Real Standings records)
  standingsRows?: Array<{
    rank: number;
    gamerTag: string;
    realTeam?: string | null;
    played: number;
    won: number;
    drawn: number;
    lost: number;
    points: number;
    goalDifference: number;
    movement?: "UP" | "DOWN" | "SAME";
  }>;

  // Playoff & Knockout Matchups
  playoffMatchups?: Array<{
    round: string;
    stage: string;
    homeTag: string;
    awayTag: string;
    homeTeam?: string;
    awayTeam?: string;
    homeScore?: number | null;
    awayScore?: number | null;
    status: string;
  }>;

  // Administrative Announcements
  noticeTitle?: string;
  noticeDetails?: string[];
  effectiveDate?: string;
  deadlineDate?: string;
  urgency?: "NORMAL" | "HIGH" | "CRITICAL";

  // Workflow & Audit
  scheduledFor?: string | null;
  publishedBy?: string | null;
  errorMessage?: string | null;
}

export interface DetectedSystemEvent {
  id: string;
  eventKey: string;
  category: SocialEventCategory;
  type: ExtendedSocialPostType;
  title: string;
  description: string;
  defaultBackgroundKey: string;
  division?: string;
  season?: string;
  matchId?: string;
  isReadyForPublish: boolean;
  requiresReview: boolean;
  metadata: SocialGraphicData;
}

const METADATA_TAG = "<!--EFRL_META:";
const METADATA_END = "-->";

/**
 * Encodes structured SocialGraphicData into the caption string.
 * Keeps caption fully readable in ordinary text renderers.
 */
export function encodePostCaption(cleanCaption: string, data: SocialGraphicData): string {
  try {
    const json = JSON.stringify(data);
    const base64 = typeof Buffer !== "undefined"
      ? Buffer.from(json, "utf-8").toString("base64")
      : btoa(unescape(encodeURIComponent(json)));
    return `${cleanCaption.trim()}\n\n${METADATA_TAG}${base64}${METADATA_END}`;
  } catch (err) {
    console.error("[encodePostCaption] Serialization error:", err);
    return cleanCaption;
  }
}

/**
 * Extracts structured SocialGraphicData and clean user-facing caption.
 */
export function decodePostCaption(rawCaption: string): {
  cleanCaption: string;
  data: SocialGraphicData | null;
} {
  if (!rawCaption) return { cleanCaption: "", data: null };

  const startIdx = rawCaption.indexOf(METADATA_TAG);
  if (startIdx === -1) {
    return { cleanCaption: rawCaption, data: null };
  }

  const endIdx = rawCaption.indexOf(METADATA_END, startIdx);
  if (endIdx === -1) {
    return { cleanCaption: rawCaption, data: null };
  }

  const cleanCaption = rawCaption.substring(0, startIdx).trim();
  const base64Payload = rawCaption.substring(startIdx + METADATA_TAG.length, endIdx).trim();

  try {
    const json = typeof Buffer !== "undefined"
      ? Buffer.from(base64Payload, "base64").toString("utf-8")
      : decodeURIComponent(escape(atob(base64Payload)));
    const data = JSON.parse(json) as SocialGraphicData;
    return { cleanCaption, data };
  } catch (err) {
    console.warn("[decodePostCaption] Failed to decode metadata envelope:", err);
    return { cleanCaption, data: null };
  }
}
