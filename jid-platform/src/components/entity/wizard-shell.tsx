import type { ReactNode } from 'react'
import {
  INSTITUTIONAL_JOURNEY_CHAPTERS,
  type InstitutionalJourneyChapter,
} from '@/lib/entity/journey-chapters'
import { cn } from '@/lib/utils'

type WizardShellProps = {
  title: string
  subtitle?: string
  currentChapter: InstitutionalJourneyChapter
  chapterLabels: Record<InstitutionalJourneyChapter, string>
  children: ReactNode
}

export function WizardShell({
  title,
  subtitle,
  currentChapter,
  chapterLabels,
  children,
}: WizardShellProps) {
  const currentIndex = INSTITUTIONAL_JOURNEY_CHAPTERS.indexOf(currentChapter)

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
        {subtitle ? <p className="mt-2 text-sm text-foreground/70">{subtitle}</p> : null}
      </div>

      <ol className="mb-8 grid grid-cols-3 gap-2" data-testid="institutional-journey-chapters">
        {INSTITUTIONAL_JOURNEY_CHAPTERS.map((chapter, index) => {
          const isActive = index === currentIndex
          const isComplete = index < currentIndex

          return (
            <li key={chapter} className="text-center" data-chapter={chapter}>
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
                {chapterLabels[chapter]}
              </p>
            </li>
          )
        })}
      </ol>

      <div className="rounded-xl border border-border bg-white p-6 shadow-sm">{children}</div>
    </div>
  )
}
