/**
 * Nonprod catalogue content activation — Stage A–D.
 * Uses only jid-nonprod (.env.seed.nonprod). Never production.
 *
 * Usage:
 *   pnpm exec tsx scripts/catalog/activate-nonprod-content.ts --stage=a
 *   pnpm exec tsx scripts/catalog/activate-nonprod-content.ts --stage=b
 *   pnpm exec tsx scripts/catalog/activate-nonprod-content.ts --stage=c
 *   pnpm exec tsx scripts/catalog/activate-nonprod-content.ts --stage=d --runs=3
 *   pnpm exec tsx scripts/catalog/activate-nonprod-content.ts --inventory
 */
import { spawnSync } from 'node:child_process'
import { writeFileSync, unlinkSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { loadEnvFile } from '../lib/p110-env'
import { SEED_PASSWORD } from '../lib/seed-safety'

const ADMIN_EMAIL = 'admin@jidseed.test'
const NONPROD_REF = 'hmjuijmaefajdjrjdsxu'

function loadSeedEnv() {
  return {
    ...loadEnvFile('.env.seed.nonprod'),
    ...(process.env as Record<string, string>),
  }
}

function assertNonprod(env: Record<string, string>) {
  const url = env.NEXT_PUBLIC_SUPABASE_URL || ''
  const db = env.SEED_DATABASE_URL || ''
  if (!url.includes(NONPROD_REF) || !db.includes(NONPROD_REF)) {
    throw new Error('Refusing to run: env is not jid-nonprod (hmjuijmaefajdjrjdsxu)')
  }
  if (env.NEXT_PUBLIC_APP_ENV === 'production') {
    throw new Error('Refusing to run: APP_ENV=production')
  }
}

function runSql(dbUrl: string, sql: string): string {
  const dir = mkdtempSync(join(tmpdir(), 'jid-cat-'))
  const file = join(dir, 'q.sql')
  writeFileSync(file, sql, 'utf8')
  // Convert Windows path for docker mount
  const mount = file.replace(/\\/g, '/')
  const result = spawnSync(
    'docker',
    [
      'run',
      '--rm',
      '-i',
      '-v',
      `${mount}:/q.sql:ro`,
      'postgres:15-alpine',
      'psql',
      dbUrl,
      '-v',
      'ON_ERROR_STOP=1',
      '-f',
      '/q.sql',
    ],
    { encoding: 'utf8', maxBuffer: 20_000_000 },
  )
  try {
    unlinkSync(file)
  } catch {
    /* ignore */
  }
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || 'psql failed')
  }
  return result.stdout
}

function parseArgs(argv: string[]) {
  const stage = argv.find((a) => a.startsWith('--stage='))?.slice('--stage='.length)
  const runs = Number(argv.find((a) => a.startsWith('--runs='))?.slice('--runs='.length) ?? '1')
  return {
    stage,
    runs: Number.isFinite(runs) && runs > 0 ? Math.min(runs, 5) : 1,
    inventory: argv.includes('--inventory'),
    execute: argv.includes('--execute') && argv.includes('--i-confirm-non-production'),
  }
}

async function inventory(dbUrl: string) {
  const out = runSql(
    dbUrl,
    `
SELECT 'companies_active_business' AS metric, count(*)::text FROM companies WHERE is_active AND entity_type='business'
UNION ALL SELECT 'candidates', count(*)::text FROM directory_import_candidates
UNION ALL SELECT 'needs_review', count(*)::text FROM directory_import_candidates WHERE state='needs_review'
UNION ALL SELECT 'approved_pending_domain', count(*)::text FROM directory_import_candidates WHERE state='approved_pending_domain'
UNION ALL SELECT 'published_candidates', count(*)::text FROM directory_import_candidates WHERE state='published'
UNION ALL SELECT 'rejected', count(*)::text FROM directory_import_candidates WHERE state='rejected'
UNION ALL SELECT 'dead_letters', count(*)::text FROM directory_dead_letters
UNION ALL SELECT 'sync_runs', count(*)::text FROM directory_sync_runs
UNION ALL SELECT 'raw_evidence', count(*)::text FROM directory_raw_evidence
ORDER BY 1;
SELECT key, is_enabled FROM feature_flags WHERE key ILIKE '%catalog%' ORDER BY 1;
SELECT source_key, qualification_state, lifecycle_state, connector_enabled, page_size, max_pages_per_run, health_state
FROM directory_sources;
`,
  )
  console.log(out)
}

