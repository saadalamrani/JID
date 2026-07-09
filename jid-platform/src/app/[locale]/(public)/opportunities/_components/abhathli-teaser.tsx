'use client'

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { UpgradeDialog } from '@/components/monetization/upgrade-dialog'
import { useLocale } from 'next-intl'
import { useState } from 'react'

type AbhathliTeaserProps = {
  className?: string
}

export function AbhathliTeaser({ className }: AbhathliTeaserProps) {
  const t = useTranslations('opportunities.abhathli')
  const locale = useLocale() as 'ar' | 'en'
  const [upgradeOpen, setUpgradeOpen] = useState(false)

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.debug('[analytics]', 'abhathli_teaser_viewed')
    }
  }, [])

  return (
    <>
      <section
        className={cn(
          'rounded-xl border border-jid-gold/35 bg-jid-beige-warm/80 px-4 py-3 shadow-sm',
          className,
        )}
        aria-label={t('teaserAria')}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-jid-gold/40 bg-jid-gold/20">
              <Sparkles className="h-4 w-4 text-jid-olive" aria-hidden />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-arabic text-sm font-semibold text-jid-olive">{t('title')}</h2>
                <span className="rounded-full bg-jid-gold px-2 py-0.5 font-arabic text-xs font-semibold text-jid-olive">
                  بلس
                </span>
              </div>
              <p className="mt-0.5 font-arabic text-sm text-jid-ink-soft">{t('teaserLine')}</p>
            </div>
          </div>
          <Button
            type="button"
            size="sm"
            className="shrink-0 bg-jid-olive font-arabic text-primary-foreground hover:bg-jid-olive/90"
            onClick={() => {
              if (process.env.NODE_ENV === 'development') {
                console.debug('[analytics]', 'abhathli_upgrade_clicked')
              }
              setUpgradeOpen(true)
            }}
          >
            {t('upgradeCta')}
          </Button>
        </div>
      </section>

      <UpgradeDialog
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        feature="search_for_me"
        locale={locale}
      />
    </>
  )
}
