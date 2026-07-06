'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { MentorApplicationReviewModal } from '@/app/[locale]/(staff)/_components/mentor-application-review-modal'
import { MentorApplicationsList } from '@/app/[locale]/(staff)/_components/mentor-applications-list'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useMentorApplicationsQueue } from '@/hooks/use-mentor-applications-queue'
import type { MentorApplicationQueueItem } from '@/lib/staff/mentor-applications'
import { Link } from '@/lib/i18n/navigation'

export default function MentorApplicationsPage() {
  const t = useTranslations('staff.mentorApplications')
  const { data, isLoading, isError, error } = useMentorApplicationsQueue()
  const [selected, setSelected] = useState<MentorApplicationQueueItem | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  function openReview(application: MentorApplicationQueueItem) {
    setSelected(application)
    setModalOpen(true)
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-jid-ink">{t('title')}</h1>
        <p className="mt-2 text-sm text-jid-ink/70">{t('subtitle')}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-jid-ink/70">{t('stats.pending')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-jid-ink">
              {isLoading ? '—' : (data?.stats.pending ?? 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {isError ? (
        <p className="text-sm text-red-600">{error instanceof Error ? error.message : t('error')}</p>
      ) : null}

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-jid-ink">{t('listTitle')}</h2>
          <Link href="/staff/dashboard" className="text-sm text-jid-olive hover:underline">
            {t('backToDashboard')}
          </Link>
        </div>
        <MentorApplicationsList
          applications={data?.applications ?? []}
          loading={isLoading}
          onReview={openReview}
        />
      </section>

      <MentorApplicationReviewModal
        application={selected}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  )
}
