'use client'

import { useMutation } from '@tanstack/react-query'
import { formatDistance } from 'date-fns'
import { arSA } from 'date-fns/locale'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { reviewVerification } from '@/app/[locale]/(staff)/staff/verification/actions'
import { Link, useRouter } from '@/lib/i18n/navigation'
import {
  buildDefaultVerificationChecklist,
  isVerificationPendingReview,
  MENTOR_CHECKLIST_KEYS,
  buildDefaultMentorChecklist,
} from '@/lib/staff/verification-review-shared'
import type { VerificationReviewWorkspaceData } from '@/lib/staff/verification-review-queries'
import { ChecklistPanel, isChecklistComplete } from '@/app/[locale]/(staff)/_components/checklist-panel'
import { RelatedHistoryPanel } from './related-history-panel'
import {
  VerificationDecisionForm,
  type VerificationDecisionFormState,
} from './verification-decision-form'

const BUSINESS_CHECKLIST_KEYS = [
  'domain_match',
  'entity_exists',
  'linkedin_verified',
  'job_reasonable',
  'no_duplicates',
] as const

const UNIVERSITY_CHECKLIST_KEYS = [
  'entity_exists',
  'linkedin_verified',
  'job_reasonable',
  'no_duplicates',
] as const

type VerificationReviewWorkspaceProps = {
  data: VerificationReviewWorkspaceData
}

