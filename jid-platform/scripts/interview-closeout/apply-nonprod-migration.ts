/**
 * Apply a single forward-only SQL file to authorized nonprod only.
 * Usage: pnpm exec tsx scripts/interview-closeout/apply-nonprod-migration.ts supabase/migrations/FILE.sql
 */
import { readFileSync } from 'node:fs'
import { basename } from 'node:path'
import { createNonprodSql, loadNonprodEnv } from '../catalog/nonprod-catalog-snapshot'

async function main() {
  const file = process.argv[2]
  if (!file) throw new Error('migration path required')
  const env = loadNonprodEnv()
  const sql = createNonprodSql(env)
  const body = readFileSync(file, 'utf8')
  await sql.unsafe(body)
  const version = basename(file).slice(0, 14)
  const name = basename(file).replace(/^\d+_/, '').replace(/\.sql$/, '')
  await sql`
    INSERT INTO supabase_migrations.schema_migrations (version, name)
    VALUES (${version}, ${name})
    ON CONFLICT (version) DO NOTHING
  `
  console.log(JSON.stringify({ applied: basename(file), version }, null, 2))
  await sql.end()
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
