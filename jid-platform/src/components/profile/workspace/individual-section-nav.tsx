'use client'

import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import type { IndividualProfileSectionId } from '@/lib/profile/individual-projection-types'

const SECTIONS: IndividualProfileSectionId[] = [
  'overview',
  'canvas',
  'timeline',
  'projects',
  'experience',
  'skills',
  'education',
  'certifications',
  'mentorship',
  'achievements',
]

type IndividualSectionNavProps = {
  className?: string
  /** Sections to hide from nav (e.g. empty public sections). */
  hiddenSections?: IndividualProfileSectionId[]
}

export function IndividualSectionNav({
  className,
  hiddenSections = [],
}: IndividualSectionNavProps) {
  const t = useTranslations('profile.workspace.sections')
  const hidden = new Set(hiddenSections)

  function scrollTo(id: IndividualProfileSectionId) {
    const el = document.getElementById(`profile-section-${id}`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const visible = SECTIONS.filter((id) => !hidden.has(id))

  return (
    <nav
      aria-label={t('navAria')}
      className={cn('-mx-1 overflow-x-auto overscroll-x-contain', className)}
    >
      <div className="flex min-w-0 gap-1.5 px-1 pb-1">
        {visible.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => scrollTo(id)}
            className="shrink-0 rounded-full border border-border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none"
          >
            {t(id)}
          </button>
        ))}
      </div>
    </nav>
  )
}
