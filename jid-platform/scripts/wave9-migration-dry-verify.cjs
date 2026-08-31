/**
 * Read-only: compare local migration files to jid-nonprod schema_migrations.
 * Never writes. Refuses production.
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

  const files = fs
    .readdirSync(path.join(root, 'supabase/migrations'))
    .filter((name) => name.endsWith('.sql'))
    .map((name) => name.split('_')[0])
    .sort()

  const sql = postgres(dbUrl, { ssl: 'require', max: 1, idle_timeout: 5 })
  try {
    const rows = await sql`select version from supabase_migrations.schema_migrations order by version`
    const remote = rows.map((row) => row.version)
    const pending = files.filter((version) => !remote.includes(version))
    const wave9 = ['20260831130000', '20260831130100']
    const wave10 = ['20260831140000', '20260831140100']
    process.stdout.write(
      JSON.stringify(
        {
          local_count: files.length,
          remote_count: remote.length,
          pending: pending.length ? pending : 'NONE',
          wave9: Object.fromEntries(wave9.map((v) => [v, remote.includes(v) ? 'APPLIED' : 'MISSING'])),
          wave10: Object.fromEntries(wave10.map((v) => [v, remote.includes(v) ? 'APPLIED' : 'MISSING'])),
        },
        null,
        2,
      ) + '\n',
    )
    if (pending.length) process.exit(2)
  } finally {
    await sql.end({ timeout: 5 })
  }
}

main().catch((error) => {
  process.stderr.write(String(error && error.stack ? error.stack : error) + '\n')
  process.exit(1)
})
