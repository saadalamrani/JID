import 'server-only'

import { notFound } from 'next/navigation'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/types'
import { requireStaffShellAccess } from '@/lib/staff/require-staff-access'

type UntypedClient = SupabaseClient<Record<string, unknown>>

function untyped(client: SupabaseClient<Database>): UntypedClient {
  return client as unknown as UntypedClient
}

export async function requireLammahStaffAccess() {
  const profile = await requireStaffShellAccess()
  if (profile.role !== 'staff' && profile.role !== 'super_admin') notFound()
  return profile
}

export type LammahStaffSource = {
  id: string
  source_key: string
  name: string
  base_url: string
  approval_state: string
  is_active: boolean
  auto_publication_enabled: boolean
  health_state: string
  last_success_at: string | null
  last_failure_at: string | null
  consecutive_failures: number
  licence_basis: string | null
  terms_url: string | null
  terms_reviewed_at: string | null
  robots_url: string | null
  robots_reviewed_at: string | null
  robots_review_result: string | null
  apply_url_pattern: string | null
  record_identity_strategy: string | null
  technical_format: string | null
  evidence_retention_terms: string | null
  rate_limit_policy: Record<string, unknown>
  confidence_policy: Record<string, unknown>
  parser_version: string | null
}

export type LammahStaffQueueItem = {
  id: string
  candidate_id: string
  queue_state: string
  priority: number
  assigned_to: string | null
  created_at: string
  candidate: {
    id: string
    title_ar: string | null
    title_en: string | null
    organization_raw_name: string
    opportunity_type: string
    match_outcome: string
    review_flags: string[]
    state: string
    run_id: string
    source_record_id: string
    source_deadline_at: string | null
    normalized_title: string | null
    normalized_organization: string | null
    source: { name: string; source_key: string } | null
  }
}

export type LammahStaffOverview = {
  source: LammahStaffSource | null
  flags: Array<{ key: string; is_enabled: boolean }>
  counts: {
    review: number
    deadLetters: number
    active: number
    runs: number
  }
  opportunities: Array<{
    id: string
    title_ar: string | null
    title_en: string | null
    company_name_raw: string
    status: string
    last_confirmed_at: string
    expires_at: string | null
  }>
}

export async function fetchStaffLammahOverview(): Promise<LammahStaffOverview> {
  await requireLammahStaffAccess()
  const client = untyped(await createClient())
  const [sourceResult, flagsResult, reviewResult, deadLettersResult, activeResult, runsResult, opportunitiesResult] =
    await Promise.all([
      client.from('lammah_sources').select(
        'id,source_key,name,base_url,approval_state,is_active,auto_publication_enabled,health_state,last_success_at,last_failure_at,consecutive_failures,licence_basis,terms_url,terms_reviewed_at,robots_url,robots_reviewed_at,robots_review_result,apply_url_pattern,record_identity_strategy,technical_format,evidence_retention_terms,rate_limit_policy,confidence_policy,parser_version',
      ).eq('source_key','eu_careers_cast').maybeSingle(),
      client.from('feature_flags').select('key,is_enabled').in('key',[
        'lammah.phase1_ingestion','lammah.connector_enabled',
        'lammah.auto_publication_enabled','lammah.catalog_bridge_enabled',
      ]).order('key'),
      client.from('lammah_review_queue').select('id',{count:'exact',head:true}).eq('queue_state','open'),
      client.from('lammah_dead_letters').select('id',{count:'exact',head:true}).neq('retry_state','closed'),
      client.from('lammah_opportunities').select('id',{count:'exact',head:true}).eq('status','active'),
      client.from('lammah_sync_runs').select('id',{count:'exact',head:true}),
      client.from('lammah_opportunities').select(
        'id,title_ar,title_en,company_name_raw,status,last_confirmed_at,expires_at',
      ).order('created_at',{ascending:false}).limit(20),
    ])
  if (sourceResult.error) throw new Error(sourceResult.error.message)
  if (flagsResult.error) throw new Error(flagsResult.error.message)
  if (opportunitiesResult.error) throw new Error(opportunitiesResult.error.message)
  return {
    source: sourceResult.data as unknown as LammahStaffSource | null,
    flags: (flagsResult.data ?? []) as unknown as LammahStaffOverview['flags'],
    counts: {
      review: reviewResult.count ?? 0,
      deadLetters: deadLettersResult.count ?? 0,
      active: activeResult.count ?? 0,
      runs: runsResult.count ?? 0,
    },
    opportunities: (opportunitiesResult.data ?? []) as unknown as LammahStaffOverview['opportunities'],
  }
}

export async function fetchStaffLammahReviewQueue(): Promise<LammahStaffQueueItem[]> {
  await requireLammahStaffAccess()
  const client = untyped(await createClient())
  const { data, error } = await client.from('lammah_review_queue').select(
    'id,candidate_id,queue_state,priority,assigned_to,created_at,candidate:lammah_import_candidates(id,title_ar,title_en,organization_raw_name,opportunity_type,match_outcome,review_flags,state,run_id,source_record_id,source_deadline_at,normalized_title,normalized_organization,source:lammah_sources(name,source_key))',
  ).eq('queue_state','open').order('priority',{ascending:false}).order('created_at')
  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as LammahStaffQueueItem[]
}

