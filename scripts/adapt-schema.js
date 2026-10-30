const fs = require("fs");
const path = require("path");

const schemaPath = path.resolve(__dirname, "..", "prisma", "schema.prisma");
let schema = fs.readFileSync(schemaPath, "utf8");

// 1. Change datasource provider from postgresql to sqlite
schema = schema.replace(
  'provider = "postgresql"',
  'provider = "sqlite"'
);

// 2. Remove @db.Text attributes
schema = schema.replace(/@db\.Text/g, "");

// 3. Convert hashtags from String[] to String @default("[]")
schema = schema.replace(
  /hashtags\s+String\[\]\s+@default\(\[\]\)/,
  'hashtags      String           @default("[]")'
);

fs.writeFileSync(schemaPath, schema, "utf8");
console.log("SUCCESS: schema.prisma adapted for SQLite / Cloudflare D1.");
