'use client'

import { useTranslations } from 'next-intl'
import type { PendingVerificationPreview } from '@/types/sys-dashboard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type VerificationQueueWidgetProps = {
  items: PendingVerificationPreview[]
}

function isSlaOverdue(slaDueAt: string): boolean {
  return new Date(slaDueAt).getTime() < Date.now()
}

/**
 * Section 6 — top 5 pending verification requests by earliest SLA proxy (created_at ASC).
 *
 * JID-102D1: this widget previously linked to /sys/claims, a route that has
 * never existed in src/app — there is no system-level verification queue
 * page to send staff to yet. The "view all" affordance was removed rather
 * than invented; adding a real destination is a product decision outside
 * this cleanup's scope. Staff can still work the live queue at
 * /staff/verification.
 */
export function VerificationQueueWidget({ items }: VerificationQueueWidgetProps) {
  const t = useTranslations('sys.dashboard.claimsWidget')

  return (
    <Card className="border-border bg-card">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="text-base">{t('title')}</CardTitle>
          <CardDescription>{t('subtitle')}</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">{t('empty')}</p>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((item) => {
              const overdue = isSlaOverdue(item.sla_due_at)
              return (
                <li key={item.id} className="flex items-start justify-between gap-3 py-3 first:pt-0">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{item.company_name}</p>
                    <p className="truncate text-xs text-muted-foreground">{item.claimant_name}</p>
                  </div>
                  <div className="shrink-0 text-end">
                    <p
                      className={cn(
                        'text-xs font-medium',
                        overdue ? 'text-destructive' : 'text-muted-foreground',
                      )}
                    >
                      {overdue ? t('overdue') : t('due')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(item.sla_due_at).toLocaleDateString()}
                    </p>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
