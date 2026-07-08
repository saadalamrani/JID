'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { dismissFlag, resolveFlag } from '@/app/[locale]/(staff)/staff/moderation/actions'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useRouter } from '@/lib/i18n/navigation'
import type { StaffFlagDetail } from '@/lib/staff/moderation-queries'

type FlagResolutionFormProps = {
  flag: StaffFlagDetail
}

export function FlagResolutionForm({ flag }: FlagResolutionFormProps) {
  const t = useTranslations('staff.moderation.resolution')
  const router = useRouter()
  const [notes, setNotes] = useState('')
  const [pending, startTransition] = useTransition()
  const isOpen = ['pending', 'under_review'].includes(flag.status)

  async function handleResolve(hideContent: boolean) {
    if (notes.trim().length < 3) {
      toast.error(t('notesRequired'))
      return
    }

    const result = await resolveFlag({
      flagId: flag.id,
      resolutionNotes: notes.trim(),
      hideContent,
    })

    if (!result.ok) {
      toast.error(result.error)
      return
    }

    toast.success(hideContent ? t('resolvedHidden') : t('resolved'))
    startTransition(() => {
      router.push('/staff/moderation')
      router.refresh()
    })
  }

  async function handleDismiss() {
    if (notes.trim().length < 3) {
      toast.error(t('notesRequired'))
      return
    }

    const result = await dismissFlag({ flagId: flag.id, resolutionNotes: notes.trim() })
    if (!result.ok) {
      toast.error(result.error)
      return
    }

    toast.success(t('dismissed'))
    startTransition(() => {
      router.push('/staff/moderation')
      router.refresh()
    })
  }

  if (!isOpen) {
    return (
      <div className="rounded-lg border border-border bg-background/40 p-4 text-sm text-muted-foreground">
        {t('alreadyClosed', { status: flag.status })}
        {flag.resolution_notes ? (
          <p className="mt-2 whitespace-pre-wrap">{flag.resolution_notes}</p>
        ) : null}
      </div>
    )
  }

  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-5">
      <h2 className="text-sm font-semibold text-foreground">{t('title')}</h2>
      <p className="text-sm text-muted-foreground">{t('subtitle')}</p>

      <div className="space-y-2">
        <Label htmlFor="resolution_notes">{t('notesLabel')}</Label>
        <textarea
          id="resolution_notes"
          rows={4}
          value={notes}
          disabled={pending}
          onChange={(event) => setNotes(event.target.value)}
          className="w-full rounded-md border border-border px-3 py-2 text-sm"
          placeholder={t('notesPlaceholder')}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          className="bg-primary hover:bg-primary/90"
          disabled={pending}
          onClick={() => void handleResolve(true)}
        >
          {t('resolveHidden')}
        </Button>
        <Button type="button" variant="outline" disabled={pending} onClick={() => void handleResolve(false)}>
          {t('resolveKeepVisible')}
        </Button>
        <Button type="button" variant="destructive" disabled={pending} onClick={() => void handleDismiss()}>
          {t('dismiss')}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">{t('hideTodo')}</p>
    </div>
  )
}
