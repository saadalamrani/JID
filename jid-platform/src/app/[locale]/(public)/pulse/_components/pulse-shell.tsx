import type { ReactNode } from 'react'
import { getTranslations } from 'next-intl/server'
import { PulseViewedTracker } from '@/components/pulse/pulse-viewed-tracker'
import type { Locale } from '@/lib/i18n/config'
import { localeConfig } from '@/lib/i18n/config'

type PulseShellProps = {
  locale: Locale
  children: ReactNode
}

/** Section 6.3 — Platform Pulse page chrome. */
export async function PulseShell({ locale, children }: PulseShellProps) {
  const t = await getTranslations('pulse')
  const dir = localeConfig.direction[locale] ?? 'rtl'

  return (
    <main dir={dir} className="container-jid space-y-10 py-8" lang={locale}>
      <PulseViewedTracker />
      <header className="space-y-2">
        <p className="text-sm font-medium text-primary">{t('eyebrow')}</p>
        <h1 className="text-3xl font-semibold text-foreground">{t('title')}</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">{t('subtitle')}</p>
      </header>
      {children}
    </main>
  )
}
