/**
 * Apply opportunities schema bootstrap on cloud (sectors/regions FK + job columns).
 * Run: pnpm tsx scripts/apply-cloud-opportunities-bootstrap.ts
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

function loadEnvLocal() {
  const path = resolve(process.cwd(), '.env.local')
  const text = readFileSync(path, 'utf-8')
  const env: Record<string, string> = {}
  for (const line of text.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx === -1) continue
    env[trimmed.slice(0, idx)] = trimmed.slice(idx + 1)
  }
  return env
}

async function main() {
  const env = loadEnvLocal()
  const url = env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
    process.exit(1)
  }

  const sqlPath = resolve(process.cwd(), 'supabase/migrations/100_cloud_opportunities_bootstrap.sql')
  const sql = readFileSync(sqlPath, 'utf-8')

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { error } = await admin.rpc('exec_sql' as never, { query: sql } as never)
  if (error?.message?.includes('exec_sql')) {
    console.log(
      'No exec_sql RPC — paste supabase/migrations/100_cloud_opportunities_bootstrap.sql into Supabase SQL Editor and run it there.',
    )
    console.log('Then run: pnpm supabase gen types typescript --project-id znfhladafpajyjwcfzvv > src/lib/supabase/types.ts')
    process.exit(0)
  }

  if (error) {
    console.error('Bootstrap failed:', error.message)
    process.exit(1)
  }

  console.log('Bootstrap applied. Regenerating types is recommended.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
