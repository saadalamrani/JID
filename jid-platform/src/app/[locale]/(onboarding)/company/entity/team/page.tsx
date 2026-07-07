import { getTranslations } from 'next-intl/server'
import { EntityTeamForm } from '@/app/[locale]/(onboarding)/company/_components/entity-team-form'
import { guardEntityOnboardingStep } from '@/lib/onboarding/entity-queries'

/** Task 2 — optional team invitations after entity profile setup. */
export default async function CompanyEntityTeamPage() {
  await guardEntityOnboardingStep('team')
  const t = await getTranslations('onboarding.entity.team')

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <header className="space-y-2">
        <h1 className="font-arabic text-2xl font-semibold text-jid-olive md:text-3xl">{t('title')}</h1>
        <p className="text-jid-ink/70">{t('description')}</p>
      </header>
      <EntityTeamForm />
    </section>
  )
}
