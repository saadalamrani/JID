'use client'

import { useEffect, useRef } from 'react'
import { track } from '@/lib/analytics/track'
import { CV_BUILDER_SECTIONS, type CvBuilderSection } from '@/lib/cv/constants'
import type { SectionCompletenessMap } from '@/lib/cv/hooks/use-section-completeness'
import { useCvBuilderStore } from '@/stores/cv-builder-store'

type UseCvBuilderAnalyticsOptions = {
  cvId: string
  created: boolean
  completeness: SectionCompletenessMap
}

/** Section 15 — CV builder analytics (open, autofill, section complete/abandon). */
export function useCvBuilderAnalytics({
  cvId,
  created,
  completeness,
}: UseCvBuilderAnalyticsOptions) {
  const activeSection = useCvBuilderStore((s) => s.activeSection)
  const openedRef = useRef(false)
  const prevCompletenessRef = useRef(completeness)
  const prevSectionRef = useRef<CvBuilderSection>(activeSection)

  useEffect(() => {
    if (openedRef.current) return
    openedRef.current = true
    track('cv_builder_opened', { cv_id: cvId, autofill: created })
    if (created) {
      track('cv_auto_filled_from_profile', { cv_id: cvId })
    }
  }, [cvId, created])

  useEffect(() => {
    const prev = prevCompletenessRef.current
    for (const section of CV_BUILDER_SECTIONS) {
      if (prev[section] !== 'complete' && completeness[section] === 'complete') {
        track('cv_section_completed', { cv_id: cvId, section })
      }
    }
    prevCompletenessRef.current = completeness
  }, [completeness, cvId])

  useEffect(() => {
    const prev = prevSectionRef.current
    if (prev !== activeSection) {
      if (completeness[prev] === 'partial') {
        track('cv_section_abandoned', { cv_id: cvId, section: prev })
      }
      prevSectionRef.current = activeSection
    }
  }, [activeSection, completeness, cvId])
}
