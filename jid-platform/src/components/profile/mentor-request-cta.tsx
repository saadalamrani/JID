'use client'

import { useTranslations } from 'next-intl'
import { ActionButtonStrip } from '@/components/profile/action-button-strip'
import { RequestSessionButton } from '@/components/mentorship/request-session-button'

type MentorRequestCTAProps = {
  mentorId: string
  mentorName?: string
  mentorHeadline?: string | null
  expertiseAreas?: string[]
  isAccepting?: boolean
}

export function MentorRequestCTA({
  mentorId,
  mentorName = 'Mentor',
  mentorHeadline,
  expertiseAreas = [],
  isAccepting = true,
}: MentorRequestCTAProps) {
  const t = useTranslations('profile.mentor.public')

  return (
    <ActionButtonStrip ariaLabel={t('requestCtaLabel')}>
      <RequestSessionButton
        mentorId={mentorId}
        mentorName={mentorName}
        mentorHeadline={mentorHeadline}
        expertiseAreas={expertiseAreas}
        isAccepting={isAccepting}
      />
    </ActionButtonStrip>
  )
}
