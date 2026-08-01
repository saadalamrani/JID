'use client'

import type { ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { usePathname, useRouter } from '@/lib/i18n/navigation'
import { useSearchParams } from 'next/navigation'
import type { VerificationUrgencyFilter } from '@/lib/staff/verification-urgency'
import { getVerificationUrgencyTier, matchesUrgencyFilter } from '@/lib/staff/verification-urgency'
import type { StaffQueueItemType } from '@/lib/staff/claims-queue'
import { cn } from '@/lib/utils'

export type VerificationFilterState = {
  type: 'all' | StaffQueueItemType
  urgency: VerificationUrgencyFilter
  assigned: 'all' | 'unassigned' | 'assigned'
}

type VerificationFiltersProps = {
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
export function VerificationFilters({ className }: VerificationFiltersProps) {
  const t = useTranslations('staff.claims.filters')
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const filters: VerificationFilterState = {
    type: readFilter(searchParams, 'type', 'all') as VerificationFilterState['type'],
    urgency: readFilter(searchParams, 'urgency', 'all') as VerificationFilterState['urgency'],
    assigned: readFilter(searchParams, 'assigned', 'all') as VerificationFilterState['assigned'],
  }

  function update(partial: Partial<VerificationFilterState>) {
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

  const filterGroups = (
    <>
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
    </>
  )

  return (
    <div className={cn('space-y-3', className)}>
      <details className="rounded-lg border border-border bg-card p-3 sm:hidden">
        <summary className="cursor-pointer text-sm font-medium text-jid-olive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jid-gold">
          {t('type')} · {t('urgency')} · {t('assigned')}
        </summary>
        <div className="mt-3 flex flex-col gap-4">{filterGroups}</div>
      </details>
      <div className="hidden flex-wrap gap-4 sm:flex">{filterGroups}</div>
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
        'rounded-md border px-3 py-1.5 text-xs font-medium transition-colors',
        active
          ? 'border-jid-olive bg-jid-olive text-jid-beige focus-visible:ring-2 focus-visible:ring-jid-gold'
          : 'border-border bg-card text-muted-foreground hover:bg-jid-beige/50 focus-visible:ring-2 focus-visible:ring-jid-gold/50',
      )}
    >
      {children}
    </button>
  )
}

export function filterVerificationItems<T extends {
  queueType: StaffQueueItemType
  slaDueAt: string
  assignedStaffId: string | null
}>(
  items: T[],
  filters: VerificationFilterState,
): T[] {
  return items.filter((item) => {
    if (filters.type !== 'all' && item.queueType !== filters.type) return false

    const tier = getVerificationUrgencyTier(item.slaDueAt)
    if (!matchesUrgencyFilter(tier, filters.urgency)) return false

    if (filters.assigned === 'unassigned' && item.assignedStaffId) return false
    if (filters.assigned === 'assigned' && !item.assignedStaffId) return false

    return true
  })
}
