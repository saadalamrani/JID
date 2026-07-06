'use client'

import { useEffect, useRef, useState } from 'react'
import type { FieldValues, UseFormGetValues, UseFormWatch } from 'react-hook-form'

export const AUTO_SAVE_DEBOUNCE_MS = 800

export type AutoSaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error'

type UseAutoSaveOptions<T extends FieldValues> = {
  watch: UseFormWatch<T>
  getValues: UseFormGetValues<T>
  onSave: (values: T) => Promise<void>
  onError?: () => void
  debounceMs?: number
  enabled?: boolean
}

/**
 * Section 9 — debounced auto-save with "Saved · Xs ago" indicator.
 */
export function useAutoSave<T extends FieldValues>({
  watch,
  getValues,
  onSave,
  onError,
  debounceMs = AUTO_SAVE_DEBOUNCE_MS,
  enabled = true,
}: UseAutoSaveOptions<T>) {
  const [status, setStatus] = useState<AutoSaveStatus>('idle')
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const [secondsAgo, setSecondsAgo] = useState(0)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  useEffect(() => {
    if (!enabled) return undefined

    const subscription = watch(() => {
      setStatus('pending')
      if (debounceRef.current) clearTimeout(debounceRef.current)

      debounceRef.current = setTimeout(() => {
        void (async () => {
          setStatus('saving')
          try {
            await onSave(getValues())
            if (!isMountedRef.current) return
            setSavedAt(new Date())
            setStatus('saved')
          } catch {
            if (!isMountedRef.current) return
            setStatus('error')
            onError?.()
          }
        })()
      }, debounceMs)
    })

    return () => {
      subscription.unsubscribe()
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [watch, getValues, onSave, onError, debounceMs, enabled])

  useEffect(() => {
    if (status !== 'saved' || !savedAt) return undefined

    const tick = () => {
      setSecondsAgo(Math.max(0, Math.floor((Date.now() - savedAt.getTime()) / 1000)))
    }

    tick()
    const intervalId = setInterval(tick, 1000)
    return () => clearInterval(intervalId)
  }, [status, savedAt])

  return { status, secondsAgo }
}
