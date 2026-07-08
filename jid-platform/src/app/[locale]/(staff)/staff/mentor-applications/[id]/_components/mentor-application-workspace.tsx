'use client'

import { useMutation } from '@tanstack/react-query'
import { formatDistance } from 'date-fns'
import { arSA } from 'date-fns/locale'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { MentorExpertiseSection } from '@/components/profile/mentor-expertise-section'
import { MentorIdentityHeader } from '@/components/profile/mentor-identity-header'
import {
  ChecklistPanel,
  isChecklistComplete,
} from '@/app/[locale]/(staff)/staff/claims/[id]/_components/checklist-panel'
import { reviewMentorApplicationAction } from '@/app/[locale]/(staff)/staff/mentor-applications/actions'
import { Link, useRouter } from '@/lib/i18n/navigation'
import {
  buildDefaultMentorChecklist,
  MENTOR_CHECKLIST_KEYS,
} from '@/lib/staff/claim-review-shared'
import type { MentorApplicationQueueItem } from '@/lib/staff/mentor-applications'
import { MentorDecisionForm, type MentorDecisionFormState } from './mentor-decision-form'

type MentorApplicationWorkspaceProps = {
  application: MentorApplicationQueueItem
  currentUserId: string
}

export function MentorApplicationWorkspace({
  application,
  currentUserId,
}: MentorApplicationWorkspaceProps) {
  const t = useTranslations('staff.mentorApplications.workspace')
  const router = useRouter()
  const isSelfReview = application.user_id === currentUserId

  const [checklist, setChecklist] = useState<Record<string, boolean>>(() =>
    buildDefaultMentorChecklist(application.bio_long),
  )

  const [form, setForm] = useState<MentorDecisionFormState>({
    decision: 'approve',
    reviewNotes: '',
    rejectionReason: '',
  })

  const checklistItems = useMemo(
    () =>
      MENTOR_CHECKLIST_KEYS.map((key) => ({
        key,
        label: t(`checklist.items.${key}.label`),
        hint: t(`checklist.items.${key}.hint`),
      })),
    [t],
  )

  const checklistComplete = isChecklistComplete(checklist, [...MENTOR_CHECKLIST_KEYS])
  const pendingReview = application.status === 'pending_review'

  const mutation = useMutation({
    mutationFn: async () => {
      const result = await reviewMentorApplicationAction(application.user_id, {
        decision: form.decision,
        review_notes: form.reviewNotes.trim(),
        rejection_reason:
          form.decision === 'reject' ? form.rejectionReason.trim() : undefined,
      })
      if (!result.ok) throw new Error(result.error)
    },
    onSuccess: () => {
      toast.success(
        form.decision === 'approve' ? t('decision.success.approve') : t('decision.success.reject'),
      )
      router.push('/staff/mentor-applications')
      router.refresh()
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const submittedLabel = application.application_submitted_at
    ? formatDistance(new Date(application.application_submitted_at), new Date(), {
        addSuffix: true,
        locale: arSA,
      })
    : null

  return (
    <div className="space-y-6">
      <header>
        <Link
          href="/staff/mentor-applications"
          className="text-sm text-primary hover:underline"
        >
          {t('backToQueue')}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">
          {t('title', { name: application.applicant_name ?? t('unnamed') })}
        </h1>
        {submittedLabel ? (
          <p className="mt-1 text-sm text-muted-foreground">{t('submitted', { when: submittedLabel })}</p>
        ) : null}
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-6">
          <section className="rounded-lg border border-border bg-card p-5">
            <MentorIdentityHeader
              isOwner={false}
              fullName={application.applicant_name ?? t('unnamed')}
              headline={application.headline}
              bioSnippet={application.bio_long}
              avatarUrl={application.applicant_avatar_url}
              status={application.status}
              className="border-0 p-0 shadow-none"
            />
            {application.linkedin_url ? (
              <p className="mt-4 text-sm">
                <a
                  href={application.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {t('linkedin')}: {application.linkedin_url}
                </a>
              </p>
            ) : null}
          </section>

          <MentorExpertiseSection
            sectors={application.expertise_areas}
            yearsExperience={application.years_experience}
          />

          {(application.languages.length > 0 || application.preferred_mediums.length > 0) ? (
            <section className="rounded-lg border border-border bg-card p-5">
              <dl className="grid gap-4 text-sm sm:grid-cols-2">
                {application.languages.length > 0 ? (
                  <div>
                    <dt className="text-xs text-muted-foreground">{t('languages')}</dt>
                    <dd className="mt-1 font-medium text-foreground">
                      {application.languages.join(', ')}
                    </dd>
                  </div>
                ) : null}
                {application.preferred_mediums.length > 0 ? (
                  <div>
                    <dt className="text-xs text-muted-foreground">{t('mediums')}</dt>
                    <dd className="mt-1 font-medium text-foreground">
                      {application.preferred_mediums.join(', ')}
                    </dd>
                  </div>
                ) : null}
              </dl>
            </section>
          ) : null}

          {pendingReview ? (
            <MentorDecisionForm
              value={form}
              onChange={setForm}
              checklistComplete={checklistComplete}
              isSelfReview={isSelfReview}
              submitting={mutation.isPending}
              onSubmit={() => mutation.mutate()}
            />
          ) : (
            <div className="rounded-lg border border-border bg-background/40 p-5 text-sm text-muted-foreground">
              {t('alreadyReviewed', { status: application.status })}
            </div>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="text-sm font-semibold text-foreground">{t('checklist.title')}</h3>
            <div className="mt-4">
              <ChecklistPanel
                items={checklistItems}
                value={checklist}
                onChange={setChecklist}
                disabled={!pendingReview || isSelfReview}
                translationNamespace="staff.mentorApplications.workspace.checklist"
              />
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
