'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import type { TalentInvitation } from '@/types/contracts/talent-sourcing'

type SourcingInvitationsPanelProps = {
  invitations: TalentInvitation[]
}

export function SourcingInvitationsPanel({ invitations }: SourcingInvitationsPanelProps) {
  const t = useTranslations('profile.sourcingInvitations')
  const locale = useLocale()
  const isAr = locale === 'ar'
  const [rows, setRows] = useState(invitations)

  async function respond(id: string, decision: 'interested' | 'declined') {
    const response = await fetch(`/api/me/sourcing-invitations/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision }),
    })
    const json = (await response.json()) as { error?: string }
    if (!response.ok) {
      toast.error(json.error ?? t('respondFailed'))
      return
    }
    setRows((current) =>
      current.map((row) =>
        row.id === id
          ? { ...row, state: decision === 'interested' ? 'INTERESTED' : 'DECLINED' }
          : row,
      ),
    )
    toast.success(t('responded'))
  }

  if (rows.length === 0) {
    return (
      <section className="space-y-2" data-testid="sourcing-invitations-empty">
        <h2 className="text-lg font-semibold">{t('title')}</h2>
        <p className="text-sm text-muted-foreground">{t('empty')}</p>
      </section>
    )
  }

  return (
    <section className="space-y-3" data-testid="sourcing-invitations">
      <h2 className="text-lg font-semibold">{t('title')}</h2>
      <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
      <ul className="space-y-3">
        {rows.map((row) => (
          <li key={row.id} className="space-y-3 rounded-xl border border-border p-4">
            <p className="text-sm">{isAr ? row.messageAr : row.messageEn}</p>
            <p className="text-xs text-muted-foreground">{t(`state.${row.state}`)}</p>
            {row.state === 'INVITED' ? (
              <div className="flex flex-wrap gap-2">
                <Button type="button" className="min-h-11" onClick={() => void respond(row.id, 'interested')}>
                  {t('interested')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11"
                  onClick={() => void respond(row.id, 'declined')}
                >
                  {t('declined')}
                </Button>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  )
}
