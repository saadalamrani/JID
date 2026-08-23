import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { DryRunActionClass, DryRunReport, DryRunRowOutcome, ExistingDirectoryRecord } from '@/lib/catalog/founder-source'
import {
  normalizeFounderRow,
  parseFounderSourceCsv,
  runFounderSourceDryRun,
} from '@/lib/catalog/founder-source'
import {
  FOUNDER_SOURCE_KEY,
  REPORT_DIR,
  assertNonprodTarget,
  captureSnapshot,
  createNonprodSql,
  loadNonprodEnv,
  writeSnapshotReport,
} from './nonprod-catalog-snapshot'

const MANIFEST_PATH = join(process.cwd(), 'data/catalog/JID_Catalog_Import_Manifest_2026-08-05.csv')
const BATCH_SIZE = 50
const EXTERNAL_RUN_ID = 'FOUNDER-IMPORT-2026-08-05-001'

const BASELINE = {
  total: 1000,
  reconcileExisting: 2,
  repeatedDomainRows: 14,
  highConfidence: 106,
  lowConfidence: 863,
  sectorReview: 15,
}

type Sql = ReturnType<typeof createNonprodSql>

type ImportCounters = {
  accepted: number
  replayed: number
  rejected: number
  classified: Record<DryRunActionClass, number>
}

function sha256(input: string): string {
  return createHash('sha256').update(input, 'utf8').digest('hex')
}

function parseArgs(argv: string[]) {
  return {
    execute: argv.includes('--execute') && argv.includes('--i-confirm-nonprod-import'),
    dryRunOnly: argv.includes('--dry-run-only'),
    idempotencyCheck: argv.includes('--idempotency-check'),
  }
}

async function loadExistingDirectory(sql: Sql): Promise<ExistingDirectoryRecord[]> {
  const rows = await sql`
    SELECT id, name, name_ar, domains, entity_type, slug
    FROM companies
    WHERE is_active = true
  `
  return rows.map((row) => ({
    id: row.id,
    name: row.name ?? '',
    nameAr: row.name_ar,
    domains: row.domains ?? [],
    entityType: row.entity_type === 'university' ? 'university' : 'business',
    slug: row.slug,
  }))
}

function assertDryRunBaseline(report: DryRunReport): void {
  const s = report.summary
  const mismatches: string[] = []
  if (s.totalSourceRows !== BASELINE.total) mismatches.push(`total ${s.totalSourceRows} != ${BASELINE.total}`)
  if (s.reconcileExisting !== BASELINE.reconcileExisting) {
    mismatches.push(`reconcile ${s.reconcileExisting} != ${BASELINE.reconcileExisting}`)
  }
  if (s.repeatedDomainRows !== BASELINE.repeatedDomainRows) {
    mismatches.push(`repeated-domain ${s.repeatedDomainRows} != ${BASELINE.repeatedDomainRows}`)
  }
  if (s.highConfidenceReviewCandidates !== BASELINE.highConfidence) {
    mismatches.push(`high-confidence ${s.highConfidenceReviewCandidates} != ${BASELINE.highConfidence}`)
  }
  if (s.lowConfidenceReviewCandidates !== BASELINE.lowConfidence) {
    mismatches.push(`low-confidence ${s.lowConfidenceReviewCandidates} != ${BASELINE.lowConfidence}`)
  }
  if (s.sectorMappingReviewRequired !== BASELINE.sectorReview) {
    mismatches.push(`sector-review ${s.sectorMappingReviewRequired} != ${BASELINE.sectorReview}`)
  }
  if (mismatches.length > 0) {
    throw new Error(`NONPROD_REALITY_DRIFT: dry-run baseline mismatch: ${mismatches.join('; ')}`)
  }
}

