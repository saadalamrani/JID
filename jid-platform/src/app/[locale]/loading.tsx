'use client'

import { Logo } from '@/components/brand/logo'
import { Skeleton } from '@/components/ui/skeleton'
import { useTranslations } from 'next-intl'

export default function LoadingPage() {
  const t = useTranslations('common')

  return (
    <main className="container-jid flex min-h-[60vh] flex-col items-center justify-center gap-6">
      <Logo size="md" />
      <p className="text-sm text-muted-foreground">{t('loading')}</p>
      <div className="flex w-full max-w-md flex-col gap-3">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    </main>
  )
}
