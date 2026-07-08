'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

type OpportunitiesErrorProps = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function OpportunitiesError({ error, reset }: OpportunitiesErrorProps) {
  useEffect(() => {
    console.error('Opportunities page error:', error)
  }, [error])

  return (
    <main className="container-jid flex min-h-[50vh] flex-col items-start justify-center gap-4 py-8">
      <h1 className="font-arabic text-xl font-semibold text-foreground">تعذّر تحميل الفرص</h1>
      <p className="max-w-md font-arabic text-sm text-foreground-400">{error.message}</p>
      <Button type="button" onClick={reset} className="bg-primary hover:bg-primary-600">
        إعادة المحاولة
      </Button>
    </main>
  )
}
