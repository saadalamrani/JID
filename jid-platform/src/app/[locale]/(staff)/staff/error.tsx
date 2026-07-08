'use client'

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { ErrorState } from '@/components/shared/error-state'
import { Link } from '@/lib/i18n/navigation'

type StaffErrorProps = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function StaffError({ error, reset }: StaffErrorProps) {
  const t = useTranslations('staff.shell')

  useEffect(() => {
    console.error('[staff]', error)
  }, [error])

  return (
    <ErrorState
      title={t('errorTitle')}
      message={t('error')}
      onRetry={reset}
      retryLabel={t('retry')}
      secondaryAction={
        <Button asChild variant="ghost">
          <Link href="/staff/dashboard">{t('backToDashboard')}</Link>
        </Button>
      }
    />
  )
}
