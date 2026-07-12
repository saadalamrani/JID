import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { BusinessProfileView } from '@/components/profiles/business-profile-view'
import { siteConfig } from '@/config/site'
import { localeConfig, type Locale } from '@/lib/i18n/config'
import { fetchPublishedBusinessProfileBySlug } from '@/lib/queries/business-profile-public'
import { fetchLiveOpeningsByBusinessProfileId } from '@/lib/queries/jobs'
import { truncateForMeta } from '@/types/business-profile-public'

type BusinessProfilePageProps = {
  params: { locale: string; slug: string }
}

function profilePath(slug: string, locale: string) {
  return `/${locale}/companies/${slug}/profile`
}

function absoluteProfileUrl(slug: string, locale: string) {
  return `${siteConfig.url}${profilePath(slug, locale)}`
}

export default async function PublicBusinessProfilePage({ params }: BusinessProfilePageProps) {
  const locale = params.locale as Locale
  const dir = localeConfig.direction[locale] ?? 'rtl'
  const data = await fetchPublishedBusinessProfileBySlug(params.slug)

  if (!data) {
    notFound()
  }

  const openings = await fetchLiveOpeningsByBusinessProfileId(data.profile.id)

  return (
    <main dir={dir} className="container-jid py-8" lang={locale}>
      <BusinessProfileView
        mode="public"
        profile={data.profile}
        directory={data.directory}
        openings={openings}
      />
    </main>
  )
}

export async function generateMetadata({ params }: BusinessProfilePageProps): Promise<Metadata> {
  const t = await getTranslations('businessProfile.public')
  const locale = params.locale as Locale
  const data = await fetchPublishedBusinessProfileBySlug(params.slug)

  if (!data) {
    return { title: t('metaFallback') }
  }

  const { profile } = data
  const title = profile.display_name_ar
  const description =
    truncateForMeta(profile.tagline_ar) ??
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
