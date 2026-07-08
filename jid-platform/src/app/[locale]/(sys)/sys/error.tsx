'use client'

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { ErrorState } from '@/components/shared/error-state'
import { Link } from '@/lib/i18n/navigation'

type SysErrorProps = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function SysError({ error, reset }: SysErrorProps) {
  const t = useTranslations('sys.shell')

  useEffect(() => {
    console.error('[sys]', error)
  }, [error])

  return (
    <ErrorState
      title={t('errorTitle')}
      message={t('error')}
      onRetry={reset}
      retryLabel={t('retry')}
      secondaryAction={
        <Button asChild variant="ghost">
          <Link href="/sys/dashboard">{t('backToDashboard')}</Link>
        </Button>
      }
    />
  )
}