async function seedTaxonomy(sql: Sql): Promise<{ regions: number; sectors: number }> {
  const regionsSql = readFileSync(join(process.cwd(), 'supabase/seed/regions.sql'), 'utf8')
  const sectorsSql = readFileSync(join(process.cwd(), 'supabase/seed/sectors.sql'), 'utf8')
  await sql.unsafe(regionsSql)
  await sql.unsafe(sectorsSql)
  const regions = await sql`SELECT count(*)::int AS count FROM regions`
  const sectors = await sql`SELECT count(*)::int AS count FROM sectors`
  if ((regions[0]?.count ?? 0) < 13) {
    throw new Error('NONPROD_IMPORT_BLOCKED_WITH_EXACT_CAUSE: region taxonomy seed failed')
  }
  if ((sectors[0]?.count ?? 0) < 45) {
    throw new Error('NONPROD_IMPORT_BLOCKED_WITH_EXACT_CAUSE: sector taxonomy seed failed')
  }
  return { regions: regions[0]!.count, sectors: sectors[0]!.count }
}

async function ensureCatalogWorkerAccess(sql: Sql): Promise<void> {
  await sql.unsafe('GRANT catalog_worker TO postgres WITH SET TRUE;')
}

async function ensureFounderSource(sql: Sql): Promise<string> {
  const staff = await sql`
    SELECT id FROM profiles WHERE role = 'super_admin' ORDER BY created_at LIMIT 1
  `
  const staffId = staff[0]?.id
  if (!staffId) {
    throw new Error('NONPROD_IMPORT_BLOCKED_WITH_EXACT_CAUSE: super_admin profile missing')
  }

  const rows = await sql`
    INSERT INTO directory_sources (
      source_key, display_name, qualification_state, lifecycle_state,
      licence_reference, reference_url, permitted_fields, parser_name,
      parser_version, health_state, connector_enabled, connector_kind,
      responsible_staff_id, activated_at
    ) VALUES (
      ${FOUNDER_SOURCE_KEY},
      'Founder 1,000-Organization Manifest (2026-08-05)',
      'qualified',
      'active',
      'Founder-authorized governed catalog import manifest v2026-08-05',
      'internal://jid/catalog/founder-manifest-2026-08-05',
      ARRAY['legal_name','name_ar','official_domains','city']::text[],
      'founder-manifest',
      '1.0.0',
      'healthy',
      false,
      'manual',
      ${staffId}::uuid,
      now()
    )
    ON CONFLICT (source_key) DO UPDATE SET
      display_name = EXCLUDED.display_name,
      qualification_state = 'qualified',
      lifecycle_state = 'active',
      permitted_fields = EXCLUDED.permitted_fields,
      parser_name = EXCLUDED.parser_name,
      parser_version = EXCLUDED.parser_version,
      responsible_staff_id = EXCLUDED.responsible_staff_id,
      activated_at = COALESCE(directory_sources.activated_at, now()),
      updated_at = now()
    RETURNING id
  `
  return rows[0]!.id as string
}

async function createImportRun(sql: Sql, sourceId: string): Promise<string> {
  const existing = await sql`
    SELECT r.id
    FROM directory_sync_runs r
  JOIN directory_sources s ON s.id = r.source_id
    WHERE s.source_key = ${FOUNDER_SOURCE_KEY}
      AND r.external_run_id = ${EXTERNAL_RUN_ID}
    LIMIT 1
  `
  if (existing[0]?.id) return existing[0].id as string

  const rows = await sql`
    INSERT INTO directory_sync_runs (
      source_id, worker_identity, mode, parser_version, status, external_run_id, heartbeat_at
    ) VALUES (
      ${sourceId}::uuid,
      'founder_import_worker',
      'full',
      '1.0.0',
      'queued',
      ${EXTERNAL_RUN_ID},
      now()
    )
    RETURNING id
  `
  return rows[0]!.id as string
}

function buildReviewFlags(actionClass: DryRunActionClass): string[] {
  if (actionClass === 'repeated_domain_manual_review') return ['domain_conflict']
  if (actionClass === 'region_mapping_review_required') return ['unmapped_region']
  return []
}

function buildMatchOutcome(
  actionClass: DryRunActionClass,
  matchTargetId: string | null,
): 'new' | 'update_existing' | 'ambiguous' | 'duplicate_candidate' | 'quarantined' {
  if (actionClass === 'quarantined') return 'quarantined'
  if (actionClass === 'reconcile_existing' && matchTargetId) return 'update_existing'
  if (actionClass === 'repeated_domain_manual_review') return 'duplicate_candidate'
  return 'new'
}

