import 'server-only'

import { fetchProfileForUser } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { requireStaffShellAccess } from '@/lib/staff/require-staff-access'
import type { RelatedClaimHistoryItem } from '@/lib/staff/claim-review-shared'

export type { RelatedClaimHistoryItem } from '@/lib/staff/claim-review-shared'

export type ClaimDetail = {
  id: string
  user_id: string
  company_id: string
  company_name: string
  business_email: string
  claimant_name: string
  claimant_title: string | null
  status: string
  claim_type: 'company' | 'university'
  created_at: string
  reviewed_at: string | null
  review_notes: string | null
  rejection_reason: string | null
  required_documents: string[]
  assigned_staff_id: string | null
  sla_due_at: string | null
}

export type EntityDetail = {
  id: string
  name: string
  name_ar: string | null
  entity_type: string
  entity_state: string
  domains: string[]
  is_verified: boolean
  claimed_by: string | null
  linkedin_url: string | null
  website_url: string | null
}

export type ClaimantProfile = {
  id: string
  full_name: string | null
  role: string
  phone_verified_at: string | null
  email_verified_at: string | null
}

export type ClaimReviewWorkspaceData = {
  claim: ClaimDetail
  entity: EntityDetail | null
  claimant: ClaimantProfile | null
  relatedHistory: RelatedClaimHistoryItem[]
  currentUserId: string
  isSelfReview: boolean
}

/** Auto-assign on first view when unassigned (RPC uses row lock; safe for concurrent opens). */
export async function assignClaimToSelfIfUnassigned(
  claimId: string,
  assignedStaffId: string | null,
): Promise<void> {
  if (assignedStaffId) return

  const supabase = await createClient()
  const { error } = await supabase.rpc('assign_claim_to_self', { p_claim_id: claimId })
  if (error) {
    console.warn('[assign_claim_to_self]', error.message)
  }
}

export async function fetchClaimReviewWorkspace(
  claimId: string,
): Promise<ClaimReviewWorkspaceData | null> {
  const staffProfile = await requireStaffShellAccess()
  const supabase = await createClient()

  const { data: claimRow, error: claimError } = await supabase
    .from('claim_requests')
    .select(
      'id, user_id, company_id, company_name, business_email, claimant_name, claimant_title, status, claim_type, created_at, reviewed_at, review_notes, rejection_reason, required_documents, assigned_staff_id, sla_due_at',
    )
    .eq('id', claimId)
    .maybeSingle()

  if (claimError) throw new Error(claimError.message)
  if (!claimRow) return null

  const claim = claimRow as ClaimDetail

  await assignClaimToSelfIfUnassigned(claim.id, claim.assigned_staff_id)

  const [{ data: entityRow }, claimant, relatedHistory, assignmentRow] = await Promise.all([
    supabase
      .from('companies')
      .select(
        'id, name, name_ar, entity_type, entity_state, domains, is_verified, claimed_by, linkedin_url, website_url',
      )
      .eq('id', claim.company_id)
      .maybeSingle(),
    fetchProfileForUser(supabase, claim.user_id),
    fetchRelatedClaimHistory(supabase, claim.id, claim.user_id, claim.company_id),
    claim.assigned_staff_id
      ? Promise.resolve(null)
      : supabase
          .from('claim_requests')
          .select('assigned_staff_id')
          .eq('id', claim.id)
          .maybeSingle(),
  ])

  const resolvedClaim =
    assignmentRow?.data?.assigned_staff_id != null
      ? { ...claim, assigned_staff_id: assignmentRow.data.assigned_staff_id }
      : claim

  return {
    claim: resolvedClaim,
    entity: (entityRow as EntityDetail | null) ?? null,
    claimant: claimant
      ? {
          id: claimant.id,
          full_name: claimant.full_name,
          role: claimant.role,
          phone_verified_at: claimant.phone_verified_at,
          email_verified_at: claimant.email_verified_at,
        }
      : null,
    relatedHistory,
    currentUserId: staffProfile.id,
    isSelfReview: claim.user_id === staffProfile.id,
  }
}

async function fetchRelatedClaimHistory(
  supabase: Awaited<ReturnType<typeof createClient>>,
  claimId: string,
  userId: string,
  companyId: string,
): Promise<RelatedClaimHistoryItem[]> {
  const { data, error } = await supabase
    .from('claim_requests')
    .select('id, company_name, status, claim_type, created_at, reviewed_at, user_id, company_id')
    .or(`user_id.eq.${userId},company_id.eq.${companyId}`)
    .neq('id', claimId)
    .order('created_at', { ascending: false })
    .limit(15)

  if (error) throw new Error(error.message)

  return (data ?? []).map((row) => ({
    id: row.id,
    company_name: row.company_name,
    status: row.status,
    claim_type: row.claim_type,
    created_at: row.created_at,
    reviewed_at: row.reviewed_at,
    relation: row.user_id === userId ? 'same_user' : 'same_entity',
  }))
}

