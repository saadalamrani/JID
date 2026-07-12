import 'server-only'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { OwnershipType } from '@/types/catalog'
import type { ApprovedCompanyPoster } from '@/lib/jobs/poster-types'

export type { ApprovedCompanyPoster } from '@/lib/jobs/poster-types'

function unionDomains(...sets: (string[] | null | undefined)[]): string[] {
  const seen = new Set<string>()
  for (const list of sets) {
    for (const raw of list ?? []) {
      const trimmed = raw.trim().toLowerCase()
      if (trimmed) seen.add(trimmed)
    }
  }
  return Array.from(seen)
}

async function fetchApprovedCompanyForUser(
  userId: string,
): Promise<ApprovedCompanyPoster | null> {
  const supabase = await createClient()

  const { data: ownedProfile } = await supabase
    .from('business_profiles')
    .select('id, verified_domains, directory_id, status')
    .eq('owner_user_id', userId)
    .neq('status', 'suspended')
    .maybeSingle()

  if (ownedProfile?.id) {
    const { data: company, error } = await supabase
      .from('companies')
      .select('id, name, name_ar, logo_url, ownership_type, domains, entity_state')
      .eq('id', ownedProfile.directory_id)
      .maybeSingle()

    if (!error && company) {
      const directoryDomains = company.domains ?? []
      return {
        userId,
        businessProfileId: ownedProfile.id,
        trustedDomains: unionDomains(ownedProfile.verified_domains, directoryDomains),
        company: {
          id: company.id,
          name: company.name,
          name_ar: company.name_ar,
          logo_url: company.logo_url,
          ownership_type: company.ownership_type as OwnershipType | null,
          domains: directoryDomains,
          entity_state: company.entity_state ?? 'approved',
        },
      }
    }
  }

  // TRANSITIONAL (P-104): legacy claimed_by path until P-110 backfill
  const { data: company, error } = await supabase
    .from('companies')
    .select(
      'id, name, name_ar, logo_url, ownership_type, domains, entity_state, claimed_by',
    )
    .eq('claimed_by', userId)
    .eq('entity_state', 'approved')
    .maybeSingle()

  if (error || !company) return null

  const directoryDomains = company.domains ?? []

  return {
    userId,
    businessProfileId: null,
    trustedDomains: unionDomains(directoryDomains),
    company: {
      id: company.id,
      name: company.name,
      name_ar: company.name_ar,
      logo_url: company.logo_url,
      ownership_type: company.ownership_type as OwnershipType | null,
      domains: directoryDomains,
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
 * Profile owner (Layer 3) or legacy claimed_by company (transitional).
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
    redirect('/company/verification-pending')
  }

  return poster
}
