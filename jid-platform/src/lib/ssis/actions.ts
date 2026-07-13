'use server'

import { revalidatePath } from 'next/cache'
import { assertJobTriageAccess } from '@/lib/applications/triage-access'
import { createClient } from '@/lib/supabase/server'
import type { Json } from '@/lib/supabase/types'
import type { SsisRubricCriterion } from '@/lib/ssis/types'

export async function acknowledgeSsisPreviewAction(screeningId: string, jobId: string) {
  await assertJobTriageAccess(jobId)
  const supabase = await createClient()
  const { error } = await supabase.rpc('acknowledge_ssis_preview', {
    p_screening_id: screeningId,
  })
  if (error) throw new Error(error.message)
  revalidatePath(`/jobs/${jobId}/screening`)
}

export async function approveSsisScreeningAction(screeningId: string, jobId: string) {
  await assertJobTriageAccess(jobId)
  const supabase = await createClient()
  const { error } = await supabase.rpc('approve_ssis_screening', {
    p_screening_id: screeningId,
  })
  if (error) throw new Error(error.message)
  revalidatePath(`/jobs/${jobId}/screening`)
}

export async function updateSsisBlockAction(
  blockId: string,
  jobId: string,
  payload: { prompt_ar: string; rubric: SsisRubricCriterion[] },
) {
  await assertJobTriageAccess(jobId)
  const supabase = await createClient()
  const { error } = await supabase
    .from('ssis_blocks')
    .update({
      prompt_ar: payload.prompt_ar,
      rubric: payload.rubric as Json,
      edited_by_human: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', blockId)
  if (error) throw new Error(error.message)
  revalidatePath(`/jobs/${jobId}/screening`)
}

export async function inviteSsisApplicantsAction(
  screeningId: string,
  jobId: string,
  applicationIds: string[],
) {
  await assertJobTriageAccess(jobId)
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('invite_ssis_applicants', {
    p_screening_id: screeningId,
    p_application_ids: applicationIds,
  })
  if (error) throw new Error(error.message)
  revalidatePath(`/jobs/${jobId}/screening`)
  return Number(data ?? 0)
}

export async function recordSsisOutcomeAction(
  invitationId: string,
  jobId: string,
  action: 'advance' | 'decline',
) {
  await assertJobTriageAccess(jobId)
  const supabase = await createClient()
  const { error } = await supabase.rpc('record_ssis_outcome', {
    p_invitation_id: invitationId,
    p_action: action,
  })
  if (error) throw new Error(error.message)
  revalidatePath(`/jobs/${jobId}/screening`)
  revalidatePath(`/jobs/${jobId}/applicants`)
}
