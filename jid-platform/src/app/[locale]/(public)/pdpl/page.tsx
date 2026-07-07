import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { RightItem } from '@/app/[locale]/(public)/pdpl/_components/right-item'
import { localeConfig, type Locale } from '@/lib/i18n/config'
import { Link } from '@/lib/i18n/navigation'
import { trackLegalPageViewed } from '@/lib/analytics/track-legal-page'

const RIGHT_KEYS = [
  'informed',
  'access',
  'rectification',
  'erasure',
  'withdrawConsent',
  'complaint',
] as const

type PdplPageProps = {
  params: { locale: string }
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('pdplPage.meta')
  return {
    title: t('title'),
    description: t('description'),
  }
}

/** Section 7 — PDPL notice (server-rendered). */
export default async function PdplPage({ params }: PdplPageProps) {
  await trackLegalPageViewed('pdpl')
  const locale = params.locale as Locale
  const dir = localeConfig.direction[locale] ?? 'rtl'
  const t = await getTranslations('pdplPage')

  return (
    <div dir={dir} lang={locale} className="container-jid space-y-12 py-12 md:py-16">
      <header className="mx-auto max-w-3xl">
        <p className="text-sm font-medium text-jid-gold">{t('eyebrow')}</p>
        <h1 className="mt-3 font-arabic text-3xl font-bold text-jid-ink md:text-4xl">{t('title')}</h1>
        <p className="mt-4 text-base leading-relaxed text-jid-ink/75">{t('intro')}</p>
        <p className="mt-4 rounded-lg border border-jid-olive/25 bg-jid-olive/5 px-4 py-3 text-sm font-medium text-jid-olive">
          {t('legalBasis')}
        </p>
        <p className="mt-3 text-xs leading-relaxed text-jid-ink/55">{t('legalNote')}</p>
      </header>

      <section aria-labelledby="pdpl-scope-heading">
        <h2 id="pdpl-scope-heading" className="font-arabic text-xl font-semibold text-jid-ink">
          {t('scope.title')}
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-jid-ink/70">{t('scope.body')}</p>
      </section>

      <section aria-labelledby="pdpl-rights-heading">
        <h2 id="pdpl-rights-heading" className="font-arabic text-xl font-semibold text-jid-ink">
          {t('rights.title')}
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-jid-ink/65">{t('rights.subtitle')}</p>
        <div className="mt-6 space-y-4">
          {RIGHT_KEYS.map((key, index) => (
            <RightItem
              key={key}
              index={index + 1}
              title={t(`rights.items.${key}.title`)}
              description={t(`rights.items.${key}.description`)}
            />
          ))}
        </div>
      </section>

      <section aria-labelledby="pdpl-practices-heading">
        <h2 id="pdpl-practices-heading" className="font-arabic text-xl font-semibold text-jid-ink">
          {t('practices.title')}
        </h2>
        <ul className="mt-4 max-w-3xl list-disc space-y-2 ps-5 text-sm leading-relaxed text-jid-ink/70">
          <li>{t('practices.items.minimization')}</li>
          <li>{t('practices.items.access')}</li>
          <li>{t('practices.items.retention')}</li>
          <li>{t('practices.items.breach')}</li>
        </ul>
      </section>

      <section
        className="rounded-2xl border border-jid-line bg-jid-beige/50 p-8"
        aria-labelledby="pdpl-links-heading"
      >
        <h2 id="pdpl-links-heading" className="font-arabic text-lg font-semibold text-jid-ink">
          {t('links.title')}
        </h2>
        <ul className="mt-4 flex flex-wrap gap-4 text-sm font-medium">
          <li>
            <Link href="/terms" className="text-jid-olive hover:underline">
              {t('links.terms')}
            </Link>
          </li>
          <li>
            <Link href="/privacy" className="text-jid-olive hover:underline">
              {t('links.privacy')}
            </Link>
          </li>
          <li>
            <Link href="/contact" className="text-jid-olive hover:underline">
              {t('links.contact')}
            </Link>
          </li>
          <li>
            <Link href="/about" className="text-jid-olive hover:underline">
              {t('links.about')}
            </Link>
          </li>
        </ul>
      </section>
    </div>
  )
}
