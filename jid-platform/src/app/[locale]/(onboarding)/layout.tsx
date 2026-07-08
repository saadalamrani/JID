import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { OnboardingProgress } from '@/app/[locale]/(onboarding)/_components/onboarding-progress'
import { SkipForNow } from '@/app/[locale]/(onboarding)/_components/skip-for-now'
import { Logo } from '@/components/brand/logo'
import { localeConfig, type Locale } from '@/lib/i18n/config'
import { createClient } from '@/lib/supabase/server'

type OnboardingLayoutProps = {
  children: ReactNode
  params: { locale: string }
}

/** Section 10.2 — authenticated onboarding shell (progress + skip, no portal chrome). */
export default async function OnboardingLayout({ children, params }: OnboardingLayoutProps) {
  const locale = params.locale as Locale
  const dir = localeConfig.direction[locale] ?? 'rtl'
  const t = await getTranslations('onboarding.shell')

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div dir={dir} lang={locale} className="min-h-screen bg-jid-beige/40">
      <header className="border-b border-jid-line/70 bg-white/95 backdrop-blur-sm">
        <div className="container-jid flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Logo size="md" />
            <p className="mt-2 text-sm text-jid-ink/60">{t('subtitle')}</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
            <OnboardingProgress />
            <SkipForNow />
          </div>
        </div>
      </header>
      <main className="container-jid py-8 md:py-12">{children}</main>
    </div>
  )
}
