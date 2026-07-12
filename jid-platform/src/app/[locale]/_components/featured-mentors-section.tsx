'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/lib/i18n/navigation'
import { MentorCard } from '@/components/mentor/mentor-card'
import type { MentorCardData } from '@/types/mentor'

type FeaturedMentorsSectionProps = {
  mentors: MentorCardData[]
}

/** Section 4.15 — Mentor of the Month spotlight (top 3 by mentor_score). */
export function FeaturedMentorsSection({ mentors }: FeaturedMentorsSectionProps) {
  const t = useTranslations('home.featuredMentors')

  if (mentors.length === 0) return null

  return (
    <section className="container-jid border-t border-border/40 py-16">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-arabic text-2xl font-semibold text-foreground">{t('title')}</h2>
          <p className="mt-1 font-arabic text-sm text-foreground/60">{t('subtitle')}</p>
        </div>
        <Link href="/mentors" className="font-arabic text-sm text-primary hover:underline">
          {t('browseAll')}
        </Link>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" role="list">
        {mentors.map((mentor) => (
          <MentorCard key={mentor.user_id} mentor={mentor} />
        ))}
      </div>
    </section>
  )
}
