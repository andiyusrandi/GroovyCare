import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function purgePrismaRequireCache() {
  if (typeof require !== "undefined" && require.cache) {
    Object.keys(require.cache).forEach((key) => {
      if (key.includes(".prisma") || key.includes("@prisma")) {
        delete require.cache[key];
      }
    });
  }
}

export function getFreshDb(): PrismaClient {
  if (globalForPrisma.prisma) {
    try {
      const dmmf = (globalForPrisma.prisma as any)._dmmf;
      if (dmmf && dmmf.modelMap && dmmf.modelMap.PromoCoupon) {
        const fields = dmmf.modelMap.PromoCoupon.fields || [];
        const hasMinQty = fields.some((f: any) => f.name === "minQuantity");
        if (hasMinQty) {
          return globalForPrisma.prisma;
        }
      }
    } catch {}
  }

  delete globalForPrisma.prisma;
  purgePrismaRequireCache();

  try {
    const { PrismaClient: FreshClient } = require("@prisma/client");
    const fresh = new FreshClient();
    if (process.env.NODE_ENV !== "production") {
      globalForPrisma.prisma = fresh;
    }
    return fresh;
  } catch {
    const fresh = new PrismaClient();
    if (process.env.NODE_ENV !== "production") {
      globalForPrisma.prisma = fresh;
    }
    return fresh;
  }
}

export const db: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const instance = getFreshDb() as any;
    const value = instance[prop];
    return typeof value === "function" ? value.bind(instance) : value;
  },
});
