'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  COMM_KIND_LABELS_AR,
  DEFAULT_COMM_TEMPLATES_AR,
  type CommKind,
} from '@/lib/constants/communication'
import {
  fetchCommunicationTemplates,
  updateCommunicationTemplate,
} from '@/lib/communication/client'
import type { CommunicationTemplate } from '@/types/communication'
import { cn } from '@/lib/utils'

type TemplateStudioProps = {
  companyId: string
  className?: string
}

const EDITABLE_KINDS = Object.keys(DEFAULT_COMM_TEMPLATES_AR) as Array<
  Exclude<CommKind, 'received_ack'>
>

/** Per-kind template editor — rejection locked, others editable (Prompt 4). */
export function TemplateStudio({ companyId, className }: TemplateStudioProps) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeKind, setActiveKind] = useState<Exclude<CommKind, 'received_ack'>>('rejection')
  const [templates, setTemplates] = useState<CommunicationTemplate[]>([])
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [isLocked, setIsLocked] = useState(false)

  useEffect(() => {
    setLoading(true)
    void fetchCommunicationTemplates(companyId)
      .then(setTemplates)
      .catch((error) => toast.error(error instanceof Error ? error.message : 'تعذّر تحميل القوالب'))
      .finally(() => setLoading(false))
  }, [companyId])

  useEffect(() => {
    const match = templates.find((row) => row.kind === activeKind)
    if (match) {
      setSubject(match.subjectAr)
      setBody(match.bodyAr)
      setIsLocked(match.isLocked)
      return
    }
    const fallback = DEFAULT_COMM_TEMPLATES_AR[activeKind]
    setSubject(fallback.subject)
    setBody(fallback.body)
    setIsLocked(fallback.isLocked)
  }, [activeKind, templates])

  async function handleSave() {
    if (isLocked) {
      toast.error('قالب الاعتذار مقفل — اختيار المتغيرات فقط')
      return
    }

    setSaving(true)
    try {
      await updateCommunicationTemplate({
        companyId,
        kind: activeKind,
        subjectAr: subject,
        bodyAr: body,
      })

      if (process.env.NODE_ENV === 'development') {
        console.debug('[analytics]', 'template_customized', { kind: activeKind })
      }

      const refreshed = await fetchCommunicationTemplates(companyId)
      setTemplates(refreshed)
      toast.success('تم حفظ القالب')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'تعذّر الحفظ')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className={cn('rounded-xl border border-border bg-card p-5', className)}>
      <header className="mb-4">
        <h2 className="font-arabic text-base font-semibold text-foreground">استوديو القوالب</h2>
        <p className="mt-1 font-arabic text-sm text-muted-foreground">
          خصّص رسائل الرد الآلي — قالب الاعتذار معتمد من المنصة.
        </p>
      </header>

      <div className="mb-4 flex flex-wrap gap-2">
        {EDITABLE_KINDS.map((kind) => (
          <button
            key={kind}
            type="button"
            onClick={() => setActiveKind(kind)}
            className={cn(
              'rounded-md border px-3 py-1.5 font-arabic text-xs transition-colors',
              activeKind === kind
                ? 'border-jid-gold bg-jid-gold/20 text-jid-olive'
                : 'border-border text-muted-foreground hover:bg-muted',
            )}
          >
            {COMM_KIND_LABELS_AR[kind]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          جاري التحميل…
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">الموضوع</label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} disabled={isLocked} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">النص</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              disabled={isLocked}
              rows={10}
              className="flex min-h-[200px] w-full rounded-md border border-border bg-card px-3 py-2 font-arabic text-sm text-foreground"
            />
          </div>
          {isLocked ? (
            <p className="font-arabic text-xs text-jid-ink-soft">
              قالب الاعتذار يتبع النبرة المهنية المعتمدة من جِد — لا يمكن تعديله حراً.
            </p>
          ) : null}
          <Button
            type="button"
            className="bg-jid-olive font-arabic text-primary-foreground hover:bg-jid-olive/90"
            disabled={saving || isLocked}
            onClick={() => void handleSave()}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
            حفظ القالب
          </Button>
        </div>
      )}
    </section>
  )
}
