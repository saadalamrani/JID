'use client'

import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'

type CompanyShellErrorProps = {
  reset?: () => void
}

export function CompanyShellError({ reset }: CompanyShellErrorProps) {
  const t = useTranslations('company.shell')

  return (
    <div className="mx-auto max-w-lg px-4 py-12 text-center">
      <h1 className="text-lg font-semibold text-foreground">{t('errorTitle')}</h1>
      <p className="mt-2 text-sm text-foreground/70">{t('errorBody')}</p>
      {reset ? (
        <Button type="button" className="mt-6" onClick={reset}>
          {t('retry')}
        </Button>
      ) : null}
    </div>
  )
}
