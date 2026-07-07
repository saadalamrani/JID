import { getTranslations } from 'next-intl/server'
import { redirect } from 'next/navigation'
import { Link } from '@/lib/i18n/navigation'
import { FeatureGate } from '@/lib/feature-flags/feature-gate'
import { FLAG_KEYS } from '@/lib/feature-flags/keys'
import { isFeatureEnabled } from '@/lib/feature-flags/server'
import { localeConfig, type Locale } from '@/lib/i18n/config'

type UniversitiesDiscoverPageProps = {
  params: { locale: string }
}

export async function generateMetadata() {
  const t = await getTranslations('universities.discover')
  return {
    title: t('title'),
    description: t('subtitle'),
  }
}

/** Route-level gate — redirects home when university discovery is disabled. */
export default async function UniversitiesDiscoverPage({ params }: UniversitiesDiscoverPageProps) {
  const locale = params.locale as Locale
  const dir = localeConfig.direction[locale] ?? 'rtl'
  const t = await getTranslations('universities.discover')

  const discoverEnabled = await isFeatureEnabled(FLAG_KEYS.UNIVERSITIES_DISCOVER)
  if (!discoverEnabled) {
    redirect('/')
  }

  return (
    <main dir={dir} className="container-jid py-10" lang={locale}>
      <FeatureGate flag={FLAG_KEYS.UNIVERSITIES_DISCOVER}>
        <header className="space-y-2">
          <h1 className="font-arabic text-2xl font-semibold text-jid-ink">{t('title')}</h1>
          <p className="text-sm text-jid-ink/65">{t('subtitle')}</p>
        </header>

        <div className="mt-8 rounded-2xl border border-jid-gold/40 bg-jid-beige-warm p-8 text-center">
          <p className="text-sm text-jid-ink/70">{t('body')}</p>
          <Link
            href="/catalog"
            className="mt-4 inline-flex text-sm font-medium text-jid-olive hover:underline"
          >
            {t('catalogCta')}
          </Link>
        </div>
      </FeatureGate>
    </main>
  )
}
