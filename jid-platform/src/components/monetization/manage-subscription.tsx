'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useLocale, useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { USER_SUBSCRIPTION_QUERY_KEY } from '@/lib/monetization/query-keys'
import { fetchMyJidPlusSubscription } from '@/lib/monetization/subscriptions-client'
import { UpgradeDialog } from './upgrade-dialog'

type ManageSubscriptionProps = {
  className?: string
}

export function ManageSubscription({ className }: ManageSubscriptionProps) {
  const t = useTranslations('monetization.manage')
  const locale = useLocale() as 'ar' | 'en'
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const [cancelLoading, setCancelLoading] = useState(false)

  const subscriptionQuery = useQuery({
    queryKey: USER_SUBSCRIPTION_QUERY_KEY,
    queryFn: fetchMyJidPlusSubscription,
    staleTime: 60_000,
  })

  const subscription = subscriptionQuery.data

  async function handleCancelToggle(nextValue: boolean) {
    if (!subscription) return
    setCancelLoading(true)
    try {
      const response = await fetch('/api/billing/subscription', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          subscriptionId: subscription.id,
          cancelAtPeriodEnd: nextValue,
        }),
      })

      const body = (await response.json().catch(() => ({}))) as { error?: string }
      if (!response.ok) {
        throw new Error(body.error ?? t('updateFailed'))
      }

      toast.success(nextValue ? t('cancelScheduled') : t('cancelReverted'))
      await subscriptionQuery.refetch()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('updateFailed'))
    } finally {
      setCancelLoading(false)
    }
  }

  if (subscriptionQuery.isLoading) {
    return (
      <section className={cn('rounded-xl border border-border bg-card p-5', className)}>
        <p className="font-arabic text-sm text-muted-foreground">{t('loading')}</p>
      </section>
    )
  }

  if (!subscription) {
    return (
      <section className={cn('rounded-xl border border-border bg-card p-5', className)}>
        <h2 className="font-arabic text-base font-semibold text-foreground">{t('title')}</h2>
        <p className="mt-2 font-arabic text-sm leading-relaxed text-muted-foreground">{t('empty')}</p>
        <Button
          type="button"
          className="mt-4 bg-jid-olive font-arabic text-primary-foreground hover:bg-jid-olive/90"
          onClick={() => setUpgradeOpen(true)}
        >
          {t('upgradeCta')}
        </Button>
        <UpgradeDialog
          open={upgradeOpen}
          onOpenChange={setUpgradeOpen}
          feature="cv_pro_formats"
          locale={locale}
        />
      </section>
    )
  }

  const planName = locale === 'ar' ? subscription.planNameAr : subscription.planNameEn
  const renewalDate = new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA-u-nu-latn' : 'en-GB', {
    dateStyle: 'medium',
  }).format(new Date(subscription.currentPeriodEnd))

  return (
    <section className={cn('rounded-xl border border-border bg-card p-5', className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-arabic text-base font-semibold text-foreground">{t('title')}</h2>
          <p className="mt-1 font-arabic text-sm text-muted-foreground">{t('subtitle')}</p>
        </div>
        <span className="inline-flex items-center rounded-full bg-jid-gold px-2.5 py-0.5 font-arabic text-xs font-semibold text-jid-olive">
          بلس
        </span>
      </div>

      <dl className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="font-arabic text-xs text-muted-foreground">{t('plan')}</dt>
          <dd className="mt-1 font-arabic text-sm font-medium text-foreground">{planName}</dd>
        </div>
        <div>
          <dt className="font-arabic text-xs text-muted-foreground">{t('status')}</dt>
          <dd className="mt-1 font-arabic text-sm font-medium text-foreground">
            {t(`statuses.${subscription.status}`)}
          </dd>
        </div>
        <div>
          <dt className="font-arabic text-xs text-muted-foreground">{t('billingCycle')}</dt>
          <dd className="mt-1 font-arabic text-sm font-medium text-foreground">
            {subscription.billingCycle === 'yearly' ? t('yearly') : t('monthly')}
          </dd>
        </div>
        <div>
          <dt className="font-arabic text-xs text-muted-foreground">{t('renewalDate')}</dt>
          <dd className="mt-1 font-latin text-sm font-medium tabular-nums text-foreground">{renewalDate}</dd>
        </div>
      </dl>

      {subscription.status === 'past_due' ? (
        <p className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 font-arabic text-sm text-destructive">
          {t('pastDueNotice')}
        </p>
      ) : null}

      <div className="mt-5 flex items-center justify-between gap-4 rounded-lg border border-border/70 bg-muted/30 px-4 py-3">
        <div>
          <p className="font-arabic text-sm font-medium text-foreground">{t('cancelAtPeriodEnd')}</p>
          <p className="mt-0.5 font-arabic text-xs text-muted-foreground">{t('cancelHint')}</p>
        </div>
        <Switch
          checked={subscription.cancelAtPeriodEnd}
          disabled={cancelLoading || subscription.status === 'past_due'}
          onCheckedChange={(value) => void handleCancelToggle(value)}
          aria-label={t('cancelAtPeriodEnd')}
        />
      </div>

      <p className="mt-4 font-arabic text-xs text-muted-foreground">
        {t('priceReminder', {
          cycle: subscription.billingCycle === 'yearly' ? t('yearly') : t('monthly'),
        })}
      </p>
    </section>
  )
}
