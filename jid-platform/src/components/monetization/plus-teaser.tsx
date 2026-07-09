'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { Lock, Sparkles } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { JidPlusFeatureKey } from '@/lib/monetization/feature-keys'
import { UpgradeDialog } from './upgrade-dialog'

type PlusTeaserProps = {
  feature: JidPlusFeatureKey
  className?: string
  /** Optional blurred preview slot — value visible, value locked. */
  preview?: ReactNode
  onUpgradeViewed?: () => void
}

export function PlusTeaser({ feature, className, preview, onUpgradeViewed }: PlusTeaserProps) {
  const t = useTranslations('monetization.teaser')
  const locale = useLocale() as 'ar' | 'en'
  const [upgradeOpen, setUpgradeOpen] = useState(false)

  useEffect(() => {
    onUpgradeViewed?.()
  }, [onUpgradeViewed])

  return (
    <>
      <section
        className={cn(
          'relative overflow-hidden rounded-xl border border-jid-gold/35 bg-jid-beige-warm/80 p-5 shadow-sm',
          className,
        )}
        aria-label={t('ariaLabel')}
      >
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-jid-gold/40 bg-jid-gold/20">
            <Sparkles className="h-4 w-4 text-jid-olive" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-arabic text-base font-semibold text-jid-olive">{t('title')}</h3>
              <span className="inline-flex items-center rounded-full bg-jid-gold px-2 py-0.5 font-arabic text-xs font-semibold text-jid-olive">
                بلس
              </span>
            </div>
            <p className="mt-1 font-arabic text-sm leading-relaxed text-jid-ink-soft">
              {t(`features.${feature}.description`)}
            </p>
            <ul className="mt-3 space-y-1.5 font-arabic text-sm text-jid-ink-soft">
              {(t.raw(`features.${feature}.bullets`) as string[]).map((bullet) => (
                <li key={bullet} className="flex items-start gap-2">
                  <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-jid-gold" aria-hidden />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
            <Button
              type="button"
              className="mt-4 bg-jid-olive font-arabic text-primary-foreground hover:bg-jid-olive/90"
              onClick={() => setUpgradeOpen(true)}
            >
              {t('upgradeCta')}
            </Button>
          </div>
        </div>

        {preview ? (
          <div className="relative mt-5 overflow-hidden rounded-lg border border-border/60 bg-card/60">
            <div className="pointer-events-none select-none blur-[6px] saturate-75">{preview}</div>
            <div className="absolute inset-0 flex items-center justify-center bg-background/35">
              <p className="rounded-full border border-jid-gold/40 bg-jid-beige-warm px-3 py-1 font-arabic text-xs font-medium text-jid-olive">
                {t('previewLocked')}
              </p>
            </div>
          </div>
        ) : null}
      </section>

      <UpgradeDialog
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        feature={feature}
        locale={locale}
      />
    </>
  )
}
