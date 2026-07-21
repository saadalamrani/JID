'use client'

import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import type { OrganizationProfileSection } from './organization-profile-shell'

type ProfileSectionNavProps = {
  activeSection: OrganizationProfileSection
  onNavigate: (section: OrganizationProfileSection) => void
  dirty?: boolean
  onDirtyNavigate?: (section: OrganizationProfileSection) => void
}

const SECTIONS: OrganizationProfileSection[] = [
  'overview',
  'identity',
  'details',
  'media',
  'preview',
  'reference',
  'correction',
]

export function ProfileSectionNav({
  activeSection,
  onNavigate,
  dirty = false,
  onDirtyNavigate,
}: ProfileSectionNavProps) {
  const t = useTranslations('organizationProfile.nav')

  function handleClick(section: OrganizationProfileSection) {
    if (section === activeSection) return
    if (dirty && onDirtyNavigate) {
      onDirtyNavigate(section)
      return
    }
    onNavigate(section)
  }

  return (
    <nav aria-label={t('label')} className="space-y-2">
      <div className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
        {SECTIONS.map((section) => {
          const isActive = section === activeSection
          return (
            <button
              key={section}
              type="button"
              onClick={() => handleClick(section)}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'min-h-11 shrink-0 rounded-lg border px-3 py-2 text-start text-sm font-medium transition',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                isActive
                  ? 'border-primary bg-primary/5 text-foreground'
                  : 'border-border bg-white text-foreground/70 hover:border-primary/30 hover:text-foreground',
              )}
            >
              {t(section)}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
