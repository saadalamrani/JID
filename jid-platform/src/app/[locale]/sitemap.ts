import type { MetadataRoute } from 'next'
import { buildSitemapForLocale } from '@/lib/seo/build-sitemap'
import { defaultLocale, isValidLocale, type Locale } from '@/lib/i18n/config'

type LocaleSitemapProps = {
  params: { locale: string }
}

/** Section 14 — per-locale sitemap (`/sitemap.xml` for `ar`, `/en/sitemap.xml` for English). */
export default async function sitemap({
  params,
}: LocaleSitemapProps): Promise<MetadataRoute.Sitemap> {
  const locale: Locale = isValidLocale(params.locale) ? params.locale : defaultLocale
  return buildSitemapForLocale(locale)
}

export const revalidate = 3600
