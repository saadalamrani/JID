'use client'

import { Pencil, ShieldCheck } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Link } from '@/lib/i18n/navigation'
import type { ProfileSkillDisplay } from '@/lib/profile/individual-projection-types'

type ProfileSkillsSectionProps = {
  skills: ProfileSkillDisplay[]
  isOwner: boolean
  visible: boolean
}

export function ProfileSkillsSection({ skills, isOwner, visible }: ProfileSkillsSectionProps) {
  const t = useTranslations('profile.workspace.skills')

  if (!visible) return null

  if (skills.length === 0) {
    if (!isOwner) return null
    return (
      <section id="profile-section-skills" className="scroll-mt-24">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-foreground">{t('title')}</h2>
          <Link
            href="/profile/edit?focus=skills"
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            <Pencil className="h-3 w-3" aria-hidden />
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
    <section id="profile-section-skills" className="scroll-mt-24">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-foreground">{t('title')}</h2>
        {isOwner ? (
          <Link
            href="/profile/edit?focus=skills"
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            <Pencil className="h-3 w-3" aria-hidden />
            {t('edit')}
          </Link>
        ) : null}
      </div>

      <ul className="space-y-3" role="list">
        {skills.map((skill) => {
          const label = skill.name_ar ?? skill.name
          const levelKey = skill.proficiency
          const levelLabel = levelKey
            ? t(`proficiency.${levelKey}` as 'proficiency.beginner')
            : null
          const hasBacking =
            skill.backingExperienceIds.length > 0 || skill.backingProjectIds.length > 0

          return (
            <li
              key={skill.id}
              className="rounded-xl border border-border bg-card px-4 py-3 shadow-sm"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-foreground">{label}</span>
                {levelLabel ? (
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                    {levelLabel}
                  </span>
                ) : null}
              </div>
              {hasBacking ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  {skill.backingExperienceIds.length > 0 ? (
                    <Link
                      href="#profile-section-experience"
                      className="text-primary hover:underline"
                    >
                      {t('backedByExperience')}
                    </Link>
                  ) : null}
                  {skill.backingExperienceIds.length > 0 &&
                  skill.backingProjectIds.length > 0
                    ? ' · '
                    : null}
                  {skill.backingProjectIds.length > 0 ? (
                    <Link href="#profile-section-projects" className="text-primary hover:underline">
                      {t('backedByProjects')}
                    </Link>
                  ) : null}
                </p>
              ) : null}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
