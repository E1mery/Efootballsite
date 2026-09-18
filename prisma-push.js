const { execSync } = require("child_process");

if (process.env.VERCEL) {
  try {
    console.log("--> Running prisma db push on Vercel deployment...");
    execSync("npx prisma db push --accept-data-loss", {
      stdio: "inherit",
      timeout: 30000,
    });
    console.log("--> prisma db push complete!");
  } catch (err) {
    console.warn("--> prisma db push warning:", err.message);
  }
}
