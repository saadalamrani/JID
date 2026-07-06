import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'
import type { DeclareApplicationResult, JobDeclarationStatus } from '@/types/self-declaration'

type Client = SupabaseClient<Database>

const ACTIVE_APPLICATION_STATUSES = [
  'pending',
  'draft',
  'submitted',
  'under_review',
  'shortlisted',
  'invited',
] as const

export async function getPrimaryVerifiedEmail(
  supabase: Client,
  userId: string,
  authEmail?: string | null,
): Promise<string | null> {
  const { data: verifiedRow } = await supabase
    .from('user_verified_emails')
    .select('email')
    .eq('user_id', userId)
    .eq('is_primary', true)
    .maybeSingle()

  if (verifiedRow?.email) return verifiedRow.email

  const { data: anyVerified } = await supabase
    .from('user_verified_emails')
    .select('email')
    .eq('user_id', userId)
    .order('verified_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (anyVerified?.email) return anyVerified.email

  const normalizedAuthEmail = authEmail?.trim().toLowerCase()
  return normalizedAuthEmail ?? null
}

export async function getJobDeclarationStatus(
  supabase: Client,
  userId: string,
  jobId: string,
  authEmail?: string | null,
): Promise<JobDeclarationStatus> {
  const { data } = await supabase
    .from('applications')
    .select('id')
    .eq('job_id', jobId)
    .eq('applicant_id', userId)
    .in('status', [...ACTIVE_APPLICATION_STATUSES])
    .maybeSingle()

  const primaryEmail = await getPrimaryVerifiedEmail(supabase, userId, authEmail)

  return {
    declared: Boolean(data?.id),
    primaryEmail,
  }
}

export async function insertApplicationIntent(
  supabase: Client,
  userId: string,
  jobId: string,
): Promise<void> {
  const { error } = await supabase.from('application_intents').insert({
    job_id: jobId,
    user_id: userId,
  })

  if (!error) return

  if (error.code === '23505') return

  throw new Error(error.message)
}

/**
 * Self-declaration ("Apply") for Job Board.
 *
 * TODO (Radar Day 4): Add a "Save for later" button on JobCard that upserts
 * status='saved'. This function upserts saved → pending on declare so Radar's
 * Saved column can transition to Applied without violating UNIQUE(job_id, applicant_id).
 */
export async function insertApplicationDeclaration(
  supabase: Client,
  userId: string,
  jobId: string,
  contactEmail: string,
): Promise<DeclareApplicationResult> {
  const now = new Date().toISOString()

  const { error } = await supabase.from('applications').upsert(
    {
      job_id: jobId,
      applicant_id: userId,
      status: 'pending',
      contact_email: contactEmail,
      submitted_at: now,
      updated_at: now,
    },
    { onConflict: 'job_id,applicant_id' },
  )

  if (!error) {
    return { declared: true }
  }

  throw new Error(error.message)
}
