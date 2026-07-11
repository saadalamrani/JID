'use client'

import { useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import {
  computeYearlySavingsPercent,
  formatSarAmount,
  priceForCycle,
} from '@/lib/monetization/format'
import type { BillingCycle, JidPlusPlan } from '@/lib/monetization/types'

type PlusPlanCompareProps = {
  plan: JidPlusPlan | null | undefined
  cycle: BillingCycle
  onCycleChange: (cycle: BillingCycle) => void
  locale: 'ar' | 'en'
  isLoading?: boolean
  className?: string
}

export function PlusPlanCompare({
  plan,
  cycle,
  onCycleChange,
  locale,
  isLoading = false,
  className,
}: PlusPlanCompareProps) {
  const t = useTranslations('monetization.upgrade')

  const savingsPercent = useMemo(() => {
    if (!plan) return 0
    return computeYearlySavingsPercent(plan.priceMonthlySar, plan.priceYearlySar)
  }, [plan])

  const selectedPrice = plan ? priceForCycle(plan, cycle) : null
  const planName = plan ? (locale === 'ar' ? plan.nameAr : plan.nameEn) : t('planFallback')

  return (
    <div className={cn('space-y-4', className)}>
      <div
        className="inline-flex w-full rounded-lg border border-border bg-muted/40 p-1"
        role="tablist"
        aria-label={t('cycleToggleLabel')}
      >
        <button
          type="button"
          role="tab"
          aria-selected={cycle === 'yearly'}
          className={cn(
            'flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors',
            cycle === 'yearly'
              ? 'bg-jid-gold text-jid-olive shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
          onClick={() => onCycleChange('yearly')}
        >
          {t('yearly')}
          {savingsPercent > 0 ? (
            <span className="ms-1 text-xs font-semibold">
              ({t('savePercent', { percent: savingsPercent })})
            </span>
          ) : null}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={cycle === 'monthly'}
          className={cn(
            'flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors',
            cycle === 'monthly'
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
          onClick={() => onCycleChange('monthly')}
        >
          {t('monthly')}
        </button>
      </div>

      <div className="rounded-xl border border-jid-gold/30 bg-jid-beige-warm/70 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-arabic text-sm font-semibold text-jid-olive">{planName}</p>
            <p className="mt-1 font-arabic text-xs text-jid-ink-soft">{t('billingNote')}</p>
          </div>
          <span className="inline-flex rounded-full bg-jid-gold px-2 py-0.5 font-arabic text-xs font-semibold text-jid-olive">
            بلس
          </span>
        </div>

        <p className="mt-4 font-latin text-3xl font-semibold tabular-nums text-jid-olive">
          {selectedPrice != null && !isLoading ? formatSarAmount(selectedPrice, locale) : '—'}
          <span className="ms-2 font-arabic text-sm font-normal text-muted-foreground">
            / {cycle === 'yearly' ? t('perYear') : t('perMonth')}
          </span>
        </p>

        {cycle === 'yearly' && plan ? (
          <p className="mt-2 font-arabic text-xs text-jid-ink-soft">
            {t('yearlyEquivalent', {
              monthly: formatSarAmount(plan.priceYearlySar / 12, locale),
            })}
          </p>
        ) : null}
      </div>

      <ul className="space-y-2 font-arabic text-sm text-jid-ink-soft">
        {(t.raw('includedBullets') as string[]).map((bullet) => (
          <li key={bullet} className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-jid-gold" aria-hidden />
            <span>{bullet}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
