'use client'

import { useState, useTransition } from 'react'
import { updateMetricThresholdMin } from '@/app/[locale]/(sys)/sys/features/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { MetricThresholdRow } from '@/lib/features/pulse-admin-queries'
import { cn } from '@/lib/utils'

type ThresholdRowProps = {
  threshold: MetricThresholdRow
}

export function ThresholdRow({ threshold }: ThresholdRowProps) {
  const [pending, startTransition] = useTransition()
  const [minValue, setMinValue] = useState(String(threshold.min_value))
  const [error, setError] = useState<string | null>(null)

  const handleSave = () => {
    setError(null)
    const parsed = Number(minValue)
    startTransition(async () => {
      const result = await updateMetricThresholdMin(threshold.metric_key, parsed)
      if (!result.ok) {
        setError(result.error)
        return
      }
      window.location.reload()
    })
  }

  const dirty = Number(minValue) !== threshold.min_value

  return (
    <div className="grid gap-3 rounded-lg border border-jid-line bg-white px-4 py-4 md:grid-cols-[1fr_auto_auto_auto] md:items-center">
      <div>
        <p className="font-medium text-jid-ink">{threshold.label_en}</p>
        <code className="text-xs text-jid-ink/45">{threshold.metric_key}</code>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-jid-ink/60">Min value</span>
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
        <p className="text-jid-ink/60">Current value</p>
        <p className="font-mono font-medium text-jid-ink">{threshold.current_value}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span
          className={cn(
            'inline-flex rounded-full px-2.5 py-1 text-xs font-medium',
            threshold.is_met ? 'bg-emerald-100 text-emerald-800' : 'bg-jid-beige text-jid-ink/60',
          )}
        >
          {threshold.is_met ? 'Displayed' : 'Hidden'}
        </span>
        <Button type="button" size="sm" variant="outline" disabled={pending || !dirty} onClick={handleSave}>
          {pending ? 'Saving...' : 'Save'}
        </Button>
      </div>

      {error ? <p className="text-sm text-red-600 md:col-span-4">{error}</p> : null}
    </div>
  )
}