/** P-108 — verification review workspace (no direct companies writes). */
export function VerificationReviewWorkspace({ data }: VerificationReviewWorkspaceProps) {
  const t = useTranslations('staff.verificationReview.workspace')
  const router = useRouter()
  const { verification, directory, applicant, relatedHistory, isSelfReview } = data

  const isMentorType = verification.verification_type === ('mentor' as typeof verification.verification_type)
  const checklistKeys = useMemo(
    () =>
      isMentorType
        ? [...MENTOR_CHECKLIST_KEYS]
        : verification.verification_type === 'university'
          ? [...UNIVERSITY_CHECKLIST_KEYS]
          : [...BUSINESS_CHECKLIST_KEYS],
    [isMentorType, verification.verification_type],
  )

  const [checklist, setChecklist] = useState<Record<string, boolean>>(() =>
    isMentorType
      ? buildDefaultMentorChecklist(null)
      : buildDefaultVerificationChecklist(
          verification.business_email,
          directory?.domains ?? [],
          verification.claimant_title,
          relatedHistory,
        ),
  )

  const [form, setForm] = useState<VerificationDecisionFormState>({
    decision: 'approved',
    reason: '',
    requiredDocuments: [],
  })

  const checklistItems = useMemo(
    () =>
      checklistKeys.map((key) => ({
        key,
        label: t(`checklist.items.${key}.label`),
        hint:
          key === 'domain_match'
            ? t('checklist.items.domain_match.hint', {
                domains: directory?.domains?.join(', ') || '—',
              })
            : t(`checklist.items.${key}.hint`),
      })),
    [checklistKeys, directory?.domains, t],
  )

  const checklistComplete = isChecklistComplete(checklist, checklistKeys)
  const pendingReview = isVerificationPendingReview(verification.status)

  const mutation = useMutation({
    mutationFn: async () => {
      const result = await reviewVerification({
        verificationId: verification.id,
        decision: form.decision,
        reason: form.reason.trim(),
        requiredDocuments:
          form.decision === 'rejected' ? form.requiredDocuments : undefined,
      })
      if (!result.ok) throw new Error(result.error)
    },
    onSuccess: () => {
      toast.success(t(`decision.success.${form.decision}`))
      router.push('/staff/verification')
      router.refresh()
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const submittedLabel = formatDistance(new Date(verification.created_at), new Date(), {
    addSuffix: true,
    locale: arSA,
  })

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/staff/verification"
            className="text-sm text-primary hover:underline"
          >
            {t('backToQueue')}
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-foreground">
            {t('title', { company: verification.company_name })}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('meta', { status: verification.status, submitted: submittedLabel })}
          </p>
        </div>
        {verification.assigned_staff_id ? (
          <span className="rounded-full bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
            {t('assigned')}
          </span>
        ) : null}
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-6">
          <section className="rounded-lg border border-border bg-card p-5">
            <h2 className="text-sm font-semibold text-foreground">{t('details.title')}</h2>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">{t('details.type')}</dt>
                <dd className="font-medium text-foreground">{verification.verification_type}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t('details.businessEmail')}</dt>
                <dd className="font-medium text-foreground">{verification.business_email}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t('details.claimantName')}</dt>
                <dd className="font-medium text-foreground">{verification.claimant_name}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t('details.claimantTitle')}</dt>
                <dd className="font-medium text-foreground">{verification.claimant_title ?? '—'}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-lg border border-border bg-card p-5">
            <h2 className="text-sm font-semibold text-foreground">{t('applicant.title')}</h2>
            {applicant ? (
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">{t('applicant.name')}</dt>
                  <dd className="font-medium text-foreground">{applicant.full_name ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t('applicant.role')}</dt>
                  <dd className="font-medium text-foreground">{applicant.role}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t('applicant.emailVerified')}</dt>
                  <dd className="font-medium text-foreground">
                    {applicant.email_verified_at ? t('applicant.yes') : t('applicant.no')}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t('applicant.phoneVerified')}</dt>
                  <dd className="font-medium text-foreground">
                    {applicant.phone_verified_at ? t('applicant.yes') : t('applicant.no')}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">{t('applicant.missing')}</p>
            )}
          </section>

          <section className="rounded-lg border border-border bg-card p-5">
            <h2 className="text-sm font-semibold text-foreground">{t('directory.title')}</h2>
            {directory ? (
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">{t('directory.name')}</dt>
                  <dd className="font-medium text-foreground">{directory.name}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t('directory.state')}</dt>
                  <dd className="font-medium text-foreground">{directory.entity_state}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t('directory.domains')}</dt>
                  <dd className="font-medium text-foreground">
                    {directory.domains.length > 0 ? directory.domains.join(', ') : '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t('directory.verified')}</dt>
                  <dd className="font-medium text-foreground">
                    {directory.is_verified ? t('applicant.yes') : t('applicant.no')}
                  </dd>
                </div>
                {directory.linkedin_url ? (
                  <div className="sm:col-span-2">
                    <dt className="text-muted-foreground">{t('directory.linkedin')}</dt>
                    <dd>
                      <a
                        href={directory.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        {directory.linkedin_url}
                      </a>
                    </dd>
                  </div>
                ) : null}
              </dl>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">{t('directory.missing')}</p>
            )}
          </section>

          {pendingReview ? (
            <VerificationDecisionForm
              value={form}
              onChange={setForm}
              checklistComplete={checklistComplete}
              isSelfReview={isSelfReview}
              submitting={mutation.isPending}
              onSubmit={() => mutation.mutate()}
            />
          ) : (
            <div className="rounded-lg border border-border bg-background/40 p-5 text-sm text-muted-foreground">
              {t('alreadyReviewed', { status: verification.status })}
              {verification.review_notes ? (
                <p className="mt-2 whitespace-pre-wrap">{verification.review_notes}</p>
              ) : null}
              {verification.status === 'approved' ? (
                <p className="mt-3 rounded-md border border-sem-warning/30 bg-sem-warning/10 px-3 py-2 text-sm text-sem-warning">
                  {t('approvedNoProfileNotice')}
                </p>
              ) : null}
            </div>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="text-sm font-semibold text-foreground">{t('checklist.title')}</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {isMentorType
                ? t('checklist.mentorHint')
                : verification.verification_type === 'university'
                  ? t('checklist.universityHint')
                  : t('checklist.businessHint')}
            </p>
            <div className="mt-4">
              <ChecklistPanel
                items={checklistItems}
                value={checklist}
                onChange={setChecklist}
                disabled={!pendingReview || isSelfReview}
                translationNamespace="staff.verificationReview.workspace.checklist"
              />
            </div>
          </div>
          <RelatedHistoryPanel items={relatedHistory} />
        </aside>
      </div>
    </div>
  )
}
