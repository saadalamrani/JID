import 'server-only'

import type { MetadataRoute } from 'next'
import { isValidLocale, locales, type Locale } from '@/lib/i18n/config'
import {
  fetchConditionalPublicRoutes,
  fetchSitemapCompanies,
  fetchSitemapJobs,
  fetchSitemapMentors,
  type SitemapPathEntry,
} from '@/lib/seo/sitemap-data'
import { SITEMAP_STATIC_ROUTES } from '@/lib/seo/sitemap-routes'
import { absoluteUrl } from '@/lib/seo/urls'

function toSitemapEntry(
  locale: Locale,
  { path, lastModified }: SitemapPathEntry,
): MetadataRoute.Sitemap[number] {
  const isHome = path === '/'
  const segments = path.split('/').filter(Boolean)
  return {
    url: absoluteUrl(locale, path),
    lastModified,
    changeFrequency: isHome ? 'daily' : 'weekly',
    priority: isHome ? 1 : segments.length > 1 ? 0.6 : 0.8,
  }
}

async function collectSitemapPaths(): Promise<SitemapPathEntry[]> {
  const [conditionalRoutes, companies, jobs, mentors] = await Promise.all([
    fetchConditionalPublicRoutes(),
    fetchSitemapCompanies(),
    fetchSitemapJobs(),
    fetchSitemapMentors(),
  ])

  const staticEntries: SitemapPathEntry[] = [
    ...SITEMAP_STATIC_ROUTES.map((path) => ({ path })),
    ...conditionalRoutes.map((path) => ({ path })),
  ]

  return [...staticEntries, ...companies, ...jobs, ...mentors]
}

/** Section 14 — locale-aware sitemap builder (static + DB-backed public routes). */
export async function buildSitemapForLocale(localeInput: string): Promise<MetadataRoute.Sitemap> {
  const locale: Locale = isValidLocale(localeInput) ? localeInput : 'ar'
  const paths = await collectSitemapPaths()
  return paths.map((entry) => toSitemapEntry(locale, entry))
}

/** All locales in one sitemap (used by `/sitemap.xml`). */
export async function buildFullSitemap(): Promise<MetadataRoute.Sitemap> {
  const paths = await collectSitemapPaths()
  return locales.flatMap((locale) => paths.map((entry) => toSitemapEntry(locale, entry)))
}
