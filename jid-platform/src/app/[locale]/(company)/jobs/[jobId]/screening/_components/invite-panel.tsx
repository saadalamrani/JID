'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { inviteSsisApplicantsAction } from '@/lib/ssis/actions'
import type { SsisScreening } from '@/lib/ssis/types'

type ApplicantOption = {
  id: string
  label: string
  status: string
}

type InvitePanelProps = {
  jobId: string
  screening: SsisScreening
  applicants: ApplicantOption[]
  onInvited: () => void
}

export function InvitePanel({ jobId, screening, applicants, onInvited }: InvitePanelProps) {
  const t = useTranslations('company.ssis')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const eligible = applicants.filter((a) => !['draft', 'withdrawn'].includes(a.status))

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleInvite() {
    if (selected.size === 0) return
    setBusy(true)
    setMessage(null)
    try {
      const count = await inviteSsisApplicantsAction(screening.id, jobId, Array.from(selected))
      setMessage(t('invitedCount', { count }))
      setSelected(new Set())
      onInvited()
    } catch (e) {
      setMessage(e instanceof Error ? e.message : t('inviteError'))
    } finally {
      setBusy(false)
    }
  }

  if (screening.status !== 'active') return null

  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <h2 className="font-arabic text-lg font-semibold">{t('inviteTitle')}</h2>
      <p className="mt-1 font-arabic text-sm text-muted-foreground">{t('inviteSubtitle')}</p>

      <ul className="mt-4 max-h-64 space-y-2 overflow-y-auto">
        {eligible.length === 0 ? (
          <li className="font-arabic text-sm text-muted-foreground">{t('noApplicants')}</li>
        ) : (
          eligible.map((app) => (
            <li key={app.id}>
              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border px-3 py-2">
                <input
                  type="checkbox"
                  checked={selected.has(app.id)}
                  onChange={() => toggle(app.id)}
                  className="h-4 w-4"
                />
                <span className="min-w-0 flex-1 truncate font-arabic text-sm">{app.label}</span>
                <span className="font-arabic text-[10px] text-muted-foreground">{app.status}</span>
              </label>
            </li>
          ))
        )}
      </ul>

      {message ? (
        <p className="mt-3 font-arabic text-sm text-muted-foreground" role="status">
          {message}
        </p>
      ) : null}

      <Button
        type="button"
        className="mt-4 font-arabic"
        disabled={busy || selected.size === 0}
        onClick={() => void handleInvite()}
      >
        <Send className="ms-2 h-4 w-4" />
        {t('inviteCta', { count: selected.size })}
      </Button>
    </section>
  )
}
