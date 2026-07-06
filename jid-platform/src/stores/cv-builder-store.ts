'use client'

import { create } from 'zustand'
import type { CvBuilderSection } from '@/lib/cv/constants'
import { DEFAULT_CV_ZOOM, type CvZoomLevel } from '@/lib/cv/constants'

type CvBuilderUiState = {
  activeSection: CvBuilderSection
  zoomLevel: CvZoomLevel
  setActiveSection: (section: CvBuilderSection) => void
  setZoomLevel: (zoom: CvZoomLevel) => void
}

/**
 * UI-only CV builder store (Section 7.3).
 * NEVER store CV form/server data here — use TanStack Query + RHF.
 */
export const useCvBuilderStore = create<CvBuilderUiState>((set) => ({
  activeSection: 'header',
  zoomLevel: DEFAULT_CV_ZOOM,
  setActiveSection: (activeSection) => set({ activeSection }),
  setZoomLevel: (zoomLevel) => set({ zoomLevel }),
}))
