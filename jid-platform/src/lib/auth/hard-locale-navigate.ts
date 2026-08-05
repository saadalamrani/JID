import { useLocale } from 'next-intl'
import { useCallback } from 'react'
import type { Locale } from '@/lib/i18n/config'
import { localizedPath } from '@/lib/seo/urls'

/**
 * Hard post-login navigation across App Router layout groups.
 * Soft client transitions from (auth) → portal shells have crashed with
 * React #310 (hooks order) on jid-dev; a full document navigation is stable.
 */
export function useHardLocaleNavigate() {
  const locale = useLocale() as Locale

  return useCallback(
    (path: string) => {
      const separator = path.indexOf('?')
      const pathname = separator === -1 ? path : path.slice(0, separator)
      const query = separator === -1 ? '' : path.slice(separator + 1)
      const localized = localizedPath(locale, pathname || '/')
      const href = query ? `${localized}?${query}` : localized
      window.location.assign(href)
    },
    [locale],
  )
}
