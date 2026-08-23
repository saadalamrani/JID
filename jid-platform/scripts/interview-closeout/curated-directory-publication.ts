/**
 * Controlled nonprod Directory publication for the interview demo.
 *
 * Uses staff/super-admin JWT RPCs only:
 *   review_directory_candidate (validate_domain + approve)
 *   publish_directory_candidate
 *
 * Never production. Never auto-publishes the full 106 high-confidence set.
 *
 * Usage:
 *   pnpm exec tsx scripts/interview-closeout/curated-directory-publication.ts
 *   pnpm exec tsx scripts/interview-closeout/curated-directory-publication.ts --execute --i-confirm-non-production
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { createNonprodSql, loadNonprodEnv } from '../catalog/nonprod-catalog-snapshot'
import { SEED_PASSWORD } from '../lib/seed-safety'

const ADMIN_EMAIL = 'admin@jidseed.test'
const REVIEW_NOTES =
  'Interview closeout curated publication: official identity and domain confirmed from founder-source evidence; no repeated-domain or sector-mapping blocker; Directory-only write with no Profile or Verification side effect.'

type QueueRow = {
  queue_id: string
  candidate_id: string
  name_en: string | null
  domain: string | null
  candidate_state: string
  queue_status: string
  review_flags: string[] | null
  domain_fact_state: string | null
  published_company_id: string | null
}

const CURATED_CANDIDATE_IDS = [
  'c0e8d436-7217-4ac1-85ac-63c4b3b49486',
  '5b8621a3-8cf8-4fff-ba3f-8c0fd141a597',
  '737c9067-c56a-456d-b6bb-93626c49f07a',
  'a59959a2-786a-4b77-9898-e788b615ea80',
  '89e21792-efac-4c86-95cb-464e07537ca9',
  'bd0e2a78-f33b-4bf1-9a21-a36739dd85ea',
  '7f7ed152-b2a4-4d07-b8b4-6e06276f581d',
  '75589a1d-6060-4a0c-9af1-022d0722c916',
  '49bc5f2e-5ac1-49b1-929f-547706bd1027',
  '026d20d3-bf0a-49e8-9658-bd59415bde04',
  'd8d4bb99-fd53-4dd2-a8f7-478d86fd3633',
  'db4125d3-cecb-478c-8e2c-476b120e9cec',
  'b3cc5565-0e88-4c79-8ea8-7450ef6f14a8',
  '088811e1-e940-4301-8abf-419cb1c6e3c7',
  'c9ab4c5e-e461-4026-ac40-a435155915d4',
  '65d88506-6bbd-4c6d-bf75-cb056cac6534',
  '832e6dfa-9e2e-4037-979e-3d965f5e7560',
  '650bd318-48c9-444b-9d09-3a93cfe81566',
  '9e99763a-4e6a-4a72-ad87-c50fb159ad81',
  'a1a09023-460e-44e7-a81e-035d8edf5beb',
  'c7c29d07-965e-43e1-af57-32e87d70f1eb',
  '7eafe05f-b19a-4137-9d60-0adce2b5363f',
  'ccc89b48-cdab-406e-bd2d-cfc189e6cdfc',
  'f552ed87-797c-4c31-bdaa-b1976f0699d4',
  '0380618d-bfb0-4d8c-838a-f1dee42cdbbf',
  'efae9b47-fece-429c-a96b-dc1eaf1f82d7',
  '5e0a446e-b78d-488b-a20b-50e1d7b2a7d4',
  '8383839a-aae0-4ea9-9041-1b563370bd4b',
  'f621fab1-ac8b-4761-a47d-e7bacb0b244d',
  '2f4636cd-2fae-4c94-a208-da9984c41cb7',
  '54330902-3379-4bd6-897f-23fcdcadf0d4',
  '8ecab4a0-b016-4e20-a404-bd02685ab1f0',
  '31612f7c-b4dc-494a-9b34-b4607f9599fe',
  '8ced1ebe-60b4-48a0-a06c-f2ca4aec7519',
] as const

const BLOCKING_FLAGS = [
  'domain_conflict',
  'personal_data_review',
  'inactive_entity',
  'ambiguous_match',
  'sector_mapping_review_required',
  'repeated_domain',
] as const

function parseArgs(argv: string[]) {
  return {
    execute: argv.includes('--execute') && argv.includes('--i-confirm-non-production'),
  }
}

async function staffClient(env: Record<string, string>): Promise<SupabaseClient> {
  const client = createClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data, error } = await client.auth.signInWithPassword({
    email: ADMIN_EMAIL,
    password: SEED_PASSWORD,
  })
  if (error || !data.session?.access_token || !data.user) {
    throw new Error(`staff login failed: ${error?.message ?? 'missing session'}`)
  }
  return client
}

function rpcResult(data: unknown, error: { message: string } | null): { ok: boolean; code: string } {
  if (error) return { ok: false, code: error.message }
  const result = (data ?? {}) as { ok?: boolean; code?: string }
  return { ok: result.ok === true, code: result.code ?? 'unknown' }
}

function hasBlockingFlag(flags: string[] | null): boolean {
  return (flags ?? []).some((flag) => (BLOCKING_FLAGS as readonly string[]).includes(flag))
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const env = loadNonprodEnv()
  const sql = createNonprodSql(env)

  const rows = (await sql`
    SELECT
      q.id AS queue_id,
      c.id AS candidate_id,
      c.normalized_identity AS name_en,
      (
        SELECT CASE jsonb_typeof(f.normalized_value)
          WHEN 'array' THEN f.normalized_value #>> '{0}'
          ELSE NULLIF(btrim(f.normalized_value #>> '{}'), '')
        END
        FROM directory_candidate_facts f
        WHERE f.candidate_id = c.id
          AND f.fact_key = 'official_domains'
          AND f.state = 'active'
        ORDER BY f.observed_at DESC
        LIMIT 1
      ) AS domain,
      c.state AS candidate_state,
      q.status AS queue_status,
      c.review_flags,
      (
        SELECT f.reviewer_edit_state
        FROM directory_candidate_facts f
        WHERE f.candidate_id = c.id
          AND f.fact_key = 'official_domains'
          AND f.state = 'active'
        ORDER BY f.observed_at DESC
        LIMIT 1
      ) AS domain_fact_state,
      COALESCE(q.publication_company_id, c.published_directory_id) AS published_company_id
    FROM directory_review_queue q
    JOIN directory_import_candidates c ON c.id = q.candidate_id
    WHERE c.id IN ${sql(CURATED_CANDIDATE_IDS)}
    ORDER BY c.normalized_identity
  `) as unknown as QueueRow[]

  const snapshot = await sql`
    SELECT
      (SELECT count(*)::int FROM companies WHERE is_active AND entity_type = 'business' AND slug NOT ILIKE 'seed-%') AS public_business,
      (SELECT count(*)::int FROM regions) AS regions,
      (SELECT count(*)::int FROM sectors) AS sectors
  `

  console.log(
    JSON.stringify(
      {
        dryRun: !args.execute,
        curatedRequested: CURATED_CANDIDATE_IDS.length,
        queueHits: rows.length,
        snapshot: snapshot[0],
        rows: rows.map((row) => ({
          candidateId: row.candidate_id,
          name: row.name_en,
          domain: row.domain,
          state: row.candidate_state,
          queue: row.queue_status,
          flags: row.review_flags,
          domainFact: row.domain_fact_state,
          publishedCompanyId: row.published_company_id,
          blocked: hasBlockingFlag(row.review_flags),
        })),
      },
      null,
      2,
    ),
  )

  if (!args.execute) {
    await sql.end()
    return
  }

  const client = await staffClient(env)
  const results: Array<Record<string, unknown>> = []

  for (const row of rows) {
    if (
      row.published_company_id ||
      row.candidate_state === 'published' ||
      row.queue_status === 'published'
    ) {
      results.push({ candidateId: row.candidate_id, skipped: 'already_published' })
      continue
    }
    if (hasBlockingFlag(row.review_flags) || !row.domain) {
      results.push({
        candidateId: row.candidate_id,
        skipped: 'evidence_gate',
        flags: row.review_flags,
        domain: row.domain,
      })
      continue
    }

    await client.rpc('catalog_claim_review_item', { p_review_queue_id: row.queue_id }).then(
      () => undefined,
      () => undefined,
    )

    if (row.domain_fact_state !== 'accepted') {
      const validated = rpcResult(
        ...(await client
          .rpc('staff_review_directory_candidate', {
            p_review_queue_id: row.queue_id,
            p_action: 'validate_domain',
            p_notes: REVIEW_NOTES,
            p_domain: row.domain,
            p_evidence_url: `https://${row.domain}`,
          })
          .then((response) => [response.data, response.error] as const)),
      )
      if (!validated.ok) {
        results.push({ candidateId: row.candidate_id, step: 'validate_domain', ...validated })
        continue
      }
    }

    const approved = rpcResult(
      ...(await client
        .rpc('staff_review_directory_candidate', {
          p_review_queue_id: row.queue_id,
          p_action: 'approve',
          p_notes: REVIEW_NOTES,
        })
        .then((response) => [response.data, response.error] as const)),
    )
    if (!approved.ok) {
      results.push({ candidateId: row.candidate_id, step: 'approve', ...approved })
      continue
    }

    const published = rpcResult(
      ...(await client
        .rpc('staff_publish_directory_candidate', { p_review_queue_id: row.queue_id })
        .then((response) => [response.data, response.error] as const)),
    )
    results.push({ candidateId: row.candidate_id, name: row.name_en, step: 'publish', ...published })
  }

  const after = await sql`
    SELECT
      (SELECT count(*)::int FROM companies WHERE is_active AND entity_type = 'business' AND slug NOT ILIKE 'seed-%') AS public_business
  `
  console.log(JSON.stringify({ results, after: after[0] }, null, 2))
  await sql.end()
}

main().catch(async (error) => {
  console.error(error)
  process.exit(1)
})
