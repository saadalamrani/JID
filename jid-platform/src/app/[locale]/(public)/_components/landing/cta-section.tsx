import { getTranslations } from 'next-intl/server'
import { Link } from '@/lib/i18n/navigation'

/**
 * Section 5.7 — dual CTA.
 * Entity path uses /catalog (claim flow) — not /signup?type=company (Part A: no direct company_admin signup).
 */
export async function CtaSection() {
  const t = await getTranslations('landing.cta')

  return (
    <section className="bg-jid-beige py-16">
      <div className="container-jid">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-arabic text-2xl font-semibold text-jid-ink md:text-3xl">
            {t('title')}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-jid-ink/65">{t('subtitle')}</p>
        </div>

        <div className="mx-auto mt-10 grid max-w-4xl gap-4 md:grid-cols-2">
          <article className="rounded-xl border border-jid-line bg-white p-6 text-center shadow-sm">
            <h3 className="font-arabic text-lg font-semibold text-jid-ink">{t('individual.title')}</h3>
            <p className="mt-2 text-sm text-jid-ink/65">{t('individual.body')}</p>
            <Link
              href="/signup"
              className="mt-6 inline-flex items-center justify-center rounded-lg bg-jid-olive px-5 py-2.5 text-sm font-semibold text-white hover:bg-jid-olive/90"
            >
              {t('individual.button')}
            </Link>
          </article>

          <article className="rounded-xl border border-jid-gold/40 bg-jid-gold/10 p-6 text-center shadow-sm">
            <h3 className="font-arabic text-lg font-semibold text-jid-ink">{t('entity.title')}</h3>
            <p className="mt-2 text-sm text-jid-ink/65">{t('entity.body')}</p>
            <Link
              href="/catalog"
              className="mt-6 inline-flex items-center justify-center rounded-lg bg-jid-gold px-5 py-2.5 text-sm font-semibold text-jid-ink hover:bg-jid-gold/90"
            >
              {t('entity.button')}
            </Link>
          </article>
        </div>
      </div>
    </section>
  )
}
