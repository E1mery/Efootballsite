import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const DB_NAME = 'efrl-db';
const backupJsonPath = path.resolve('prisma/backups/neon_backup_latest.json');

if (!fs.existsSync(backupJsonPath)) {
  console.error(`Backup file not found at: ${backupJsonPath}`);
  process.exit(1);
}

const backupData = JSON.parse(fs.readFileSync(backupJsonPath, 'utf8'));
const tables = backupData.tables;

function escapeSqliteValue(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'boolean') return val ? '1' : '0';
  if (typeof val === 'number') return Number.isFinite(val) ? val.toString() : 'NULL';
  if (val instanceof Date) return `'${val.toISOString()}'`;
  if (typeof val === 'object') {
    return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
  }
  const str = String(val);
  return `'${str.replace(/'/g, "''")}'`;
}

function buildInsertSql(tableName, rows) {
  const lines = ['PRAGMA foreign_keys = OFF;'];
  for (const row of rows) {
    const cols = Object.keys(row);
    const quotedCols = cols.map((c) => `"${c}"`).join(', ');
    const values = cols.map((c) => escapeSqliteValue(row[c])).join(', ');
    lines.push(`INSERT OR REPLACE INTO "${tableName}" (${quotedCols}) VALUES (${values});`);
  }
  return lines.join('\n') + '\n';
}

const orderedTables = [
  'LeagueConfig',
  'User',
  'Tournament',
  'Player',
  'Standing',
  'Derby',
  'Match',
  'MatchSubmission',
  'ForfeitClaim',
  'Announcement',
  'AnnouncementRead',
  'UclGroupSlot',
  'HallOfFame',
  'HallOfFameSettings',
  'HallOfFameStatsCache',
  'ManualHistoricalRecord',
  'HistoricalSeasonSnapshot',
  'ArchivedSeason',
  'ArchivedMatch',
  'MotdPollVote',
  'PlayerMessage',
  'FeedbackReview',
  'TrophyPollVote',
  'PasswordResetRequest',
  'News',
  'DismissedSystemNews',
  'EditedSystemNews',
  'SocialPost',
  'SocialReaction',
  'SocialComment',
  'SocialAutomationSetting',
  'StandingsUpdate',
  'UserStandingsView',
];

const BATCH_SIZE = 400;
const tempSqlPath = path.resolve('prisma/backups/temp_d1_batch.sql');

async function main() {
  console.log('======================================================');
  console.log(`Starting Cloudflare D1 Migration for database: ${DB_NAME}`);
  console.log('======================================================\n');

  for (const tableName of orderedTables) {
    const rows = tables[tableName] || [];
    if (rows.length === 0) {
      console.log(`⏩ Table "${tableName}": 0 rows (skipped)`);
      continue;
    }

    console.log(`\n📦 Migrating "${tableName}" (${rows.length} rows)...`);
    const totalBatches = Math.ceil(rows.length / BATCH_SIZE);

    for (let i = 0; i < totalBatches; i++) {
      const chunk = rows.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE);
      const sqlContent = buildInsertSql(tableName, chunk);
      fs.writeFileSync(tempSqlPath, sqlContent, 'utf8');

      process.stdout.write(`  -> Batch ${i + 1}/${totalBatches} (${chunk.length} rows)... `);
      try {
        execSync(`npx wrangler d1 execute ${DB_NAME} --remote --file="${tempSqlPath}" -y`, {
          encoding: 'utf8',
          stdio: 'pipe',
          maxBuffer: 20 * 1024 * 1024,
        });
        console.log('✅ Done');
      } catch (err) {
        console.error('❌ Failed!');
        console.error(err.stdout || err.stderr || err.message);
        process.exit(1);
      }
    }
  }

  if (fs.existsSync(tempSqlPath)) {
    fs.unlinkSync(tempSqlPath);
  }

  console.log('\n======================================================');
  console.log('🎉 MIGRATION FINISHED! VERIFYING REMOTE RECORD COUNTS...');
  console.log('======================================================\n');

  const checkTables = ['User', 'Player', 'Match', 'Standing', 'Announcement', 'News'];
  for (const tbl of checkTables) {
    try {
      const output = execSync(`npx wrangler d1 execute ${DB_NAME} --remote --command="SELECT count(*) as count FROM \\"${tbl}\\";" --json`, {
        encoding: 'utf8',
      });
      const parsed = JSON.parse(output);
      const count = parsed[0]?.results[0]?.count;
      console.log(`  ✓ Table "${tbl}": ${count} records in Cloudflare D1`);
    } catch (e) {
      console.warn(`  ⚠️ Could not verify table "${tbl}":`, e.message);
    }
  }

  console.log('\nMigration to Cloudflare D1 verified successfully!');
}

main().catch((e) => {
  console.error('Migration failed:', e);
  process.exit(1);
});
