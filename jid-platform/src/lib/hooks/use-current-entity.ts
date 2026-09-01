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
  is_verified: boolean
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

  const { data: business } = await asUntyped(supabase)
    .from('business_profiles')
    .select('directory_id, status')
    .eq('owner_user_id', user.id)
    .neq('status', 'suspended')
    .maybeSingle()

  const { data: university } = business?.directory_id
    ? { data: null }
    : await asUntyped(supabase)
        .from('university_profiles')
        .select('directory_id, status')
        .eq('owner_user_id', user.id)
        .neq('status', 'suspended')
        .maybeSingle()

  const directoryId =
    (business as { directory_id?: string } | null)?.directory_id ??
    (university as { directory_id?: string } | null)?.directory_id ??
    null

  if (!directoryId) return null

  const { data, error } = await asUntyped(supabase)
    .from('companies')
    .select('id, name, name_ar, slug, is_verified, entity_type')
    .eq('id', directoryId)
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
