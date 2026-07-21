import { notFound, redirect } from 'next/navigation'
import { UniversityProfileManagement } from '@/components/organization-profile/university-profile-management'
import type { OrganizationProfileSection } from '@/components/organization-profile/organization-profile-shell'
import { requireAuthenticatedUser } from '@/lib/auth/require-authenticated-user'
import {
  fetchDirectoryCorrectionLookups,
  fetchOrganizationDirectoryReference,
} from '@/lib/profile/organization-directory-reference'
import { fetchOwnerUniversityProfile } from '@/lib/profile/owner-university-profile'
import { createClient } from '@/lib/supabase/server'

const VALID_SECTIONS = new Set<OrganizationProfileSection>([
  'overview',
  'identity',
  'details',
  'media',
  'preview',
  'reference',
  'correction',
])

type UniversityProfileEditPageProps = {
  searchParams: Promise<{ section?: string }>
}

export default async function UniversityProfileEditPage({ searchParams }: UniversityProfileEditPageProps) {
  const userId = await requireAuthenticatedUser()
  const supabase = await createClient()
  const profile = await fetchOwnerUniversityProfile(supabase, userId)

  if (!profile) {
    redirect('/university/create-profile')
  }

  if (!profile.id) {
    notFound()
  }

  const params = await searchParams
  const initialSection =
    params.section && VALID_SECTIONS.has(params.section as OrganizationProfileSection)
      ? (params.section as OrganizationProfileSection)
      : 'overview'

  const [directory, lookups] = await Promise.all([
    fetchOrganizationDirectoryReference(supabase, profile.directory_id),
    fetchDirectoryCorrectionLookups(supabase),
  ])

  if (!directory) {
    notFound()
  }

  return (
    <UniversityProfileManagement
      profile={profile}
      directory={directory}
      sectors={lookups.sectors}
      regions={lookups.regions}
      initialSection={initialSection}
    />
  )
}
