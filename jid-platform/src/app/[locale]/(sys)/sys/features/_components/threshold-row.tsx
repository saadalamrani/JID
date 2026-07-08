'use client'

import { useState, useTransition } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from '@/lib/i18n/navigation'
import { updateMetricThresholdMin } from '@/app/[locale]/(sys)/sys/features/actions'
import type { MetricThresholdRow } from '@/lib/features/pulse-admin-queries'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type ThresholdRowProps = {
  threshold: MetricThresholdRow
}

/** Section 12 Step 2 — editable min_value + read-only current_value + is_displayed (is_met). */
export function ThresholdRow({ threshold }: ThresholdRowProps) {
  const t = useTranslations('sys.features.thresholdRow')
  const locale = useLocale()
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [minValue, setMinValue] = useState(String(threshold.min_value))
  const [error, setError] = useState<string | null>(null)

  const label = locale === 'ar' ? threshold.label_ar : threshold.label_en
  const isDisplayed = threshold.is_met

  const handleSave = () => {
    setError(null)
    const parsed = Number(minValue)
    startTransition(async () => {
      const result = await updateMetricThresholdMin(threshold.metric_key, parsed)
      if (!result.ok) {
        setError(result.error)
        return
      }
      router.refresh()
    })
  }

  const dirty = Number(minValue) !== threshold.min_value

  return (
    <div className="grid gap-3 rounded-lg border border-border bg-card px-4 py-4 md:grid-cols-[1fr_auto_auto_auto] md:items-center">
      <div>
        <p className="font-medium text-foreground">{label}</p>
        <code className="text-xs text-muted-foreground">{threshold.metric_key}</code>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted-foreground">{t('minValue')}</span>
        <Input
          type="number"
          min={0}
          step="any"
          value={minValue}
          disabled={pending}
          onChange={(event) => setMinValue(event.target.value)}
          className="w-28"
        />
      </label>

      <div className="text-sm">
        <p className="text-muted-foreground">{t('currentValue')}</p>
        <p className="font-mono font-medium text-foreground">{threshold.current_value}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span
          className={cn(
            'inline-flex rounded-full px-2.5 py-1 text-xs font-medium',
            isDisplayed ? 'bg-primary/10 text-primary' : 'bg-background text-muted-foreground',
          )}
        >
          {isDisplayed ? t('isDisplayed') : t('isHidden')}
        </span>
        <Button type="button" size="sm" variant="outline" disabled={pending || !dirty} onClick={handleSave}>
          {pending ? t('saving') : t('save')}
        </Button>
      </div>

      {error ? <p className="text-sm text-destructive md:col-span-4">{error}</p> : null}
    </div>
  )
}
