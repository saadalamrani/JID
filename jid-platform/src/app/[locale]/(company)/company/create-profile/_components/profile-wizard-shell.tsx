import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export const PROFILE_WIZARD_STEPS = ['identity', 'story', 'preview'] as const
export type ProfileWizardStep = (typeof PROFILE_WIZARD_STEPS)[number]

type ProfileWizardShellProps = {
  title: string
  subtitle?: string
  currentStep: ProfileWizardStep
  stepLabels: Record<ProfileWizardStep, string>
  children: ReactNode
}

export function ProfileWizardShell({
  title,
  subtitle,
  currentStep,
  stepLabels,
  children,
  steps = PROFILE_WIZARD_STEPS,
}: ProfileWizardShellProps & { steps?: readonly ProfileWizardStep[] }) {
  const currentIndex = steps.indexOf(currentStep)
  const colClass = steps.length === 2 ? 'grid-cols-2' : 'grid-cols-3'

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
        {subtitle ? <p className="mt-2 text-sm text-foreground/70">{subtitle}</p> : null}
      </div>

      <ol className={cn('mb-8 grid gap-2', colClass)}>
        {steps.map((step, index) => {
          const isActive = index === currentIndex
          const isComplete = index < currentIndex

          return (
            <li key={step} className="text-center">
              <div
                className={cn(
                  'mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold',
                  isActive && 'bg-primary text-white',
                  isComplete && 'bg-accent text-foreground',
                  !isActive && !isComplete && 'bg-border text-muted-foreground',
                )}
              >
                {index + 1}
              </div>
              <p
                className={cn(
                  'text-xs',
                  isActive ? 'font-medium text-foreground' : 'text-foreground/60',
                )}
              >
                {stepLabels[step]}
              </p>
            </li>
          )
        })}
      </ol>

      <div className="rounded-xl border border-border bg-white p-6 shadow-sm">{children}</div>
    </div>
  )
}
