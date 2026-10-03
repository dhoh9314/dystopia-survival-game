import { PrismaClient } from '../generated/prisma/index.js'

// Local dev uses a plain SQLite file (better-sqlite3). In production, point
// TURSO_DATABASE_URL (+ TURSO_AUTH_TOKEN) at a Turso/LibSQL database instead
// so data survives redeploys — Render's own disk is ephemeral. Both are
// SQLite-wire-compatible, so the schema and every query stay identical.
async function createAdapter() {
  if (process.env.TURSO_DATABASE_URL) {
    const { PrismaLibSql } = await import('@prisma/adapter-libsql')
    return new PrismaLibSql({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    })
  }

  const { PrismaBetterSqlite3 } = await import('@prisma/adapter-better-sqlite3')
  return new PrismaBetterSqlite3({ url: process.env.DATABASE_URL })
}

const adapter = await createAdapter()
export const prisma = new PrismaClient({ adapter })
