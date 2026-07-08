'use client'

import { useTranslations } from 'next-intl'
import { ProfileAvatar } from '@/components/profile/profile-avatar'
import type { MentorApplicationQueueItem } from '@/lib/staff/mentor-applications'
import { cn } from '@/lib/utils'

type MentorApplicationsListProps = {
  applications: MentorApplicationQueueItem[]
  loading?: boolean
  onReview: (application: MentorApplicationQueueItem) => void
}

export function MentorApplicationsList({
  applications,
  loading = false,
  onReview,
}: MentorApplicationsListProps) {
  const t = useTranslations('staff.mentorApplications.list')

  if (loading) {
    return <p className="text-sm text-muted-foreground">{t('loading')}</p>
  }

  if (applications.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        {t('empty')}
      </div>
    )
  }

  return (
    <ul className="divide-y divide-border rounded-md border border-border">
      {applications.map((application) => (
        <li key={application.user_id}>
          <button
            type="button"
            onClick={() => onReview(application)}
            className="flex w-full flex-col gap-3 p-4 text-start transition-colors hover:bg-background/40 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex gap-3">
              <ProfileAvatar
                src={application.applicant_avatar_url}
                alt={application.applicant_name ?? t('unnamed')}
                size="md"
                variant="circle"
              />
              <div>
                <p className="font-medium text-foreground">
                  {application.applicant_name ?? t('unnamed')}
                </p>
                {application.headline ? (
                  <p className="text-sm text-muted-foreground">{application.headline}</p>
                ) : null}
                {application.expertise_areas.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {application.expertise_areas.map((area) => (
                      <span
                        key={area}
                        className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary"
                      >
                        {area}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
            <div className="flex items-center gap-2 sm:flex-col sm:items-end">
              <span
                className={cn(
                  'rounded-full px-2 py-1 text-xs font-medium',
                  'bg-sem-warning/10 text-sem-warning',
                )}
              >
                {t('pendingReview')}
              </span>
              {application.application_submitted_at ? (
                <span className="text-xs text-muted-foreground">
                  {new Date(application.application_submitted_at).toLocaleString('ar-SA')}
                </span>
              ) : null}
            </div>
          </button>
        </li>
      ))}
    </ul>
  )
}
