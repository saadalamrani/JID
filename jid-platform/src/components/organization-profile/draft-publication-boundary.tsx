'use client'

import { useEffect, useId, useRef, useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { Link, useRouter } from '@/lib/i18n/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  publishOwnedProfileAction,
  unpublishOwnedProfileAction,
  type PublicationActionResult,
} from '@/lib/profile/publication-actions'
import type { OrganizationProfileType, PublicationErrorCode } from '@/lib/profile/publication'
import { cn } from '@/lib/utils'

export type DraftPublicationBoundaryProps = {
  profileId: string
  profileType: OrganizationProfileType
  status: string
  /** Directory slug used to build the public Profile href when published. */
  publicSlug?: string | null
  editHref: string
}

type UiStatus = 'draft' | 'published' | 'suspended' | string

function publicHref(profileType: OrganizationProfileType, slug: string): string {
  return profileType === 'university'
    ? `/universities/${slug}/profile`
    : `/companies/${slug}/profile`
}

export function DraftPublicationBoundary({
  profileId,
  profileType,
  status: initialStatus,
  publicSlug,
  editHref,
}: DraftPublicationBoundaryProps) {
  const t = useTranslations('organizationProfile.publication')
  const tErrors = useTranslations('organizationProfile.publication.errors')
  const router = useRouter()
  const statusId = useId()
  const publishTriggerRef = useRef<HTMLButtonElement>(null)
  const unpublishTriggerRef = useRef<HTMLButtonElement>(null)

  const [status, setStatus] = useState<UiStatus>(initialStatus)
  const [announce, setAnnounce] = useState('')
  const [errorCode, setErrorCode] = useState<PublicationErrorCode | null>(null)
  const [publishOpen, setPublishOpen] = useState(false)
  const [unpublishOpen, setUnpublishOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [isPending, startTransition] = useTransition()
  const busy = submitting || isPending

  useEffect(() => {
    setStatus(initialStatus)
  }, [initialStatus])

  const profileLink =
    status === 'published' && publicSlug ? publicHref(profileType, publicSlug) : null

  function applyResult(result: PublicationActionResult, mode: 'publish' | 'unpublish') {
    if (result.ok) {
      setStatus(result.status)
      setErrorCode(null)
      setAnnounce(mode === 'publish' ? t('announcePublished') : t('announceUnpublished'))
      router.refresh()
      return
    }
    setErrorCode(result.error)
    setAnnounce(tErrors(result.error))
  }

  function confirmPublish() {
    if (submitting) return
    setSubmitting(true)
    startTransition(async () => {
      try {
        const result = await publishOwnedProfileAction({ profileType, profileId })
        applyResult(result, 'publish')
        setPublishOpen(false)
        queueMicrotask(() => publishTriggerRef.current?.focus())
      } finally {
        setSubmitting(false)
      }
    })
  }

  function confirmUnpublish() {
    if (submitting) return
    setSubmitting(true)
    startTransition(async () => {
      try {
        const result = await unpublishOwnedProfileAction({ profileType, profileId })
        applyResult(result, 'unpublish')
        setUnpublishOpen(false)
        queueMicrotask(() => unpublishTriggerRef.current?.focus())
      } finally {
        setSubmitting(false)
      }
    })
  }

  if (status === 'suspended') {
    return (
      <div
        role="status"
        className="space-y-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-950"
      >
        <p className="font-medium">{t('suspendedTitle')}</p>
        <p>{t('suspendedBody')}</p>
      </div>
    )
  }

  const missingFields: Array<'display_name_ar' | 'about_ar'> = []
  if (errorCode === 'missing_display_name_ar' || errorCode === 'missing_display_name_ar_and_about_ar') {
    missingFields.push('display_name_ar')
  }
  if (errorCode === 'missing_about_ar' || errorCode === 'missing_display_name_ar_and_about_ar') {
    missingFields.push('about_ar')
  }

  return (
    <div className="space-y-3 rounded-lg border border-border bg-background/80 px-4 py-3 text-sm text-foreground">
      <p id={statusId} role="status" className="sr-only" aria-live="polite">
        {announce}
      </p>

      {status === 'draft' ? (
        <div className="space-y-3">
          <div>
            <p className="font-medium text-foreground">{t('draftTitle')}</p>
            <p className="mt-1 text-foreground/75">{t('draftBody')}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              ref={publishTriggerRef}
              type="button"
              className="min-h-11"
              disabled={busy}
              onClick={() => {
                setErrorCode(null)
                setPublishOpen(true)
              }}
              aria-describedby={statusId}
            >
              {t('publish')}
            </Button>
            <Button type="button" variant="outline" className="min-h-11" asChild>
              <Link href={editHref}>{t('editProfile')}</Link>
            </Button>
          </div>
        </div>
      ) : null}

      {status === 'published' ? (
        <div className="space-y-3">
          <div>
            <p className="font-medium text-foreground">{t('publishedTitle')}</p>
            <p className="mt-1 text-foreground/75">{t('publishedBody')}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {profileLink ? (
              <Link
                href={profileLink}
                className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                {t('viewPublicProfile')}
              </Link>
            ) : null}
            <Button
              ref={unpublishTriggerRef}
              type="button"
              variant="outline"
              className="min-h-11"
              disabled={busy}
              onClick={() => {
                setErrorCode(null)
                setUnpublishOpen(true)
              }}
            >
              {t('unpublish')}
            </Button>
          </div>
        </div>
      ) : null}

      {errorCode ? (
        <div
          role="alert"
          className={cn(
            'rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-amber-950',
          )}
        >
          <p>{tErrors(errorCode)}</p>
          {missingFields.length > 0 ? (
            <ul className="mt-2 list-disc ps-5">
              {missingFields.map((field) => (
                <li key={field}>{t(`missingFields.${field}`)}</li>
              ))}
            </ul>
          ) : null}
          {(errorCode.startsWith('missing_') || errorCode === 'unknown') && (
            <p className="mt-2">
              <Link href={editHref} className="font-medium underline underline-offset-4">
                {t('editProfile')}
              </Link>
            </p>
          )}
        </div>
      ) : null}

      <Dialog
        open={publishOpen}
        onOpenChange={(open) => {
          if (busy) return
          setPublishOpen(open)
          if (!open) queueMicrotask(() => publishTriggerRef.current?.focus())
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('confirmPublishTitle')}</DialogTitle>
            <DialogDescription>{t('confirmPublishBody')}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => setPublishOpen(false)}
            >
              {t('cancel')}
            </Button>
            <Button type="button" disabled={busy} onClick={confirmPublish} autoFocus>
              {busy ? t('publishing') : t('confirmPublish')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={unpublishOpen}
        onOpenChange={(open) => {
          if (busy) return
          setUnpublishOpen(open)
          if (!open) queueMicrotask(() => unpublishTriggerRef.current?.focus())
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('confirmUnpublishTitle')}</DialogTitle>
            <DialogDescription>{t('confirmUnpublishBody')}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => setUnpublishOpen(false)}
            >
              {t('cancel')}
            </Button>
            <Button type="button" disabled={busy} onClick={confirmUnpublish} autoFocus>
              {busy ? t('unpublishing') : t('confirmUnpublish')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
