'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/lib/i18n/navigation'
import type { SysUserDetail } from '@/types/sys-users'
import { MENTOR_ROLE_BLOCKED_ERROR } from '@/types/sys-users'
import { USER_ROLES, type UserRole } from '@/lib/auth/rbac'
import {
  changeUserRole,
  forceLogoutUser,
  reinstateUser,
  suspendUser,
} from '@/app/[locale]/(sys)/sys/users/actions'
import { ConfirmDialog } from '@/app/[locale]/(sys)/sys/flags/_components/confirm-dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

const ASSIGNABLE_ROLES: UserRole[] = USER_ROLES.filter((role) => role !== 'entity')

type PendingAction =
  | { type: 'logout' }
  | { type: 'suspend'; confirmSuperAdmin: boolean }
  | { type: 'reinstate' }
  | { type: 'role'; role: UserRole }

type UserActionsMenuProps = {
  user: SysUserDetail
  actorUserId?: string
}

/** Section 8.3 — super_admin user actions (broader than Staff Portal). */
export function UserActionsMenu({ user, actorUserId }: UserActionsMenuProps) {
  const t = useTranslations('sys.users.actions')
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)
  const [selectedRole, setSelectedRole] = useState<UserRole>(user.role)
  const [error, setError] = useState<string | null>(null)
  const [superAdminConfirm, setSuperAdminConfirm] = useState(false)

  const isSelf = actorUserId === user.id
  const isTargetSuperAdmin = user.role === 'super_admin'

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
        result = await suspendUser(user.id, reason, pendingAction.confirmSuperAdmin)
        break
      case 'reinstate':
        result = await reinstateUser(user.id, reason)
        break
      case 'role':
        result = await changeUserRole(user.id, pendingAction.role, reason)
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
      case 'logout':
        return t('confirm.logoutTitle')
      case 'suspend':
        return t('confirm.suspendTitle')
      case 'reinstate':
        return t('confirm.reinstateTitle')
      case 'role':
        return t('confirm.roleTitle', { role: pendingAction.role })
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
      case 'role':
        return t('confirm.roleDescription')
      default:
        return t('confirm.defaultDescription')
    }
  })()

  return (
    <div className="rounded-lg border border-jid-line bg-white p-5">
      <h2 className="text-sm font-semibold text-jid-ink">{t('title')}</h2>
      <p className="mt-1 text-sm text-jid-ink/55">{t('subtitle')}</p>

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={() => openAction({ type: 'logout' })}
        >
          {t('endSessions')}
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
            onClick={() => {
              if (isTargetSuperAdmin && !superAdminConfirm) {
                setError(t('superAdminConfirmRequired'))
                return
              }
              openAction({ type: 'suspend', confirmSuperAdmin: superAdminConfirm })
            }}
          >
            {t('suspend')}
          </Button>
        )}
      </div>

      {isTargetSuperAdmin && !user.suspended_at ? (
        <label className="mt-4 flex items-center gap-2 text-sm text-jid-ink/70">
          <input
            type="checkbox"
            checked={superAdminConfirm}
            onChange={(event) => setSuperAdminConfirm(event.target.checked)}
            className="h-4 w-4 rounded border-jid-line"
          />
          {t('superAdminConfirmLabel')}
        </label>
      ) : null}

      <div className="mt-6 space-y-2 border-t border-jid-line pt-4">
        <Label htmlFor="change-role">{t('changeRole')}</Label>
        <div className="flex flex-wrap items-end gap-2">
          <select
            id="change-role"
            value={selectedRole}
            onChange={(event) => setSelectedRole(event.target.value as UserRole)}
            disabled={pending || isSelf}
            className="h-10 min-w-[180px] rounded-md border border-jid-line bg-white px-3 text-sm"
          >
            {ASSIGNABLE_ROLES.map((role) => (
              <option key={role} value={role}>
                {t(`roles.${role}`)}
              </option>
            ))}
            <option value="mentor" disabled>
              {t('mentorBlockedOption')}
            </option>
          </select>
          <Button
            type="button"
            variant="outline"
            disabled={pending || isSelf || selectedRole === user.role}
            onClick={() => {
              if (selectedRole === ('mentor' as UserRole)) {
                setError(MENTOR_ROLE_BLOCKED_ERROR)
                return
              }
              openAction({ type: 'role', role: selectedRole })
            }}
          >
            {t('applyRole')}
          </Button>
        </div>
        <p className="text-xs text-jid-ink/45">{MENTOR_ROLE_BLOCKED_ERROR}</p>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={confirmTitle}
        description={confirmDescription}
        destructive={pendingAction?.type === 'suspend' || pendingAction?.type === 'logout'}
        onConfirm={handleConfirm}
      />
    </div>
  )
}
