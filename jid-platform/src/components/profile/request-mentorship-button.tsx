'use client'

import { MessageCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { ActionButtonStrip } from '@/components/profile/action-button-strip'
import { Button } from '@/components/ui/button'

type RequestMentorshipButtonProps = {
  profileId: string
}

export function RequestMentorshipButton({ profileId }: RequestMentorshipButtonProps) {
  const t = useTranslations('profile.public')

  return (
    <ActionButtonStrip ariaLabel={t('mentorActionsLabel')}>
      <Button
        type="button"
        size="sm"
        className="bg-jid-olive hover:bg-jid-olive/90"
        onClick={() => console.info('Request mentorship', profileId)}
      >
        <MessageCircle className="h-4 w-4" aria-hidden />
        {t('requestMentorship')}
      </Button>
    </ActionButtonStrip>
  )
}
