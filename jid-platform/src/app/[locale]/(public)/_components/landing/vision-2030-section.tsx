import { getTranslations } from 'next-intl/server'

/** Section 5.6 — Vision 2030 alignment (paraphrase; not a fabricated direct quote). */
export async function Vision2030Section() {
  const t = await getTranslations('landing.vision2030')

  return (
    <section className="border-b border-border bg-card py-16">
      <div className="container-jid">
        <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-gradient-to-br from-surface to-card p-8 md:p-10">
          <p className="text-xs font-semibold uppercase text-accent">
            {t('eyebrow')}
          </p>
          <h2 className="mt-3 font-arabic text-2xl font-semibold text-foreground md:text-3xl">
            {t('title')}
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-foreground/75">{t('body')}</p>
          <p className="mt-4 text-xs text-foreground/55">{t('attributionNote')}</p>
        </div>
      </div>
    </section>
  )
}
