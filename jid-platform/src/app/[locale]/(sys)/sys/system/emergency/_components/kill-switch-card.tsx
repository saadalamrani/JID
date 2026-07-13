'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/lib/i18n/navigation'
import { ConfirmDialog } from '@/app/[locale]/(sys)/sys/flags/_components/confirm-dialog'
import { cn } from '@/lib/utils'

type KillSwitchCardProps = {
  title: string
  description: string
  /** Raw on-state from platform_config (before invertDisplay). */
  isOn: boolean
  /** When true, switch appears ON when underlying value is OFF (registrations closed). */
  invertDisplay?: boolean
  disabled?: boolean
  onActivate: (reason: string) => Promise<void>
  onDeactivate: (reason: string) => Promise<void>
}

/** Section 11 — emergency kill switch card. */
export function KillSwitchCard({
  title,
  description,
  isOn,
  invertDisplay = false,
  disabled = false,
  onActivate,
  onDeactivate,
}: KillSwitchCardProps) {
  const t = useTranslations('sys.emergency.killSwitch')
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [nextOn, setNextOn] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const displayOn = invertDisplay ? !isOn : isOn

  const requestToggle = () => {
    setNextOn(!displayOn)
    setConfirmOpen(true)
  }

  const handleConfirm = async (reason: string) => {
    try {
      if (nextOn) {
        await onActivate(reason)
      } else {
        await onDeactivate(reason)
      }
      setError(null)
      startTransition(() => router.refresh())
    } catch (err) {
      const message = err instanceof Error ? err.message : t('failed')
      setError(message)
      throw err
    }
  }

  return (
    <>
      <div
        className={cn(
          'rounded-lg border bg-card p-5',
          displayOn ? 'border-destructive/50 shadow-sm shadow-destructive/10' : 'border-border',
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-semibold text-foreground">{title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={displayOn}
            disabled={disabled || pending}
            onClick={requestToggle}
            className={cn(
              'relative h-7 w-12 shrink-0 rounded-full transition-colors',
              displayOn ? 'bg-destructive' : 'bg-border',
              (disabled || pending) && 'opacity-50',
            )}
          >
            <span
              className={cn(
                'absolute top-0.5 h-6 w-6 rounded-full bg-card shadow transition-transform',
                displayOn ? 'translate-x-5' : 'translate-x-0.5',
              )}
            />
          </button>
        </div>
        <p className="mt-3 text-xs font-medium uppercase text-muted-foreground">
          {displayOn ? t('statusOn') : t('statusOff')}
        </p>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={nextOn ? t('confirmActivateTitle') : t('confirmDeactivateTitle')}
        description={nextOn ? t('confirmActivateDescription') : t('confirmDeactivateDescription')}
        destructive={nextOn}
        onConfirm={handleConfirm}
      />
    </>
  )
}
