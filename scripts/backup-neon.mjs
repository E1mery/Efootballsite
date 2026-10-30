import fs from 'fs';
import path from 'path';

const NEON_CONN_STR = 'postgresql://neondb_owner:npg_h1sJKNj0fGgp@ep-mute-flower-b4t33glf-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require';
const NEON_HTTP_ENDPOINT = 'https://ep-mute-flower-b4t33glf-pooler.c-6.us-east-2.aws.neon.tech/sql';

async function queryNeon(sql) {
  const res = await fetch(NEON_HTTP_ENDPOINT, {
    method: 'POST',
    headers: {
      'Neon-Connection-String': NEON_CONN_STR,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Neon SQL error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  return data.rows || [];
}

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

async function main() {
  console.log('Fetching table list from Neon PostgreSQL database...');
  const tablesResult = await queryNeon(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name;"
  );

  const tableNames = tablesResult.map((t) => t.table_name);
  console.log(`Found ${tableNames.length} tables:`, tableNames);

  const backupData = {
    metadata: {
      exportedAt: new Date().toISOString(),
      source: 'Neon PostgreSQL (ep-mute-flower-b4t33glf)',
      totalTables: tableNames.length,
      rowCounts: {},
    },
    tables: {},
  };

  const sqliteStatements = [
    '-- Cloudflare D1 / SQLite migration backup',
    `-- Exported At: ${new Date().toISOString()}`,
    '-- Source: Neon PostgreSQL (ep-mute-flower-b4t33glf)',
    'PRAGMA foreign_keys = OFF;',
    '',
  ];

  for (const tableName of tableNames) {
    process.stdout.write(`Exporting "${tableName}"... `);
    try {
      const rows = await queryNeon(`SELECT * FROM "${tableName}";`);
      backupData.tables[tableName] = rows;
      backupData.metadata.rowCounts[tableName] = rows.length;
      console.log(`${rows.length} rows`);

      if (rows.length > 0) {
        sqliteStatements.push(`-- Table: ${tableName} (${rows.length} rows)`);
        for (const row of rows) {
          const cols = Object.keys(row);
          const quotedCols = cols.map((c) => `"${c}"`).join(', ');
          const values = cols.map((c) => escapeSqliteValue(row[c])).join(', ');
          sqliteStatements.push(`INSERT OR REPLACE INTO "${tableName}" (${quotedCols}) VALUES (${values});`);
        }
        sqliteStatements.push('');
      }
    } catch (err) {
      console.error(`ERROR: ${err.message}`);
    }
  }

  const backupsDir = path.resolve(process.cwd(), 'prisma', 'backups');
  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

  // Save raw JSON backups
  const jsonPathTimestamp = path.join(backupsDir, `neon_backup_${timestamp}.json`);
  const jsonPathLatest = path.join(backupsDir, 'neon_backup_latest.json');
  fs.writeFileSync(jsonPathTimestamp, JSON.stringify(backupData, null, 2), 'utf8');
  fs.writeFileSync(jsonPathLatest, JSON.stringify(backupData, null, 2), 'utf8');

  // Save SQLite SQL script for Cloudflare D1
  const sqlD1PathTimestamp = path.join(backupsDir, `d1_migration_${timestamp}.sql`);
  const sqlD1PathLatest = path.join(backupsDir, 'd1_migration_latest.sql');
  const d1SqlContent = sqliteStatements.join('\n');
  fs.writeFileSync(sqlD1PathTimestamp, d1SqlContent, 'utf8');
  fs.writeFileSync(sqlD1PathLatest, d1SqlContent, 'utf8');

  console.log('\n======================================================');
  console.log('✅ BACKUP COMPLETED SUCCESSFULLY');
  console.log('======================================================');
  console.log(`JSON Backup files:`);
  console.log(` - ${jsonPathTimestamp}`);
  console.log(` - ${jsonPathLatest}`);
  console.log(`\nCloudflare D1 SQL Migration files:`);
  console.log(` - ${sqlD1PathTimestamp}`);
  console.log(` - ${sqlD1PathLatest}`);
}

main().catch((err) => {
  console.error('Fatal error during backup:', err);
  process.exit(1);
});
