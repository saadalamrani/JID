'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { RefreshCw, Check, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  acknowledgeSsisPreviewAction,
  approveSsisScreeningAction,
  updateSsisBlockAction,
} from '@/lib/ssis/actions'
import { invokeSsisRegenerateBlock } from '@/lib/ssis/client'
import type { SsisBlock, SsisScreening } from '@/lib/ssis/types'
import { CandidatePreview } from './candidate-preview'
import { cn } from '@/lib/utils'

type ScreeningBuilderProps = {
  jobId: string
  screening: SsisScreening
  onRefresh: () => void
}

export function ScreeningBuilder({ jobId, screening, onRefresh }: ScreeningBuilderProps) {
  const t = useTranslations('company.ssis')
  const blocks = screening.blocks ?? []
  const [showPreview, setShowPreview] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const previewAcked = Boolean(screening.preview_acknowledged_at)
  const canApprove = previewAcked && screening.status !== 'active'

  async function handleSaveBlock(block: SsisBlock, prompt: string) {
    setBusy(block.id)
    setError(null)
    try {
      await updateSsisBlockAction(block.id, jobId, {
        prompt_ar: prompt,
        rubric: block.rubric,
      })
      onRefresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : t('saveError'))
    } finally {
      setBusy(null)
    }
  }

  async function handleRegenerate(blockId: string) {
    setBusy(blockId)
    setError(null)
    try {
      await invokeSsisRegenerateBlock(screening.id, blockId)
      onRefresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : t('regenerateError'))
    } finally {
      setBusy(null)
    }
  }

  async function handleAcknowledgePreview() {
    setBusy('preview')
    setError(null)
    try {
      await acknowledgeSsisPreviewAction(screening.id, jobId)
      onRefresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : t('previewError'))
    } finally {
      setBusy(null)
    }
  }

  async function handleApprove() {
    setBusy('approve')
    setError(null)
    try {
      await approveSsisScreeningAction(screening.id, jobId)
      onRefresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : t('approveError'))
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-arabic text-lg font-semibold">{t('builderTitle')}</h2>
          <p className="font-arabic text-sm text-muted-foreground">{t('builderSubtitle')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="font-arabic"
            onClick={() => setShowPreview((v) => !v)}
          >
            <Eye className="ms-1 h-4 w-4" />
            {showPreview ? t('hidePreview') : t('showPreview')}
          </Button>
          {!previewAcked ? (
            <Button
              type="button"
              size="sm"
              className="font-arabic"
              disabled={busy === 'preview'}
              onClick={() => void handleAcknowledgePreview()}
            >
              <Check className="ms-1 h-4 w-4" />
              {t('confirmPreview')}
            </Button>
          ) : (
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 font-arabic text-xs text-emerald-800">
              {t('previewConfirmed')}
            </span>
          )}
          {canApprove ? (
            <Button
              type="button"
              size="sm"
              className="font-arabic"
              disabled={busy === 'approve'}
              onClick={() => void handleApprove()}
            >
              {t('approveCta')}
            </Button>
          ) : null}
        </div>
      </header>

      {error ? (
        <p className="font-arabic text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {showPreview ? (
        <CandidatePreview blocks={blocks} timeLimitMinutes={screening.time_limit_minutes} />
      ) : null}

      <div className="space-y-4">
        {blocks.map((block) => (
          <BlockEditor
            key={block.id}
            block={block}
            busy={busy === block.id}
            onSave={(prompt) => void handleSaveBlock(block, prompt)}
            onRegenerate={() => void handleRegenerate(block.id)}
          />
        ))}
      </div>
    </div>
  )
}

function BlockEditor({
  block,
  busy,
  onSave,
  onRegenerate,
}: {
  block: SsisBlock
  busy: boolean
  onSave: (prompt: string) => void
  onRegenerate: () => void
}) {
  const t = useTranslations('company.ssis')
  const [prompt, setPrompt] = useState(block.prompt_ar)

  return (
    <article className={cn('rounded-xl border border-border bg-card p-4')}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="font-arabic text-xs text-muted-foreground">
          {block.kind === 'scenario' ? 'سيناريو' : 'نصّي'} · #{block.display_order}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="font-arabic text-xs"
          disabled={busy}
          onClick={onRegenerate}
        >
          <RefreshCw className={cn('ms-1 h-3.5 w-3.5', busy && 'animate-spin')} />
          {t('regenerateBlock')}
        </Button>
      </div>
      <Textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        rows={5}
        className="font-arabic text-sm"
      />
      <details className="mt-3">
        <summary className="cursor-pointer font-arabic text-xs text-muted-foreground">
          {t('rubricLabel')}
        </summary>
        <pre className="mt-2 overflow-x-auto rounded bg-muted/50 p-2 font-mono text-[11px]">
          {JSON.stringify(block.rubric, null, 2)}
        </pre>
      </details>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="mt-3 font-arabic"
        disabled={busy || prompt === block.prompt_ar}
        onClick={() => onSave(prompt)}
      >
        {t('saveBlock')}
      </Button>
    </article>
  )
}
