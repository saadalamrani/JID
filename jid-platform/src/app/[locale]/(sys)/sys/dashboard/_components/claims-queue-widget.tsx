'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/lib/i18n/navigation'
import type { PendingClaimPreview } from '@/types/sys-dashboard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type ClaimsQueueWidgetProps = {
  claims: PendingClaimPreview[]
}

function isSlaOverdue(slaDueAt: string): boolean {
  return new Date(slaDueAt).getTime() < Date.now()
}

/** Section 6 — top 5 pending claims by earliest SLA proxy (created_at ASC). */
export function ClaimsQueueWidget({ claims }: ClaimsQueueWidgetProps) {
  const t = useTranslations('sys.dashboard.claimsWidget')

  return (
    <Card className="border-jid-line bg-white">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="text-base">{t('title')}</CardTitle>
          <CardDescription>{t('subtitle')}</CardDescription>
        </div>
        <Link href="/sys/claims" className="text-sm font-medium text-jid-olive hover:underline">
          {t('viewAll')}
        </Link>
      </CardHeader>
      <CardContent>
        {claims.length === 0 ? (
          <p className="py-6 text-center text-sm text-jid-ink/50">{t('empty')}</p>
        ) : (
          <ul className="divide-y divide-jid-line">
            {claims.map((claim) => {
              const overdue = isSlaOverdue(claim.sla_due_at)
              return (
                <li key={claim.id} className="flex items-start justify-between gap-3 py-3 first:pt-0">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-jid-ink">{claim.company_name}</p>
                    <p className="truncate text-xs text-jid-ink/55">{claim.claimant_name}</p>
                  </div>
                  <div className="shrink-0 text-end">
                    <p
                      className={cn(
                        'text-xs font-medium',
                        overdue ? 'text-red-600' : 'text-jid-ink/60',
                      )}
                    >
                      {overdue ? t('overdue') : t('due')}
                    </p>
                    <p className="text-xs text-jid-ink/45">
                      {new Date(claim.sla_due_at).toLocaleDateString()}
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
