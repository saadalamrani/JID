import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'
import { extractEmailDomain, normalizeDomain } from '@/lib/entity/domains'
import type { EntitySignupType } from '@/lib/entity/constants'
import type { OrganizationRegistrationFormValues } from '@/lib/validations/entity'

type Client = SupabaseClient<Database>

export type SubmitVerificationInput = OrganizationRegistrationFormValues & {
  signupType: EntitySignupType
  locale?: 'ar' | 'en'
}

export { SLA_HOURS } from '@/lib/entity/constants'

function toVerificationType(
  signupType: EntitySignupType,
): Database['public']['Enums']['verification_type_enum'] {
  return signupType === 'company' ? 'business' : 'university'
}

function normalizeWebsite(value?: string): string | null {
  const trimmed = value?.trim()
  if (!trimmed) return null
  return trimmed.startsWith('http') ? trimmed : `https://${trimmed}`
}

function submittedDomainFromInput(input: SubmitVerificationInput): string | null {
  if (input.domain?.trim()) return normalizeDomain(input.domain)
  return extractEmailDomain(input.business_email)
}

export async function submitVerificationRequest(supabase: Client, input: SubmitVerificationInput) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error('Authentication required')
  }

  if (!user.email_confirmed_at) {
    throw new Error(
      input.locale === 'en'
        ? 'Confirm your account email before submitting a verification request'
        : 'أكد بريد حسابك قبل إرسال طلب التحقق',
    )
  }

  const locale = input.locale ?? 'ar'

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

  const organizationName = input.organization_name.trim()
  const submittedDomain = submittedDomainFromInput(input)

  const { data, error } = await supabase
    .from('verification_requests')
    .insert({
      applicant_user_id: user.id,
      directory_id: null,
      company_name: organizationName,
      business_email: input.business_email.trim().toLowerCase(),
      representative_name: input.representative_name.trim(),
      representative_title: input.representative_title.trim(),
      evidence_urls: [],
      status: 'pending_review',
      verification_type: toVerificationType(input.signupType),
      submitted_name_ar: input.organization_name_ar?.trim() || null,
      submitted_name_en: organizationName,
      submitted_website: normalizeWebsite(input.website),
      submitted_domain: submittedDomain,
    })
    .select('id, status, created_at')
    .single()

  if (error || !data) {
    throw new Error(error?.message ?? 'Failed to submit verification request')
  }

  return data
}

/** @deprecated Use submitVerificationRequest */
export const submitClaimRequest = submitVerificationRequest

export async function getLatestVerificationForUser(
  supabase: Client,
  userId: string,
  verificationType?: Database['public']['Enums']['verification_type_enum'],
) {
  let query = supabase
    .from('verification_requests')
    .select('*')
    .eq('applicant_user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)

  if (verificationType) {
    query = query.eq('verification_type', verificationType)
  }

  const { data, error } = await query.maybeSingle()

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
