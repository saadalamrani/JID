/**
 * Controlled nonprod import + staff publication of researched Lammah opportunities.
 *
 * Usage:
 *   pnpm exec tsx scripts/interview-closeout/lammah-real-opportunities-import.ts
 *   pnpm exec tsx scripts/interview-closeout/lammah-real-opportunities-import.ts --execute --i-confirm-non-production
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { createNonprodSql, loadNonprodEnv } from '../catalog/nonprod-catalog-snapshot'
import { SEED_PASSWORD } from '../lib/seed-safety'

const ADMIN_EMAIL = 'admin@jidseed.test'
const NOTES =
  'Interview closeout: official source re-verified 2026-08-23; external opportunity; application is at the official source, not inside JID.'

type Inventory = {
  source_proposals: Array<{
    source_key: string
    name: string
    base_url: string
    source_type: 'career_page' | 'official_program'
    allowed_source_hosts: string[]
    allowed_apply_hosts: string[]
    supported_opportunity_types: string[]
  }>
  ingest_records: Array<Record<string, unknown> & { source_record_id: string; source_page_url: string }>
  import_actions: Array<{
    action: string
    source_key: string
    source_record_key: string | null
  }>
}

const ORG_DOMAIN: Record<string, string> = {
  'Saudi Aramco': 'aramco.com',
  Elm: 'elm.sa',
  'King Abdullah University of Science and Technology': 'kaust.edu.sa',
  KAUST: 'kaust.edu.sa',
  'Human Resources Development Fund': 'hrdf.org.sa',
  HRDF: 'hrdf.org.sa',
}

const SKIP_PUBLISH_ORGS = new Set(['ACWA Power'])
const SKIP_INGEST_SOURCE_KEYS = new Set(['careers_acwapower_com'])

const INGEST_KEYS = [
  'source_record_id',
  'checksum_sha256',
  'request_identity',
  'source_page_url',
  'apply_url',
  'final_apply_url',
  'redirect_chain',
  'url_validation_evidence',
  'retrieved_at',
  'source_published_at',
  'source_deadline_at',
  'opportunity_type',
  'title_original',
  'title_ar',
  'title_en',
  'organization_raw_name',
  'location_country',
  'location_region',
  'location_city',
  'payload_body',
  'sanitized_projection',
  'content_type',
  'personal_data_dominated',
  'hostile_content',
] as const

function parseArgs(argv: string[]) {
  return { execute: argv.includes('--execute') && argv.includes('--i-confirm-non-production') }
}

function loadInventory(): Inventory {
  const path = join(
    process.cwd(),
    'docs/command-center/reports/lammah-real-opportunities-2026-08-23/JID_REAL_OPPORTUNITIES_CURRENT_INVENTORY.json',
  )
  return JSON.parse(readFileSync(path, 'utf8')) as Inventory
}

async function staffClient(env: Record<string, string>): Promise<SupabaseClient> {
  const client = createClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data, error } = await client.auth.signInWithPassword({
    email: ADMIN_EMAIL,
    password: SEED_PASSWORD,
  })
  if (error || !data.user) throw new Error(`staff login failed: ${error?.message ?? 'missing session'}`)
  return client
}

function rpcResult(data: unknown, error: { message: string } | null): { ok: boolean; code: string; data: unknown } {
  if (error) return { ok: false, code: error.message, data: null }
  const result = (data ?? {}) as { ok?: boolean; code?: string }
  return { ok: result.ok === true, code: result.code ?? 'unknown', data }
}

function ingestPayload(record: Inventory['ingest_records'][number]): Record<string, unknown> {
  const payload: Record<string, unknown> = {}
  for (const key of INGEST_KEYS) {
    payload[key] = record[key] ?? null
  }
  return payload
}

function resolveCompanyId(org: string, companyByDomain: Map<string, string>): string | undefined {
  const domain = ORG_DOMAIN[org]
  if (!domain) return undefined
  const exact = companyByDomain.get(domain)
  if (exact) return exact
  for (const [candidate, id] of companyByDomain) {
    if (candidate === domain || candidate.endsWith(`.${domain}`)) return id
  }
  return undefined
}

function robotsAllowsJobPaths(body: string): boolean {
  if (!body.trim()) return false
  const lines = body.split(/\r?\n/).map((line) => line.trim().toLowerCase())
  let inStarGroup = false
  for (const line of lines) {
    if (line.startsWith('user-agent:')) {
      inStarGroup = line.slice('user-agent:'.length).trim() === '*'
      continue
    }
    if (inStarGroup && (line === 'disallow: /' || line === 'disallow:/')) {
      return false
    }
  }
  return true
}

async function fetchRobots(url: string): Promise<{ ok: boolean; status: number; body: string }> {
  try {
    const response = await fetch(url, {
      redirect: 'follow',
      signal: AbortSignal.timeout(20000),
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; JID-research/1.0)' },
    })
    const body = await response.text()
    return { ok: response.ok, status: response.status, body: body.slice(0, 4000) }
  } catch {
    return { ok: false, status: 0, body: '' }
  }
}

async function qualifyRobots(source: Inventory['source_proposals'][number]) {
  const urls = [new URL('/robots.txt', source.base_url).toString()]
  if (source.source_key === 'admissions_kaust_edu_sa') {
    urls.push('https://apply.kaust.edu.sa/robots.txt')
  }
  for (const url of urls) {
    const robots = await fetchRobots(url)
    const allowed = robots.ok && robotsAllowsJobPaths(robots.body)
    if (allowed) {
      return {
        robotsOk: true,
        robotsFetched: true,
        robotsUrl: url,
        note: 'Official robots.txt does not disallow public job/program detail paths used as evidence.',
      }
    }
  }
  return {
    robotsOk: false,
    robotsFetched: false,
    robotsUrl: urls[0],
    note: 'robots.txt unreachable or disallows crawl; source left unqualified for worker ingest.',
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const env = loadNonprodEnv()
  const sql = createNonprodSql(env)
  const inventory = loadInventory()

  const flags = await sql`
    SELECT key, is_enabled FROM feature_flags WHERE key ILIKE 'lammah%' ORDER BY key
  `
  const sources = await sql`
    SELECT source_key, approval_state, robots_ok, is_active FROM lammah_sources ORDER BY source_key
  `
  const publicOpps = await sql`
    SELECT count(*)::int AS count FROM lammah_opportunities WHERE status = 'active'
  `
  const mappedOrgs = await sql`
    SELECT name, domains
    FROM companies
    WHERE is_active
      AND domains && ARRAY['aramco.com','elm.sa','kaust.edu.sa','hrdf.org.sa']::text[]
    ORDER BY name
  `

  console.log(
    JSON.stringify(
      {
        dryRun: !args.execute,
        flags,
        sources,
        activeOpportunities: publicOpps[0],
        mappedOrgs,
        ingestCount: inventory.ingest_records.length,
      },
      null,
      2,
    ),
  )

  if (!args.execute) {
    await sql.end()
    return
  }

  await sql.unsafe(`
    UPDATE feature_flags SET is_enabled = true, updated_at = now()
    WHERE key IN ('lammah.phase1_ingestion', 'lammah.connector_enabled');
    UPDATE feature_flags SET is_enabled = false, updated_at = now()
    WHERE key = 'lammah.auto_publication_enabled';
  `)

  const reviewer = await sql`SELECT id FROM profiles WHERE role = 'super_admin' ORDER BY created_at LIMIT 1`
  const reviewerId = String(reviewer[0]?.id ?? 'interview-closeout')

  for (const source of inventory.source_proposals) {
    const robots = await qualifyRobots(source)
    const qualify = robots.robotsOk && !SKIP_INGEST_SOURCE_KEYS.has(source.source_key)
    await sql`
      INSERT INTO lammah_sources (
        source_key, name, base_url, source_type, trust_tier, is_active, robots_ok,
        crawl_frequency_hours, program_scope, approval_state, licence_basis,
        terms_url, terms_reviewed_at, robots_url, robots_reviewed_at, robots_review_result,
        apply_url_pattern, record_identity_strategy, technical_format, evidence_retention_terms,
        confidence_policy, rate_limit_policy, authoritative_fields, supported_opportunity_types,
        parser_name, parser_version, health_state, auto_publication_enabled, allowed_apply_hosts,
        allowed_source_hosts, qualification_reviewer, approved_at
      ) VALUES (
        ${source.source_key},
        ${source.name},
        ${source.base_url},
        ${source.source_type},
        1,
        ${qualify},
        ${qualify},
        24,
        'lammah',
        ${qualify ? 'approved' : 'candidate'},
        ${'Official public career/program pages. JID stores provenance and a sanitized evidence projection only; application remains at the official source.'},
        ${source.base_url},
        ${new Date().toISOString()},
        ${robots.robotsUrl},
        ${new Date().toISOString()},
        ${robots.note},
        ${'Official HTTPS job or program detail URL; final destination validated before publication.'},
        ${'Official source_record_id plus content checksum.'},
        ${'official_public_pages'},
        ${'Sanitized JSON evidence retained 180 days; metadata and provenance retained.'},
        ${sql.json({ minimum_fact_confidence: 0.85, allowed_methods: ['source_structured', 'parser', 'staff_entry'] })},
        ${sql.json({ max_pages: 1, max_records: 20, min_delay_ms: 1500, request_timeout_ms: 15000, retry_limit: 3 })},
        ${['source_record_id', 'title.original', 'organization.raw_name', 'opportunity.type', 'url.apply', 'url.source_page']},
        ${source.supported_opportunity_types},
        ${`${source.source_key}_official_page`},
        ${'1.0.0'},
        ${'unknown'},
        false,
        ${source.allowed_apply_hosts},
        ${source.allowed_source_hosts},
        ${reviewerId},
        ${qualify ? new Date().toISOString() : null}
      )
      ON CONFLICT (source_key) DO UPDATE SET
        allowed_source_hosts = EXCLUDED.allowed_source_hosts,
        allowed_apply_hosts = EXCLUDED.allowed_apply_hosts,
        robots_ok = EXCLUDED.robots_ok,
        approval_state = EXCLUDED.approval_state,
        approved_at = EXCLUDED.approved_at,
        robots_url = EXCLUDED.robots_url,
        robots_reviewed_at = EXCLUDED.robots_reviewed_at,
        robots_review_result = EXCLUDED.robots_review_result,
        licence_basis = EXCLUDED.licence_basis,
        terms_url = EXCLUDED.terms_url,
        terms_reviewed_at = EXCLUDED.terms_reviewed_at,
        apply_url_pattern = EXCLUDED.apply_url_pattern,
        record_identity_strategy = EXCLUDED.record_identity_strategy,
        technical_format = EXCLUDED.technical_format,
        evidence_retention_terms = EXCLUDED.evidence_retention_terms,
        confidence_policy = EXCLUDED.confidence_policy,
        rate_limit_policy = EXCLUDED.rate_limit_policy,
        authoritative_fields = EXCLUDED.authoritative_fields,
        supported_opportunity_types = EXCLUDED.supported_opportunity_types,
        parser_name = EXCLUDED.parser_name,
        parser_version = EXCLUDED.parser_version,
        qualification_reviewer = EXCLUDED.qualification_reviewer,
        is_active = EXCLUDED.is_active,
        auto_publication_enabled = false,
        updated_at = now()
    `
    console.log(JSON.stringify({ source: source.source_key, qualify, robots }))
  }

  await sql.unsafe('GRANT lammah_worker TO postgres WITH SET TRUE;')
  await sql`SET ROLE lammah_worker`

  const ingestBySource = new Map<string, Inventory['ingest_records']>()
  for (const action of inventory.import_actions) {
    if (action.action !== 'ingest_review_candidate' || !action.source_record_key) continue
    if (SKIP_INGEST_SOURCE_KEYS.has(action.source_key)) continue
    const record = inventory.ingest_records.find((row) => row.source_record_id === action.source_record_key)
    if (!record) continue
    const list = ingestBySource.get(action.source_key) ?? []
    list.push(record)
    ingestBySource.set(action.source_key, list)
  }

  const ingestResults: Array<Record<string, unknown>> = []
  for (const [sourceKey, records] of ingestBySource) {
    const began = await sql`
      SELECT public.lammah_begin_source_run(
        ${sourceKey},
        ${`interview-closeout-${sourceKey}-${Date.now()}`},
        ${'full'},
        ${'lammah_worker'}
      ) AS result
    `
    const beginResult = began[0]?.result as { ok?: boolean; code?: string; run_id?: string }
    if (!beginResult?.ok || !beginResult.run_id) {
      ingestResults.push({ sourceKey, begin: beginResult })
      continue
    }
    for (const record of records) {
      const ingested = await sql`
        SELECT public.ingest_lammah_candidate(
          ${beginResult.run_id}::uuid,
          ${sql.json(ingestPayload(record))}::jsonb
        ) AS result
      `
      ingestResults.push({
        sourceKey,
        record: record.source_record_id,
        result: ingested[0]?.result,
      })
    }
    const finished = await sql`
      SELECT public.lammah_finish_run(
        ${beginResult.run_id}::uuid,
        ${'succeeded'},
        ${records.length},
        ${1},
        ${0},
        ${sql.json({})}::jsonb,
        NULL,
        NULL
      ) AS result
    `
    ingestResults.push({ sourceKey, finish: finished[0]?.result })
  }

  await sql`RESET ROLE`
  console.log(JSON.stringify({ ingestResults }, null, 2))

  const companies = await sql`
    SELECT id, name, domains FROM companies WHERE is_active
  `
  const companyByDomain = new Map<string, string>()
  for (const row of companies) {
    for (const domain of (row.domains as string[] | null) ?? []) {
      companyByDomain.set(domain.toLowerCase(), String(row.id))
    }
  }

  const client = await staffClient(env)
  const pending = await sql`
    SELECT id, source_record_id, organization_raw_name, state
    FROM lammah_import_candidates
    WHERE source_record_id IN ${sql(inventory.ingest_records.map((row) => row.source_record_id))}
    ORDER BY organization_raw_name, source_record_id
  `

  const publishResults: Array<Record<string, unknown>> = []
  for (const row of pending) {
    const org = String(row.organization_raw_name ?? '')
    if (SKIP_PUBLISH_ORGS.has(org) || String(row.state) === 'published') {
      publishResults.push({
        record: row.source_record_id,
        skipped: String(row.state) === 'published' ? 'already_published' : 'directory_mapping_unavailable',
        org,
        state: row.state,
      })
      continue
    }
    const companyId = resolveCompanyId(org, companyByDomain)
    if (!companyId) {
      publishResults.push({
        candidateId: row.id,
        record: row.source_record_id,
        skipped: 'directory_mapping_unavailable',
        org,
      })
      continue
    }

    const claimed = rpcResult(
      ...(await client
        .rpc('staff_claim_lammah_candidate', { p_candidate_id: row.id })
        .then((response) => [response.data, response.error] as const)),
    )
    const mapped = rpcResult(
      ...(await client
        .rpc('staff_review_lammah_candidate', {
          p_candidate_id: row.id,
          p_action: 'map_organization',
          p_notes: NOTES,
          p_resolved_company_id: companyId,
        })
        .then((response) => [response.data, response.error] as const)),
    )
    const approved = rpcResult(
      ...(await client
        .rpc('staff_review_lammah_candidate', {
          p_candidate_id: row.id,
          p_action: 'approve',
          p_notes: NOTES,
        })
        .then((response) => [response.data, response.error] as const)),
    )
    if (!approved.ok) {
      publishResults.push({ record: row.source_record_id, claimed, mapped, approved })
      continue
    }
    const published = rpcResult(
      ...(await client
        .rpc('staff_publish_lammah_candidate', { p_candidate_id: row.id, p_notes: NOTES })
        .then((response) => [response.data, response.error] as const)),
    )
    publishResults.push({ record: row.source_record_id, org, companyId, published })
  }

  const after = await sql`
    SELECT count(*)::int AS count FROM lammah_opportunities WHERE status = 'active'
  `
  console.log(JSON.stringify({ publishResults, activeAfter: after[0] }, null, 2))
  await sql.end()
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
