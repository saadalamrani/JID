'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { OtpEntryStep } from '@/components/auth/otp-entry-step'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useRouter } from '@/lib/i18n/navigation'
import type { VerifiedEmailRow } from '@/lib/me/account'
import { createClient } from '@/lib/supabase/client'
import { sendEmailOtp } from '@/lib/verification/email-otp'
import { OtpRateLimitError } from '@/lib/verification/rate-limit'
import { addEmailSchema } from '@/lib/validations/me'
import type { z } from 'zod'

type AddEmailValues = z.infer<typeof addEmailSchema>

export function ManageEmailsClient() {
  const t = useTranslations('settings.emails')
  const router = useRouter()
  const [emails, setEmails] = useState<VerifiedEmailRow[]>([])
  const [step, setStep] = useState<'list' | 'otp'>('list')
  const [attemptId, setAttemptId] = useState('')
  const [pendingEmail, setPendingEmail] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [loading, setLoading] = useState(true)

  const form = useForm<AddEmailValues>({
    resolver: zodResolver(addEmailSchema),
    defaultValues: { email: '' },
  })

  const supabase = createClient()

  async function loadEmails() {
    setLoading(true)
    try {
      const response = await fetch('/api/me/emails', { credentials: 'include' })
      const body = (await response.json()) as { emails?: VerifiedEmailRow[]; error?: string }
      if (!response.ok) throw new Error(body.error ?? 'تعذّر التحميل')
      setEmails(body.emails ?? [])
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'تعذّر التحميل')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadEmails()
  }, [])

  async function onAddEmail(values: AddEmailValues) {
    try {
      const response = await fetch('/api/me/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(values),
      })
      const body = (await response.json()) as {
        attemptId?: string
        expiresAt?: string
        error?: string
      }
      if (!response.ok) throw new Error(body.error ?? 'تعذّر الإرسال')
      setAttemptId(body.attemptId ?? '')
      setPendingEmail(values.email)
      setExpiresAt(body.expiresAt ?? '')
      setStep('otp')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'تعذّر الإرسال')
    }
  }

  if (step === 'otp') {
    return (
      <div className="container-jid max-w-md py-8">
        <OtpEntryStep
          phone={pendingEmail}
          expiresAt={expiresAt}
          onVerify={async (_phone, otp) => {
            const response = await fetch(`/api/me/emails/${attemptId}/verify`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ otp }),
            })
            const body = (await response.json()) as { error?: string }
            if (!response.ok) throw new Error(body.error ?? 'رمز غير صحيح')
          }}
          onResend={async (email) => {
            try {
              const result = await sendEmailOtp(supabase, email)
              setAttemptId(result.attemptId)
              return { expiresAt: result.expiresAt }
            } catch (error) {
              if (error instanceof OtpRateLimitError) toast.error(error.message)
              throw error
            }
          }}
          onChangePhone={() => setStep('list')}
          onVerified={async () => {
            toast.success(t('verified'))
            setStep('list')
            await loadEmails()
          }}
        />
      </div>
    )
  }

  return (
    <div className="container-jid max-w-2xl space-y-6 py-8">
      <div>
        <h1 className="font-arabic text-xl font-semibold text-foreground">{t('title')}</h1>
        <p className="mt-1 font-arabic text-sm text-muted-foreground">{t('subtitle')}</p>
      </div>

      <ul className="space-y-2 rounded-xl border border-border bg-card p-4 shadow-sm">
        {loading ? (
          <li className="font-arabic text-sm text-muted-foreground">{t('loading')}</li>
        ) : emails.length === 0 ? (
          <li className="font-arabic text-sm text-muted-foreground">{t('empty')}</li>
        ) : (
          emails.map((row) => (
            <li
              key={row.id}
              className="flex items-center justify-between gap-3 border-b border-border/30 py-2 last:border-0"
            >
              <span dir="ltr" className="text-sm text-foreground">
                {row.email}
              </span>
              {row.is_primary ? (
                <span className="rounded-full bg-background px-2 py-0.5 font-arabic text-xs text-muted-foreground">
                  {t('primary')}
                </span>
              ) : null}
            </li>
          ))
        )}
      </ul>

      <form
        onSubmit={form.handleSubmit(onAddEmail)}
        className="space-y-3 rounded-xl border border-border bg-card p-5 shadow-sm"
      >
        <label className="block font-arabic text-sm font-medium text-foreground">{t('addLabel')}</label>
        <Input
          type="email"
          dir="ltr"
          placeholder="you@company.com"
          className="border-border"
          {...form.register('email')}
        />
        <Button type="submit" className="bg-primary font-arabic hover:bg-primary/90">
          {t('sendOtp')}
        </Button>
      </form>

      <Button type="button" variant="ghost" className="font-arabic" onClick={() => router.push('/profile')}>
        {t('back')}
      </Button>
    </div>
  )
}
