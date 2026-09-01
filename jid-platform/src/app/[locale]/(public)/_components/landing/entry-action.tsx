import { getTranslations } from 'next-intl/server'
import { Link } from '@/lib/i18n/navigation'

/**
 * D1 R1 — replaces the two-card, full-bleed CTA slab with one inline situational
 * entry row. Same underlying decision (individual vs. organization) as the hero's
 * guest CTAs, restated once at the end of the page — not a second, larger pitch.
 */
export async function EntryAction() {
  const t = await getTranslations('landing.entry')

  return (
    <section className="bg-background py-14 md:py-16" aria-labelledby="entry-title">
      <div className="container-jid">
        <div className="max-w-3xl border-t border-border pt-8">
          <h2 id="entry-title" className="text-lg font-semibold text-foreground md:text-xl">
            {t('title')}
          </h2>

          <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
              <p className="text-foreground/75 text-sm">{t('individual.body')}</p>
              <Link
                href="/signup"
                className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-jid-olive px-5 py-2.5 text-sm font-semibold text-jid-beige transition-colors hover:bg-jid-olive-700"
              >
                {t('individual.button')}
              </Link>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
              <p className="text-foreground/75 text-sm">{t('entity.body')}</p>
              <Link
                href="/signup/entity-type"
                className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-surface"
              >
                {t('entity.button')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
