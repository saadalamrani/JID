'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useLocale, useTranslations } from 'next-intl'
import { TierBadge } from '@/components/monetization/tier-badge'
import { useEntitlement } from '@/lib/monetization/use-entitlement'
import {
  CV_FORMAT_REGISTRY,
  type CvExportFormatKey,
  formatRequiresPlus,
} from '@/lib/cv/formats/registry'
import { fetchCvBuilderPrefs, upsertCvBuilderPrefs } from '@/lib/cv/prefs-client'
import { cn } from '@/lib/utils'

export const CV_BUILDER_PREFS_QUERY_KEY = ['cv-builder-prefs'] as const

type FormatPickerProps = {
  value: CvExportFormatKey
  onChange: (format: CvExportFormatKey) => void
  className?: string
}

export function useCvBuilderPrefs() {
  return useQuery({
    queryKey: CV_BUILDER_PREFS_QUERY_KEY,
    queryFn: fetchCvBuilderPrefs,
    staleTime: 60_000,
  })
}

/** Format cards — basic (عادي) / Harvard & ATS (بلس). */
export function FormatPicker({ value, onChange, className }: FormatPickerProps) {
  const t = useTranslations('cv.builder.formats')
  const locale = useLocale() as 'ar' | 'en'
  const { enabled: hasPlus } = useEntitlement('cv_pro_formats')
  const queryClient = useQueryClient()

  const saveMutation = useMutation({
    mutationFn: upsertCvBuilderPrefs,
    onSuccess: (prefs) => {
      queryClient.setQueryData(CV_BUILDER_PREFS_QUERY_KEY, prefs)
    },
  })

  function selectFormat(format: CvExportFormatKey) {
    onChange(format)
    void saveMutation.mutateAsync({ preferredFormat: format })

    if (process.env.NODE_ENV === 'development') {
      console.debug('[analytics]', 'cv_format_selected', { format })
      if (formatRequiresPlus(format) && !hasPlus) {
        console.debug('[analytics]', 'cv_plus_teaser_viewed', { format })
      }
    }
  }

  return (
    <section className={cn('space-y-3', className)} aria-label={t('ariaLabel')}>
      <div>
        <h2 className="font-arabic text-base font-semibold text-foreground">{t('title')}</h2>
        <p className="mt-1 font-arabic text-sm text-muted-foreground">{t('subtitle')}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {(Object.keys(CV_FORMAT_REGISTRY) as CvExportFormatKey[]).map((formatKey) => {
          const def = CV_FORMAT_REGISTRY[formatKey]
          const isPlus = def.tier === 'plus'
          const isSelected = value === formatKey
          const locked = isPlus && !hasPlus

          return (
            <button
              key={formatKey}
              type="button"
              onClick={() => selectFormat(formatKey)}
              className={cn(
                'rounded-xl border p-4 text-start transition-colors',
                isSelected
                  ? 'border-primary bg-surface/80 shadow-sm'
                  : 'border-border bg-card hover:border-accent/40',
                locked && 'opacity-95',
              )}
              aria-pressed={isSelected}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="font-arabic text-sm font-semibold text-foreground">
                  {locale === 'ar' ? def.labelAr : def.labelEn}
                </span>
                <TierBadge tier={isPlus ? 'plus' : 'normal'} />
              </div>
              <p className="font-arabic text-xs leading-relaxed text-muted-foreground">
                {locale === 'ar' ? def.descriptionAr : def.descriptionEn}
              </p>
              {locked ? (
                <p className="mt-2 font-arabic text-xs font-medium text-primary">{t('plusRequired')}</p>
              ) : null}
            </button>
          )
        })}
      </div>
    </section>
  )
}