async function stageA(dbUrl: string) {
  console.log('=== Stage A: validate source + enable bounded connector ===')
  const out = runSql(
    dbUrl,
    `
-- Mirror configure_catalog_gleif with bounded budget (page_size=100, max_pages=2).
UPDATE public.feature_flags SET is_enabled=true, updated_at=now()
WHERE key IN ('catalog.phase1_ingestion', 'catalog.gleif_connector_enabled');

UPDATE public.directory_sources SET
  connector_enabled=true,
  page_size=100,
  max_pages_per_run=2,
  lifecycle_state='active',
  activated_at=COALESCE(activated_at, now()),
  suspended_at=NULL,
  suspension_reason=NULL,
  health_state='healthy'
WHERE source_key='gleif.lei-records-v1'
  AND qualification_state='qualified';

SELECT key, is_enabled FROM feature_flags WHERE key ILIKE 'catalog%';
SELECT source_key, qualification_state, lifecycle_state, connector_enabled, page_size, max_pages_per_run
FROM directory_sources WHERE source_key='gleif.lei-records-v1';

-- Worker identity exists (no service_role for connector)
SELECT rolname FROM pg_roles WHERE rolname IN ('catalog_worker','catalog_worker_gleif','catalog_function_owner');
SELECT name FROM vault.secrets WHERE name IN ('catalog_gleif_function_url','catalog_gleif_invocation_secret');
`,
  )
  console.log(out)
}

function vaultSecret(dbUrl: string, name: string): string {
  const out = runSql(
    dbUrl,
    `SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='${name}';`,
  )
  const lines = out
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('decrypted_secret') && !l.startsWith('-') && l !== '(1 row)')
  const secret = lines[0]
  if (!secret) throw new Error(`Missing vault secret: ${name}`)
  return secret
}

async function invokeGleif(
  dbUrl: string,
  opts: { startPage?: number; runId?: string },
): Promise<Record<string, unknown>> {
  const url = vaultSecret(dbUrl, 'catalog_gleif_function_url')
  const secret = vaultSecret(dbUrl, 'catalog_gleif_invocation_secret')
  const body = {
    runId:
      opts.runId ??
      `ACTIVATE-${new Date()
        .toISOString()
        .replace(/[-:.TZ]/g, '')
        .slice(0, 14)}`,
    ...(opts.startPage ? { startPage: opts.startPage } : {}),
  }
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-catalog-invocation-secret': secret,
    },
    body: JSON.stringify(body),
  })
  const text = await response.text()
  let json: Record<string, unknown>
  try {
    json = JSON.parse(text) as Record<string, unknown>
  } catch {
    json = { raw: text }
  }
  console.log(`GLEIF_HTTP=${response.status}`, JSON.stringify(json))
  return { status: response.status, ...json }
}

async function staffClient(env: Record<string, string>) {
  const base = createClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data, error } = await base.auth.signInWithPassword({
    email: ADMIN_EMAIL,
    password: SEED_PASSWORD,
  })
  if (error || !data.user || !data.session?.access_token) {
    throw new Error(`staff login failed: ${error?.message}`)
  }
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${data.session.access_token}` } },
  })
}

async function stageC(env: Record<string, string>, dbUrl: string) {
  console.log('=== Stage C: review needs_review → approve_pending_domain (no invented domains) ===')
  const client = await staffClient(env)

  const queueOut = runSql(
    dbUrl,
    `
