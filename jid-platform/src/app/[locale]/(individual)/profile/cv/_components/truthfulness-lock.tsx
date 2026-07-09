'use client'

import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

type TruthfulnessLockProps = {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  className?: string
  disabled?: boolean
}

/**
 * Mandatory confirmation for AI-touched quantified claims (Prompt 1).
 */
export function TruthfulnessLock({
  checked,
  onCheckedChange,
  className,
  disabled = false,
}: TruthfulnessLockProps) {
  const t = useTranslations('cv.builder.truthfulness')

  return (
    <label
      className={cn(
        'flex items-start gap-3 rounded-lg border border-jid-gold/35 bg-jid-beige-warm/60 p-3',
        className,
      )}
    >
      <input
        type="checkbox"
        className="mt-1 h-4 w-4 rounded border-border text-jid-olive focus:ring-jid-gold"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onCheckedChange(event.target.checked)}
        aria-describedby="cv-truthfulness-hint"
      />
      <span className="space-y-1">
        <span className="block font-arabic text-sm font-medium text-jid-olive">{t('title')}</span>
        <span id="cv-truthfulness-hint" className="block font-arabic text-xs leading-relaxed text-jid-ink-soft">
          {t('description')}
        </span>
      </span>
    </label>
  )
}
