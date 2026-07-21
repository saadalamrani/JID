import { notFound, redirect } from 'next/navigation'
import { Link } from '@/lib/i18n/navigation'
import { getTranslations } from 'next-intl/server'
import { BusinessProfileView } from '@/components/profiles/business-profile-view'
import { Button } from '@/components/ui/button'
import { requireAuthenticatedUser } from '@/lib/auth/require-authenticated-user'
import { fetchOrganizationDirectoryReference } from '@/lib/profile/organization-directory-reference'
import { fetchOwnerBusinessProfile } from '@/lib/profile/owner-business-profile'
import { createClient } from '@/lib/supabase/server'
import {
  parseBusinessProfileGallery,
  type DirectoryReferenceData,
} from '@/types/business-profile-public'
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

export default async function CompanyProfilePreviewPage() {
  const t = await getTranslations('organizationProfile.preview')
  const userId = await requireAuthenticatedUser()
  const supabase = await createClient()
  const profile = await fetchOwnerBusinessProfile(supabase, userId)

  if (!profile) {
    redirect('/company/create-profile')
  }

  const directory = await fetchOrganizationDirectoryReference(supabase, profile.directory_id)
  if (!directory) {
    notFound()
  }

  const previewProfile = {
    id: profile.id,
    directory_id: profile.directory_id,
    display_name_ar: profile.display_name_ar,
    display_name_en: profile.display_name_en,
    tagline_ar: profile.tagline_ar,
    about_ar: profile.about_ar,
    about_en: profile.about_en,
    founded_year: profile.founded_year,
    employee_count_range: profile.employee_count_range,
    cover_image_url: profile.cover_image_url,
    gallery: parseBusinessProfileGallery(profile.gallery),
    verified_badge: profile.verified_badge,
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <p className="mb-6 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-foreground/80">
        {t('banner')}
      </p>
      <BusinessProfileView
        profile={previewProfile}
        directory={mapDirectoryReference(directory)}
        openings={[]}
        mode="preview"
      />
      <div className="mt-8">
        <Button type="button" variant="outline" asChild className="min-h-11">
          <Link href="/company/profile/edit">{t('returnToEdit')}</Link>
        </Button>
      </div>
    </div>
  )
}