function buildMatchReasons(outcome: DryRunRowOutcome, regionSlug: string | null, sectorSlug: string | null) {
  const reasons: Array<{ code: string; detail: string }> = [
    { code: 'founder_action_class', detail: outcome.actionClass },
    { code: 'proposed_publication_action', detail: 'REVIEW_FOR_PUBLICATION' },
    { code: 'source_record_id', detail: outcome.sourceRecordId },
  ]
  if (regionSlug) reasons.push({ code: 'canonical_region_slug', detail: regionSlug })
  if (sectorSlug) reasons.push({ code: 'canonical_sector_slug', detail: sectorSlug })
  if (outcome.repeatedDomainGroup) {
    reasons.push({ code: 'repeated_domain_group', detail: outcome.repeatedDomainGroup })
  }
  if (outcome.matchTargetId) {
    reasons.push({ code: 'deterministic_match_target', detail: outcome.matchTargetId })
  }
  return reasons
}

function rowChecksum(outcome: DryRunRowOutcome, row: ReturnType<typeof parseFounderSourceCsv>[number]): string {
  return sha256(
    JSON.stringify({
      sourceRecordId: outcome.sourceRecordId,
      nameEn: outcome.nameEn,
      nameAr: outcome.nameAr,
      domain: outcome.domain,
      actionClass: outcome.actionClass,
      region: row.sourceRegion,
      sector: row.sourceSector,
      ownership: row.ownershipClass,
      confidence: row.confidenceClass,
    }),
  )
}

function buildFacts(row: ReturnType<typeof parseFounderSourceCsv>[number], domain: string | null) {
  const observedAt = new Date().toISOString()
  const facts: Record<string, Record<string, unknown>> = {
    legal_name: {
      normalized_value: row.nameEn,
      original_value: row.nameEn,
      source_field: 'name_en',
      transformation: 'trim',
      confidence: 'high',
      confidence_reason: 'Founder manifest English legal name',
      authority_level: 'authoritative',
      observed_at: observedAt,
    },
    name_ar: {
      normalized_value: row.nameAr,
      original_value: row.nameAr,
      source_field: 'name_ar',
      transformation: 'none',
      confidence: 'high',
      confidence_reason: 'Founder manifest Arabic legal name',
      authority_level: 'authoritative',
      observed_at: observedAt,
    },
  }
  if (domain) {
    facts.official_domains = {
      normalized_value: [domain],
      original_value: [domain],
      source_field: 'website',
      transformation: 'domain_normalize',
      confidence: 'high',
      confidence_reason: 'Founder manifest website domain',
      authority_level: 'official',
      observed_at: observedAt,
    }
  }
  if (row.city) {
    facts.city = {
      normalized_value: row.city,
      original_value: row.city,
      source_field: 'city',
      transformation: 'none',
      confidence: 'medium',
      confidence_reason: 'Founder manifest city when present',
      authority_level: 'secondary',
      observed_at: observedAt,
    }
  }
  return facts
}

