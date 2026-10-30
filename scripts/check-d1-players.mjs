import { execSync } from 'child_process';
import fs from 'fs';

const DB_NAME = 'efrl-db';

async function run() {
  console.log('Querying D1 players with retry...');
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      console.log(`Attempt ${attempt}...`);
      const result = execSync(
        `npx wrangler d1 execute ${DB_NAME} --remote --command="SELECT id, userId, gamerTag, division, status, realTeam, isDisqualified FROM Player ORDER BY division, status;" --json`,
        { encoding: 'utf8', timeout: 30000 }
      );

      const parsed = JSON.parse(result);
      const rows = parsed[0]?.results || [];
      console.log(`Total players in remote D1: ${rows.length}`);

      const byDiv = {};
      const byStatus = {};
      for (const r of rows) {
        byDiv[r.division] = (byDiv[r.division] || 0) + 1;
        byStatus[r.status] = (byStatus[r.status] || 0) + 1;
      }
      console.log('By Division in D1:', byDiv);
      console.log('By Status in D1:', byStatus);

      fs.writeFileSync('prisma/backups/d1_players_current.json', JSON.stringify(rows, null, 2), 'utf8');
      console.log('Successfully saved prisma/backups/d1_players_current.json');
      return;
    } catch (e) {
      console.warn(`Attempt ${attempt} failed: ${e.message}`);
      if (e.stdout) console.log('Stdout:', e.stdout);
      await new Promise(r => setTimeout(r, 2000 * attempt));
    }
  }
  console.error('All attempts failed');
}

run();
