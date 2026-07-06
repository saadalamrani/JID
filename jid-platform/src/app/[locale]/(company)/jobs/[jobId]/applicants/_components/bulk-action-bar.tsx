'use client'

import { Button } from '@/components/ui/button'
import type { TriageBulkAction } from '@/types/application'
import { BulkActionIcon } from './status-badge'
import { cn } from '@/lib/utils'

const ACTION_LABELS: Record<TriageBulkAction, string> = {
  accept: 'قبول',
  reject: 'رفض',
  interview: 'مقابلة',
}

type BulkActionBarProps = {
  totalCount: number
  selectedIds: string[]
  onToggleSelectAll: (checked: boolean) => void
  onBulkAction: (action: TriageBulkAction) => void
  disabled?: boolean
}

/** Section 5.2 — bulk select + accept/reject/interview with count. */
export function BulkActionBar({
  totalCount,
  selectedIds,
  onToggleSelectAll,
  onBulkAction,
  disabled = false,
}: BulkActionBarProps) {
  const selectedCount = selectedIds.length
  const allSelected = totalCount > 0 && selectedCount === totalCount
  const indeterminate = selectedCount > 0 && selectedCount < totalCount

  return (
    <div
      className="flex flex-col gap-3 rounded-xl border border-jid-line bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
      aria-label="إجراءات جماعية"
    >
      <label className="inline-flex items-center gap-2 font-arabic text-sm text-jid-ink">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-jid-line text-jid-olive focus:ring-jid-olive"
          checked={allSelected}
          ref={(element) => {
            if (element) element.indeterminate = indeterminate
          }}
          disabled={disabled || totalCount === 0}
          onChange={(event) => onToggleSelectAll(event.target.checked)}
          aria-label="تحديد الكل"
        />
        <span>
          {selectedCount > 0
            ? `محدد ${selectedCount} من ${totalCount}`
            : `تحديد الكل (${totalCount})`}
        </span>
      </label>

      <div className="flex flex-wrap gap-2">
        {(['accept', 'interview', 'reject'] as const).map((action) => (
          <Button
            key={action}
            type="button"
            size="sm"
            variant={action === 'reject' ? 'outline' : 'default'}
            disabled={disabled || selectedCount === 0}
            onClick={() => onBulkAction(action)}
            className={cn(
              'font-arabic gap-1.5',
              action === 'accept' && 'bg-jid-olive hover:bg-jid-olive/90',
              action === 'interview' && 'bg-jid-gold text-jid-ink hover:bg-jid-gold/90',
              action === 'reject' && 'border-red-200 text-red-700 hover:bg-red-50',
            )}
          >
            <BulkActionIcon action={action} />
            {ACTION_LABELS[action]}
            {selectedCount > 0 ? ` (${selectedCount})` : ''}
          </Button>
        ))}
      </div>
    </div>
  )
}
