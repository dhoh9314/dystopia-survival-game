import { PrismaClient } from '../generated/prisma/index.js'

// Neither a libsql:// URL nor a JWT should ever legitimately contain
// whitespace. Stripping all of it (not just leading/trailing) guards
// against copy-pasting a value that picked up an embedded line break —
// e.g. from a chat UI or terminal that visually wrapped a long token —
// which a plain .trim() wouldn't catch since the break isn't at the edges.
function stripWhitespace(value) {
  return value?.replace(/\s+/g, '')
}

// Local dev uses a plain SQLite file (better-sqlite3). In production, point
// TURSO_DATABASE_URL (+ TURSO_AUTH_TOKEN) at a Turso/LibSQL database instead
// so data survives redeploys — Render's own disk is ephemeral. Both are
// SQLite-wire-compatible, so the schema and every query stay identical.
async function createAdapter() {
  if (process.env.TURSO_DATABASE_URL) {
    const { PrismaLibSql } = await import('@prisma/adapter-libsql')
    return new PrismaLibSql({
      url: stripWhitespace(process.env.TURSO_DATABASE_URL),
      authToken: stripWhitespace(process.env.TURSO_AUTH_TOKEN),
    })
  }

  const { PrismaBetterSqlite3 } = await import('@prisma/adapter-better-sqlite3')
  return new PrismaBetterSqlite3({ url: process.env.DATABASE_URL })
}

const adapter = await createAdapter()
export const prisma = new PrismaClient({ adapter })
