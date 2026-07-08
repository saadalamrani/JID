import { getTranslations } from 'next-intl/server'
import { OnboardingCompleteActions } from '@/app/[locale]/(onboarding)/individual/_components/onboarding-complete-actions'
import { guardIndividualOnboardingStep } from '@/lib/onboarding/queries'

/** Section 11.4 — onboarding completion screen. */
export default async function IndividualOnboardingCompletePage() {
  await guardIndividualOnboardingStep('complete')
  const t = await getTranslations('onboarding.individual.complete')

  return (
    <section className="mx-auto max-w-2xl space-y-8 text-center">
      <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary/10 text-3xl">
        <span aria-hidden>✓</span>
      </div>
      <header className="space-y-3">
        <h1 className="font-arabic text-2xl font-semibold text-primary md:text-3xl">{t('title')}</h1>
        <p className="text-muted-foreground">{t('description')}</p>
      </header>
      <div className="flex justify-center">
        <OnboardingCompleteActions />
      </div>
    </section>
  )
}
