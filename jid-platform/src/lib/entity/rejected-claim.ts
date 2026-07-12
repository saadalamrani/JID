import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'

type Client = SupabaseClient<Database>

export type RejectedClaimView = {
  id: string
  directory_id: string
  company_name: string
  rejection_reason: string | null
  required_documents: string[]
  can_reapply_after: string | null
  status: string
}

export async function getLatestRejectedVerification(
  supabase: Client,
  userId: string,
  verificationType?: Database['public']['Enums']['claim_type'],
): Promise<RejectedClaimView | null> {
  let query = supabase
    .from('verification_requests')
    .select(
      'id, directory_id, company_name, rejection_reason, required_documents, can_reapply_after, status',
    )
    .eq('applicant_user_id', userId)
    .eq('status', 'rejected')
    .order('created_at', { ascending: false })
    .limit(1)

  if (verificationType) {
    query = query.eq('verification_type', verificationType)
  }

  const { data, error } = await query.maybeSingle()

  if (error) throw new Error(error.message)
  return (data as RejectedClaimView | null) ?? null
}

/** @deprecated Use getLatestRejectedVerification */
export const getLatestRejectedClaim = getLatestRejectedVerification

export function canReapplyNow(canReapplyAfter: string | null): boolean {
  if (!canReapplyAfter) return true
  return Date.now() >= new Date(canReapplyAfter).getTime()
}

export function formatRequiredDocuments(docs: string[], locale: 'ar' | 'en' = 'ar'): string {
  const labels: Record<string, { ar: string; en: string }> = {
    commercial_registry: { ar: 'السجل التجاري', en: 'Commercial registry' },
    domain_ownership_proof: { ar: 'إثبات ملكية النطاق', en: 'Domain ownership proof' },
    authorization_letter: { ar: 'خطاب تفويض', en: 'Authorization letter' },
  }

  return docs
    .map((doc) => labels[doc]?.[locale] ?? doc)
    .join(locale === 'ar' ? '، ' : ', ')
}
