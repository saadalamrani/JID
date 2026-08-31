'use client'

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { JidPlusFeatureKey } from '@/lib/monetization/feature-keys'
import { PlusPlanCompare } from './plus-plan-compare'

type UpgradeDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  feature: JidPlusFeatureKey
  locale: 'ar' | 'en'
}

export function UpgradeDialog({ open, onOpenChange, feature, locale }: UpgradeDialogProps) {
  const t = useTranslations('monetization.upgrade')

  useEffect(() => {
    if (!open) return
    if (typeof window === 'undefined') return
    if (process.env.NODE_ENV === 'development') {
      console.debug('[analytics]', 'plus_packaging_viewed', { feature_key: feature })
    }
  }, [open, feature])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg font-arabic" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
        <DialogHeader className={locale === 'ar' ? 'text-right sm:text-right' : undefined}>
          <DialogTitle className="font-arabic text-primary">{t('title')}</DialogTitle>
          <DialogDescription className="font-arabic leading-relaxed">
            {t(`features.${feature}.headline`)}
          </DialogDescription>
        </DialogHeader>
        <PlusPlanCompare locale={locale} />
      </DialogContent>
    </Dialog>
  )
}
