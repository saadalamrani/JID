'use client'

import { Lock, Pencil, Settings } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { ActionButtonStrip } from '@/components/profile/action-button-strip'
import { Button } from '@/components/ui/button'
import { Link } from '@/lib/i18n/navigation'

export function OwnerActionsBar() {
  const t = useTranslations('profile.public')

  return (
    <ActionButtonStrip ariaLabel={t('ownerActionsLabel')}>
      <Button asChild size="sm" variant="outline" className="border-border">
        <Link href="/profile/edit">
          <Pencil className="h-4 w-4" aria-hidden />
          {t('editProfile')}
        </Link>
      </Button>
      <Button asChild size="sm" variant="ghost">
        <Link href="/profile/privacy">
          <Lock className="h-4 w-4" aria-hidden />
          {t('privacySettings')}
        </Link>
      </Button>
      <Button asChild size="sm" variant="ghost">
        <Link href="/settings/sessions">
          <Settings className="h-4 w-4" aria-hidden />
          {t('profileSettings')}
        </Link>
      </Button>
    </ActionButtonStrip>
  )
}
