'use client'

import { useRef, type KeyboardEvent, type ClipboardEvent } from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type OtpInputProps = {
  value: string
  onChange: (value: string) => void
  length?: number
  disabled?: boolean
  autoFocus?: boolean
}

export function OtpInput({
  value,
  onChange,
  length = 6,
  disabled = false,
  autoFocus = false,
}: OtpInputProps) {
  const inputsRef = useRef<Array<HTMLInputElement | null>>([])

  const digits = value.padEnd(length, ' ').slice(0, length).split('')

  function updateAt(index: number, char: string) {
    const next = digits.map((d, i) => (i === index ? char : d === ' ' ? '' : d)).join('')
    onChange(next.replace(/\s/g, '').slice(0, length))
  }

  function focusIndex(index: number) {
    const input = inputsRef.current[index]
    input?.focus()
    input?.select()
  }

  function handleChange(index: number, nextValue: string) {
    const digit = nextValue.replace(/\D/g, '').slice(-1)
    if (!digit) {
      updateAt(index, '')
      return
    }
    updateAt(index, digit)
    if (index < length - 1) focusIndex(index + 1)
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Backspace' && !digits[index]?.trim()) {
      if (index > 0) {
        updateAt(index - 1, '')
        focusIndex(index - 1)
      }
      return
    }

    if (event.key === 'ArrowLeft' && index > 0) {
      focusIndex(index - 1)
    }

    if (event.key === 'ArrowRight' && index < length - 1) {
      focusIndex(index + 1)
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault()
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    onChange(pasted)
    focusIndex(Math.min(pasted.length, length - 1))
  }

  return (
    <div className="flex justify-center gap-2" dir="ltr">
      {digits.map((digit, index) => (
        <Input
          key={index}
          ref={(el) => {
            inputsRef.current[index] = el
          }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          value={digit.trim()}
          disabled={disabled}
          autoFocus={autoFocus && index === 0}
          className={cn(
            'h-12 w-10 text-center font-mono text-lg tabular-nums',
            'focus-visible:ring-jid-gold',
          )}
          onChange={(event) => handleChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={handlePaste}
          onFocus={(event) => event.target.select()}
          aria-label={`Digit ${index + 1}`}
        />
      ))}
    </div>
  )
}
