'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  completeSsisInvitation,
  saveSsisResponse,
  startSsisInvitation,
} from '@/lib/ssis/client'
import { SSIS_AUTOSAVE_MS } from '@/lib/ssis/constants'
import type { SsisBlock, SsisInvitation } from '@/lib/ssis/types'
import { BlockText } from './block-text'
import { CompletionReceipt } from './completion-receipt'
import { cn } from '@/lib/utils'

type SessionRunnerProps = {
  invitation: SsisInvitation
  blocks: SsisBlock[]
  timeLimitMinutes: number
}

export function SessionRunner({ invitation, blocks, timeLimitMinutes }: SessionRunnerProps) {
  const router = useRouter()
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const [completed, setCompleted] = useState(invitation.status === 'completed')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const answersRef = useRef(answers)
  const indexRef = useRef(index)

  useEffect(() => {
    answersRef.current = answers
  }, [answers])

  useEffect(() => {
    indexRef.current = index
  }, [index])

  useEffect(() => {
    void startSsisInvitation(invitation.id).catch(() => {
      /* may already be started */
    })
  }, [invitation.id])

  const persistCurrent = useCallback(async () => {
    const block = blocks[indexRef.current]
    const text = answersRef.current[block.id]?.trim()
    if (!text) return
    setSaving(true)
    try {
      await saveSsisResponse(invitation.id, block.id, text)
      setSavedAt(new Date())
    } catch {
      /* connectivity grace — retry on next tick */
    } finally {
      setSaving(false)
    }
  }, [blocks, invitation.id])

  useEffect(() => {
    const timer = setInterval(() => {
      void persistCurrent()
    }, SSIS_AUTOSAVE_MS)
    return () => clearInterval(timer)
  }, [persistCurrent])

  const block = blocks[index]
  const deadline = invitation.started_at
    ? new Date(invitation.started_at).getTime() + timeLimitMinutes * 60_000
    : Date.now() + timeLimitMinutes * 60_000

  const [minutesLeft, setMinutesLeft] = useState(
    Math.max(0, Math.ceil((deadline - Date.now()) / 60_000)),
  )

  useEffect(() => {
    const tick = setInterval(() => {
      setMinutesLeft(Math.max(0, Math.ceil((deadline - Date.now()) / 60_000)))
    }, 30_000)
    return () => clearInterval(tick)
  }, [deadline])

  async function handleNext() {
    await persistCurrent()
    if (index < blocks.length - 1) {
      setIndex((i) => i + 1)
    }
  }

  async function handleSubmit() {
    setSubmitting(true)
    setError(null)
    try {
      await persistCurrent()
      const missing = blocks.filter((b) => !answers[b.id]?.trim())
      if (missing.length > 0) {
        setError('يرجى إكمال جميع الأسئلة قبل الإرسال')
        setSubmitting(false)
        return
      }
      await completeSsisInvitation(invitation.id)
      setCompleted(true)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'تعذّر إرسال الإجابات')
    } finally {
      setSubmitting(false)
    }
  }

  if (completed) {
    return <CompletionReceipt />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 font-arabic text-sm text-muted-foreground">
        <span>
          الوقت المتبقي: {minutesLeft} دقيقة
          {saving ? (
            <Loader2 className="ms-2 inline h-3.5 w-3.5 animate-spin" aria-label="جاري الحفظ" />
          ) : savedAt ? (
            <span className="ms-2 text-[10px]">· حُفظ {savedAt.toLocaleTimeString('ar-SA')}</span>
          ) : null}
        </span>
      </div>

      <BlockText
        prompt={block.prompt_ar}
        value={answers[block.id] ?? ''}
        onChange={(v) => setAnswers((prev) => ({ ...prev, [block.id]: v }))}
        kind={block.kind}
        index={index}
        total={blocks.length}
      />

      {error ? (
        <p className="font-arabic text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <footer className="flex flex-wrap gap-3">
        {index > 0 ? (
          <Button
            type="button"
            variant="outline"
            className="font-arabic"
            onClick={() => setIndex((i) => i - 1)}
          >
            السابق
          </Button>
        ) : null}
        {index < blocks.length - 1 ? (
          <Button type="button" className="font-arabic" onClick={() => void handleNext()}>
            التالي
          </Button>
        ) : (
          <Button
            type="button"
            className={cn('font-arabic')}
            disabled={submitting}
            onClick={() => void handleSubmit()}
          >
            {submitting ? <Loader2 className="ms-2 h-4 w-4 animate-spin" /> : null}
            إرسال الفحص
          </Button>
        )}
      </footer>
    </div>
  )
}
