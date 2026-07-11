'use client'

import { useTranslations } from 'next-intl'
import { Mail, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Link } from '@/lib/i18n/navigation'
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
        <h1 className="font-arabic text-2xl font-semibold text-jid-olive">{t('title')}</h1>
        <p className="mt-2 font-arabic text-sm leading-relaxed text-muted-foreground">{t('subtitle')}</p>
      </header>

      {subscription ? (
        <section className="rounded-xl border border-border bg-card p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-arabic text-xs text-muted-foreground">{t('currentPlan')}</p>
              <p className="mt-1 font-arabic text-lg font-semibold text-foreground">{planName}</p>
            </div>
            <span className="inline-flex rounded-full bg-jid-gold/20 px-2.5 py-0.5 font-arabic text-xs font-semibold text-jid-olive">
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
      ) : (
        <section className="rounded-xl border border-jid-gold/30 bg-jid-beige-warm/60 p-6">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-jid-gold/40 bg-jid-gold/15">
              <Sparkles className="h-5 w-5 text-jid-olive" aria-hidden />
            </span>
            <div>
              <h2 className="font-arabic text-base font-semibold text-jid-olive">{t('teaserTitle')}</h2>
              <p className="mt-2 font-arabic text-sm leading-relaxed text-jid-ink-soft">{t('teaserBody')}</p>
              <ul className="mt-3 space-y-1.5 font-arabic text-sm text-jid-ink-soft">
                {(t.raw('teaserBullets') as string[]).map((bullet) => (
                  <li key={bullet}>• {bullet}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-arabic text-base font-semibold text-foreground">{t('salesTitle')}</h2>
        <p className="mt-2 font-arabic text-sm text-muted-foreground">{t('salesBody')}</p>
        <Button asChild className="mt-4 bg-jid-olive font-arabic text-primary-foreground hover:bg-jid-olive/90">
          <Link href="/contact">
            <Mail className="h-4 w-4" aria-hidden />
            {t('salesCta')}
          </Link>
        </Button>
      </section>
    </div>
  )
}
