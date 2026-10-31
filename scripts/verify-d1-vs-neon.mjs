import fs from 'fs';

// D1 Config
const configToml = fs.readFileSync('C:\\Users\\PC\\AppData\\Roaming\\xdg.config\\.wrangler\\config\\default.toml', 'utf8');
const tokenMatch = configToml.match(/oauth_token\s*=\s*"([^"]+)"/);
const token = tokenMatch[1];
const ACCOUNT_ID = '4da093e261818c95193bba5f1df93b43';
const DATABASE_ID = 'ad99673d-d023-4973-90fc-6500cab0a81b';
const D1_ENDPOINT = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database/${DATABASE_ID}/query`;

// Neon Config
const NEON_CONN_STR = 'postgresql://neondb_owner:npg_h1sJKNj0fGgp@ep-mute-flower-b4t33glf-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require';
const NEON_HTTP_ENDPOINT = 'https://ep-mute-flower-b4t33glf-pooler.c-6.us-east-2.aws.neon.tech/sql';

async function queryNeon(sql) {
  const res = await fetch(NEON_HTTP_ENDPOINT, {
    method: 'POST',
    headers: { 'Neon-Connection-String': NEON_CONN_STR, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql }),
  });
  return (await res.json()).rows || [];
}

async function queryD1(sql) {
  const res = await fetch(D1_ENDPOINT, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ sql }),
  });
  const json = await res.json();
  return json.result[0]?.results || [];
}

async function main() {
  console.log('======================================================');
  console.log('FINAL AUDIT: Live Neon Database vs Production Cloudflare D1');
  console.log('======================================================\n');

  const neonTablesResult = await queryNeon(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name;"
  );
  const tables = neonTablesResult.map(t => t.table_name);

  const neonSubqueries = tables.map(t => `(SELECT count(*) FROM "${t}") as "${t}"`).join(', ');
  const neonCounts = (await queryNeon(`SELECT ${neonSubqueries};`))[0];

  const d1Subqueries = tables.map(t => `(SELECT count(*) FROM "${t}") as "${t}"`).join(', ');
  const d1Counts = (await queryD1(`SELECT ${d1Subqueries};`))[0];

  let matches = 0;
  let discrepancies = 0;

  for (const table of tables) {
    const n = parseInt(neonCounts[table], 10);
    const d = parseInt(d1Counts[table], 10);

    if (n === d) {
      console.log(`✅ ${table.padEnd(26)}: Neon=${String(n).padStart(4)} | D1=${String(d).padStart(4)} (MATCH)`);
      matches++;
    } else {
      console.log(`❌ ${table.padEnd(26)}: Neon=${String(n).padStart(4)} | D1=${String(d).padStart(4)} (DIFF: ${d - n})`);
      discrepancies++;
    }
  }

  console.log('\n======================================================');
  console.log(`RESULT: ${matches}/${tables.length} tables MATCH PERFECTLY.`);
  if (discrepancies === 0) {
    console.log('🎉 100% PARITY ACHIEVED BETWEEN NEON AND SYSTEM D1!');
  } else {
    console.log(`⚠️ ${discrepancies} tables still differ.`);
  }
  console.log('======================================================\n');
}

main().catch(console.error);
