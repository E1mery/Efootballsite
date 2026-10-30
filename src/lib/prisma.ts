import { PrismaClient } from "@prisma/client";
import { PrismaD1 } from "@prisma/adapter-d1";

// Cache for request-scoped Prisma clients in Cloudflare Workers runtime
const requestPrismaClients = new WeakMap<object, PrismaClient>();
let fallbackEdgePrisma: PrismaClient | null = null;
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
                  const freshStmt =
                    boundArgs.length > 0 ? rawDb.prepare(query).bind(...boundArgs) : rawDb.prepare(query);
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

function createResilientD1Binding(rawDb: any): any {
  if (!rawDb || typeof rawDb !== "object") return rawDb;

  return new Proxy(rawDb, {
    get(target, prop, receiver) {
      const orig = Reflect.get(target, prop, receiver);
      if (typeof orig !== "function") return orig;

      if (prop === "prepare") {
        return function (query: string) {
          const stmt = orig.call(target, query);
          return wrapD1PreparedStatement(target, query, stmt);
        };
      }

      if (prop === "batch" || prop === "exec") {
        return async function (...args: any[]) {
          let attempt = 0;
          const maxRetries = 2;
          while (true) {
            try {
              return await orig.apply(target, args);
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

      return orig.bind(target);
    },
  });
}

function getActivePrisma(): PrismaClient {
  try {
    const cfStore = getCloudflareStore();
    let db =
      cfStore?.env?.DB ||
      cfStore?.env?.efrl_db ||
      cfStore?.env?.D1 ||
      cfStore?.env?.DATABASE;

    if (!db) {
      const fallbackEnv = (globalThis as any)?.__CLOUDFLARE_ENV__ || {};
      db =
        fallbackEnv.DB ||
        fallbackEnv.efrl_db ||
        fallbackEnv.D1 ||
        fallbackEnv.DATABASE ||
        (globalThis as any)?.DB;
    }

    if (db) {
      const key =
        cfStore?.ctx && typeof cfStore.ctx === "object"
          ? cfStore.ctx
          : cfStore && typeof cfStore === "object"
          ? cfStore
          : null;

      if (key) {
        let client = requestPrismaClients.get(key);
        if (!client) {
          const resilientDb = createResilientD1Binding(db);
          const adapter = new PrismaD1(resilientDb);
          client = new PrismaClient({ adapter });
          requestPrismaClients.set(key, client);
        }
        return client;
      }

      if (!fallbackEdgePrisma) {
        const resilientDb = createResilientD1Binding(db);
        const adapter = new PrismaD1(resilientDb);
        fallbackEdgePrisma = new PrismaClient({ adapter });
      }
      return fallbackEdgePrisma;
    }
  } catch {}

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
