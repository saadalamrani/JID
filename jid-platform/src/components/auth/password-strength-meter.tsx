'use client'

import { useTranslations } from 'next-intl'
import { PASSWORD_REGEX } from '@/lib/validations/auth'
import { cn } from '@/lib/utils'

type PasswordStrengthMeterProps = {
  password: string
}

type StrengthLevel = 0 | 1 | 2 | 3 | 4

function scorePassword(password: string): StrengthLevel {
  if (!password) return 0

  let score = 0
  if (password.length >= 8) score += 1
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1
  if (/\d/.test(password)) score += 1
  if (/[^A-Za-z0-9]/.test(password)) score += 1

  return Math.min(score, 4) as StrengthLevel
}

const STRENGTH_KEYS = ['', 'weak', 'fair', 'good', 'strong'] as const

export function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  const t = useTranslations('auth.password')
  const score = scorePassword(password)
  const meetsPolicy = PASSWORD_REGEX.test(password)

  if (!password) return null

  return (
    <div className="space-y-2" aria-live="polite">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={cn(
              'h-1 flex-1 rounded-full bg-jid-line transition-colors',
              score >= level &&
                (score <= 1
                  ? 'bg-red-500'
                  : score === 2
                    ? 'bg-amber-500'
                    : score === 3
                      ? 'bg-jid-gold'
                      : 'bg-jid-olive'),
            )}
          />
        ))}
      </div>
      <p className="text-xs text-jid-ink/60">
        {meetsPolicy
          ? t(`strength.${STRENGTH_KEYS[score]}` as 'strength.weak')
          : t('strength.requirements')}
      </p>
    </div>
  )
}
