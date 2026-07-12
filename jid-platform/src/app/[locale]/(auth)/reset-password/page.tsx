'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { AuthShell } from '@/components/auth/auth-shell'
import { FormField } from '@/components/auth/form-field'
import { PasswordInput } from '@/components/auth/password-input'
import { PasswordRequirementsPanel } from '@/components/ui/password-requirements-panel'
import { Button } from '@/components/ui/button'
import { useRouter } from '@/lib/i18n/navigation'
import { createClient } from '@/lib/supabase/client'
import { z } from 'zod'
import { strongPasswordSchema } from '@/lib/utils/validators'

const resetSchema = z
  .object({
    password: strongPasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'mismatch',
    path: ['confirmPassword'],
  })

type ResetFormValues = z.infer<typeof resetSchema>

export default function ResetPasswordPage() {
  const t = useTranslations('auth.resetPassword')
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { password: '', confirmPassword: '' },
  })

  const passwordValue = form.watch('password')

  useEffect(() => {
    const supabase = createClient()
    void supabase.auth.getSession().then(() => setReady(true))
  }, [])

  async function onSubmit(values: ResetFormValues) {
    setSubmitting(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password: values.password })
      if (error) {
        toast.error(t('errors.generic'))
        return
      }
      toast.success(t('success'))
      router.replace('/login')
    } finally {
      setSubmitting(false)
    }
  }

  if (!ready) {
    return (
      <AuthShell title={t('title')} subtitle={t('loading')}>
        <p className="text-center text-sm text-foreground/70">{t('loading')}</p>
      </AuthShell>
    )
  }

  return (
    <AuthShell title={t('title')} subtitle={t('subtitle')}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormField
          id="password"
          label={t('password')}
          error={form.formState.errors.password?.message}
        >
          <PasswordInput id="password" disabled={submitting} {...form.register('password')} />
          <PasswordRequirementsPanel password={passwordValue} className="mt-2" />
        </FormField>
        <FormField
          id="confirmPassword"
          label={t('confirmPassword')}
          error={form.formState.errors.confirmPassword ? t('errors.mismatch') : undefined}
        >
          <PasswordInput id="confirmPassword" disabled={submitting} {...form.register('confirmPassword')} />
        </FormField>
        <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={submitting}>
          {submitting ? t('submitting') : t('submit')}
        </Button>
      </form>
    </AuthShell>
  )
}
