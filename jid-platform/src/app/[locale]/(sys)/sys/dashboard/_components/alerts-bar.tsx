'use client'

import { AlertTriangle, ShieldAlert, Zap } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { DASHBOARD_ALERT_THRESHOLDS } from '@/lib/sys/dashboard-constants'
import { cn } from '@/lib/utils'

type AlertsBarProps = {
  overdueClaims: number
  maintenanceMode: boolean
  maintenanceMessage: string | null
  errorEventsLastHour: number
}

type AlertItem = {
  id: string
  severity: 'warning' | 'critical'
  message: string
  icon: typeof AlertTriangle
}

/** Section 6 — conditional alerts for SLA breaches, maintenance, and error spikes. */
export function AlertsBar({
  overdueClaims,
  maintenanceMode,
  maintenanceMessage,
  errorEventsLastHour,
}: AlertsBarProps) {
  const t = useTranslations('sys.dashboard.alerts')

  const alerts: AlertItem[] = []

  if (overdueClaims > 0) {
    alerts.push({
      id: 'overdue-claims',
      severity: overdueClaims >= 5 ? 'critical' : 'warning',
      message: t('overdueClaims', { count: overdueClaims }),
      icon: AlertTriangle,
    })
  }

  if (maintenanceMode) {
    alerts.push({
      id: 'maintenance',
      severity: 'critical',
      message: maintenanceMessage
        ? t('maintenanceWithMessage', { message: maintenanceMessage })
        : t('maintenance'),
      icon: ShieldAlert,
    })
  }

  if (errorEventsLastHour >= DASHBOARD_ALERT_THRESHOLDS.highErrorRate) {
    alerts.push({
      id: 'error-rate',
      severity: 'warning',
      message: t('highErrorRate', {
        count: errorEventsLastHour,
        threshold: DASHBOARD_ALERT_THRESHOLDS.highErrorRate,
      }),
      icon: Zap,
    })
  }

  if (alerts.length === 0) return null

  return (
    <div className="space-y-2" role="region" aria-label={t('regionLabel')}>
      {alerts.map((alert) => {
        const Icon = alert.icon
        return (
          <div
            key={alert.id}
            role="alert"
            className={cn(
              'flex items-start gap-3 rounded-lg border px-4 py-3 text-sm',
              alert.severity === 'critical'
                ? 'border-destructive/30 bg-destructive/10 text-destructive'
                : 'border-sem-warning/30 bg-sem-warning/10 text-sem-warning',
            )}
          >
            <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>{alert.message}</span>
          </div>
        )
      })}
    </div>
  )
}
