'use client'

import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'

type IndividualProfileErrorProps = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function IndividualProfileError({ reset }: IndividualProfileErrorProps) {
  const t = useTranslations('profile.workspace.error')

  return (
    <div className="container-jid flex min-h-[50vh] flex-col items-center justify-center py-16 text-center">
      <h1 className="text-xl font-semibold text-foreground">{t('title')}</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">{t('message')}</p>
      <Button type="button" className="mt-6" onClick={reset}>
        {t('retry')}
      </Button>
    </div>
  )
}
