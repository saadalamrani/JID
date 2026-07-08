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
      <label htmlFor={id} className="flex items-center gap-1 text-sm font-medium text-foreground">
        {t('label')}
        {required ? (
          <span className="text-destructive" aria-hidden>
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
          (showRequired || error) && 'border-destructive/50 ring-1 ring-destructive/20',
          isEmpty && 'bg-destructive/5',
        )}
      />
      <p className="text-xs text-muted-foreground">{t('hint')}</p>
      {showRequired ? <p className="text-sm text-destructive">{t('required')}</p> : null}
      {error && !showRequired ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  )
}
