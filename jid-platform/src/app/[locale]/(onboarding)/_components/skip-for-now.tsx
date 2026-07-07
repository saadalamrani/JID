'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { track } from '@/lib/analytics/track'
import { skipOnboardingAction } from '@/lib/onboarding/actions'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

/** Section 10 — skip onboarding with confirmation dialog. */
export function SkipForNow() {
  const t = useTranslations('onboarding.skip')
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleConfirm() {
    setError(null)
    track('onboarding_skipped')
    startTransition(async () => {
      const result = await skipOnboardingAction()
      if (!result.ok) {
        setError(t('error'))
      }
    })
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-jid-ink/70 hover:text-jid-olive"
        onClick={() => setOpen(true)}
        disabled={isPending}
      >
        {t('label')}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('confirmTitle')}</DialogTitle>
            <DialogDescription>{t('skipConfirm')}</DialogDescription>
          </DialogHeader>
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
              {t('cancel')}
            </Button>
            <Button type="button" onClick={handleConfirm} disabled={isPending}>
              {isPending ? t('confirming') : t('confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
