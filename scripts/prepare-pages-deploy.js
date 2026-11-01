const fs = require("fs");
const path = require("path");

const openNextDir = path.resolve(__dirname, "..", ".open-next");
const workerSrc = path.join(openNextDir, "worker.js");
const workerDestRoot = path.join(openNextDir, "_worker.js");
const assetsDir = path.join(openNextDir, "assets");

console.log("Preparing Cloudflare Pages deployment bundle...");

// 1. Copy all static assets from .open-next/assets into .open-next/ so /_next/static CSS & JS load!
if (fs.existsSync(assetsDir)) {
  fs.cpSync(assetsDir, openNextDir, { recursive: true, force: true });
  console.log("✅ Copied all static assets from .open-next/assets/ to .open-next/ (CSS/JS now available at root!)");
} else {
  console.warn("⚠️ assets directory not found in .open-next");
}

// 2. Generate _worker.js that wraps OpenNext, streams R2 files directly, and falls back to env.ASSETS
if (fs.existsSync(workerSrc)) {
  const workerWrapper = `import openNextWorker from "./worker.js";

export default {
  async fetch(request, env, ctx) {
    if (env) {
      globalThis.__CLOUDFLARE_ENV__ = env;
      if (env.DB) {
        globalThis.DB = env.DB;
      }
      if (env.R2_BUCKET) {
        globalThis.R2_BUCKET = env.R2_BUCKET;
      }
      if (env.BUCKET) {
        globalThis.BUCKET = env.BUCKET;
      }
    }

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

    // 2. Direct high-performance Cloudflare R2 file streaming
    if (url.pathname.startsWith("/api/files/") && request.method === "GET") {
      const bucket = env.R2_BUCKET || env.BUCKET;
      if (bucket) {
        try {
          const key = decodeURIComponent(url.pathname.replace(/^\\/api\\/files\\//, ""));
          const obj = await bucket.get(key);
          if (obj && obj.body) {
            const headers = new Headers();
            headers.set("Content-Type", obj.httpMetadata?.contentType || "image/png");
            if (obj.size) headers.set("Content-Length", String(obj.size));
            if (obj.httpEtag) headers.set("ETag", obj.httpEtag);
            headers.set("Cache-Control", "public, max-age=31536000, immutable");
            return new Response(obj.body, { status: 200, headers });
          }
        } catch (e) {
          console.error("Direct R2 streaming error:", e);
        }
      }
    }

    // 3. Dynamic execution via OpenNext Next.js server
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
  console.log("✅ Created smart .open-next/_worker.js wrapper with direct R2 streaming and env.ASSETS fallback");

  // Clean up any stray _worker.js inside assets dir that would cause relative import errors
  const strayWorkerAssets = path.join(assetsDir, "_worker.js");
  if (fs.existsSync(strayWorkerAssets)) {
    fs.unlinkSync(strayWorkerAssets);
  }
} else {
  console.warn("⚠️ worker.js not found in .open-next");
}

// 3. Generate _routes.json for Cloudflare Pages
const routesConfig = JSON.stringify({
  version: 1,
  include: ["/*"],
  exclude: [
    "/_next/static/*",
    "/assets/*",
    "/images/*",
    "/uploads/*",
    "/logo.png",
    "/favicon.ico"
  ]
}, null, 2);

fs.writeFileSync(path.join(openNextDir, "_routes.json"), routesConfig, "utf8");
console.log("✅ Created .open-next/_routes.json");

console.log("Cloudflare Pages bundle preparation completed successfully.");
