import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const DB_NAME = 'efrl-db';
const schemaPath = path.resolve('prisma/schema.prisma');
const schema = fs.readFileSync(schemaPath, 'utf8');

// Parse models and their DateTime fields
const modelRegex = /model\s+(\w+)\s+\{([\s\S]*?)\}/g;
let match;
const dateTimeFields = [];

while ((match = modelRegex.exec(schema)) !== null) {
  const modelName = match[1];
  const body = match[2];
  const fieldRegex = /^\s*(\w+)\s+DateTime/gm;
  let fieldMatch;
  while ((fieldMatch = fieldRegex.exec(body)) !== null) {
    dateTimeFields.push({ model: modelName, field: fieldMatch[1] });
  }
}

console.log(`Found ${dateTimeFields.length} DateTime fields across models:`);
for (const item of dateTimeFields) {
  console.log(` - ${item.model}.${item.field}`);
}

const updateQueries = dateTimeFields.map(
  ({ model, field }) =>
    `UPDATE "${model}" SET "${field}" = replace("${field}", ' ', 'T') || 'Z' WHERE "${field}" IS NOT NULL AND "${field}" LIKE '% %' AND "${field}" NOT LIKE '%Z';`
);

const tempSql = path.resolve('prisma/backups/fix_dates.sql');
fs.writeFileSync(tempSql, updateQueries.join('\n') + '\n', 'utf8');

console.log(`\nExecuting ${updateQueries.length} date normalization queries on Cloudflare D1...`);
try {
  execSync(`npx wrangler d1 execute ${DB_NAME} --remote --file="${tempSql}" -y`, {
    stdio: 'inherit',
    encoding: 'utf8',
  });
  console.log('\n✅ All dates normalized to ISO 8601 format!');
} catch (e) {
  console.error('Failed to normalize dates:', e.message);
  process.exit(1);
} finally {
  if (fs.existsSync(tempSql)) {
    fs.unlinkSync(tempSql);
  }
}
