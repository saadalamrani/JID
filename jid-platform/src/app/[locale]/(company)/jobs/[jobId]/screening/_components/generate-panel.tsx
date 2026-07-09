'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Sparkles, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { invokeSsisGenerate } from '@/lib/ssis/client'
import type { SsisGenerationContext } from '@/lib/ssis/types'
import { SSIS_STATIC_NOTE_AR } from '@/lib/ssis/constants'
import { cn } from '@/lib/utils'

type GeneratePanelProps = {
  jobId: string
  context?: SsisGenerationContext | null
  onGenerated: () => void
  className?: string
}

export function GeneratePanel({ jobId, context, onGenerated, className }: GeneratePanelProps) {
  const t = useTranslations('company.ssis')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleGenerate() {
    setLoading(true)
    setError(null)
    try {
      await invokeSsisGenerate(jobId)
      onGenerated()
    } catch (e) {
      setError(e instanceof Error ? e.message : t('generateError'))
    } finally {
      setLoading(false)
    }
  }

  const ctx = context
  const summary = ctx
    ? `${ctx.company.name_ar} · ${ctx.company.sector || '—'} · ${ctx.job.title_ar}`
    : t('contextPending')

  return (
    <section className={cn('rounded-xl border border-border bg-card p-6', className)}>
      <div className="flex items-start gap-3">
        <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-jid-olive" aria-hidden />
        <div className="min-w-0 flex-1">
          <h2 className="font-arabic text-lg font-semibold text-foreground">{t('generateTitle')}</h2>
          <p className="mt-1 font-arabic text-sm text-muted-foreground">{t('generateSubtitle')}</p>
          <p className="mt-3 rounded-lg bg-muted/50 px-3 py-2 font-arabic text-sm text-foreground">
            {t('contextLabel')}: {summary}
          </p>
          <p className="mt-2 font-arabic text-xs text-muted-foreground">{SSIS_STATIC_NOTE_AR}</p>
          {error ? (
            <p className="mt-2 font-arabic text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          <Button
            type="button"
            className="mt-4 font-arabic"
            onClick={() => void handleGenerate()}
            disabled={loading}
          >
            {loading ? <Loader2 className="ms-2 h-4 w-4 animate-spin" /> : null}
            {t('generateCta')}
          </Button>
        </div>
      </div>
    </section>
  )
}
