'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { recordSsisOutcomeAction } from '@/lib/ssis/actions'
import { SSIS_RECOMMENDATION_LABELS_AR } from '@/lib/ssis/constants'
import type { SsisResultRow } from '@/lib/ssis/types'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type ResultsBoardProps = {
  jobId: string
  results: SsisResultRow[]
  passThreshold: number
  onRefresh: () => void
}

const RECOMMENDATION_STYLES = {
  advance: 'bg-emerald-50 text-emerald-800',
  review: 'bg-amber-50 text-amber-900',
  decline_recommend: 'bg-red-50 text-red-800',
} as const

export function ResultsBoard({ jobId, results, passThreshold, onRefresh }: ResultsBoardProps) {
  const t = useTranslations('company.ssis')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  async function handleOutcome(invitationId: string, action: 'advance' | 'decline') {
    setBusy(invitationId)
    try {
      await recordSsisOutcomeAction(invitationId, jobId, action)
      onRefresh()
    } finally {
      setBusy(null)
    }
  }

  if (results.length === 0) {
    return (
      <p className="font-arabic text-sm text-muted-foreground">{t('noResults')}</p>
    )
  }

  return (
    <section className="space-y-3">
      <header>
        <h2 className="font-arabic text-lg font-semibold">{t('resultsTitle')}</h2>
        <p className="font-arabic text-sm text-muted-foreground">
          {t('thresholdLabel', { threshold: passThreshold })}
        </p>
      </header>

      <ul className="space-y-3">
        {results
          .slice()
          .sort((a, b) => (b.composite_score ?? -1) - (a.composite_score ?? -1))
          .map((row) => (
            <li key={row.invitation_id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-arabic text-sm font-semibold">
                    {row.applicant_name ?? t('anonymousApplicant')}
                  </p>
                  <p className="font-arabic text-xs text-muted-foreground">{row.status}</p>
                </div>
                <div className="text-end">
                  {row.composite_score != null ? (
                    <p className="font-arabic text-lg font-bold tabular-nums">
                      {row.composite_score.toFixed(1)}
                    </p>
                  ) : (
                    <p className="font-arabic text-xs text-muted-foreground">{t('pendingEval')}</p>
                  )}
                  {row.recommendation ? (
                    <span
                      className={cn(
                        'mt-1 inline-block rounded-full px-2 py-0.5 font-arabic text-[10px] font-medium',
                        RECOMMENDATION_STYLES[row.recommendation],
                      )}
                    >
                      {SSIS_RECOMMENDATION_LABELS_AR[row.recommendation]}
                    </span>
                  ) : null}
                </div>
              </div>

              {row.evaluation ? (
                <>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${Math.min(100, row.composite_score ?? 0)}%` }}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mt-2 font-arabic text-xs"
                    onClick={() =>
                      setExpanded((id) => (id === row.invitation_id ? null : row.invitation_id))
                    }
                  >
                    {expanded === row.invitation_id ? t('hideBreakdown') : t('showBreakdown')}
                  </Button>
                  {expanded === row.invitation_id ? (
                    <div className="mt-2 space-y-2 rounded-lg bg-muted/40 p-3">
                      {row.evaluation.per_block.map((block) => (
                        <div key={block.block_id}>
                          <p className="font-arabic text-xs font-medium">
                            {t('blockScore', { score: block.score.toFixed(1) })}
                          </p>
                          <ul className="mt-1 space-y-1">
                            {block.per_criterion.map((c, i) => (
                              <li key={i} className="font-arabic text-[11px] text-muted-foreground">
                                <span className="font-medium text-foreground">{c.criterion}</span>
                                {' — '}
                                {c.score.toFixed(0)} · «{c.evidence_excerpt}»
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  ) : null}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      className="font-arabic"
                      disabled={busy === row.invitation_id}
                      onClick={() => void handleOutcome(row.invitation_id, 'advance')}
                    >
                      {t('advanceAction')}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="font-arabic"
                      disabled={busy === row.invitation_id}
                      onClick={() => void handleOutcome(row.invitation_id, 'decline')}
                    >
                      {t('declineAction')}
                    </Button>
                  </div>
                </>
              ) : null}
            </li>
          ))}
      </ul>
    </section>
  )
}
