import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { ValueCard } from '@/app/[locale]/(public)/about/_components/value-card'
import { siteConfig } from '@/config/site'
import { localeConfig, type Locale } from '@/lib/i18n/config'
import { Link } from '@/lib/i18n/navigation'

const VALUE_KEYS = ['transparency', 'privacy', 'empowerment', 'trust'] as const

type AboutPageProps = {
  params: { locale: string }
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('about.meta')
  return {
    title: t('title'),
    description: t('description'),
  }
}

/** Section 6 — About JID (server-rendered). */
export default async function AboutPage({ params }: AboutPageProps) {
  const locale = params.locale as Locale
  const dir = localeConfig.direction[locale] ?? 'rtl'
  const t = await getTranslations('about')

  return (
    <div dir={dir} lang={locale} className="container-jid space-y-16 py-12 md:py-16">
      <header className="mx-auto max-w-3xl text-center">
        <p className="text-sm font-medium text-jid-gold">{t('eyebrow')}</p>
        <h1 className="mt-3 font-arabic text-3xl font-bold text-jid-ink md:text-4xl">
          {t('title', { name: siteConfig.name })}
        </h1>
        <p className="mt-4 text-base leading-relaxed text-jid-ink/75">{t('intro')}</p>
      </header>

      <section aria-labelledby="about-mission-heading">
        <h2 id="about-mission-heading" className="font-arabic text-xl font-semibold text-jid-ink">
          {t('mission.title')}
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-jid-ink/70">{t('mission.body')}</p>
      </section>

      <section aria-labelledby="about-values-heading">
        <h2 id="about-values-heading" className="font-arabic text-xl font-semibold text-jid-ink">
          {t('values.title')}
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-jid-ink/65">{t('values.subtitle')}</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {VALUE_KEYS.map((key, index) => (
            <ValueCard
              key={key}
              title={t(`values.items.${key}.title`)}
              description={t(`values.items.${key}.description`)}
              accent={index % 2 === 0 ? 'olive' : 'gold'}
            />
          ))}
        </div>
      </section>

      <section
        className="rounded-2xl border border-jid-line bg-jid-beige/50 p-8"
        aria-labelledby="about-links-heading"
      >
        <h2 id="about-links-heading" className="font-arabic text-lg font-semibold text-jid-ink">
          {t('links.title')}
        </h2>
        <ul className="mt-4 flex flex-wrap gap-4 text-sm font-medium">
          <li>
            <Link href="/opportunities" className="text-jid-olive hover:underline">
              {t('links.opportunities')}
            </Link>
          </li>
          <li>
            <Link href="/mentors" className="text-jid-olive hover:underline">
              {t('links.mentors')}
            </Link>
          </li>
          <li>
            <Link href="/pdpl" className="text-jid-olive hover:underline">
              {t('links.pdpl')}
            </Link>
          </li>
          <li>
            <Link href="/contact" className="text-jid-olive hover:underline">
              {t('links.contact')}
            </Link>
          </li>
        </ul>
      </section>
    </div>
  )
}
