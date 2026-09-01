import { getTranslations } from 'next-intl/server'
import { resolveHomeHeroContext } from '@/lib/navigation/home-hero-context'
import { Link } from '@/lib/i18n/navigation'

/**
 * D1 R1 — homepage statement. One headline, one checkable claim, one situational
 * entry action. No floating activity-card row: a first-time visitor is oriented by
 * what JID *is* (Section "the relationship" below this section), not by a preview of
 * dashboard fragments. Deliberately not a split SaaS hero with a device-frame card.
 */
export async function HomePulseHero() {
  const [t, hero] = await Promise.all([getTranslations('landing.hero'), resolveHomeHeroContext()])

  const primaryLabel = t(hero.primaryCta.labelKey)

  return (
    <section className="border-b border-border bg-jid-beige-warm" aria-labelledby="home-hero-title">
      <div className="container-jid py-14 md:py-20 lg:py-24">
        <div className="flex max-w-2xl flex-col gap-6 text-start">
          <p className="text-xs font-medium text-jid-olive">{t('eyebrow')}</p>
          <div className="space-y-4">
            <h1
              id="home-hero-title"
              className="text-balance text-4xl font-bold leading-tight text-foreground md:text-5xl md:leading-[1.1]"
            >
              {t('title')}
            </h1>
            <p className="text-foreground/80 max-w-xl text-base leading-relaxed md:text-lg">
              {t('subtitle')}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            {!hero.isAuthenticated ? (
              <>
                {/* Guest hero — approved content direction: Create an account is the
                    primary action; exploring opportunities is secondary. */}
                <Link
                  href="/signup"
                  className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-jid-olive px-6 py-3 text-sm font-semibold text-jid-beige transition-colors hover:bg-jid-olive-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jid-olive focus-visible:ring-offset-2"
                >
                  {t('secondaryCta')}
                </Link>
                <Link
                  href={hero.primaryCta.href}
                  className="bg-background/80 inline-flex min-h-[44px] items-center justify-center rounded-lg border border-border px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jid-olive focus-visible:ring-offset-2"
                >
                  {primaryLabel}
                </Link>
              </>
            ) : (
              <Link
                href={hero.primaryCta.href}
                className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-jid-olive px-6 py-3 text-sm font-semibold text-jid-beige transition-colors hover:bg-jid-olive-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jid-olive focus-visible:ring-offset-2"
              >
                {primaryLabel}
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
