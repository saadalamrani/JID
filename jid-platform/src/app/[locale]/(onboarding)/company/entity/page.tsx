import { getTranslations } from 'next-intl/server'
import { EntitySetupForm } from '@/app/[locale]/(onboarding)/company/_components/entity-setup-form'
import { EntitySetupViewed } from '@/app/[locale]/(onboarding)/company/_components/entity-setup-viewed'
import { guardEntityOnboardingStep } from '@/lib/onboarding/entity-queries'

/** Task 1-ALT — finish setting up an existing approved entity (no create wizard). */
export default async function CompanyEntityOnboardingPage() {
  const { company } = await guardEntityOnboardingStep('entity')
  const t = await getTranslations('onboarding.entity.setup')

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <EntitySetupViewed companyId={company.id} entityType={company.entity_type} />
      <header className="space-y-2">
        <h1 className="font-arabic text-2xl font-semibold text-primary md:text-3xl">{t('title')}</h1>
        <p className="text-foreground/70">{t('description')}</p>
      </header>
      <EntitySetupForm company={company} />
    </section>
  )
}
