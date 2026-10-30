const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");

const backupPath = path.resolve(__dirname, "..", "prisma", "backups", "backup_latest.json");
if (!fs.existsSync(backupPath)) {
  console.error("❌ Backup file not found:", backupPath);
  process.exit(1);
}

const backupData = JSON.parse(fs.readFileSync(backupPath, "utf8"));
const tables = backupData.tables || {};

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "file:./dev.db",
    },
  },
});

function formatSqlValue(val) {
  if (val === null || val === undefined) return "NULL";
  if (typeof val === "boolean") return val ? "1" : "0";
  if (typeof val === "number") return val.toString();
  if (Array.isArray(val)) {
    return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
  }
  if (typeof val === "object") {
    return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
  }
  const str = String(val);
  return `'${str.replace(/'/g, "''")}'`;
}

function generateD1Insert(tableName, record) {
  const keys = Object.keys(record);
  const values = keys.map((k) => formatSqlValue(record[k]));
  return `INSERT OR REPLACE INTO "${tableName}" (${keys.map((k) => `"${k}"`).join(", ")}) VALUES (${values.join(", ")});`;
}

async function migrate() {
  console.log("=================================================");
  console.log("   EFRL Cloudflare D1 Migration & Verification   ");
  console.log("=================================================\n");

  const d1SqlLines = [
    "-- ====================================================",
    "-- eFootball Rwanda League - Cloudflare D1 Seed Script",
    `-- Generated At: ${new Date().toISOString()}`,
    "-- Format: SQLite / Cloudflare D1 Compatible",
    "-- ====================================================",
    "",
    "PRAGMA foreign_keys = OFF;",
    "",
  ];

  const summary = {};

  // 1. LeagueConfig
  if (tables.leagueConfigs?.length) {
    console.log(`▶ Migrating ${tables.leagueConfigs.length} LeagueConfig records...`);
    for (const item of tables.leagueConfigs) {
      await prisma.leagueConfig.upsert({ where: { id: item.id }, update: item, create: item });
      d1SqlLines.push(generateD1Insert("LeagueConfig", item));
    }
    summary.leagueConfigs = await prisma.leagueConfig.count();
  }

  // 2. Users
  if (tables.users?.length) {
    console.log(`▶ Migrating ${tables.users.length} User records...`);
    for (const item of tables.users) {
      await prisma.user.upsert({ where: { id: item.id }, update: item, create: item });
      d1SqlLines.push(generateD1Insert("User", item));
    }
    summary.users = await prisma.user.count();
  }

  // 3. Tournaments
  if (tables.tournaments?.length) {
    console.log(`▶ Migrating ${tables.tournaments.length} Tournament records...`);
    for (const item of tables.tournaments) {
      await prisma.tournament.upsert({ where: { id: item.id }, update: item, create: item });
      d1SqlLines.push(generateD1Insert("Tournament", item));
    }
    summary.tournaments = await prisma.tournament.count();
  }

  // 4. Players
  if (tables.players?.length) {
    console.log(`▶ Migrating ${tables.players.length} Player records...`);
    for (const item of tables.players) {
      await prisma.player.upsert({ where: { id: item.id }, update: item, create: item });
      d1SqlLines.push(generateD1Insert("Player", item));
    }
    summary.players = await prisma.player.count();
  }

  // 5. Matches
  if (tables.matches?.length) {
    console.log(`▶ Migrating ${tables.matches.length} Match records...`);
    for (const item of tables.matches) {
      const sanitized = { ...item };
      if (sanitized.matchDate) sanitized.matchDate = new Date(sanitized.matchDate);
      if (sanitized.deadlineDate) sanitized.deadlineDate = new Date(sanitized.deadlineDate);
      if (sanitized.extendedDeadlineDate) sanitized.extendedDeadlineDate = new Date(sanitized.extendedDeadlineDate);
      await prisma.match.upsert({ where: { id: item.id }, update: sanitized, create: sanitized });
      d1SqlLines.push(generateD1Insert("Match", item));
    }
    summary.matches = await prisma.match.count();
  }

  // 6. Standings
  if (tables.standings?.length) {
    console.log(`▶ Migrating ${tables.standings.length} Standing records...`);
    for (const item of tables.standings) {
      await prisma.standing.upsert({ where: { id: item.id }, update: item, create: item });
      d1SqlLines.push(generateD1Insert("Standing", item));
    }
    summary.standings = await prisma.standing.count();
  }

  // 7. MatchSubmissions
  if (tables.submissions?.length) {
    console.log(`▶ Migrating ${tables.submissions.length} MatchSubmission records...`);
    for (const item of tables.submissions) {
      await prisma.matchSubmission.upsert({ where: { id: item.id }, update: item, create: item });
      d1SqlLines.push(generateD1Insert("MatchSubmission", item));
    }
    summary.submissions = await prisma.matchSubmission.count();
  }

  // 8. Announcements
  if (tables.announcements?.length) {
    console.log(`▶ Migrating ${tables.announcements.length} Announcement records...`);
    for (const item of tables.announcements) {
      await prisma.announcement.upsert({ where: { id: item.id }, update: item, create: item });
      d1SqlLines.push(generateD1Insert("Announcement", item));
    }
    summary.announcements = await prisma.announcement.count();
  }

  // 9. AnnouncementReads
  if (tables.announcementReads?.length) {
    console.log(`▶ Migrating ${tables.announcementReads.length} AnnouncementRead records...`);
    for (const item of tables.announcementReads) {
      await prisma.announcementRead.upsert({ where: { id: item.id }, update: item, create: item });
      d1SqlLines.push(generateD1Insert("AnnouncementRead", item));
    }
    summary.announcementReads = await prisma.announcementRead.count();
  }

  // 10. Derbies (if any)
  if (tables.derbies?.length) {
    console.log(`▶ Migrating ${tables.derbies.length} Derby records...`);
    for (const item of tables.derbies) {
      await prisma.derby.upsert({ where: { id: item.id }, update: item, create: item });
      d1SqlLines.push(generateD1Insert("Derby", item));
    }
    summary.derbies = await prisma.derby.count();
  }

  // 11. SocialPosts (if any)
  if (tables.socialPosts?.length) {
    console.log(`▶ Migrating ${tables.socialPosts.length} SocialPost records...`);
    for (const item of tables.socialPosts) {
      const sanitized = { ...item };
      if (Array.isArray(sanitized.hashtags)) {
        sanitized.hashtags = JSON.stringify(sanitized.hashtags);
      }
      await prisma.socialPost.upsert({ where: { id: item.id }, update: sanitized, create: sanitized });
      d1SqlLines.push(generateD1Insert("SocialPost", sanitized));
    }
    summary.socialPosts = await prisma.socialPost.count();
  }

  // Re-enable foreign keys
  d1SqlLines.push("");
  d1SqlLines.push("PRAGMA foreign_keys = ON;");

  // Write out d1_seed.sql
  const d1SqlPath = path.resolve(__dirname, "..", "prisma", "d1_seed.sql");
  fs.writeFileSync(d1SqlPath, d1SqlLines.join("\n"), "utf8");

  console.log("\n=================================================");
  console.log("   MIGRATION & VERIFICATION COMPLETE!            ");
  console.log("=================================================");
  console.log("Verified Record Counts in SQLite / D1:");
  console.table(summary);
  console.log(`\n📄 Generated Cloudflare D1 seed SQL: ${d1SqlPath}`);
  console.log(`📦 Size: ${(fs.statSync(d1SqlPath).size / 1024).toFixed(2)} KB`);
}

migrate()
  .catch((err) => {
    console.error("❌ Migration error:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
