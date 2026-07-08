'use client'

import type { ReactNode } from 'react'
import { Pencil } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { SmartLinksRow } from '@/components/profile/smart-link'
import { Link } from '@/lib/i18n/navigation'
import type { ProfilePageContext } from '@/lib/profile/queries'
import { cn } from '@/lib/utils'

type PublicContentSectionProps = {
  context: ProfilePageContext
  isOwner: boolean
}

export function PublicContentSection({ context, isOwner }: PublicContentSectionProps) {
  const t = useTranslations('profile.public')
  const { profile, skills, universityName, collegeName } = context

  return (
    <section className="space-y-6">
      <ContentBlock title={t('aboutTitle')} isOwner={isOwner} focus="about">
        {profile.about_me ? (
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
            {profile.about_me}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">{t('aboutEmpty')}</p>
        )}
      </ContentBlock>

      {(universityName || collegeName) && (
        <ContentBlock title={t('educationTitle')} isOwner={isOwner} focus="university">
          <ul className="space-y-1 text-sm text-muted-foreground">
            {universityName ? <li>{universityName}</li> : null}
            {collegeName ? <li className="text-muted-foreground">{collegeName}</li> : null}
          </ul>
        </ContentBlock>
      )}

      <ContentBlock title={t('skillsTitle')} isOwner={isOwner} focus="skills">
        {skills.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <span
                key={skill.id}
                className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
              >
                {skill.name_ar ?? skill.name}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t('skillsEmpty')}</p>
        )}
      </ContentBlock>

      <ContentBlock title={t('targetsTitle')} isOwner={isOwner} focus="targets">
        {profile.target_sectors.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {profile.target_sectors.map((sector) => (
              <span
                key={sector}
                className="rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground"
              >
                {sector}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t('targetsEmpty')}</p>
        )}
      </ContentBlock>

      <div>
        <h3 className="mb-2 text-sm font-medium text-muted-foreground">{t('linksTitle')}</h3>
        <SmartLinksRow smartLinks={profile.smart_links} linkedinUrl={profile.linkedin_url} />
      </div>
    </section>
  )
}

function ContentBlock({
  title,
  children,
  isOwner,
  focus,
}: {
  title: string
  children: ReactNode
  isOwner: boolean
  focus: string
}) {
  const t = useTranslations('profile.public')

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        {isOwner ? (
          <Link
            href={`/profile/edit?focus=${focus}`}
            className={cn(
              'inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline',
            )}
          >
            <Pencil className="h-3 w-3" aria-hidden />
            {t('inlineEdit')}
          </Link>
        ) : null}
      </div>
      {children}
    </div>
  )
}
