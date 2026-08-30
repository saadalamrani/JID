import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import { initializeHiringRole } from '@/lib/hiring/workspace-service'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/types'
import { buildSourcingComparisonGrid } from '@/lib/talent-sourcing/comparison'
import { buildHiringIntelligenceReport } from '@/lib/talent-sourcing/intelligence'
import {
  explainTalentRelevance,
  hasAnyCriterionEvidence,
  type CriterionRef,
} from '@/lib/talent-sourcing/relevance'
import type {
  DiscoverableTalentCard,
  HiringIntelligenceReport,
  SourcingComparisonGrid,
  TalentInvitation,
  TalentInvitationState,
  TalentSearchHit,
} from '@/types/contracts/talent-sourcing'

type UntypedClient = SupabaseClient<Record<string, unknown>>
type RpcError = { message: string }
type RpcResult<T> = Promise<{ data: T | null; error: RpcError | null }>
type SourcingRpc = (name: string, args: Record<string, unknown>) => RpcResult<unknown>

function asUntyped(client: SupabaseClient<Database>): UntypedClient {
  return client as unknown as UntypedClient
}

type SearchPayload = {
  hiringRoleId: string
  jobId: string
  criteria: readonly {
    id: string
    labelAr: string
    labelEn: string
    required?: boolean
    sortOrder?: number
  }[]
  candidates: readonly RawCard[]
}

type RawCard = {
  profileId: string
  displayName: string
  headline: string | null
  about: string | null
  targetSectors: readonly string[] | null
  targetProgramTypes: readonly string[] | null
  targetRegions: readonly string[] | null
  skills: readonly { id: string; name: string; nameAr: string | null }[] | null
  invitationState: string | null
}

const INVITATION_STATES = new Set<TalentInvitationState>([
  'INVITED',
  'INTERESTED',
  'DECLINED',
  'WITHDRAWN',
])

function asRpc(client: Awaited<ReturnType<typeof createClient>>): SourcingRpc {
  return client.rpc as unknown as SourcingRpc
}

function invitationState(value: string | null): TalentInvitationState | null {
  if (!value) return null
  const normalized = value.toUpperCase() as TalentInvitationState
  return INVITATION_STATES.has(normalized) ? normalized : null
}

function toCard(raw: RawCard): DiscoverableTalentCard {
  return {
    profileId: raw.profileId,
    displayName: raw.displayName,
    headline: raw.headline,
    about: raw.about,
    targetSectors: raw.targetSectors ?? [],
    targetProgramTypes: raw.targetProgramTypes ?? [],
    targetRegions: raw.targetRegions ?? [],
    skills: (raw.skills ?? []).map((skill) => ({
      id: skill.id,
      name: skill.name,
      nameAr: skill.nameAr,
    })),
    invitationState: invitationState(raw.invitationState),
  }
}

function toCriteria(payload: SearchPayload): CriterionRef[] {
  return [...payload.criteria]
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .map((criterion) => ({
      id: criterion.id,
      labelAr: criterion.labelAr,
      labelEn: criterion.labelEn,
    }))
}

async function loadSearch(jobId: string): Promise<SearchPayload> {
  const client = await createClient()
  const { data, error } = await asRpc(client)('search_discoverable_talent', { p_job_id: jobId })
  if (error || !data || typeof data !== 'object') {
    throw new Error(error?.message ?? 'تعذّر البحث عن المواهب')
  }
  return data as SearchPayload
}

export async function searchTalentForJob(jobId: string): Promise<{
  hiringRoleId: string
  criteria: CriterionRef[]
  hits: TalentSearchHit[]
}> {
  const payload = await loadSearch(jobId)
  const criteria = toCriteria(payload)
  const hits = payload.candidates
    .map(toCard)
    .filter((card) => hasAnyCriterionEvidence(card, criteria))
    .map((card) => ({
      ...card,
      reasons: explainTalentRelevance(card, criteria),
    }))
  return { hiringRoleId: payload.hiringRoleId, criteria, hits }
}

export async function compareTalentForJob(
  jobId: string,
  profileIds: readonly string[],
): Promise<SourcingComparisonGrid> {
  const uniqueIds = Array.from(new Set(profileIds)).slice(0, 5)
  const { hiringRoleId, criteria, hits } = await searchTalentForJob(jobId)
  const selected = uniqueIds
    .map((id) => hits.find((hit) => hit.profileId === id))
    .filter((hit): hit is TalentSearchHit => Boolean(hit))
  return buildSourcingComparisonGrid({
    hiringRoleId,
    criteria,
    candidates: selected,
  })
}

export async function inviteTalent(input: {
  jobId: string
  candidateProfileId: string
  messageAr: string
  messageEn: string
}): Promise<string> {
  const client = await createClient()
  const { data, error } = await asRpc(client)('invite_discoverable_talent', {
    p_job_id: input.jobId,
    p_candidate_profile_id: input.candidateProfileId,
    p_message_ar: input.messageAr,
    p_message_en: input.messageEn,
  })
  if (error || typeof data !== 'string') {
    throw new Error(error?.message ?? 'تعذّر إرسال دعوة الاهتمام')
  }
  return data
}

