/**
 * Forward-only Wave 12 apply to jid-nonprod. Refuses production.
 * Refuses apply until WAVE_11_COMPLETE exists in git history.
 * Does not repair migration history and does not use --include-all.
 */
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')
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
  ['20260831160000', 'supabase/migrations/20260831160000_wave12_university_reporting.sql'],
  ['20260831160100', 'supabase/migrations/20260831160100_wave12_university_reporting_grants.sql'],
]

async function main() {
  const root = path.resolve(__dirname, '..')
  const marker = execSync('git log --all --grep=WAVE_11_COMPLETE -1 --format=%H', {
    cwd: path.resolve(root, '..'),
    encoding: 'utf8',
  }).trim()
  if (!marker) {
    throw new Error('WAVE_11_COMPLETE not found; refusing Wave 12 apply')
  }
  process.stdout.write('WAVE_11_COMPLETE SHA ' + marker + '\n')

  const env = readEnv(path.join(root, '.env.seed.nonprod'))
  const dbUrl = env.SEED_DATABASE_URL
  if (!dbUrl) throw new Error('SEED_DATABASE_URL missing')
  if (dbUrl.includes('znfhladafpajyjwcfzvv')) throw new Error('refusing production')
  if (!dbUrl.includes('hmjuijmaefajdjrjdsxu')) throw new Error('refusing unknown database host')

  const sql = postgres(dbUrl, { ssl: 'require', max: 1, idle_timeout: 5 })
  try {
    const versions = await sql`
      select version from supabase_migrations.schema_migrations
      where version like '20260831%'
      order by version
    `
    process.stdout.write(
      'nonprod recent versions: ' + versions.map((row) => row.version).join(', ') + '\n',
    )
    const have = new Set(versions.map((row) => row.version))
    const pending = VERSIONS.filter(([version]) => !have.has(version))
    process.stdout.write(
      'pending Wave 12: ' + (pending.map(([version]) => version).join(', ') || 'NONE') + '\n',
    )

    for (const [version, rel] of VERSIONS) {
      if (have.has(version)) {
        process.stdout.write('already applied ' + version + '\n')
        continue
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
