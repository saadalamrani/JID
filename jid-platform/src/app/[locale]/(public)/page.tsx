import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { ActorRelationship } from '@/app/[locale]/(public)/_components/landing/actor-relationship'
import { EntryAction } from '@/app/[locale]/(public)/_components/landing/entry-action'
import { HomePulseHero } from '@/app/[locale]/(public)/_components/landing/home-pulse-hero'
import { NotACategory } from '@/app/[locale]/(public)/_components/landing/not-a-category'
import { TrustPrinciples } from '@/app/[locale]/(public)/_components/landing/trust-principles'
import { trackServer } from '@/lib/analytics/server'

/** Section 5.1 — public landing page (server components only). */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('landing.meta')
  return {
    title: t('title'),
    description: t('description'),
  }
}

/**
 * D1 R1 — Public Front Door. Material recomposition (docs/design-research/
 * D1_REFERENCE_EXPERIENCES.md#r1): the former 8-tile module grid, 3-card problem
 * grid, olive PDPL badge bar, Vision 2030 paragraph, and two-card CTA slab are
 * replaced by one reading path — a statement, the three-actor relationship as one
 * connected structure, a brief honest differentiation, three checkable trust facts,
 * and a single situational entry. No decorative KPIs, no card-soup, no unsupported
 * platform numbers.
 */
export default async function LandingPage() {
  await trackServer('landing_page_viewed', 'anonymous', { page: 'landing' })

  return (
    <>
      <HomePulseHero />
      <ActorRelationship />
      <NotACategory />
      <TrustPrinciples />
      <EntryAction />
    </>
  )
}
