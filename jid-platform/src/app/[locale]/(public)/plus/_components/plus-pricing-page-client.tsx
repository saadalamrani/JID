'use client'

import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ManageSubscription } from '@/components/monetization/manage-subscription'
import { PlusPlanCompare } from '@/components/monetization/plus-plan-compare'
import { useEntitlements } from '@/lib/monetization/use-entitlement'
import { fetchJidPlusPlan } from '@/lib/monetization/plans-client'
import { JID_PLUS_PLAN_QUERY_KEY } from '@/lib/monetization/query-keys'
import type { BillingCycle } from '@/lib/monetization/types'

type PlusPricingPageClientProps = {
  locale: 'ar' | 'en'
  checkoutSuccess?: boolean
}

export function PlusPricingPageClient({ locale, checkoutSuccess }: PlusPricingPageClientProps) {
  const t = useTranslations('monetization.pricing')
  const [cycle, setCycle] = useState<BillingCycle>('yearly')
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const entitlements = useEntitlements()

  const planQuery = useQuery({
    queryKey: JID_PLUS_PLAN_QUERY_KEY,
    queryFn: fetchJidPlusPlan,
    staleTime: 60_000,
  })

  const hasPlus = (entitlements.data?.length ?? 0) > 0

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (process.env.NODE_ENV === 'development') {
      console.debug('[analytics]', 'plus_pricing_viewed', { source: 'plus_page', cycle })
    }
  }, [cycle])

  useEffect(() => {
    if (!checkoutSuccess) return
    toast.success(t('checkoutSuccess'))
    void entitlements.refetch()
  }, [checkoutSuccess, entitlements, t])

  async function handleCheckout() {
    if (!planQuery.data) return
    setCheckoutLoading(true)
    try {
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          planKey: 'jid_plus',
          billingCycle: cycle,
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
    <div className="mx-auto max-w-3xl space-y-8">
      <header className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-jid-gold/35 bg-jid-beige-warm">
          <Sparkles className="h-6 w-6 text-jid-olive" aria-hidden />
        </div>
        <p className="text-sm font-medium text-jid-gold">{t('eyebrow')}</p>
        <h1 className="mt-2 font-arabic text-3xl font-bold text-jid-olive">{t('title')}</h1>
        <p className="mt-3 font-arabic text-sm leading-relaxed text-jid-ink-soft">{t('subtitle')}</p>
      </header>

      {hasPlus ? (
        <ManageSubscription />
      ) : (
        <section className="rounded-2xl border border-jid-gold/30 bg-card p-6 shadow-sm">
          <PlusPlanCompare
            plan={planQuery.data}
            cycle={cycle}
            onCycleChange={setCycle}
            locale={locale}
            isLoading={planQuery.isLoading}
          />

          <Button
            type="button"
            className="mt-6 w-full bg-jid-olive font-arabic text-primary-foreground hover:bg-jid-olive/90"
            disabled={!planQuery.data || planQuery.isLoading || checkoutLoading}
            onClick={() => void handleCheckout()}
          >
            {checkoutLoading ? t('checkoutLoading') : t('checkoutCta')}
          </Button>

          <p className="mt-4 text-center font-arabic text-xs text-muted-foreground">{t('billingNote')}</p>
        </section>
      )}

      <section className="rounded-xl border border-border bg-muted/20 p-5">
        <h2 className="font-arabic text-base font-semibold text-foreground">{t('featuresTitle')}</h2>
        <ul className="mt-4 space-y-3 font-arabic text-sm text-jid-ink-soft">
          {(t.raw('featureItems') as string[]).map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-jid-gold" aria-hidden />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
