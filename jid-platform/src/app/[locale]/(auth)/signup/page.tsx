'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { AuthShell } from '@/components/auth/auth-shell'
import { FormField } from '@/components/auth/form-field'
import { PasswordInput } from '@/components/auth/password-input'
import { PasswordRequirementsPanel } from '@/components/ui/password-requirements-panel'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Link, useRouter } from '@/lib/i18n/navigation'
import { siteConfig } from '@/config/site'
import { createClient } from '@/lib/supabase/client'
import { signupSchema, type SignupFormValues } from '@/lib/validations/auth'

export default function SignupPage() {
  const t = useTranslations('auth.signup')
  const tValidation = useTranslations('auth.validation')
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      full_name: '',
      email: '',
      password: '',
      accept_terms: false,
    },
    mode: 'onBlur',
  })

  const passwordValue = form.watch('password')

  function translateError(message?: string) {
    if (!message?.startsWith('auth.validation.')) return message
    return tValidation(message.replace('auth.validation.', '') as 'emailInvalid')
  }

  async function onSubmit(values: SignupFormValues) {
    setSubmitting(true)
    const supabase = createClient()

    try {
      const redirectTo = `${siteConfig.appUrl}/auth/callback`

      const { data, error } = await supabase.auth.signUp({
        email: values.email,
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
        const { error: profileError } = await supabase.from('profiles').upsert({
          id: data.user.id,
          full_name: values.full_name,
          role: 'individual',
          locale: 'ar',
          updated_at: new Date().toISOString(),
        })

        if (profileError) {
          toast.error(profileError.message)
          return
        }
      }

      router.push('/verify-email-sent')
    } catch {
      toast.error(t('errors.generic'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell
      title={t('title')}
      subtitle={t('subtitle')}
      footer={
        <p>
          {t('hasAccount')}{' '}
          <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
            {t('loginLink')}
          </Link>
        </p>
      }
    >
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormField
          id="full_name"
          label={t('fullName')}
          error={translateError(form.formState.errors.full_name?.message)}
        >
          <Input
            id="full_name"
            autoComplete="name"
            disabled={submitting}
            {...form.register('full_name')}
          />
        </FormField>

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
          hint={t('passwordHint')}
        >
          <PasswordInput id="password" disabled={submitting} {...form.register('password')} />
          <PasswordRequirementsPanel password={passwordValue} className="mt-2" />
        </FormField>

        <FormField
          id="accept_terms"
          label={t('acceptTerms')}
          error={translateError(form.formState.errors.accept_terms?.message)}
        >
          <Controller
            control={form.control}
            name="accept_terms"
            render={({ field }) => (
              <label className="flex items-start gap-2 text-sm text-muted-foreground">
                <input
                  id="accept_terms"
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-accent"
                  disabled={submitting}
                  checked={field.value === true}
                  onChange={(event) => field.onChange(event.target.checked)}
                  onBlur={field.onBlur}
                  ref={field.ref}
                />
                <span>{t('acceptTermsLabel')}</span>
              </label>
            )}
          />
        </FormField>

        <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={submitting}>
          {submitting ? t('submitting') : t('submit')}
        </Button>
      </form>
    </AuthShell>
  )
}
