import 'server-only'

import { notFound } from 'next/navigation'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { requireStaffShellAccess } from '@/lib/staff/require-staff-access'

type UntypedClient = SupabaseClient<Record<string, unknown>>

function untyped(client: Awaited<ReturnType<typeof createClient>>): UntypedClient {
  return client as unknown as UntypedClient
}

export async function requireCatalogStaffAccess() {
  const profile = await requireStaffShellAccess()
  if (profile.role !== 'staff' && profile.role !== 'super_admin') notFound()
  return profile
}

export type CatalogSource = {
  id: string
  display_name: string
  lifecycle_state: string
  health_state: string
  connector_enabled: boolean
  last_successful_sync: string | null
  consecutive_failure_count: number
}

export type CatalogRun = {
  id: string
  external_run_id: string | null
  status: string
  accepted_count: number
  rejected_count: number
  retrieved_count: number
  skipped_count: number
  page_count: number
  retry_count: number
  started_at: string
  completed_at: string | null
  failure_class: string | null
  failure_detail: string | null
}

export type CatalogQueueItem = {
  id: string
  candidate_id: string
  status: string
  assigned_to: string | null
  created_at: string
  candidate: {
    lei: string | null
    normalized_identity: string
    match_outcome: string
    review_flags: string[]
    state: string
    run_id: string
  }
}

export type CatalogFact = {
  id: string
  fact_key: string
  normalized_value: unknown
  original_value: unknown
  source_field: string
  transformation: string
  authority_level: string
  observed_at: string
  reviewer_edit_state: string
  provenance_url: string | null
  reviewer_attestation: string | null
  assist_results: Record<string, unknown>
}

export type CatalogReviewDetail = {
  queue: CatalogQueueItem & {
    reviewer_id: string | null
    decision: string | null
    review_notes: string | null
    publication_company_id: string | null
  }
  source: CatalogSource & { reference_url: string | null; licence_reference: string }
  evidence: {
    id: string
    checksum_sha256: string
    retrieved_at: string
    source_payload: unknown
    retention_state: string
    legal_hold: boolean
  }
  facts: CatalogFact[]
  target: {
    id: string
    name: string
    name_ar: string | null
    domains: string[]
    city: string | null
  } | null
  audit: Array<{
    id: string
    action: string
    actor_id: string | null
    metadata: unknown
    created_at: string
  }>
  currentUserId: string
  viewerRole: string
  viewOnly: boolean
}

export async function fetchCatalogOverview() {
  await requireCatalogStaffAccess()
  const client = untyped(await createClient())
  const [sourceResult, runsResult, deadResult, queueResult, flagsResult] = await Promise.all([
    client
      .from('directory_sources')
      .select(
        'id,display_name,lifecycle_state,health_state,connector_enabled,last_successful_sync,consecutive_failure_count',
      )
      .eq('source_key', 'gleif.lei-records-v1')
      .maybeSingle(),
    client
      .from('directory_sync_runs')
      .select(
        'id,external_run_id,status,accepted_count,rejected_count,retrieved_count,skipped_count,page_count,retry_count,started_at,completed_at,failure_class,failure_detail',
      )
      .order('started_at', { ascending: false })
      .limit(10),
    client
      .from('directory_dead_letters')
      .select('id', { count: 'exact', head: true })
      .in('retry_state', ['not_retryable', 'pending', 'in_progress']),
    client
      .from('directory_review_queue')
      .select('id', { count: 'exact', head: true })
      .in('status', ['pending', 'in_review', 'returned', 'approved_pending_domain']),
    client
      .from('feature_flags')
      .select('key,is_enabled')
      .in('key', ['catalog.phase1_ingestion', 'catalog.gleif_connector_enabled']),
  ])
  for (const result of [sourceResult, runsResult, deadResult, queueResult, flagsResult]) {
    if (result.error) throw new Error(result.error.message)
  }
  return {
    source: sourceResult.data as CatalogSource | null,
    runs: (runsResult.data ?? []) as CatalogRun[],
    openDeadLetters: deadResult.count ?? 0,
    openReviews: queueResult.count ?? 0,
    flags: Object.fromEntries(
      ((flagsResult.data ?? []) as Array<{ key: string; is_enabled: boolean }>).map((row) => [
        row.key,
        row.is_enabled,
      ]),
    ),
  }
}

