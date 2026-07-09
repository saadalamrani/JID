'use client'

import { createClient } from '@/lib/supabase/client'
import type { SsisTimelineEntry } from './types'

export async function invokeSsisGenerate(jobId: string) {
  const supabase = createClient()
  const { data, error } = await supabase.functions.invoke('ssis-generate-screening', {
    body: { job_id: jobId },
  })
  if (error) throw new Error(error.message)
  return data as { screening_id: string; block_count: number }
}

export async function invokeSsisRegenerateBlock(screeningId: string, blockId: string) {
  const supabase = createClient()
  const { data, error } = await supabase.functions.invoke('ssis-generate-screening', {
    body: { screening_id: screeningId, block_id: blockId },
  })
  if (error) throw new Error(error.message)
  return data
}

export async function fetchApplicationSsisTimeline(
  applicationId: string,
): Promise<SsisTimelineEntry[]> {
  const supabase = createClient()
  const { data: invitations } = await supabase
    .from('ssis_invitations')
    .select('id, status, created_at, started_at, completed_at')
    .eq('application_id', applicationId)
    .order('created_at', { ascending: true })

  if (!invitations?.length) return []

  const entries: SsisTimelineEntry[] = []

  for (const inv of invitations) {
    entries.push({
      kind: 'invited',
      at: inv.created_at as string,
      label_ar: 'دعوة فحص ذكي',
    })

    if (inv.started_at) {
      entries.push({
        kind: 'started',
        at: inv.started_at as string,
        label_ar: 'بدء الفحص',
      })
    }

    if (inv.completed_at) {
      entries.push({
        kind: 'completed',
        at: inv.completed_at as string,
        label_ar: 'إكمال الفحص',
      })
    }

    if (inv.status === 'completed') {
      const { data: evaluation } = await supabase
        .from('ssis_evaluations')
        .select('evaluated_at, recommendation')
        .eq('invitation_id', inv.id)
        .maybeSingle()

      if (evaluation?.evaluated_at) {
        entries.push({
          kind: 'evaluated',
          at: evaluation.evaluated_at as string,
          label_ar: 'نتيجة التقييم',
          recommendation: evaluation.recommendation as SsisTimelineEntry['recommendation'],
        })
      }
    }
  }

  return entries.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime())
}

export async function saveSsisResponse(
  invitationId: string,
  blockId: string,
  answerText: string,
) {
  const supabase = createClient()
  const { error } = await supabase.rpc('submit_ssis_response', {
    p_invitation_id: invitationId,
    p_block_id: blockId,
    p_answer_text: answerText,
  })
  if (error) throw new Error(error.message)
}

export async function consentSsisInvitation(invitationId: string) {
  const supabase = createClient()
  const { error } = await supabase.rpc('consent_ssis_invitation', {
    p_invitation_id: invitationId,
  })
  if (error) throw new Error(error.message)
}

export async function startSsisInvitation(invitationId: string) {
  const supabase = createClient()
  const { error } = await supabase.rpc('start_ssis_invitation', {
    p_invitation_id: invitationId,
  })
  if (error) throw new Error(error.message)
}

export async function completeSsisInvitation(invitationId: string) {
  const supabase = createClient()
  const { error } = await supabase.rpc('complete_ssis_invitation', {
    p_invitation_id: invitationId,
  })
  if (error) throw new Error(error.message)
}
