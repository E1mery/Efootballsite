import fs from 'fs';
import path from 'path';

// Load Cloudflare API credentials
const configToml = fs.readFileSync('C:\\Users\\PC\\AppData\\Roaming\\xdg.config\\.wrangler\\config\\default.toml', 'utf8');
const tokenMatch = configToml.match(/oauth_token\s*=\s*"([^"]+)"/);
if (!tokenMatch) {
  console.error('Cloudflare OAuth token not found in default.toml');
  process.exit(1);
}
const token = tokenMatch[1];

const ACCOUNT_ID = '4da093e261818c95193bba5f1df93b43';
const DATABASE_ID = 'ad99673d-d023-4973-90fc-6500cab0a81b';
const D1_ENDPOINT = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database/${DATABASE_ID}/query`;

// Load Neon backup
const backupPath = path.resolve('prisma/backups/neon_backup_latest.json');
const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
const tables = backupData.tables;

// Ordered dependency list for tables
const orderedTables = [
  'LeagueConfig',
  'User',
  'Player',
  'Tournament',
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
  'SocialAutomationSetting',
  'SocialPost',
  'SocialReaction',
  'SocialComment',
  'StandingsUpdate',
  'UserStandingsView',
];

const reverseOrderedTables = [...orderedTables].reverse();

async function executeD1(sql, maxRetries = 5) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(D1_ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sql }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`D1 HTTP error ${res.status}: ${text}`);
      }

      const json = await res.json();
      if (!json.success) {
        throw new Error(`D1 API failure: ${JSON.stringify(json.errors)}`);
      }
      return json.result;
    } catch (err) {
      if (attempt === maxRetries) {
        throw err;
      }
      const backoff = attempt * 1200;
      console.warn(`    ⚠️ Transient D1 error (attempt ${attempt}/${maxRetries}): ${err.message}. Retrying in ${backoff}ms...`);
      await new Promise(r => setTimeout(r, backoff));
    }
  }
}

function normalizeSqliteDate(val) {
  if (typeof val !== 'string') return val;
  const dateRegex = /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}(\.\d+)?$/;
  if (dateRegex.test(val)) {
    const iso = val.replace(' ', 'T') + (val.endsWith('Z') ? '' : 'Z');
    return iso;
  }
  return val;
}

function escapeSqliteValue(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'boolean') return val ? '1' : '0';
  if (typeof val === 'number') return Number.isFinite(val) ? val.toString() : 'NULL';
  if (val instanceof Date) return `'${val.toISOString()}'`;
  if (typeof val === 'object') {
    return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
  }
  const str = normalizeSqliteDate(String(val));
  return `'${str.replace(/'/g, "''")}'`;
}

function buildChunkInsertSql(tableName, rows) {
  if (rows.length === 0) return '';
  const cols = Object.keys(rows[0]);
  const quotedCols = cols.map(c => `"${c}"`).join(', ');

  const valuesClauses = rows.map(row => {
    const vals = cols.map(c => escapeSqliteValue(row[c])).join(', ');
    return `(${vals})`;
  });

  return `INSERT OR REPLACE INTO "${tableName}" (${quotedCols}) VALUES\n  ${valuesClauses.join(',\n  ')};`;
}

async function main() {
  console.log('================================================================');
  console.log('⚡ STARTING FULL DATA SYNCHRONIZATION WITH BACKUPNEON DATABASE');
  console.log('================================================================\n');

  console.log('Step 1: Clearing all 33 tables individually in reverse dependency order...');
  for (const table of reverseOrderedTables) {
    await executeD1(`DELETE FROM "${table}";`);
  }
  console.log('✅ All 33 tables cleared.\n');

  console.log('Step 2: Populating all tables from backupneon in forward dependency order...');

  for (const tableName of orderedTables) {
    const rows = tables[tableName] || [];
    if (rows.length === 0) {
      console.log(`⏩ Table "${tableName}": 0 rows (skipped)`);
      continue;
    }

    // Tables with large text/JSON use smaller batch size
    let batchSize = 50;
    if (tableName === 'SocialPost') batchSize = 15;
    else if (tableName === 'News') batchSize = 20;
    else if (tableName === 'Announcement') batchSize = 25;

    process.stdout.write(`📦 Migrating "${tableName}" (${rows.length} rows)... `);
    const totalBatches = Math.ceil(rows.length / batchSize);

    for (let i = 0; i < totalBatches; i++) {
      const chunk = rows.slice(i * batchSize, (i + 1) * batchSize);
      const sql = 'PRAGMA foreign_keys = OFF;\n' + buildChunkInsertSql(tableName, chunk);
      await executeD1(sql);
    }
    console.log(`✅ ${rows.length} rows inserted across ${totalBatches} batches.`);
  }

  console.log('\n================================================================');
  console.log('🔍 Step 3: Verifying final record counts between BackupNeon and D1...');
  console.log('================================================================\n');

  const checkCols = orderedTables.map(t => `(SELECT count(*) FROM "${t}") as "${t}"`).join(', ');
  const d1Res = await executeD1(`SELECT ${checkCols};`);
  const d1Counts = d1Res[0]?.results[0] || {};

  let allMatched = true;
  for (const table of orderedTables) {
    const expected = (tables[table] || []).length;
    const actual = parseInt(d1Counts[table] ?? 0, 10);
    if (expected === actual) {
      console.log(`  ✅ ${table.padEnd(26)}: ${actual} rows (Exact match)`);
    } else {
      console.error(`  ❌ ${table.padEnd(26)}: Expected ${expected}, got ${actual}`);
      allMatched = false;
    }
  }

  if (allMatched) {
    console.log('\n🎉 ALL 33 TABLES IN THE SYSTEM ARE NOW 100% SYNCHRONIZED AND MATCH BACKUPNEON EXACTLY!');
  } else {
    throw new Error('Some tables did not match expected counts after sync!');
  }
}

main().catch(err => {
  console.error('Fatal sync error:', err);
  process.exit(1);
});
