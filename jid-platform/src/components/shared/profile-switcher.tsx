'use client'

import { GraduationCap, Users } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect } from 'react'
import type { ProfileMode } from '@/lib/mentor-mode/constants'
import { useMentorMode } from '@/lib/hooks/use-mentor-mode'
import { cn } from '@/lib/utils'

type ProfileSwitcherProps = {
  /** Server-hydrated — mentor_profiles.status = 'approved' (never profiles.role). */
  hasMentorRole: boolean
  initialMode?: ProfileMode
}

/**
 * Section 4.1 — dual-mode toggle for approved mentors.
 * Renders null when the user has no approved mentor profile.
 */
export function ProfileSwitcher({ hasMentorRole, initialMode }: ProfileSwitcherProps) {
  const t = useTranslations('mentorship.profileSwitcher')
  const { currentMode, initialized, initialize, setMode } = useMentorMode()

  useEffect(() => {
    initialize({ hasMentorRole, initialMode })
  }, [hasMentorRole, initialMode, initialize])

  if (!hasMentorRole || !initialized) {
    return null
  }

  return (
    <div
      role="group"
      aria-label={t('groupLabel')}
      className="inline-flex items-center gap-0.5 rounded-lg border border-jid-line bg-jid-beige/40 p-0.5"
    >
      <ModeButton
        active={currentMode === 'mentee'}
        label={t('mentee')}
        icon={GraduationCap}
        onClick={() => setMode('mentee')}
      />
      <ModeButton
        active={currentMode === 'mentor'}
        label={t('mentor')}
        icon={Users}
        onClick={() => setMode('mentor')}
      />
    </div>
  )
}

type ModeButtonProps = {
  active: boolean
  label: string
  icon: typeof GraduationCap
  onClick: () => void
}

function ModeButton({ active, label, icon: Icon, onClick }: ModeButtonProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 font-arabic text-sm font-medium transition-colors',
        active
          ? 'bg-white text-jid-ink shadow-sm'
          : 'text-jid-ink/60 hover:text-jid-ink',
      )}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden />
      <span>{label}</span>
    </button>
  )
}
