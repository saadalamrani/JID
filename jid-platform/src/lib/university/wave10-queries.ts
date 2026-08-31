import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/types'
import type { UniversityOwnerFoundationSnapshot } from '@/types/contracts/university'

type UntypedClient = SupabaseClient<Record<string, unknown>>

function untyped(client: SupabaseClient<Database>): UntypedClient {
  return client as unknown as UntypedClient
}

function isMissingRelation(error: { message: string }): boolean {
  return /does not exist|schema cache|could not find/i.test(error.message)
}

export type UniversityAffiliationRow = {
  id: string
  catalog_university_id: string
  college_id: string | null
  major_id: string | null
  degree_level: string | null
  graduation_year: number | null
  person_status: 'STUDENT' | 'GRADUATE' | 'OTHER'
  state: 'DECLARED' | 'VERIFIED' | 'NEEDS_REVIEW'
  declared_at: string
  review_reason: string | null
  revoked_at: string | null
}

export type UniversityIdentityMappingRow = {
  id: string
  catalog_university_id: string
  directory_id: string
  mapping_state: 'active' | 'revoked'
  created_at: string
  created_by: string
  revoked_at: string | null
  audit_reason: string
  audit_reference: string | null
}

export async function fetchMyUniversityAffiliations(): Promise<UniversityAffiliationRow[]> {
  const client = untyped(await createClient())
  const { data, error } = await client
    .from('university_affiliations')
    .select(
      'id, catalog_university_id, college_id, major_id, degree_level, graduation_year, person_status, state, declared_at, review_reason, revoked_at',
    )
    .is('revoked_at', null)
    .order('declared_at', { ascending: false })

  if (error) {
    if (isMissingRelation(error)) return []
    throw new Error(error.message)
  }
  return (data ?? []) as UniversityAffiliationRow[]
}

export async function fetchUniversityOwnerFoundation(): Promise<UniversityOwnerFoundationSnapshot> {
  const client = untyped(await createClient())
  const { data, error } = await client.rpc('university_owner_foundation_snapshot')
  if (error) {
    const message = error.message.toLowerCase()
    if (
      message.includes('does not exist') ||
      message.includes('could not find') ||
      message.includes('schema cache')
    ) {
      return { mapping_present: false, fail_closed_reason: 'unmapped' }
    }
    throw new Error(error.message)
  }
  return data as UniversityOwnerFoundationSnapshot
}

export async function fetchStaffUniversityMappings(): Promise<UniversityIdentityMappingRow[]> {
  const client = untyped(await createClient())
  const { data, error } = await client
    .from('university_identity_mappings')
    .select(
      'id, catalog_university_id, directory_id, mapping_state, created_at, created_by, revoked_at, audit_reason, audit_reference',
    )
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    if (isMissingRelation(error)) return []
    throw new Error(error.message)
  }
  return (data ?? []) as UniversityIdentityMappingRow[]
}

export async function fetchStaffAffiliationReviewQueue(): Promise<UniversityAffiliationRow[]> {
  const client = untyped(await createClient())
  const { data, error } = await client
    .from('university_affiliations')
    .select(
      'id, catalog_university_id, college_id, major_id, degree_level, graduation_year, person_status, state, declared_at, review_reason, revoked_at',
    )
    .eq('state', 'NEEDS_REVIEW')
    .is('revoked_at', null)
    .order('declared_at', { ascending: true })
    .limit(50)

  if (error) {
    if (isMissingRelation(error)) return []
    throw new Error(error.message)
  }
  return (data ?? []) as UniversityAffiliationRow[]
}

export async function fetchCatalogUniversityNames(): Promise<
  Record<string, { name_ar: string; name_en: string }>
> {
  const client = untyped(await createClient())
  const { data, error } = await client
    .from('universities_catalog')
    .select('id, name_ar, name_en')
    .eq('is_active', true)

  if (error) throw new Error(error.message)
  return Object.fromEntries(
    ((data ?? []) as Array<{ id: string; name_ar: string; name_en: string }>).map((row) => [
      row.id,
      { name_ar: row.name_ar, name_en: row.name_en },
    ]),
  )
}
