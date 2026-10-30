const fs = require("fs");
const path = require("path");

const openNextDir = path.resolve(__dirname, "..", ".open-next");
const workerSrc = path.join(openNextDir, "worker.js");
const workerDestRoot = path.join(openNextDir, "_worker.js");
const assetsDir = path.join(openNextDir, "assets");
const workerDestAssets = path.join(assetsDir, "_worker.js");

console.log("Preparing Cloudflare Pages deployment bundle...");

// 1. Copy worker.js to _worker.js in .open-next/ (for root output dir)
if (fs.existsSync(workerSrc)) {
  fs.copyFileSync(workerSrc, workerDestRoot);
  console.log("✅ Copied worker.js -> .open-next/_worker.js");

  // Also copy to .open-next/assets/_worker.js in case output dir is configured as .open-next/assets
  if (fs.existsSync(assetsDir)) {
    fs.copyFileSync(workerSrc, workerDestAssets);
    console.log("✅ Copied worker.js -> .open-next/assets/_worker.js");
  }
} else {
  console.warn("⚠️ worker.js not found in .open-next");
}

// 2. Copy all static assets from .open-next/assets into .open-next/ so /_next/static CSS & JS load!
if (fs.existsSync(assetsDir)) {
  fs.cpSync(assetsDir, openNextDir, { recursive: true, force: true });
  console.log("✅ Copied all static assets from .open-next/assets/ to .open-next/ (CSS/JS now available at root!)");
} else {
  console.warn("⚠️ assets directory not found in .open-next");
}

console.log("Cloudflare Pages bundle preparation completed successfully.");
