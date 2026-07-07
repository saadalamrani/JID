'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'

export type MajorCatalogItem = {
  id: string
  college_id: string
  slug: string
  name_ar: string
  name_en: string
  cip_code: string | null
  is_active: boolean
}

const STALE_MS = 10 * 60 * 1000

type UntypedClient = SupabaseClient<Record<string, unknown>>

function asUntyped(client: SupabaseClient<Database>): UntypedClient {
  return client as unknown as UntypedClient
}

export function majorsQueryKey(collegeId: string | null | undefined) {
  return ['universities', 'majors', collegeId ?? 'all'] as const
}

export async function fetchMajorsCatalog(collegeId?: string): Promise<MajorCatalogItem[]> {
  const supabase = asUntyped(createClient())
  let query = supabase
    .from('majors_catalog')
    .select('id, college_id, slug, name_ar, name_en, cip_code, is_active')
    .eq('is_active', true)
    .order('name_en', { ascending: true })

  if (collegeId) query = query.eq('college_id', collegeId)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as MajorCatalogItem[]
}

export function useMajorsCatalog(collegeId?: string) {
  return useQuery({
    queryKey: majorsQueryKey(collegeId),
    queryFn: () => fetchMajorsCatalog(collegeId),
    staleTime: STALE_MS,
    gcTime: STALE_MS * 2,
    enabled: !collegeId || collegeId.length > 0,
    refetchOnWindowFocus: false,
  })
}
