const fs = require("fs");
const path = require("path");

const openNextDir = path.resolve(__dirname, "..", ".open-next");
const workerSrc = path.join(openNextDir, "worker.js");
const workerDestRoot = path.join(openNextDir, "_worker.js");
const assetsDir = path.join(openNextDir, "assets");
const workerDestAssets = path.join(assetsDir, "_worker.js");

if (fs.existsSync(workerSrc)) {
  fs.copyFileSync(workerSrc, workerDestRoot);
  console.log("✅ Copied worker.js -> .open-next/_worker.js");

  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }
  fs.copyFileSync(workerSrc, workerDestAssets);
  console.log("✅ Copied worker.js -> .open-next/assets/_worker.js");
} else {
  console.warn("⚠️ worker.js not found in .open-next; build may have failed.");
}
