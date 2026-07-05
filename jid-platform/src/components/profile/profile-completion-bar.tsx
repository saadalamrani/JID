'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

type ProfileCompletionBarProps = {
  percent: number
  showLabel?: boolean
  className?: string
}

export function ProfileCompletionBar({
  percent,
  showLabel = true,
  className,
}: ProfileCompletionBarProps) {
  const t = useTranslations('profile.components')
  const prefersReducedMotion = useReducedMotion()
  const clamped = Math.max(0, Math.min(100, percent))

  return (
    <div className={cn('space-y-2', className)}>
      {showLabel ? (
        <div className="flex items-center justify-between text-sm">
          <span className="text-jid-ink/70">{t('completionLabel')}</span>
          <span className="font-medium text-jid-olive">{clamped}%</span>
        </div>
      ) : null}
      <div
        className="h-2.5 w-full overflow-hidden rounded-full bg-jid-line/40"
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={t('completionLabel')}
      >
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-jid-olive to-jid-gold"
          initial={prefersReducedMotion ? { width: `${clamped}%` } : { width: 0 }}
          animate={{ width: `${clamped}%` }}
          transition={
            prefersReducedMotion
              ? { duration: 0 }
              : { duration: 0.65, ease: [0.22, 1, 0.36, 1] }
          }
        />
      </div>
    </div>
  )
}
