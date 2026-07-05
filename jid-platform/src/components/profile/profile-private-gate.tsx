'use client'

import { Lock } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Link } from '@/lib/i18n/navigation'

/** Section 6.4 — shown when canViewerSeeProfile() is false. */
export function ProfilePrivateGate() {
  const t = useTranslations('profile.public')

  return (
    <div className="container-jid flex min-h-[50vh] flex-col items-center justify-center py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-jid-beige">
        <Lock className="h-8 w-8 text-jid-olive" aria-hidden />
      </div>
      <h1 className="mt-6 text-xl font-semibold text-jid-ink">{t('privateGateTitle')}</h1>
      <p className="mt-2 max-w-md text-sm text-jid-ink/70">{t('privateGateMessage')}</p>
      <Link
        href="/login"
        className="mt-6 text-sm font-medium text-jid-olive underline-offset-4 hover:underline"
      >
        {t('privateGateLogin')}
      </Link>
    </div>
  )
}
