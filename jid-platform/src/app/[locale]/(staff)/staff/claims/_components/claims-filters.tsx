'use client'

import type { ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { usePathname, useRouter } from '@/lib/i18n/navigation'
import { useSearchParams } from 'next/navigation'
import type { ClaimUrgencyFilter } from '@/lib/staff/claim-urgency'
import { getClaimUrgencyTier, matchesUrgencyFilter } from '@/lib/staff/claim-urgency'
import type { StaffQueueItemType } from '@/lib/staff/claims-queue'
import { cn } from '@/lib/utils'

export type ClaimsFilterState = {
  type: 'all' | StaffQueueItemType
  urgency: ClaimUrgencyFilter
  assigned: 'all' | 'unassigned' | 'assigned'
}

type ClaimsFiltersProps = {
  className?: string
}

function readFilter(
  searchParams: URLSearchParams,
  key: string,
  fallback: string,
): string {
  return searchParams.get(key) ?? fallback
}

/** Section 7.2 — URL-synced queue filters. */
export function ClaimsFilters({ className }: ClaimsFiltersProps) {
  const t = useTranslations('staff.claims.filters')
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const filters: ClaimsFilterState = {
    type: readFilter(searchParams, 'type', 'all') as ClaimsFilterState['type'],
    urgency: readFilter(searchParams, 'urgency', 'all') as ClaimsFilterState['urgency'],
    assigned: readFilter(searchParams, 'assigned', 'all') as ClaimsFilterState['assigned'],
  }

  function update(partial: Partial<ClaimsFilterState>) {
    const next = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries({ ...filters, ...partial })) {
      if (value === 'all') {
        next.delete(key)
      } else {
        next.set(key, value)
      }
    }
    const query = next.toString()
    router.replace(query ? `${pathname}?${query}` : pathname)
  }

  return (
    <div className={cn('flex flex-wrap gap-4', className)}>
      <FilterGroup label={t('type')}>
        {(['all', 'business', 'university', 'mentor'] as const).map((value) => (
          <FilterButton
            key={value}
            active={filters.type === value}
            onClick={() => update({ type: value })}
          >
            {t(`typeOptions.${value}`)}
          </FilterButton>
        ))}
      </FilterGroup>

      <FilterGroup label={t('urgency')}>
        {(['all', 'overdue', 'critical', 'normal'] as const).map((value) => (
          <FilterButton
            key={value}
            active={filters.urgency === value}
            onClick={() => update({ urgency: value })}
          >
            {t(`urgencyOptions.${value}`)}
          </FilterButton>
        ))}
      </FilterGroup>

      <FilterGroup label={t('assigned')}>
        {(['all', 'unassigned', 'assigned'] as const).map((value) => (
          <FilterButton
            key={value}
            active={filters.assigned === value}
            onClick={() => update({ assigned: value })}
          >
            {t(`assignedOptions.${value}`)}
          </FilterButton>
        ))}
      </FilterGroup>
    </div>
  )
}

function FilterGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  )
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
        active
          ? 'border-primary bg-primary/10 text-primary'
          : 'border-border bg-card text-muted-foreground hover:bg-background/50',
      )}
    >
      {children}
    </button>
  )
}

export function filterClaimsItems<T extends {
  queueType: StaffQueueItemType
  slaDueAt: string
  assignedStaffId: string | null
}>(
  items: T[],
  filters: ClaimsFilterState,
): T[] {
  return items.filter((item) => {
    if (filters.type !== 'all' && item.queueType !== filters.type) return false

    const tier = getClaimUrgencyTier(item.slaDueAt)
    if (!matchesUrgencyFilter(tier, filters.urgency)) return false

    if (filters.assigned === 'unassigned' && item.assignedStaffId) return false
    if (filters.assigned === 'assigned' && !item.assignedStaffId) return false

    return true
  })
}
