'use client'

import { CheckCircle2, Circle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

export type ChecklistItemDef = {
  key: string
  label: string
  hint?: string
}

type ChecklistPanelProps = {
  items: ChecklistItemDef[]
  value: Record<string, boolean>
  onChange: (next: Record<string, boolean>) => void
  disabled?: boolean
  translationNamespace?: 'staff.claimReview.workspace.checklist' | 'staff.mentorApplications.workspace.checklist'
}

export function isChecklistComplete(value: Record<string, boolean>, keys: string[]): boolean {
  return keys.every((key) => value[key])
}

/** Section 7.6 — sticky checklist with progress bar; all items required before approve. */
export function ChecklistPanel({
  items,
  value,
  onChange,
  disabled = false,
  translationNamespace = 'staff.claimReview.workspace.checklist',
}: ChecklistPanelProps) {
  const t = useTranslations(translationNamespace)
  const completed = items.filter((item) => value[item.key]).length
  const percent = items.length > 0 ? Math.round((completed / items.length) * 100) : 0

  function toggle(key: string) {
    if (disabled) return
    onChange({ ...value, [key]: !value[key] })
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-1 flex items-center justify-between text-xs text-jid-ink/60">
          <span>{t('progress', { completed, total: items.length })}</span>
          <span>{percent}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-jid-beige/80">
          <div
            className="h-full rounded-full bg-jid-olive transition-all"
            style={{ width: `${percent}%` }}
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      </div>

      <ul className="space-y-2">
        {items.map((item) => {
          const checked = Boolean(value[item.key])
          const Icon = checked ? CheckCircle2 : Circle

          return (
            <li key={item.key}>
              <button
                type="button"
                disabled={disabled}
                onClick={() => toggle(item.key)}
                className={cn(
                  'flex w-full items-start gap-3 rounded-md border p-3 text-start transition-colors',
                  checked ? 'border-jid-olive/40 bg-jid-beige/60' : 'border-jid-line bg-white',
                  disabled && 'cursor-not-allowed opacity-60',
                )}
              >
                <Icon
                  className={cn(
                    'mt-0.5 h-5 w-5 shrink-0',
                    checked ? 'text-jid-olive' : 'text-jid-ink/30',
                  )}
                />
                <div>
                  <p className="text-sm font-medium text-jid-ink">{item.label}</p>
                  {item.hint ? <p className="mt-1 text-xs text-jid-ink/60">{item.hint}</p> : null}
                </div>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
