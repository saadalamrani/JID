'use client'

import { Pencil } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Link } from '@/lib/i18n/navigation'
import type { CvExperienceRecord } from '@/types/cv'

type ProfileExperienceSectionProps = {
  experience: CvExperienceRecord[]
  isOwner: boolean
  visible: boolean
  evidenceVaultAvailable: boolean
}

function formatDateRange(row: CvExperienceRecord): string | null {
  const start =
    row.start_year != null
      ? `${row.start_year}${row.start_month ? `/${row.start_month}` : ''}`
      : null
  const end = row.is_current
    ? 'present'
    : row.end_year != null
      ? `${row.end_year}${row.end_month ? `/${row.end_month}` : ''}`
      : null
  if (start && end) return `${start} – ${end}`
  return start ?? end
}

export function ProfileExperienceSection({
  experience,
  isOwner,
  visible,
  evidenceVaultAvailable,
}: ProfileExperienceSectionProps) {
  const t = useTranslations('profile.workspace.experience')

  if (!visible) return null

  if (experience.length === 0) {
    if (!isOwner) return null
    return (
      <section id="profile-section-experience" className="scroll-mt-24">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-foreground">{t('title')}</h2>
          <Link href="/profile/cv" className="text-xs font-medium text-primary hover:underline">
            <Pencil className="me-1 inline h-3 w-3" aria-hidden />
            {t('edit')}
          </Link>
        </div>
        <p className="rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">
          {t('emptyOwner')}
        </p>
      </section>
    )
  }

  return (
    <section id="profile-section-experience" className="scroll-mt-24">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-foreground">{t('title')}</h2>
        {isOwner ? (
          <Link href="/profile/cv" className="text-xs font-medium text-primary hover:underline">
            <Pencil className="me-1 inline h-3 w-3" aria-hidden />
            {t('edit')}
          </Link>
        ) : null}
      </div>

      <ul className="space-y-3" role="list">
        {experience.map((row) => (
          <li key={row.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="font-medium text-foreground">{row.job_title}</p>
            <p className="text-sm text-muted-foreground">
              {row.company_name}
              {row.location ? ` · ${row.location}` : ''}
            </p>
            {formatDateRange(row) ? (
              <p className="mt-1 text-xs text-muted-foreground">{formatDateRange(row)}</p>
            ) : null}
            {row.bullets.length > 0 ? (
              <ul className="mt-2 list-disc space-y-1 ps-4 text-sm text-muted-foreground">
                {row.bullets.map((bullet, index) => (
                  <li key={index}>{bullet}</li>
                ))}
              </ul>
            ) : null}
            {!evidenceVaultAvailable && isOwner ? (
              <p className="mt-2 text-xs text-muted-foreground">{t('evidenceUnavailable')}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  )
}
