'use client'

import { Check } from 'lucide-react'
import { useTranslations } from 'next-intl'
import {
  PASSWORD_REQUIREMENT_CHECKS,
  type PasswordRequirementKey,
} from '@/lib/utils/validators'
import { cn } from '@/lib/utils'

const REQUIREMENT_ORDER: PasswordRequirementKey[] = [
  'length',
  'uppercase',
  'lowercase',
  'number',
  'special',
]

type PasswordRequirementsPanelProps = {
  password: string
  className?: string
}

/** Part 4 — live password policy checklist (updates on every keystroke). */
export function PasswordRequirementsPanel({ password, className }: PasswordRequirementsPanelProps) {
  const t = useTranslations('auth.password.requirements')

  return (
    <ul className={cn('space-y-1.5', className)} aria-live="polite">
      {REQUIREMENT_ORDER.map((key) => {
        const met = PASSWORD_REQUIREMENT_CHECKS[key](password)

        return (
          <li key={key} className="flex items-center gap-2 text-xs">
            <span
              className={cn(
                'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors duration-fast ease-jid',
                met
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-transparent text-transparent',
              )}
              aria-hidden
            >
              <Check className="h-3 w-3" strokeWidth={3} />
            </span>
            <span className={cn('transition-colors duration-fast ease-jid', met ? 'text-primary' : 'text-muted-foreground')}>
              {t(key)}
            </span>
          </li>
        )
      })}
    </ul>
  )
}
