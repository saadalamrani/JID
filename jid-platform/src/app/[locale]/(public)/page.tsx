import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { CtaSection } from '@/app/[locale]/(public)/_components/landing/cta-section'
import { HomePulseHero } from '@/app/[locale]/(public)/_components/landing/home-pulse-hero'
import { ModulesShowcase } from '@/app/[locale]/(public)/_components/landing/modules-showcase'
import { PdplTrustBar } from '@/app/[locale]/(public)/_components/landing/pdpl-trust-bar'
import { ProblemStatement } from '@/app/[locale]/(public)/_components/landing/problem-statement'
import { Vision2030Section } from '@/app/[locale]/(public)/_components/landing/vision-2030-section'
import { trackServer } from '@/lib/analytics/server'

/** Section 5.1 — public landing page (server components only). */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('landing.meta')
  return {
    title: t('title'),
    description: t('description'),
  }
}

export default async function LandingPage() {
  await trackServer('landing_page_viewed', 'anonymous', { page: 'landing' })

  return (
    <>
      <HomePulseHero />
      <ProblemStatement />
      <ModulesShowcase />
      <PdplTrustBar />
      <Vision2030Section />
      <CtaSection />
    </>
  )
}
