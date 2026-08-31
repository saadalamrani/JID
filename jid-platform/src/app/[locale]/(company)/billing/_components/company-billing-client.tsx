'use client'

import { useTranslations } from 'next-intl'
import { PackageCatalog } from '@/components/commercial/package-catalog'
import type { CompanySubscriptionSummary } from '@/lib/monetization/company-subscription-server'

type CompanyBillingClientProps = {
  subscription: CompanySubscriptionSummary | null
  locale: 'ar' | 'en'
}

export function CompanyBillingClient({ subscription, locale }: CompanyBillingClientProps) {
  const t = useTranslations('monetization.companyBilling')

  const planName = subscription
    ? locale === 'ar'
      ? subscription.planNameAr
      : subscription.planNameEn
    : null

  const renewalDate = subscription
    ? new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA-u-nu-latn' : 'en-GB', {
        dateStyle: 'medium',
      }).format(new Date(subscription.currentPeriodEnd))
    : null

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-arabic text-2xl font-semibold text-primary">{t('title')}</h1>
        <p className="mt-2 font-arabic text-sm leading-relaxed text-muted-foreground">{t('subtitle')}</p>
      </header>

      {subscription ? (
        <section className="rounded-xl border border-border bg-card p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-arabic text-xs text-muted-foreground">{t('currentPlan')}</p>
              <p className="mt-1 font-arabic text-lg font-semibold text-foreground">{planName}</p>
            </div>
            <span className="inline-flex rounded-full bg-accent/20 px-2.5 py-0.5 font-arabic text-xs font-semibold text-primary">
              {t('active')}
            </span>
          </div>
          <dl className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="font-arabic text-xs text-muted-foreground">{t('billingCycle')}</dt>
              <dd className="mt-1 font-arabic text-sm font-medium">
                {subscription.billingCycle === 'yearly' ? t('yearly') : t('monthly')}
              </dd>
            </div>
            <div>
              <dt className="font-arabic text-xs text-muted-foreground">{t('renewalDate')}</dt>
              <dd className="mt-1 font-latin text-sm font-medium tabular-nums">{renewalDate}</dd>
            </div>
          </dl>
        </section>
      ) : null}

      <PackageCatalog actor="business" currentPlanKey={subscription?.planKey ?? null} />
    </div>
  )
}
