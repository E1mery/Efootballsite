import { verifyAndCleanDuplicates } from "../src/lib/deduplicate";
import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("=== Starting System Duplication Verification and Cleanup ===");
  const report = await verifyAndCleanDuplicates(false);
  console.log("=== Duplication Check Finished ===");
  console.log(JSON.stringify(report, null, 2));
}

main()
  .catch((err) => {
    console.error("Deduplication error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
