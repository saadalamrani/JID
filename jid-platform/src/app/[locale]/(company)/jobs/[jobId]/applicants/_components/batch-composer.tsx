'use client'

import { useEffect, useMemo, useState } from 'react'
import { Loader2 } from 'lucide-react'
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
import { Input } from '@/components/ui/input'
import {
  COMM_KIND_LABELS_AR,
  COMM_UNDO_WINDOW_MINUTES,
  renderCommTemplate,
} from '@/lib/constants/communication'
import {
  createCommunicationBatch,
  fetchCommunicationTemplates,
} from '@/lib/communication/client'
import type { CascadeSuggestion, CommunicationTemplate } from '@/types/communication'

type BatchComposerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  jobId: string
  companyId: string
  suggestion: CascadeSuggestion
  onScheduled: () => void
}

/** Template preview + recipient summary + confirm (Prompt 4). */
export function BatchComposer({
  open,
  onOpenChange,
  jobId,
  companyId,
  suggestion,
  onScheduled,
}: BatchComposerProps) {
  const locale = useLocale() as 'ar' | 'en'
  const [loading, setLoading] = useState(false)
  const [templates, setTemplates] = useState<CommunicationTemplate[]>([])
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [isLocked, setIsLocked] = useState(false)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    void fetchCommunicationTemplates(companyId)
      .then((rows) => {
        setTemplates(rows)
        const match = rows.find((row) => row.kind === suggestion.suggestionKind)
        if (match) {
          setSubject(match.subjectAr)
          setBody(match.bodyAr)
          setIsLocked(match.isLocked)
        }
      })
      .catch((error) => {
        toast.error(error instanceof Error ? error.message : 'تعذّر تحميل القوالب')
      })
      .finally(() => setLoading(false))
  }, [open, companyId, suggestion.suggestionKind])

  const previewBody = useMemo(
    () =>
      renderCommTemplate(body, {
        candidate_name: 'المتقدم',
        job_title: 'اسم الفرصة',
        company_name: 'اسم الجهة',
        next_step: 'مقابلة عبر Teams',
        timeline: 'خلال أسبوع',
      }),
    [body],
  )

  async function handleConfirm() {
    setLoading(true)
    try {
      await createCommunicationBatch({
        jobId,
        kind: suggestion.suggestionKind,
        recipientIds: suggestion.recipientIds,
        templateSnapshot: {
          kind: suggestion.suggestionKind,
          subject_ar: subject,
          body_ar: isLocked ? templates.find((t) => t.kind === suggestion.suggestionKind)?.bodyAr ?? body : body,
        },
      })

      if (process.env.NODE_ENV === 'development') {
        console.debug('[analytics]', 'cascade_batch_confirmed', {
          kind: suggestion.suggestionKind,
          count: suggestion.recipientCount,
        })
      }

      onScheduled()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'تعذّر جدولة الإرسال')
    } finally {
      setLoading(false)
    }
  }

  const kindLabel = COMM_KIND_LABELS_AR[suggestion.suggestionKind]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl font-arabic" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
        <DialogHeader className={locale === 'ar' ? 'text-right sm:text-right' : undefined}>
          <DialogTitle className="text-jid-olive">تأكيد إرسال {kindLabel}</DialogTitle>
          <DialogDescription>
            {suggestion.recipientCount} متقدم — يبدأ الإرسال بعد {COMM_UNDO_WINDOW_MINUTES} دقيقة.
          </DialogDescription>
        </DialogHeader>

        {loading && templates.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            جاري التحميل…
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">الموضوع</label>
              <Input
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                disabled={isLocked}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                النص {isLocked ? '(قالب معتمد — لا يمكن تعديل الاعتذار حراً)' : ''}
              </label>
              <textarea
                value={body}
                onChange={(event) => setBody(event.target.value)}
                disabled={isLocked}
                rows={8}
                className="flex min-h-[160px] w-full rounded-md border border-border bg-card px-3 py-2 font-arabic text-sm text-foreground"
              />
            </div>

            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="mb-2 text-xs font-medium text-muted-foreground">معاينة</p>
              <pre className="whitespace-pre-wrap font-arabic text-sm leading-relaxed text-foreground">
                {previewBody}
              </pre>
            </div>
          </div>
        )}

        <DialogFooter className={locale === 'ar' ? 'sm:justify-start' : undefined}>
          <Button
            type="button"
            className="bg-jid-olive font-arabic text-primary-foreground hover:bg-jid-olive/90"
            disabled={loading || !subject.trim() || !body.trim()}
            onClick={() => void handleConfirm()}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
            تأكيد الجدولة
          </Button>
          <Button type="button" variant="outline" className="font-arabic" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
