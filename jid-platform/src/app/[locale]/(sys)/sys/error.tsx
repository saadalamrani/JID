'use client'

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Link } from '@/lib/i18n/navigation'

type SysErrorProps = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function SysError({ error, reset }: SysErrorProps) {
  const t = useTranslations('sys.shell')

  useEffect(() => {
    console.error('[sys]', error)
  }, [error])

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
      <h1 className="font-arabic text-lg font-semibold text-red-900">{t('errorTitle')}</h1>
      <p className="mt-2 text-sm text-red-800">{t('error')}</p>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
        <Button type="button" variant="outline" onClick={reset}>
          {t('retry')}
        </Button>
        <Button asChild variant="ghost">
          <Link href="/sys/dashboard">{t('backToDashboard')}</Link>
        </Button>
      </div>
    </div>
  )
}
