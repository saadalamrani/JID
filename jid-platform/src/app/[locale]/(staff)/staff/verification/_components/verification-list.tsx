'use client'

import { Suspense, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { VerificationCard } from './verification-card'
import {
  VerificationFilters,
  filterVerificationItems,
  type VerificationFilterState,
} from './verification-filters'
import type { StaffClaimsQueueItem } from '@/lib/staff/claims-queue'

type VerificationListProps = {
  items: StaffClaimsQueueItem[]
  showAssignment?: boolean
}

function readFilter(searchParams: URLSearchParams, key: string, fallback: string): string {
  return searchParams.get(key) ?? fallback
}

function VerificationListContent({ items, showAssignment = true }: VerificationListProps) {
  const t = useTranslations('staff.claims.list')
  const searchParams = useSearchParams()

  const filters: VerificationFilterState = useMemo(
    () => ({
      type: readFilter(searchParams, 'type', 'all') as VerificationFilterState['type'],
      urgency: readFilter(searchParams, 'urgency', 'all') as VerificationFilterState['urgency'],
      assigned: readFilter(searchParams, 'assigned', 'all') as VerificationFilterState['assigned'],
    }),
    [searchParams],
  )

  const filtered = useMemo(() => filterVerificationItems(items, filters), [items, filters])

  if (filtered.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        {t('empty')}
      </div>
    )
  }

  return (
    <ul className="space-y-3">
      {filtered.map((item) => (
        <li key={`${item.queueType}-${item.id}`}>
          <VerificationCard item={item} showAssignment={showAssignment} />
        </li>
      ))}
    </ul>
  )
}

/** Section 7.2 — filtered verification cards list. */
export function VerificationList(props: VerificationListProps) {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">…</p>}>
      <VerificationListContent {...props} />
    </Suspense>
  )
}

export function VerificationListWithFilters(props: VerificationListProps) {
  return (
    <div className="space-y-6">
      <Suspense fallback={null}>
        <VerificationFilters />
      </Suspense>
      <VerificationList {...props} />
    </div>
  )
}
