import { getTranslations } from 'next-intl/server'
import { HomeHeroVisual } from '@/app/[locale]/(public)/_components/landing/home-hero-visual'
import { resolveHomeHeroCards } from '@/lib/navigation/home-hero-cards'
import { resolveHomeHeroContext } from '@/lib/navigation/home-hero-context'
import { Link } from '@/lib/i18n/navigation'

/** Homepage hero — Platform Pulse positioning, state-aware primary CTA (Tasks 2–5). */
export async function HomePulseHero() {
  const [t, hero, cards] = await Promise.all([
    getTranslations('landing.hero'),
    resolveHomeHeroContext(),
    resolveHomeHeroCards(),
  ])

  const primaryLabel = t(hero.primaryCta.labelKey)

  return (
    <section
      className="border-b border-border bg-jid-beige-warm"
      aria-labelledby="home-hero-title"
    >
      <div className="container-jid py-12 md:py-16 lg:py-20">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-12">
          <div className="order-1 flex max-w-2xl flex-col gap-6 text-start">
            <p className="inline-flex w-fit items-center rounded-full border border-jid-olive/15 bg-background/60 px-3 py-1 text-xs font-medium text-jid-olive">
              {t('eyebrow')}
            </p>
            <div className="space-y-4">
              <h1
                id="home-hero-title"
                className="font-arabic text-balance text-3xl font-bold leading-tight text-foreground md:text-4xl lg:text-[2.5rem] lg:leading-[1.15]"
              >
                {t('title')}
              </h1>
              <p className="max-w-xl text-base leading-relaxed text-foreground/80 md:text-lg">
                {t('subtitle')}
              </p>
              <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
                {t('body')}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link
                href={hero.primaryCta.href}
                className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-jid-olive px-6 py-3 text-sm font-semibold text-jid-beige transition-colors hover:bg-jid-olive-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jid-olive focus-visible:ring-offset-2"
              >
                {primaryLabel}
              </Link>
              {!hero.isAuthenticated ? (
                <Link
                  href="/signup"
                  className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-border bg-background/80 px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jid-olive focus-visible:ring-offset-2"
                >
                  {t('secondaryCta')}
                </Link>
              ) : null}
            </div>
          </div>

          <div className="order-2 min-w-0">
            <HomeHeroVisual cards={cards} />
          </div>
        </div>
      </div>
    </section>
  )
}
