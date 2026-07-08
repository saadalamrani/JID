'use client'

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { ErrorState } from '@/components/shared/error-state'
import { Link } from '@/lib/i18n/navigation'

type RadarErrorProps = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function RadarError({ error, reset }: RadarErrorProps) {
  const t = useTranslations('radar')

  useEffect(() => {
    console.error('[radar]', error)
  }, [error])

  return (
    <main className="container-jid py-8">
      <ErrorState
        title={t('errorTitle')}
        message={t('error')}
        onRetry={reset}
        retryLabel={t('retry')}
        secondaryAction={
          <Button asChild variant="ghost" className="font-arabic">
            <Link href="/profile">{t('backToProfile')}</Link>
          </Button>
        }
      />
    </main>
  )
}
