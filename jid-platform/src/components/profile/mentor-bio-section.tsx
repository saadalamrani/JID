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
    <section className="space-y-6 rounded-xl border border-jid-line bg-white p-5 shadow-sm">
      <div>
        <h2 className="mb-3 text-sm font-medium text-jid-ink/70">{t('bioTitle')}</h2>
        {bioLong ? (
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-jid-ink/80">{bioLong}</p>
        ) : (
          <p className="text-sm text-jid-ink/50">{t('bioEmpty')}</p>
        )}
      </div>
      <MentorCareerHistory entries={careerHistory} embedded />
    </section>
  )
}
