'use client'

import { createClient } from '@/lib/supabase/client'

export async function recordBoostImpression(jobId: string): Promise<void> {
  try {
    const supabase = createClient()
    await supabase.rpc('increment_job_boost_stat', {
      p_job_id: jobId,
      p_metric: 'impressions',
    })
    if (process.env.NODE_ENV === 'development') {
      console.debug('[analytics]', 'boosted_card_impression', { job_id: jobId })
    }
  } catch {
    // non-blocking
  }
}

export async function recordBoostCardOpen(jobId: string): Promise<void> {
  try {
    const supabase = createClient()
    await supabase.rpc('increment_job_boost_stat', {
      p_job_id: jobId,
      p_metric: 'card_opens',
    })
    if (process.env.NODE_ENV === 'development') {
      console.debug('[analytics]', 'boosted_card_opened', { job_id: jobId })
    }
  } catch {
    // non-blocking
  }
}
