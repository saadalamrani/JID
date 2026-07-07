'use client'

import { formatDistance } from 'date-fns'
import { arSA } from 'date-fns/locale'
import { useTranslations } from 'next-intl'
import { ProfileAvatar } from '@/components/profile/profile-avatar'
import { Link } from '@/lib/i18n/navigation'
import type { MentorApplicationQueueItem } from '@/lib/staff/mentor-applications'
import { cn } from '@/lib/utils'

type MentorApplicationCardProps = {
  application: MentorApplicationQueueItem
}

function bioPreview(bio: string | null, maxLength = 120): string | null {
  if (!bio?.trim()) return null
  const trimmed = bio.trim()
  return trimmed.length > maxLength ? `${trimmed.slice(0, maxLength)}…` : trimmed
}

/** Section 7 — mentor application queue card (mentor_profiles, not claim_requests). */
export function MentorApplicationCard({ application }: MentorApplicationCardProps) {
  const t = useTranslations('staff.mentorApplications.card')
  const submittedAt = application.application_submitted_at
  const submittedLabel = submittedAt
    ? formatDistance(new Date(submittedAt), new Date(), { addSuffix: true, locale: arSA })
    : null
  const preview = bioPreview(application.bio_long)

  return (
    <article className="rounded-lg border border-jid-line border-s-4 border-s-purple-400 bg-white transition-colors hover:bg-jid-beige/30">
      <Link
        href={`/staff/mentor-applications/${application.user_id}`}
        className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between"
      >
        <div className="flex min-w-0 gap-3">
          <ProfileAvatar
            src={application.applicant_avatar_url}
            alt={application.applicant_name ?? t('unnamed')}
            size="md"
            variant="circle"
          />
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-800">
                مرشد
              </span>
              <span className="text-xs text-jid-ink/50">{application.status}</span>
            </div>
            <p className="font-medium text-jid-ink">
              {application.applicant_name ?? t('unnamed')}
            </p>
            {application.expertise_areas.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {application.expertise_areas.slice(0, 4).map((area) => (
                  <span
                    key={area}
                    className={cn('rounded-full bg-jid-olive/10 px-2 py-0.5 text-xs text-jid-olive')}
                  >
                    {area}
                  </span>
                ))}
              </div>
            ) : null}
            {preview ? <p className="text-sm text-jid-ink/65 line-clamp-2">{preview}</p> : null}
            {submittedLabel ? (
              <p className="text-xs text-jid-ink/50">{submittedLabel}</p>
            ) : null}
          </div>
        </div>
      </Link>
    </article>
  )
}
