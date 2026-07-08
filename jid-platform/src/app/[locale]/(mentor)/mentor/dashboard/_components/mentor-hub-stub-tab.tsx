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
    <div className="rounded-xl border border-dashed border-border bg-background/20 px-6 py-12 text-center">
      <p className="font-arabic text-sm font-medium text-foreground">{t(`${tab}.title`)}</p>
      <p className="mt-2 font-arabic text-sm text-foreground/55">{t(`${tab}.body`)}</p>
    </div>
  )
}
