'use client'

import { useTranslations } from 'next-intl'
import type { MentorshipSummary } from '@/lib/profile/individual-projection-types'

type ProfileMentorshipSectionProps = {
  mentorship: MentorshipSummary | null
  visible: boolean
}

export function ProfileMentorshipSection({ mentorship, visible }: ProfileMentorshipSectionProps) {
  const t = useTranslations('profile.workspace.mentorship')

  if (!visible || !mentorship) return null

  const hasContent =
    mentorship.sessionCount != null ||
    mentorship.focusAreas.length > 0 ||
    mentorship.goals.length > 0 ||
    (mentorship.sessions?.length ?? 0) > 0

  if (!hasContent) {
    return (
      <section id="profile-section-mentorship" className="scroll-mt-24">
        <h2 className="mb-3 text-lg font-semibold text-foreground">{t('title')}</h2>
        <p className="rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">
          {t('emptyOwner')}
        </p>
      </section>
    )
  }

  return (
    <section id="profile-section-mentorship" className="scroll-mt-24">
      <h2 className="mb-3 text-lg font-semibold text-foreground">{t('title')}</h2>
      <div className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-sm">
        {mentorship.sessionCount != null ? (
          <div>
            <p className="text-xs font-medium text-muted-foreground">{t('sessionCount')}</p>
            <p className="text-sm text-foreground">{mentorship.sessionCount}</p>
          </div>
        ) : null}
        {mentorship.focusAreas.length > 0 ? (
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">{t('focusAreas')}</p>
            <div className="flex flex-wrap gap-2">
              {mentorship.focusAreas.map((area) => (
                <span
                  key={area}
                  className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground"
                >
                  {area}
                </span>
              ))}
            </div>
          </div>
        ) : null}
        {mentorship.goals.length > 0 ? (
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">{t('goals')}</p>
            <ul className="list-disc space-y-1 ps-4 text-sm text-muted-foreground">
              {mentorship.goals.map((goal) => (
                <li key={goal}>{goal}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {mentorship.showIdentifyingDetails && mentorship.sessions?.length ? (
          <ul className="space-y-2 border-t border-border pt-3" role="list">
            {mentorship.sessions.map((session) => (
              <li key={session.id} className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">
                  {session.mentorName ?? t('unnamedMentor')}
                </span>
                {session.scheduledAt ? (
                  <span className="ms-2 text-xs">
                    {new Date(session.scheduledAt).toLocaleDateString()}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  )
}
