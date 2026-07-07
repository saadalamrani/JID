import { siteConfig } from '@/config/site'
import { defaultLocale, type Locale } from '@/lib/i18n/config'

/** Path with locale prefix per next-intl `as-needed` routing. */
export function localizedPath(locale: Locale, path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`

  if (locale === defaultLocale) {
    return normalized
  }

  return normalized === '/' ? `/${locale}` : `/${locale}${normalized}`
}

export function absoluteUrl(locale: Locale, path: string): string {
  const base = siteConfig.url.replace(/\/$/, '')
  const localized = localizedPath(locale, path)
  return localized === '/' ? `${base}/` : `${base}${localized}`
}
