'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/lib/i18n/navigation'
import { ConfirmDialog } from '@/app/[locale]/(sys)/sys/flags/_components/confirm-dialog'
import {
  flagUserContent,
  forceLogoutUser,
  reinstateUser,
  suspendUser,
} from '@/app/[locale]/(staff)/staff/users/actions'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { FLAG_REASONS, type FlagReason } from '@/lib/validations/staff'
import type { StaffUserDetail } from '@/types/staff-users'

type PendingAction =
  | { type: 'logout' }
  | { type: 'suspend' }
  | { type: 'reinstate' }
  | { type: 'flag' }

type UserActionsMenuProps = {
  user: StaffUserDetail
  actorUserId?: string
}

/** Section 8.1 — staff user actions (no role changes). */
export function UserActionsMenu({ user, actorUserId }: UserActionsMenuProps) {
  const t = useTranslations('staff.users.actions')
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [flagPanelOpen, setFlagPanelOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [flagReason, setFlagReason] = useState<FlagReason>('inappropriate_content')
  const [flagDetails, setFlagDetails] = useState('')

  const isSelf = actorUserId === user.id

  const openAction = (action: PendingAction) => {
    setError(null)
    setPendingAction(action)
    setConfirmOpen(true)
  }

  const handleConfirm = async (reason: string) => {
    if (!pendingAction) return

    let result: Awaited<ReturnType<typeof suspendUser>>

    switch (pendingAction.type) {
      case 'logout':
        result = await forceLogoutUser(user.id, reason)
        break
      case 'suspend':
        result = await suspendUser({ userId: user.id, reason })
        break
      case 'reinstate':
        result = await reinstateUser(user.id, reason)
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

  const handleFlagSubmit = async () => {
    const result = await flagUserContent({
      targetType: 'profile',
      targetId: user.id,
      reason: flagReason,
      details: flagDetails.trim() || undefined,
    })

    if (!result.ok) {
      setError(result.error)
      return
    }

    setError(null)
    setFlagDetails('')
    setFlagPanelOpen(false)
    startTransition(() => router.refresh())
  }

  const confirmTitle = (() => {
    switch (pendingAction?.type) {
      case 'logout':
        return t('confirm.logoutTitle')
      case 'suspend':
        return t('confirm.suspendTitle')
      case 'reinstate':
        return t('confirm.reinstateTitle')
      default:
        return t('confirm.defaultTitle')
    }
  })()

  const confirmDescription = (() => {
    switch (pendingAction?.type) {
      case 'logout':
        return t('confirm.logoutDescription')
      case 'suspend':
        return t('confirm.suspendDescription')
      case 'reinstate':
        return t('confirm.reinstateDescription')
      default:
        return t('confirm.defaultDescription')
    }
  })()

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <h2 className="text-sm font-semibold text-foreground">{t('title')}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>

      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={() => openAction({ type: 'logout' })}
        >
          {t('endSessions')}
        </Button>

        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={() => {
            setError(null)
            setFlagPanelOpen((open) => !open)
          }}
        >
          {t('flagContent')}
        </Button>

        {user.suspended_at ? (
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => openAction({ type: 'reinstate' })}
          >
            {t('reinstate')}
          </Button>
        ) : (
          <Button
            type="button"
            variant="destructive"
            disabled={pending || isSelf}
            onClick={() => openAction({ type: 'suspend' })}
          >
            {t('suspend')}
          </Button>
        )}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={confirmTitle}
        description={confirmDescription}
        destructive={pendingAction?.type === 'suspend' || pendingAction?.type === 'logout'}
        onConfirm={handleConfirm}
      />

      {flagPanelOpen ? (
        <div className="mt-4 space-y-3 border-t border-border pt-4">
          <p className="text-sm font-medium text-foreground">{t('confirm.flagTitle')}</p>
          <p className="text-xs text-muted-foreground">{t('confirm.flagDescription')}</p>
          <Label htmlFor="flag-reason">{t('flagReasonLabel')}</Label>
          <select
            id="flag-reason"
            value={flagReason}
            onChange={(event) => setFlagReason(event.target.value as FlagReason)}
            className="flex h-10 w-full rounded-md border border-border bg-card px-3 text-sm"
          >
            {FLAG_REASONS.map((reason) => (
              <option key={reason} value={reason}>
                {t(`flagReasons.${reason}`)}
              </option>
            ))}
          </select>
          <Label htmlFor="flag-details">{t('flagDetailsLabel')}</Label>
          <textarea
            id="flag-details"
            rows={3}
            value={flagDetails}
            onChange={(event) => setFlagDetails(event.target.value)}
            className="w-full rounded-md border border-border px-3 py-2 text-sm"
            placeholder={t('flagDetailsPlaceholder')}
          />
          <Button type="button" variant="destructive" disabled={pending} onClick={() => void handleFlagSubmit()}>
            {t('submitFlag')}
          </Button>
        </div>
      ) : null}
    </div>
  )
}
