'use client'

import { MessageSquare, Phone, Users, Video } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import {
  MENTOR_MEDIUM_OPTIONS,
  type MentorMediumValue,
} from '@/lib/mentor-application/constants'
import { cn } from '@/lib/utils'

const MEDIUM_ICONS: Record<MentorMediumValue, typeof Video> = {
  video: Video,
  voice: Phone,
  chat: MessageSquare,
  in_person: Users,
}

type PreferredMediumsIconsProps = {
  mediums: string[]
  className?: string
}

export function PreferredMediumsIcons({ mediums, className }: PreferredMediumsIconsProps) {
  const t = useTranslations('mentorship.detail')
  const locale = useLocale()
  const isEn = locale === 'en'

  if (mediums.length === 0) return null

  return (
    <section className={cn('rounded-xl border border-jid-line bg-white p-5 shadow-sm', className)}>
      <h2 className="mb-3 font-arabic text-sm font-medium text-jid-ink/70">{t('mediumsTitle')}</h2>
      <ul className="flex flex-wrap gap-3">
        {mediums.map((value) => {
          const option = MENTOR_MEDIUM_OPTIONS.find((item) => item.value === value)
          const Icon = MEDIUM_ICONS[value as MentorMediumValue] ?? MessageSquare
          const label = option ? (isEn ? option.labelEn : option.labelAr) : value

          return (
            <li
              key={value}
              className="inline-flex items-center gap-2 rounded-lg border border-jid-line bg-jid-beige/40 px-3 py-2 font-arabic text-sm text-jid-ink"
            >
              <Icon className="h-4 w-4 text-jid-olive" aria-hidden />
              {label}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
