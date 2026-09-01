import { getTranslations } from 'next-intl/server'
import { Link } from '@/lib/i18n/navigation'

/**
 * Section 5.7 — dual CTA.
 * Employer/University path uses organization registration, not Directory claim.
 */
export async function CtaSection() {
  const t = await getTranslations('landing.cta')

  return (
    <section className="bg-background py-16">
      <div className="container-jid">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-semibold text-foreground md:text-3xl">
            {t('title')}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-foreground/65">{t('subtitle')}</p>
        </div>

        <div className="mx-auto mt-10 grid max-w-4xl gap-4 md:grid-cols-2">
          <article className="rounded-xl border border-border bg-card p-6 text-center shadow-sm">
            <h3 className="text-lg font-semibold text-foreground">{t('individual.title')}</h3>
            <p className="mt-2 text-sm text-foreground/65">{t('individual.body')}</p>
            <Link
              href="/signup"
              className="mt-6 inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              {t('individual.button')}
            </Link>
          </article>

          <article className="rounded-xl border border-border bg-accent/10 p-6 text-center shadow-sm">
            <h3 className="text-lg font-semibold text-foreground">{t('entity.title')}</h3>
            <p className="mt-2 text-sm text-foreground/65">{t('entity.body')}</p>
            <Link
              href="/signup/entity-type"
              className="mt-6 inline-flex items-center justify-center rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-accent/10"
            >
              {t('entity.button')}
            </Link>
          </article>
        </div>
      </div>
    </section>
  )
}