async function ingestBatch(
  sql: Sql,
  params: {
    sourceKey: string
    runId: string
    outcomes: DryRunRowOutcome[]
    rowsById: Map<string, ReturnType<typeof parseFounderSourceCsv>[number]>
    regionSlugByRecord: Map<string, string | null>
    sectorSlugByRecord: Map<string, string | null>
  },
): Promise<{ counters: ImportCounters; candidateUpdates: Array<{ candidateId: string; outcome: DryRunRowOutcome }> }> {
  const counters: ImportCounters = {
    accepted: 0,
    replayed: 0,
    rejected: 0,
    classified: {
      reconcile_existing: 0,
      repeated_domain_manual_review: 0,
      high_confidence_review_candidate: 0,
      low_confidence_review_candidate: 0,
      quarantined: 0,
      region_mapping_review_required: 0,
      sector_mapping_review_required: 0,
    },
  }
  const candidateUpdates: Array<{ candidateId: string; outcome: DryRunRowOutcome }> = []

  await sql`SET ROLE catalog_worker`
  await sql.begin(async (tx) => {
    for (const outcome of params.outcomes) {
      const row = params.rowsById.get(outcome.sourceRecordId)
      if (!row) continue

      const sourceRecordKey = `founder:${outcome.sourceRecordId}`
      const idempotencyKey = `founder-2026-08-05:${outcome.sourceRecordId}`
      const checksum = rowChecksum(outcome, row)
      const facts = buildFacts(row, outcome.domain)
      const candidate = {
        normalized_identity: row.nameEn,
        organization_type: 'business',
        deterministic_match_target: outcome.matchTargetId,
      }
      const evidenceMetadata = {
        content_type: 'text/csv',
        content_size_bytes: JSON.stringify(row).length,
        retrieved_at: new Date().toISOString(),
        licence_reference: 'Founder-authorized governed catalog import manifest v2026-08-05',
        parser_version: '1.0.0',
        personal_data_dominated: false,
      }

      const intakeRows = await tx`
        SELECT public.ingest_directory_candidate(
          ${params.sourceKey},
          ${params.runId}::uuid,
          ${sourceRecordKey},
          ${idempotencyKey},
          ${checksum},
          ${tx.json(evidenceMetadata)},
          ${tx.json(candidate)},
          ${tx.json(facts)}
        ) AS result
      `
      const result = intakeRows[0]?.result as Record<string, unknown>
      if (result?.ok === true && result.replayed === true) {
        counters.replayed += 1
      } else if (result?.ok === true) {
        counters.accepted += 1
      } else {
        counters.rejected += 1
        continue
      }

      counters.classified[outcome.actionClass] += 1
      candidateUpdates.push({ candidateId: String(result.candidate_id), outcome })
    }
  })
  await sql`RESET ROLE`

  for (const update of candidateUpdates) {
    const reviewFlags = buildReviewFlags(update.outcome.actionClass)
    const matchOutcome = buildMatchOutcome(update.outcome.actionClass, update.outcome.matchTargetId)
    const matchReasons = buildMatchReasons(
      update.outcome,
      params.regionSlugByRecord.get(update.outcome.sourceRecordId) ?? null,
      params.sectorSlugByRecord.get(update.outcome.sourceRecordId) ?? null,
    )
    await sql`
      UPDATE directory_import_candidates
      SET
        match_outcome = ${matchOutcome},
        match_reasons = ${sql.json(matchReasons)},
        review_flags = ${reviewFlags}
      WHERE id = ${update.candidateId}::uuid
    `
  }

  return { counters, candidateUpdates }
}

