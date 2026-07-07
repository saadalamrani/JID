'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/lib/i18n/navigation'
import type { SysMentorApplicationRow } from '@/types/sys-mentor-applications'
import {
  approveMentorApplication,
  overrideMentorRejection,
  rejectMentorApplication,
  suspendApprovedMentor,
} from '@/app/[locale]/(sys)/sys/mentor-applications/actions'
import { ConfirmDialog } from '@/app/[locale]/(sys)/sys/flags/_components/confirm-dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type PendingAction =
  | { type: 'approve' }
  | { type: 'reject' }
  | { type: 'override' }
  | { type: 'suspend' }

type MentorApplicationActionsProps = {
  application: SysMentorApplicationRow
}

export function MentorApplicationActions({ application }: MentorApplicationActionsProps) {
  const t = useTranslations('sys.mentorApplications.actions')
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')

  const status = application.status

  const openAction = (action: PendingAction) => {
    setError(null)
    setPendingAction(action)
    setConfirmOpen(true)
  }

  const handleConfirm = async (reason: string) => {
    if (!pendingAction) return

    let result: Awaited<ReturnType<typeof approveMentorApplication>>

    switch (pendingAction.type) {
      case 'approve':
        result = await approveMentorApplication(application.user_id, reason)
        break
      case 'override':
        result = await overrideMentorRejection(application.user_id, reason)
        break
      case 'suspend':
        result = await suspendApprovedMentor(application.user_id, reason)
        break
      case 'reject':
        result = await rejectMentorApplication(application.user_id, reason, rejectionReason)
        break
      default:
        return
    }

    if (!result.ok) {
      setError(result.error)
      throw new Error(result.error)
    }

    setError(null)
    startTransition(() => router.refresh())
  }

  const confirmTitle = (() => {
    switch (pendingAction?.type) {
      case 'approve':
        return t('confirm.approveTitle')
      case 'reject':
        return t('confirm.rejectTitle')
      case 'override':
        return t('confirm.overrideTitle')
      case 'suspend':
        return t('confirm.suspendTitle')
      default:
        return t('confirm.defaultTitle')
    }
  })()

  return (
    <div className="flex flex-wrap items-center gap-2">
      {error ? <p className="w-full text-xs text-red-600">{error}</p> : null}

      {['pending_review', 'under_review', 'pending'].includes(status) ? (
        <>
          <Button type="button" size="sm" variant="outline" disabled={pending} onClick={() => openAction({ type: 'approve' })}>
            {t('approve')}
          </Button>
          <Button type="button" size="sm" variant="destructive" disabled={pending} onClick={() => openAction({ type: 'reject' })}>
            {t('reject')}
          </Button>
        </>
      ) : null}

      {status === 'rejected' ? (
        <Button type="button" size="sm" variant="outline" disabled={pending} onClick={() => openAction({ type: 'override' })}>
          {t('overrideRejection')}
        </Button>
      ) : null}

      {status === 'approved' ? (
        <Button type="button" size="sm" variant="destructive" disabled={pending} onClick={() => openAction({ type: 'suspend' })}>
          {t('suspend')}
        </Button>
      ) : null}

      {pendingAction?.type === 'reject' ? (
        <input
          type="text"
          value={rejectionReason}
          onChange={(e) => setRejectionReason(e.target.value)}
          placeholder={t('rejectionReasonPlaceholder')}
          className="h-8 rounded-md border border-jid-line px-2 text-xs"
        />
      ) : null}

      <span
        className={cn(
          'rounded-full px-2 py-0.5 text-xs font-medium',
          status === 'approved'
            ? 'bg-emerald-50 text-emerald-700'
            : status === 'rejected' || status === 'suspended'
              ? 'bg-red-100 text-red-700'
              : 'bg-jid-beige text-jid-ink/70',
        )}
      >
        {t(`statuses.${status}`, { default: status })}
      </span>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={confirmTitle}
        description={t('confirm.defaultDescription')}
        destructive={pendingAction?.type === 'reject' || pendingAction?.type === 'suspend'}
        onConfirm={handleConfirm}
      />
    </div>
  )
}
