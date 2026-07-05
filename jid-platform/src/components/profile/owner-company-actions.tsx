'use client'

import { Pencil, Settings } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { ActionButtonStrip } from '@/components/profile/action-button-strip'
import { Button } from '@/components/ui/button'
import { Link } from '@/lib/i18n/navigation'

export function OwnerCompanyActions() {
  const t = useTranslations('profile.company.public')

  return (
    <ActionButtonStrip ariaLabel={t('ownerActionsLabel')}>
      <Button asChild size="sm" variant="outline" className="border-jid-line">
        <Link href="/company/profile/edit">
          <Pencil className="h-4 w-4" aria-hidden />
          {t('editCompany')}
        </Link>
      </Button>
      <Button asChild size="sm" variant="ghost">
        <Link href="/company/settings">
          <Settings className="h-4 w-4" aria-hidden />
          {t('companySettings')}
        </Link>
      </Button>
    </ActionButtonStrip>
  )
}
