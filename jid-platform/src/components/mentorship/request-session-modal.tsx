'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { ProfileAvatar } from '@/components/profile/profile-avatar'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { INTENT_STATEMENT_MIN_LENGTH } from '@/lib/validations/mentorship-request'
import { MENTOR_MEDIUM_OPTIONS } from '@/lib/mentor-application/constants'
import type { MenteeSnapshot } from '@/types/mentorship-request'
import { cn } from '@/lib/utils'

type RequestSessionModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  mentorId: string
  mentorName: string
  mentorHeadline?: string | null
  expertiseAreas?: string[]
  onSuccess?: () => void
}

function formatList(values: string[], empty: string): string {
  return values.length > 0 ? values.join(' · ') : empty
}

export function RequestSessionModal({
  open,
  onOpenChange,
  mentorId,
  mentorName,
  mentorHeadline,
  expertiseAreas = [],
  onSuccess,
}: RequestSessionModalProps) {
  const t = useTranslations('mentorship.request')
  const locale = useLocale()
  const [snapshot, setSnapshot] = useState<MenteeSnapshot | null>(null)
  const [loadingSnapshot, setLoadingSnapshot] = useState(false)
  const [focusArea, setFocusArea] = useState('')
  const [preferredMedium, setPreferredMedium] = useState('')
  const [intentStatement, setIntentStatement] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const trimmedIntent = intentStatement.trim()
  const intentValid = trimmedIntent.length >= INTENT_STATEMENT_MIN_LENGTH

  useEffect(() => {
    if (!open) {
      setFocusArea('')
      setPreferredMedium('')
      setIntentStatement('')
      return
    }

    let cancelled = false
    setLoadingSnapshot(true)

    void fetch('/api/me/mentorship-profile-snapshot', { credentials: 'include' })
      .then(async (response) => {
        if (response.status === 401) {
          throw new Error('UNAUTHORIZED')
        }
        const body = (await response.json()) as {
          snapshot?: MenteeSnapshot
          error?: string
        }
        if (!response.ok) {
          throw new Error(body.error ?? t('loadError'))
        }
        if (!cancelled) {
          setSnapshot(body.snapshot ?? null)
        }
      })
      .catch((error: Error) => {
        if (!cancelled) {
          if (error.message === 'UNAUTHORIZED') {
            toast.error(t('loginRequired'))
            onOpenChange(false)
            window.location.href = `/${locale}/login`
            return
          }
          toast.error(error.message)
          onOpenChange(false)
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingSnapshot(false)
      })

    return () => {
      cancelled = true
    }
  }, [open, locale, onOpenChange, t])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!intentValid || submitting) return

    setSubmitting(true)
    try {
      const response = await fetch('/api/mentorship-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          mentor_id: mentorId,
          intent_statement: trimmedIntent,
          focus_area: focusArea.trim() || null,
          preferred_medium: preferredMedium || null,
        }),
      })

      const body = (await response.json().catch(() => null)) as { error?: string } | null

      if (response.status === 401) {
        toast.error(t('loginRequired'))
        window.location.href = `/${locale}/login`
        return
      }

      if (!response.ok) {
        throw new Error(body?.error ?? t('submitError'))
      }

      toast.success(t('submitSuccess'))
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('submitError'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-border bg-white sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-arabic text-foreground">{t('title')}</DialogTitle>
          <DialogDescription className="font-arabic text-foreground/60">
            {t('subtitle', { name: mentorName })}
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-border/60 bg-background/30 px-3 py-2 font-arabic text-sm">
          <p className="font-medium text-foreground">{mentorName}</p>
          {mentorHeadline ? <p className="text-foreground/60">{mentorHeadline}</p> : null}
        </div>

        <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
          <section className="rounded-xl border border-border bg-white p-4">
            <h3 className="mb-3 font-arabic text-sm font-medium text-foreground/70">
              {t('snapshotTitle')}
            </h3>
            {loadingSnapshot ? (
              <div className="flex items-center justify-center py-6 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                <span className="sr-only">{t('loadingSnapshot')}</span>
              </div>
            ) : snapshot ? (
              <div className="flex gap-3">
                <ProfileAvatar
                  src={snapshot.avatar_url}
                  alt={snapshot.full_name ?? t('unnamed')}
                  size="sm"
                  variant="circle"
                />
                <dl className="min-w-0 flex-1 space-y-2 font-arabic text-sm">
                  <SnapshotRow label={t('fieldName')} value={snapshot.full_name} />
                  <SnapshotRow label={t('fieldHeadline')} value={snapshot.headline} />
                  <SnapshotRow label={t('fieldUniversity')} value={snapshot.university} />
                  <SnapshotRow label={t('fieldCollege')} value={snapshot.college} />
                  <SnapshotRow label={t('fieldCity')} value={snapshot.city} />
                  <SnapshotRow
                    label={t('fieldTargetSectors')}
                    value={formatList(snapshot.target_sectors, t('emptyValue'))}
                  />
                  <SnapshotRow
                    label={t('fieldProgramTypes')}
                    value={formatList(snapshot.target_program_types, t('emptyValue'))}
                  />
                </dl>
              </div>
            ) : (
              <p className="font-arabic text-sm text-muted-foreground">{t('snapshotUnavailable')}</p>
            )}
            <p className="mt-3 font-arabic text-xs text-foreground/45">{t('snapshotNote')}</p>
          </section>

          {expertiseAreas.length > 0 ? (
            <div className="space-y-1.5">
              <label htmlFor="focus-area" className="font-arabic text-sm font-medium text-foreground">
                {t('focusAreaLabel')}
              </label>
              <select
                id="focus-area"
                value={focusArea}
                onChange={(event) => setFocusArea(event.target.value)}
                className="w-full rounded-lg border border-border bg-white px-3 py-2 font-arabic text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <option value="">{t('focusAreaPlaceholder')}</option>
                {expertiseAreas.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div className="space-y-1.5">
            <label htmlFor="preferred-medium" className="font-arabic text-sm font-medium text-foreground">
              {t('preferredMediumLabel')}
            </label>
            <select
              id="preferred-medium"
              value={preferredMedium}
              onChange={(event) => setPreferredMedium(event.target.value)}
              className="w-full rounded-lg border border-border bg-white px-3 py-2 font-arabic text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <option value="">{t('preferredMediumPlaceholder')}</option>
              {MENTOR_MEDIUM_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {locale === 'en' ? option.labelEn : option.labelAr}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="intent-statement" className="font-arabic text-sm font-medium text-foreground">
              {t('intentLabel')}
            </label>
            <textarea
              id="intent-statement"
              value={intentStatement}
              onChange={(event) => setIntentStatement(event.target.value)}
              rows={5}
              maxLength={2000}
              placeholder={t('intentPlaceholder')}
              className="w-full resize-y rounded-lg border border-border bg-white px-3 py-2 font-arabic text-sm text-foreground placeholder:text-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
            <p
              className={cn(
                'font-arabic text-xs',
                intentValid ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              {t('intentCount', { count: trimmedIntent.length, min: INTENT_STATEMENT_MIN_LENGTH })}
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="font-arabic border-border"
            >
              {t('cancel')}
            </Button>
            <Button
              type="submit"
              disabled={!intentValid || submitting || loadingSnapshot || !snapshot}
              className="bg-primary font-arabic hover:bg-primary/90"
            >
              {submitting ? t('submitting') : t('submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function SnapshotRow({ label, value }: { label: string; value: string | null }) {
  if (!value?.trim()) return null
  return (
    <div>
      <dt className="text-xs text-foreground/45">{label}</dt>
      <dd className="text-foreground">{value}</dd>
    </div>
  )
}
