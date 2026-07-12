'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { track } from '@/lib/analytics/track'
import {
  fetchCascadeSuggestions,
  fetchScheduledBatchesForJob,
} from '@/lib/communication/client'
import type {
  ApplicationStatus,
  JobApplicantsResult,
  TriageApplicant,
  TriageBulkAction,
  TriageFilterTab,
} from '@/types/application'
import {
  APPLICATION_STATUS_LABELS,
  triageActionToStatus,
} from '@/types/application'
import type { CascadeSuggestion, CommunicationBatch } from '@/types/communication'
import { ApplicantTriageTable } from './applicant-triage-table'
import { BulkActionBar } from './bulk-action-bar'
import { CascadePromptDialog } from './cascade-prompt-dialog'
import { JobTriageHeaderBar } from './job-triage-header'
import { StatusFilterTabs } from './status-filter-tabs'
import { TemplateStudio } from './template-studio'
import { UndoBanner } from './undo-banner'
import { BoostToggle } from '@/app/[locale]/(company)/jobs/_components/boost-toggle'
import { BoostTeaser } from '@/app/[locale]/(company)/jobs/_components/boost-teaser'
import { BoostPerformance } from '@/app/[locale]/(company)/jobs/_components/boost-performance'
import type {
  CompanyBoostUsage,
  JobBoostPerformance,
  JobBoostState,
} from '@/lib/priority-visibility/queries'

type ApplicantTriagePageClientProps = {
  jobId: string
  companyId: string
  initialData: JobApplicantsResult
  smartCommunicationEnabled: boolean
  boostState: JobBoostState | null
  boostUsage: CompanyBoostUsage
  boostPerformance: JobBoostPerformance
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable
}

function applyStatusToApplicants(
  rows: TriageApplicant[],
  ids: string[],
  status: ApplicationStatus,
): TriageApplicant[] {
  const idSet = new Set(ids)
  return rows.map((row) => (idSet.has(row.id) ? { ...row, status } : row))
}

