import { PrismaClient } from "@prisma/client";
import { PrismaD1 } from "@prisma/adapter-d1";

// Request-scoped Prisma client cache using WeakMap keyed by the request's active D1 database binding
const prismaClientsByDb = new WeakMap<any, PrismaClient>();
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

function getActivePrisma(): PrismaClient {
  try {
    const rawDb = getRawD1Binding();
    if (rawDb) {
      if (typeof rawDb === "object" && rawDb !== null) {
        let client = prismaClientsByDb.get(rawDb);
        if (!client) {
          const adapter = new PrismaD1(rawDb);
          client = new PrismaClient({ adapter });
          prismaClientsByDb.set(rawDb, client);
        }
        return client;
      }
      const adapter = new PrismaD1(rawDb);
      return new PrismaClient({ adapter });
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
