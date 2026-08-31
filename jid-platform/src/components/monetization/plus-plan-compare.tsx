'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/lib/i18n/navigation'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { packageByKey } from '@/lib/commercial/contracts'

type PlusPlanCompareProps = {
  locale: 'ar' | 'en'
  className?: string
}

export function PlusPlanCompare({ locale, className }: PlusPlanCompareProps) {
  const t = useTranslations('monetization.upgrade')
  const core = packageByKey('individual_core')
  const plus = packageByKey('jid_plus')
  const plusName = plus ? (locale === 'ar' ? plus.nameAr : plus.nameEn) : t('planFallback')
  const plusIncludes = plus ? (locale === 'ar' ? plus.includesAr : plus.includesEn) : []
  const coreIncludes = core ? (locale === 'ar' ? core.includesAr : core.includesEn) : []

  return (
    <div className={cn('space-y-4', className)} data-testid="plus-plan-compare">
      <div className="rounded-xl border border-accent/30 bg-surface/70 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-arabic text-sm font-semibold text-primary">{plusName}</p>
            <p className="mt-1 font-arabic text-xs text-muted-foreground">{t('priceNotAdopted')}</p>
          </div>
          <span className="inline-flex rounded-full bg-accent px-2 py-0.5 font-arabic text-xs font-semibold text-primary">
            {t('badge')}
          </span>
        </div>
        <p className="mt-4 font-arabic text-base font-semibold text-primary">{t('priceLabel')}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-border p-3">
          <p className="font-arabic text-xs font-semibold text-foreground">{t('coreTitle')}</p>
          <ul className="mt-2 space-y-1.5 font-arabic text-xs text-muted-foreground">
            {coreIncludes.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg border border-accent/30 bg-accent/5 p-3">
          <p className="font-arabic text-xs font-semibold text-primary">{plusName}</p>
          <ul className="mt-2 space-y-1.5 font-arabic text-xs text-muted-foreground">
            {plusIncludes.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      </div>

      <Button asChild className="w-full bg-primary font-arabic text-primary-foreground hover:bg-primary/90">
        <Link href="/contact">{t('designPartnerCta')}</Link>
      </Button>
    </div>
  )
}
