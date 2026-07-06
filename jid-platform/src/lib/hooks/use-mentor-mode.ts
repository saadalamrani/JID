'use client'

import { create } from 'zustand'
import { createClient } from '@/lib/supabase/client'

type MentorModeState = {
  hasMentorRole: boolean
  initialized: boolean
  initialize: (options: { hasMentorRole: boolean }) => void
  refreshMentorRole: () => Promise<void>
}

/** Section 4.1 — approved mentor role only (never profiles.role). */
export const useMentorMode = create<MentorModeState>((set, get) => ({
  hasMentorRole: false,
  initialized: false,

  initialize: ({ hasMentorRole }) => {
    if (get().initialized) return
    set({ hasMentorRole, initialized: true })
  },

  refreshMentorRole: async () => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      set({ hasMentorRole: false })
      return
    }

    const { data } = await supabase
      .from('mentor_profiles')
      .select('status')
      .eq('user_id', user.id)
      .maybeSingle()

    const hasMentorRole = data?.status === 'approved'
    set({ hasMentorRole })
  },
}))

export function getMentorRoleSnapshot() {
  return useMentorMode.getState()
}
