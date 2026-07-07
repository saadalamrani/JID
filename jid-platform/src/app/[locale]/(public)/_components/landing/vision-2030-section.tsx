import { getTranslations } from 'next-intl/server'

/** Section 5.6 — Vision 2030 alignment (paraphrase; not a fabricated direct quote). */
export async function Vision2030Section() {
  const t = await getTranslations('landing.vision2030')

  return (
    <section className="border-b border-jid-line/60 bg-white py-16">
      <div className="container-jid">
        <div className="mx-auto max-w-3xl rounded-2xl border border-jid-gold/35 bg-gradient-to-br from-jid-beige to-white p-8 md:p-10">
          <p className="text-xs font-semibold uppercase tracking-wider text-jid-gold">
            {t('eyebrow')}
          </p>
          <h2 className="mt-3 font-arabic text-2xl font-semibold text-jid-ink md:text-3xl">
            {t('title')}
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-jid-ink/75">{t('body')}</p>
          <p className="mt-4 text-xs text-jid-ink/55">{t('attributionNote')}</p>
        </div>
      </div>
    </section>
  )
}
