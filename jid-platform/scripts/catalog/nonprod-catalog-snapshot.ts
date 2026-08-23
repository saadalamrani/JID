import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import postgres from 'postgres'
import { loadEnvFile } from '../lib/p110-env'

export const NONPROD_REF = 'hmjuijmaefajdjrjdsxu'
export const FORBIDDEN_PROD_REF = 'znfhladafpajyjwcfzvv'
export const FOUNDER_SOURCE_KEY = 'founder.manifest-2026-08-05'
export const REPORT_DIR = join(process.cwd(), 'docs/command-center/reports')

export type NonprodEnv = Record<string, string>

export function loadNonprodEnv(): NonprodEnv {
  return { ...loadEnvFile('.env.seed.nonprod'), ...process.env }
}

export function assertNonprodTarget(env: NonprodEnv): void {
  const url = env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const db = env.SEED_DATABASE_URL ?? ''
  if (!url.includes(NONPROD_REF) || !db.includes(NONPROD_REF)) {
    throw new Error(`NONPROD_IMPORT_BLOCKED_WITH_EXACT_CAUSE: target ref is not ${NONPROD_REF}`)
  }
  if (url.includes(FORBIDDEN_PROD_REF) || db.includes(FORBIDDEN_PROD_REF)) {
    throw new Error('NONPROD_IMPORT_BLOCKED_WITH_EXACT_CAUSE: production credentials detected')
  }
  if (env.NEXT_PUBLIC_APP_ENV === 'production') {
    throw new Error('NONPROD_IMPORT_BLOCKED_WITH_EXACT_CAUSE: APP_ENV=production')
  }
}

export function createNonprodSql(env: NonprodEnv) {
  assertNonprodTarget(env)
  const dbUrl = env.SEED_DATABASE_URL
  if (!dbUrl) throw new Error('NONPROD_IMPORT_BLOCKED_WITH_EXACT_CAUSE: SEED_DATABASE_URL missing')
  return postgres(dbUrl, { max: 1, prepare: false, ssl: 'require' })
}

export async function captureSnapshot(sql: ReturnType<typeof createNonprodSql>) {
  const counts = await sql`
    SELECT metric, value FROM (
      SELECT 'companies_total' AS metric, count(*)::text AS value FROM companies
      UNION ALL SELECT 'companies_active_business', count(*)::text FROM companies WHERE is_active AND entity_type='business'
      UNION ALL SELECT 'companies_active_university', count(*)::text FROM companies WHERE is_active AND entity_type='university'
      UNION ALL SELECT 'companies_null_sector', count(*)::text FROM companies WHERE sector_id IS NULL AND is_active
      UNION ALL SELECT 'companies_null_region', count(*)::text FROM companies WHERE region_id IS NULL AND is_active
      UNION ALL SELECT 'regions', count(*)::text FROM regions
      UNION ALL SELECT 'sectors', count(*)::text FROM sectors
      UNION ALL SELECT 'directory_sources', count(*)::text FROM directory_sources
      UNION ALL SELECT 'directory_sync_runs', count(*)::text FROM directory_sync_runs
      UNION ALL SELECT 'directory_raw_evidence', count(*)::text FROM directory_raw_evidence
      UNION ALL SELECT 'directory_import_candidates', count(*)::text FROM directory_import_candidates
      UNION ALL SELECT 'directory_review_queue', count(*)::text FROM directory_review_queue
      UNION ALL SELECT 'directory_dead_letters', count(*)::text FROM directory_dead_letters
      UNION ALL SELECT 'business_profiles', count(*)::text FROM business_profiles
      UNION ALL SELECT 'university_profiles', count(*)::text FROM university_profiles
      UNION ALL SELECT 'verification_requests', count(*)::text FROM verification_requests
      UNION ALL SELECT 'lammah_import_candidates', count(*)::text FROM lammah_import_candidates
    ) s ORDER BY metric
  `

  const candidateStates = await sql`
    SELECT state, count(*)::int AS count
    FROM directory_import_candidates
    GROUP BY state
    ORDER BY state
  `

  const regionSlugs = await sql`SELECT slug FROM regions ORDER BY slug`
  const sectorCount = await sql`SELECT count(*)::int AS count FROM sectors`
  const duplicateDomains = await sql`
    SELECT d AS domain, count(*)::int AS company_count
    FROM companies c, unnest(c.domains) d
    WHERE c.is_active
    GROUP BY d
    HAVING count(*) > 1
    ORDER BY count(*) DESC, d
    LIMIT 20
  `

  const protectedOrgs = await sql`
    SELECT id, name, name_ar, domains, entity_type, is_active, sector_id, region_id
    FROM companies
    WHERE lower(name) LIKE '%aramco%'
       OR lower(name) LIKE '%sabic%'
       OR domains && ARRAY['aramco.com','aramco.sa','sabic.com','sabic.sa','ksu.edu.sa','kau.edu.sa']::text[]
    ORDER BY name
  `

  const catalogFlags = await sql`
    SELECT key, is_enabled FROM feature_flags WHERE key ILIKE 'catalog%' ORDER BY key
  `

  const sources = await sql`
    SELECT source_key, qualification_state, lifecycle_state
    FROM directory_sources
    ORDER BY source_key
  `

  const founderExisting = await sql`
    SELECT count(*)::int AS count
    FROM directory_import_candidates c
    JOIN directory_sources s ON s.id = c.source_id
    WHERE s.source_key = ${FOUNDER_SOURCE_KEY}
  `

  return {
    capturedAt: new Date().toISOString(),
    targetProjectRef: NONPROD_REF,
    counts: Object.fromEntries(counts.map((r) => [r.metric, Number(r.value)])),
    candidateStates: candidateStates.map((r) => ({ state: r.state, count: r.count })),
    regionSlugs: regionSlugs.map((r) => r.slug),
    sectorCount: sectorCount[0]?.count ?? 0,
    duplicateDomains,
    protectedOrgs,
    catalogFlags,
    sources,
    founderExistingCount: founderExisting[0]?.count ?? 0,
  }
}

