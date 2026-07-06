'use client'

import { create } from 'zustand'
import { createClient } from '@/lib/supabase/client'
import type { ProfileMode } from '@/lib/mentor-mode/constants'
import { readProfileModeCookie, writeProfileModeCookie } from '@/lib/mentor-mode/cookies'

type MentorModeState = {
  currentMode: ProfileMode
  hasMentorRole: boolean
  initialized: boolean
  initialize: (options: { hasMentorRole: boolean; initialMode?: ProfileMode }) => void
  setMode: (mode: ProfileMode) => void
  refreshMentorRole: () => Promise<void>
}

export const useMentorMode = create<MentorModeState>((set, get) => ({
  currentMode: 'mentee',
  hasMentorRole: false,
  initialized: false,

  initialize: ({ hasMentorRole, initialMode }) => {
    if (get().initialized) return
    const mode =
      hasMentorRole && (initialMode === 'mentor' || readProfileModeCookie() === 'mentor')
        ? 'mentor'
        : 'mentee'
    if (hasMentorRole && mode === 'mentor') {
      writeProfileModeCookie('mentor')
    }
    set({ hasMentorRole, currentMode: mode, initialized: true })
  },

  setMode: (mode) => {
    const { hasMentorRole } = get()
    const nextMode = hasMentorRole ? mode : 'mentee'
    writeProfileModeCookie(nextMode)
    set({ currentMode: nextMode })
  },

  refreshMentorRole: async () => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      set({ hasMentorRole: false, currentMode: 'mentee' })
      return
    }

    const { data } = await supabase
      .from('mentor_profiles')
      .select('status')
      .eq('user_id', user.id)
      .maybeSingle()

    const hasMentorRole = data?.status === 'approved'
    set((state) => ({
      hasMentorRole,
      currentMode: hasMentorRole ? state.currentMode : 'mentee',
    }))
  },
}))

/** Section 4.1 — server-readable mode for layouts (no profiles.role). */
export function getMentorModeSnapshot() {
  return useMentorMode.getState()
}
