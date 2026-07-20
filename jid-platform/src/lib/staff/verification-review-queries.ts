import 'server-only'

import { fetchProfileForUser } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { requireStaffShellAccess } from '@/lib/staff/require-staff-access'
import type { RelatedVerificationHistoryItem } from '@/lib/staff/verification-review-shared'

export type { RelatedVerificationHistoryItem } from '@/lib/staff/verification-review-shared'

export type VerificationDetail = {
  id: string
  applicant_user_id: string
  directory_id: string
  company_name: string
  business_email: string
  claimant_name: string
  claimant_title: string | null
  status: string
  verification_type: 'business' | 'university'
  created_at: string
  reviewed_at: string | null
  review_notes: string | null
  rejection_reason: string | null
  required_documents: string[]
  assigned_staff_id: string | null
  sla_due_at: string | null
}

export type DirectoryDetail = {
  id: string
  name: string
  name_ar: string | null
  entity_type: string
  entity_state: string
  domains: string[]
  is_verified: boolean
  linkedin_url: string | null
  website_url: string | null
}

export type ApplicantProfile = {
  id: string
  full_name: string | null
  role: string
  phone_verified_at: string | null
  email_verified_at: string | null
}

export type VerificationReviewWorkspaceData = {
  verification: VerificationDetail
  directory: DirectoryDetail | null
  applicant: ApplicantProfile | null
  relatedHistory: RelatedVerificationHistoryItem[]
  currentUserId: string
  isSelfReview: boolean
}

async function assignVerificationToSelfIfUnassigned(
  verificationId: string,
  assignedStaffId: string | null,
  staffId: string,
): Promise<void> {
  if (assignedStaffId) return

  const supabase = await createClient()
  const now = new Date().toISOString()
  const { error } = await supabase
    .from('verification_requests')
    .update({
      assigned_staff_id: staffId,
      first_viewed_at: now,
      first_viewed_by: staffId,
      updated_at: now,
    })
    .eq('id', verificationId)
    .is('assigned_staff_id', null)

  if (error) {
    console.warn('[assign_verification_to_self]', error.message)
  }
}

export async function fetchVerificationReviewWorkspace(
  verificationId: string,
): Promise<VerificationReviewWorkspaceData | null> {
  const staffProfile = await requireStaffShellAccess()
  const supabase = await createClient()

  const { data: verificationRow, error: verificationError } = await supabase
    .from('verification_requests')
    .select(
      'id, applicant_user_id, directory_id, company_name, business_email, claimant_name, claimant_title, status, verification_type, created_at, reviewed_at, review_notes, rejection_reason, required_documents, assigned_staff_id, sla_due_at',
    )
    .eq('id', verificationId)
    .maybeSingle()

  if (verificationError) throw new Error(verificationError.message)
  if (!verificationRow) return null

  const verification = verificationRow as VerificationDetail

  await assignVerificationToSelfIfUnassigned(
    verification.id,
    verification.assigned_staff_id,
    staffProfile.id,
  )

  const [{ data: directoryRow }, applicant, relatedHistory, assignmentRow] = await Promise.all([
    supabase
      .from('companies')
      .select(
        'id, name, name_ar, entity_type, entity_state, domains, is_verified, linkedin_url, website_url',
      )
      .eq('id', verification.directory_id)
      .maybeSingle(),
    fetchProfileForUser(supabase, verification.applicant_user_id),
    fetchRelatedVerificationHistory(
      supabase,
      verification.id,
      verification.applicant_user_id,
      verification.directory_id,
    ),
    verification.assigned_staff_id
      ? Promise.resolve(null)
      : supabase
          .from('verification_requests')
          .select('assigned_staff_id')
          .eq('id', verification.id)
          .maybeSingle(),
  ])

  const resolvedVerification =
    assignmentRow?.data?.assigned_staff_id != null
      ? { ...verification, assigned_staff_id: assignmentRow.data.assigned_staff_id }
      : verification

  return {
    verification: resolvedVerification,
    directory: (directoryRow as DirectoryDetail | null) ?? null,
    applicant: applicant
      ? {
          id: applicant.id,
          full_name: applicant.full_name,
          role: applicant.role,
          phone_verified_at: applicant.phone_verified_at,
          email_verified_at: applicant.email_verified_at,
        }
      : null,
    relatedHistory,
    currentUserId: staffProfile.id,
    isSelfReview: verification.applicant_user_id === staffProfile.id,
  }
}

async function fetchRelatedVerificationHistory(
  supabase: Awaited<ReturnType<typeof createClient>>,
  verificationId: string,
  userId: string,
  directoryId: string,
): Promise<RelatedVerificationHistoryItem[]> {
  const { data, error } = await supabase
    .from('verification_requests')
    .select(
      'id, company_name, status, verification_type, created_at, reviewed_at, applicant_user_id, directory_id',
    )
    .or(`applicant_user_id.eq.${userId},directory_id.eq.${directoryId}`)
    .neq('id', verificationId)
    .order('created_at', { ascending: false })
    .limit(15)

  if (error) throw new Error(error.message)

  return (data ?? []).map((row) => ({
    id: row.id,
    company_name: row.company_name,
    status: row.status,
    verification_type: row.verification_type,
    created_at: row.created_at,
    reviewed_at: row.reviewed_at,
    relation: row.applicant_user_id === userId ? 'same_user' : 'same_entity',
  }))
}