export function formatSnapshotMarkdown(
  title: string,
  snapshot: Awaited<ReturnType<typeof captureSnapshot>>,
): string {
  const lines = [
    `# ${title}`,
    '',
    `**Captured:** ${snapshot.capturedAt}`,
    `**Target project ref:** \`${snapshot.targetProjectRef}\``,
    '',
    '## Table counts',
    '',
    '| Metric | Count |',
    '| --- | ---: |',
    ...Object.entries(snapshot.counts).map(([k, v]) => `| ${k} | ${v} |`),
    '',
    '## Candidate states',
    '',
    '| State | Count |',
    '| --- | ---: |',
    ...snapshot.candidateStates.map((r) => `| ${r.state} | ${r.count} |`),
    '',
    `## Regions (${snapshot.regionSlugs.length})`,
    '',
    snapshot.regionSlugs.map((s) => `- \`${s}\``).join('\n'),
    '',
    `## Sectors: ${snapshot.sectorCount}`,
    '',
    '## Duplicate active domains',
    '',
    snapshot.duplicateDomains.length === 0
      ? '_None._'
      : snapshot.duplicateDomains.map((r) => `- \`${r.domain}\`: ${r.company_count}`).join('\n'),
    '',
    '## Protected / reconcile targets',
    '',
    '| ID | Name | Domains | Entity | Active |',
    '| --- | --- | --- | --- | --- |',
    ...snapshot.protectedOrgs.map(
      (r) =>
        `| \`${r.id}\` | ${r.name} | ${(r.domains ?? []).join(', ')} | ${r.entity_type} | ${r.is_active} |`,
    ),
    '',
    '## Catalog feature flags',
    '',
    '| Key | Enabled |',
    '| --- | --- |',
    ...snapshot.catalogFlags.map((r) => `| ${r.key} | ${r.is_enabled} |`),
    '',
    '## Directory sources',
    '',
    '| Source | Qualification | Lifecycle |',
    '| --- | --- | --- |',
    ...snapshot.sources.map(
      (r) => `| ${r.source_key} | ${r.qualification_state} | ${r.lifecycle_state} |`,
    ),
    '',
    `## Existing founder-source candidates: ${snapshot.founderExistingCount}`,
    '',
  ]
  return lines.join('\n')
}

export async function writeSnapshotReport(
  filename: string,
  title: string,
  snapshot: Awaited<ReturnType<typeof captureSnapshot>>,
) {
  writeFileSync(join(REPORT_DIR, filename), formatSnapshotMarkdown(title, snapshot), 'utf8')
}
