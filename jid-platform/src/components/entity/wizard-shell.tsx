import type { ReactNode } from 'react'
import type { EntityWizardStep } from '@/lib/entity/constants'
import { ENTITY_WIZARD_STEPS } from '@/lib/entity/constants'
import { cn } from '@/lib/utils'

type WizardShellProps = {
  title: string
  subtitle?: string
  currentStep: EntityWizardStep
  stepLabels: Record<EntityWizardStep, string>
  children: ReactNode
}

export function WizardShell({
  title,
  subtitle,
  currentStep,
  stepLabels,
  children,
}: WizardShellProps) {
  const currentIndex = ENTITY_WIZARD_STEPS.indexOf(currentStep)

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold text-jid-ink">{title}</h1>
        {subtitle ? <p className="mt-2 text-sm text-jid-ink/70">{subtitle}</p> : null}
      </div>

      <ol className="mb-8 grid grid-cols-4 gap-2">
        {ENTITY_WIZARD_STEPS.map((step, index) => {
          const isActive = index === currentIndex
          const isComplete = index < currentIndex

          return (
            <li key={step} className="text-center">
              <div
                className={cn(
                  'mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold',
                  isActive && 'bg-jid-olive text-white',
                  isComplete && 'bg-jid-gold text-jid-ink',
                  !isActive && !isComplete && 'bg-jid-line text-jid-ink/50',
                )}
              >
                {index + 1}
              </div>
              <p className={cn('text-xs', isActive ? 'font-medium text-jid-ink' : 'text-jid-ink/60')}>
                {stepLabels[step]}
              </p>
            </li>
          )
        })}
      </ol>

      <div className="rounded-xl border border-jid-line bg-white p-6 shadow-sm">{children}</div>
    </div>
  )
}
