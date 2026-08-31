/**
 * Read-only snapshot of nonprod schema_migrations rows for 024/025 only.
 * Refuses production. Does not mutate.
 */
const fs = require('fs')
const path = require('path')
const postgres = require('postgres')

function readEnv(file) {
  const raw = fs.readFileSync(file, 'utf8')
  const out = {}
  for (const line of raw.split(/\r?\n/)) {
    if (!line || line.trim().startsWith('#') || !line.includes('=')) continue
    const idx = line.indexOf('=')
    out[line.slice(0, idx).trim()] = line.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '')
  }
  return out
}

async function main() {
  const root = path.resolve(__dirname, '..')
  const env = readEnv(path.join(root, '.env.seed.nonprod'))
  const dbUrl = env.SEED_DATABASE_URL
  if (!dbUrl) throw new Error('SEED_DATABASE_URL missing')
  if (dbUrl.includes('znfhladafpajyjwcfzvv')) throw new Error('refusing production')
  if (!dbUrl.includes('hmjuijmaefajdjrjdsxu')) throw new Error('refusing unknown host')

  const sql = postgres(dbUrl, { ssl: 'require', max: 1, idle_timeout: 5 })
  try {
    const cols = await sql`
      select column_name
      from information_schema.columns
      where table_schema = 'supabase_migrations' and table_name = 'schema_migrations'
      order by ordinal_position
    `
    const rows = await sql`
      select version, name
      from supabase_migrations.schema_migrations
      where version like '024%' or version like '025%'
      order by version
    `
    process.stdout.write(JSON.stringify({ columns: cols.map((c) => c.column_name), rows }, null, 2) + '\n')
  } finally {
    await sql.end({ timeout: 5 })
  }
}

main().catch((error) => {
  process.stderr.write(String(error && error.stack ? error.stack : error) + '\n')
  process.exit(1)
})
