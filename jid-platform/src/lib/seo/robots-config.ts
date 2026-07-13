import type { MetadataRoute } from 'next'
import { siteConfig } from '@/config/site'
import { locales } from '@/lib/i18n/config'

/**
 * Section 14 — paths blocked from indexing (portal, API, onboarding shells).
 * Duplicated for `/en/*` because default Arabic locale omits the prefix.
 */
const DISALLOW_PATHS = [
  '/sys',
  '/staff',
  '/api',
  '/individual',
  '/me',
  '/settings',
  '/profile',
  '/radar',
  '/notifications',
  '/cv-builder',
  '/conversations',
  '/company',
  '/university',
  '/mentor',
  '/welcome',
  '/account',
  '/admin',
] as const

function buildDisallowList(): string[] {
  const paths = new Set<string>()

  for (const path of DISALLOW_PATHS) {
    paths.add(path)
    for (const locale of locales) {
      if (locale === 'ar') continue
      paths.add(`/${locale}${path}`)
    }
  }

  return Array.from(paths)
}

/** Section 14 — robots.txt rules for the whole site. */
export function buildRobots(): MetadataRoute.Robots {
  const base = siteConfig.url.replace(/\/$/, '')

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: buildDisallowList(),
    },
    sitemap: [`${base}/sitemap.xml`, `${base}/en/sitemap.xml`],
    host: base,
  }
}
