'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/lib/i18n/navigation'
import type { EmergencyActionRow } from '@/lib/sys/emergency-queries'
import {
  revertMaintenanceMode,
  revertRegistrationsOpen,
} from '@/app/[locale]/(sys)/sys/system/emergency/actions'
import { ConfirmDialog } from '@/app/[locale]/(sys)/sys/flags/_components/confirm-dialog'
import { Button } from '@/components/ui/button'

type EmergencyHistoryProps = {
  actions: EmergencyActionRow[]
}

export function EmergencyHistory({ actions }: EmergencyHistoryProps) {
  const t = useTranslations('sys.emergency.history')
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [revertId, setRevertId] = useState<string | null>(null)
  const [revertType, setRevertType] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleRevert = async (reason: string) => {
    if (!revertId || !revertType) return

    let result: Awaited<ReturnType<typeof revertMaintenanceMode>>
    if (revertType === 'maintenance_mode') {
      result = await revertMaintenanceMode(revertId, reason)
    } else if (revertType === 'registrations_open') {
      result = await revertRegistrationsOpen(revertId, reason)
    } else {
      return
    }

    if (!result.ok) {
      setError(result.error)
      throw new Error(result.error)
    }

    setError(null)
    startTransition(() => router.refresh())
  }

  if (actions.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-jid-line p-6 text-center text-sm text-jid-ink/50">
        {t('empty')}
      </p>
    )
  }

  return (
    <>
      {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}
      <ul className="divide-y divide-jid-line rounded-lg border border-jid-line bg-white">
        {actions.map((action) => (
          <li key={action.id} className="p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium text-jid-ink">{t(`types.${action.action_type}`, { default: action.action_type })}</p>
                <p className="mt-1 text-sm text-jid-ink/60">{action.reason}</p>
                <p className="mt-1 text-xs text-jid-ink/45">
                  {action.activator_name ?? action.activated_by.slice(0, 8)} ·{' '}
                  {new Date(action.activated_at).toLocaleString()}
                </p>
                {action.reverted_at ? (
                  <p className="mt-1 text-xs text-emerald-700">
                    {t('reverted', {
                      by: action.reverter_name ?? action.reverted_by?.slice(0, 8) ?? '—',
                      at: new Date(action.reverted_at).toLocaleString(),
                    })}
                  </p>
                ) : null}
              </div>
              {action.is_active ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={pending}
                  onClick={() => {
                    setRevertId(action.id)
                    setRevertType(action.action_type)
                  }}
                >
                  {t('revert')}
                </Button>
              ) : (
                <span className="text-xs text-jid-ink/45">{t('inactive')}</span>
              )}
            </div>
          </li>
        ))}
      </ul>

      <ConfirmDialog
        open={Boolean(revertId)}
        onOpenChange={(open) => {
          if (!open) {
            setRevertId(null)
            setRevertType(null)
          }
        }}
        title={t('confirmRevertTitle')}
        description={t('confirmRevertDescription')}
        onConfirm={handleRevert}
      />
    </>
  )
}
