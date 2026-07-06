'use client'

import { useTranslations } from 'next-intl'
import { Clock3 } from 'lucide-react'

type BecomeMentorPendingProps = {
  status: string
  submittedAt?: string | null
}

export function BecomeMentorPending({ status, submittedAt }: BecomeMentorPendingProps) {
  const t = useTranslations('mentorship.becomeMentor.pending')

  const submittedLabel =
    submittedAt != null
      ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(
          new Date(submittedAt),
        )
      : null

  return (
    <div className="container-jid max-w-2xl space-y-4 py-10">
      <div className="rounded-xl border border-jid-line bg-white p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-jid-olive" aria-hidden />
          <div className="space-y-2">
            <h1 className="font-arabic text-xl font-semibold text-jid-ink">{t('title')}</h1>
            <p className="font-arabic text-sm text-jid-ink/70">{t('body')}</p>
            <p className="font-arabic text-xs text-jid-ink/50">
              {t('statusLabel', { status })}
              {submittedLabel ? ` · ${t('submittedAt', { date: submittedLabel })}` : ''}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
