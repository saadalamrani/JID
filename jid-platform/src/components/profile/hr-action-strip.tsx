'use client'

import { Bookmark, UserPlus } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { ActionButtonStrip } from '@/components/profile/action-button-strip'
import { MaskedContactButton } from '@/components/profile/masked-contact-button'
import { Button } from '@/components/ui/button'

type HRActionStripProps = {
  profileId: string
}

export function HRActionStrip({ profileId }: HRActionStripProps) {
  const t = useTranslations('profile.public')

  return (
    <ActionButtonStrip ariaLabel={t('hrActionsLabel')}>
      <MaskedContactButton />
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="border-jid-line"
        onClick={() => console.info('Save candidate', profileId)}
      >
        <Bookmark className="h-4 w-4" aria-hidden />
        {t('saveCandidate')}
      </Button>
      <Button type="button" size="sm" className="bg-jid-olive hover:bg-jid-olive/90">
        <UserPlus className="h-4 w-4" aria-hidden />
        {t('inviteToApply')}
      </Button>
    </ActionButtonStrip>
  )
}
