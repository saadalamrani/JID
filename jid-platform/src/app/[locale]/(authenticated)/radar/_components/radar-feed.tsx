'use client'

import { useRouter } from '@/lib/i18n/navigation'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { MeetingRadarCard } from '@/components/radar/meeting-radar-card'
import type { RadarMeetingItem } from '@/types/meeting'

type RadarFeedProps = {
  items: RadarMeetingItem[]
}

export function RadarFeed({ items: initialItems }: RadarFeedProps) {
  const t = useTranslations('radar')
  const router = useRouter()
  const [items, setItems] = useState(initialItems)

  const visible = items.filter((item) => item.meeting)

  function handleFeedbackSubmitted(itemId: string) {
    setItems((current) => current.filter((item) => item.id !== itemId))
    router.refresh()
  }

  return (
    <div className="space-y-4">
      {visible.length === 0 ? (
        <div className="rounded-xl border border-dashed border-jid-line bg-white px-6 py-16 text-center">
          <p className="font-arabic text-sm font-medium text-jid-ink">{t('emptyTitle')}</p>
          <p className="mt-2 font-arabic text-sm text-jid-ink/55">{t('emptyBody')}</p>
        </div>
      ) : (
        visible.map((item) => (
          <MeetingRadarCard
            key={item.id}
            item={item}
            onFeedbackSubmitted={() => handleFeedbackSubmitted(item.id)}
          />
        ))
      )}
    </div>
  )
}
