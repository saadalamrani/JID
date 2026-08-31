'use client'

import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Sparkles } from 'lucide-react'
import { ManageSubscription } from '@/components/monetization/manage-subscription'
import { PackageCatalog } from '@/components/commercial/package-catalog'
import { useEntitlements } from '@/lib/monetization/use-entitlement'
import { useEffect } from 'react'

type PlusPricingPageClientProps = {
  locale: 'ar' | 'en'
  checkoutSuccess?: boolean
}

export function PlusPricingPageClient({ checkoutSuccess }: PlusPricingPageClientProps) {
  const t = useTranslations('monetization.pricing')
  const entitlements = useEntitlements()
  const hasPlus = (entitlements.data?.length ?? 0) > 0

  useEffect(() => {
    if (!checkoutSuccess) return
    toast.success(t('checkoutSuccess'))
    void entitlements.refetch()
  }, [checkoutSuccess, entitlements, t])

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-accent/35 bg-surface">
          <Sparkles className="h-6 w-6 text-primary" aria-hidden />
        </div>
        <p className="text-sm font-medium text-accent">{t('eyebrow')}</p>
        <h1 className="mt-2 font-arabic text-3xl font-bold text-primary">{t('title')}</h1>
        <p className="mt-3 font-arabic text-sm leading-relaxed text-muted-foreground">{t('subtitle')}</p>
      </header>

      {hasPlus ? <ManageSubscription /> : <PackageCatalog actor="individual" />}
    </div>
  )
}
