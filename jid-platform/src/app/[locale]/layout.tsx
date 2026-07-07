import { LocaleHtmlAttributes } from '@/components/providers/locale-html-attributes'
import { QueryProvider } from '@/components/providers/query-provider'
import { AuthenticatedShellServer } from '@/components/shared/authenticated-shell-server'
import { Toaster } from '@/components/ui/sonner'
import { FeatureFlagsRealtimeInvalidator } from '@/lib/feature-flags/realtime-invalidator'
import { localeConfig, type Locale } from '@/lib/i18n/config'
import { routing } from '@/lib/i18n/routing'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'
import './globals.css'

type LocaleLayoutProps = {
  children: ReactNode
  params: { locale: string }
}

export function generateStaticParams() {
  return localeConfig.locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = params

  if (!routing.locales.includes(locale as Locale)) {
    notFound()
  }

  setRequestLocale(locale)

  const messages = await getMessages()

  return (
    <NextIntlClientProvider messages={messages}>
      <LocaleHtmlAttributes locale={locale as Locale} />
      <QueryProvider>
        <FeatureFlagsRealtimeInvalidator />
        <AuthenticatedShellServer>
          <div dir={localeConfig.direction[locale as Locale]} className="min-h-screen">
            {children}
          </div>
        </AuthenticatedShellServer>
        <Toaster richColors closeButton position={locale === 'ar' ? 'top-left' : 'top-right'} />
      </QueryProvider>
    </NextIntlClientProvider>
  )
}
