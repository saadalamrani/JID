import 'server-only'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { OwnershipType } from '@/types/catalog'
import type { ApprovedCompanyPoster } from '@/lib/jobs/poster-types'

export type { ApprovedCompanyPoster } from '@/lib/jobs/poster-types'

async function fetchApprovedCompanyForUser(
  userId: string,
): Promise<ApprovedCompanyPoster | null> {
  const supabase = await createClient()

  const { data: company, error } = await supabase
    .from('companies')
    .select(
      'id, name, name_ar, logo_url, ownership_type, domains, entity_state, claimed_by',
    )
    .eq('claimed_by', userId)
    .eq('entity_state', 'approved')
    .maybeSingle()

  if (error || !company) return null

  return {
    userId,
    company: {
      id: company.id,
      name: company.name,
      name_ar: company.name_ar,
      logo_url: company.logo_url,
      ownership_type: company.ownership_type as OwnershipType | null,
      domains: company.domains ?? [],
      entity_state: company.entity_state,
    },
  }
}

/**
 * API-safe gate — returns null when unauthenticated or company not approved.
 */
export async function getApprovedCompanyPoster(): Promise<ApprovedCompanyPoster | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null
  return fetchApprovedCompanyForUser(user.id)
}

/**
 * Server-side gate for job posting pages (Section 6.1).
 * Requires claimed_by = auth.uid() AND entity_state = 'approved'.
 */
export async function requireApprovedCompanyPoster(): Promise<ApprovedCompanyPoster> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const poster = await fetchApprovedCompanyForUser(user.id)
  if (!poster) {
    redirect('/company/pending-review')
  }

  return poster
}
