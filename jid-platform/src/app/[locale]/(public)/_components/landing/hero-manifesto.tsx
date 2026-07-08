import { getTranslations } from 'next-intl/server'
import { Link } from '@/lib/i18n/navigation'

/** Section 5.2 — landing hero manifesto (server-rendered). */
export async function HeroManifesto() {
  const t = await getTranslations('landing.hero')

  return (
    <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-white to-background">
      <div className="container-jid py-16 md:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-medium tracking-wide text-accent">{t('eyebrow')}</p>
          <h1 className="mt-4 font-arabic text-balance text-4xl font-bold leading-tight text-foreground md:text-5xl">
            {t('title')}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-foreground/75">
            {t('subtitle')}
          </p>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {t('body')}
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/opportunities"
              className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {t('primaryCta')}
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-lg border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-background"
            >
              {t('secondaryCta')}
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
