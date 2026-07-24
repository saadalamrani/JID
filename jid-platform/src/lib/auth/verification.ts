import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'

type Client = SupabaseClient<Database>

export type VerificationRequestRow = Database['public']['Tables']['verification_requests']['Row']

export type ApproveVerificationInput = {
  verificationId: string
  reviewNotes: string
  verifiedDomains?: string[]
}

export type RejectVerificationInput = {
  verificationId: string
  reviewNotes: string
  rejectionReason?: string
  requiredDocuments?: string[]
}

export type CreateOwnedProfileInput = {
  verificationId: string
  displayNameAr: string
  displayNameEn?: string | null
}

/**
 * Staff approval — grants role only; never writes Directory (companies) ownership fields.
 * P-108 Staff console should call this instead of review_claim.
 */
export async function approveVerificationRequest(
  client: Client,
  input: ApproveVerificationInput,
): Promise<void> {
  const notes = input.reviewNotes.trim()
  if (!notes) {
    throw new Error('Review notes are required')
  }

  const { error } = await client.rpc('approve_verification_request', {
    p_verification_id: input.verificationId,
    p_review_notes: notes,
    p_verified_domains: input.verifiedDomains ?? undefined,
  })

  if (error) {
    throw new Error(error.message)
  }
}

/**
 * Staff rejection — 7-day reapply window preserved in DB function.
 */
export async function rejectVerificationRequest(
  client: Client,
  input: RejectVerificationInput,
): Promise<void> {
  const notes = input.reviewNotes.trim()
  if (!notes && !input.rejectionReason?.trim()) {
    throw new Error('Review notes are required')
  }

  const { error } = await client.rpc('reject_verification_request', {
    p_verification_id: input.verificationId,
    p_review_notes: notes,
    p_rejection_reason: input.rejectionReason?.trim() || undefined,
    p_required_documents: input.requiredDocuments ?? undefined,
  })

  if (error) {
    throw new Error(error.message)
  }
}

/**
 * Super Admin override approval — ignores assigned_staff_id; audits assignment_overridden.
 * Signature mirrors approveVerificationRequest; do not call for non-super_admin callers.
 */
export async function approveVerificationRequestOverride(
  client: Client,
  input: ApproveVerificationInput,
): Promise<void> {
  const notes = input.reviewNotes.trim()
  if (!notes) {
    throw new Error('Review notes are required')
  }

  const { error } = await client.rpc('approve_verification_request_override', {
    p_verification_id: input.verificationId,
    p_review_notes: notes,
    p_verified_domains: input.verifiedDomains ?? undefined,
  })

  if (error) {
    throw new Error(error.message)
  }
}

/**
 * Super Admin override rejection — ignores assigned_staff_id; audits assignment_overridden.
 * Signature mirrors rejectVerificationRequest; do not call for non-super_admin callers.
 */
export async function rejectVerificationRequestOverride(
  client: Client,
  input: RejectVerificationInput,
): Promise<void> {
  const notes = input.reviewNotes.trim()
  if (!notes && !input.rejectionReason?.trim()) {
    throw new Error('Review notes are required')
  }

  const { error } = await client.rpc('reject_verification_request_override', {
    p_verification_id: input.verificationId,
    p_review_notes: notes,
    p_rejection_reason: input.rejectionReason?.trim() || undefined,
    p_required_documents: input.requiredDocuments ?? undefined,
  })

  if (error) {
    throw new Error(error.message)
  }
}

/** Approved verifications awaiting Layer-3 profile creation (P-105 wizard gate). */
export async function getMyApprovedVerifications(client: Client): Promise<VerificationRequestRow[]> {
  const { data, error } = await client.rpc('get_my_approved_verifications')

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []) as VerificationRequestRow[]
}

/** Layer 2 → Layer 3 for business entities. Idempotent per verification via resulting_profile_id guard. */
export async function createBusinessProfile(
  client: Client,
  input: CreateOwnedProfileInput,
): Promise<string> {
  const displayNameAr = input.displayNameAr.trim()
  if (!displayNameAr) {
    throw new Error('Arabic display name is required')
  }

  const { data, error } = await client.rpc('create_business_profile', {
    p_verification_id: input.verificationId,
    p_display_name_ar: displayNameAr,
    p_display_name_en: input.displayNameEn?.trim() || undefined,
  })

  if (error) {
    throw new Error(error.message)
  }

  if (!data) {
    throw new Error('Profile creation returned no id')
  }

  return data as string
}

/** Layer 2 → Layer 3 for universities. */
export async function createUniversityProfile(
  client: Client,
  input: CreateOwnedProfileInput,
): Promise<string> {
  const displayNameAr = input.displayNameAr.trim()
  if (!displayNameAr) {
    throw new Error('Arabic display name is required')
  }

  const { data, error } = await client.rpc('create_university_profile', {
    p_verification_id: input.verificationId,
    p_display_name_ar: displayNameAr,
    p_display_name_en: input.displayNameEn?.trim() || undefined,
  })

  if (error) {
    throw new Error(error.message)
  }

  if (!data) {
    throw new Error('Profile creation returned no id')
  }

  return data as string
}
