'use client'

import { Suspense, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { ClaimCard } from './claim-card'
import {
  ClaimsFilters,
  filterClaimsItems,
  type ClaimsFilterState,
} from './claims-filters'
import type { StaffClaimsQueueItem } from '@/lib/staff/claims-queue'

type ClaimsListProps = {
  items: StaffClaimsQueueItem[]
  showAssignment?: boolean
}

function readFilter(searchParams: URLSearchParams, key: string, fallback: string): string {
  return searchParams.get(key) ?? fallback
}

function ClaimsListContent({ items, showAssignment = true }: ClaimsListProps) {
  const t = useTranslations('staff.claims.list')
  const searchParams = useSearchParams()

  const filters: ClaimsFilterState = useMemo(
    () => ({
      type: readFilter(searchParams, 'type', 'all') as ClaimsFilterState['type'],
      urgency: readFilter(searchParams, 'urgency', 'all') as ClaimsFilterState['urgency'],
      assigned: readFilter(searchParams, 'assigned', 'all') as ClaimsFilterState['assigned'],
    }),
    [searchParams],
  )

  const filtered = useMemo(() => filterClaimsItems(items, filters), [items, filters])

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
          <ClaimCard item={item} showAssignment={showAssignment} />
        </li>
      ))}
    </ul>
  )
}

/** Section 7.2 — filtered claim cards list. */
export function ClaimsList(props: ClaimsListProps) {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">…</p>}>
      <ClaimsListContent {...props} />
    </Suspense>
  )
}

export function ClaimsListWithFilters(props: ClaimsListProps) {
  return (
    <div className="space-y-6">
      <Suspense fallback={null}>
        <ClaimsFilters />
      </Suspense>
      <ClaimsList {...props} />
    </div>
  )
}
