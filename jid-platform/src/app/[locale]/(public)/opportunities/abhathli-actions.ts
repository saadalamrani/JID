'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { OwnershipType } from '@/types/catalog'
import type { ExperienceLevel } from '@/types/job'
import type { SearchMandateDigestFrequency } from '@/types/abhathli'

export type AbhathliActionResult = { ok: true; id?: string } | { ok: false; error: string }

function revalidateAbhathli() {
  revalidatePath('/opportunities')
}

export async function createSearchMandate(input: {
  name: string
  sectors: string[]
  regions: string[]
  ownershipTypes: OwnershipType[]
  experienceLevels: ExperienceLevel[]
  keywords: string[]
  includeLammah: boolean
  digestFrequency: SearchMandateDigestFrequency
}): Promise<AbhathliActionResult> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('create_search_mandate', {
    p: {
      name: input.name,
      sectors: input.sectors,
      regions: input.regions,
      ownership_types: input.ownershipTypes,
      experience_levels: input.experienceLevels,
      keywords: input.keywords,
      include_lammah: input.includeLammah,
      digest_frequency: input.digestFrequency,
    },
  })

  if (error) {
    if (error.message.includes('mandate_quota_exceeded')) {
      return { ok: false, error: 'mandate_quota_exceeded' }
    }
    if (error.message.includes('plus_required')) {
      return { ok: false, error: 'plus_required' }
    }
    return { ok: false, error: error.message }
  }

  revalidateAbhathli()
  return { ok: true, id: data ?? undefined }
}

export async function updateSearchMandate(
  mandateId: string,
  input: Partial<{
    name: string
    isActive: boolean
    sectors: string[]
    regions: string[]
    ownershipTypes: OwnershipType[]
    experienceLevels: ExperienceLevel[]
    keywords: string[]
    includeLammah: boolean
    digestFrequency: SearchMandateDigestFrequency
  }>,
): Promise<AbhathliActionResult> {
  const supabase = await createClient()
  const { error } = await supabase.rpc('update_search_mandate', {
    p_id: mandateId,
    p: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.isActive !== undefined ? { is_active: input.isActive } : {}),
      ...(input.sectors !== undefined ? { sectors: input.sectors } : {}),
      ...(input.regions !== undefined ? { regions: input.regions } : {}),
      ...(input.ownershipTypes !== undefined ? { ownership_types: input.ownershipTypes } : {}),
      ...(input.experienceLevels !== undefined ? { experience_levels: input.experienceLevels } : {}),
      ...(input.keywords !== undefined ? { keywords: input.keywords } : {}),
      ...(input.includeLammah !== undefined ? { include_lammah: input.includeLammah } : {}),
      ...(input.digestFrequency !== undefined ? { digest_frequency: input.digestFrequency } : {}),
    },
  })

  if (error) return { ok: false, error: error.message }
  revalidateAbhathli()
  return { ok: true }
}

export async function dismissMandateMatch(
  matchId: string,
  reason: string,
): Promise<AbhathliActionResult> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('dismiss_mandate_match', {
    p_match_id: matchId,
    p_reason: reason,
  })
  if (error) return { ok: false, error: error.message }
  if (!data) return { ok: false, error: 'not_found' }
  revalidateAbhathli()
  return { ok: true }
}

export async function markMandateMatchesSeen(mandateId?: string): Promise<AbhathliActionResult> {
  const supabase = await createClient()
  const { error } = await supabase.rpc('mark_mandate_matches_seen', {
    p_mandate_id: mandateId ?? null,
  })
  if (error) return { ok: false, error: error.message }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (user) {
    await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('recipient_id', user.id)
      .eq('category', 'search.mandate_match')
      .is('read_at', null)
  }

  revalidateAbhathli()
  return { ok: true }
}
