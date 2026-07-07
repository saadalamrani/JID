'use client'

import { useTranslations } from 'next-intl'
import { usePathname } from '@/lib/i18n/navigation'
import {
  ONBOARDING_FLOWS,
  resolveOnboardingFlowKey,
  type OnboardingFlowKey,
} from '@/lib/onboarding/constants'
import { cn } from '@/lib/utils'

function normalizePath(pathname: string): string {
  return pathname.replace(/^\/(ar|en)/, '') || '/'
}

/** Section 10.3 — step progress indicator (mentor flow removed). */
export function OnboardingProgress() {
  const pathname = usePathname()
  const t = useTranslations('onboarding.progress')
  const flowKey = resolveOnboardingFlowKey(pathname)

  if (!flowKey) {
    return null
  }

  const steps = ONBOARDING_FLOWS[flowKey]
  const currentPath = normalizePath(pathname)
  const onComplete = currentPath.startsWith('/individual/complete')
  const activeIndex = onComplete
    ? steps.length
    : steps.findIndex((step) => currentPath.startsWith(step.path))

  return (
    <nav aria-label={t('ariaLabel')} className="w-full sm:w-auto">
      <ol className="flex flex-wrap items-center gap-2">
        {steps.map((step, index) => {
          const isComplete = onComplete || activeIndex > index
          const isActive = !onComplete && activeIndex === index

          return (
            <li key={step.id} className="flex items-center gap-2">
              <span
                className={cn(
                  'inline-flex size-7 items-center justify-center rounded-full text-xs font-semibold',
                  isComplete && 'bg-jid-olive text-white',
                  isActive && 'border-2 border-jid-olive bg-jid-olive/10 text-jid-olive',
                  !isComplete && !isActive && 'border border-jid-line bg-white text-jid-ink/50',
                )}
                aria-current={isActive ? 'step' : undefined}
              >
                {index + 1}
              </span>
              <span
                className={cn(
                  'text-xs font-medium',
                  isActive ? 'text-jid-olive' : 'text-jid-ink/55',
                )}
              >
                {t(`flows.${flowKey as OnboardingFlowKey}.steps.${step.id}`)}
              </span>
              {index < steps.length - 1 ? (
                <span className="mx-1 hidden h-px w-6 bg-jid-line sm:inline-block" aria-hidden />
              ) : null}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
