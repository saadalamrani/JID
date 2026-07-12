'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/lib/i18n/navigation'
import type { StaffDashboardClaimRow } from '@/lib/staff/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type UnassignedQueueProps = {
  claims: StaffDashboardClaimRow[]
}

/** Section 6.1 — read-only unassigned claims queue (top 5 by created_at). */
export function UnassignedQueue({ claims }: UnassignedQueueProps) {
  const t = useTranslations('staff.dashboard.unassignedQueue')

  return (
    <Card className="border-border bg-card">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="text-base">{t('title')}</CardTitle>
          <CardDescription>{t('subtitle')}</CardDescription>
        </div>
        <Link href="/staff/verification" className="text-sm font-medium text-primary hover:underline">
          {t('viewAll')}
        </Link>
      </CardHeader>
      <CardContent>
        {claims.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">{t('empty')}</p>
        ) : (
          <ul className="divide-y divide-border">
            {claims.map((claim) => (
              <li key={claim.id} className="flex items-start justify-between gap-3 py-3 first:pt-0">
                <div className="min-w-0">
                  <Link
                    href={`/staff/verification/${claim.id}`}
                    className="truncate font-medium text-foreground hover:text-primary hover:underline"
                  >
                    {claim.company_name}
                  </Link>
                  <p className="truncate text-xs text-muted-foreground">{claim.claimant_name}</p>
                </div>
                <p className="shrink-0 text-xs text-muted-foreground">
                  {new Date(claim.created_at).toLocaleDateString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
