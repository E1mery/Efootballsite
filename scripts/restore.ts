import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import * as dotenv from "dotenv";

dotenv.config();

const backupsDir = path.resolve(process.cwd(), "prisma", "backups");
const defaultBackupPath = path.join(backupsDir, "backup_latest.json");

const backupFile = process.argv[3] || defaultBackupPath;
if (!fs.existsSync(backupFile)) {
  console.error(`❌ Backup file not found at: ${backupFile}`);
  process.exit(1);
}

const targetUrl = process.argv[2] || process.env.DATABASE_URL;
if (!targetUrl) {
  console.error("❌ Usage: npx tsx scripts/restore.ts <TARGET_DATABASE_URL> [BACKUP_FILE_PATH]");
  process.exit(1);
}

const sanitizedTarget = targetUrl.replace(/:[^:@]+@/, ":***@");
console.log("=================================================");
console.log("   eFootball Rwanda League - Database Restore    ");
console.log("=================================================\n");
console.log(`📁 Source Backup: ${backupFile}`);
console.log(`📡 Target DB:     ${sanitizedTarget}\n`);

// 1. Push schema to target database
console.log("⚙️  Syncing Prisma schema to target database...");
try {
  execSync("npx prisma db push --skip-generate --accept-data-loss", {
    cwd: process.cwd(),
    env: { ...process.env, DATABASE_URL: targetUrl },
    stdio: "inherit",
  });
} catch (e: any) {
  console.warn("⚠️  Prisma schema sync warning:", e.message);
}

const backupData = JSON.parse(fs.readFileSync(backupFile, "utf8"));
const tables = backupData.tables || {};

let connectionUrl = targetUrl;
if (!connectionUrl.includes("connect_timeout=")) {
  connectionUrl += (connectionUrl.includes("?") ? "&" : "?") + "connect_timeout=30";
}
if (!connectionUrl.includes("pool_timeout=")) {
  connectionUrl += "&pool_timeout=30";
}

const prisma = new PrismaClient({
  datasources: { db: { url: connectionUrl } },
});

async function restore() {
  console.log("\n🚀 Beginning data restoration into target database...\n");

  // 1. League Config
  if (tables.leagueConfigs?.length) {
    console.log(`  ▶ Restoring ${tables.leagueConfigs.length} league configs...`);
    for (const lc of tables.leagueConfigs) {
      await prisma.leagueConfig.upsert({ where: { id: lc.id }, update: lc, create: lc });
    }
  }

  // 2. Users
  if (tables.users?.length) {
    console.log(`  ▶ Restoring ${tables.users.length} users...`);
    for (const u of tables.users) {
      await prisma.user.upsert({ where: { id: u.id }, update: u, create: u });
    }
  }

  // 3. Tournaments
  if (tables.tournaments?.length) {
    console.log(`  ▶ Restoring ${tables.tournaments.length} tournaments...`);
    for (const t of tables.tournaments) {
      await prisma.tournament.upsert({ where: { id: t.id }, update: t, create: t });
    }
  }

  // 4. Players
  if (tables.players?.length) {
    console.log(`  ▶ Restoring ${tables.players.length} players...`);
    for (const p of tables.players) {
      await prisma.player.upsert({ where: { id: p.id }, update: p, create: p });
    }
  }

  // 5. Matches
  if (tables.matches?.length) {
    console.log(`  ▶ Restoring ${tables.matches.length} matches...`);
    for (const m of tables.matches) {
      await prisma.match.upsert({ where: { id: m.id }, update: m, create: m });
    }
  }

  // 6. Standings
  if (tables.standings?.length) {
    console.log(`  ▶ Restoring ${tables.standings.length} standings...`);
    for (const s of tables.standings) {
      await prisma.standing.upsert({ where: { id: s.id }, update: s, create: s });
    }
  }

  // 7. Submissions
  if (tables.submissions?.length) {
    console.log(`  ▶ Restoring ${tables.submissions.length} submissions...`);
    for (const sub of tables.submissions) {
      await prisma.matchSubmission.upsert({ where: { id: sub.id }, update: sub, create: sub });
    }
  }

  // 8. Forfeit Claims
  if (tables.forfeitClaims?.length) {
    console.log(`  ▶ Restoring ${tables.forfeitClaims.length} forfeit claims...`);
    for (const fc of tables.forfeitClaims) {
      await prisma.forfeitClaim.upsert({ where: { id: fc.id }, update: fc, create: fc });
    }
  }

  // 9. Announcements
  if (tables.announcements?.length) {
    console.log(`  ▶ Restoring ${tables.announcements.length} announcements...`);
    for (const a of tables.announcements) {
      await prisma.announcement.upsert({ where: { id: a.id }, update: a, create: a });
    }
  }

  // 10. Announcement Reads
  if (tables.announcementReads?.length) {
    console.log(`  ▶ Restoring ${tables.announcementReads.length} announcement reads...`);
    for (const ar of tables.announcementReads) {
      await prisma.announcementRead.upsert({ where: { id: ar.id }, update: ar, create: ar });
    }
  }

  // 11. UCL Group Slots
  if (tables.uclGroupSlots?.length) {
    for (const item of tables.uclGroupSlots) {
      await prisma.uclGroupSlot.upsert({ where: { id: item.id }, update: item, create: item });
    }
  }

  // 12. Hall of Fame
  if (tables.hallOfFames?.length) {
    for (const item of tables.hallOfFames) {
      await prisma.hallOfFame.upsert({ where: { id: item.id }, update: item, create: item });
    }
  }

  // 13. Messages & Feedback
  if (tables.playerMessages?.length) {
    for (const item of tables.playerMessages) {
      await prisma.playerMessage.upsert({ where: { id: item.id }, update: item, create: item });
    }
  }
  if (tables.feedbackReviews?.length) {
    for (const item of tables.feedbackReviews) {
      await prisma.feedbackReview.upsert({ where: { id: item.id }, update: item, create: item });
    }
  }

  // 14. News & Derbies
  if (tables.news?.length) {
    for (const item of tables.news) {
      await prisma.news.upsert({ where: { id: item.id }, update: item, create: item });
    }
  }
  if (tables.derbies?.length) {
    for (const item of tables.derbies) {
      await prisma.derby.upsert({ where: { id: item.id }, update: item, create: item });
    }
  }

  console.log("\n✅ ALL SYSTEM DATA RESTORED SUCCESSFULLY!");
}

restore()
  .catch((e) => {
    console.error("❌ Restore failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
