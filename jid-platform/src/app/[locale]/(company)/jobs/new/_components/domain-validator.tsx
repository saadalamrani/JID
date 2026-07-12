'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { validateDomainMatch } from '@/lib/jobs/domain-validator'
import { cn } from '@/lib/utils'

type ExternalApplyUrlFieldProps = {
  id?: string
  value: string
  companyDomains: string[]
  onChange: (value: string) => void
  onValidityChange?: (valid: boolean) => void
  error?: string
  className?: string
}

/**
 * Section 6.3 / 6.5 — external_apply_url with onBlur domain validation.
 * Server re-validates in POST /api/company/jobs; never trust this alone.
 */
export function ExternalApplyUrlField({
  id = 'external-apply-url',
  value,
  companyDomains,
  onChange,
  onValidityChange,
  error: externalError,
  className,
}: ExternalApplyUrlFieldProps) {
  const [touched, setTouched] = useState(false)
  const [blurError, setBlurError] = useState<string | null>(null)

  function validateNow(url: string) {
    if (!url.trim()) {
      setBlurError(null)
      onValidityChange?.(false)
      return
    }

    const result = validateDomainMatch(url, companyDomains, 'ar')
    if (!result.valid) {
      setBlurError(result.message)
      onValidityChange?.(false)
      return
    }

    setBlurError(null)
    onValidityChange?.(true)
  }

  const displayError = externalError ?? (touched ? blurError : null)

  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={id} className="font-arabic text-foreground">
        رابط التقديم الخارجي
      </Label>
      <p className="font-arabic text-xs text-foreground/60">
        يجب أن يكون الرابط ضمن النطاقات المعتمدة لجهتك
      </p>
      <Input
        id={id}
        type="url"
        dir="ltr"
        value={value}
        onChange={(event) => {
          onChange(event.target.value)
          if (touched) validateNow(event.target.value)
        }}
        onBlur={() => {
          setTouched(true)
          validateNow(value)
        }}
        placeholder="https://careers.example.com/jobs/123"
        aria-invalid={Boolean(displayError)}
        className={cn('border-border', displayError && 'border-red-500')}
      />
      {displayError ? (
        <p className="font-arabic text-xs text-red-600" role="alert">
          {displayError}
        </p>
      ) : null}
    </div>
  )
}

type TagInputProps = {
  label: string
  hint?: string
  items: string[]
  maxItems?: number
  onChange: (items: string[]) => void
  error?: string
}

export function TagInput({ label, hint, items, maxItems = 20, onChange, error }: TagInputProps) {
  const [draft, setDraft] = useState('')

  function addTag() {
    const value = draft.trim()
    if (!value || items.includes(value)) return
    if (items.length >= maxItems) return
    onChange([...items, value])
    setDraft('')
  }

  return (
    <div className="space-y-2">
      <Label className="font-arabic text-foreground">{label}</Label>
      {hint ? <p className="font-arabic text-xs text-foreground/60">{hint}</p> : null}
      <div className="flex flex-wrap gap-2">
        {items.map((item, index) => (
          <span
            key={`${item}-${index}`}
            className="inline-flex items-center gap-1 rounded-full bg-background px-3 py-1 font-arabic text-xs text-foreground"
          >
            {item}
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground"
              aria-label={`إزالة ${item}`}
              onClick={() => onChange(items.filter((_, i) => i !== index))}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              addTag()
            }
          }}
          placeholder="أضف مهارة ثم Enter"
          disabled={items.length >= maxItems}
          className="font-arabic border-border"
        />
        <Button
          type="button"
          variant="outline"
          disabled={!draft.trim() || items.length >= maxItems}
          onClick={addTag}
          className="shrink-0 font-arabic"
        >
          إضافة
        </Button>
      </div>
      {error ? (
        <p className="font-arabic text-xs text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
