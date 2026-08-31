/**
 * Wave 12 RLS/privacy actor matrix against jid-nonprod.
 * All fixture writes run inside a transaction that always rolls back.
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
  if (!dbUrl.includes('hmjuijmaefajdjrjdsxu')) throw new Error('refusing unknown host')
  if (dbUrl.includes('znfhladafpajyjwcfzvv')) throw new Error('refusing production')

  const sql = postgres(dbUrl, { ssl: 'require', max: 1, idle_timeout: 5 })
  try {
    const body = fs.readFileSync(
      path.join(root, 'tests/rls/wave12-university-reporting.matrix.sql'),
      'utf8',
    )
    const result = await sql.unsafe(body)
    const tokens = JSON.stringify(result)
    if (!tokens.includes('WAVE12_RLS_ACTOR_MATRIX_PASS')) {
      throw new Error('unexpected matrix result: ' + tokens.slice(0, 500))
    }
    process.stdout.write('WAVE12_RLS_MATRIX PASS\n')
  } finally {
    await sql.end({ timeout: 5 })
  }
}

main().catch((error) => {
  process.stderr.write(String(error && error.stack ? error.stack : error) + '\n')
  process.exit(1)
})
