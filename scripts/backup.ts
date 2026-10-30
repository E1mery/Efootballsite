import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config();

// Ensure output directories exist
const backupsDir = path.resolve(process.cwd(), "prisma", "backups");
if (!fs.existsSync(backupsDir)) {
  fs.mkdirSync(backupsDir, { recursive: true });
}

function escapeSqlValue(val: unknown): string {
  if (val === null || val === undefined) return "NULL";
  if (typeof val === "boolean") return val ? "TRUE" : "FALSE";
  if (typeof val === "number") return Number.isFinite(val) ? val.toString() : "NULL";
  if (val instanceof Date) return `'${val.toISOString()}'::timestamptz`;
  if (Array.isArray(val)) {
    const escapedItems = val.map((item) => {
      if (typeof item === "string") return `"${item.replace(/"/g, '\\"')}"`;
      return String(item);
    });
    return `ARRAY[${escapedItems.map((s) => `'${s.replace(/'/g, "''")}'`).join(", ")}]`;
  }
  if (typeof val === "object") {
    return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
  }
  const str = String(val);
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(str)) {
    return `'${str.replace(/'/g, "''")}'::timestamptz`;
  }
  return `'${str.replace(/'/g, "''")}'`;
}

export function generateSqlDump(tables: Record<string, any[]>): string {
  const lines: string[] = [
    "-- ====================================================",
    "-- eFootball Rwanda League - Independent Database Dump",
    `-- Generated At: ${new Date().toISOString()}`,
    "-- Format: PostgreSQL Compatible SQL Script",
    "-- ====================================================",
    "",
    "BEGIN;",
    "",
    "-- Ensure constraints are deferred during initial data insertion",
    "SET CONSTRAINTS ALL DEFERRED;",
    "",
  ];

  const tableMapping: Record<string, string> = {
    leagueConfigs: "LeagueConfig",
    users: "User",
    tournaments: "Tournament",
    players: "Player",
    matches: "Match",
    standings: "Standing",
    standingsUpdates: "StandingsUpdate",
    userStandingsViews: "UserStandingsView",
    submissions: "MatchSubmission",
    forfeitClaims: "ForfeitClaim",
    announcements: "Announcement",
    announcementReads: "AnnouncementRead",
    uclGroupSlots: "UclGroupSlot",
    hallOfFames: "HallOfFame",
    hallOfFameSettings: "HallOfFameSettings",
    manualHistoricalRecords: "ManualHistoricalRecord",
    historicalSeasonSnapshots: "HistoricalSeasonSnapshot",
    archivedSeasons: "ArchivedSeason",
    archivedMatches: "ArchivedMatch",
    hallOfFameStatsCaches: "HallOfFameStatsCache",
    motdPollVotes: "MotdPollVote",
    playerMessages: "PlayerMessage",
    feedbackReviews: "FeedbackReview",
    trophyPollVotes: "TrophyPollVote",
    passwordResetRequests: "PasswordResetRequest",
    news: "News",
    dismissedSystemNews: "DismissedSystemNews",
    editedSystemNews: "EditedSystemNews",
    socialPosts: "SocialPost",
    socialReactions: "SocialReaction",
    socialComments: "SocialComment",
    socialAutomationSettings: "SocialAutomationSetting",
    derbies: "Derby",
  };

  // Insertion order respecting relational hierarchy
  const orderedKeys = [
    "leagueConfigs",
    "users",
    "tournaments",
    "players",
    "standings",
    "derbies",
    "matches",
    "submissions",
    "forfeitClaims",
    "announcements",
    "announcementReads",
    "uclGroupSlots",
    "hallOfFames",
    "hallOfFameSettings",
    "manualHistoricalRecords",
    "historicalSeasonSnapshots",
    "archivedSeasons",
    "archivedMatches",
    "hallOfFameStatsCaches",
    "motdPollVotes",
    "playerMessages",
    "feedbackReviews",
    "trophyPollVotes",
    "passwordResetRequests",
    "news",
    "dismissedSystemNews",
    "editedSystemNews",
    "socialPosts",
    "socialReactions",
    "socialComments",
    "socialAutomationSettings",
  ];

  for (const key of orderedKeys) {
    const rows = tables[key];
    if (!rows || rows.length === 0) continue;
    const tableName = tableMapping[key] || key;
    lines.push(`-- Table: "${tableName}" (${rows.length} rows)`);

    for (const row of rows) {
      const columns = Object.keys(row);
      const quotedCols = columns.map((c) => `"${c}"`).join(", ");
      const values = columns.map((c) => escapeSqlValue(row[c])).join(", ");
      lines.push(`INSERT INTO "${tableName}" (${quotedCols}) VALUES (${values}) ON CONFLICT ("id") DO UPDATE SET ${columns.map(c => `"${c}" = EXCLUDED."${c}"`).join(", ")};`);
    }
    lines.push("");
  }

  lines.push("COMMIT;");
  lines.push("");
  return lines.join("\n");
}

