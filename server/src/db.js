import { PrismaClient } from '../generated/prisma/index.js'

// Local dev uses a plain SQLite file (better-sqlite3). In production, point
// TURSO_DATABASE_URL (+ TURSO_AUTH_TOKEN) at a Turso/LibSQL database instead
// so data survives redeploys — Render's own disk is ephemeral. Both are
// SQLite-wire-compatible, so the schema and every query stay identical.
async function createAdapter() {
  if (process.env.TURSO_DATABASE_URL) {
    const { PrismaLibSql } = await import('@prisma/adapter-libsql')
    return new PrismaLibSql({
      // .trim() guards against a stray trailing newline from copy-pasting
      // these into a dashboard env var field — a near-invisible but fatal
      // mistake, since a JWT with an embedded \n fails header construction.
      url: process.env.TURSO_DATABASE_URL.trim(),
      authToken: process.env.TURSO_AUTH_TOKEN?.trim(),
    })
  }

  const { PrismaBetterSqlite3 } = await import('@prisma/adapter-better-sqlite3')
  return new PrismaBetterSqlite3({ url: process.env.DATABASE_URL })
}

const adapter = await createAdapter()
export const prisma = new PrismaClient({ adapter })
