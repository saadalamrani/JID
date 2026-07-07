'use client'

import { useTranslations } from 'next-intl'
import { useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { markOnboardingComplete } from '@/lib/onboarding/actions'

/** Section 11.4 — completion CTA. */
export function OnboardingCompleteActions() {
  const t = useTranslations('onboarding.individual.complete')
  const [isPending, startTransition] = useTransition()

  function handleContinue() {
    startTransition(async () => {
      const result = await markOnboardingComplete()
      if (!result.ok) {
        toast.error(t('completeFailed'))
      }
    })
  }

  return (
    <Button
      type="button"
      size="lg"
      className="w-full bg-jid-olive hover:bg-jid-olive/90 sm:w-auto"
      onClick={handleContinue}
      disabled={isPending}
    >
      {isPending ? t('completing') : t('cta')}
    </Button>
  )
}
