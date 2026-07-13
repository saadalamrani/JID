import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'
import { parseDomainsInput } from '@/lib/entity/domains'
import type { EntitySignupType } from '@/lib/entity/constants'
import { toDbEntityType } from '@/lib/entity/constants'

export type CompanyRecord = {
  id: string
  name: string
  name_ar: string | null
  domains: string[]
  entity_type: EntitySignupType
  is_verified: boolean
}

type Client = SupabaseClient<Database>

export type UniversityCatalogRecord = {
  id: string
  short_code: string
  slug: string
  name_ar: string
  name_en: string
  website_url: string | null
}

function hostFromUrl(url: string | null): string | null {
  if (!url) return null
  try {
    const host = new URL(url).hostname.toLowerCase()
    return host.startsWith('www.') ? host.slice(4) : host
  } catch {
    return null
  }
}

export async function searchCompanies(
  supabase: Client,
  query: string,
  entityType: EntitySignupType,
): Promise<CompanyRecord[]> {
  const trimmed = query.trim()
  let builder = supabase
    .from('companies')
    .select('id, name, name_ar, domains, entity_type, is_verified')
    .eq('entity_type', toDbEntityType(entityType))
    .eq('is_verified', true)
    .order('name', { ascending: true })
    .limit(20)

  if (trimmed) {
    builder = builder.or(`name.ilike.%${trimmed}%,name_ar.ilike.%${trimmed}%`)
  }

  const { data, error } = await builder
  if (error) throw new Error(error.message)
  return (data ?? []) as CompanyRecord[]
}

export async function getCompanyById(
  supabase: Client,
  companyId: string,
): Promise<CompanyRecord | null> {
  const { data, error } = await supabase
    .from('companies')
    .select('id, name, name_ar, domains, entity_type, is_verified')
    .eq('id', companyId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return (data as CompanyRecord | null) ?? null
}

export async function createUnverifiedCompany(
  supabase: Client,
  input: {
    name: string
    name_ar: string
    domainsInput: string
    entityType: EntitySignupType
  },
): Promise<CompanyRecord> {
  const domains = parseDomainsInput(input.domainsInput)
  if (domains.length === 0) {
    throw new Error('Invalid domains')
  }

  const { data, error } = await supabase
    .from('companies')
    .insert({
      name: input.name,
      name_ar: input.name_ar,
      domains,
      entity_type: toDbEntityType(input.entityType),
      is_verified: false,
    })
    .select('id, name, name_ar, domains, entity_type, is_verified')
    .single()

  if (error || !data) throw new Error(error?.message ?? 'Failed to create company')
  return data as CompanyRecord
}

export async function searchUniversitiesCatalog(
  supabase: Client,
  query: string,
): Promise<UniversityCatalogRecord[]> {
  const client = supabase as unknown as SupabaseClient<Record<string, unknown>>
  const trimmed = query.trim()
  let builder = client
    .from('universities_catalog')
    .select('id, short_code, slug, name_ar, name_en, website_url')
    .eq('is_active', true)
    .order('name_en', { ascending: true })
    .limit(20)

  if (trimmed) {
    builder = builder.or(`name_en.ilike.%${trimmed}%,name_ar.ilike.%${trimmed}%,short_code.ilike.%${trimmed}%`)
  }

  const { data, error } = await builder
  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as UniversityCatalogRecord[]
}

/**
 * Creates or reuses the claimable company row for a university catalog entry.
 */
export async function ensureUniversityCompany(
  supabase: Client,
  university: UniversityCatalogRecord,
): Promise<CompanyRecord> {
  const { data: existing, error: existingError } = await supabase
    .from('companies')
    .select('id, name, name_ar, domains, entity_type, is_verified')
    .eq('entity_type', 'university')
    .eq('university_short_code', university.short_code)
    .maybeSingle()

  if (existingError) throw new Error(existingError.message)
  if (existing) return existing as CompanyRecord

  const domain =
    hostFromUrl(university.website_url) ?? `${university.short_code.toLowerCase()}.edu.sa`

  const { data: created, error: createError } = await supabase
    .from('companies')
    .insert({
      name: university.name_en,
      name_ar: university.name_ar,
      domains: [domain],
      entity_type: 'university',
      university_short_code: university.short_code,
      is_verified: true,
      entity_state: 'unclaimed',
    })
    .select('id, name, name_ar, domains, entity_type, is_verified')
    .single()

  if (createError || !created) {
    throw new Error(createError?.message ?? 'Failed to create university company')
  }

  return created as CompanyRecord
}
