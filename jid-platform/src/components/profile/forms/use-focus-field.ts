'use client'

import { useEffect } from 'react'
import { WIZARD_FOCUS_SECTION_IDS, parseFocusTaskId } from '@/lib/validations/profile'

const HIGHLIGHT_CLASS = 'ring-2 ring-accent ring-offset-2'

export function useFocusField(focusParam: string | null | undefined) {
  useEffect(() => {
    const taskId = parseFocusTaskId(focusParam ?? null)
    if (!taskId) return

    const sectionId = WIZARD_FOCUS_SECTION_IDS[taskId]
    const el = document.getElementById(sectionId)
    if (!el) return

    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    el.classList.add(HIGHLIGHT_CLASS)

    const timer = window.setTimeout(() => {
      el.classList.remove(HIGHLIGHT_CLASS)
    }, 3200)

    return () => window.clearTimeout(timer)
  }, [focusParam])
}
