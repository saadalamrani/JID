'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/lib/i18n/navigation'
import type { ClaimQueueItem } from '@/lib/staff/claims'
import { SLA_HOURS, hoursSince } from '@/lib/entity/claims'
import { cn } from '@/lib/utils'

type ClaimsListProps = {
  claims: ClaimQueueItem[]
  loading?: boolean
}

export function ClaimsList({ claims, loading = false }: ClaimsListProps) {
  const t = useTranslations('staff.claimsQueue.list')

  if (loading) {
    return <p className="text-sm text-muted-foreground">{t('loading')}</p>
  }

  if (claims.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        {t('empty')}
      </div>
    )
  }

  return (
    <ul className="divide-y divide-border rounded-md border border-border">
      {claims.map((claim) => {
        const overdue = hoursSince(claim.created_at) > SLA_HOURS

        return (
          <li key={claim.id}>
            <Link
              href={`/staff/verification/${claim.id}`}
              className="flex flex-col gap-2 p-4 transition-colors hover:bg-background/40 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium text-foreground">{claim.company_name}</p>
                <p className="text-sm text-muted-foreground">
                  {claim.claimant_name}
                  {claim.claimant_title ? ` · ${claim.claimant_title}` : ''}
                </p>
                <p className="text-xs text-muted-foreground" dir="ltr">
                  {claim.business_email}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'rounded-full px-2 py-1 text-xs font-medium',
                    overdue ? 'bg-destructive/10 text-destructive' : 'bg-background text-muted-foreground',
                  )}
                >
                  {overdue ? t('overdue') : t('pending')}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(claim.created_at).toLocaleString('ar-SA')}
                </span>
              </div>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