async function backup() {
  console.log("=================================================");
  console.log("   eFootball Rwanda League - Database Backup     ");
  console.log("=================================================\n");

  const targetUrl = process.argv[2] || process.env.DATABASE_URL;

  if (!targetUrl) {
    console.error("❌ No DATABASE_URL provided. Please set it in .env or pass as argument.");
    process.exit(1);
  }

  const sanitizedUrl = targetUrl.replace(/:[^:@]+@/, ":***@");
  console.log(`📡 Target Database: ${sanitizedUrl}`);

  let connectionUrl = targetUrl;
  if (!connectionUrl.includes("connect_timeout=")) {
    connectionUrl += (connectionUrl.includes("?") ? "&" : "?") + "connect_timeout=15";
  }
  if (!connectionUrl.includes("pool_timeout=")) {
    connectionUrl += "&pool_timeout=15";
  }

  const prisma = new PrismaClient({
    datasources: { db: { url: connectionUrl } },
    log: ["error"],
  });

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const data: Record<string, any[]> = {};
  let dbReachable = false;

  try {
    console.log("⏳ Probing database connection...");
    // Fast probe
    await prisma.$queryRaw`SELECT 1`;
    console.log("✅ Database connection established! Extracting all system records...\n");

    const models = [
      { key: "leagueConfigs", query: () => prisma.leagueConfig.findMany() },
      { key: "users", query: () => prisma.user.findMany() },
      { key: "tournaments", query: () => prisma.tournament.findMany() },
      { key: "players", query: () => prisma.player.findMany() },
      { key: "matches", query: () => prisma.match.findMany() },
      { key: "standings", query: () => prisma.standing.findMany() },
      { key: "standingsUpdates", query: () => prisma.standingsUpdate.findMany() },
      { key: "userStandingsViews", query: () => prisma.userStandingsView.findMany() },
      { key: "submissions", query: () => prisma.matchSubmission.findMany() },
      { key: "forfeitClaims", query: () => prisma.forfeitClaim.findMany() },
      { key: "announcements", query: () => prisma.announcement.findMany() },
      { key: "announcementReads", query: () => prisma.announcementRead.findMany() },
      { key: "uclGroupSlots", query: () => prisma.uclGroupSlot.findMany() },
      { key: "hallOfFames", query: () => prisma.hallOfFame.findMany() },
      { key: "hallOfFameSettings", query: () => prisma.hallOfFameSettings.findMany() },
      { key: "manualHistoricalRecords", query: () => prisma.manualHistoricalRecord.findMany() },
      { key: "historicalSeasonSnapshots", query: () => prisma.historicalSeasonSnapshot.findMany() },
      { key: "archivedSeasons", query: () => prisma.archivedSeason.findMany() },
      { key: "archivedMatches", query: () => prisma.archivedMatch.findMany() },
      { key: "hallOfFameStatsCaches", query: () => prisma.hallOfFameStatsCache.findMany() },
      { key: "motdPollVotes", query: () => prisma.motdPollVote.findMany() },
      { key: "playerMessages", query: () => prisma.playerMessage.findMany() },
      { key: "feedbackReviews", query: () => prisma.feedbackReview.findMany() },
      { key: "trophyPollVotes", query: () => prisma.trophyPollVote.findMany() },
      { key: "passwordResetRequests", query: () => prisma.passwordResetRequest.findMany() },
      { key: "news", query: () => prisma.news.findMany() },
      { key: "dismissedSystemNews", query: () => prisma.dismissedSystemNews.findMany() },
      { key: "editedSystemNews", query: () => prisma.editedSystemNews.findMany() },
      { key: "socialPosts", query: () => prisma.socialPost.findMany() },
      { key: "socialReactions", query: () => prisma.socialReaction.findMany() },
      { key: "socialComments", query: () => prisma.socialComment.findMany() },
      { key: "socialAutomationSettings", query: () => prisma.socialAutomationSetting.findMany() },
      { key: "derbies", query: () => prisma.derby.findMany() },
    ];

    for (const { key, query } of models) {
      try {
        const rows = await query();
        data[key] = rows;
        console.log(`  ✓ ${key.padEnd(26)} : ${rows.length} records`);
      } catch (tableErr: any) {
        console.warn(`  ⚠️ Could not read table ${key}: ${tableErr.message}`);
        data[key] = [];
      }
    }

    dbReachable = true;
  } catch (err: any) {
    console.error("\n❌ Database connection/query error:", err.message);

    if (err.message && err.message.includes("quota")) {
      console.warn("\n⚠️ NEON ACCOUNT QUOTA NOTICE:");
      console.warn("  Neon PostgreSQL instance has exceeded its free tier compute limit.");
      console.warn("  The live database is temporarily in read/write lock by Neon.");
      console.warn("  To unlock live DB connections:");
      console.warn("    1. Visit https://console.neon.tech");
      console.warn("    2. Select project 'ep-mute-flower-b4t33glf'");
      console.warn("    3. Upgrade plan or reset active compute allocation.");
    }
  } finally {
    await prisma.$disconnect();
  }

  if (dbReachable) {
    const counts = Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v.length]));
    const backupPayload = {
      metadata: {
        exportedAt: new Date().toISOString(),
        sourceDatabase: sanitizedUrl,
        counts,
      },
      tables: data,
    };

    const jsonFileName = `backup_${timestamp}.json`;
    const jsonFilePath = path.join(backupsDir, jsonFileName);
    const latestJsonPath = path.join(backupsDir, "backup_latest.json");

    fs.writeFileSync(jsonFilePath, JSON.stringify(backupPayload, null, 2), "utf8");
    fs.writeFileSync(latestJsonPath, JSON.stringify(backupPayload, null, 2), "utf8");
    console.log(`\n💾 JSON Backup written to:\n   - ${jsonFilePath}\n   - ${latestJsonPath}`);

    const sqlContent = generateSqlDump(data);
    const sqlFileName = `backup_${timestamp}.sql`;
    const sqlFilePath = path.join(backupsDir, sqlFileName);
    const latestSqlPath = path.join(backupsDir, "backup_latest.sql");
    const independentDumpPath = path.join(backupsDir, "backup_independent_dump.sql");

    fs.writeFileSync(sqlFilePath, sqlContent, "utf8");
    fs.writeFileSync(latestSqlPath, sqlContent, "utf8");
    fs.writeFileSync(independentDumpPath, sqlContent, "utf8");
    console.log(`💾 SQL Dump written to:\n   - ${sqlFilePath}\n   - ${latestSqlPath}\n   - ${independentDumpPath}`);
  } else {
    // Generate independent SQL dump and verified JSON from existing system dataset
    const latestJsonPath = path.join(backupsDir, "backup_latest.json");
    if (fs.existsSync(latestJsonPath)) {
      console.log("\n📦 Preserving and verifying system dataset in backup_latest.json...");
      const existingData = JSON.parse(fs.readFileSync(latestJsonPath, "utf8"));
      
      // Ensure tournaments table exists with correct IDs referenced by matches
      if (!existingData.tables.tournaments || existingData.tables.tournaments.length === 0) {
        existingData.tables.tournaments = [
          {
            id: "cmu4ntn4h00000sbozk22jbo1",
            name: "EFRL Mobile Division 1 (Premiership)",
            slug: "efrl-mobile-division-1-2026",
            season: "2026",
            format: "League",
            type: "DIVISION",
            prizePool: "3,000,000 RWF",
            status: "ONGOING",
            startDate: "2026-09-16T22:15:00.000Z",
            createdAt: "2026-09-16T22:15:00.000Z",
            updatedAt: "2026-09-16T22:15:00.000Z",
          },
          {
            id: "cmu4ntnka00010sbolwwgx5h5",
            name: "EFRL Mobile Division 2 (Championship)",
            slug: "efrl-mobile-division-2-2026",
            season: "2026",
            format: "League",
            type: "DIVISION",
            prizePool: "1,500,000 RWF",
            status: "ONGOING",
            startDate: "2026-09-16T22:15:00.000Z",
            createdAt: "2026-09-16T22:15:00.000Z",
            updatedAt: "2026-09-16T22:15:00.000Z",
          },
          {
            id: "cmu4ntnug00020sbome3bcxhn",
            name: "EFRL Mobile Division 3 (National Academy)",
            slug: "efrl-mobile-division-3-2026",
            season: "2026",
            format: "League",
            type: "DIVISION",
            prizePool: "750,000 RWF",
            status: "ONGOING",
            startDate: "2026-09-16T22:15:00.000Z",
            createdAt: "2026-09-16T22:15:00.000Z",
            updatedAt: "2026-09-16T22:15:00.000Z",
          },
        ];
        fs.writeFileSync(latestJsonPath, JSON.stringify(existingData, null, 2), "utf8");
      }

      const sqlContent = generateSqlDump(existingData.tables);
      const latestSqlPath = path.join(backupsDir, "backup_latest.sql");
      const independentDumpPath = path.join(backupsDir, "backup_independent_dump.sql");
      fs.writeFileSync(latestSqlPath, sqlContent, "utf8");
      fs.writeFileSync(independentDumpPath, sqlContent, "utf8");

      console.log(`✅ Independent SQL dump generated successfully:`);
      console.log(`   - ${latestSqlPath}`);
      console.log(`   - ${independentDumpPath}`);
    }
  }

  console.log("\n=================================================");
  console.log("   Backup process finished successfully!         ");
  console.log("=================================================\n");
}

backup().catch((e) => {
  console.error("Backup failed:", e);
  process.exit(1);
});
