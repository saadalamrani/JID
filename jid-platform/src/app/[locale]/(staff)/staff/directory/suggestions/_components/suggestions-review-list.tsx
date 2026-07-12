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

export function SuggestionsReviewList({ items }: SuggestionsReviewListProps) {
  const t = useTranslations('staff.directory.suggestions')
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [pending, startTransition] = useTransition()

  async function handleDecision(suggestionId: string, decision: 'approved' | 'rejected') {
    const result = await reviewCorrectionSuggestion({
      suggestionId,
      decision,
      reviewNotes: notes[suggestionId] ?? '',
    })
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    toast.success(t(`success.${decision}`))
    startTransition(() => window.location.reload())
  }

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">
        {t('empty')}
      </div>
    )
  }

  return (
    <ul className="space-y-4">
      {items.map((item) => (
        <li key={item.id} className="rounded-lg border border-border bg-card p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-semibold text-foreground">{item.directory_name}</h2>
              <p className="text-sm text-muted-foreground">
                {t('field', { field: item.field_name })}
              </p>
            </div>
            <span className="rounded-full bg-background px-2 py-1 text-xs text-muted-foreground">
              {item.status}
            </span>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-md border border-border/80 p-3">
              <p className="text-xs font-medium text-muted-foreground">{t('current')}</p>
              <p className="mt-1 text-sm text-foreground">{item.current_value ?? '—'}</p>
            </div>
            <div className="rounded-md border border-primary/20 bg-primary/5 p-3">
              <p className="text-xs font-medium text-muted-foreground">{t('suggested')}</p>
              <p className="mt-1 text-sm text-foreground">{item.suggested_value}</p>
            </div>
          </div>

          {item.reason ? (
            <p className="mt-3 text-sm text-muted-foreground">
              {t('reason')}: {item.reason}
            </p>
          ) : null}

          <div className="mt-4 space-y-2">
            <Label htmlFor={`notes-${item.id}`}>{t('reviewNotes')}</Label>
            <textarea
              id={`notes-${item.id}`}
              rows={2}
              value={notes[item.id] ?? ''}
              onChange={(e) => setNotes((prev) => ({ ...prev, [item.id]: e.target.value }))}
              placeholder={t('reviewNotesPlaceholder')}
              className="w-full rounded-md border border-border px-3 py-2 text-sm"
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              size="sm"
              disabled={pending}
              onClick={() => handleDecision(item.id, 'approved')}
            >
              {t('approve')}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={() => handleDecision(item.id, 'rejected')}
            >
              {t('reject')}
            </Button>
          </div>
        </li>
      ))}
    </ul>
  )
}
