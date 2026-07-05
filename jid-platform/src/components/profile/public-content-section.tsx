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
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-jid-ink/80">
            {profile.about_me}
          </p>
        ) : (
          <p className="text-sm text-jid-ink/50">{t('aboutEmpty')}</p>
        )}
      </ContentBlock>

      {(universityName || collegeName) && (
        <ContentBlock title={t('educationTitle')} isOwner={isOwner} focus="university">
          <ul className="space-y-1 text-sm text-jid-ink/80">
            {universityName ? <li>{universityName}</li> : null}
            {collegeName ? <li className="text-jid-ink/60">{collegeName}</li> : null}
          </ul>
        </ContentBlock>
      )}

      <ContentBlock title={t('skillsTitle')} isOwner={isOwner} focus="skills">
        {skills.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <span
                key={skill.id}
                className="rounded-full bg-jid-olive/10 px-3 py-1 text-xs font-medium text-jid-olive"
              >
                {skill.name_ar ?? skill.name}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-jid-ink/50">{t('skillsEmpty')}</p>
        )}
      </ContentBlock>

      <ContentBlock title={t('targetsTitle')} isOwner={isOwner} focus="targets">
        {profile.target_sectors.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {profile.target_sectors.map((sector) => (
              <span
                key={sector}
                className="rounded-md border border-jid-line px-2.5 py-1 text-xs text-jid-ink/80"
              >
                {sector}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-jid-ink/50">{t('targetsEmpty')}</p>
        )}
      </ContentBlock>

      <div>
        <h3 className="mb-2 text-sm font-medium text-jid-ink/70">{t('linksTitle')}</h3>
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
    <div className="rounded-xl border border-jid-line bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium text-jid-ink/70">{title}</h3>
        {isOwner ? (
          <Link
            href={`/profile/edit?focus=${focus}`}
            className={cn(
              'inline-flex items-center gap-1 text-xs font-medium text-jid-olive hover:underline',
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
