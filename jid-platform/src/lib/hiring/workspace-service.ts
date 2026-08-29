import 'server-only'

import { createClient } from '@/lib/supabase/server'
import type { HiringOutcome } from '@/types/contracts/hiring'

type RpcError = { message: string }
type RpcResult<T> = Promise<{ data: T | null; error: RpcError | null }>
type HiringRpc = (name: string, args: Record<string, unknown>) => RpcResult<string>

function dbOutcome(outcome?: HiringOutcome): string | null {
  return outcome?.toLowerCase() ?? null
}

export async function initializeHiringRole(input: {
  jobId: string
  titleAr: string
  titleEn: string
}): Promise<string> {
  const client = await createClient()
  const rpc = client.rpc as unknown as HiringRpc
  const { data, error } = await rpc('initialize_hiring_role', {
    p_job_id: input.jobId,
    p_title_ar: input.titleAr,
    p_title_en: input.titleEn,
  })
  if (error || !data) throw new Error(error?.message ?? 'تعذّر إعداد مساحة التوظيف')
  return data
}

export async function transitionHiringApplication(input: {
  applicationId: string
  toStageId: string
  outcome?: HiringOutcome
  reason?: string
}): Promise<string> {
  const client = await createClient()
  const rpc = client.rpc as unknown as HiringRpc
  const { data, error } = await rpc('transition_hiring_application', {
    p_application_id: input.applicationId,
    p_to_stage_id: input.toStageId,
    p_outcome: dbOutcome(input.outcome),
    p_reason: input.reason?.trim() || null,
  })
  if (error || !data) throw new Error(error?.message ?? 'تعذّر نقل الطلب')
  return data
}

export async function withdrawHiringApplication(
  applicationId: string,
  reason?: string,
): Promise<string> {
  const client = await createClient()
  const rpc = client.rpc as unknown as HiringRpc
  const { data, error } = await rpc('withdraw_hiring_application', {
    p_application_id: applicationId,
    p_reason: reason?.trim() || null,
  })
  if (error || !data) throw new Error(error?.message ?? 'تعذّر سحب الطلب')
  return data
}

export async function addHiringNote(applicationId: string, body: string): Promise<string> {
  const client = await createClient()
  const rpc = client.rpc as unknown as HiringRpc
  const { data, error } = await rpc('add_hiring_note', {
    p_application_id: applicationId,
    p_body: body,
  })
  if (error || !data) throw new Error(error?.message ?? 'تعذّرت إضافة الملاحظة')
  return data
}
