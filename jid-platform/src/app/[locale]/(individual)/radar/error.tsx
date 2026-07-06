'use client'

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Link } from '@/lib/i18n/navigation'

type RadarErrorProps = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function RadarError({ error, reset }: RadarErrorProps) {
  const t = useTranslations('radar')

  useEffect(() => {
    console.error('[radar]', error)
  }, [error])

  return (
    <main className="container-jid py-8">
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <h1 className="font-arabic text-lg font-semibold text-red-900">{t('errorTitle')}</h1>
        <p className="mt-2 font-arabic text-sm text-red-800">{t('error')}</p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <Button type="button" variant="outline" onClick={reset} className="font-arabic">
            {t('retry')}
          </Button>
          <Button asChild variant="ghost" className="font-arabic">
            <Link href="/profile">{t('backToProfile')}</Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
