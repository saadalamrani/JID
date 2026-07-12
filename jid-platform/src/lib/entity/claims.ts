import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'
import {
  buildDomainMismatchMessage,
  emailDomainMatchesAllowed,
} from '@/lib/entity/domains'
import { getCompanyById } from '@/lib/entity/companies'
import type { EntitySignupType } from '@/lib/entity/constants'
import type { ClaimSubmissionFormValues } from '@/lib/validations/entity'

type Client = SupabaseClient<Database>

export type SubmitClaimInput = ClaimSubmissionFormValues & {
  companyId: string
  companyName: string
  claimType: EntitySignupType
  locale?: 'ar' | 'en'
}

export { SLA_HOURS } from '@/lib/entity/constants'

function toVerificationType(claimType: EntitySignupType): Database['public']['Enums']['claim_type'] {
  return claimType === 'company' ? 'business' : 'university'
}

export async function submitClaimRequest(supabase: Client, input: SubmitClaimInput) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error('Authentication required')
  }

  const company = await getCompanyById(supabase, input.companyId)
  if (!company) {
    throw new Error('Company not found')
  }

  const locale = input.locale ?? 'ar'

  if (!emailDomainMatchesAllowed(input.business_email, company.domains)) {
    throw new Error(buildDomainMismatchMessage(company.domains, locale))
  }

  const { data: priorRejected } = await supabase
    .from('verification_requests')
    .select('can_reapply_after')
    .eq('applicant_user_id', user.id)
    .eq('status', 'rejected')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (
    priorRejected?.can_reapply_after &&
    new Date(priorRejected.can_reapply_after).getTime() > Date.now()
  ) {
    const reapplyDate = new Date(priorRejected.can_reapply_after).toLocaleString(
      locale === 'ar' ? 'ar-SA' : 'en-US',
    )
    throw new Error(
      locale === 'ar'
        ? `لا يمكن إعادة التقديم قبل ${reapplyDate}`
        : `You cannot reapply before ${reapplyDate}`,
    )
  }

  const { data, error } = await supabase
    .from('verification_requests')
    .insert({
      applicant_user_id: user.id,
      directory_id: input.companyId,
      company_name: input.companyName,
      business_email: input.business_email.trim().toLowerCase(),
      claimant_name: input.claimant_name.trim(),
      claimant_title: input.claimant_title.trim(),
      evidence_urls: [],
      status: 'pending_review',
      verification_type: toVerificationType(input.claimType),
    })
    .select('id, status, created_at')
    .single()

  if (error || !data) {
    throw new Error(error?.message ?? 'Failed to submit verification request')
  }

  return data
}

export async function getLatestVerificationForUser(supabase: Client, userId: string) {
  const { data, error } = await supabase
    .from('verification_requests')
    .select('*')
    .eq('applicant_user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data
}

/** @deprecated Use getLatestVerificationForUser */
export const getLatestClaimForUser = getLatestVerificationForUser

export function hoursSince(dateIso: string): number {
  return (Date.now() - new Date(dateIso).getTime()) / (1000 * 60 * 60)
}

export function slaProgressPercent(createdAt: string, slaHours: number): number {
  const elapsed = hoursSince(createdAt)
  return Math.min(100, Math.round((elapsed / slaHours) * 100))
}
