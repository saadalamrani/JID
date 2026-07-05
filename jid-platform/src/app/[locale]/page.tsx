'use client'

import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'

export default function HomePage() {
  const tApp = useTranslations('app')
  const tHome = useTranslations('home')

  return (
    <main className="container-jid flex min-h-[70vh] flex-col items-center justify-center gap-6 text-center">
      <div className="space-y-3">
        <p className="text-sm font-medium text-jid-gold">{tApp('name')}</p>
        <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground md:text-5xl">
          {tHome('title')}
        </h1>
        <p className="mx-auto max-w-xl text-lg text-muted-foreground">{tHome('subtitle')}</p>
        <p className="mx-auto max-w-2xl text-sm text-muted-foreground">{tApp('description')}</p>
      </div>
      <Button size="lg">{tHome('cta')}</Button>
    </main>
  )
}
