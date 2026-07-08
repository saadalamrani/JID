'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/lib/i18n/navigation'
import type { SysActiveSessionRow } from '@/lib/sys/sessions-admin-queries'
import {
  revokeAllPlatformSessions,
  revokePlatformSession,
} from '@/app/[locale]/(sys)/sys/system/sessions/actions'
import { ConfirmDialog } from '@/app/[locale]/(sys)/sys/flags/_components/confirm-dialog'
import { Button } from '@/components/ui/button'
import { Link } from '@/lib/i18n/navigation'

type SessionsTableProps = {
  sessions: SysActiveSessionRow[]
}

export function SessionsTable({ sessions }: SessionsTableProps) {
  const t = useTranslations('sys.sessions')
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [bulkConfirm, setBulkConfirm] = useState(false)
  const [target, setTarget] = useState<SysActiveSessionRow | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleRevokeOne = async (reason: string) => {
    if (!target) return
    const result = await revokePlatformSession(target.id, target.user_id, reason)
    if (!result.ok) {
      setError(result.error)
      throw new Error(result.error)
    }
    setError(null)
    startTransition(() => router.refresh())
  }

  const handleBulkRevoke = async (reason: string) => {
    const result = await revokeAllPlatformSessions(reason)
    if (!result.ok) {
      setError(result.error)
      throw new Error(result.error)
    }
    setError(null)
    startTransition(() => router.refresh())
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{t('summary', { count: sessions.length })}</p>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          disabled={pending || sessions.length === 0}
          onClick={() => setBulkConfirm(true)}
        >
          {t('bulkRevoke')}
        </Button>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="min-w-full text-sm">
          <thead className="bg-background/50 text-start">
            <tr>
              <th className="px-4 py-3 font-medium">{t('columns.user')}</th>
              <th className="px-4 py-3 font-medium">{t('columns.device')}</th>
              <th className="px-4 py-3 font-medium">{t('columns.lastActive')}</th>
              <th className="px-4 py-3 font-medium">{t('columns.expires')}</th>
              <th className="px-4 py-3 font-medium">{t('columns.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sessions.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  {t('empty')}
                </td>
              </tr>
            ) : (
              sessions.map((session) => (
                <tr key={session.id}>
                  <td className="px-4 py-3">
                    <Link href={`/sys/users/${session.user_id}`} className="text-primary hover:underline">
                      {session.user_name ?? session.user_id.slice(0, 8)}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {session.device_label ?? '—'}
                    <p className="text-xs text-muted-foreground">{session.ip_address ?? ''}</p>
                  </td>
                  <td className="px-4 py-3">{new Date(session.last_active_at).toLocaleString()}</td>
                  <td className="px-4 py-3">{new Date(session.expires_at).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={pending}
                      onClick={() => {
                        setTarget(session)
                        setConfirmOpen(true)
                      }}
                    >
                      {t('revoke')}
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={t('confirmRevokeTitle')}
        description={t('confirmRevokeDescription')}
        destructive
        onConfirm={handleRevokeOne}
      />

      <ConfirmDialog
        open={bulkConfirm}
        onOpenChange={setBulkConfirm}
        title={t('confirmBulkTitle')}
        description={t('confirmBulkDescription')}
        destructive
        onConfirm={handleBulkRevoke}
      />
    </div>
  )
}