SELECT q.id AS queue_id, c.id AS candidate_id, c.lei, c.source_entity_status, c.source_registration_status,
  c.review_flags::text, c.match_outcome
FROM directory_review_queue q
JOIN directory_import_candidates c ON c.id=q.candidate_id
WHERE c.state='needs_review' AND q.status IN ('pending','in_review','returned')
ORDER BY c.created_at;
`,
  )
  console.log(queueOut)

  const rows = runSql(
    dbUrl,
    `
SELECT q.id
FROM directory_review_queue q
JOIN directory_import_candidates c ON c.id=q.candidate_id
WHERE c.state='needs_review'
  AND q.status IN ('pending','in_review','returned')
  AND COALESCE(c.source_entity_status,'') = 'ACTIVE'
  AND NOT (c.review_flags && ARRAY['domain_conflict','personal_data_review','inactive_entity','ambiguous_match']::text[]);
`,
  )
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => /^[0-9a-f-]{36}$/i.test(l))

  let approvedPending = 0
  let returned = 0
  let failed = 0

  for (const queueId of rows) {
    await client.rpc('catalog_claim_review_item', { p_review_queue_id: queueId }).then(
      () => undefined,
      () => undefined,
    )

    const { data, error } = await client.rpc('catalog_review_pending_domain', {
      p_review_queue_id: queueId,
      p_notes:
        'Nonprod activation review: GLEIF ACTIVE entity with captured evidence checksum. Official domain not present in source; left pending domain — no invented website.',
    })
    if (error) {
      console.log(`REVIEW_FAIL queue=${queueId} err=${error.message}`)
      failed += 1
      continue
    }
    const result = (data ?? {}) as { ok?: boolean; code?: string }
    console.log(`REVIEW queue=${queueId} ok=${result.ok} code=${result.code}`)
    if (result.ok && result.code === 'approve_pending_domain') approvedPending += 1
    else failed += 1
  }

  console.log(
    JSON.stringify({ approvedPending, returned, failed, considered: rows.length }, null, 2),
  )
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const env = loadSeedEnv()
  assertNonprod(env)
  const dbUrl = env.SEED_DATABASE_URL!
  if (!args.execute && !args.inventory) {
    console.log('Dry-run only. Pass --execute --i-confirm-non-production to mutate nonprod.')
    await inventory(dbUrl)
    return
  }

  if (args.inventory || !args.stage) await inventory(dbUrl)

  if (args.stage === 'a') await stageA(dbUrl)
  if (args.stage === 'b') {
    console.log('=== Stage B: controlled ingestion batch ===')
    // Ensure enabled first
    await stageA(dbUrl)
    await invokeGleif(dbUrl, { startPage: 1 })
    await inventory(dbUrl)
  }
  if (args.stage === 'c') await stageC(env, dbUrl)
  if (args.stage === 'd') {
    console.log(`=== Stage D: bounded continuation runs=${args.runs} ===`)
    await stageA(dbUrl)
    for (let i = 0; i < args.runs; i += 1) {
      // Pages advance: run i uses startPage = 1 + i*2 (edge max_pages=2)
      const startPage = 1 + i * 2
      console.log(`--- run ${i + 1}/${args.runs} startPage=${startPage} ---`)
      const result = await invokeGleif(dbUrl, { startPage })
      const retrieved = Number(result.retrieved ?? 0)
      const accepted = Number(result.accepted ?? 0)
      const skipped = Number(result.skipped ?? 0)
      const errRate = retrieved > 0 ? skipped / retrieved : 0
      console.log(`err_or_skip_rate=${errRate.toFixed(3)}`)
      if (result.status === 401 || result.status === 403) {
        console.log('STOP: authorization failure')
        break
      }
      if (retrieved > 0 && errRate > 0.85 && accepted === 0) {
        console.log('STOP: abnormal skip/error rate with zero accepts')
        break
      }
    }
    await stageC(env, dbUrl)
    await inventory(dbUrl)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
