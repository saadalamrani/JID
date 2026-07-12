'use client'

import { useTranslations } from 'next-intl'
import { ClaimCard } from '../../claims/_components/claim-card'
import type { StaffClaimsQueueItem } from '@/lib/staff/claims-queue'

type VerificationKanbanProps = {
  pending: StaffClaimsQueueItem[]
  overdue: StaffClaimsQueueItem[]
  completedToday: StaffClaimsQueueItem[]
}

function KanbanColumn({
  title,
  items,
  emptyLabel,
}: {
  title: string
  items: StaffClaimsQueueItem[]
  emptyLabel: string
}) {
  return (
    <div className="flex min-h-[12rem] flex-col rounded-lg border border-border bg-card">
      <div className="border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground">{items.length}</p>
      </div>
      <ul className="flex-1 space-y-2 overflow-y-auto p-3">
        {items.length === 0 ? (
          <li className="py-6 text-center text-xs text-muted-foreground">{emptyLabel}</li>
        ) : (
          items.map((item) => (
            <li key={item.id}>
              <ClaimCard item={item} showAssignment />
            </li>
          ))
        )}
      </ul>
    </div>
  )
}

/** P-108 — Kanban columns: pending / overdue-SLA / completed-today. */
export function VerificationKanban({ pending, overdue, completedToday }: VerificationKanbanProps) {
  const t = useTranslations('staff.verification.kanban')

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <KanbanColumn title={t('pending')} items={pending} emptyLabel={t('empty')} />
      <KanbanColumn title={t('overdue')} items={overdue} emptyLabel={t('empty')} />
      <KanbanColumn title={t('completedToday')} items={completedToday} emptyLabel={t('empty')} />
    </div>
  )
}
