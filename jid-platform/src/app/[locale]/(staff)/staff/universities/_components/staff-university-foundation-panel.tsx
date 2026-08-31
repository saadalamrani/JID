'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import {
  staffCreateUniversityIdentityMapping,
  staffReviewUniversityAffiliation,
  staffRevokeUniversityIdentityMapping,
} from '@/lib/university/staff-actions'
import type {
  UniversityAffiliationRow,
  UniversityIdentityMappingRow,
} from '@/lib/university/wave10-queries'

type StaffUniversityFoundationPanelProps = {
  mappings: UniversityIdentityMappingRow[]
  reviewQueue: UniversityAffiliationRow[]
}

export function StaffUniversityFoundationPanel({
  mappings,
  reviewQueue,
}: StaffUniversityFoundationPanelProps) {
  const t = useTranslations('staff.universityFoundation')
  const [catalogId, setCatalogId] = useState('')
  const [directoryId, setDirectoryId] = useState('')
  const [reason, setReason] = useState('')
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function run(action: () => Promise<{ ok: true } | { ok: false; error: string }>) {
    setError(null)
    startTransition(async () => {
      const result = await action()
      if (!result.ok) setError(result.error)
    })
  }

  return (
    <div className="space-y-8" data-testid="staff-university-foundation">
      <header>
        <h1 className="text-2xl font-semibold text-foreground">{t('title')}</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{t('subtitle')}</p>
      </header>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-lg font-semibold">{t('mapTitle')}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t('mapHint')}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            {t('catalogId')}
            <input
              className="mt-1 block h-11 w-full rounded-md border border-input bg-background px-3"
              value={catalogId}
              onChange={(event) => setCatalogId(event.target.value)}
            />
          </label>
          <label className="text-sm">
            {t('directoryId')}
            <input
              className="mt-1 block h-11 w-full rounded-md border border-input bg-background px-3"
              value={directoryId}
              onChange={(event) => setDirectoryId(event.target.value)}
            />
          </label>
          <label className="text-sm sm:col-span-2">
            {t('reason')}
            <input
              className="mt-1 block h-11 w-full rounded-md border border-input bg-background px-3"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
          </label>
        </div>
        <Button
          className="mt-4 min-h-11"
          disabled={pending || !catalogId || !directoryId || reason.trim().length < 8}
          onClick={() =>
            run(() =>
              staffCreateUniversityIdentityMapping({
                catalogUniversityId: catalogId.trim(),
                directoryId: directoryId.trim(),
                auditReason: reason,
              }),
            )
          }
        >
          {t('createMapping')}
        </Button>
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-lg font-semibold">{t('mappingsTitle')}</h2>
        {mappings.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">{t('mappingsEmpty')}</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {mappings.map((row) => (
              <li key={row.id} className="rounded-lg border border-border p-3 text-sm">
                <p>
                  {t('catalogId')}: {row.catalog_university_id}
                </p>
                <p>
                  {t('directoryId')}: {row.directory_id}
                </p>
                <p>
                  {t('state')}: {row.mapping_state}
                </p>
                {row.mapping_state === 'active' ? (
                  <Button
                    className="mt-2 min-h-11"
                    variant="outline"
                    disabled={pending || reason.trim().length < 8}
                    onClick={() => run(() => staffRevokeUniversityIdentityMapping(row.id, reason))}
                  >
                    {t('revoke')}
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-lg font-semibold">{t('reviewTitle')}</h2>
        {reviewQueue.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">{t('reviewEmpty')}</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {reviewQueue.map((row) => (
              <li key={row.id} className="rounded-lg border border-border p-3 text-sm">
                <p>
                  {row.catalog_university_id} · {row.state} · {row.person_status}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button
                    className="min-h-11"
                    size="sm"
                    disabled={pending || reason.trim().length < 8}
                    onClick={() =>
                      run(() =>
                        staffReviewUniversityAffiliation({
                          affiliationId: row.id,
                          decision: 'VERIFIED',
                          reason,
                        }),
                      )
                    }
                  >
                    {t('verify')}
                  </Button>
                  <Button
                    className="min-h-11"
                    size="sm"
                    variant="outline"
                    disabled={pending || reason.trim().length < 8}
                    onClick={() =>
                      run(() =>
                        staffReviewUniversityAffiliation({
                          affiliationId: row.id,
                          decision: 'NEEDS_REVIEW',
                          reason,
                        }),
                      )
                    }
                  >
                    {t('keepReview')}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
