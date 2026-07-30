'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { reviewCorrectionSuggestion } from '@/app/[locale]/(staff)/staff/directory/actions'
import type { CorrectionSuggestionRow } from '@/lib/staff/directory-queries'

type SuggestionsReviewListProps = {
  items: CorrectionSuggestionRow[]
}

function localizeReviewError(
  t: (key: string) => string,
  error: string,
): string {
  switch (error) {
    case 'already_decided':
      return t('errors.alreadyDecided')
    case 'directory_missing':
      return t('errors.directoryMissing')
    case 'field_not_allowed':
      return t('errors.fieldNotAllowed')
    case 'review_notes_required':
      return t('errors.reviewNotesRequired')
    case 'insufficient_privileges':
      return t('errors.insufficientPrivileges')
    default:
      return error
  }
}

export function SuggestionsReviewList({ items }: SuggestionsReviewListProps) {
  const t = useTranslations('staff.directory.suggestions')
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [pending, startTransition] = useTransition()
  const [decidedIds, setDecidedIds] = useState<Record<string, 'approved' | 'rejected'>>({})

  async function handleDecision(suggestionId: string, decision: 'approved' | 'rejected') {
    const result = await reviewCorrectionSuggestion({
      suggestionId,
      decision,
      reviewNotes: notes[suggestionId] ?? '',
    })
    if (!result.ok) {
      toast.error(localizeReviewError(t, result.error))
      if (result.error === 'already_decided') {
        setDecidedIds((prev) => ({ ...prev, [suggestionId]: decision }))
      }
      return
    }
    toast.success(t(`success.${decision}`))
    setDecidedIds((prev) => ({ ...prev, [suggestionId]: decision }))
    startTransition(() => {
      // Soft refresh — keep decided cards read-only until navigation reload.
      window.location.reload()
    })
  }

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">
        {t('empty')}
      </div>
    )
  }

  return (
    <ul className="flex flex-col gap-4">
      {items.map((item) => {
        const decided = decidedIds[item.id]
        const isReadOnly = item.status !== 'pending' || decided != null
        const statusLabel = decided ?? item.status

        return (
          <li
            key={item.id}
            className="rounded-lg border border-border bg-card p-4 sm:p-5"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h2 className="font-semibold text-foreground break-words">{item.directory_name}</h2>
                <p className="text-sm text-muted-foreground">
                  {t('field', { field: item.field_name })}
                </p>
              </div>
              <span className="w-fit rounded-full bg-background px-2 py-1 text-xs text-muted-foreground">
                {statusLabel}
              </span>
            </div>

            {isReadOnly ? (
              <p className="mt-3 text-sm text-muted-foreground" role="status">
                {t('alreadyDecided')}
              </p>
            ) : null}

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-md border border-border/80 p-3">
                <p className="text-xs font-medium text-muted-foreground">{t('current')}</p>
                <p className="mt-1 break-words text-sm text-foreground">{item.current_value ?? '—'}</p>
              </div>
              <div className="rounded-md border border-primary/20 bg-primary/5 p-3">
                <p className="text-xs font-medium text-muted-foreground">{t('suggested')}</p>
                <p className="mt-1 break-words text-sm text-foreground">{item.suggested_value}</p>
              </div>
            </div>

            {item.reason ? (
              <p className="mt-3 break-words text-sm text-muted-foreground">
                {t('reason')}: {item.reason}
              </p>
            ) : null}

            {!isReadOnly ? (
              <>
                <div className="mt-4 space-y-2">
                  <Label htmlFor={`notes-${item.id}`}>{t('reviewNotes')}</Label>
                  <textarea
                    id={`notes-${item.id}`}
                    rows={2}
                    value={notes[item.id] ?? ''}
                    onChange={(e) =>
                      setNotes((prev) => ({ ...prev, [item.id]: e.target.value }))
                    }
                    placeholder={t('reviewNotesPlaceholder')}
                    className="w-full rounded-md border border-border px-3 py-2 text-sm"
                  />
                </div>

                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  <Button
                    size="sm"
                    className="w-full sm:w-auto"
                    disabled={pending}
                    onClick={() => handleDecision(item.id, 'approved')}
                  >
                    {t('approve')}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full sm:w-auto"
                    disabled={pending}
                    onClick={() => handleDecision(item.id, 'rejected')}
                  >
                    {t('reject')}
                  </Button>
                </div>
              </>
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}
