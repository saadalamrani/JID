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
    return <p className="text-sm text-jid-ink/60">{t('loading')}</p>
  }

  if (claims.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-jid-line p-8 text-center text-sm text-jid-ink/60">
        {t('empty')}
      </div>
    )
  }

  return (
    <ul className="divide-y divide-jid-line rounded-md border border-jid-line">
      {claims.map((claim) => {
        const overdue = hoursSince(claim.created_at) > SLA_HOURS

        return (
          <li key={claim.id}>
            <Link
              href={`/staff/claims/${claim.id}`}
              className="flex flex-col gap-2 p-4 transition-colors hover:bg-jid-beige/40 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium text-jid-ink">{claim.company_name}</p>
                <p className="text-sm text-jid-ink/70">
                  {claim.claimant_name}
                  {claim.claimant_title ? ` · ${claim.claimant_title}` : ''}
                </p>
                <p className="text-xs text-jid-ink/50" dir="ltr">
                  {claim.business_email}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'rounded-full px-2 py-1 text-xs font-medium',
                    overdue ? 'bg-red-100 text-red-700' : 'bg-jid-beige text-jid-ink/70',
                  )}
                >
                  {overdue ? t('overdue') : t('pending')}
                </span>
                <span className="text-xs text-jid-ink/50">
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
