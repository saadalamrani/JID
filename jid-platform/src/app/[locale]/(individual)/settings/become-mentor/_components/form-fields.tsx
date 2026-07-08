'use client'

import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { BecomeMentorInput } from '@/lib/validations/become-mentor'

type TagInputProps = {
  label: string
  hint?: string
  items: string[]
  maxItems?: number
  onChange: (items: string[]) => void
  error?: string
  placeholder?: string
  addLabel?: string
}

export function TagInput({
  label,
  hint,
  items,
  maxItems = 5,
  onChange,
  error,
  placeholder,
  addLabel,
}: TagInputProps) {
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
      {hint ? <p className="font-arabic text-xs text-muted-foreground">{hint}</p> : null}
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
          placeholder={placeholder}
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
          {addLabel ?? 'إضافة'}
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

type MultiSelectChipsProps<T extends string> = {
  label: string
  hint?: string
  options: ReadonlyArray<{ value: T; label: string }>
  values: T[]
  onChange: (values: T[]) => void
  error?: string
}

export function MultiSelectChips<T extends string>({
  label,
  hint,
  options,
  values,
  onChange,
  error,
}: MultiSelectChipsProps<T>) {
  function toggle(value: T) {
    if (values.includes(value)) {
      onChange(values.filter((item) => item !== value))
      return
    }
    onChange([...values, value])
  }

  return (
    <div className="space-y-2">
      <Label className="font-arabic text-foreground">{label}</Label>
      {hint ? <p className="font-arabic text-xs text-muted-foreground">{hint}</p> : null}
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = values.includes(option.value)
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={selected}
              onClick={() => toggle(option.value)}
              className={`rounded-full border px-3 py-1.5 font-arabic text-xs transition-colors ${
                selected
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-card text-muted-foreground hover:border-primary/25'
              }`}
            >
              {option.label}
            </button>
          )
        })}
      </div>
      {error ? (
        <p className="font-arabic text-xs text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}

export type BecomeMentorFieldErrors = Partial<Record<keyof BecomeMentorInput, string>>
