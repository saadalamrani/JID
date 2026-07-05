'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { OtpInput } from '@/components/auth/otp-input'
import { Button } from '@/components/ui/button'
import { otpEntrySchema, type OtpEntryFormValues } from '@/lib/validations/auth'
import { OtpRateLimitError } from '@/lib/verification/rate-limit'

const OTP_TTL_SECONDS = 300
const RESEND_COOLDOWN_SECONDS = 60

type OtpEntryStepProps = {
  phone: string
  expiresAt: string
  onVerified: () => void
  onVerify: (phone: string, otp: string) => Promise<void>
  onResend: (phone: string) => Promise<{ expiresAt: string }>
  onChangePhone: () => void
}

function secondsRemaining(targetIso: string): number {
  const diff = Math.floor((new Date(targetIso).getTime() - Date.now()) / 1000)
  return Math.max(0, diff)
}

export function OtpEntryStep({
  phone,
  expiresAt: initialExpiresAt,
  onVerified,
  onVerify,
  onResend,
  onChangePhone,
}: OtpEntryStepProps) {
  const t = useTranslations('auth.verifyPhone')
  const tValidation = useTranslations('auth.validation')
  const [expiresAt, setExpiresAt] = useState(initialExpiresAt)
  const [otpSecondsLeft, setOtpSecondsLeft] = useState(() => secondsRemaining(initialExpiresAt))
  const [resendSecondsLeft, setResendSecondsLeft] = useState(RESEND_COOLDOWN_SECONDS)
  const [submitting, setSubmitting] = useState(false)
  const [resending, setResending] = useState(false)

  const form = useForm<OtpEntryFormValues>({
    resolver: zodResolver(otpEntrySchema),
    defaultValues: { otp: '' },
  })

  useEffect(() => {
    const timer = window.setInterval(() => {
      setOtpSecondsLeft(secondsRemaining(expiresAt))
      setResendSecondsLeft((value) => (value > 0 ? value - 1 : 0))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [expiresAt])

  const formatCountdown = useCallback((totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }, [])

  function translateError(message?: string) {
    if (!message?.startsWith('auth.validation.')) return message
    return tValidation(message.replace('auth.validation.', '') as 'otpLength')
  }

  async function onSubmit(values: OtpEntryFormValues) {
    if (otpSecondsLeft <= 0) {
      toast.error(t('errors.expired'))
      return
    }

    setSubmitting(true)
    try {
      await onVerify(phone, values.otp)
      toast.success(t('verified'))
      onVerified()
    } catch (error) {
      const message = error instanceof Error ? error.message : t('errors.verifyFailed')
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleResend() {
    if (resendSecondsLeft > 0) return

    setResending(true)
    try {
      const result = await onResend(phone)
      setExpiresAt(result.expiresAt)
      setOtpSecondsLeft(secondsRemaining(result.expiresAt))
      setResendSecondsLeft(RESEND_COOLDOWN_SECONDS)
      form.reset({ otp: '' })
      toast.success(t('otpSent'))
    } catch (error) {
      if (error instanceof OtpRateLimitError) {
        toast.error(t('errors.rateLimit'))
      } else {
        const message = error instanceof Error ? error.message : t('errors.sendFailed')
        toast.error(message)
      }
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center text-sm text-jid-ink/70">
        <p>{t('otpSentTo')}</p>
        <p className="mt-1 font-mono tabular-nums text-jid-ink" dir="ltr">
          {phone}
        </p>
        <button
          type="button"
          onClick={onChangePhone}
          className="mt-2 text-jid-olive underline-offset-4 hover:underline"
        >
          {t('changePhone')}
        </button>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Controller
          control={form.control}
          name="otp"
          render={({ field, fieldState }) => (
            <div className="space-y-2">
              <OtpInput
                value={field.value}
                onChange={field.onChange}
                disabled={submitting || otpSecondsLeft <= 0}
                autoFocus
              />
              {fieldState.error ? (
                <p className="text-center text-xs text-destructive" role="alert">
                  {translateError(fieldState.error.message)}
                </p>
              ) : null}
            </div>
          )}
        />

        <p className="text-center text-sm text-jid-ink/60">
          {otpSecondsLeft > 0
            ? t('expiresIn', { time: formatCountdown(otpSecondsLeft) })
            : t('expired')}
        </p>

        <Button
          type="submit"
          className="w-full bg-jid-olive hover:bg-jid-olive/90"
          disabled={submitting || otpSecondsLeft <= 0}
        >
          {submitting ? t('verifying') : t('verify')}
        </Button>
      </form>

      <div className="text-center text-sm">
        <Button
          type="button"
          variant="ghost"
          className="text-jid-olive"
          disabled={resending || resendSecondsLeft > 0}
          onClick={handleResend}
        >
          {resendSecondsLeft > 0
            ? t('resendIn', { time: formatCountdown(resendSecondsLeft) })
            : t('resend')}
        </Button>
      </div>

      <p className="text-center text-xs text-jid-ink/50">{t('ttlNote', { minutes: OTP_TTL_SECONDS / 60 })}</p>
    </div>
  )
}
