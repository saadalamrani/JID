'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { FormField } from '@/components/auth/form-field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { normalizeSaudiPhoneE164 } from '@/lib/verification/phone'
import { phoneEntrySchema, type PhoneEntryFormValues } from '@/lib/validations/auth'

type PhoneEntryStepProps = {
  onSent: (phone: string, expiresAt: string) => void
  onSend: (phone: string) => Promise<{ expiresAt: string }>
}

export function PhoneEntryStep({ onSent, onSend }: PhoneEntryStepProps) {
  const t = useTranslations('auth.verifyPhone')
  const tValidation = useTranslations('auth.validation')
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<PhoneEntryFormValues>({
    resolver: zodResolver(phoneEntrySchema),
    defaultValues: { phone: '' },
  })

  function translateError(message?: string) {
    if (!message?.startsWith('auth.validation.')) return message
    return tValidation(message.replace('auth.validation.', '') as 'phoneInvalid')
  }

  async function onSubmit(values: PhoneEntryFormValues) {
    setSubmitting(true)
    try {
      const normalized = normalizeSaudiPhoneE164(values.phone)
      if (!/^\+9665\d{8}$/.test(normalized)) {
        form.setError('phone', { message: 'auth.validation.phoneInvalid' })
        return
      }
      const result = await onSend(normalized)
      onSent(normalized, result.expiresAt)
      toast.success(t('otpSent'))
    } catch (error) {
      const message = error instanceof Error ? error.message : t('errors.sendFailed')
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <FormField
        id="phone"
        label={t('phoneLabel')}
        hint={t('phoneHint')}
        error={translateError(form.formState.errors.phone?.message)}
      >
        <div className="flex gap-2" dir="ltr">
          <span className="flex h-10 items-center rounded-md border border-jid-line bg-jid-beige px-3 text-sm text-jid-ink/70">
            +966
          </span>
          <Input
            id="phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            placeholder="5XXXXXXXX"
            className="flex-1 font-mono tabular-nums"
            disabled={submitting}
            {...form.register('phone')}
          />
        </div>
      </FormField>

      <Button type="submit" className="w-full bg-jid-olive hover:bg-jid-olive/90" disabled={submitting}>
        {submitting ? t('sending') : t('sendOtp')}
      </Button>
    </form>
  )
}
