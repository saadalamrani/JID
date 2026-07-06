'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'
import { useForm } from 'react-hook-form'
import { FormField } from '@/components/auth/form-field'
import { PasswordInput } from '@/components/auth/password-input'
import { SysAuthShell } from '@/components/sys/sys-auth-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useRouter } from '@/lib/i18n/navigation'
import { getMfaAssuranceLevel, needsMfaEnrollment } from '@/lib/auth/mfa'
import { fetchProfileForUser, isProfileSuspended } from '@/lib/auth/session'
import { recordActiveSessionFromBrowser } from '@/lib/auth/sessions'
import { SYS_HOME_PATH, SYS_MIN_LOGIN_DELAY_MS, SYS_MFA_PATH } from '@/lib/sys/constants'
import { sanitizeSysNextPath } from '@/lib/sys/routes'
import { createClient } from '@/lib/supabase/client'
import { loginSchema, type LoginFormValues } from '@/lib/validations/auth'

export default function SysLoginPage() {
  const t = useTranslations('sys.login')

  return (
    <Suspense
      fallback={
        <SysAuthShell title={t('title')} subtitle={t('subtitle')}>
          <p className="text-center text-sm text-jid-ink/70">{t('submitting')}</p>
        </SysAuthShell>
      }
    >
      <SysLoginPageContent />
    </Suspense>
  )
}

function SysLoginPageContent() {
  const t = useTranslations('sys.login')
  const tValidation = useTranslations('sys.validation')
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextParam = searchParams.get('next')
  const reason = searchParams.get('reason')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onBlur',
  })

  function translateError(message?: string) {
    if (!message?.startsWith('auth.validation.')) return message
    const key = message.replace('auth.validation.', '')
    if (key === 'emailInvalid') return tValidation('emailInvalid')
    if (key === 'passwordRequired') return tValidation('passwordRequired')
    return message
  }

  async function onSubmit(values: LoginFormValues) {
    setSubmitting(true)
    setFormError(null)
    const startedAt = Date.now()
    const supabase = createClient()

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      })

      if (error || !data.user) {
        await new Promise((resolve) =>
          setTimeout(resolve, Math.max(0, SYS_MIN_LOGIN_DELAY_MS - (Date.now() - startedAt))),
        )
        setFormError(t('errors.generic'))
        return
      }

      const profile = await fetchProfileForUser(supabase, data.user.id)

      if (!profile || profile.role !== 'super_admin') {
        await supabase.auth.signOut()
        await new Promise((resolve) =>
          setTimeout(resolve, Math.max(0, SYS_MIN_LOGIN_DELAY_MS - (Date.now() - startedAt))),
        )
        setFormError(t('errors.generic'))
        return
      }

      if (isProfileSuspended(profile)) {
        await supabase.auth.signOut()
        setFormError(t('errors.suspended'))
        return
      }

      const safeNext = sanitizeSysNextPath(nextParam)
      const aal = await getMfaAssuranceLevel(supabase)

      if (aal.currentLevel !== 'aal2') {
        const setup = await needsMfaEnrollment(supabase)
        const params = new URLSearchParams()
        if (safeNext) params.set('next', safeNext)
        if (setup) params.set('setup', '1')
        const query = params.toString()
        router.push(query ? `${SYS_MFA_PATH}?${query}` : SYS_MFA_PATH)
        return
      }

      await recordActiveSessionFromBrowser(supabase)
      router.push(safeNext ?? SYS_HOME_PATH)
    } catch {
      await new Promise((resolve) =>
        setTimeout(resolve, Math.max(0, SYS_MIN_LOGIN_DELAY_MS - (Date.now() - startedAt))),
      )
      setFormError(t('errors.generic'))
    } finally {
      setSubmitting(false)
    }
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form

  return (
    <SysAuthShell
      title={t('title')}
      subtitle={t('subtitle')}
      footer={reason === 'expired' ? <p className="text-amber-800">{t('sessionExpired')}</p> : null}
    >
      <form className="space-y-4" onSubmit={(event) => void handleSubmit(onSubmit)(event)} noValidate>
        {formError ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
            {formError}
          </p>
        ) : null}

        <FormField
          id="email"
          label={t('email')}
          error={translateError(errors.email?.message)}
        >
          <Input
            id="email"
            type="email"
            autoComplete="username"
            disabled={submitting}
            {...register('email')}
          />
        </FormField>

        <FormField
          id="password"
          label={t('password')}
          error={translateError(errors.password?.message)}
        >
          <PasswordInput
            id="password"
            autoComplete="current-password"
            disabled={submitting}
            {...register('password')}
          />
        </FormField>

        <Button type="submit" className="w-full bg-jid-olive hover:bg-jid-olive/90" disabled={submitting}>
          {submitting ? t('submitting') : t('submit')}
        </Button>
      </form>
    </SysAuthShell>
  )
}
