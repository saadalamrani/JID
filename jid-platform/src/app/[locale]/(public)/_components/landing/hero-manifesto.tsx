import { getTranslations } from 'next-intl/server'
import { Link } from '@/lib/i18n/navigation'

/** Section 5.2 — landing hero manifesto (server-rendered). */
export async function HeroManifesto() {
  const t = await getTranslations('landing.hero')

  return (
    <section className="relative overflow-hidden border-b border-jid-line/60 bg-gradient-to-b from-white to-jid-beige">
      <div className="container-jid py-16 md:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-medium tracking-wide text-jid-gold">{t('eyebrow')}</p>
          <h1 className="mt-4 font-arabic text-balance text-4xl font-bold leading-tight text-jid-ink md:text-5xl">
            {t('title')}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-jid-ink/75">
            {t('subtitle')}
          </p>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-jid-ink/60">
            {t('body')}
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/opportunities"
              className="inline-flex items-center justify-center rounded-lg bg-jid-olive px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-jid-olive/90"
            >
              {t('primaryCta')}
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-lg border border-jid-line bg-white px-6 py-3 text-sm font-semibold text-jid-ink transition-colors hover:bg-jid-beige"
            >
              {t('secondaryCta')}
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
