'use client'

import { useState } from 'react'
import { Bell } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/empty-state'
import { Link } from '@/lib/i18n/navigation'
import { useMentorFilters } from './mentor-filter-context'

type EmptyMentorStateProps = {
  variant: 'cold_start' | 'no_matches'
}

/** Section 4.6 — Cold Start Mitigation when discovery has no mentors to show. */
export function EmptyMentorState({ variant }: EmptyMentorStateProps) {
  const t = useTranslations('mentorship.discovery.empty')
  const { desiredFilters, clearAll, hasActiveFilters } = useMentorFilters()
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  async function requestNotification() {
    setSubmitting(true)
    try {
      const response = await fetch('/api/mentors/notification-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          mentor_id: null,
          desired_filters: {
            sectors: desiredFilters.sectors,
            expertise_areas: desiredFilters.expertise_areas,
            specializations: desiredFilters.specializations,
            languages: desiredFilters.languages,
            nationalities: desiredFilters.nationalities,
            accepting_only: desiredFilters.accepting_only,
          },
        }),
      })

      const body = (await response.json().catch(() => null)) as { error?: string } | null

      if (response.status === 401) {
        toast.error(t('loginRequired'))
        return
      }

      if (!response.ok) {
        throw new Error(body?.error ?? t('notifyError'))
      }

      setSubmitted(true)
      toast.success(t('notifySuccess'))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('notifyError'))
    } finally {
      setSubmitting(false)
    }
  }

  const isColdStart = variant === 'cold_start'

  return (
    <EmptyState
      icon={Bell}
      title={isColdStart ? t('coldStartTitle') : t('noMatchesTitle')}
      description={isColdStart ? t('coldStartBody') : t('noMatchesBody')}
    >
      <div className="flex flex-col gap-3 sm:flex-row">
        {isColdStart ? (
          <Button
            type="button"
            disabled={submitting || submitted}
            onClick={() => void requestNotification()}
            className="font-arabic"
          >
            {submitting ? t('notifySubmitting') : submitted ? t('notifyDone') : t('notifyCta')}
          </Button>
        ) : null}

        {!isColdStart && hasActiveFilters ? (
          <Button type="button" variant="outline" onClick={clearAll} className="font-arabic">
            {t('resetFilters')}
          </Button>
        ) : null}

        {isColdStart ? (
          <Button type="button" variant="outline" asChild className="font-arabic">
            <Link href="/login">{t('loginCta')}</Link>
          </Button>
        ) : null}
      </div>

      {isColdStart ? (
        <p className="max-w-sm font-arabic text-xs text-muted-foreground">{t('notifyHint')}</p>
      ) : null}
    </EmptyState>
  )
}
