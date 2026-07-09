'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { consentSsisInvitation } from '@/lib/ssis/client'
import {
  SSIS_AI_DISCLAIMER_AR,
  SSIS_CONSENT_TEXT_AR,
  SSIS_STATIC_NOTE_AR,
} from '@/lib/ssis/constants'
import type { SsisBlock, SsisInvitation, SsisScreening } from '@/lib/ssis/types'
import { SessionRunner } from './_components/session-runner'

type ScreeningSessionClientProps = {
  invitation: SsisInvitation
  screening: SsisScreening
  blocks: SsisBlock[]
}

export function ScreeningSessionClient({
  invitation,
  screening,
  blocks,
}: ScreeningSessionClientProps) {
  const router = useRouter()
  const [consented, setConsented] = useState(Boolean(invitation.consent_given_at))
  const [checked, setChecked] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const expired = new Date(invitation.expires_at) < new Date()
  const canStart =
    consented &&
    !expired &&
    screening.status === 'active' &&
    invitation.status !== 'completed'

  async function handleConsent() {
    if (!checked) return
    setBusy(true)
    setError(null)
    try {
      await consentSsisInvitation(invitation.id)
      setConsented(true)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'تعذّر تسجيل الموافقة')
    } finally {
      setBusy(false)
    }
  }

  if (expired) {
    return (
      <p className="font-arabic text-sm text-destructive" role="alert">
        انتهت صلاحية هذه الدعوة.
      </p>
    )
  }

  if (!consented) {
    return (
      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="font-arabic text-lg font-semibold">فحص أولي ذكي</h2>
        <ul className="mt-3 space-y-2 font-arabic text-sm text-muted-foreground">
          <li>· {blocks.length} أسئلة (نصّية وسيناريوهات)</li>
          <li>· المدة المتوقعة: {screening.time_limit_minutes} دقيقة</li>
          <li>· {SSIS_AI_DISCLAIMER_AR}</li>
          <li>· {SSIS_STATIC_NOTE_AR}</li>
        </ul>

        <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-lg border border-border p-4">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="mt-1 h-4 w-4"
          />
          <span className="font-arabic text-sm leading-relaxed">{SSIS_CONSENT_TEXT_AR}</span>
        </label>

        {error ? (
          <p className="mt-3 font-arabic text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        <Button
          type="button"
          className="mt-4 font-arabic"
          disabled={!checked || busy}
          onClick={() => void handleConsent()}
        >
          الموافقة وبدء الفحص
        </Button>
      </section>
    )
  }

  if (!canStart) {
    return (
      <p className="font-arabic text-sm text-muted-foreground">
        الفحص غير متاح حالياً.
      </p>
    )
  }

  return (
    <SessionRunner
      invitation={invitation}
      blocks={blocks}
      timeLimitMinutes={screening.time_limit_minutes}
    />
  )
}
