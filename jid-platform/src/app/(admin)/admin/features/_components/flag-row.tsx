'use client'

import { useState, useTransition } from 'react'
import { AlertTriangle } from 'lucide-react'
import { updatePulseFeatureFlag } from '@/app/[locale]/(sys)/sys/features/actions'
import { Switch } from '@/components/ui/switch'
import type { FeatureFlagKey } from '@/lib/features/feature-flag-keys'
import type { PulseFeatureFlagRow } from '@/lib/features/pulse-admin-queries'
import { cn } from '@/lib/utils'

type FlagRowProps = {
  flag: PulseFeatureFlagRow
  isMaster?: boolean
  showTractionWarning?: boolean
}

export function FlagRow({ flag, isMaster = false, showTractionWarning = false }: FlagRowProps) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const label = flag.label_en
  const description = flag.description_en

  const handleToggle = (checked: boolean) => {
    setError(null)
    startTransition(async () => {
      const result = await updatePulseFeatureFlag(flag.key as FeatureFlagKey, checked)
      if (!result.ok) {
        setError(result.error)
        return
      }
      window.location.reload()
    })
  }

  return (
    <div
      className={cn(
        'rounded-lg border bg-white px-4 py-4',
        isMaster ? 'border-jid-olive/40 shadow-sm' : 'border-jid-line',
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-jid-ink">{label}</p>
            {isMaster ? (
              <span className="rounded bg-jid-olive/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-jid-olive">
                master
              </span>
            ) : null}
            <code className="rounded bg-jid-beige/60 px-1.5 py-0.5 text-[11px] text-jid-ink/60">{flag.key}</code>
          </div>
          {description ? <p className="mt-1 text-sm text-jid-ink/60">{description}</p> : null}
          {showTractionWarning ? (
            <p className="mt-2 flex items-start gap-2 text-sm text-amber-800">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              Threshold readiness is below recommended baseline.
            </p>
          ) : null}
          {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
        </div>
        <Switch
          checked={flag.is_enabled}
          onCheckedChange={handleToggle}
          disabled={pending}
          aria-label={`Toggle ${flag.key}`}
        />
      </div>
    </div>
  )
}
