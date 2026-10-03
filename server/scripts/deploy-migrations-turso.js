// Applies prisma/migrations/*/migration.sql to a Turso/LibSQL database in
// order, tracking what's already applied in a small bookkeeping table.
//
// Why not `prisma migrate deploy`? Prisma's migrate engine talks to SQLite
// via a native file-based connector; it doesn't go through the driver
// adapter used by the Prisma Client at runtime, so it doesn't reliably
// understand a remote libsql:// URL. This script reuses the same
// @libsql/client the running app already depends on for its real queries,
// so the connectivity path is the same one already proven to work.
//
// No-ops (exit 0) when TURSO_DATABASE_URL isn't set, so it's safe to always
// run this in the deploy pipeline — local/non-Turso deploys just skip it.

import 'dotenv/config'
import { createClient } from '@libsql/client'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const migrationsDir = path.join(__dirname, '../prisma/migrations')

const url = process.env.TURSO_DATABASE_URL
const authToken = process.env.TURSO_AUTH_TOKEN

if (!url) {
  console.log('[migrate-turso] TURSO_DATABASE_URL not set, skipping (using local SQLite).')
  process.exit(0)
}

const client = createClient({ url, authToken })

await client.execute(`
  CREATE TABLE IF NOT EXISTS _migrations_applied (
    name TEXT PRIMARY KEY,
    applied_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`)

const { rows } = await client.execute('SELECT name FROM _migrations_applied')
const applied = new Set(rows.map((r) => r.name))

const folders = fs
  .readdirSync(migrationsDir)
  .filter((f) => fs.statSync(path.join(migrationsDir, f)).isDirectory())
  .sort()

let appliedCount = 0
for (const folder of folders) {
  if (applied.has(folder)) continue

  const sqlPath = path.join(migrationsDir, folder, 'migration.sql')
  const sql = fs.readFileSync(sqlPath, 'utf-8')
  const statements = sql
    .split(/;\s*(?:\r?\n|$)/)
    .map((s) => s.trim())
    .filter(Boolean)

  console.log(`[migrate-turso] applying ${folder} (${statements.length} statement(s))`)
  for (const statement of statements) {
    await client.execute(statement)
  }
  await client.execute({ sql: 'INSERT INTO _migrations_applied (name) VALUES (?)', args: [folder] })
  appliedCount++
}

console.log(`[migrate-turso] done — ${appliedCount} new migration(s) applied, ${folders.length} total.`)
process.exit(0)
