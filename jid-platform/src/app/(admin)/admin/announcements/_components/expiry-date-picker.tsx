'use client'

import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type ExpiryDatePickerProps = {
  value: string
  onChange: (value: string) => void
  error?: string | null
  disabled?: boolean
}

export function ExpiryDatePicker({ value, onChange, error, disabled = false }: ExpiryDatePickerProps) {
  const isEmpty = !value.trim()
  return (
    <div className="space-y-2">
      <label htmlFor="expires_at" className="text-sm font-medium text-jid-ink">
        Expiry date <span className="text-red-600">*</span>
      </label>
      <Input
        id="expires_at"
        type="datetime-local"
        value={value}
        disabled={disabled}
        required
        aria-required
        aria-invalid={isEmpty || Boolean(error)}
        onChange={(event) => onChange(event.target.value)}
        className={cn((isEmpty || error) && 'border-red-400 ring-1 ring-red-200')}
      />
      <p className="text-xs text-jid-ink/60">Must be a future date. Saving is blocked otherwise.</p>
      {isEmpty ? <p className="text-sm text-red-600">Expiry date is required.</p> : null}
      {error && !isEmpty ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  )
}
