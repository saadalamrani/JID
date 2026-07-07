'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'

export type CollegeCatalogItem = {
  id: string
  university_id: string
  slug: string
  name_ar: string
  name_en: string
  is_active: boolean
}

const STALE_MS = 10 * 60 * 1000

type UntypedClient = SupabaseClient<Record<string, unknown>>

function asUntyped(client: SupabaseClient<Database>): UntypedClient {
  return client as unknown as UntypedClient
}

export function collegesQueryKey(universityId: string | null | undefined) {
  return ['universities', 'colleges', universityId ?? 'all'] as const
}

export async function fetchCollegesCatalog(
  universityId?: string,
): Promise<CollegeCatalogItem[]> {
  const supabase = asUntyped(createClient())
  let query = supabase
    .from('colleges_catalog')
    .select('id, university_id, slug, name_ar, name_en, is_active')
    .eq('is_active', true)
    .order('name_en', { ascending: true })

  if (universityId) query = query.eq('university_id', universityId)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as CollegeCatalogItem[]
}

export function useCollegesCatalog(universityId?: string) {
  return useQuery({
    queryKey: collegesQueryKey(universityId),
    queryFn: () => fetchCollegesCatalog(universityId),
    staleTime: STALE_MS,
    gcTime: STALE_MS * 2,
    enabled: !universityId || universityId.length > 0,
    refetchOnWindowFocus: false,
  })
}
