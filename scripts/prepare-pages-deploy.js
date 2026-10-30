const fs = require("fs");
const path = require("path");

const openNextDir = path.resolve(__dirname, "..", ".open-next");
const workerSrc = path.join(openNextDir, "worker.js");
const workerDestRoot = path.join(openNextDir, "_worker.js");
const assetsDir = path.join(openNextDir, "assets");
const workerDestAssets = path.join(assetsDir, "_worker.js");

console.log("Preparing Cloudflare Pages deployment bundle...");

// 1. Copy all static assets from .open-next/assets into .open-next/ so /_next/static CSS & JS load!
if (fs.existsSync(assetsDir)) {
  fs.cpSync(assetsDir, openNextDir, { recursive: true, force: true });
  console.log("✅ Copied all static assets from .open-next/assets/ to .open-next/ (CSS/JS now available at root!)");
} else {
  console.warn("⚠️ assets directory not found in .open-next");
}

// 2. Generate _worker.js that wraps OpenNext and falls back to env.ASSETS
if (fs.existsSync(workerSrc)) {
  const workerWrapper = `import openNextWorker from "./worker.js";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // 1. Fast static asset routing
    if (
      url.pathname.startsWith("/_next/static/") ||
      url.pathname.startsWith("/assets/") ||
      url.pathname.startsWith("/images/") ||
      url.pathname.startsWith("/uploads/") ||
      url.pathname === "/logo.png" ||
      url.pathname === "/favicon.ico"
    ) {
      if (env.ASSETS) {
        return env.ASSETS.fetch(request);
      }
    }

    // 2. Dynamic execution via OpenNext Next.js server
    try {
      const response = await openNextWorker.fetch(request, env, ctx);
      // Fallback to static assets if OpenNext returned 404
      if (response.status === 404 && env.ASSETS) {
        const assetRes = await env.ASSETS.fetch(request);
        if (assetRes.status !== 404) {
          return assetRes;
        }
      }
      return response;
    } catch (err) {
      if (env.ASSETS) {
        const assetRes = await env.ASSETS.fetch(request);
        if (assetRes.status !== 404) {
          return assetRes;
        }
      }
      throw err;
    }
  }
};
`;

  fs.writeFileSync(workerDestRoot, workerWrapper, "utf8");
  console.log("✅ Created smart .open-next/_worker.js wrapper with env.ASSETS fallback");

  if (fs.existsSync(assetsDir)) {
    fs.writeFileSync(workerDestAssets, workerWrapper, "utf8");
    console.log("✅ Created smart .open-next/assets/_worker.js wrapper with env.ASSETS fallback");
  }
} else {
  console.warn("⚠️ worker.js not found in .open-next");
}

// 3. Write _routes.json into output directories to tell Cloudflare Pages CDN to bypass worker for static assets
const routesConfig = JSON.stringify({
  version: 1,
  include: ["/*"],
  exclude: [
    "/_next/static/*",
    "/assets/*",
    "/images/*",
    "/uploads/*",
    "/logo.png",
    "/favicon.ico",
    "/robots.txt",
    "/sitemap.xml"
  ]
}, null, 2);

fs.writeFileSync(path.join(openNextDir, "_routes.json"), routesConfig, "utf8");
console.log("✅ Created .open-next/_routes.json");

if (fs.existsSync(assetsDir)) {
  fs.writeFileSync(path.join(assetsDir, "_routes.json"), routesConfig, "utf8");
  console.log("✅ Created .open-next/assets/_routes.json");
}

console.log("Cloudflare Pages bundle preparation completed successfully.");
