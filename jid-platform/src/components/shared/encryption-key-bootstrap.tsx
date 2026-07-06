'use client'

import { useEffect, useRef } from 'react'
import { initUserKeys } from '@/lib/encryption/e2e'

type EncryptionKeyBootstrapProps = {
  userId: string | null
}

/**
 * Section 5.3 / 5.5 — initialize E2E keys once per authenticated session.
 * Mounted from the app shell so mentees and mentors both receive keys before chat (Day 10).
 */
export function EncryptionKeyBootstrap({ userId }: EncryptionKeyBootstrapProps) {
  const startedForUser = useRef<string | null>(null)

  useEffect(() => {
    if (!userId || startedForUser.current === userId) return
    startedForUser.current = userId

    void initUserKeys(userId).catch((error: unknown) => {
      if (error instanceof Error && error.message === 'UNAUTHORIZED') return
      console.warn('[encryption] initUserKeys failed', error)
    })
  }, [userId])

  return null
}
