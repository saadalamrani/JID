import { getTranslations } from 'next-intl/server'
import { StepOneForm, toStepOneDefaults } from '@/app/[locale]/(onboarding)/individual/_components/step-one-form'
import { guardIndividualOnboardingStep } from '@/lib/onboarding/queries'

/** Section 11.1 — basic info step. */
export default async function IndividualOnboardingStep1Page() {
  const { profile } = await guardIndividualOnboardingStep(1)
  const t = await getTranslations('onboarding.individual.step1')
  const defaults = toStepOneDefaults(profile.full_name, profile.phone)

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <header className="space-y-2">
        <h1 className="font-arabic text-2xl font-semibold text-primary md:text-3xl">{t('title')}</h1>
        <p className="text-muted-foreground">{t('description')}</p>
      </header>
      <div className="rounded-xl border border-border bg-card p-6 text-foreground shadow-sm">
      <StepOneForm {...defaults} />
      </div>
    </section>
  )
}
