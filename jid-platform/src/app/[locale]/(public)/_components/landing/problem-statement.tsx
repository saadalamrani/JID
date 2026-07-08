import { getTranslations } from 'next-intl/server'

const CARD_KEYS = ['applicants', 'waiting', 'graduates'] as const

/** Section 5.3 (corrected) — qualitative problem cards; no unverified statistics. */
export async function ProblemStatement() {
  const t = await getTranslations('landing.problem')

  return (
    <section className="border-b border-border bg-card py-16">
      <div className="container-jid">
        <header className="mx-auto max-w-2xl text-center">
          <h2 className="font-arabic text-2xl font-semibold text-foreground md:text-3xl">
            {t('title')}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-foreground/65">{t('subtitle')}</p>
        </header>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {CARD_KEYS.map((key, index) => (
            <article
              key={key}
              className="rounded-xl border border-border bg-background/40 p-6 shadow-sm"
            >
              <p
                className={`font-mono text-base font-semibold leading-snug md:text-lg ${
                  index % 2 === 0 ? 'text-primary' : 'text-accent'
                }`}
              >
                {t(`cards.${key}.headline`)}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {t(`cards.${key}.body`)}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
