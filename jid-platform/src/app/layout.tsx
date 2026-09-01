import { headers } from 'next/headers'
import { fontVariables } from '@/styles/fonts'
import { localeConfig, type Locale } from '@/lib/i18n/config'
import type { ReactNode } from 'react'

type RootLayoutProps = {
  children: ReactNode
}

/**
 * D1 — `lang`/`dir` set server-side, before hydration. `x-pathname` is set by
 * `middleware.ts` on every non-skipped request and always carries the resolved
 * locale prefix (`/ar/...` or `/en/...`); this layout sits above the `[locale]`
 * segment, so it cannot read the route param directly. `LocaleHtmlAttributes`
 * (client-side) still runs as a correctness net for the few paths middleware
 * skips (e.g. `/_next`, files), but it is no longer the only source — Arabic
 * font/letter-spacing rules in globals.css now apply on first paint instead of
 * after a post-hydration effect.
 */
function resolveLocaleFromPathname(pathname: string | null): Locale {
  const match = pathname?.match(/^\/(ar|en)(?:\/|$)/)
  const candidate = match?.[1]
  return candidate && localeConfig.locales.includes(candidate as Locale)
    ? (candidate as Locale)
    : localeConfig.defaultLocale
}

export default function RootLayout({ children }: RootLayoutProps) {
  const headerList = headers()
  const locale = resolveLocaleFromPathname(headerList.get('x-pathname'))
  const dir = localeConfig.direction[locale]

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <body className={`min-h-screen bg-background antialiased ${fontVariables}`}>{children}</body>
    </html>
  )
}
