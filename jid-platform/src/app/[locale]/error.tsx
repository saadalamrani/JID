'use client'

import { Button } from '@/components/ui/button'
import { ErrorPageShell, ErrorState } from '@/components/shared/error-state'
import { useTranslations } from 'next-intl'

type ErrorPageProps = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ErrorPage({ reset }: ErrorPageProps) {
  const t = useTranslations('errors')
  const tCommon = useTranslations('common')

  return (
    <ErrorPageShell>
      <ErrorState title={t('generic')} message={t('genericDescription')} onRetry={reset} retryLabel={tCommon('retry')} />
    </ErrorPageShell>
  )
}
