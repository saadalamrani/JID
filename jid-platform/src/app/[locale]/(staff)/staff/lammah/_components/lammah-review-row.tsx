'use client'

import { useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { ExternalLink, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LAMMAH_EXTERNAL_SOURCE_NOTE_AR } from '@/lib/lammah/constants'
import type { LammahModerationRow } from '@/types/lammah'
import {
  approveLammahOpportunity,
  deleteLammahOpportunity,
  hideLammahOpportunity,
} from '../actions'

type LammahReviewRowProps = {
  row: LammahModerationRow
}

export function LammahReviewRow({ row }: LammahReviewRowProps) {
  const t = useTranslations('staff.lammah.review')
  const [pending, startTransition] = useTransition()
  const title = row.titleAr || row.titleEn || '—'

  const run = (action: () => Promise<{ ok: boolean; error?: string }>) => {
    startTransition(async () => {
      const result = await action()
      if (!result.ok && result.error) {
        window.alert(result.error)
      }
    })
  }

  return (
    <article className="rounded-lg border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-arabic text-base font-semibold text-foreground">{title}</h3>
          <p className="mt-1 font-arabic text-sm text-muted-foreground">{row.companyNameRaw}</p>
          <p className="mt-1 font-arabic text-xs text-muted-foreground">
            {t('meta', {
              confidence: row.extractionConfidence.toFixed(2),
              source: row.sourceName,
              sector: row.sector,
              region: row.region,
            })}
          </p>
          <p className="mt-2 rounded-md border border-border/60 bg-muted/40 px-2 py-1.5 font-arabic text-xs text-muted-foreground">
            {LAMMAH_EXTERNAL_SOURCE_NOTE_AR}
          </p>
        </div>
        <a
          href={row.externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-arabic text-sm text-primary hover:underline"
        >
          <ExternalLink className="h-4 w-4" aria-hidden />
          {t('openSource')}
        </a>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          disabled={pending}
          onClick={() => run(() => approveLammahOpportunity(row.id))}
        >
          {t('approve')}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => run(() => hideLammahOpportunity({ opportunityId: row.id, reason: 'staff_review' }))}
        >
          {t('keepHidden')}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="destructive"
          disabled={pending}
          onClick={() => run(() => deleteLammahOpportunity(row.id))}
        >
          <Trash2 className="h-4 w-4" aria-hidden />
          {t('delete')}
        </Button>
      </div>
    </article>
  )
}
