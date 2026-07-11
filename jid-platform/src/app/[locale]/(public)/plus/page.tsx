import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { localeConfig, type Locale } from '@/lib/i18n/config'
import { PlusPricingPageClient } from './_components/plus-pricing-page-client'

type PlusPageProps = {
  params: { locale: string }
  searchParams: { checkout?: string }
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('monetization.pricing')
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  }
}

export default async function PlusPage({ params, searchParams }: PlusPageProps) {
  const locale = params.locale as Locale
  const dir = localeConfig.direction[locale] ?? 'rtl'
  const checkoutSuccess = searchParams.checkout === 'success'

  return (
    <div dir={dir} lang={locale} className="container-jid py-12 md:py-16">
      <PlusPricingPageClient locale={locale} checkoutSuccess={checkoutSuccess} />
    </div>
  )
}
