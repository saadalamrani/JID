'use client'

import { motion } from 'framer-motion'
import { GraduationCap, Users } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect } from 'react'
import { useRouter } from '@/lib/i18n/navigation'
import { useMentorMode } from '@/lib/hooks/use-mentor-mode'
import { track } from '@/lib/analytics/track'
import type { ProfileMode } from '@/lib/mentor-mode/constants'
import { useUiStore } from '@/stores/ui-store'
import { cn } from '@/lib/utils'

const SWITCHER_SPRING = { type: 'spring' as const, stiffness: 500, damping: 35 }

type ProfileSwitcherProps = {
  /** Server-hydrated — mentor_profiles.status = 'approved' (never profiles.role). */
  hasMentorRole: boolean
  initialMode?: ProfileMode
}

/**
 * Section 6.2 — dual-mode toggle with sliding layoutId pill (Framer Motion).
 * Role from useMentorMode; mode from ui-store only.
 */
export function ProfileSwitcher({ hasMentorRole: serverHasMentorRole, initialMode }: ProfileSwitcherProps) {
  const t = useTranslations('mentorship.profileSwitcher')
  const router = useRouter()
  const { hasMentorRole, initialized: mentorReady, initialize: initMentor } = useMentorMode()
  const currentMode = useUiStore((state) => state.currentMode)
  const uiReady = useUiStore((state) => state.initialized)
  const initializeUi = useUiStore((state) => state.initialize)
  const setMode = useUiStore((state) => state.setMode)

  useEffect(() => {
    initMentor({ hasMentorRole: serverHasMentorRole })
  }, [serverHasMentorRole, initMentor])

  useEffect(() => {
    if (serverHasMentorRole) {
      initializeUi({ initialMode })
    }
  }, [serverHasMentorRole, initialMode, initializeUi])

  if (!hasMentorRole || !mentorReady || !uiReady) {
    return null
  }

  const modes: { value: ProfileMode; label: string; icon: typeof GraduationCap }[] = [
    { value: 'mentee', label: t('mentee'), icon: GraduationCap },
    { value: 'mentor', label: t('mentor'), icon: Users },
  ]

  function handleSelect(mode: ProfileMode) {
    if (mode === currentMode) return
    setMode(mode)
    track('mode_switched', { from: currentMode, to: mode })
    if (mode === 'mentor') {
      router.push('/mentor/dashboard')
    }
  }

  return (
    <div
      role="group"
      aria-label={t('groupLabel')}
      className="relative inline-flex rounded-lg border border-jid-line bg-jid-beige/40 p-0.5"
    >
      {modes.map(({ value, label, icon: Icon }) => {
        const active = currentMode === value
        return (
          <button
            key={value}
            type="button"
            aria-pressed={active}
            onClick={() => handleSelect(value)}
            className={cn(
              'relative z-10 inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 font-arabic text-sm font-medium transition-colors',
              active ? 'text-jid-ink' : 'text-jid-ink/60 hover:text-jid-ink',
            )}
          >
            {active ? (
              <motion.span
                layoutId="jid-profile-switcher-pill"
                className="absolute inset-0 rounded-md bg-white shadow-sm"
                transition={SWITCHER_SPRING}
              />
            ) : null}
            <Icon className="relative h-4 w-4 shrink-0" aria-hidden />
            <span className="relative">{label}</span>
          </button>
        )
      })}
    </div>
  )
}
