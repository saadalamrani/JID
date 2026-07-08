'use client'

import { Bookmark } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { userApplicationsQueryKey } from '@/lib/applications/client'
import { fetchJobDeclarationStatus, saveJobApplication } from '@/lib/jobs/self-declaration-client'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from '@/lib/i18n/navigation'
import { cn } from '@/lib/utils'

type JobSaveButtonProps = {
  jobId: string
  className?: string
}

/** Section 4 / Radar Day 4 — bookmark job for Radar Saved column. */
export function JobSaveButton({ jobId, className }: JobSaveButtonProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [saved, setSaved] = useState(false)
  const [declared, setDeclared] = useState(false)
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        if (!cancelled) setReady(true)
        return
      }

      try {
        const status = await fetchJobDeclarationStatus(jobId)
        if (cancelled) return
        setSaved(status.saved)
        setDeclared(status.declared)
      } catch {
        // ignore
      } finally {
        if (!cancelled) setReady(true)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [jobId])

  const handleSave = useCallback(
    async (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault()
      event.stopPropagation()

      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      if (saved || declared || loading) return

      setLoading(true)
      try {
        const result = await saveJobApplication(jobId)
        if (result.saved) {
          setSaved(true)
          toast.success('تم حفظ الفرصة في رادارك')
          void queryClient.invalidateQueries({ queryKey: userApplicationsQueryKey(user.id) })
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'تعذّر حفظ الفرصة')
      } finally {
        setLoading(false)
      }
    },
    [declared, jobId, loading, queryClient, router, saved],
  )

  if (!ready || declared) return null

  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? 'محفوظة في الرادار' : 'حفظ للرادار'}
      disabled={saved || loading}
      onClick={(event) => void handleSave(event)}
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card shadow-sm transition-colors',
        saved ? 'text-accent' : 'text-muted-foreground hover:text-primary',
        className,
      )}
    >
      <Bookmark className={cn('h-4 w-4', saved && 'fill-current')} aria-hidden />
    </button>
  )
}
