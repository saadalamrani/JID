import 'server-only'

import {
  buildDomainMismatchMessage,
  emailDomainMatchesAllowed,
  extractEmailDomain,
} from '@/lib/entity/domains'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Database } from '@/lib/supabase/types'
import type { SupabaseClient } from '@supabase/supabase-js'

export type ClaimableCompany = {
  id: string
  name: string
  name_ar: string | null
  slug: string | null
  domains: string[]
  entity_state: string
}

type CompanyClient = SupabaseClient<Database>

/**
 * Section 5.5 — surface an unclaimed company when the user's email domain matches.
 */
export async function checkClaimableProfile(
  supabase: CompanyClient,
  userEmail: string,
): Promise<ClaimableCompany | null> {
  const email = userEmail.trim().toLowerCase()
  if (!extractEmailDomain(email)) return null

  const { data, error } = await supabase
    .from('companies')
    .select('id, name, name_ar, slug, domains, entity_state')
    .eq('entity_state', 'unclaimed')
    .eq('entity_type', 'company')
    .eq('is_active', true)

  if (error) throw new Error(error.message)

  const match = (data ?? []).find((company) =>
    emailDomainMatchesAllowed(email, company.domains ?? []),
  )

  if (!match || match.entity_state !== 'unclaimed') return null

  return {
    id: match.id,
    name: match.name,
    name_ar: match.name_ar,
    slug: match.slug,
    domains: match.domains ?? [],
    entity_state: match.entity_state,
  }
}

export type SubmitCatalogClaimInput = {
  companyId: string
  userId: string
  userEmail: string
  claimantName: string
  claimantTitle?: string | null
  locale?: 'ar' | 'en'
}

export type SubmitCatalogClaimResult = {
  claimId: string
  companyId: string
  status: string
}

/**
 * Catalog claim submission — inserts claim_requests + updates companies (reconciled schema).
 */
export async function submitCatalogClaim(
  supabase: CompanyClient,
  input: SubmitCatalogClaimInput,
): Promise<SubmitCatalogClaimResult> {
  const locale = input.locale ?? 'ar'
  const businessEmail = input.userEmail.trim().toLowerCase()

  const { data: company, error: companyError } = await supabase
    .from('companies')
    .select('id, name, name_ar, domains, entity_state, claimed_by')
    .eq('id', input.companyId)
    .eq('entity_type', 'company')
    .maybeSingle()

  if (companyError) throw new Error(companyError.message)
  if (!company) throw new Error('Company not found')

  if (company.entity_state !== 'unclaimed') {
    throw new Error(
      locale === 'ar'
        ? 'تمت المطالبة بهذه الجهة مسبقاً أو أنها قيد المراجعة'
        : 'This company has already been claimed or is under review',
    )
  }

  if (!emailDomainMatchesAllowed(businessEmail, company.domains ?? [])) {
    throw new Error(buildDomainMismatchMessage(company.domains ?? [], locale))
  }

  const { data: existingClaim } = await supabase
    .from('claim_requests')
    .select('id')
    .eq('company_id', input.companyId)
    .in('status', ['pending', 'pending_review', 'under_review'])
    .maybeSingle()

  if (existingClaim) {
    throw new Error(
      locale === 'ar'
        ? 'يوجد طلب مطالبة قيد المراجعة لهذه الجهة'
        : 'A claim request for this company is already pending review',
    )
  }

  const { data: claim, error: claimError } = await supabase
    .from('claim_requests')
    .insert({
      user_id: input.userId,
      company_id: company.id,
      company_name: company.name,
      business_email: businessEmail,
      claimant_name: input.claimantName.trim(),
      claimant_title: input.claimantTitle?.trim() || null,
      evidence_urls: [],
      status: 'pending_review',
      claim_type: 'company',
      domain_verified: true,
    })
    .select('id, status')
    .single()

  if (claimError || !claim) {
    throw new Error(claimError?.message ?? 'Failed to submit claim')
  }

  const admin = createAdminClient()
  const nowIso = new Date().toISOString()

  const { error: companyUpdateError } = await admin
    .from('companies')
    .update({
      entity_state: 'pending_review',
      claimed_by: input.userId,
      claim_requested_at: nowIso,
      updated_at: nowIso,
    })
    .eq('id', company.id)
    .eq('entity_state', 'unclaimed')

  if (companyUpdateError) {
    await admin.from('claim_requests').delete().eq('id', claim.id)
    throw new Error(companyUpdateError.message)
  }

  return {
    claimId: claim.id,
    companyId: company.id,
    status: claim.status,
  }
}
