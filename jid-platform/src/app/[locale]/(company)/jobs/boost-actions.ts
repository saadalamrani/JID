'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type BoostActionResult = { ok: true } | { ok: false; error: string }

export async function toggleJobBoost(
  jobId: string,
  enable: boolean,
): Promise<BoostActionResult> {
  const supabase = await createClient()
  const { error } = await supabase.rpc('toggle_job_boost', {
    p_job_id: jobId,
    p_enable: enable,
  })

  if (error) {
    if (error.message.includes('boost_quota_exceeded')) {
      return { ok: false, error: 'boost_quota_exceeded' }
    }
    if (error.message.includes('subscription_required')) {
      return { ok: false, error: 'subscription_required' }
    }
    return { ok: false, error: error.message }
  }

  revalidatePath(`/jobs/${jobId}/applicants`)
  revalidatePath('/opportunities')
  return { ok: true }
}
