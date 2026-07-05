'use client'

import { MessageCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { ActionButtonStrip } from '@/components/profile/action-button-strip'
import { Button } from '@/components/ui/button'

type MentorRequestCTAProps = {
  mentorId: string
}

export function MentorRequestCTA({ mentorId }: MentorRequestCTAProps) {
  const t = useTranslations('profile.mentor.public')

  return (
    <ActionButtonStrip ariaLabel={t('requestCtaLabel')}>
      <Button
        type="button"
        size="sm"
        className="bg-jid-olive hover:bg-jid-olive/90"
        onClick={() => console.info('Request mentorship session', mentorId)}
      >
        <MessageCircle className="h-4 w-4" aria-hidden />
        {t('requestCta')}
      </Button>
    </ActionButtonStrip>
  )
}