export async function fetchCatalogQueue(): Promise<CatalogQueueItem[]> {
  await requireCatalogStaffAccess()
  const client = untyped(await createClient())
  const { data: queues, error } = await client
    .from('directory_review_queue')
    .select('id,candidate_id,status,assigned_to,created_at')
    .order('created_at', { ascending: true })
    .limit(100)
  if (error) throw new Error(error.message)
  const rows = (queues ?? []) as Array<Omit<CatalogQueueItem, 'candidate'>>
  const candidateIds = rows.map((row) => row.candidate_id)
  if (!candidateIds.length) return []
  const { data: candidates, error: candidateError } = await client
    .from('directory_import_candidates')
    .select('id,lei,normalized_identity,match_outcome,review_flags,state,run_id')
    .in('id', candidateIds)
  if (candidateError) throw new Error(candidateError.message)
  const byId = new Map(
    ((candidates ?? []) as Array<CatalogQueueItem['candidate'] & { id: string }>).map((row) => [
      row.id,
      row,
    ]),
  )
  return rows.flatMap((row) => {
    const candidate = byId.get(row.candidate_id)
    return candidate ? [{ ...row, candidate }] : []
  })
}

export async function fetchCatalogReview(candidateId: string): Promise<CatalogReviewDetail | null> {
  const profile = await requireCatalogStaffAccess()
  const client = untyped(await createClient())
  const { data: candidate, error: candidateError } = await client
    .from('directory_import_candidates')
    .select(
      'id,lei,normalized_identity,match_outcome,review_flags,state,run_id,source_id,evidence_id,deterministic_match_target',
    )
    .eq('id', candidateId)
    .maybeSingle()
  if (candidateError) throw new Error(candidateError.message)
  if (!candidate) return null
  const candidateRow = candidate as CatalogQueueItem['candidate'] & {
    id: string
    source_id: string
    evidence_id: string
    deterministic_match_target: string | null
  }
  const { data: queue, error: queueError } = await client
    .from('directory_review_queue')
    .select(
      'id,candidate_id,status,assigned_to,reviewer_id,decision,review_notes,publication_company_id,created_at',
    )
    .eq('candidate_id', candidateId)
    .single()
  if (queueError) throw new Error(queueError.message)

  const claim = await client.rpc('claim_directory_candidate', {
    p_review_queue_id: String((queue as { id: string }).id),
  })
  if (claim.error) throw new Error(claim.error.message)
  const [sourceResult, evidenceResult, factsResult, targetResult, auditResult] = await Promise.all([
    client
      .from('directory_sources')
      .select(
        'id,display_name,lifecycle_state,health_state,connector_enabled,last_successful_sync,consecutive_failure_count,reference_url,licence_reference',
      )
      .eq('id', candidateRow.source_id)
      .single(),
    client
      .from('directory_raw_evidence')
      .select('id,checksum_sha256,retrieved_at,source_payload,retention_state,legal_hold')
      .eq('id', candidateRow.evidence_id)
      .single(),
    client
      .from('directory_candidate_facts')
      .select(
        'id,fact_key,normalized_value,original_value,source_field,transformation,authority_level,observed_at,reviewer_edit_state,provenance_url,reviewer_attestation,assist_results',
      )
      .eq('candidate_id', candidateId)
      .eq('state', 'active')
      .order('fact_key'),
    candidateRow.deterministic_match_target
      ? client
          .from('companies')
          .select('id,name,name_ar,domains,city')
          .eq('id', candidateRow.deterministic_match_target)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    client
      .from('audit_logs')
      .select('id,action,actor_id,metadata,created_at')
      .eq('entity_id', candidateId)
      .order('created_at', { ascending: true }),
  ])
  for (const result of [sourceResult, evidenceResult, factsResult, targetResult, auditResult]) {
    if (result.error) throw new Error(result.error.message)
  }
  const claimed = (claim.data ?? {}) as { assigned_to?: string; view_only?: boolean }
  return {
    queue: {
      ...(queue as Omit<CatalogReviewDetail['queue'], 'candidate'>),
      candidate: candidateRow,
      assigned_to: claimed.assigned_to ?? (queue as { assigned_to: string | null }).assigned_to,
    },
    source: sourceResult.data as CatalogReviewDetail['source'],
    evidence: evidenceResult.data as CatalogReviewDetail['evidence'],
    facts: (factsResult.data ?? []) as CatalogFact[],
    target: targetResult.data as CatalogReviewDetail['target'],
    audit: (auditResult.data ?? []) as CatalogReviewDetail['audit'],
    currentUserId: profile.id,
    viewerRole: profile.role,
    viewOnly: claimed.view_only === true,
  }
}

export async function fetchCatalogRuns(): Promise<CatalogRun[]> {
  const overview = await fetchCatalogOverview()
  return overview.runs
}

export async function fetchCatalogDeadLetters() {
  await requireCatalogStaffAccess()
  const client = untyped(await createClient())
  const { data, error } = await client
    .from('directory_dead_letters')
    .select('id,source_record_key,error_class,sanitized_details,retry_state,retry_count,created_at')
    .order('created_at', { ascending: false })
    .limit(100)
  if (error) throw new Error(error.message)
  return data ?? []
}
