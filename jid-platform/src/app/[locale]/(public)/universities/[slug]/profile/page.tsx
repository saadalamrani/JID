import { unstable_noStore as noStore } from 'next/cache'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { PublicUniversityProfileView } from '@/components/organization-profile/public-university-profile-view'
import { siteConfig } from '@/config/site'
import { localeConfig, type Locale } from '@/lib/i18n/config'
import { fetchPublishedUniversityProfileBySlug } from '@/lib/queries/published-profile'
import { truncateForMeta } from '@/types/business-profile-public'

/** Avoid stale edge-cached soft-404s for published university Profiles (DEF-09B-004 / post-Spec09). */
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

type UniversityProfilePageProps = {
  params: { locale: string; slug: string }
}

function profilePath(slug: string, locale: string) {
  return `/${locale}/universities/${slug}/profile`
}

function absoluteProfileUrl(slug: string, locale: string) {
  return `${siteConfig.url}${profilePath(slug, locale)}`
}

export default async function PublicUniversityProfilePage({
  params,
}: UniversityProfilePageProps) {
  noStore()
  const locale = params.locale as Locale
  const dir = localeConfig.direction[locale] ?? 'rtl'
  const data = await fetchPublishedUniversityProfileBySlug(params.slug)

  if (!data) {
    notFound()
  }

  return (
    <main dir={dir} className="container-jid py-8" lang={locale}>
      <PublicUniversityProfileView profile={data.profile} directory={data.directory} />
    </main>
  )
}

export async function generateMetadata({
  params,
}: UniversityProfilePageProps): Promise<Metadata> {
  const t = await getTranslations('organizationProfile.universityPublic')
  const locale = params.locale as Locale
  const data = await fetchPublishedUniversityProfileBySlug(params.slug)

  if (!data) {
    return { title: t('metaFallback') }
  }

  const { profile } = data
  const title =
    locale === 'ar'
      ? profile.display_name_ar
      : profile.display_name_en?.trim() || profile.display_name_ar
  const description =
    truncateForMeta(locale === 'ar' ? profile.about_ar : profile.about_en) ??
    truncateForMeta(profile.about_ar) ??
    truncateForMeta(profile.about_en)

  const ogImage = profile.cover_image_url ?? `${siteConfig.url}${siteConfig.ogImage}`

  return {
    title,
    description,
    alternates: {
      canonical: absoluteProfileUrl(params.slug, locale),
      languages: {
        ar: absoluteProfileUrl(params.slug, 'ar'),
        en: absoluteProfileUrl(params.slug, 'en'),
      },
    },
    openGraph: {
      title,
      description,
      url: absoluteProfileUrl(params.slug, locale),
      images: [{ url: ogImage }],
      locale: locale === 'ar' ? 'ar_SA' : 'en_US',
    },
  }
}
