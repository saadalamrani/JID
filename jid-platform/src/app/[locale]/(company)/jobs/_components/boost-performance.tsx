'use client'

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import type { JobBoostPerformance } from '@/lib/priority-visibility/queries'
import { cn } from '@/lib/utils'

type BoostPerformanceProps = {
  performance: JobBoostPerformance
  className?: string
}

export function BoostPerformance({ performance, className }: BoostPerformanceProps) {
  const t = useTranslations('company.boost.performance')

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.debug('[analytics]', 'boost_dashboard_viewed')
    }
  }, [])

  const liftLabel =
    performance.liftMultiplier !== null
      ? t('lift', { multiplier: performance.liftMultiplier.toFixed(1) })
      : t('liftPending')

  const recent = performance.stats.slice(-14)

  return (
    <section className={cn('rounded-xl border border-border/60 bg-card p-4', className)}>
      <header className="mb-3">
        <h3 className="font-arabic text-sm font-semibold text-foreground">{t('title')}</h3>
        <p className="mt-1 font-arabic text-sm text-jid-olive">{liftLabel}</p>
      </header>

      {recent.length === 0 ? (
        <p className="font-arabic text-xs text-muted-foreground">{t('empty')}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[320px] text-start text-xs">
            <thead>
              <tr className="border-b border-border/50 text-muted-foreground">
                <th className="py-1.5 font-arabic font-medium">{t('date')}</th>
                <th className="py-1.5 font-arabic font-medium">{t('impressions')}</th>
                <th className="py-1.5 font-arabic font-medium">{t('opens')}</th>
                <th className="py-1.5 font-arabic font-medium">{t('intents')}</th>
                <th className="py-1.5 font-arabic font-medium">{t('declarations')}</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((row) => (
                <tr key={row.statDate} className="border-b border-border/30">
                  <td className="py-1.5 font-mono">{row.statDate}</td>
                  <td className="py-1.5 font-mono">{row.impressions}</td>
                  <td className="py-1.5 font-mono">{row.cardOpens}</td>
                  <td className="py-1.5 font-mono">{row.intentClicks}</td>
                  <td className="py-1.5 font-mono">{row.declarations}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
