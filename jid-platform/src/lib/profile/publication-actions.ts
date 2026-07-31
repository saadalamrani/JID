'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getCurrentViewer } from '@/lib/profile/queries'
import {
  mapPublicationError,
  publishOwnedProfile,
  unpublishOwnedProfile,
  type OrganizationProfileType,
  type PublicationErrorCode,
} from '@/lib/profile/publication'
import { createClient } from '@/lib/supabase/server'

export type PublicationActionResult =
  | { ok: true; status: 'published' | 'draft'; publishedAt: string | null }
  | { ok: false; error: PublicationErrorCode }

const publicationInputSchema = z.object({
  profileType: z.enum(['business', 'university']),
  profileId: z.string().uuid(),
})

async function loadDirectorySlugForProfile(
  profileType: OrganizationProfileType,
  profileId: string,
): Promise<{ slug: string | null; directoryId: string | null }> {
  const supabase = await createClient()
  const table = profileType === 'business' ? 'business_profiles' : 'university_profiles'
  const { data: profile } = await supabase
    .from(table)
    .select('directory_id')
    .eq('id', profileId)
    .maybeSingle()

  if (!profile?.directory_id) {
    return { slug: null, directoryId: null }
  }

  const { data: directory } = await supabase
    .from('companies')
    .select('slug')
    .eq('id', profile.directory_id)
    .maybeSingle()

  return { slug: directory?.slug ?? null, directoryId: profile.directory_id }
}

function revalidatePublicationPaths(
  profileType: OrganizationProfileType,
  slug: string | null,
): void {
  if (profileType === 'business') {
    revalidatePath('/company/dashboard')
    revalidatePath('/company/profile')
    revalidatePath('/company/profile/edit')
    if (slug) {
      revalidatePath(`/companies/${slug}/profile`)
      revalidatePath(`/catalog/${slug}`)
    }
  } else {
    revalidatePath('/university/dashboard')
    revalidatePath('/university/profile/edit')
    if (slug) {
      revalidatePath(`/universities/${slug}/profile`)
      revalidatePath(`/catalog/${slug}`)
    }
  }
}

export async function publishOwnedProfileAction(
  input: unknown,
): Promise<PublicationActionResult> {
  const viewer = await getCurrentViewer()
  if (!viewer.userId) {
    return { ok: false, error: 'unauthenticated' }
  }

  const parsed = publicationInputSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: 'invalid_input' }
  }

  const { profileType, profileId } = parsed.data
  const slugBefore = await loadDirectorySlugForProfile(profileType, profileId)
  const supabase = await createClient()

  try {
    const result = await publishOwnedProfile(supabase, profileType, profileId)
    revalidatePublicationPaths(profileType, slugBefore.slug)
    return {
      ok: true,
      status: result.status,
      publishedAt: result.published_at,
    }
  } catch (error) {
    return {
      ok: false,
      error: mapPublicationError(error instanceof Error ? error.message : 'unknown'),
    }
  }
}

export async function unpublishOwnedProfileAction(
  input: unknown,
): Promise<PublicationActionResult> {
  const viewer = await getCurrentViewer()
  if (!viewer.userId) {
    return { ok: false, error: 'unauthenticated' }
  }

  const parsed = publicationInputSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: 'invalid_input' }
  }

  const { profileType, profileId } = parsed.data
  const slugBefore = await loadDirectorySlugForProfile(profileType, profileId)
  const supabase = await createClient()

  try {
    const result = await unpublishOwnedProfile(supabase, profileType, profileId)
    revalidatePublicationPaths(profileType, slugBefore.slug)
    return {
      ok: true,
      status: result.status,
      publishedAt: result.published_at,
    }
  } catch (error) {
    return {
      ok: false,
      error: mapPublicationError(error instanceof Error ? error.message : 'unknown'),
    }
  }
}
