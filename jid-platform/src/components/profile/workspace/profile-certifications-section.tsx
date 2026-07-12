'use client'

import { ExternalLink, Pencil } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Link } from '@/lib/i18n/navigation'
import type { CvAdditionalRecord } from '@/types/cv'

type ProfileCertificationsSectionProps = {
  certifications: CvAdditionalRecord[]
  isOwner: boolean
  visible: boolean
  evidenceVaultAvailable: boolean
}

export function ProfileCertificationsSection({
  certifications,
  isOwner,
  visible,
  evidenceVaultAvailable,
}: ProfileCertificationsSectionProps) {
  const t = useTranslations('profile.workspace.certifications')

  if (!visible) return null

  if (certifications.length === 0) {
    if (!isOwner) return null
    return (
      <section id="profile-section-certifications" className="scroll-mt-24">
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
    <section id="profile-section-certifications" className="scroll-mt-24">
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
        {certifications.map((row) => (
          <li key={row.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="font-medium text-foreground">{row.title}</p>
            {row.issuer ? <p className="text-sm text-muted-foreground">{row.issuer}</p> : null}
            {row.start_date || row.end_date ? (
              <p className="mt-1 text-xs text-muted-foreground">
                {[row.start_date, row.end_date].filter(Boolean).join(' – ')}
              </p>
            ) : null}
            {row.url ? (
              <a
                href={row.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                <ExternalLink className="h-3 w-3" aria-hidden />
                {t('credentialLink')}
              </a>
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
