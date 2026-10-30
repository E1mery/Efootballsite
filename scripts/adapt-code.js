const fs = require("fs");
const path = require("path");

function adaptDerbyService() {
  const filePath = path.resolve(__dirname, "..", "src", "lib", "derbyService.ts");
  let code = fs.readFileSync(filePath, "utf8");

  // Replace TIMESTAMP(3) with DATETIME
  code = code.replace(/TIMESTAMP\(3\)/g, "DATETIME");

  // Make column additions safe for SQLite without IF NOT EXISTS
  const oldColumnsBlock = `    // 2. Ensure columns exist on Match
    await prisma.$executeRawUnsafe(\`
      ALTER TABLE "Match" ADD COLUMN IF NOT EXISTS "derbyId" TEXT;
    \`);
    await prisma.$executeRawUnsafe(\`
      ALTER TABLE "Match" ADD COLUMN IF NOT EXISTS "isDerby" BOOLEAN NOT NULL DEFAULT false;
    \`);
    await prisma.$executeRawUnsafe(\`
      ALTER TABLE "Match" ADD COLUMN IF NOT EXISTS "derbyName" TEXT;
    \`);

    // 3. Ensure columns exist on ArchivedMatch
    await prisma.$executeRawUnsafe(\`
      ALTER TABLE "ArchivedMatch" ADD COLUMN IF NOT EXISTS "derbyId" TEXT;
    \`);
    await prisma.$executeRawUnsafe(\`
      ALTER TABLE "ArchivedMatch" ADD COLUMN IF NOT EXISTS "derbyName" TEXT;
    \`);

    // 4. Ensure columns exist on SocialPost
    await prisma.$executeRawUnsafe(\`
      ALTER TABLE "SocialPost" ADD COLUMN IF NOT EXISTS "derbyId" TEXT;
    \`);
    await prisma.$executeRawUnsafe(\`
      ALTER TABLE "SocialPost" ADD COLUMN IF NOT EXISTS "derbyName" TEXT;
    \`);`;

  const newColumnsBlock = `    // Helper for safe column addition across SQLite and Postgres
    const safeAddColumn = async (table: string, column: string, typeDef: string) => {
      try {
        await prisma.$executeRawUnsafe(\`ALTER TABLE "\${table}" ADD COLUMN "\${column}" \${typeDef}\`);
      } catch {}
    };

    // 2. Ensure columns exist on Match
    await safeAddColumn("Match", "derbyId", "TEXT");
    await safeAddColumn("Match", "isDerby", "BOOLEAN NOT NULL DEFAULT 0");
    await safeAddColumn("Match", "derbyName", "TEXT");

    // 3. Ensure columns exist on ArchivedMatch
    await safeAddColumn("ArchivedMatch", "derbyId", "TEXT");
    await safeAddColumn("ArchivedMatch", "derbyName", "TEXT");

    // 4. Ensure columns exist on SocialPost
    await safeAddColumn("SocialPost", "derbyId", "TEXT");
    await safeAddColumn("SocialPost", "derbyName", "TEXT");`;

  code = code.replace(oldColumnsBlock.replace(/\r\n/g, "\n"), newColumnsBlock);
  code = code.replace(oldColumnsBlock.replace(/\n/g, "\r\n"), newColumnsBlock);
  fs.writeFileSync(filePath, code, "utf8");
  console.log("✅ derbyService.ts adapted.");
}

function adaptEnsureNewsTable() {
  const filePath = path.resolve(__dirname, "..", "src", "lib", "ensureNewsTable.ts");
  let code = fs.readFileSync(filePath, "utf8");
  code = code.replace(/TIMESTAMP\(3\)/g, "DATETIME");
  fs.writeFileSync(filePath, code, "utf8");
  console.log("✅ ensureNewsTable.ts adapted.");
}

function adaptPasswordReset() {
  const filePath = path.resolve(__dirname, "..", "src", "lib", "passwordReset.ts");
  let code = fs.readFileSync(filePath, "utf8");
  code = code.replace(/TIMESTAMP\(3\)/g, "DATETIME");
  fs.writeFileSync(filePath, code, "utf8");
  console.log("✅ passwordReset.ts adapted.");
}

function adaptSocialPublishing() {
  const filePath = path.resolve(__dirname, "..", "src", "lib", "socialPublishingService.ts");
  let code = fs.readFileSync(filePath, "utf8");

  // In socialPublishingService, hashtags is string[] | undefined in TypeScript interface
  // When saving to DB, stringify if array
  code = code.replace(
    /hashtags,\s+division:\s+division\s+\|\|\s+null,/g,
    `hashtags: typeof hashtags === "string" ? hashtags : JSON.stringify(hashtags || []), division: division || null,`
  );

  fs.writeFileSync(filePath, code, "utf8");
  console.log("✅ socialPublishingService.ts adapted.");
}

function adaptSocialPostsRoute() {
  const filePath = path.resolve(__dirname, "..", "src", "app", "api", "social", "posts", "route.ts");
  let code = fs.readFileSync(filePath, "utf8");

  // Parse hashtags if stored as JSON string
  code = code.replace(
    /hashtags:\s+post\.hashtags,/g,
    `hashtags: (() => {
        if (Array.isArray(post.hashtags)) return post.hashtags;
        if (typeof post.hashtags === "string") {
          try {
            const parsed = JSON.parse(post.hashtags);
            if (Array.isArray(parsed)) return parsed;
          } catch {}
          return post.hashtags ? [post.hashtags] : [];
        }
        return [];
      })(),`
  );

  fs.writeFileSync(filePath, code, "utf8");
  console.log("✅ social posts route adapted.");
}

adaptDerbyService();
adaptEnsureNewsTable();
adaptPasswordReset();
adaptSocialPublishing();
adaptSocialPostsRoute();
console.log("All application files adapted for SQLite / Cloudflare D1 successfully!");
