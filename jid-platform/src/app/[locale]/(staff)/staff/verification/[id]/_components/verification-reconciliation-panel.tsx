'use client'

import { useMutation } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  createVerificationDirectory,
  markNeedsReconciliation,
  reconcileVerificationDirectory,
} from '@/app/[locale]/(staff)/staff/verification/actions'
import { Button } from '@/components/ui/button'
import { Combobox, useDebouncedValue } from '@/components/ui/combobox'
import { searchCompanies, type CompanyRecord } from '@/lib/entity/companies'
import type { EntitySignupType } from '@/lib/entity/constants'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from '@/lib/i18n/navigation'
import type { VerificationDetail } from '@/lib/staff/verification-review-queries'

type VerificationReconciliationPanelProps = {
  verification: VerificationDetail
  disabled?: boolean
}

export function VerificationReconciliationPanel({
  verification,
  disabled,
}: VerificationReconciliationPanelProps) {
  const t = useTranslations('staff.verificationReview.workspace.reconciliation')
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(verification.directory_id)
  const [matches, setMatches] = useState<CompanyRecord[]>([])
  const debouncedSearch = useDebouncedValue(search)
  const signupType: EntitySignupType =
    verification.verification_type === 'university' ? 'university' : 'company'

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const supabase = createClient()
        const results = await searchCompanies(supabase, debouncedSearch, signupType)
        if (!cancelled) setMatches(results)
      } catch {
        if (!cancelled) setMatches([])
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [debouncedSearch, signupType])

  const options = useMemo(
    () =>
      matches.map((company) => ({
        value: company.id,
        label: company.name_ar ?? company.name,
        description: company.domains.join(', '),
      })),
    [matches],
  )

  const unresolved = !verification.directory_id
  const canApprove =
    Boolean(verification.directory_id) &&
    verification.reconciliation_state !== 'existing_workspace_review_required' &&
    verification.reconciliation_state !== 'needs_reconciliation' &&
    verification.reconciliation_state !== 'unresolved'

  const linkMutation = useMutation({
    mutationFn: async () => {
      if (!selectedId) throw new Error(t('selectRequired'))
      const result = await reconcileVerificationDirectory({
        verificationId: verification.id,
        directoryId: selectedId,
      })
      if (!result.ok) throw new Error(result.error)
    },
    onSuccess: () => {
      toast.success(t('linked'))
      router.refresh()
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const createMutation = useMutation({
    mutationFn: async () => {
      const result = await createVerificationDirectory({ verificationId: verification.id })
      if (!result.ok) throw new Error(result.error)
    },
    onSuccess: () => {
      toast.success(t('created'))
      router.refresh()
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const needsMutation = useMutation({
    mutationFn: async () => {
      const result = await markNeedsReconciliation({ verificationId: verification.id })
      if (!result.ok) throw new Error(result.error)
    },
    onSuccess: () => {
      toast.success(t('marked'))
      router.refresh()
    },
    onError: (error: Error) => toast.error(error.message),
  })

  return (
    <section className="rounded-lg border border-border bg-card p-5" data-testid="staff-reconciliation-panel">
      <h2 className="text-sm font-semibold text-foreground">{t('title')}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>

      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">{t('submittedName')}</dt>
          <dd className="font-medium text-foreground">{verification.company_name}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{t('submittedNameAr')}</dt>
          <dd className="font-medium text-foreground">{verification.submitted_name_ar ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{t('submittedWebsite')}</dt>
          <dd className="font-medium text-foreground" dir="ltr">
            {verification.submitted_website ?? '—'}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{t('submittedDomain')}</dt>
          <dd className="font-medium text-foreground" dir="ltr">
            {verification.submitted_domain ?? '—'}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-muted-foreground">{t('state')}</dt>
          <dd className="font-medium text-foreground">{verification.reconciliation_state}</dd>
        </div>
      </dl>

      {!canApprove ? (
        <p className="mt-4 rounded-md border border-sem-warning/30 bg-sem-warning/10 p-3 text-sm text-sem-warning">
          {unresolved ? t('mustLinkBeforeApprove') : t('cannotApproveYet')}
        </p>
      ) : null}

      <div className="mt-4 space-y-3">
        <Combobox
          options={options}
          value={selectedId}
          onValueChange={setSelectedId}
          placeholder={t('searchPlaceholder')}
          searchPlaceholder={t('searchInput')}
          emptyText={t('searchEmpty')}
          onSearchChange={setSearch}
        />
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            disabled={disabled || !selectedId || linkMutation.isPending}
            onClick={() => linkMutation.mutate()}
          >
            {t('linkExisting')}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            disabled={disabled || Boolean(verification.directory_id) || createMutation.isPending}
            onClick={() => createMutation.mutate()}
          >
            {t('createFromSubmission')}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="flex-1"
            disabled={disabled || needsMutation.isPending}
            onClick={() => needsMutation.mutate()}
          >
            {t('markNeeds')}
          </Button>
        </div>
      </div>
    </section>
  )
}

export function canApproveVerification(verification: VerificationDetail): boolean {
  return (
    Boolean(verification.directory_id) &&
    verification.reconciliation_state !== 'unresolved' &&
    verification.reconciliation_state !== 'needs_reconciliation' &&
    verification.reconciliation_state !== 'existing_workspace_review_required' &&
    verification.reconciliation_state !== 'request_correction'
  )
}
