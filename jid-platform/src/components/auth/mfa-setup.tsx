'use client'

import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { OtpInput } from '@/components/auth/otp-input'
import { Button } from '@/components/ui/button'
import {
  challengeTotp,
  enrollTotp,
  verifyTotp,
  type TotpEnrollment,
} from '@/lib/auth/mfa'
import { createClient } from '@/lib/supabase/client'

type MfaSetupProps = {
  onEnrolled: () => void
}

export function MfaSetup({ onEnrolled }: MfaSetupProps) {
  const t = useTranslations('auth.mfa.setup')
  const [enrollment, setEnrollment] = useState<TotpEnrollment | null>(null)
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState(false)

  const startEnrollment = useCallback(async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const data = await enrollTotp(supabase)
      setEnrollment(data)
    } catch {
      toast.error(t('errors.enrollFailed'))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    void startEnrollment()
  }, [startEnrollment])

  async function handleConfirm() {
    if (!enrollment || code.length !== 6) return

    setVerifying(true)
    try {
      const supabase = createClient()
      const challenge = await challengeTotp(supabase, enrollment.id)
      await verifyTotp(supabase, {
        factorId: enrollment.id,
        challengeId: challenge.id,
        code,
      })
      toast.success(t('enrolled'))
      onEnrolled()
    } catch {
      toast.error(t('errors.verifyFailed'))
    } finally {
      setVerifying(false)
    }
  }

  if (loading) {
    return <p className="text-center text-sm text-jid-ink/70">{t('loading')}</p>
  }

  if (!enrollment) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-jid-ink/70">{t('errors.enrollFailed')}</p>
        <Button type="button" variant="outline" onClick={startEnrollment}>
          {t('retry')}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-jid-ink/80">{t('instructions')}</p>

      <div className="flex justify-center rounded-lg border border-jid-line bg-white p-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={enrollment.totp.qr_code}
          alt={t('qrAlt')}
          className="h-44 w-44"
          width={176}
          height={176}
        />
      </div>

      <div className="rounded-md bg-jid-beige p-3 text-center" dir="ltr">
        <p className="text-xs text-jid-ink/60">{t('manualSecret')}</p>
        <p className="mt-1 font-mono text-sm tabular-nums text-jid-ink">{enrollment.totp.secret}</p>
      </div>

      <div className="space-y-3">
        <p className="text-center text-sm text-jid-ink/70">{t('confirmPrompt')}</p>
        <OtpInput value={code} onChange={setCode} disabled={verifying} autoFocus />
      </div>

      <Button
        type="button"
        className="w-full bg-jid-olive hover:bg-jid-olive/90"
        disabled={verifying || code.length !== 6}
        onClick={handleConfirm}
      >
        {verifying ? t('verifying') : t('confirm')}
      </Button>
    </div>
  )
}
