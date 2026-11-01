import { PrismaClient } from "@prisma/client";
import { PrismaD1 } from "@prisma/adapter-d1";

// Singleton Prisma client cache for Cloudflare Workers runtime
let edgePrismaClient: PrismaClient | null = null;
let localPrisma: PrismaClient | null = null;

export function isTransientD1Error(err: any): boolean {
  if (!err) return false;
  const msg = (err.message || String(err)).toLowerCase();
  return (
    msg.includes("connection closed") ||
    msg.includes("network connection lost") ||
    msg.includes("d1_error") ||
    msg.includes("network error") ||
    msg.includes("fetch failed") ||
    msg.includes("reset by peer") ||
    msg.includes("socket hang up") ||
    msg.includes("database is locked") ||
    msg.includes("sqlite_busy") ||
    msg.includes("timeout") ||
    msg.includes("timed out") ||
    msg.includes("broken pipe")
  );
}

function getCloudflareStore(): { env: any; ctx?: any; cf?: any } | null {
  try {
    const { getCloudflareContext } = require("@opennextjs/cloudflare");
    const cf = getCloudflareContext({ async: false });
    if (cf && (cf.env || cf.ctx)) {
      return cf;
    }
  } catch {}
  return null;
}

export function getRawD1Binding(): any {
  try {
    const cfStore = getCloudflareStore();
    const env = cfStore?.env || (globalThis as any)?.__CLOUDFLARE_ENV__ || {};
    return (
      env.DB ||
      env.efrl_db ||
      env.D1 ||
      env.DATABASE ||
      (globalThis as any)?.DB
    );
  } catch {
    return (globalThis as any)?.DB;
  }
}

function wrapD1PreparedStatement(rawDb: any, query: string, stmt: any, boundArgs: any[] = []): any {
  return new Proxy(stmt, {
    get(target, prop, receiver) {
      if (prop === "bind") {
        return function (...args: any[]) {
          const newStmt = target.bind(...args);
          return wrapD1PreparedStatement(rawDb, query, newStmt, args);
        };
      }

      if (prop === "raw" || prop === "run" || prop === "all" || prop === "first") {
        return async function (...args: any[]) {
          let attempt = 0;
          const maxRetries = 2;
          while (true) {
            try {
              return await target[prop](...args);
            } catch (err: any) {
              attempt++;
              if (attempt <= maxRetries && isTransientD1Error(err)) {
                console.warn(
                  `[D1 Statement] Transient error on ${String(prop)} (attempt ${attempt}/${maxRetries}): ${err?.message}. Reconnecting statement...`
                );
                await new Promise((r) => setTimeout(r, attempt * 80));
                try {
                  const currentDb = getRawD1Binding() || rawDb;
                  const freshStmt =
                    boundArgs.length > 0 ? currentDb.prepare(query).bind(...boundArgs) : currentDb.prepare(query);
                  return await freshStmt[prop](...args);
                } catch (retryErr: any) {
                  if (attempt >= maxRetries || !isTransientD1Error(retryErr)) {
                    throw retryErr;
                  }
                  continue;
                }
              }
              throw err;
            }
          }
        };
      }

      const val = Reflect.get(target, prop, receiver);
      return typeof val === "function" ? val.bind(target) : val;
    },
  });
}

function createDynamicResilientD1Binding(): any {
  return new Proxy({} as any, {
    get(_target, prop, receiver) {
      const activeDb = getRawD1Binding();
      if (!activeDb) {
        throw new Error("Cloudflare D1 database binding (DB) is not available in the current runtime context.");
      }

      if (prop === "prepare") {
        return function (query: string) {
          const stmt = activeDb.prepare(query);
          return wrapD1PreparedStatement(activeDb, query, stmt);
        };
      }

      if (prop === "batch" || prop === "exec") {
        return async function (...args: any[]) {
          let attempt = 0;
          const maxRetries = 2;
          while (true) {
            try {
              const currentDb = getRawD1Binding() || activeDb;
              return await currentDb[prop].apply(currentDb, args);
            } catch (err: any) {
              attempt++;
              if (attempt <= maxRetries && isTransientD1Error(err)) {
                console.warn(
                  `[D1 ${String(prop)}] Transient error (attempt ${attempt}/${maxRetries}): ${err?.message}. Retrying...`
                );
                await new Promise((r) => setTimeout(r, attempt * 100));
                continue;
              }
              throw err;
            }
          }
        };
      }

      const orig = activeDb[prop];
      return typeof orig === "function" ? orig.bind(activeDb) : orig;
    },
  });
}

function getActivePrisma(): PrismaClient {
  try {
    const rawDb = getRawD1Binding();
    if (rawDb) {
      if (!edgePrismaClient) {
        const dynamicResilientDb = createDynamicResilientD1Binding();
        const adapter = new PrismaD1(dynamicResilientDb);
        edgePrismaClient = new PrismaClient({ adapter });
      }
      return edgePrismaClient;
    }
  } catch (err) {
    console.error("[Prisma Edge Init Error]:", err);
  }

  if (!localPrisma) {
    localPrisma = new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });
  }

  return localPrisma;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    if (prop === "then" || typeof prop === "symbol") {
      return undefined;
    }

    const client = getActivePrisma() as any;
    const value = client[prop];
    return typeof value === "function" ? value.bind(client) : value;
  },
});

export default prisma;
