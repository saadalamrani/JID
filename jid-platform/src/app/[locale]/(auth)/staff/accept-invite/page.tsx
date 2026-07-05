'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { MfaSetup } from '@/components/auth/mfa-setup'
import { AuthShell } from '@/components/auth/auth-shell'
import { FormField } from '@/components/auth/form-field'
import { PasswordInput } from '@/components/auth/password-input'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  completeStaffInviteAcceptance,
  validateStaffInviteToken,
  type ValidatedInvite,
} from '@/lib/sys/staff'
import { siteConfig } from '@/config/site'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from '@/lib/i18n/navigation'
import { acceptInviteSchema, type AcceptInviteFormValues } from '@/lib/validations/sys'

type Step = 'loading' | 'invalid' | 'signup' | 'mfa' | 'done'

export default function AcceptInvitePage() {
  const t = useTranslations('sys.acceptInvite')

  return (
    <Suspense
      fallback={
        <AuthShell title={t('title')} subtitle={t('loading')}>
          <p className="text-center text-sm text-jid-ink/70">{t('loading')}</p>
        </AuthShell>
      }
    >
      <AcceptInviteContent />
    </Suspense>
  )
}

function AcceptInviteContent() {
  const t = useTranslations('sys.acceptInvite')
  const tValidation = useTranslations('sys.validation')
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')?.trim() ?? ''

  const [step, setStep] = useState<Step>('loading')
  const [invite, setInvite] = useState<ValidatedInvite | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<AcceptInviteFormValues>({
    resolver: zodResolver(acceptInviteSchema),
    defaultValues: { full_name: '', password: '' },
  })

  useEffect(() => {
    let cancelled = false

    async function validate() {
      if (!token) {
        setStep('invalid')
        return
      }

      try {
        const supabase = createClient()
        const result = await validateStaffInviteToken(supabase, token)
        if (cancelled) return

        if (!result) {
          setStep('invalid')
          return
        }

        setInvite(result)
        setStep('signup')
      } catch {
        if (!cancelled) setStep('invalid')
      }
    }

    void validate()
    return () => {
      cancelled = true
    }
  }, [token])

  function translateError(message?: string) {
    if (!message?.startsWith('sys.validation.')) return message
    return tValidation(message.replace('sys.validation.', '') as 'emailInvalid')
  }

  async function onSubmit(values: AcceptInviteFormValues) {
    if (!invite || !token) return

    setSubmitting(true)
    const supabase = createClient()

    try {
      const redirectTo = `${siteConfig.appUrl}/auth/callback?next=/staff/accept-invite?token=${encodeURIComponent(token)}`

      const { data, error } = await supabase.auth.signUp({
        email: invite.email,
        password: values.password,
        options: {
          emailRedirectTo: redirectTo,
          data: { full_name: values.full_name },
        },
      })

      if (error) {
        toast.error(error.message)
        return
      }

      if (data.user) {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          full_name: values.full_name,
          role: 'individual',
          locale: 'ar',
          updated_at: new Date().toISOString(),
        })
      }

      await completeStaffInviteAcceptance(supabase, token)
      setStep('mfa')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('errors.generic'))
    } finally {
      setSubmitting(false)
    }
  }

  if (step === 'loading') {
    return (
      <AuthShell title={t('title')} subtitle={t('loading')}>
        <p className="text-center text-sm text-jid-ink/70">{t('loading')}</p>
      </AuthShell>
    )
  }

  if (step === 'invalid') {
    return (
      <AuthShell title={t('title')} subtitle={t('invalidSubtitle')}>
        <p className="text-center text-sm text-red-600">{t('invalidToken')}</p>
      </AuthShell>
    )
  }

  if (step === 'mfa' || step === 'done') {
    return (
      <AuthShell title={t('mfaTitle')} subtitle={t('mfaSubtitle')}>
        <MfaSetup
          onEnrolled={() => {
            setStep('done')
            router.replace('/staff/dashboard')
          }}
        />
      </AuthShell>
    )
  }

  return (
    <AuthShell title={t('title')} subtitle={t('subtitle', { email: invite?.email ?? '' })}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormField
          id="full_name"
          label={t('fullName')}
          error={translateError(form.formState.errors.full_name?.message)}
        >
          <Input id="full_name" disabled={submitting} {...form.register('full_name')} />
        </FormField>

        <FormField
          id="password"
          label={t('password')}
          error={translateError(form.formState.errors.password?.message)}
          hint={t('passwordHint')}
        >
          <PasswordInput id="password" disabled={submitting} {...form.register('password')} />
        </FormField>

        <Button type="submit" className="w-full bg-jid-olive hover:bg-jid-olive/90" disabled={submitting}>
          {submitting ? t('submitting') : t('submit')}
        </Button>
      </form>
    </AuthShell>
  )
}
