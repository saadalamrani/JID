'use client'

import { useEffect } from 'react'
import { ErrorPageShell, ErrorState } from '@/components/shared/error-state'

type OpportunitiesErrorProps = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function OpportunitiesError({ error, reset }: OpportunitiesErrorProps) {
  useEffect(() => {
    console.error('Opportunities page error:', error)
  }, [error])

  return (
    <ErrorPageShell className="items-start">
      <ErrorState
        title="تعذّر تحميل الفرص"
        message={error.message}
        onRetry={reset}
        retryLabel="إعادة المحاولة"
        className="w-full max-w-lg"
      />
    </ErrorPageShell>
  )
}
