'use client'

import { create } from 'zustand'
import type { ProfileMode } from '@/lib/mentor-mode/constants'
import { readProfileModeCookie, writeProfileModeCookie } from '@/lib/mentor-mode/cookies'

type UiState = {
  currentMode: ProfileMode
  sidebarOpen: boolean
  isDragging: boolean
  initialized: boolean
  initialize: (options?: { initialMode?: ProfileMode }) => void
  setMode: (mode: ProfileMode) => void
  setSidebarOpen: (open: boolean) => void
  setIsDragging: (dragging: boolean) => void
}

/**
 * UI-only Zustand store (Section 6.2 / architecture rule).
 * NEVER store applications, meetings, or other server-fetched data here.
 */
export const useUiStore = create<UiState>((set, get) => ({
  currentMode: 'mentee',
  sidebarOpen: false,
  isDragging: false,
  initialized: false,

  initialize: ({ initialMode } = {}) => {
    if (get().initialized) return
    const mode =
      initialMode === 'mentor' || readProfileModeCookie() === 'mentor' ? 'mentor' : 'mentee'
    writeProfileModeCookie(mode)
    set({ currentMode: mode, initialized: true })
  },

  setMode: (mode) => {
    writeProfileModeCookie(mode)
    set({ currentMode: mode })
  },

  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setIsDragging: (isDragging) => set({ isDragging }),
}))