function writeReviewReports(report: DryRunReport, candidateIds: Map<string, string>) {
  const highConfidence = report.outcomes.filter(
    (o) => o.actionClass === 'high_confidence_review_candidate',
  )
  const repeated = report.outcomes.filter((o) => o.repeatedDomainGroup)
  const sectorReview = report.outcomes.filter(
    (o) => o.actionClass === 'sector_mapping_review_required',
  )

  const highLines = [
    '# JID High-Confidence Publication Review Manifest',
    '',
    `**Generated:** ${new Date().toISOString()}`,
    '**Proposed action for all rows:** `REVIEW_FOR_PUBLICATION` (not auto-publish)',
    '',
    '| candidate_id | name_en | name_ar | domain | region_status | sector_status | duplicate_risk | publication_blockers | proposed_action |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- |',
  ]
  for (const row of highConfidence) {
    highLines.push(
      `| ${candidateIds.get(row.sourceRecordId) ?? 'pending'} | ${row.nameEn} | ${row.nameAr} | ${row.domain ?? ''} | ${row.regionStatus} | ${row.sectorStatus} | ${row.repeatedDomainGroup ? 'repeated_domain' : 'none'} | awaiting_staff_review | REVIEW_FOR_PUBLICATION |`,
    )
  }
  writeFileSync(join(REPORT_DIR, 'JID_HIGH_CONFIDENCE_PUBLICATION_REVIEW_MANIFEST.md'), highLines.join('\n'), 'utf8')
  writeFileSync(
    join(REPORT_DIR, 'founder-high-confidence-publication-review.json'),
    JSON.stringify(
      highConfidence.map((row) => ({
        candidateId: candidateIds.get(row.sourceRecordId) ?? null,
        organizationNameEn: row.nameEn,
        organizationNameAr: row.nameAr,
        officialDomain: row.domain,
        confidenceClassification: row.actionClass,
        duplicateRiskStatus: row.repeatedDomainGroup ? 'repeated_domain_group' : 'none',
        publicationBlockers: ['staff_review_required', 'no_auto_publish_authorization'],
        proposedAction: 'REVIEW_FOR_PUBLICATION',
      })),
      null,
      2,
    ),
    'utf8',
  )

  const repeatedLines = [
    '# JID Repeated Domain Review',
    '',
    `**Generated:** ${new Date().toISOString()}`,
    '',
    ...report.repeatedDomainGroups.map((group) => {
      const members = report.outcomes.filter((o) => o.repeatedDomainGroup === group.domain)
      return [
        `## Domain: \`${group.domain}\``,
        '',
        '| source_record_id | candidate_id | name_en | name_ar | action |',
        '| --- | --- | --- | --- | --- |',
        ...members.map(
          (m) =>
            `| ${m.sourceRecordId} | ${candidateIds.get(m.sourceRecordId) ?? 'pending'} | ${m.nameEn} | ${m.nameAr} | REVIEW_REQUIRED |`,
        ),
        '',
        '_No automatic merge decision. Manual review required._',
        '',
      ].join('\n')
    }),
  ]
  writeFileSync(join(REPORT_DIR, 'JID_REPEATED_DOMAIN_REVIEW.md'), repeatedLines.join('\n'), 'utf8')

  const sectorLines = [
    '# JID Sector Mapping Review Required',
    '',
    `**Generated:** ${new Date().toISOString()}`,
    '',
    'Holding / conglomerate labels are organization structure — not operating-sector taxonomy.',
    '',
    '| source_record_id | candidate_id | name_en | source_sector | action |',
    '| --- | --- | --- | --- | --- |',
    ...sectorReview.map((row) => {
      const sourceRow = report.outcomes.find((o) => o.sourceRecordId === row.sourceRecordId)
      return `| ${row.sourceRecordId} | ${candidateIds.get(row.sourceRecordId) ?? 'pending'} | ${row.nameEn} | sector_mapping_review_required | NO_FORCED_SECTOR |`
    }),
  ]
  writeFileSync(join(REPORT_DIR, 'JID_SECTOR_MAPPING_REVIEW_REQUIRED.md'), sectorLines.join('\n'), 'utf8')
}

