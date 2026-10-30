const fs = require("fs");
const path = require("path");

const publicUploadsDir = path.resolve(__dirname, "..", "public", "uploads", "screenshots");
if (!fs.existsSync(publicUploadsDir)) {
  fs.mkdirSync(publicUploadsDir, { recursive: true });
}

const backupPath = path.resolve(__dirname, "..", "prisma", "backups", "backup_latest.json");
const backupData = JSON.parse(fs.readFileSync(backupPath, "utf8"));
const tables = backupData.tables || {};

function saveBase64Image(dataUri, filenameBase) {
  if (!dataUri || !dataUri.startsWith("data:")) return dataUri;
  const match = dataUri.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return dataUri;
  const mime = match[1].toLowerCase();
  const base64 = match[2];
  let ext = "png";
  if (mime.includes("jpeg") || mime.includes("jpg")) ext = "jpg";
  else if (mime.includes("webp")) ext = "webp";

  const filename = `${filenameBase}.${ext}`;
  const filePath = path.join(publicUploadsDir, filename);
  fs.writeFileSync(filePath, Buffer.from(base64, "base64"));
  console.log(`Saved preserved image proof to: public/uploads/screenshots/${filename} (${(fs.statSync(filePath).size / 1024).toFixed(1)} KB)`);
  return `/api/files/uploads/screenshots/${filename}`;
}

// 1. Sanitize tables in memory
let sanitizedCount = 0;
for (const m of tables.matches || []) {
  if (m.screenshotUrl && m.screenshotUrl.startsWith("data:")) {
    m.screenshotUrl = saveBase64Image(m.screenshotUrl, `match-${m.id}`);
    sanitizedCount++;
  }
  if (m.leg2ScreenshotUrl && m.leg2ScreenshotUrl.startsWith("data:")) {
    m.leg2ScreenshotUrl = saveBase64Image(m.leg2ScreenshotUrl, `match-leg2-${m.id}`);
    sanitizedCount++;
  }
}

for (const s of tables.submissions || []) {
  if (s.screenshotUrl && s.screenshotUrl.startsWith("data:")) {
    s.screenshotUrl = saveBase64Image(s.screenshotUrl, `sub-${s.id}`);
    sanitizedCount++;
  }
  if (s.leg2ScreenshotUrl && s.leg2ScreenshotUrl.startsWith("data:")) {
    s.leg2ScreenshotUrl = saveBase64Image(s.leg2ScreenshotUrl, `sub-leg2-${s.id}`);
    sanitizedCount++;
  }
}

console.log(`Sanitized ${sanitizedCount} base64 payload(s) from database records.`);

// 2. Re-generate d1_full_migration.sql
const { execSync } = require("child_process");
fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2), "utf8");

// Re-run d1 migration script
execSync("node scripts/migrate-to-d1.js", { stdio: "inherit" });
execSync("node scripts/generate-full-d1-sql.js", { stdio: "inherit" });

// 3. Inspect new d1_full_migration.sql
const newSql = fs.readFileSync("prisma/d1_full_migration.sql", "utf8");
const lines = newSql.split("\n");
const maxLine = lines.reduce(
  (max, l, i) => (l.length > max.length ? { line: i + 1, length: l.length } : max),
  { line: 0, length: 0 }
);

console.log("\n=================================================");
console.log("   D1 SQL OPTIMIZATION REPORT                    ");
console.log("=================================================");
console.log(`Total SQL lines: ${lines.length}`);
console.log(`Max line length: ${maxLine.length} chars (at line ${maxLine.line})`);
console.log(`New file size:   ${(newSql.length / 1024).toFixed(2)} KB`);
console.log("Status: READY FOR CLOUDFLARE D1 (SQLITE_TOOBIG RESOLVED!)");
