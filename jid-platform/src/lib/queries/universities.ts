'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'

export type UniversityCatalogItem = {
  id: string
  short_code: string
  slug: string
  name_ar: string
  name_en: string
  city_ar: string | null
  city_en: string | null
  is_active: boolean
}

const STALE_MS = 10 * 60 * 1000

type UntypedClient = SupabaseClient<Record<string, unknown>>

function asUntyped(client: SupabaseClient<Database>): UntypedClient {
  return client as unknown as UntypedClient
}

export function universitiesQueryKey() {
  return ['universities', 'catalog'] as const
}

export async function fetchUniversitiesCatalog(): Promise<UniversityCatalogItem[]> {
  const supabase = asUntyped(createClient())
  const { data, error } = await supabase
    .from('universities_catalog')
    .select('id, short_code, slug, name_ar, name_en, city_ar, city_en, is_active')
    .eq('is_active', true)
    .order('name_en', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as UniversityCatalogItem[]
}

export function useUniversitiesCatalog() {
  return useQuery({
    queryKey: universitiesQueryKey(),
    queryFn: fetchUniversitiesCatalog,
    staleTime: STALE_MS,
    gcTime: STALE_MS * 2,
    refetchOnWindowFocus: false,
  })
}
