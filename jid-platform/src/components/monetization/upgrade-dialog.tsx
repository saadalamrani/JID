'use client'

import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import type { JidPlusFeatureKey } from '@/lib/monetization/feature-keys'
import {
  computeYearlySavingsPercent,
  formatSarAmount,
  priceForCycle,
} from '@/lib/monetization/format'
import { fetchJidPlusPlan } from '@/lib/monetization/plans-client'
import { JID_PLUS_PLAN_QUERY_KEY } from '@/lib/monetization/query-keys'
import type { BillingCycle } from '@/lib/monetization/types'

type UpgradeDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  feature: JidPlusFeatureKey
  locale: 'ar' | 'en'
}

export function UpgradeDialog({ open, onOpenChange, feature, locale }: UpgradeDialogProps) {
  const t = useTranslations('monetization.upgrade')
  const [cycle, setCycle] = useState<BillingCycle>('yearly')
  const [checkoutLoading, setCheckoutLoading] = useState(false)

  const planQuery = useQuery({
    queryKey: JID_PLUS_PLAN_QUERY_KEY,
    queryFn: fetchJidPlusPlan,
    enabled: open,
    staleTime: 60_000,
  })

  const plan = planQuery.data

  const savingsPercent = useMemo(() => {
    if (!plan) return 0
    return computeYearlySavingsPercent(plan.priceMonthlySar, plan.priceYearlySar)
  }, [plan])

  const selectedPrice = plan ? priceForCycle(plan, cycle) : null

  useEffect(() => {
    if (!open) return
    if (typeof window === 'undefined') return
    if (process.env.NODE_ENV === 'development') {
      console.debug('[analytics]', 'plus_pricing_viewed', { feature_key: feature, cycle })
    }
  }, [open, feature, cycle])

  async function handleCheckout() {
    if (!plan) return
    setCheckoutLoading(true)
    try {
      if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
        console.debug('[analytics]', 'plus_checkout_started', {
          feature_key: feature,
          billing_cycle: cycle,
        })
      }

      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          planKey: 'jid_plus',
          billingCycle: cycle,
          featureKey: feature,
        }),
      })

      const body = (await response.json().catch(() => ({}))) as {
        checkoutUrl?: string
        error?: string
      }

      if (!response.ok) {
        throw new Error(body.error ?? t('checkoutUnavailable'))
      }

      if (body.checkoutUrl) {
        window.location.href = body.checkoutUrl
        return
      }

      throw new Error(t('checkoutUnavailable'))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('checkoutFailed'))
    } finally {
      setCheckoutLoading(false)
    }
  }

  const planName = plan ? (locale === 'ar' ? plan.nameAr : plan.nameEn) : t('planFallback')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg font-arabic" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
        <DialogHeader className={locale === 'ar' ? 'text-right sm:text-right' : undefined}>
          <DialogTitle className="font-arabic text-jid-olive">{t('title')}</DialogTitle>
          <DialogDescription className="font-arabic leading-relaxed">
            {t(`features.${feature}.headline`)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
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
              onClick={() => setCycle('yearly')}
            >
              {t('yearly')}
              {savingsPercent > 0 ? (
                <span className="ms-1 text-xs font-semibold">({t('savePercent', { percent: savingsPercent })})</span>
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
              onClick={() => setCycle('monthly')}
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
              {selectedPrice != null ? formatSarAmount(selectedPrice, locale) : '—'}
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

        <DialogFooter className={locale === 'ar' ? 'sm:justify-start' : undefined}>
          <Button
            type="button"
            className="w-full bg-jid-olive font-arabic text-primary-foreground hover:bg-jid-olive/90 sm:w-auto"
            disabled={!plan || planQuery.isLoading || checkoutLoading}
            onClick={() => void handleCheckout()}
          >
            {checkoutLoading ? t('checkoutLoading') : t('checkoutCta')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
