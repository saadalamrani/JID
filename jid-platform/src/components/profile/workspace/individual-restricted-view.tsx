'use client'

import { Lock } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { IndividualProfileIdentity } from '@/lib/profile/individual-projection-types'

type IndividualRestrictedViewProps = {
  identity: IndividualProfileIdentity
}

export function IndividualRestrictedView({ identity }: IndividualRestrictedViewProps) {
  const t = useTranslations('profile.workspace')

  return (
    <div className="container-jid flex min-h-[50vh] flex-col items-center justify-center py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <Lock className="h-8 w-8 text-primary" aria-hidden />
      </div>
      {identity.fullName ? (
        <p className="mt-6 text-lg font-semibold text-foreground">{identity.fullName}</p>
      ) : null}
      <h1 className="mt-2 text-xl font-semibold text-foreground">{t('restrictedTitle')}</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">{t('restrictedMessage')}</p>
    </div>
  )
}
