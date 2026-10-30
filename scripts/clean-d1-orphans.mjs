import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const DB_NAME = 'efrl-db';

console.log('--- Scanning Cloudflare D1 for orphaned relational data ---');

const cleanupSql = `
DELETE FROM "Match" WHERE "homePlayerId" NOT IN (SELECT "id" FROM "Player") OR "awayPlayerId" NOT IN (SELECT "id" FROM "Player");
DELETE FROM "Standing" WHERE "playerId" NOT IN (SELECT "id" FROM "Player");
DELETE FROM "Announcement" WHERE "targetPlayerId" IS NOT NULL AND "targetPlayerId" NOT IN (SELECT "id" FROM "Player");
DELETE FROM "AnnouncementRead" WHERE "playerId" NOT IN (SELECT "id" FROM "Player") OR "announcementId" NOT IN (SELECT "id" FROM "Announcement");
DELETE FROM "FeedbackReview" WHERE "playerId" NOT IN (SELECT "id" FROM "Player");
DELETE FROM "MatchSubmission" WHERE "submittedByPlayerId" NOT IN (SELECT "id" FROM "Player") OR "matchId" NOT IN (SELECT "id" FROM "Match");
DELETE FROM "ForfeitClaim" WHERE "claimantPlayerId" NOT IN (SELECT "id" FROM "Player") OR "accusedPlayerId" NOT IN (SELECT "id" FROM "Player") OR "matchId" NOT IN (SELECT "id" FROM "Match");
`;

const tempFile = path.resolve('prisma/backups/cleanup_orphans_temp.sql');
fs.writeFileSync(tempFile, cleanupSql, 'utf8');

try {
  console.log('Executing orphan cleanup on remote D1...');
  execSync(`cmd /c npx wrangler d1 execute ${DB_NAME} --remote --file="${tempFile}" -y`, {
    stdio: 'inherit',
    encoding: 'utf8',
  });
  console.log('✅ Remote D1 foreign key integrity enforced successfully.');
} catch (e) {
  console.error('Failed to cleanup D1 orphans:', e.message);
} finally {
  if (fs.existsSync(tempFile)) {
    fs.unlinkSync(tempFile);
  }
}
