'use client'

import { useEffect, useState } from 'react'
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
import type { JidPlusFeatureKey } from '@/lib/monetization/feature-keys'
import { fetchJidPlusPlan } from '@/lib/monetization/plans-client'
import { JID_PLUS_PLAN_QUERY_KEY } from '@/lib/monetization/query-keys'
import type { BillingCycle } from '@/lib/monetization/types'
import { PlusPlanCompare } from './plus-plan-compare'

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

  useEffect(() => {
    if (!open) return
    if (typeof window === 'undefined') return
    if (process.env.NODE_ENV === 'development') {
      console.debug('[analytics]', 'plus_pricing_viewed', { feature_key: feature, cycle })
    }
  }, [open, feature, cycle])

  async function handleCheckout() {
    if (!planQuery.data) return
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
          locale,
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg font-arabic" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
        <DialogHeader className={locale === 'ar' ? 'text-right sm:text-right' : undefined}>
          <DialogTitle className="font-arabic text-primary">{t('title')}</DialogTitle>
          <DialogDescription className="font-arabic leading-relaxed">
            {t(`features.${feature}.headline`)}
          </DialogDescription>
        </DialogHeader>

        <PlusPlanCompare
          plan={planQuery.data}
          cycle={cycle}
          onCycleChange={setCycle}
          locale={locale}
          isLoading={planQuery.isLoading}
        />

        <DialogFooter className={locale === 'ar' ? 'sm:justify-start' : undefined}>
          <Button
            type="button"
            className="w-full bg-primary font-arabic text-primary-foreground hover:bg-primary/90 sm:w-auto"
            disabled={!planQuery.data || planQuery.isLoading || checkoutLoading}
            onClick={() => void handleCheckout()}
          >
            {checkoutLoading ? t('checkoutLoading') : t('checkoutCta')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
