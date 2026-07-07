'use client'

import { useTranslations } from 'next-intl'
import type { MentorHubSettings } from '@/lib/mentor-hub/queries'
import { cn } from '@/lib/utils'

type MentorHubStubTabProps = {
  tab: 'chats' | 'upcoming' | 'workshops'
}

export function MentorHubStubTab({ tab }: MentorHubStubTabProps) {
  const t = useTranslations('mentorship.hub.stubs')

  return (
    <div className="rounded-xl border border-dashed border-jid-line bg-jid-beige/20 px-6 py-12 text-center">
      <p className="font-arabic text-sm font-medium text-jid-ink">{t(`${tab}.title`)}</p>
      <p className="mt-2 font-arabic text-sm text-jid-ink/55">{t(`${tab}.body`)}</p>
    </div>
  )
}
