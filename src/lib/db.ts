import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db: PrismaClient = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

export function getFreshDb(): PrismaClient {
  const current = (globalForPrisma.prisma || db) as any;
  if (current && current.passwordResetToken) {
    return current;
  }
  const fresh = new PrismaClient();
  globalForPrisma.prisma = fresh;
  return fresh;
}
