import type {
  DryRunImportAction,
  DryRunReport,
  DryRunSourceProposal,
  LammahIngestRecord,
  ResearchOpportunityInput,
  ValidatedOpportunity,
} from './types'
import { INGEST_RECORD_KEYS, toRegistrySourceType } from './types'
import { isPublishReviewCandidate, validateResearchOpportunity } from './contract'
import { findDuplicates } from './dedup'
import { urlHost } from './urls'

export const RESEARCH_RUN_ID = 'lammah-real-opportunities-2026-08-23'
export const RESEARCH_TIMEZONE = 'Asia/Riyadh' as const

function sourceKeyFromHost(host: string | null, fallback: string): string {
  if (!host) return fallback
  return host.replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 48)
}

function buildSourceProposals(
  candidates: readonly ValidatedOpportunity[],
  inputs: readonly ResearchOpportunityInput[],
): DryRunSourceProposal[] {
  const inputByKey = new Map(inputs.map((input) => [input.source_record_key, input]))
  const byKey = new Map<string, DryRunSourceProposal>()
  for (const candidate of candidates) {
    const input = inputByKey.get(candidate.source_record_key)
    if (!input) continue
    const host = urlHost(candidate.source_url)
    const sourceKey = sourceKeyFromHost(host, candidate.source_record_key)
    const existing = byKey.get(sourceKey)
    const types = new Set(existing?.supported_opportunity_types ?? [])
    types.add(candidate.opportunity_type)
    const hosts = new Set([
      ...(existing?.allowed_source_hosts ?? []),
      ...input.official_source_hosts,
    ])
    const applyHosts = new Set([
      ...(existing?.allowed_apply_hosts ?? []),
      ...input.allowed_apply_hosts,
    ])
    byKey.set(sourceKey, {
      source_key: sourceKey,
      name: candidate.organization_name,
      base_url: `https://${host ?? 'invalid.example'}`,
      source_type: toRegistrySourceType(input.source_type),
      research_source_type: input.source_type,
      approval_state: 'candidate',
      auto_publication_enabled: false,
      allowed_source_hosts: Array.from(hosts),
      allowed_apply_hosts: Array.from(applyHosts),
      supported_opportunity_types: Array.from(types),
    })
  }
  return Array.from(byKey.values())
}

export function toIngestRecord(candidate: ValidatedOpportunity): LammahIngestRecord {
  const sanitizedProjection = {
    title: candidate.title,
    organization_name: candidate.organization_name,
    short_summary_ar: candidate.short_summary_ar,
    short_summary_en: candidate.short_summary_en,
    evidence_note: candidate.evidence_note,
  }
  const payload = JSON.stringify({
    research_run_id: RESEARCH_RUN_ID,
    source_record_key: candidate.source_record_key,
    source_url: candidate.source_url,
    apply_url: candidate.apply_url,
    evidence_note: candidate.evidence_note,
    short_summary_ar: candidate.short_summary_ar,
    short_summary_en: candidate.short_summary_en,
  })

  return {
    source_record_id: candidate.source_record_key,
    checksum_sha256: candidate.checksum_sha256,
    request_identity: `${RESEARCH_RUN_ID}:${candidate.source_record_key}`,
    source_page_url: candidate.source_url,
    apply_url: candidate.apply_url,
    final_apply_url: candidate.apply_url,
    redirect_chain: [],
    url_validation_evidence: {
      status_code: 200,
      method: 'manual_official_page_review',
      checked_at: candidate.checked_at,
      final_destination: candidate.apply_url,
    },
    retrieved_at: candidate.checked_at,
    source_published_at: candidate.source_published_at,
    source_deadline_at: candidate.deadline_at,
    opportunity_type: candidate.opportunity_type,
    title_original: candidate.title,
    title_ar: candidate.title_ar,
    title_en: candidate.title_en,
    organization_raw_name: candidate.organization_name,
    location_country: candidate.location_country,
    location_region: candidate.location_region,
    location_city: candidate.location_city,
    payload_body: payload,
    sanitized_projection: sanitizedProjection,
    content_type: 'application/json',
    personal_data_dominated: false,
    hostile_content: false,
  }
}

export function ingestRecordHasClosedShape(record: LammahIngestRecord): boolean {
  const keys = Object.keys(record)
  return (
    keys.length === INGEST_RECORD_KEYS.length
    && INGEST_RECORD_KEYS.every((key) => keys.includes(key))
  )
}

export function runRealOpportunityDryRun(options: {
  inputs: readonly ResearchOpportunityInput[]
  now: Date
  generatedAt: string
}): DryRunReport {
  const validated = options.inputs.map((input) => validateResearchOpportunity(input, options.now))
  const publishReview = validated.filter(isPublishReviewCandidate)
  const excluded = validated.filter((item) => !isPublishReviewCandidate(item))
  const duplicates = findDuplicates(validated)
  const sourceProposals = buildSourceProposals(publishReview, options.inputs)
  const ingestRecords = publishReview.map(toIngestRecord)

  const importActions: DryRunImportAction[] = [
    ...sourceProposals.map((source) => ({
      action: 'register_source_candidate' as const,
      source_key: source.source_key,
      source_record_key: null,
      intended_state: 'pending_review' as const,
      remote_write: false as const,
    })),
    ...publishReview.map((candidate) => ({
      action: 'ingest_review_candidate' as const,
      source_key: sourceKeyFromHost(urlHost(candidate.source_url), candidate.source_record_key),
      source_record_key: candidate.source_record_key,
      intended_state: 'pending_review' as const,
      remote_write: false as const,
    })),
  ]

  return {
    research_run_id: RESEARCH_RUN_ID,
    generated_at: options.generatedAt,
    timezone: RESEARCH_TIMEZONE,
    remote_write: false,
    counts: {
      researched: validated.length,
      open: validated.filter((item) => item.lifecycle_status === 'open').length,
      upcoming: validated.filter((item) => item.lifecycle_status === 'upcoming').length,
      closed: validated.filter((item) => item.lifecycle_status === 'closed').length,
      unknown: validated.filter((item) => item.lifecycle_status === 'unknown').length,
      publish_review_candidates: publishReview.length,
      excluded: excluded.length,
      duplicates_detected: duplicates.filter((item) => item.merge).length,
    },
    candidates: publishReview,
    excluded,
    duplicates,
    source_proposals: sourceProposals,
    ingest_records: ingestRecords,
    import_actions: importActions,
    side_effects: {
      business_profiles: 0,
      university_profiles: 0,
      verification_requests: 0,
      companies_created: 0,
      ownership_changed: 0,
      abhathli: 0,
      professional_discovery: 0,
      remote_nonprod_import: 0,
    },
  }
}

export function assertZeroSideEffects(report: DryRunReport): void {
  if (report.remote_write !== false) throw new Error('remote_write_must_be_false')
  for (const [key, value] of Object.entries(report.side_effects)) {
    if (value !== 0) throw new Error(`side_effect_${key}`)
  }
  if (report.import_actions.some((action) => action.remote_write !== false)) {
    throw new Error('import_action_remote_write')
  }
  if (report.ingest_records.some((record) => !ingestRecordHasClosedShape(record))) {
    throw new Error('ingest_record_shape_invalid')
  }
}
