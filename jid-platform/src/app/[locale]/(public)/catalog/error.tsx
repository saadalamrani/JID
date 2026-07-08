'use client'

import { useEffect } from 'react'
import { ErrorPageShell, ErrorState } from '@/components/shared/error-state'

type CatalogErrorProps = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function CatalogError({ error, reset }: CatalogErrorProps) {
  useEffect(() => {
    console.error('Catalog page error:', error)
  }, [error])

  return (
    <ErrorPageShell className="items-start">
      <ErrorState
        title="Could not load catalog"
        message={error.message}
        onRetry={reset}
        retryLabel="Try again"
        className="w-full max-w-lg"
      />
    </ErrorPageShell>
  )
}
