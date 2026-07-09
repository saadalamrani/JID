'use client'

import { createClient } from '@/lib/supabase/client'
import type { CascadeSuggestion, CommunicationBatch, CommunicationTemplate } from '@/types/communication'
import type { CommKind } from '@/lib/constants/communication'

function mapSuggestion(row: {
  suggestion_kind: string
  target_status: string
  recipient_ids: string[] | null
  recipient_count: number
}): CascadeSuggestion {
  return {
    suggestionKind: row.suggestion_kind as CommKind,
    targetStatus: row.target_status as CascadeSuggestion['targetStatus'],
    recipientIds: row.recipient_ids ?? [],
    recipientCount: row.recipient_count,
  }
}

export async function fetchCascadeSuggestions(jobId: string): Promise<CascadeSuggestion[]> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('compute_cascade_suggestion', {
    p_job_id: jobId,
  })

  if (error) throw new Error(error.message)
  return (data ?? []).map(mapSuggestion)
}

export async function createCommunicationBatch(params: {
  jobId: string
  kind: CommKind
  recipientIds: string[]
  templateSnapshot?: {
    kind: CommKind
    subject_ar: string
    body_ar: string
  }
}): Promise<string> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('create_communication_batch', {
    p_job_id: params.jobId,
    p_kind: params.kind,
    p_recipient_ids: params.recipientIds,
    p_template_snapshot: params.templateSnapshot ?? null,
  })

  if (error) throw new Error(error.message)
  return data as string
}

export async function cancelCommunicationBatch(batchId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.rpc('cancel_communication_batch', {
    p_batch_id: batchId,
  })

  if (error) throw new Error(error.message)
}

export async function fetchScheduledBatchesForJob(jobId: string): Promise<CommunicationBatch[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('communication_batches')
    .select(
      'id, company_id, job_id, kind, recipient_application_ids, recipient_count, template_snapshot, status, scheduled_send_at, sent_count, failed_count, created_at',
    )
    .eq('job_id', jobId)
    .eq('status', 'scheduled')
    .order('scheduled_send_at', { ascending: true })

  if (error) throw new Error(error.message)

  return (data ?? []).map((row) => ({
    id: row.id,
    companyId: row.company_id,
    jobId: row.job_id,
    kind: row.kind as CommKind,
    recipientApplicationIds: row.recipient_application_ids,
    recipientCount: row.recipient_count,
    templateSnapshot: row.template_snapshot as CommunicationBatch['templateSnapshot'],
    status: row.status,
    scheduledSendAt: row.scheduled_send_at,
    sentCount: row.sent_count,
    failedCount: row.failed_count,
    createdAt: row.created_at,
  }))
}

export async function fetchCommunicationTemplates(
  companyId: string,
): Promise<CommunicationTemplate[]> {
  const supabase = createClient()
  await supabase.rpc('ensure_communication_templates', { p_company_id: companyId })

  const { data, error } = await supabase
    .from('communication_templates')
    .select('id, company_id, kind, subject_ar, body_ar, is_locked, updated_at')
    .eq('company_id', companyId)
    .order('kind')

  if (error) throw new Error(error.message)

  return (data ?? []).map((row) => ({
    id: row.id,
    companyId: row.company_id,
    kind: row.kind as CommKind,
    subjectAr: row.subject_ar,
    bodyAr: row.body_ar,
    isLocked: row.is_locked,
    updatedAt: row.updated_at,
  }))
}

export async function updateCommunicationTemplate(params: {
  companyId: string
  kind: CommKind
  subjectAr: string
  bodyAr: string
}): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('communication_templates')
    .update({
      subject_ar: params.subjectAr,
      body_ar: params.bodyAr,
      updated_at: new Date().toISOString(),
    })
    .eq('company_id', params.companyId)
    .eq('kind', params.kind)

  if (error) throw new Error(error.message)
}

export async function fetchJobAutoReplyEnabled(jobId: string): Promise<boolean> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('job_auto_reply_enabled', {
    p_job_id: jobId,
  })

  if (error) throw new Error(error.message)
  return Boolean(data)
}

export async function fetchApplicationCommLogs(
  applicationId: string,
): Promise<Array<{ kind: CommKind; sentAt: string; status: string }>> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('communication_log')
    .select('kind, sent_at, status')
    .eq('application_id', applicationId)
    .eq('status', 'sent')
    .order('sent_at', { ascending: false })

  if (error) throw new Error(error.message)

  return (data ?? []).map((row) => ({
    kind: row.kind as CommKind,
    sentAt: row.sent_at,
    status: row.status,
  }))
}
