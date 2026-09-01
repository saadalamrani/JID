import { getTranslations } from 'next-intl/server'
import { Link } from '@/lib/i18n/navigation'

const ITEM_KEYS = ['verification', 'dataTruth', 'consent'] as const

/**
 * D1 R1 — replaces the olive PDPL badge bar with three plain, checkable facts about
 * how trust works on JID (each backed by real product truth — the org-onboarding
 * verification requirement, Article 4's data-truth doctrine, and consent-governed
 * visibility), not a badge/lock-icon trust signal standing in for the substance.
 */
export async function TrustPrinciples() {
  const t = await getTranslations('landing.trust')

  return (
    <section
      className="border-b border-border bg-surface py-14 md:py-16"
      aria-labelledby="trust-title"
    >
      <div className="container-jid">
        <h2 id="trust-title" className="text-xl font-semibold text-foreground md:text-2xl">
          {t('title')}
        </h2>

        <ul className="mt-6 grid gap-4 sm:grid-cols-3">
          {ITEM_KEYS.map((key) => (
            <li
              key={key}
              className="text-foreground/80 border-s-2 border-jid-olive/30 ps-4 text-sm leading-relaxed"
            >
              {t(`items.${key}`)}
            </li>
          ))}
        </ul>

        <Link
          href="/pdpl"
          className="mt-6 inline-flex text-sm font-medium text-jid-olive underline underline-offset-4 hover:text-jid-gold"
        >
          {t('cta')}
        </Link>
      </div>
    </section>
  )
}
