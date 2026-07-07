'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/lib/i18n/navigation'
import type { SysStaffMemberDetail } from '@/lib/sys/staff-queries'
import { revokeStaffAccess } from '@/app/[locale]/(sys)/sys/staff/actions'
import { ConfirmDialog } from '@/app/[locale]/(sys)/sys/flags/_components/confirm-dialog'
import { Button } from '@/components/ui/button'

type StaffRevokeMenuProps = {
  member: SysStaffMemberDetail
  actorUserId?: string
}

export function StaffRevokeMenu({ member, actorUserId }: StaffRevokeMenuProps) {
  const t = useTranslations('sys.staff.detail')
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [superAdminConfirm, setSuperAdminConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isSelf = actorUserId === member.id
  const isTargetSuperAdmin = member.role === 'super_admin'

  const handleRevoke = async (reason: string) => {
    const result = await revokeStaffAccess(member.id, reason, superAdminConfirm)
    if (!result.ok) {
      setError(result.error)
      throw new Error(result.error)
    }
    setError(null)
    startTransition(() => router.push('/sys/staff'))
  }

  return (
    <div className="rounded-lg border border-jid-line bg-white p-5">
      <h2 className="text-sm font-semibold text-jid-ink">{t('actionsTitle')}</h2>
      <p className="mt-1 text-sm text-jid-ink/55">{t('actionsSubtitle')}</p>

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

      {isTargetSuperAdmin && !isSelf ? (
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

      <Button
        type="button"
        variant="destructive"
        className="mt-4"
        disabled={pending || isSelf || (isTargetSuperAdmin && !superAdminConfirm)}
        onClick={() => {
          if (isTargetSuperAdmin && !superAdminConfirm) {
            setError(t('superAdminConfirmRequired'))
            return
          }
          setConfirmOpen(true)
        }}
      >
        {t('revokeAccess')}
      </Button>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={t('confirm.revokeTitle')}
        description={t('confirm.revokeDescription')}
        destructive
        onConfirm={handleRevoke}
      />
    </div>
  )
}
