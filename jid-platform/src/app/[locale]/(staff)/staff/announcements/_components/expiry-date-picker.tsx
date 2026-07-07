'use client'

import { useTranslations } from 'next-intl'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type ExpiryDatePickerProps = {
  id?: string
  value: string
  onChange: (value: string) => void
  error?: string | null
  disabled?: boolean
  required?: boolean
}

/**
 * Section 8 — expiry is MANDATORY; cannot save without a future date.
 * Visual required state + error when empty or not in the future.
 */
export function ExpiryDatePicker({
  id = 'expires_at',
  value,
  onChange,
  error,
  disabled = false,
  required = true,
}: ExpiryDatePickerProps) {
  const t = useTranslations('staff.announcements.form.expiry')

  const isEmpty = !value.trim()
  const showRequired = required && isEmpty

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="flex items-center gap-1 text-sm font-medium text-jid-ink">
        {t('label')}
        {required ? (
          <span className="text-red-600" aria-hidden>
            *
          </span>
        ) : null}
        <span className="sr-only">{t('requiredSr')}</span>
      </label>
      <Input
        id={id}
        type="datetime-local"
        value={value}
        disabled={disabled}
        required={required}
        aria-required={required}
        aria-invalid={showRequired || Boolean(error)}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          (showRequired || error) && 'border-red-400 ring-1 ring-red-200',
          isEmpty && 'bg-red-50/40',
        )}
      />
      <p className="text-xs text-jid-ink/55">{t('hint')}</p>
      {showRequired ? <p className="text-sm text-red-600">{t('required')}</p> : null}
      {error && !showRequired ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  )
}
