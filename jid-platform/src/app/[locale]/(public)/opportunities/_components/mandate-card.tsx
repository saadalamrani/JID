'use client'

import { useTranslations } from 'next-intl'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import type { SearchMandate } from '@/types/abhathli'

type MandateCardProps = {
  mandate: SearchMandate
  onToggleActive: (mandateId: string, active: boolean) => void
  pending?: boolean
  className?: string
}

export function MandateCard({ mandate, onToggleActive, pending = false, className }: MandateCardProps) {
  const t = useTranslations('opportunities.abhathli.mandate')

  return (
    <div className={cn('rounded-lg border border-border/60 bg-card/80 px-3 py-2', className)}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-arabic text-sm font-medium text-foreground">{mandate.name}</p>
          <p className="font-mono text-[11px] text-muted-foreground">
            {mandate.lastRunAt
              ? t('lastRun', { time: new Date(mandate.lastRunAt).toLocaleString('ar-SA') })
              : t('neverRun')}
          </p>
        </div>
        <Switch
          checked={mandate.isActive}
          disabled={pending}
          onCheckedChange={(checked) => onToggleActive(mandate.id, checked)}
          aria-label={t('toggleAria', { name: mandate.name })}
        />
      </div>
    </div>
  )
}
