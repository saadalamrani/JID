'use client'

import { useCallback, useEffect, useRef, useState, type MouseEvent } from 'react'
import { track } from '@/lib/analytics/track'
import { useRouter } from '@/lib/i18n/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  declareApplication,
  fetchJobDeclarationStatus,
  logApplicationIntent,
} from '@/lib/jobs/self-declaration-client'
import type { SelfDeclarationState } from '@/types/self-declaration'

/** Section 4.5 — fallback CTA appears after 10s without tab switch. */
export const SELF_DECLARATION_FALLBACK_MS = 10_000

type UseSelfDeclarationOptions = {
  jobId: string
  applyUrl: string | null
  initialDeclared?: boolean
  initialPrimaryEmail?: string | null
}

export function useSelfDeclaration({
  jobId,
  applyUrl,
  initialDeclared = false,
  initialPrimaryEmail = null,
}: UseSelfDeclarationOptions) {
  const router = useRouter()
  const [state, setState] = useState<SelfDeclarationState>(
    initialDeclared ? 'declared' : 'not_applied',
  )
  const [showInterceptor, setShowInterceptor] = useState(false)
  const [showFallback, setShowFallback] = useState(false)
  const [primaryEmail, setPrimaryEmail] = useState<string | null>(initialPrimaryEmail)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [declareError, setDeclareError] = useState<string | null>(null)
  const stateRef = useRef<SelfDeclarationState>(state)

  useEffect(() => {
    stateRef.current = state
  }, [state])

  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (cancelled) return

      setIsAuthenticated(Boolean(user))
      if (!user) return

      try {
        const status = await fetchJobDeclarationStatus(jobId)
        if (cancelled) return
        setPrimaryEmail(status.primaryEmail ?? initialPrimaryEmail)
        if (status.declared) {
          setState('declared')
        } else if (!initialDeclared) {
          setState('not_applied')
        }
      } catch {
        // Anonymous or transient errors keep default not_applied.
      }
    }

    void bootstrap()

    return () => {
      cancelled = true
    }
  }, [jobId, initialDeclared, initialPrimaryEmail])

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible' && stateRef.current === 'just_clicked') {
        setShowInterceptor(true)
      }
    }

    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [])

  useEffect(() => {
    if (state !== 'just_clicked') {
      setShowFallback(false)
      return
    }

    const timer = window.setTimeout(() => {
      setShowFallback(true)
    }, SELF_DECLARATION_FALLBACK_MS)

    return () => window.clearTimeout(timer)
  }, [state])

  const openInterceptor = useCallback(() => {
    setShowInterceptor(true)
    track('job_interceptor_shown', { job_id: jobId })
  }, [jobId])

  const closeInterceptor = useCallback(() => {
    setShowInterceptor(false)
  }, [])

  const handleApplyClick = useCallback(
    async (event: MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation()

      if (state === 'declared' || state === 'in_progress') return

      if (!applyUrl) return

      if (isAuthenticated === false) {
        router.push('/login')
        return
      }

      void logApplicationIntent(jobId).catch(() => {
        // Intent is best-effort analytics — never block the apply flow.
      })

      track('job_apply_clicked', { job_id: jobId })

      window.open(applyUrl, '_blank', 'noopener,noreferrer')
      setState('just_clicked')
      setDeclareError(null)
    },
    [applyUrl, isAuthenticated, jobId, router, state],
  )

  const handleFallbackClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation()
      openInterceptor()
    },
    [openInterceptor],
  )

  const handleConfirmDeclaration = useCallback(async () => {
    setDeclareError(null)
    setState('in_progress')

    try {
      const result = await declareApplication(jobId)
      if (result.declared) {
        setState('declared')
        setShowInterceptor(false)
        setShowFallback(false)
        track('job_self_declared', { job_id: jobId })
        return
      }
      setState('just_clicked')
    } catch (error) {
      setState('just_clicked')
      setDeclareError(error instanceof Error ? error.message : 'تعذّر تسجيل التقديم')
    }
  }, [jobId])

  return {
    state,
    showInterceptor,
    showFallback,
    primaryEmail,
    isAuthenticated,
    declareError,
    handleApplyClick,
    handleFallbackClick,
    handleConfirmDeclaration,
    openInterceptor,
    closeInterceptor,
  }
}
