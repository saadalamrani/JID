'use client'

import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type UnsavedChangesDialogProps = {
  open: boolean
  onStay: () => void
  onDiscard: () => void
}

export function UnsavedChangesDialog({ open, onStay, onDiscard }: UnsavedChangesDialogProps) {
  const t = useTranslations('organizationProfile.unsavedChanges')

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onStay()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('message')}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={onDiscard}>
            {t('discard')}
          </Button>
          <Button type="button" autoFocus onClick={onStay}>
            {t('stay')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
