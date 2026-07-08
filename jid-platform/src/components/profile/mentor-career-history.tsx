'use client'

import { Briefcase } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { MentorCareerEntry } from '@/lib/profile/types'
import { cn } from '@/lib/utils'

type MentorCareerHistoryProps = {
  entries: MentorCareerEntry[]
  /** When true, omits outer card chrome (used inside MentorBioSection). */
  embedded?: boolean
}

function formatYearRange(start?: number, end?: number | null): string | null {
  if (!start) return null
  if (end == null) return `${start} –`
  return `${start} – ${end}`
}

export function MentorCareerHistory({ entries, embedded = false }: MentorCareerHistoryProps) {
  const t = useTranslations('profile.mentor.public')

  if (entries.length === 0) {
    if (embedded) return null
    return (
      <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">{t('careerTitle')}</h2>
        <p className="text-sm text-muted-foreground">{t('careerEmpty')}</p>
      </section>
    )
  }

  const content = (
    <>
      <h2 className={cn('text-sm font-medium text-muted-foreground', embedded ? 'mb-3' : 'mb-4')}>
        {t('careerTitle')}
      </h2>
      <ol className="relative space-y-6 border-s border-border ps-6">
        {entries.map((entry, index) => {
          const years = formatYearRange(entry.start_year, entry.end_year)
          const key = `${entry.company ?? 'role'}-${entry.start_year ?? index}`
          return (
            <li key={key} className="relative">
              <span
                className="absolute -start-[1.6rem] top-1.5 h-3 w-3 rounded-full border-2 border-jid-olive bg-card"
                aria-hidden
              />
              <div className="space-y-1">
                <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-foreground">
                  <Briefcase className="h-4 w-4 text-primary" aria-hidden />
                  {entry.title ?? t('careerRoleFallback')}
                  {entry.company ? (
                    <span className="font-normal text-muted-foreground">@ {entry.company}</span>
                  ) : null}
                </p>
                {years ? <p className="text-xs text-muted-foreground">{years}</p> : null}
                {entry.description ? (
                  <p className="text-sm text-muted-foreground">{entry.description}</p>
                ) : null}
              </div>
            </li>
          )
        })}
      </ol>
    </>
  )

  if (embedded) {
    return <div>{content}</div>
  }

  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-sm">{content}</section>
  )
}