export async function withdrawTalentInvitation(invitationId: string): Promise<string> {
  const client = await createClient()
  const { data, error } = await asRpc(client)('withdraw_talent_invitation', {
    p_invitation_id: invitationId,
  })
  if (error || typeof data !== 'string') {
    throw new Error(error?.message ?? 'تعذّر سحب الدعوة')
  }
  return data
}

export async function respondToTalentInvitation(
  invitationId: string,
  decision: 'interested' | 'declined',
): Promise<string> {
  const client = await createClient()
  const { data, error } = await asRpc(client)('respond_talent_invitation', {
    p_invitation_id: invitationId,
    p_decision: decision,
  })
  if (error || typeof data !== 'string') {
    throw new Error(error?.message ?? 'تعذّر الرد على الدعوة')
  }
  return data
}

export async function loadHiringIntelligence(jobId: string): Promise<HiringIntelligenceReport> {
  const client = await createClient()
  const { data, error } = await asRpc(client)('hiring_sourcing_intelligence', { p_job_id: jobId })
  if (error || !data || typeof data !== 'object') {
    throw new Error(error?.message ?? 'تعذّر تحميل مؤشرات التوظيف')
  }
  const payload = data as {
    hiringRoleId: string
    generatedAt: string
    counts: {
      sourcedCandidates: number
      invitationsSent: number
      responses: number
      applicationsFromSourcing: number
      criterionCount: number
    }
  }
  const sourced = Number(payload.counts.sourcedCandidates) || 0
  return buildHiringIntelligenceReport({
    hiringRoleId: payload.hiringRoleId,
    generatedAt: payload.generatedAt,
    counts: {
      sourcedCandidates: sourced,
      invitationsSent: Number(payload.counts.invitationsSent) || 0,
      responses: Number(payload.counts.responses) || 0,
      applicationsFromSourcing: Number(payload.counts.applicationsFromSourcing) || 0,
      candidatesWithAnyEvidence: sourced,
      criterionCount: Number(payload.counts.criterionCount) || 0,
    },
  })
}

type InvitationRow = {
  id: string
  hiring_role_id: string
  job_id: string
  candidate_profile_id: string
  business_profile_id: string
  state: string
  message_ar: string
  message_en: string
  application_id: string | null
  created_at: string
  responded_at: string | null
}

export async function listMySourcingInvitations(): Promise<TalentInvitation[]> {
  const client = asUntyped(await createClient())
  const { data, error } = await client
    .from('talent_sourcing_invitations')
    .select(
      'id, hiring_role_id, job_id, candidate_profile_id, business_profile_id, state, message_ar, message_en, application_id, created_at, responded_at',
    )
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return ((data ?? []) as InvitationRow[]).map((row) => ({
    id: row.id,
    hiringRoleId: row.hiring_role_id,
    jobId: row.job_id,
    candidateProfileId: row.candidate_profile_id,
    businessProfileId: row.business_profile_id,
    state: invitationState(row.state) ?? 'INVITED',
    messageAr: row.message_ar,
    messageEn: row.message_en,
    applicationId: row.application_id,
    createdAt: row.created_at,
    respondedAt: row.responded_at,
  }))
}

export async function addHiringCriterion(input: {
  hiringRoleId: string
  labelAr: string
  labelEn: string
}): Promise<string> {
  const client = asUntyped(await createClient())
  const { data: existing, error: readError } = await client
    .from('hiring_criteria')
    .select('sort_order')
    .eq('hiring_role_id', input.hiringRoleId)
  if (readError) throw new Error(readError.message)
  const nextOrder =
    ((existing ?? []) as { sort_order: number }[]).reduce(
      (max, row) => Math.max(max, row.sort_order),
      -10,
    ) + 10
  const { data, error } = await client
    .from('hiring_criteria')
    .insert({
      hiring_role_id: input.hiringRoleId,
      label_ar: input.labelAr.trim(),
      label_en: input.labelEn.trim(),
      required: false,
      sort_order: nextOrder,
      evidence_kinds: [],
    })
    .select('id')
    .single()
  if (error || !data) throw new Error(error?.message ?? 'تعذّر حفظ المعيار')
  return (data as { id: string }).id
}

export async function ensureHiringRoleForJob(jobId: string): Promise<string> {
  const client = asUntyped(await createClient())
  const { data: existing, error } = await client
    .from('hiring_roles')
    .select('id')
    .eq('job_id', jobId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  const current = existing as { id: string } | null
  if (current?.id) return current.id

  const { data: job, error: jobError } = await client
    .from('jobs')
    .select('title_ar, title_en')
    .eq('id', jobId)
    .maybeSingle()
  if (jobError || !job) throw new Error(jobError?.message ?? 'الفرصة غير موجودة')
  const titles = job as { title_ar: string | null; title_en: string | null }
  return initializeHiringRole({
    jobId,
    titleAr: titles.title_ar?.trim() || 'دور توظيف',
    titleEn: titles.title_en?.trim() || 'Hiring role',
  })
}
