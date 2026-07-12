'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { AuthShell } from '@/components/auth/auth-shell'
import { FormField } from '@/components/auth/form-field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { siteConfig } from '@/config/site'
import { Link } from '@/lib/i18n/navigation'
import { createClient } from '@/lib/supabase/client'

const forgotSchema = z.object({
  email: z.string().trim().email(),
})

type ForgotFormValues = z.infer<typeof forgotSchema>

export default function ForgotPasswordPage() {
  const t = useTranslations('auth.forgotPassword')
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  const form = useForm<ForgotFormValues>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: '' },
  })

  async function onSubmit(values: ForgotFormValues) {
    setSubmitting(true)
    try {
      const supabase = createClient()
      const redirectTo = `${siteConfig.appUrl}/auth/callback?next=${encodeURIComponent('/reset-password')}`
      const { error } = await supabase.auth.resetPasswordForEmail(values.email, { redirectTo })
      if (error) {
        toast.error(t('errors.generic'))
        return
      }
      setSent(true)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell
      title={t('title')}
      subtitle={sent ? t('sentSubtitle') : t('subtitle')}
      footer={
        <Link href="/login" className="text-sm text-primary hover:underline">
          {t('backToLogin')}
        </Link>
      }
    >
      {sent ? (
        <p className="text-center text-sm text-foreground/70">{t('sentMessage')}</p>
      ) : (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <FormField id="email" label={t('email')} error={form.formState.errors.email?.message}>
            <Input id="email" type="email" dir="ltr" className="text-start" disabled={submitting} {...form.register('email')} />
          </FormField>
          <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={submitting}>
            {submitting ? t('submitting') : t('submit')}
          </Button>
        </form>
      )}
    </AuthShell>
  )
}
