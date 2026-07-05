'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'
import { useForm } from 'react-hook-form'
import { AuthShell } from '@/components/auth/auth-shell'
import { FormField } from '@/components/auth/form-field'
import { PasswordInput } from '@/components/auth/password-input'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Link, useRouter } from '@/lib/i18n/navigation'
import {
  getMfaAssuranceLevel,
  needsMfaEnrollment,
} from '@/lib/auth/mfa'
import { resolvePostLoginDestination, requiresMfaAtLogin } from '@/lib/auth/portal-routes'
import { fetchProfileForUser, isProfileSuspended } from '@/lib/auth/session'
import { recordActiveSessionFromBrowser } from '@/lib/auth/sessions'
import { createClient } from '@/lib/supabase/client'
import {
  loginSchema,
  MIN_LOGIN_DELAY_MS,
  type LoginFormValues,
} from '@/lib/validations/auth'

export default function LoginPage() {
  const t = useTranslations('auth.login')

  return (
    <Suspense
      fallback={
        <AuthShell title={t('title')} subtitle={t('subtitle')}>
          <p className="text-center text-sm text-jid-ink/70">{t('submitting')}</p>
        </AuthShell>
      }
    >
      <LoginPageContent />
    </Suspense>
  )
}

function LoginPageContent() {
  const t = useTranslations('auth.login')
  const tValidation = useTranslations('auth.validation')
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextParam = searchParams.get('next')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onBlur',
  })

  function translateError(message?: string) {
    if (!message?.startsWith('auth.validation.')) return message
    return tValidation(message.replace('auth.validation.', '') as 'emailInvalid')
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
          setTimeout(resolve, Math.max(0, MIN_LOGIN_DELAY_MS - (Date.now() - startedAt))),
        )
        setFormError(t('errors.generic'))
        return
      }

      const profile = await fetchProfileForUser(supabase, data.user.id)

      if (!profile) {
        await supabase.auth.signOut()
        await new Promise((resolve) =>
          setTimeout(resolve, Math.max(0, MIN_LOGIN_DELAY_MS - (Date.now() - startedAt))),
        )
        setFormError(t('errors.generic'))
        return
      }

      if (isProfileSuspended(profile)) {
        await supabase.auth.signOut()
        setFormError(t('errors.suspended'))
        return
      }

      if (requiresMfaAtLogin(profile.role)) {
        const aal = await getMfaAssuranceLevel(supabase)
        if (aal.currentLevel !== 'aal2') {
          const setup = await needsMfaEnrollment(supabase)
          router.push(
            resolvePostLoginDestination(profile.role, {
              next: nextParam,
              needsMfa: true,
              needsMfaSetup: setup,
            }),
          )
          return
        }
      }

      await recordActiveSessionFromBrowser(supabase)
      router.push(resolvePostLoginDestination(profile.role, { next: nextParam }))
    } catch {
      await new Promise((resolve) =>
        setTimeout(resolve, Math.max(0, MIN_LOGIN_DELAY_MS - (Date.now() - startedAt))),
      )
      setFormError(t('errors.generic'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell
      title={t('title')}
      subtitle={t('subtitle')}
      footer={
        <div className="space-y-2">
          <p>
            <Link href="/forgot-password" className="text-sm text-jid-olive hover:underline">
              {t('forgotPassword')}
            </Link>
          </p>
          <p>
            {t('noAccount')}{' '}
            <Link href="/signup" className="font-medium text-jid-olive underline-offset-4 hover:underline">
              {t('signupLink')}
            </Link>
          </p>
        </div>
      }
    >
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {formError ? (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
            {formError}
          </p>
        ) : null}

        <FormField
          id="email"
          label={t('email')}
          error={translateError(form.formState.errors.email?.message)}
        >
          <Input
            id="email"
            type="email"
            autoComplete="email"
            dir="ltr"
            className="text-start"
            disabled={submitting}
            {...form.register('email')}
          />
        </FormField>

        <FormField
          id="password"
          label={t('password')}
          error={translateError(form.formState.errors.password?.message)}
        >
          <PasswordInput
            id="password"
            autoComplete="current-password"
            disabled={submitting}
            {...form.register('password')}
          />
        </FormField>

        <Button type="submit" className="w-full bg-jid-olive hover:bg-jid-olive/90" disabled={submitting}>
          {submitting ? t('submitting') : t('submit')}
        </Button>
      </form>
    </AuthShell>
  )
}
