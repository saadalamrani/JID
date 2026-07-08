'use client'

import { useState, useTransition } from 'react'
import { AlertTriangle } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from '@/lib/i18n/navigation'
import { updatePulseFeatureFlag } from '@/app/[locale]/(sys)/sys/features/actions'
import type { PulseFeatureFlagRow } from '@/lib/features/pulse-admin-queries'
import type { FeatureFlagKey } from '@/lib/features/feature-flag-keys'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

type PulseFlagRowProps = {
  flag: PulseFeatureFlagRow
  isMaster?: boolean
  showTractionWarning?: boolean
}

export function PulseFlagRow({ flag, isMaster = false, showTractionWarning = false }: PulseFlagRowProps) {
  const t = useTranslations('sys.features.flagRow')
  const locale = useLocale()
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const label = locale === 'ar' ? flag.label_ar : flag.label_en
  const description = locale === 'ar' ? flag.description_ar : flag.description_en

  const handleToggle = (checked: boolean) => {
    setError(null)
    startTransition(async () => {
      const result = await updatePulseFeatureFlag(flag.key as FeatureFlagKey, checked)
      if (!result.ok) {
        setError(result.error)
        return
      }
      router.refresh()
    })
  }

  return (
    <div
      className={cn(
        'rounded-lg border bg-card px-4 py-4',
        isMaster ? 'border-primary/25 shadow-sm' : 'border-border',
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-foreground">{label}</p>
            {isMaster ? (
              <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                {t('masterBadge')}
              </span>
            ) : null}
            <code className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">{flag.key}</code>
          </div>
          {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
          {showTractionWarning ? (
            <p className="mt-2 flex items-start gap-2 text-sm text-sem-warning">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              {t('tractionWarning')}
            </p>
          ) : null}
          {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
        </div>
        <Switch
          checked={flag.is_enabled}
          onCheckedChange={handleToggle}
          disabled={pending}
          aria-label={t('toggleAria', { key: flag.key })}
        />
      </div>
    </div>
  )
}

export { PulseFlagRow as FlagRow }
