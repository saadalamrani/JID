'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { STAFF_IDLE_TIMEOUT_SECONDS, STAFF_LOGIN_PATH } from '@/lib/staff/constants'

const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'touchstart', 'scroll'] as const

/**
 * Section 15 — auto-logout after 30 minutes of inactivity (client-side).
 * Absolute 8h session cap is enforced separately in middleware/layout guards.
 */
export function StaffIdleGuard() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const resetTimer = () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        void (async () => {
          const supabase = createClient()
          await supabase.auth.signOut()
          window.location.href = `${STAFF_LOGIN_PATH}?reason=idle`
        })()
      }, STAFF_IDLE_TIMEOUT_SECONDS * 1000)
    }

    resetTimer()
    for (const eventName of ACTIVITY_EVENTS) {
      window.addEventListener(eventName, resetTimer, { passive: true })
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      for (const eventName of ACTIVITY_EVENTS) {
        window.removeEventListener(eventName, resetTimer)
      }
    }
  }, [])

  return null
}
