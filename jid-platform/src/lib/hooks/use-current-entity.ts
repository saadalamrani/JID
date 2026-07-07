'use client'

import { useQuery } from '@tanstack/react-query'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'
import type { EntitySignupType } from '@/lib/entity/constants'

type UntypedClient = SupabaseClient<Record<string, unknown>>

function asUntyped(client: SupabaseClient<Database>): UntypedClient {
  return client as unknown as UntypedClient
}

export type CurrentEntity = {
  id: string
  name: string
  name_ar: string | null
  slug: string | null
  entity_state: string
  entity_type: EntitySignupType
}

export function currentEntityQueryKey() {
  return ['entity', 'current'] as const
}

export async function fetchCurrentEntity(): Promise<CurrentEntity | null> {
  const supabase = createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) return null

  const { data, error } = await asUntyped(supabase)
    .from('companies')
    .select('id, name, name_ar, slug, entity_state, entity_type')
    .eq('claimed_by', user.id)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) return null
  return data as unknown as CurrentEntity
}

export function useCurrentEntity() {
  return useQuery({
    queryKey: currentEntityQueryKey(),
    queryFn: fetchCurrentEntity,
    staleTime: 30_000,
    gcTime: 120_000,
    refetchOnWindowFocus: false,
  })
}
