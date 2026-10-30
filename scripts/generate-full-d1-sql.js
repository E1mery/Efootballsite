const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "file:./dev.db",
    },
  },
});

async function generateFullD1Sql() {
  const schemaObjects = await prisma.$queryRawUnsafe(
    "SELECT type, name, sql FROM sqlite_master WHERE type IN ('table', 'index') AND name NOT LIKE 'sqlite_%' AND sql IS NOT NULL ORDER BY type DESC, name ASC;"
  );

  console.log(`Found ${schemaObjects.length} schema definitions (tables & indexes).`);

  const ddlStatements = schemaObjects
    .map((item) => {
      let sql = item.sql.trim();
      if (!sql.endsWith(";")) sql += ";";
      return sql;
    })
    .join("\n\n");

  const seedData = fs.readFileSync(path.resolve(__dirname, "..", "prisma", "d1_seed.sql"), "utf8");

  // Strip PRAGMA statements from seedData so we place them once at top and bottom
  const cleanSeedData = seedData
    .replace(/PRAGMA foreign_keys\s*=\s*(OFF|ON);/gi, "")
    .trim();

  const fullSql = [
    "-- ==================================================================",
    "-- Rwanda eFootball League (EFRL) - Cloudflare D1 Full Deployment",
    `-- Generated At: ${new Date().toISOString()}`,
    "-- Format: SQLite / Cloudflare D1 (Schema DDL + Data DML)",
    "-- ==================================================================",
    "",
    "PRAGMA foreign_keys = OFF;",
    "",
    "-- ==================================================================",
    "-- 1. DATABASE SCHEMA: TABLES & INDEXES",
    "-- ==================================================================",
    "",
    ddlStatements,
    "",
    "-- ==================================================================",
    "-- 2. PRODUCTION DATA: PLAYERS, MATCHES, STANDINGS, USERS, ETC.",
    "-- ==================================================================",
    "",
    cleanSeedData,
    "",
    "PRAGMA foreign_keys = ON;",
    "",
  ].join("\n");

  const outputPath = path.resolve(__dirname, "..", "prisma", "d1_full_migration.sql");
  fs.writeFileSync(outputPath, fullSql, "utf8");

  console.log(`✅ SUCCESS: ${outputPath} created!`);
  console.log(`📦 Size: ${(fs.statSync(outputPath).size / 1024).toFixed(2)} KB`);
}

generateFullD1Sql()
  .catch((err) => {
    console.error("Error generating D1 SQL:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
