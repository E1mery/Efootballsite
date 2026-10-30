import { PrismaClient } from "@prisma/client";
import { PrismaD1 } from "@prisma/adapter-d1";

let localPrisma: PrismaClient | null = null;
let edgePrisma: PrismaClient | null = null;
let currentDbBinding: any = null;

function getActivePrisma(): PrismaClient {
  try {
    // Dynamic import/require of Cloudflare context
    const { getCloudflareContext } = require("@opennextjs/cloudflare");
    const ctx = getCloudflareContext({ async: false });
    const db = ctx?.env?.DB;

    if (db) {
      if (!edgePrisma || currentDbBinding !== db) {
        currentDbBinding = db;
        const adapter = new PrismaD1(db);
        edgePrisma = new PrismaClient({ adapter });
      }
      return edgePrisma;
    }
  } catch {
    // Running in local Node environment or during build
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
    const client = getActivePrisma() as any;
    const value = client[prop];
    return typeof value === "function" ? value.bind(client) : value;
  },
});

export default prisma;
