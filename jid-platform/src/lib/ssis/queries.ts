import 'server-only'

import { createClient } from '@/lib/supabase/server'
import type {
  SsisBlock,
  SsisEvaluation,
  SsisGenerationContext,
  SsisInvitation,
  SsisResultRow,
  SsisScreening,
} from './types'

type UntypedRow = Record<string, unknown>

function mapBlock(row: UntypedRow): SsisBlock {
  return {
    id: row.id as string,
    screening_id: row.screening_id as string,
    kind: row.kind as SsisBlock['kind'],
    display_order: row.display_order as number,
    prompt_ar: row.prompt_ar as string,
    rubric: (row.rubric as SsisBlock['rubric']) ?? [],
    ai_generated: Boolean(row.ai_generated),
    edited_by_human: Boolean(row.edited_by_human),
    max_score: Number(row.max_score),
  }
}

function mapScreening(row: UntypedRow, blocks?: SsisBlock[]): SsisScreening {
  return {
    id: row.id as string,
    job_id: row.job_id as string,
    company_id: row.company_id as string,
    status: row.status as SsisScreening['status'],
    generation_context: row.generation_context as SsisGenerationContext,
    model_version: (row.model_version as string | null) ?? null,
    pass_threshold: Number(row.pass_threshold),
    time_limit_minutes: Number(row.time_limit_minutes),
    invitation_validity_days: Number(row.invitation_validity_days),
    preview_acknowledged_at: (row.preview_acknowledged_at as string | null) ?? null,
    preview_acknowledged_by: (row.preview_acknowledged_by as string | null) ?? null,
    approved_at: (row.approved_at as string | null) ?? null,
    created_at: row.created_at as string,
    blocks,
  }
}

export async function fetchJobScreening(jobId: string): Promise<SsisScreening | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('ssis_screenings')
    .select('*')
    .eq('job_id', jobId)
    .in('status', ['draft', 'pending_approval', 'active'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !data) return null

  const { data: blocks } = await supabase
    .from('ssis_blocks')
    .select('*')
    .eq('screening_id', data.id)
    .order('display_order')

  return mapScreening(data as UntypedRow, (blocks ?? []).map((b) => mapBlock(b as UntypedRow)))
}

export async function fetchScreeningResults(screeningId: string): Promise<SsisResultRow[]> {
  const supabase = await createClient()

  const { data: invitations, error } = await supabase
    .from('ssis_invitations')
    .select('id, application_id, status')
    .eq('screening_id', screeningId)
    .order('created_at', { ascending: false })

  if (error || !invitations?.length) return []

  const appIds = invitations.map((i) => i.application_id)
  const invIds = invitations.map((i) => i.id)

  const [{ data: apps }, { data: evaluations }] = await Promise.all([
    supabase
      .from('applications')
      .select('id, contact_email, applicant:profiles(full_name)')
      .in('id', appIds),
    supabase.from('ssis_evaluations').select('*').in('invitation_id', invIds),
  ])

  const evalByInv = new Map(
    (evaluations ?? []).map((e) => [e.invitation_id as string, e as UntypedRow]),
  )
  const appById = new Map((apps ?? []).map((a) => [a.id as string, a as UntypedRow]))

  return invitations.map((inv) => {
    const app = appById.get(inv.application_id)
    const evalRow = evalByInv.get(inv.id)
    const profile = app?.applicant as { full_name?: string } | null
    const name = profile?.full_name || (app?.contact_email as string) || null

    return {
      invitation_id: inv.id,
      application_id: inv.application_id,
      applicant_name: name,
      status: inv.status as SsisInvitation['status'],
      composite_score: evalRow ? Number(evalRow.composite_score) : null,
      recommendation: evalRow ? (evalRow.recommendation as SsisEvaluation['recommendation']) : null,
      evaluation: evalRow
        ? ({
            id: evalRow.id as string,
            invitation_id: evalRow.invitation_id as string,
            composite_score: Number(evalRow.composite_score),
            per_block: evalRow.per_block as SsisEvaluation['per_block'],
            recommendation: evalRow.recommendation as SsisEvaluation['recommendation'],
            model_version: evalRow.model_version as string,
            evaluated_at: evalRow.evaluated_at as string,
          } satisfies SsisEvaluation)
        : null,
    }
  })
}

export async function fetchCandidateInvitation(
  invitationId: string,
  userId: string,
): Promise<{
  invitation: SsisInvitation
  screening: SsisScreening
  blocks: SsisBlock[]
} | null> {
  const supabase = await createClient()

  const { data: invitation, error } = await supabase
    .from('ssis_invitations')
    .select('*')
    .eq('id', invitationId)
    .maybeSingle()

  if (error || !invitation) return null

  const { data: app } = await supabase
    .from('applications')
    .select('applicant_id')
    .eq('id', invitation.application_id)
    .maybeSingle()

  if (!app || app.applicant_id !== userId) return null

  const { data: screening } = await supabase
    .from('ssis_screenings')
    .select('*')
    .eq('id', invitation.screening_id)
    .maybeSingle()

  if (!screening) return null

  const { data: blocks } = await supabase
    .from('ssis_blocks')
    .select('*')
    .eq('screening_id', screening.id)
    .order('display_order')

  return {
    invitation: invitation as SsisInvitation,
    screening: mapScreening(screening as UntypedRow),
    blocks: (blocks ?? []).map((b) => mapBlock(b as UntypedRow)),
  }
}

export async function companyHasSsis(companyId: string): Promise<boolean> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('company_has_entitlement', {
    p_company_id: companyId,
    p_feature: 'ssis',
  })
  if (error) return false
  return Boolean(data)
}
