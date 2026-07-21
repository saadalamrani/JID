import { notFound, redirect } from 'next/navigation'
import { Link } from '@/lib/i18n/navigation'
import { getTranslations } from 'next-intl/server'
import { UniversityProfileView } from '@/components/organization-profile/university-profile-view'
import { Button } from '@/components/ui/button'
import { requireAuthenticatedUser } from '@/lib/auth/require-authenticated-user'
import { fetchOrganizationDirectoryReference } from '@/lib/profile/organization-directory-reference'
import { fetchOwnerUniversityProfile } from '@/lib/profile/owner-university-profile'
import { createClient } from '@/lib/supabase/server'
import type { DirectoryReferenceData } from '@/types/business-profile-public'
import type { Company } from '@/types/catalog'

function mapDirectoryReference(directory: Company): DirectoryReferenceData {
  return {
    id: directory.id,
    slug: directory.slug,
    name_en: directory.name_en,
    name_ar: directory.name_ar,
    logo_url: directory.logo_url,
    ownership_type: directory.ownership_type,
    sector: directory.sector,
    region: directory.region,
  }
}

export default async function UniversityProfilePreviewPage() {
  const t = await getTranslations('organizationProfile.preview')
  const userId = await requireAuthenticatedUser()
  const supabase = await createClient()
  const profile = await fetchOwnerUniversityProfile(supabase, userId)

  if (!profile) {
    redirect('/university/create-profile')
  }

  const directory = await fetchOrganizationDirectoryReference(supabase, profile.directory_id)
  if (!directory) {
    notFound()
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <UniversityProfileView
        profile={{
          id: profile.id,
          display_name_ar: profile.display_name_ar,
          display_name_en: profile.display_name_en,
          about_ar: profile.about_ar,
          about_en: profile.about_en,
          university_type: profile.university_type,
          established_year: profile.established_year,
          cover_image_url: profile.cover_image_url,
          verified_badge: profile.verified_badge,
        }}
        directory={mapDirectoryReference(directory)}
        mode="preview"
      />
      <div className="mt-8">
        <Button type="button" variant="outline" asChild className="min-h-11">
          <Link href="/university/profile/edit">{t('returnToEdit')}</Link>
        </Button>
      </div>
    </div>
  )
}