async function mapCandidateIds(sql: Sql, sourceKey: string): Promise<Map<string, string>> {
  const rows = await sql`
    SELECT c.id, c.source_record_key
    FROM directory_import_candidates c
    JOIN directory_sources s ON s.id = c.source_id
    WHERE s.source_key = ${sourceKey}
  `
  const map = new Map<string, string>()
  for (const row of rows) {
    const key = String(row.source_record_key).replace(/^founder:/, '')
    map.set(key, String(row.id))
  }
  return map
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const env = loadNonprodEnv()
  assertNonprodTarget(env)

  const manifest = readFileSync(MANIFEST_PATH, 'utf8')
  const rows = parseFounderSourceCsv(manifest)
  const sql = createNonprodSql(env)

  try {
    const preSnapshot = await captureSnapshot(sql)
    await writeSnapshotReport(
      'JID_NONPROD_CATALOG_PREIMPORT_SNAPSHOT.md',
      'JID Nonprod Catalog Pre-Import Snapshot',
      preSnapshot,
    )

    const existingDirectory = await loadExistingDirectory(sql)
    const dryRun = runFounderSourceDryRun({
      rows,
      existingDirectory,
      sourcePath: MANIFEST_PATH,
    })
    assertDryRunBaseline(dryRun)

    const aramco = existingDirectory.find((r) => r.domains.includes('aramco.com'))
    const sabic = existingDirectory.find((r) => r.domains.includes('sabic.com'))
    if (!aramco || !sabic) {
      throw new Error('NONPROD_IMPORT_BLOCKED_WITH_EXACT_CAUSE: Aramco/SABIC deterministic match missing')
    }

    if (!args.execute) {
      console.log(
        JSON.stringify(
          {
            mode: args.dryRunOnly ? 'dry-run-only' : 'preflight',
            targetProjectRef: preSnapshot.targetProjectRef,
            dryRunSummary: dryRun.summary,
            reconcileTargets: {
              aramco: aramco.id,
              sabic: sabic.id,
            },
            message: 'Pass --execute --i-confirm-nonprod-import to ingest',
          },
          null,
          2,
        ),
      )
      return
    }

    const taxonomy = await seedTaxonomy(sql)
    await ensureCatalogWorkerAccess(sql)
    const sourceId = await ensureFounderSource(sql)
    const runId = await createImportRun(sql, sourceId)

    const rowsById = new Map(rows.map((row) => [row.sourceRecordId, row]))
    const regionSlugByRecord = new Map<string, string | null>()
    const sectorSlugByRecord = new Map<string, string | null>()
    for (const row of rows) {
      const normalized = normalizeFounderRow(row)
      regionSlugByRecord.set(
        row.sourceRecordId,
        normalized.region.status === 'mapped' ? normalized.region.canonical.slug : null,
      )
      sectorSlugByRecord.set(
        row.sourceRecordId,
        normalized.sector.status === 'mapped' ? normalized.sector.canonical.slug : null,
      )
    }

  const outcomes = dryRun.outcomes.map((outcome) => {
      if (outcome.actionClass === 'reconcile_existing' && outcome.domain) {
        const match =
          outcome.domain.includes('aramco') ? aramco :
          outcome.domain.includes('sabic') ? sabic :
          null
        return { ...outcome, matchTargetId: match?.id ?? outcome.matchTargetId }
      }
      return outcome
    })

    const totals: ImportCounters = {
      accepted: 0,
      replayed: 0,
      rejected: 0,
      classified: {
        reconcile_existing: 0,
        repeated_domain_manual_review: 0,
        high_confidence_review_candidate: 0,
        low_confidence_review_candidate: 0,
        quarantined: 0,
        region_mapping_review_required: 0,
        sector_mapping_review_required: 0,
      },
    }

    for (let offset = 0; offset < outcomes.length; offset += BATCH_SIZE) {
      const batch = outcomes.slice(offset, offset + BATCH_SIZE)
      const { counters: batchCounters } = await ingestBatch(sql, {
        sourceKey: FOUNDER_SOURCE_KEY,
        runId,
        outcomes: batch,
        rowsById,
        regionSlugByRecord,
        sectorSlugByRecord,
      })
      totals.accepted += batchCounters.accepted
      totals.replayed += batchCounters.replayed
      totals.rejected += batchCounters.rejected
      for (const key of Object.keys(batchCounters.classified) as DryRunActionClass[]) {
        totals.classified[key] += batchCounters.classified[key]
      }
      console.log(`BATCH ${offset / BATCH_SIZE + 1}: accepted=${batchCounters.accepted} replayed=${batchCounters.replayed} rejected=${batchCounters.rejected}`)
      if (batchCounters.rejected > 0 && totals.accepted === 0 && totals.replayed === 0) {
        throw new Error('NONPROD_IMPORT_BLOCKED_WITH_EXACT_CAUSE: first batch rejected — stopping')
      }
    }

    if (args.idempotencyCheck || true) {
      const replayTotals = { replayed: 0, accepted: 0, rejected: 0 }
      for (let offset = 0; offset < outcomes.length; offset += BATCH_SIZE) {
        const batch = outcomes.slice(offset, offset + BATCH_SIZE)
        const { counters: batchCounters } = await ingestBatch(sql, {
          sourceKey: FOUNDER_SOURCE_KEY,
          runId,
          outcomes: batch,
          rowsById,
          regionSlugByRecord,
          sectorSlugByRecord,
        })
        replayTotals.replayed += batchCounters.replayed
        replayTotals.accepted += batchCounters.accepted
        replayTotals.rejected += batchCounters.rejected
      }
      if (replayTotals.accepted > 0 || replayTotals.rejected > 0) {
        throw new Error(
          `NONPROD_IMPORT_BLOCKED_WITH_EXACT_CAUSE: idempotency failed accepted=${replayTotals.accepted} rejected=${replayTotals.rejected}`,
        )
      }
      console.log(`IDEMPOTENCY_OK replayed=${replayTotals.replayed}`)
    }

    await sql`
      UPDATE directory_sync_runs
      SET status = 'completed', completed_at = now(), heartbeat_at = now()
      WHERE id = ${runId}::uuid
    `

    const candidateIds = await mapCandidateIds(sql, FOUNDER_SOURCE_KEY)
    writeReviewReports(dryRun, candidateIds)

    const postSnapshot = await captureSnapshot(sql)
    await writeSnapshotReport(
      'JID_NONPROD_CATALOG_POSTIMPORT_SNAPSHOT.md',
      'JID Nonprod Catalog Post-Import Snapshot',
      postSnapshot,
    )

    const importReport = [
      '# JID Nonprod Catalog Import Report',
      '',
      `**Executed:** ${new Date().toISOString()}`,
      `**Target:** \`hmjuijmaefajdjrjdsxu\``,
      `**Source:** \`${FOUNDER_SOURCE_KEY}\``,
      `**Run:** \`${EXTERNAL_RUN_ID}\``,
      '',
      '## Import counters',
      '',
      '| Metric | Count |',
      '| --- | ---: |',
      `| accepted | ${totals.accepted} |`,
      `| replayed | ${totals.replayed} |`,
      `| rejected | ${totals.rejected} |`,
      '',
      '## Classification applied',
      '',
      ...Object.entries(totals.classified).map(([k, v]) => `- ${k}: ${v}`),
      '',
      '## Reconciliations',
      '',
      `| Organization | Company UUID | Domain | Action |`,
      `| --- | --- | --- | --- |`,
      `| Saudi Aramco | \`${aramco.id}\` | aramco.com | reconcile_existing (candidate linked, not published) |`,
      `| SABIC | \`${sabic.id}\` | sabic.com | reconcile_existing (candidate linked, not published) |`,
      '',
      '## Side-effect assertions',
      '',
      `| Boundary | Pre | Post | Delta |`,
      `| --- | ---: | ---: | ---: |`,
      `| business_profiles | ${preSnapshot.counts.business_profiles} | ${postSnapshot.counts.business_profiles} | ${postSnapshot.counts.business_profiles - preSnapshot.counts.business_profiles} |`,
      `| university_profiles | ${preSnapshot.counts.university_profiles} | ${postSnapshot.counts.university_profiles} | ${postSnapshot.counts.university_profiles - preSnapshot.counts.university_profiles} |`,
      `| verification_requests | ${preSnapshot.counts.verification_requests} | ${postSnapshot.counts.verification_requests} | ${postSnapshot.counts.verification_requests - preSnapshot.counts.verification_requests} |`,
      `| companies_total | ${preSnapshot.counts.companies_total} | ${postSnapshot.counts.companies_total} | ${postSnapshot.counts.companies_total - preSnapshot.counts.companies_total} |`,
      '',
      '## Taxonomy',
      '',
      `- Regions after seed: ${taxonomy.regions}`,
      `- Sectors after seed: ${taxonomy.sectors}`,
      '',
      '## Publication',
      '',
      'No bulk publication performed. High-confidence candidates remain review-only.',
      '',
    ].join('\n')
    writeFileSync(join(REPORT_DIR, 'JID_NONPROD_CATALOG_IMPORT_REPORT.md'), importReport, 'utf8')

    console.log(
      JSON.stringify(
        {
          ok: true,
          totals,
          taxonomy,
          companiesDelta: postSnapshot.counts.companies_total - preSnapshot.counts.companies_total,
          founderCandidates: postSnapshot.founderExistingCount,
        },
        null,
        2,
      ),
    )
  } finally {
    await sql.end()
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
