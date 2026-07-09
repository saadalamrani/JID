'use client'

import { useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { Switch } from '@/components/ui/switch'
import { toggleJobBoost } from '@/app/[locale]/(company)/jobs/boost-actions'
import { isJobBoostActive } from '@/lib/priority-visibility/interleave'
import type { CompanyBoostUsage, JobBoostState } from '@/lib/priority-visibility/queries'
import { cn } from '@/lib/utils'

type BoostToggleProps = {
  jobId: string
  boost: JobBoostState
  usage: CompanyBoostUsage
  className?: string
}

export function BoostToggle({ jobId, boost, usage, className }: BoostToggleProps) {
  const t = useTranslations('company.boost')
  const [pending, startTransition] = useTransition()
  const active = isJobBoostActive({
    isBoosted: boost.isBoosted,
    boostEndsAt: boost.boostEndsAt,
  })

  const onToggle = (checked: boolean) => {
    startTransition(async () => {
      const result = await toggleJobBoost(jobId, checked)
      if (!result.ok) {
        window.alert(t(`errors.${result.error}` as 'errors.subscription_required'))
        return
      }
      if (process.env.NODE_ENV === 'development') {
        console.debug('[analytics]', checked ? 'boost_enabled' : 'boost_disabled', { job_id: jobId })
      }
      if (!checked && result.ok) return
      if (checked && result.ok && usage.activeCount + 1 >= usage.quota) {
        console.debug('[analytics]', 'boost_quota_hit', { job_id: jobId })
      }
    })
  }

  const daysLeft =
    boost.boostEndsAt && active
      ? Math.max(0, Math.ceil((new Date(boost.boostEndsAt).getTime() - Date.now()) / 86_400_000))
      : null

  return (
    <div className={cn('rounded-xl border border-border/60 bg-card p-4', className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-arabic text-sm font-semibold text-foreground">{t('toggleTitle')}</p>
          <p className="mt-0.5 font-arabic text-xs text-muted-foreground">
            {t('quotaMeter', { active: usage.activeCount, quota: usage.quota })}
          </p>
          {daysLeft !== null ? (
            <p className="mt-1 font-mono text-xs text-muted-foreground">
              {t('windowRemaining', { days: daysLeft })}
            </p>
          ) : null}
        </div>
        <Switch
          checked={active}
          disabled={pending || (!active && usage.activeCount >= usage.quota)}
          onCheckedChange={onToggle}
          aria-label={t('toggleAria')}
        />
      </div>
    </div>
  )
}
