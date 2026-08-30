/**
 * Forward-only Wave 8 apply to jid-nonprod. Refuses production.
 * Does not repair migration history and does not use --include-all.
 */
const fs = require('fs')
const path = require('path')
const { Client } = require('pg')

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
  if (!dbUrl.includes('hmjuijmaefajdjrjdsxu')) throw new Error('refusing unknown database host')

  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } })
  await client.connect()
  try {
    const versions = await client.query(
      "select version from supabase_migrations.schema_migrations where version like '20260830%' order by version",
    )
    const have = new Set(versions.rows.map((row) => row.version))
    process.stdout.write(
      'nonprod 20260830 versions: ' + versions.rows.map((row) => row.version).join(', ') + '\n',
    )
    if (have.has('20260830220000') && have.has('20260830220100')) {
      process.stdout.write('Wave 8 already applied\n')
      return
    }

    if (!have.has('20260830220000')) {
      const collision = await client.query(
        "select proname from pg_proc where proname in ('search_discoverable_talent','invite_discoverable_talent','is_professionally_discoverable')",
      )
      if (collision.rows.length > 0) {
        throw new Error('object collision: ' + collision.rows.map((row) => row.proname).join(','))
      }
      const sql = fs.readFileSync(
        path.join(root, 'supabase/migrations/20260830220000_wave8_talent_sourcing.sql'),
        'utf8',
      )
      await client.query('begin')
      await client.query(sql)
      await client.query(
        "insert into supabase_migrations.schema_migrations(version) values ('20260830220000')",
      )
      await client.query('commit')
      process.stdout.write('APPLIED 20260830220000 to jid-nonprod\n')
    }

    if (!have.has('20260830220100')) {
      const grantSql = fs.readFileSync(
        path.join(root, 'supabase/migrations/20260830220100_wave8_talent_sourcing_grants.sql'),
        'utf8',
      )
      await client.query('begin')
      await client.query(grantSql)
      await client.query(
        "insert into supabase_migrations.schema_migrations(version) values ('20260830220100')",
      )
      await client.query('commit')
      process.stdout.write('APPLIED 20260830220100 to jid-nonprod\n')
    }
  } catch (error) {
    try {
      await client.query('rollback')
    } catch {
      /* ignore */
    }
    throw error
  } finally {
    await client.end()
  }
}

main().catch((error) => {
  process.stderr.write(String(error && error.stack ? error.stack : error) + '\n')
  process.exit(1)
})
