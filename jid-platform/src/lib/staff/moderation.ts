import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'

type Client = SupabaseClient<Database>

export type CorrectionReviewInput = {
  suggestionId: string
  reviewNotes: string
}

export type SuspendProfileInput = {
  profileId: string
  profileType: 'business' | 'university'
  reason: string
}

export type ReinstateProfileInput = {
  profileId: string
  profileType: 'business' | 'university'
  targetStatus?: 'draft' | 'published'
  reason?: string
}

function normalizeReviewNotes(notes: string, fallback: string): string {
  const trimmed = notes.trim()
  return trimmed.length > 0 ? trimmed : fallback
}

/** Staff approval — applies suggestion to Directory via SECURITY DEFINER RPC. */
export async function approveCorrectionSuggestion(
  client: Client,
  input: CorrectionReviewInput,
): Promise<void> {
  const notes = normalizeReviewNotes(input.reviewNotes, 'Approved')
  const { error } = await client.rpc('approve_correction_suggestion', {
    p_suggestion_id: input.suggestionId,
    p_review_notes: notes,
  })
  if (error) throw new Error(error.message)
}

/** Staff rejection — marks suggestion rejected without Directory write. */
export async function rejectCorrectionSuggestion(
  client: Client,
  input: CorrectionReviewInput,
): Promise<void> {
  const notes = normalizeReviewNotes(input.reviewNotes, 'Rejected')
  const { error } = await client.rpc('reject_correction_suggestion', {
    p_suggestion_id: input.suggestionId,
    p_review_notes: notes,
  })
  if (error) throw new Error(error.message)
}

/** Staff suspension — reason required by P-103 database constraint. */
export async function suspendProfile(client: Client, input: SuspendProfileInput): Promise<void> {
  const reason = input.reason.trim()
  if (!reason) {
    throw new Error('Reason is required')
  }

  const { error } = await client.rpc('suspend_profile', {
    p_profile_id: input.profileId,
    p_profile_type: input.profileType,
    p_reason: reason,
  })
  if (error) throw new Error(error.message)
}

/** Staff reinstatement — restores draft or published status after suspension. */
export async function reinstateProfile(client: Client, input: ReinstateProfileInput): Promise<void> {
  const { error } = await client.rpc('reinstate_profile', {
    p_profile_id: input.profileId,
    p_profile_type: input.profileType,
    p_target_status: input.targetStatus ?? 'draft',
    p_reason: input.reason?.trim() || undefined,
  })
  if (error) throw new Error(error.message)
}
