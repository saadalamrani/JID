'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { FormField } from '@/components/auth/form-field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { inviteStaffMember } from '@/lib/sys/invite-staff'
import { Link } from '@/lib/i18n/navigation'
import { inviteStaffSchema, type InviteStaffFormValues } from '@/lib/validations/sys'

export default function InviteStaffPage() {
  const t = useTranslations('sys.inviteStaff')
  const tValidation = useTranslations('sys.validation')
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<InviteStaffFormValues>({
    resolver: zodResolver(inviteStaffSchema),
    defaultValues: { email: '', reason: '' },
  })

  function translateError(message?: string) {
    if (!message?.startsWith('sys.validation.')) return message
    return tValidation(message.replace('sys.validation.', '') as 'emailInvalid')
  }

  async function onSubmit(values: InviteStaffFormValues) {
    setSubmitting(true)
    try {
      const result = await inviteStaffMember(values)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success(t('success'))
      form.reset()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{t('title')}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t('subtitle')}</p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 rounded-xl border border-border bg-card p-6">
        <FormField
          id="email"
          label={t('email')}
          error={translateError(form.formState.errors.email?.message)}
        >
          <Input
            id="email"
            type="email"
            dir="ltr"
            className="text-start"
            disabled={submitting}
            {...form.register('email')}
          />
        </FormField>

        <FormField
          id="reason"
          label={t('reason')}
          hint={t('reasonHint')}
          error={translateError(form.formState.errors.reason?.message)}
        >
          <textarea
            id="reason"
            rows={4}
            disabled={submitting}
            className="w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent"
            {...form.register('reason')}
          />
        </FormField>

        <div className="flex gap-3">
          <Button type="button" variant="outline" className="flex-1" asChild>
            <Link href="/sys/staff">{t('cancel')}</Link>
          </Button>
          <Button
            type="submit"
            className="flex-1 bg-primary hover:bg-primary/90"
            disabled={submitting}
          >
            {submitting ? t('submitting') : t('submit')}
          </Button>
        </div>
      </form>
    </div>
  )
}