export function ApplicantTriagePageClient({
  jobId,
  companyId,
  initialData,
  smartCommunicationEnabled,
  boostState,
  boostUsage,
  boostPerformance,
}: ApplicantTriagePageClientProps) {
  const [filter, setFilter] = useState<TriageFilterTab>('all')
  const [job, setJob] = useState(initialData.job)
  const [applicants, setApplicants] = useState(initialData.applicants)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [focusedIndex, setFocusedIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const [mutating, setMutating] = useState(false)
  const [statusAnnouncement, setStatusAnnouncement] = useState('')
  const [cascadeOpen, setCascadeOpen] = useState(false)
  const [cascadeSuggestions, setCascadeSuggestions] = useState<CascadeSuggestion[]>([])
  const [scheduledBatches, setScheduledBatches] = useState<CommunicationBatch[]>([])
  const rowRefs = useRef<(HTMLTableRowElement | null)[]>([])
  const applicantsSnapshot = useRef(applicants)

  useEffect(() => {
    applicantsSnapshot.current = applicants
  }, [applicants])

  const refreshScheduledBatches = useCallback(async () => {
    if (!smartCommunicationEnabled) return
    try {
      const rows = await fetchScheduledBatchesForJob(jobId)
      setScheduledBatches(rows)
    } catch {
      /* non-blocking */
    }
  }, [jobId, smartCommunicationEnabled])

  useEffect(() => {
    void refreshScheduledBatches()
    if (!smartCommunicationEnabled) return
    const timer = window.setInterval(() => void refreshScheduledBatches(), 30_000)
    return () => window.clearInterval(timer)
  }, [refreshScheduledBatches, smartCommunicationEnabled])

  const reload = useCallback(async (nextFilter: TriageFilterTab = filter) => {
    setLoading(true)
    try {
      const response = await fetch(
        `/api/company/jobs/${jobId}/applicants?filter=${nextFilter}`,
        { credentials: 'include' },
      )
      const body = (await response.json().catch(() => null)) as
        | JobApplicantsResult
        | { error?: string }
        | null

      if (!response.ok) {
        toast.error((body as { error?: string } | null)?.error ?? 'تعذّر تحميل المتقدمين')
        return
      }

      const data = body as JobApplicantsResult
      setJob(data.job)
      setApplicants(data.applicants)
      setSelectedIds(new Set())
      setFocusedIndex(0)
    } finally {
      setLoading(false)
    }
  }, [filter, jobId])

  async function onFilterChange(next: TriageFilterTab) {
    setFilter(next)
    await reload(next)
  }

  const visibleIds = useMemo(() => applicants.map((row) => row.id), [applicants])

  function onToggleSelectAll(checked: boolean) {
    setSelectedIds(checked ? new Set(visibleIds) : new Set())
  }

  function onToggleSelect(id: string, checked: boolean) {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  const announceStatus = useCallback((status: ApplicationStatus, count: number) => {
    const label = APPLICATION_STATUS_LABELS[status]
    setStatusAnnouncement(
      count > 1 ? `تم تحديث ${count} طلبات إلى: ${label}` : `تم تحديث الحالة إلى: ${label}`,
    )
  }, [])

  const openCascadeIfNeeded = useCallback(async () => {
    if (!smartCommunicationEnabled) return
    try {
      const suggestions = await fetchCascadeSuggestions(jobId)
      if (suggestions.length === 0) return
      setCascadeSuggestions(suggestions)
      setCascadeOpen(true)
    } catch {
      /* cascade is optional UX — never block triage */
    }
  }, [jobId, smartCommunicationEnabled])

  const mutateStatuses = useCallback(
    async (ids: string[], action: TriageBulkAction, options?: { bulk?: boolean }) => {
      if (!ids.length) return

      const status = triageActionToStatus(action)
      const previous = applicantsSnapshot.current
      setApplicants(applyStatusToApplicants(previous, ids, status))
      setMutating(true)

      try {
        if (options?.bulk) {
          const response = await fetch('/api/company/applications/bulk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ applicationIds: ids, action }),
          })
          const body = (await response.json().catch(() => null)) as { error?: string } | null
          if (!response.ok) throw new Error(body?.error ?? 'تعذّر تنفيذ الإجراء')
        } else {
          const response = await fetch(`/api/company/applications/${ids[0]}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ status }),
          })
          const body = (await response.json().catch(() => null)) as { error?: string } | null
          if (!response.ok) throw new Error(body?.error ?? 'تعذّر تحديث الحالة')
        }

        track('job_status_changed', {
          job_id: jobId,
          application_ids: ids,
          to: status,
          bulk: Boolean(options?.bulk),
        })
        announceStatus(status, ids.length)
        toast.success('تم تحديث الحالة')
        setSelectedIds(new Set())
        await reload()
        await openCascadeIfNeeded()
      } catch (error) {
        setApplicants(previous)
        toast.error(error instanceof Error ? error.message : 'تعذّر تحديث الحالة')
      } finally {
        setMutating(false)
      }
    },
    [announceStatus, jobId, openCascadeIfNeeded, reload],
  )

  async function onBulkAction(action: TriageBulkAction) {
    if (selectedIds.size === 0) return
    await mutateStatuses(Array.from(selectedIds), action, { bulk: true })
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (isTypingTarget(event.target)) return
      if (mutating || loading) return

      if (event.key === 'j') {
        event.preventDefault()
        setFocusedIndex((index) => Math.min(index + 1, applicants.length - 1))
        return
      }
      if (event.key === 'k') {
        event.preventDefault()
        setFocusedIndex((index) => Math.max(index - 1, 0))
        return
      }

      const row = applicants[focusedIndex]
      if (!row) return

      if (event.key === 'a') {
        event.preventDefault()
        void mutateStatuses([row.id], 'accept')
      } else if (event.key === 'r') {
        event.preventDefault()
        void mutateStatuses([row.id], 'reject')
      } else if (event.key === 'i') {
        event.preventDefault()
        void mutateStatuses([row.id], 'interview')
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [applicants, focusedIndex, loading, mutateStatuses, mutating])

  useEffect(() => {
    rowRefs.current[focusedIndex]?.scrollIntoView({ block: 'nearest' })
  }, [focusedIndex])

  const rowRefAt = useCallback(
    (index: number) => (element: HTMLTableRowElement | null) => {
      rowRefs.current[index] = element
    },
    [],
  )

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8">
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {statusAnnouncement}
      </div>

      <JobTriageHeaderBar job={job} />

      <div className="flex justify-end">
        <a
          href={`/jobs/${jobId}/screening`}
          className="font-arabic text-sm font-medium text-primary underline-offset-2 hover:underline"
        >
          الفحص الذكي (SSIS)
        </a>
      </div>

      {boostUsage.hasEntitlement && boostState ? (
        <>
          <BoostToggle jobId={jobId} boost={boostState} usage={boostUsage} />
          <BoostPerformance performance={boostPerformance} />
        </>
      ) : (
        <BoostTeaser />
      )}

      {smartCommunicationEnabled ? (
        <UndoBanner batches={scheduledBatches} onCanceled={() => void refreshScheduledBatches()} />
      ) : (
        <section className="rounded-lg border border-accent/30 bg-surface/50 px-4 py-3">
          <p className="font-arabic text-sm text-primary">
            فعّل الرد الآلي — تصل ردودك لكل متقدم دون جهد.
          </p>
        </section>
      )}

      <StatusFilterTabs active={filter} onChange={onFilterChange} />

      <BulkActionBar
        totalCount={applicants.length}
        selectedIds={Array.from(selectedIds)}
        onToggleSelectAll={onToggleSelectAll}
        onBulkAction={onBulkAction}
        disabled={loading || mutating}
      />

      <p className="font-arabic text-xs text-muted-foreground">
        اختصارات: j/k للتنقل، a قبول، r رفض، i مقابلة
      </p>

      <ApplicantTriageTable
        applicants={applicants}
        selectedIds={selectedIds}
        focusedIndex={focusedIndex}
        onToggleSelect={onToggleSelect}
        rowRefAt={rowRefAt}
      />

      {smartCommunicationEnabled ? <TemplateStudio companyId={companyId} /> : null}

      <CascadePromptDialog
        open={cascadeOpen}
        onOpenChange={setCascadeOpen}
        jobId={jobId}
        companyId={companyId}
        suggestions={cascadeSuggestions}
        onBatchScheduled={() => void refreshScheduledBatches()}
        onDismiss={() => setCascadeOpen(false)}
      />
    </div>
  )
}
