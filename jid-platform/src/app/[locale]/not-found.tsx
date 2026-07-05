'use client'

import { Button } from '@/components/ui/button'
import { Link } from '@/lib/i18n/navigation'
import { useTranslations } from 'next-intl'

export default function NotFoundPage() {
  const t = useTranslations('errors')
  const tCommon = useTranslations('common')

  return (
    <main className="container-jid flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-2xl font-semibold text-foreground">{t('notFound')}</h1>
      <p className="max-w-md text-muted-foreground">{t('notFoundDescription')}</p>
      <Button asChild>
        <Link href="/">{tCommon('back')}</Link>
      </Button>
    </main>
  )
}
