'use client'

import { ExternalLink, ShieldCheck } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Link } from '@/lib/i18n/navigation'
import type { IndividualProfileProjectCard } from '@/lib/profile/individual-projection-types'

type FeaturedProjectsSectionProps = {
  projects: IndividualProfileProjectCard[]
  evidenceVaultAvailable: boolean
  isOwner: boolean
  visible: boolean
}

export function FeaturedProjectsSection({
  projects,
  evidenceVaultAvailable,
  isOwner,
  visible,
}: FeaturedProjectsSectionProps) {
  const t = useTranslations('profile.workspace.projects')

  if (!visible) return null

  if (projects.length === 0) {
    if (!isOwner) return null
    return (
      <section id="profile-section-projects" className="scroll-mt-24">
        <h2 className="mb-3 text-lg font-semibold text-foreground">{t('title')}</h2>
        <Link
          href="/profile/cv"
          className="block rounded-xl border border-dashed border-border p-5 text-sm text-primary hover:underline"
        >
          {t('emptyOwner')}
        </Link>
      </section>
    )
  }

  return (
    <section id="profile-section-projects" className="scroll-mt-24">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-foreground">{t('title')}</h2>
        <Link href="/profile/cv" className="text-sm font-medium text-primary hover:underline">
          {t('viewAll')}
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {projects.map((project) => (
          <article
            key={project.id}
            className="rounded-xl border border-border bg-card p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-medium text-foreground">{project.title}</h3>
              {project.hasProof ? (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-xs text-primary">
                  <ShieldCheck className="h-3 w-3" aria-hidden />
                  {t('proof')}
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{project.category}</p>
            {project.description ? (
              <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{project.description}</p>
            ) : null}
            <dl className="mt-3 space-y-1 text-xs text-muted-foreground">
              {project.role ? (
                <div className="flex gap-2">
                  <dt className="font-medium">{t('role')}</dt>
                  <dd>{project.role}</dd>
                </div>
              ) : null}
              {project.dateLabel ? (
                <div className="flex gap-2">
                  <dt className="font-medium">{t('date')}</dt>
                  <dd>{project.dateLabel}</dd>
                </div>
              ) : null}
              {project.skills.length > 0 ? (
                <div className="flex flex-wrap gap-1 pt-1">
                  {project.skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              ) : null}
            </dl>
            {!evidenceVaultAvailable && isOwner ? (
              <p className="mt-2 text-xs text-muted-foreground">{t('evidenceUnavailable')}</p>
            ) : null}
            {project.url ? (
              <a
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                <ExternalLink className="h-3 w-3" aria-hidden />
                {t('openLink')}
              </a>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  )
}
