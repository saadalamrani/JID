'use client'

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { ErrorPageShell, ErrorState } from '@/components/shared/error-state'

type BusinessProfileErrorProps = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function BusinessProfileError({ error, reset }: BusinessProfileErrorProps) {
  const t = useTranslations('businessProfile.public')

  useEffect(() => {
    console.error('Business profile page error:', error)
  }, [error])

  return (
    <ErrorPageShell className="items-start">
      <ErrorState
        title={t('errorTitle')}
        message={error.message}
        onRetry={reset}
        retryLabel={t('errorRetry')}
        className="w-full max-w-lg"
      />
    </ErrorPageShell>
  )
}
