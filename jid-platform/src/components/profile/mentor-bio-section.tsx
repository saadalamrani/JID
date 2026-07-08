'use client'

import { useTranslations } from 'next-intl'
import { MentorCareerHistory } from '@/components/profile/mentor-career-history'
import type { MentorCareerEntry } from '@/lib/profile/types'

type MentorBioSectionProps = {
  bioLong: string | null
  careerHistory: MentorCareerEntry[]
}

/** Section 6.10 — bio_long and career_history JSONB timeline. */
export function MentorBioSection({ bioLong, careerHistory }: MentorBioSectionProps) {
  const t = useTranslations('profile.mentor.public')

  return (
    <section className="space-y-6 rounded-xl border border-border bg-card p-5 shadow-sm">
      <div>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">{t('bioTitle')}</h2>
        {bioLong ? (
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{bioLong}</p>
        ) : (
          <p className="text-sm text-muted-foreground">{t('bioEmpty')}</p>
        )}
      </div>
      <MentorCareerHistory entries={careerHistory} embedded />
    </section>
  )
}
