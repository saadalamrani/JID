'use server'

import { revalidatePath } from 'next/cache'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/types'

type UntypedClient = SupabaseClient<Record<string, unknown>>
export type Wave10ActionResult = { ok: true } | { ok: false; error: string }

function untyped(client: SupabaseClient<Database>): UntypedClient {
  return client as unknown as UntypedClient
}

async function rpc(name: string, args: Record<string, unknown>): Promise<Wave10ActionResult> {
  const client = untyped(await createClient())
  const { error } = await client.rpc(name, args)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/profile/university-affiliation')
  revalidatePath('/university/dashboard')
  revalidatePath('/staff/universities')
  return { ok: true }
}

export async function declareUniversityAffiliation(input: {
  catalogUniversityId: string
  personStatus: 'STUDENT' | 'GRADUATE' | 'OTHER'
  collegeId?: string | null
  majorId?: string | null
  degreeLevel?: 'diploma' | 'bachelor' | 'master' | 'doctorate' | 'other' | null
  graduationYear?: number | null
}): Promise<Wave10ActionResult> {
  return rpc('declare_university_affiliation', {
    p_catalog_university_id: input.catalogUniversityId,
    p_person_status: input.personStatus,
    p_college_id: input.collegeId ?? null,
    p_major_id: input.majorId ?? null,
    p_degree_level: input.degreeLevel ?? null,
    p_graduation_year: input.graduationYear ?? null,
  })
}

export async function requestUniversityAffiliationReview(
  affiliationId: string,
  reason: string,
): Promise<Wave10ActionResult> {
  return rpc('request_university_affiliation_review', {
    p_affiliation_id: affiliationId,
    p_review_reason: reason,
  })
}

export async function revokeOwnUniversityAffiliation(
  affiliationId: string,
  reason: string,
): Promise<Wave10ActionResult> {
  return rpc('revoke_university_affiliation', {
    p_affiliation_id: affiliationId,
    p_reason: reason,
  })
}

export async function recordOwnDeclaredOutcome(
  affiliationId: string,
  presence: 'KNOWN' | 'UNKNOWN',
  category: 'EMPLOYED' | 'FURTHER_STUDY' | 'OTHER' | 'UNKNOWN',
  provenanceRef: string,
): Promise<Wave10ActionResult> {
  return rpc('record_university_outcome_evidence', {
    p_affiliation_id: affiliationId,
    p_source: 'USER_DECLARED',
    p_presence: presence,
    p_category: category,
    p_provenance_ref: provenanceRef,
  })
}
