import { PrismaClient } from '@prisma/client'
// Updated: 2026-05-05T08:39:25

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  (globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'],
  })) as any

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db