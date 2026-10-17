import { processOverdueUnplayedMatches } from "@/lib/autoDailyCycle";
import { prisma } from "@/lib/prisma";

async function main() {
  console.log("Starting resolution of unplayed overdue matches...");
  const maxRetries = 10;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[Attempt ${attempt}/${maxRetries}] Connecting and processing...`);
      const result = await processOverdueUnplayedMatches();
      console.log("=========================================");
      console.log("SUCCESSFULLY RESOLVED OVERDUE MATCHES!");
      console.log(`Processed Count: ${result.processedMatchesCount}`);
      console.log("Processed Match IDs:", result.processedMatchIds);
      console.log("=========================================");
      return;
    } catch (err: any) {
      console.warn(`[Attempt ${attempt} Warning] ${err.message}`);
      if (attempt < maxRetries) {
        console.log("Neon database may be waking up. Waiting 4 seconds before retry...");
        await new Promise((r) => setTimeout(r, 4000));
      } else {
        throw err;
      }
    }
  }
}

main()
  .catch((e) => {
    console.error("Fatal error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect().catch(() => {});
    process.exit(0);
  });