export type LammahReviewDetail = {
  candidate: Record<string, unknown> & { id: string; evidence_id: string; source_id: string }
  source: LammahStaffSource
  evidence: Record<string, unknown>
  facts: Array<Record<string, unknown> & { id: string; fact_key: string }>
  queue: Record<string, unknown> | null
  duplicates: Array<Record<string, unknown>>
  nativeMatches: Array<Record<string, unknown>>
  lifecycle: Array<Record<string, unknown>>
  audit: Array<Record<string, unknown>>
}

export async function fetchStaffLammahReviewDetail(candidateId: string): Promise<LammahReviewDetail> {
  await requireLammahStaffAccess()
  const client = untyped(await createClient())
  const candidateResult = await client.from('lammah_import_candidates').select('*').eq('id',candidateId).maybeSingle()
  if (candidateResult.error || !candidateResult.data) notFound()
  const candidate = candidateResult.data as unknown as LammahReviewDetail['candidate']
  const [source,evidence,facts,queue,duplicates,nativeMatches,lifecycle,audit] = await Promise.all([
    client.from('lammah_sources').select('*').eq('id',candidate.source_id).single(),
    client.from('lammah_raw_evidence').select(
      'id,source_id,run_id,source_record_id,source_url,sanitized_projection,content_type,content_size_bytes,checksum_sha256,redirect_chain,final_destination,parser_version,retention_state,deletion_eligible_at,legal_hold,legal_hold_reason,personal_data_dominated,payload_deleted_at,retrieved_at,created_at',
    ).eq('id',candidate.evidence_id).single(),
    client.from('lammah_candidate_facts').select('*').eq('candidate_id',candidateId).order('fact_key'),
    client.from('lammah_review_queue').select('*').eq('candidate_id',candidateId).maybeSingle(),
    client.from('lammah_duplicate_candidates').select('*').eq('candidate_id',candidateId).order('created_at'),
    client.from('lammah_native_match_events').select('*').eq('candidate_id',candidateId).order('created_at'),
    client.from('lammah_lifecycle_events').select('*').eq('candidate_id',candidateId).order('created_at',{ascending:false}),
    client.from('audit_logs').select('id,action,actor_id,entity_type,entity_id,metadata,created_at')
      .eq('entity_id',candidateId).order('created_at',{ascending:false}),
  ])
  for (const result of [source,evidence,facts,queue,duplicates,nativeMatches,lifecycle,audit]) {
    if (result.error) throw new Error(result.error.message)
  }
  return {
    candidate,
    source: source.data as unknown as LammahStaffSource,
    evidence: evidence.data as unknown as Record<string,unknown>,
    facts: (facts.data ?? []) as unknown as LammahReviewDetail['facts'],
    queue: queue.data as unknown as Record<string,unknown> | null,
    duplicates: (duplicates.data ?? []) as unknown as Array<Record<string,unknown>>,
    nativeMatches: (nativeMatches.data ?? []) as unknown as Array<Record<string,unknown>>,
    lifecycle: (lifecycle.data ?? []) as unknown as Array<Record<string,unknown>>,
    audit: (audit.data ?? []) as unknown as Array<Record<string,unknown>>,
  }
}

export type LammahStaffRun = {
  id: string
  external_run_id: string
  worker_identity: string
  mode: string
  parser_version: string
  status: string
  retrieved_count: number
  accepted_count: number
  replayed_count: number
  review_count: number
  published_count: number
  rejected_count: number
  dead_letter_count: number
  page_count: number
  retry_count: number
  failure_class: string | null
  failure_detail: string | null
  started_at: string
  completed_at: string | null
}

export async function fetchStaffLammahRuns(): Promise<LammahStaffRun[]> {
  await requireLammahStaffAccess()
  const client=untyped(await createClient())
  const {data,error}=await client.from('lammah_sync_runs').select('*').order('started_at',{ascending:false}).limit(100)
  if(error) throw new Error(error.message)
  return (data??[]) as unknown as LammahStaffRun[]
}

export type LammahStaffDeadLetter = {
  id: string
  source_record_id: string | null
  error_class: string
  sanitized_details: Record<string,unknown>
  attempts: number
  retry_state: string
  next_retry_at: string | null
  closed_reason: string | null
  attributed_worker_identity: string
  created_at: string
}

export async function fetchStaffLammahDeadLetters(): Promise<LammahStaffDeadLetter[]> {
  await requireLammahStaffAccess()
  const client=untyped(await createClient())
  const {data,error}=await client.from('lammah_dead_letters').select('*').order('created_at',{ascending:false}).limit(100)
  if(error) throw new Error(error.message)
  return (data??[]) as unknown as LammahStaffDeadLetter[]
}

export type LammahStaffMappingItem = {
  id: string
  candidate_id: string
  raw_name: string
  locality: string | null
  suggested_company_id: string | null
  suggestion_basis: Record<string,unknown>
  state: string
  created_at: string
  candidate: {
    id: string
    title_ar: string | null
    title_en: string | null
    organization_raw_name: string
    state: string
  } | null
}

export async function fetchStaffLammahMappingQueue(): Promise<LammahStaffMappingItem[]> {
  await requireLammahStaffAccess()
  const client=untyped(await createClient())
  const {data,error}=await client.from('lammah_org_mapping_queue').select(
    '*,candidate:lammah_import_candidates(id,title_ar,title_en,organization_raw_name,state)',
  ).eq('state','open').order('created_at')
  if(error) throw new Error(error.message)
  return (data??[]) as unknown as LammahStaffMappingItem[]
}
