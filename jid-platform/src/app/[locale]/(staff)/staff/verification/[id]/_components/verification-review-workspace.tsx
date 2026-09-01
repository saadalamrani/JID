'use client'

import { useMutation } from '@tanstack/react-query'
import { formatDistance } from 'date-fns'
import { arSA, enUS } from 'date-fns/locale'
import { useLocale, useTranslations } from 'next-intl'
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
import {
  canApproveVerification,
  VerificationReconciliationPanel,
} from './verification-reconciliation-panel'

const KNOWN_DIRECTORY_STATES = [
  'unclaimed',
  'pending',
  'pending_review',
  'approved',
  'suspended',
] as const

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
  const { verification, directory, applicant, relatedHistory, currentUserId, viewerRole, isSelfReview } =
    data

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
  const [overrideAssignment, setOverrideAssignment] = useState(false)

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
  const assignedToOther =
    verification.assigned_staff_id != null &&
    verification.assigned_staff_id !== currentUserId
  // Self-review takes precedence over view-only / override states.
  const showViewOnlyBanner = pendingReview && !isSelfReview && assignedToOther && viewerRole !== 'super_admin'
  const showSuperAdminOverride =
    pendingReview && !isSelfReview && assignedToOther && viewerRole === 'super_admin'

  const mutation = useMutation({
    mutationFn: async () => {
      if (form.decision === 'approved' && !canApproveVerification(verification)) {
        throw new Error(t('reconciliation.mustLinkBeforeApprove'))
      }
      const result = await reviewVerification({
        verificationId: verification.id,
        decision: form.decision,
        reason: form.reason.trim(),
        requiredDocuments:
          form.decision === 'rejected' ? form.requiredDocuments : undefined,
        overrideAssignment: showSuperAdminOverride ? overrideAssignment : undefined,
      })
      if (!result.ok) throw new Error(result.error)
    },
    onSuccess: () => {
      toast.success(t(`decision.success.${form.decision}`))
      router.push('/staff/verification')
      router.refresh()
    },
    onError: (error: Error) => {
      if (error.message.includes('not_assigned_reviewer')) {
        toast.error(t('decision.notAssignedReviewer'))
        return
      }
      toast.error(error.message)
    },
  })

  const locale = useLocale()
  const dateLocale = locale.startsWith('ar') ? arSA : enUS
  const submittedLabel = formatDistance(new Date(verification.created_at), new Date(), {
    addSuffix: true,
    locale: dateLocale,
  })

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/staff/verification"
            className="text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jid-gold/60"
          >
            {t('backToQueue')}
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-jid-olive">
            {t('title', { company: verification.company_name })}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('meta', { status: verification.status, submitted: submittedLabel })}
          </p>
        </div>
        {verification.assigned_staff_id ? (
          <span className="rounded-md border border-border bg-jid-beige px-3 py-1 text-xs font-medium text-jid-olive">
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

          <VerificationReconciliationPanel
            verification={verification}
            disabled={!pendingReview || isSelfReview || showViewOnlyBanner}
          />

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
                  <dd className="font-medium text-foreground">
                    {(KNOWN_DIRECTORY_STATES as readonly string[]).includes(directory.entity_state)
                      ? t(`directory.states.${directory.entity_state}`)
                      : directory.entity_state}
                  </dd>
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
            showViewOnlyBanner ? (
              <div
                data-testid="assigned-to-other-banner"
                className="rounded-lg border border-sem-warning/30 bg-sem-warning/10 p-5 text-sm text-sem-warning"
              >
                <p className="font-semibold text-foreground">{t('assignedToOther.title')}</p>
                <p className="mt-2 text-muted-foreground">{t('assignedToOther.body')}</p>
              </div>
            ) : showSuperAdminOverride ? (
              <VerificationDecisionForm
                value={form}
                onChange={setForm}
                checklistComplete={checklistComplete}
                isSelfReview={isSelfReview}
                submitting={mutation.isPending}
                onSubmit={() => mutation.mutate()}
                allowAssignmentOverride
                overrideAssignment={overrideAssignment}
                onOverrideAssignmentChange={setOverrideAssignment}
              />
            ) : (
              <VerificationDecisionForm
                value={form}
                onChange={setForm}
                checklistComplete={checklistComplete}
                isSelfReview={isSelfReview}
                submitting={mutation.isPending}
                onSubmit={() => mutation.mutate()}
              />
            )
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
                disabled={!pendingReview || isSelfReview || showViewOnlyBanner}
                translationNamespace="staff.verificationReview.workspace.checklist"
              />
            </div>
          </div>
          <RelatedHistoryPanel items={relatedHistory} />
          <section
            data-testid="verification-deferred-capabilities"
            className="rounded-lg border border-dashed border-jid-line/50 bg-jid-beige/60 p-4"
            aria-labelledby="verification-deferred-heading"
          >
            <h3
              id="verification-deferred-heading"
              className="text-sm font-semibold text-jid-olive"
            >
              {t('deferred.title')}
            </h3>
            <ul className="mt-2 list-disc space-y-1 ps-5 text-xs text-muted-foreground">
              <li>{t('deferred.evidenceViewer')}</li>
              <li>{t('deferred.requestMoreInfo')}</li>
              <li>{t('deferred.persistedChecklist')}</li>
            </ul>
          </section>
        </aside>
      </div>
    </div>
  )
}
