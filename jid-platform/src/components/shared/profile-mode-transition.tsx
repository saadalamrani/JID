'use client'

import { AnimatePresence, motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { usePathname } from '@/lib/i18n/navigation'
import { useUiStore } from '@/stores/ui-store'

const LAYOUT_SPRING = { type: 'spring' as const, stiffness: 400, damping: 32 }

type ProfileModeTransitionProps = {
  children: ReactNode
}

/** Section 6.3 — AnimatePresence wrapper when switching mentee ↔ mentor mode. */
export function ProfileModeTransition({ children }: ProfileModeTransitionProps) {
  const pathname = usePathname()
  const currentMode = useUiStore((state) => state.currentMode)

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`${currentMode}-${pathname}`}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={LAYOUT_SPRING}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
