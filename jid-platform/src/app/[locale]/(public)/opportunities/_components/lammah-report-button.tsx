'use client'

import { Flag } from 'lucide-react'
import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { reportLammahProblem } from '../lammah-actions'

export function LammahReportButton({ opportunityId }: { opportunityId: string }) {
  const t = useTranslations('opportunities.lammah')
  const [reported, setReported] = useState(false)
  const [failed, setFailed] = useState(false)
  const [pending, startTransition] = useTransition()

  if (reported) {
    return <span className="font-arabic text-xs text-sem-success">{t('reportReceived')}</span>
  }

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setFailed(false)
          startTransition(async () => {
            const result = await reportLammahProblem(opportunityId)
            if (result.ok) setReported(true)
            else setFailed(true)
          })
        }}
        className="inline-flex items-center gap-1 font-arabic text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline disabled:opacity-60"
      >
        <Flag className="h-3.5 w-3.5" aria-hidden />
        {pending ? t('reportSending') : t('reportProblem')}
      </button>
      {failed ? <span className="font-arabic text-xs text-destructive">{t('reportError')}</span> : null}
    </span>
  )
}
