'use client'

import { useEffect, useMemo, useState } from 'react'
import { useLocale } from 'next-intl'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { COMM_KIND_LABELS_AR } from '@/lib/constants/communication'
import type { CascadeSuggestion } from '@/types/communication'
import { BatchComposer } from './batch-composer'

type CascadePromptDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  jobId: string
  companyId: string
  suggestions: CascadeSuggestion[]
  onBatchScheduled: () => void
  onDismiss: () => void
}

/**
 * Fires after triage status changes — complement-set cascade prompts (Prompt 4).
 */
export function CascadePromptDialog({
  open,
  onOpenChange,
  jobId,
  companyId,
  suggestions,
  onBatchScheduled,
  onDismiss,
}: CascadePromptDialogProps) {
  const locale = useLocale() as 'ar' | 'en'
  const [activeSuggestion, setActiveSuggestion] = useState<CascadeSuggestion | null>(null)
  const [composerOpen, setComposerOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    if (process.env.NODE_ENV === 'development') {
      console.debug('[analytics]', 'cascade_prompt_shown', {
        job_id: jobId,
        suggestion_count: suggestions.length,
      })
    }
  }, [open, jobId, suggestions.length])

  const primary = suggestions[0] ?? null

  const headline = useMemo(() => {
    if (!primary) return ''
    const kindLabel = COMM_KIND_LABELS_AR[primary.suggestionKind]
    return `هل تريد إرسال «${kindLabel}» إلى ${primary.recipientCount} متقدم؟`
  }, [primary])

  function handleCustomize() {
    if (!primary) return
    setActiveSuggestion(primary)
    setComposerOpen(true)
  }

  return (
    <>
      <Dialog open={open && !composerOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg font-arabic" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
          <DialogHeader className={locale === 'ar' ? 'text-right sm:text-right' : undefined}>
            <DialogTitle className="text-primary">الرد الآلي المتتالي</DialogTitle>
            <DialogDescription className="leading-relaxed">
              {headline || 'لا توجد اقتراحات إرسال حالياً.'}
            </DialogDescription>
          </DialogHeader>

          {suggestions.length > 1 ? (
            <ul className="space-y-2 text-sm text-muted-foreground">
              {suggestions.map((row) => (
                <li key={`${row.suggestionKind}-${row.recipientCount}`}>
                  {COMM_KIND_LABELS_AR[row.suggestionKind]} — {row.recipientCount} متقدم
                </li>
              ))}
            </ul>
          ) : null}

          <p className="rounded-md border border-accent/30 bg-surface/60 px-3 py-2 text-xs text-muted-foreground">
            يبدأ الإرسال بعد مهلة تراجع 15 دقيقة — يمكنك الإلغاء قبلها.
          </p>

          <DialogFooter className={locale === 'ar' ? 'sm:justify-start' : undefined}>
            <Button
              type="button"
              className="bg-primary font-arabic text-primary-foreground hover:bg-primary/90"
              disabled={!primary}
              onClick={handleCustomize}
            >
              إرسال الآن (بعد مهلة 15 دقيقة)
            </Button>
            <Button type="button" variant="outline" className="font-arabic" onClick={() => {
              onDismiss()
              onOpenChange(false)
            }}>
              لاحقاً
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {activeSuggestion ? (
        <BatchComposer
          open={composerOpen}
          onOpenChange={setComposerOpen}
          jobId={jobId}
          companyId={companyId}
          suggestion={activeSuggestion}
          onScheduled={() => {
            setComposerOpen(false)
            onOpenChange(false)
            onBatchScheduled()
            toast.success('تم جدولة الإرسال — يمكنك التراجع خلال 15 دقيقة')
          }}
        />
      ) : null}
    </>
  )
}
