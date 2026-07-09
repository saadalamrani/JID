'use client'

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Megaphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type BoostTeaserProps = {
  className?: string
}

export function BoostTeaser({ className }: BoostTeaserProps) {
  const t = useTranslations('company.boost')

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.debug('[analytics]', 'boost_teaser_viewed')
    }
  }, [])

  return (
    <section
      className={cn(
        'rounded-xl border border-jid-gold/30 bg-jid-beige-warm/60 p-4',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <Megaphone className="mt-0.5 h-5 w-5 shrink-0 text-jid-olive" aria-hidden />
        <div className="min-w-0 flex-1">
          <h3 className="font-arabic text-sm font-semibold text-jid-olive">{t('teaserTitle')}</h3>
          <p className="mt-1 font-arabic text-sm text-muted-foreground">{t('teaserBody')}</p>
          <Button type="button" size="sm" className="mt-3 font-arabic" variant="outline" asChild>
            <a href="mailto:sales@jid.sa?subject=Priority%20Visibility">{t('salesCta')}</a>
          </Button>
        </div>
      </div>
    </section>
  )
}
