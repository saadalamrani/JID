'use client'

import { Pencil } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Link } from '@/lib/i18n/navigation'
import type { CvEducationRecord } from '@/types/cv'

type ProfileEducationSectionProps = {
  education: CvEducationRecord[]
  isOwner: boolean
  visible: boolean
}

function formatDateRange(row: CvEducationRecord): string | null {
  if (row.start_year && row.end_year) return `${row.start_year} – ${row.end_year}`
  if (row.graduation_year) return String(row.graduation_year)
  if (row.end_year) return String(row.end_year)
  if (row.start_year) return String(row.start_year)
  return null
}

export function ProfileEducationSection({
  education,
  isOwner,
  visible,
}: ProfileEducationSectionProps) {
  const t = useTranslations('profile.workspace.education')

  if (!visible) return null

  if (education.length === 0) {
    if (!isOwner) return null
    return (
      <section id="profile-section-education" className="scroll-mt-24">
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
    <section id="profile-section-education" className="scroll-mt-24">
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
        {education.map((row) => (
          <li key={row.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="font-medium text-foreground">{row.institution_name}</p>
            {row.degree || row.field_of_study ? (
              <p className="text-sm text-muted-foreground">
                {[row.degree, row.field_of_study].filter(Boolean).join(' · ')}
              </p>
            ) : null}
            {formatDateRange(row) ? (
              <p className="mt-1 text-xs text-muted-foreground">{formatDateRange(row)}</p>
            ) : null}
            {row.honors ? (
              <p className="mt-2 text-sm text-muted-foreground">{row.honors}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  )
}
