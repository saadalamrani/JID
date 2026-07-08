import { getTranslations } from 'next-intl/server'
import { StepTwoForm } from '@/app/[locale]/(onboarding)/individual/_components/step-two-form'
import { guardIndividualOnboardingStep } from '@/lib/onboarding/queries'
import { parseOnboardingMeta } from '@/lib/onboarding/smart-links'
import type { OnboardingStepTwoValues } from '@/lib/validations/onboarding'

/** Section 11.2 — education step (universities_catalog). */
export default async function IndividualOnboardingStep2Page() {
  const { profile } = await guardIndividualOnboardingStep(2)
  const t = await getTranslations('onboarding.individual.step2')
  const meta = parseOnboardingMeta(profile.smart_links ?? undefined)

  const defaultValues: OnboardingStepTwoValues = {
    university_id: profile.university_id ?? '',
    degree: meta.degree ?? '',
    graduation_year: profile.graduation_year ?? (undefined as unknown as number),
    gpa_value: meta.gpa_value ?? undefined,
    gpa_scale: meta.gpa_scale ?? undefined,
  }

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <header className="space-y-2">
        <h1 className="font-arabic text-2xl font-semibold text-primary md:text-3xl">{t('title')}</h1>
        <p className="text-muted-foreground">{t('description')}</p>
      </header>
      <StepTwoForm defaultValues={defaultValues} />
    </section>
  )
}
