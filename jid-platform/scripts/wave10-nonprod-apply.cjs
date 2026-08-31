/**
 * Forward-only Wave 10 apply to jid-nonprod. Refuses production.
 * Does not repair migration history and does not use --include-all.
 * Must run only after Wave 9 lineage reconciliation.
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

const VERSIONS = [
  ['20260831140000', 'supabase/migrations/20260831140000_wave10_university_foundation.sql'],
  ['20260831140100', 'supabase/migrations/20260831140100_wave10_university_foundation_grants.sql'],
]

async function main() {
  const root = path.resolve(__dirname, '..')
  const env = readEnv(path.join(root, '.env.seed.nonprod'))
  const dbUrl = env.SEED_DATABASE_URL
  if (!dbUrl) throw new Error('SEED_DATABASE_URL missing')
  if (dbUrl.includes('znfhladafpajyjwcfzvv')) throw new Error('refusing production')
  if (!dbUrl.includes('hmjuijmaefajdjrjdsxu')) throw new Error('refusing unknown database host')

  const sql = postgres(dbUrl, { ssl: 'require', max: 1, idle_timeout: 5 })
  try {
    const versions = await sql`
      select version from supabase_migrations.schema_migrations
      where version like '20260831%' or version like '20260830%'
      order by version
    `
    process.stdout.write(
      'nonprod recent versions: ' + versions.map((row) => row.version).join(', ') + '\n',
    )
    const have = new Set(versions.map((row) => row.version))

    if (!have.has('20260831130000') || !have.has('20260831130100')) {
      process.stdout.write(
        'WARNING: Wave 9 versions not in schema_migrations; continuing Wave 10 apply after git reconcile onto Wave 9 SHA\n',
      )
    }

    const collisions = await sql`
      select proname from pg_proc
      where pronamespace = 'public'::regnamespace
        and proname in (
          'create_university_identity_mapping',
          'university_owner_foundation_snapshot',
          'declare_university_affiliation'
        )
    `

    for (const [version, rel] of VERSIONS) {
      if (have.has(version)) {
        process.stdout.write('already applied ' + version + '\n')
        continue
      }
      if (version === '20260831140000' && collisions.length > 0) {
        throw new Error('object collision: ' + collisions.map((row) => row.proname).join(','))
      }
      const body = fs.readFileSync(path.join(root, rel), 'utf8')
      await sql.begin(async (tx) => {
        await tx.unsafe(body)
        await tx`insert into supabase_migrations.schema_migrations(version) values (${version})`
      })
      process.stdout.write('APPLIED ' + version + ' to jid-nonprod\n')
    }
  } finally {
    await sql.end({ timeout: 5 })
  }
}

main().catch((error) => {
  process.stderr.write(String(error && error.stack ? error.stack : error) + '\n')
  process.exit(1)
})
