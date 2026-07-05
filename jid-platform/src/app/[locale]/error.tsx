'use client'

import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'

type ErrorPageProps = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ErrorPage({ reset }: ErrorPageProps) {
  const t = useTranslations('errors')
  const tCommon = useTranslations('common')

  return (
    <main className="container-jid flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-2xl font-semibold text-foreground">{t('generic')}</h1>
      <p className="max-w-md text-muted-foreground">{t('genericDescription')}</p>
      <Button type="button" onClick={reset}>
        {tCommon('retry')}
      </Button>
    </main>
  )
}
