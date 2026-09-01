import { getTranslations } from 'next-intl/server'

/**
 * D1 R1 — a brief, honest differentiation statement. One paragraph, no comparison
 * chart, no card. States what JID is not so a first-time visitor does not read it
 * through the wrong category by default.
 */
export async function NotACategory() {
  const t = await getTranslations('landing.notThis')

  return (
    <section
      className="border-b border-border bg-background py-14 md:py-16"
      aria-labelledby="not-this-title"
    >
      <div className="container-jid">
        <div className="max-w-2xl">
          <h2 id="not-this-title" className="text-xl font-semibold text-foreground md:text-2xl">
            {t('title')}
          </h2>
          <p className="text-foreground/70 mt-3 text-sm leading-relaxed md:text-base">
            {t('body')}
          </p>
        </div>
      </div>
    </section>
  )
}
