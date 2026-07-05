'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

type CatalogErrorProps = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function CatalogError({ error, reset }: CatalogErrorProps) {
  useEffect(() => {
    console.error('Catalog page error:', error)
  }, [error])

  return (
    <main className="container-jid flex min-h-[50vh] flex-col items-start justify-center gap-4 py-8">
      <h1 className="text-xl font-semibold text-jid-ink">Could not load catalog</h1>
      <p className="max-w-md text-sm text-jid-ink/70">{error.message}</p>
      <Button type="button" onClick={reset} className="bg-jid-olive hover:bg-jid-olive/90">
        Try again
      </Button>
    </main>
  )
}
