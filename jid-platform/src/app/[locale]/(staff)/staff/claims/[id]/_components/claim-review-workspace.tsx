'use client'

import { useMutation } from '@tanstack/react-query'
import { formatDistance } from 'date-fns'
import { arSA } from 'date-fns/locale'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { reviewClaim } from '@/app/[locale]/(staff)/staff/claims/actions'
import { Link, useRouter } from '@/lib/i18n/navigation'
import {
  buildDefaultClaimChecklist,
  isClaimPendingReview,
} from '@/lib/staff/claim-review-shared'
import type { ClaimReviewWorkspaceData } from '@/lib/staff/claim-review-queries'
import { ChecklistPanel, isChecklistComplete } from './checklist-panel'
import { ClaimDecisionForm, type ClaimDecisionFormState } from './claim-decision-form'
import { RelatedHistoryPanel } from './related-history-panel'

const CLAIM_CHECKLIST_KEYS = [
  'domain_match',
  'entity_exists',
  'linkedin_verified',
  'job_reasonable',
  'no_duplicates',
] as const

type ClaimReviewWorkspaceProps = {
  data: ClaimReviewWorkspaceData
}

/** Section 7.5 — two-column review workspace with checklist sidebar. */
export function ClaimReviewWorkspace({ data }: ClaimReviewWorkspaceProps) {
  const t = useTranslations('staff.claimReview.workspace')
  const router = useRouter()
  const { claim, entity, claimant, relatedHistory, isSelfReview } = data

  const [checklist, setChecklist] = useState<Record<string, boolean>>(() =>
    buildDefaultClaimChecklist(
      claim.business_email,
      entity?.domains ?? [],
      claim.claimant_title,
      relatedHistory,
    ),
  )

  const [form, setForm] = useState<ClaimDecisionFormState>({
    decision: 'approved',
    reason: '',
    requiredDocuments: [],
  })

  const checklistItems = useMemo(
    () =>
      CLAIM_CHECKLIST_KEYS.map((key) => ({
        key,
        label: t(`checklist.items.${key}.label`),
        hint:
          key === 'domain_match'
            ? t('checklist.items.domain_match.hint', {
                domains: entity?.domains?.join(', ') || '—',
              })
            : t(`checklist.items.${key}.hint`),
      })),
    [entity?.domains, t],
  )

  const checklistComplete = isChecklistComplete(checklist, [...CLAIM_CHECKLIST_KEYS])
  const pendingReview = isClaimPendingReview(claim.status)

  const mutation = useMutation({
    mutationFn: async () => {
      const result = await reviewClaim({
        claimId: claim.id,
        decision: form.decision,
        reason: form.reason.trim(),
        requiredDocuments:
          form.decision === 'rejected' ? form.requiredDocuments : undefined,
      })
      if (!result.ok) throw new Error(result.error)
    },
    onSuccess: () => {
      toast.success(t(`decision.success.${form.decision}`))
      router.push('/staff/claims')
      router.refresh()
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const submittedLabel = formatDistance(new Date(claim.created_at), new Date(), {
    addSuffix: true,
    locale: arSA,
  })

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/staff/claims"
            className="text-sm text-primary hover:underline"
          >
            {t('backToQueue')}
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-foreground">
            {t('title', { company: claim.company_name })}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('meta', { status: claim.status, submitted: submittedLabel })}
          </p>
        </div>
        {claim.assigned_staff_id ? (
          <span className="rounded-full bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
            {t('assigned')}
          </span>
        ) : null}
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-6">
          <section className="rounded-lg border border-border bg-card p-5">
            <h2 className="text-sm font-semibold text-foreground">{t('claimDetails.title')}</h2>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">{t('claimDetails.type')}</dt>
                <dd className="font-medium text-foreground">{claim.claim_type}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t('claimDetails.businessEmail')}</dt>
                <dd className="font-medium text-foreground">{claim.business_email}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t('claimDetails.claimantName')}</dt>
                <dd className="font-medium text-foreground">{claim.claimant_name}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t('claimDetails.claimantTitle')}</dt>
                <dd className="font-medium text-foreground">{claim.claimant_title ?? '—'}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-lg border border-border bg-card p-5">
            <h2 className="text-sm font-semibold text-foreground">{t('applicant.title')}</h2>
            {claimant ? (
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">{t('applicant.name')}</dt>
                  <dd className="font-medium text-foreground">{claimant.full_name ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t('applicant.role')}</dt>
                  <dd className="font-medium text-foreground">{claimant.role}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t('applicant.emailVerified')}</dt>
                  <dd className="font-medium text-foreground">
                    {claimant.email_verified_at ? t('applicant.yes') : t('applicant.no')}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t('applicant.phoneVerified')}</dt>
                  <dd className="font-medium text-foreground">
                    {claimant.phone_verified_at ? t('applicant.yes') : t('applicant.no')}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">{t('applicant.missing')}</p>
            )}
          </section>

          <section className="rounded-lg border border-border bg-card p-5">
            <h2 className="text-sm font-semibold text-foreground">{t('entity.title')}</h2>
            {entity ? (
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">{t('entity.name')}</dt>
                  <dd className="font-medium text-foreground">{entity.name}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t('entity.state')}</dt>
                  <dd className="font-medium text-foreground">{entity.entity_state}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t('entity.domains')}</dt>
                  <dd className="font-medium text-foreground">
                    {entity.domains.length > 0 ? entity.domains.join(', ') : '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t('entity.verified')}</dt>
                  <dd className="font-medium text-foreground">
                    {entity.is_verified ? t('applicant.yes') : t('applicant.no')}
                  </dd>
                </div>
                {entity.linkedin_url ? (
                  <div className="sm:col-span-2">
                    <dt className="text-muted-foreground">{t('entity.linkedin')}</dt>
                    <dd>
                      <a
                        href={entity.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        {entity.linkedin_url}
                      </a>
                    </dd>
                  </div>
                ) : null}
              </dl>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">{t('entity.missing')}</p>
            )}
          </section>

          {pendingReview ? (
            <ClaimDecisionForm
              value={form}
              onChange={setForm}
              checklistComplete={checklistComplete}
              isSelfReview={isSelfReview}
              submitting={mutation.isPending}
              onSubmit={() => mutation.mutate()}
            />
          ) : (
            <div className="rounded-lg border border-border bg-background/40 p-5 text-sm text-muted-foreground">
              {t('alreadyReviewed', { status: claim.status })}
              {claim.review_notes ? (
                <p className="mt-2 whitespace-pre-wrap">{claim.review_notes}</p>
              ) : null}
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
              />
            </div>
          </div>
          <RelatedHistoryPanel items={relatedHistory} />
        </aside>
      </div>
    </div>
  )
}
