import { getTranslations } from 'next-intl/server'
import { StepThreeForm } from '@/app/[locale]/(onboarding)/individual/_components/step-three-form'
import { guardIndividualOnboardingStep } from '@/lib/onboarding/queries'
import { parseOnboardingMeta } from '@/lib/onboarding/smart-links'
import type { OnboardingStepThreeValues } from '@/lib/validations/onboarding'

/** Section 11.3 — optional career interests. */
export default async function IndividualOnboardingStep3Page() {
  const { profile } = await guardIndividualOnboardingStep(3)
  const t = await getTranslations('onboarding.individual.step3')
  const meta = parseOnboardingMeta(profile.smart_links ?? undefined)

  const defaultValues: OnboardingStepThreeValues = {
    target_sectors: profile.target_sectors ?? [],
    target_job_titles: meta.target_job_titles ?? '',
    salary_min: meta.salary_min ?? undefined,
    salary_max: meta.salary_max ?? undefined,
  }

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <header className="space-y-2">
        <h1 className="font-arabic text-2xl font-semibold text-jid-olive md:text-3xl">{t('title')}</h1>
        <p className="text-jid-ink/70">{t('description')}</p>
      </header>
      <StepThreeForm defaultValues={defaultValues} />
    </section>
  )
}
