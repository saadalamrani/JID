'use client'

import { useTranslations } from 'next-intl'
import type { StaffFlagQueueItem } from '@/lib/staff/moderation-queries'
import { FlagCard } from './flag-card'

type FlagsListProps = {
  flags: StaffFlagQueueItem[]
}

export function FlagsList({ flags }: FlagsListProps) {
  const t = useTranslations('staff.moderation.list')

  if (flags.length === 0) {
    return (
      <div className="rounded-lg border border-jid-line bg-white p-8 text-center text-sm text-jid-ink/50">
        {t('empty')}
      </div>
    )
  }

  return (
    <ul className="grid gap-3">
      {flags.map((flag) => (
        <li key={flag.id}>
          <FlagCard flag={flag} />
        </li>
      ))}
    </ul>
  )
}
